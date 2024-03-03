import assert from 'node:assert'
import {BigDecimal} from '@subsquid/big-decimal'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import {isAfter} from 'date-fns'
import {In} from 'typeorm'
import decodeEvents from './decodeEvents'
import loadInitialState from './loadInitialState'
import {
  GlobalState,
  Session,
  Worker,
  WorkerSharesSnapshot,
  WorkerState,
} from './model'
import {processor} from './processor'
import {phalaComputation, phalaRegistry} from './types/events'
import {assertGet, save, toMap} from './utils'
import {updateSessionShares} from './worker'

processor.run(new TypeormDatabase(), async (ctx) => {
  ctx.log.info(
    `Process from ${ctx.blocks[0].header.height} to ${
      ctx.blocks[ctx.blocks.length - 1].header.height
    }`,
  )
  if ((await ctx.store.get(GlobalState, '0')) == null) {
    ctx.log.info('Loading initial state')
    await loadInitialState(ctx)
    ctx.log.info('Initial state loaded')
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
  for (const session of sessionMap.values()) {
    if (session.worker != null) {
      workerIdSet.add(session.worker.id)
    }
  }
  const workerMap = await ctx.store
    .find(Worker, {
      where: [{id: In([...workerIdSet])}],
    })
    .then(toMap)
  const snapshots: WorkerSharesSnapshot[] = []
  let latestSnapshotUpdatedTime = await ctx.store
    .find(WorkerSharesSnapshot, {order: {updatedTime: 'DESC'}, take: 1})
    .then((snapshot) => snapshot[0]?.updatedTime)

  for (let i = 0; i < events.length; i++) {
    const {name, args, block} = events[i]
    switch (name) {
      case phalaComputation.sessionBound.name: {
        // Memo: SessionBound happens before PoolWorkerAdded
        const {sessionId, workerId} = args
        let session = sessionMap.get(sessionId)
        const worker = assertGet(workerMap, workerId)
        if (session == null) {
          session = new Session({
            id: sessionId,
            state: WorkerState.Ready,
            v: BigDecimal(0),
            ve: BigDecimal(0),
            pInit: 0,
            pInstant: 0,
            totalReward: BigDecimal(0),
            stake: BigDecimal(0),
            shares: BigDecimal(0),
          })
          sessionMap.set(sessionId, session)
        }
        session.worker = worker
        globalState.workerCount++
        break
      }
      case phalaComputation.sessionUnbound.name: {
        const {sessionId, workerId} = args
        const session = assertGet(sessionMap, sessionId)
        assert(session.worker)
        assert(session.worker.id === workerId)
        session.worker = null
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
        const prevShares = session.shares
        updateSessionShares(session, worker)
        if (session.state === WorkerState.WorkerIdle) {
          globalState.idleWorkerShares = globalState.idleWorkerShares
            .minus(prevShares)
            .plus(session.shares)
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
        updateSessionShares(session, worker)
        globalState.idleWorkerShares = globalState.idleWorkerShares.plus(
          session.shares,
        )
        globalState.idleWorkerCount++
        globalState.idleWorkerPInit += session.pInit
        globalState.idleWorkerPInstant += session.pInstant
        break
      }
      case phalaComputation.workerStopped.name: {
        const {sessionId} = args
        const session = assertGet(sessionMap, sessionId)
        if (session.state === WorkerState.WorkerIdle) {
          globalState.idleWorkerShares = globalState.idleWorkerShares.minus(
            session.shares,
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
        if (session.state === WorkerState.WorkerIdle) {
          session.state = WorkerState.WorkerUnresponsive
          globalState.idleWorkerShares = globalState.idleWorkerShares.minus(
            session.shares,
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
        if (session.state === WorkerState.WorkerUnresponsive) {
          globalState.idleWorkerShares = globalState.idleWorkerShares.plus(
            session.shares,
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
        assert(session.worker)
        const worker = assertGet(workerMap, session.worker.id)
        const prevPInstant = session.pInstant
        session.pInstant = pInstant
        const prevShares = session.shares
        updateSessionShares(session, worker)
        if (session.state === WorkerState.WorkerIdle) {
          globalState.idleWorkerShares = globalState.idleWorkerShares
            .minus(prevShares)
            .plus(session.shares)
          globalState.idleWorkerPInstant =
            globalState.idleWorkerPInstant - prevPInstant + session.pInstant
        }
        break
      }
      case phalaRegistry.workerAdded.name: {
        const {workerId, confidenceLevel} = args
        const worker = new Worker({id: workerId, confidenceLevel})
        workerMap.set(workerId, worker)
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

    const nextEvent = events[i + 1]
    const isLastEventInHandler = nextEvent == null
    const isLastEventInBlock =
      isLastEventInHandler || block.height !== nextEvent.block.height

    if (isLastEventInBlock) {
      assert(block.timestamp)
      const updatedTime = new Date(block.timestamp)
      const minutes = updatedTime.getUTCMinutes()
      updatedTime.setUTCMinutes(minutes - (minutes % 10), 0, 0)
      if (
        latestSnapshotUpdatedTime == null ||
        isAfter(updatedTime, latestSnapshotUpdatedTime)
      ) {
        const snapshot = new WorkerSharesSnapshot({
          id: updatedTime.toISOString(),
          updatedTime,
          shares: globalState.idleWorkerShares,
        })
        snapshots.push(snapshot)
        latestSnapshotUpdatedTime = updatedTime
      }
    }
  }

  await save(ctx, [globalState, workerMap, sessionMap, snapshots])
})
