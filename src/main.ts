import {BigDecimal} from '@subsquid/big-decimal'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import assert from 'assert'
import {In} from 'typeorm'
import decodeEvents from './decodeEvents'
import importDump from './importDump'
import {
  GlobalState,
  Session,
  Worker,
  WorkerSharesSnapshot,
  WorkerState,
} from './model'
import {processor} from './processor'
import {phalaComputation, phalaRegistry} from './types/events'
import {assertGet, toMap} from './utils/common'
import {updateWorkerShares} from './worker'

processor.run(new TypeormDatabase(), async (ctx) => {
  if ((await ctx.store.get(GlobalState, '0')) == null) {
    ctx.log.info('Importing dump...')
    await importDump(ctx)
    ctx.log.info('Dump imported')
  }
  const events = decodeEvents(ctx)

  const workerIdSet = new Set<string>()
  const sessionIdSet = new Set<string>()

  for (const {name, args} of events) {
    if (
      name === phalaComputation.sessionBound.name ||
      name === phalaComputation.sessionUnbound.name ||
      name === phalaRegistry.initialScoreSet.name ||
      name === phalaRegistry.workerUpdated.name
    ) {
      workerIdSet.add(args.workerId)
    }

    if (
      name === phalaComputation.sessionBound.name ||
      name === phalaComputation.sessionUnbound.name ||
      name === phalaComputation.sessionSettled.name ||
      name === phalaComputation.workerStarted.name ||
      name === phalaComputation.workerStopped.name ||
      name === phalaComputation.workerReclaimed.name ||
      name === phalaComputation.workerEnterUnresponsive.name ||
      name === phalaComputation.workerExitUnresponsive.name ||
      name === phalaComputation.benchmarkUpdated.name
    ) {
      sessionIdSet.add(args.sessionId)
    }
  }

  const globalState = await ctx.store.findOneByOrFail(GlobalState, {id: '0'})
  const sessionMap = await ctx.store
    .find(Session, {
      where: [
        {id: In([...sessionIdSet])},
        {worker: {id: In([...workerIdSet])}},
      ],
      relations: {worker: true},
    })
    .then(toMap)
  const workerMap = await ctx.store
    .find(Worker, {
      where: [
        {id: In([...workerIdSet])},
        {session: {id: In([...sessionIdSet])}},
      ],
      relations: {session: true},
    })
    .then(toMap)

  for (const {name, args} of events) {
    switch (name) {
      case phalaComputation.sessionBound.name: {
        // Memo: SessionBound happens before PoolWorkerAdded
        const {sessionId, workerId} = args
        let session = sessionMap.get(sessionId)
        const worker = assertGet(workerMap, workerId)
        if (session == null) {
          session = new Session({
            id: sessionId,
            isBound: true,
            state: WorkerState.Ready,
            v: BigDecimal(0),
            ve: BigDecimal(0),
            pInit: 0,
            pInstant: 0,
            totalReward: BigDecimal(0),
            stake: BigDecimal(0),
          })
          sessionMap.set(sessionId, session)
        }
        session.isBound = true
        session.worker = worker
        worker.session = session
        globalState.workerCount++
        break
      }
      case phalaComputation.sessionUnbound.name: {
        const {sessionId, workerId} = args
        const session = assertGet(sessionMap, sessionId)
        const worker = assertGet(workerMap, workerId)
        assert(session.worker)
        assert(session.worker.id === workerId)
        worker.session = null
        worker.shares = null
        session.isBound = false
        globalState.workerCount--
        break
      }
      case phalaComputation.sessionSettled.name: {
        const {sessionId, v, payout} = args
        const session = assertGet(sessionMap, sessionId)
        assert(session.worker)
        session.totalReward = session.totalReward.plus(payout)
        session.v = v
        const worker = assertGet(workerMap, session.worker.id)
        assert(worker.shares)
        const prevShares = worker.shares
        updateWorkerShares(worker, session)
        if (session.state === WorkerState.WorkerIdle) {
          globalState.idleWorkerShares = globalState.idleWorkerShares
            .minus(prevShares)
            .plus(worker.shares)
        }
        break
      }
      case phalaComputation.workerStarted.name: {
        const {sessionId, initP, initV} = args
        const session = assertGet(sessionMap, sessionId)
        assert(session.worker)
        session.pInit = initP
        session.ve = initV
        session.v = initV
        session.state = WorkerState.WorkerIdle
        const worker = assertGet(workerMap, session.worker.id)
        updateWorkerShares(worker, session)
        globalState.idleWorkerShares = globalState.idleWorkerShares.plus(
          worker.shares
        )
        globalState.idleWorkerCount++
        globalState.idleWorkerPInit += session.pInit
        globalState.idleWorkerPInstant += session.pInstant
        break
      }
      case phalaComputation.workerStopped.name: {
        const {sessionId} = args
        const session = assertGet(sessionMap, sessionId)
        assert(session.worker)
        const worker = assertGet(workerMap, session.worker.id)
        assert(worker.shares)
        if (session.state === WorkerState.WorkerIdle) {
          globalState.idleWorkerShares = globalState.idleWorkerShares.minus(
            worker.shares
          )
          globalState.idleWorkerCount--
          globalState.idleWorkerPInit -= session.pInit
          globalState.idleWorkerPInstant -= session.pInstant
        }
        session.state = WorkerState.WorkerCoolingDown
        break
      }
      case phalaComputation.workerEnterUnresponsive.name: {
        const {sessionId} = args
        const session = assertGet(sessionMap, sessionId)
        assert(session.worker)
        if (session.state === WorkerState.WorkerIdle) {
          session.state = WorkerState.WorkerUnresponsive
          const worker = assertGet(workerMap, session.worker.id)
          assert(worker.shares)
          globalState.idleWorkerShares = globalState.idleWorkerShares.minus(
            worker.shares
          )
          globalState.idleWorkerCount--
          globalState.idleWorkerPInit -= session.pInit
          globalState.idleWorkerPInstant -= session.pInstant
        }
        break
      }
      case phalaComputation.workerExitUnresponsive.name: {
        const {sessionId} = args
        const session = assertGet(sessionMap, sessionId)
        assert(session.worker)
        if (session.state === WorkerState.WorkerUnresponsive) {
          const worker = assertGet(workerMap, session.worker.id)
          assert(worker.shares)
          globalState.idleWorkerShares = globalState.idleWorkerShares.plus(
            worker.shares
          )
          globalState.idleWorkerCount++
          globalState.idleWorkerPInit += session.pInit
          globalState.idleWorkerPInstant += session.pInstant
        }
        session.state = WorkerState.WorkerIdle
        break
      }
      case phalaComputation.benchmarkUpdated.name: {
        const {sessionId, pInstant} = args
        const session = assertGet(sessionMap, sessionId)
        const prevPInstant = session.pInstant
        session.pInstant = pInstant
        assert(session.worker)
        const worker = assertGet(workerMap, session.worker.id)
        const prevShares = worker.shares ?? BigDecimal(0)
        updateWorkerShares(worker, session)
        if (session.state === WorkerState.WorkerIdle) {
          globalState.idleWorkerShares = globalState.idleWorkerShares
            .minus(prevShares)
            .plus(worker.shares)
          globalState.idleWorkerPInstant =
            globalState.idleWorkerPInstant - prevPInstant + pInstant
        }
        break
      }
      case phalaRegistry.workerAdded.name: {
        const {workerId, confidenceLevel} = args
        const worker = new Worker({id: workerId, confidenceLevel})
        workerMap.set(workerId, worker)
        await ctx.store.insert(worker)
        break
      }
      case phalaRegistry.workerUpdated.name: {
        const {workerId, confidenceLevel} = args
        const worker = assertGet(workerMap, workerId)
        worker.confidenceLevel = confidenceLevel
        break
      }
      case phalaRegistry.initialScoreSet.name: {
        const {workerId, initialScore} = args
        const worker = assertGet(workerMap, workerId)
        worker.initialScore = initialScore
        break
      }
    }
  }

  await ctx.store.save(globalState)
  await ctx.store.save([...sessionMap.values()])
  await ctx.store.save([...workerMap.values()])

  const lastBlock = ctx.blocks.at(-1)
  assert(lastBlock?.header.timestamp)
  const updatedTime = new Date(lastBlock.header.timestamp)
  const minutes = updatedTime.getUTCMinutes()
  updatedTime.setUTCMinutes(minutes - (minutes % 10), 0, 0)
  const snapshot = new WorkerSharesSnapshot({
    id: updatedTime.toISOString(),
    updatedTime,
    shares: globalState.idleWorkerShares,
  })
  await ctx.store.save(snapshot)
})
