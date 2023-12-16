import {BigDecimal} from '@subsquid/big-decimal'
import {
  DataHandlerContext,
  SubstrateBatchProcessor,
  SubstrateBatchProcessorFields,
} from '@subsquid/substrate-processor'
import {Store, TypeormDatabase} from '@subsquid/typeorm-store'
import assert from 'assert'
import config from './config'
import {
  GlobalState,
  Session,
  Worker,
  WorkerSharesSnapshot,
  WorkerState,
} from './model'
import {phalaComputation, phalaRegistry} from './types/events'
import {assertGet, encodeAddress, fromBits, toMap} from './utils'
import {updateWorkerShares} from './worker'
import importDump from './importDump'

const processor = new SubstrateBatchProcessor()
  .setDataSource(config.dataSource)
  .setBlockRange(config.blockRange)
  .includeAllBlocks(config.blockRange)
  .addEvent({
    name: [
      phalaComputation.sessionBound.name,
      phalaComputation.sessionUnbound.name,
      phalaComputation.sessionSettled.name,
      phalaComputation.workerStarted.name,
      phalaComputation.workerStopped.name,
      phalaComputation.workerEnterUnresponsive.name,
      phalaComputation.workerExitUnresponsive.name,
      phalaComputation.benchmarkUpdated.name,
      phalaRegistry.workerAdded.name,
      phalaRegistry.workerUpdated.name,
      phalaRegistry.initialScoreSet.name,
    ],
  })

  .setFields({
    block: {timestamp: true},
    event: {name: true, args: true},
  })

export type Fields = SubstrateBatchProcessorFields<typeof processor>
export type Ctx = DataHandlerContext<Store, Fields>

processor.run(new TypeormDatabase(), async (ctx) => {
  if ((await ctx.store.get(GlobalState, '0')) == null) {
    ctx.log.info('Importing dump...')
    await importDump(ctx)
    ctx.log.info('Dump imported')
  }

  const globalState = await ctx.store.findOneByOrFail(GlobalState, {id: '0'})

  const workerMap = await ctx.store
    .find(Worker, {relations: {session: true}})
    .then(toMap)
  const sessionMap = await ctx.store
    .find(Session, {relations: {worker: true}})
    .then(toMap)
  for (const block of ctx.blocks) {
    assert(block.header.timestamp)
    const blockTime = new Date(block.header.timestamp)
    for (const event of block.events) {
      switch (event.name) {
        case phalaComputation.sessionBound.name: {
          // Memo: SessionBound happens before PoolWorkerAdded
          const {session: sessionIdBytes, worker: workerId} =
            phalaComputation.sessionBound.v1199.decode(event)
          const sessionId = encodeAddress(sessionIdBytes)
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
          break
        }
        case phalaComputation.sessionUnbound.name: {
          const {session: sessionIdBytes, worker: workerId} =
            phalaComputation.sessionUnbound.v1199.decode(event)
          const sessionId = encodeAddress(sessionIdBytes)
          const session = assertGet(sessionMap, sessionId)
          const worker = assertGet(workerMap, workerId)
          assert(session.worker)
          assert(session.worker.id === workerId)
          worker.session = null
          worker.shares = null
          session.isBound = false
          break
        }
        case phalaComputation.sessionSettled.name: {
          const {
            session: sessionIdBytes,
            vBits,
            payoutBits,
          } = phalaComputation.sessionSettled.v1199.decode(event)
          const v = fromBits(vBits)
          const sessionId = encodeAddress(sessionIdBytes)
          const payout = fromBits(payoutBits).round(12, 0)
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
          const {
            session: sessionIdBytes,
            initV,
            initP,
          } = phalaComputation.workerStarted.v1199.decode(event)
          const sessionId = encodeAddress(sessionIdBytes)
          const v = fromBits(initV)
          const session = assertGet(sessionMap, sessionId)
          assert(session.worker)
          session.pInit = initP
          session.ve = v
          session.v = v
          session.state = WorkerState.WorkerIdle
          const worker = assertGet(workerMap, session.worker.id)
          updateWorkerShares(worker, session)
          globalState.idleWorkerShares = globalState.idleWorkerShares.plus(
            worker.shares
          )
          break
        }
        case phalaComputation.workerStopped.name: {
          const {session: sessionIdBytes} =
            phalaComputation.workerStopped.v1199.decode(event)
          const sessionId = encodeAddress(sessionIdBytes)
          const session = assertGet(sessionMap, sessionId)
          assert(session.worker)
          const worker = assertGet(workerMap, session.worker.id)
          assert(worker.shares)
          if (session.state === WorkerState.WorkerIdle) {
            globalState.idleWorkerShares = globalState.idleWorkerShares.minus(
              worker.shares
            )
          }
          session.state = WorkerState.WorkerCoolingDown
          session.coolingDownStartTime = blockTime
          break
        }
        case phalaComputation.workerEnterUnresponsive.name: {
          const {session: sessionIdBytes} =
            phalaComputation.workerEnterUnresponsive.v1199.decode(event)
          const sessionId = encodeAddress(sessionIdBytes)
          const session = assertGet(sessionMap, sessionId)
          assert(session.worker)
          if (session.state === WorkerState.WorkerIdle) {
            session.state = WorkerState.WorkerUnresponsive
            const worker = assertGet(workerMap, session.worker.id)
            assert(worker.shares)
            globalState.idleWorkerShares = globalState.idleWorkerShares.minus(
              worker.shares
            )
          }
          break
        }
        case phalaComputation.workerExitUnresponsive.name: {
          const {session: sessionIdBytes} =
            phalaComputation.workerExitUnresponsive.v1199.decode(event)
          const sessionId = encodeAddress(sessionIdBytes)
          const session = assertGet(sessionMap, sessionId)
          assert(session.worker)
          if (session.state === WorkerState.WorkerUnresponsive) {
            const worker = assertGet(workerMap, session.worker.id)
            assert(worker.shares)
            globalState.idleWorkerShares = globalState.idleWorkerShares.plus(
              worker.shares
            )
          }
          session.state = WorkerState.WorkerIdle
          break
        }
        case phalaComputation.benchmarkUpdated.name: {
          const {session: sessionIdBytes, pInstant} =
            phalaComputation.benchmarkUpdated.v1199.decode(event)
          const sessionId = encodeAddress(sessionIdBytes)
          const session = assertGet(sessionMap, sessionId)
          session.pInstant = pInstant
          assert(session.worker)
          const worker = assertGet(workerMap, session.worker.id)
          const prevShares = worker.shares ?? BigDecimal(0)
          updateWorkerShares(worker, session)
          if (session.state === WorkerState.WorkerIdle) {
            globalState.idleWorkerShares = globalState.idleWorkerShares
              .minus(prevShares)
              .plus(worker.shares)
          }
          break
        }
        case phalaRegistry.workerAdded.name: {
          if (phalaRegistry.workerAdded.v1199.is(event)) {
            const {pubkey: id, confidenceLevel} =
              phalaRegistry.workerAdded.v1199.decode(event)
            const worker = new Worker({id, confidenceLevel})
            workerMap.set(id, worker)
            await ctx.store.save(worker)
          } else if (phalaRegistry.workerAdded.v1260.is(event)) {
            const {pubkey: id, confidenceLevel} =
              phalaRegistry.workerAdded.v1260.decode(event)
            const worker = new Worker({id, confidenceLevel})
            workerMap.set(id, worker)
            await ctx.store.save(worker)
          } else {
            throw new Error('Unknown event version')
          }
          break
        }
        case phalaRegistry.workerUpdated.name: {
          if (phalaRegistry.workerUpdated.v1199.is(event)) {
            const {pubkey: id, confidenceLevel} =
              phalaRegistry.workerUpdated.v1199.decode(event)
            const worker = assertGet(workerMap, id)
            worker.confidenceLevel = confidenceLevel
          } else if (phalaRegistry.workerUpdated.v1260.is(event)) {
            const {pubkey: id, confidenceLevel} =
              phalaRegistry.workerUpdated.v1260.decode(event)
            const worker = assertGet(workerMap, id)
            worker.confidenceLevel = confidenceLevel
          } else {
            throw new Error('Unknown event version')
          }
          break
        }
        case phalaRegistry.initialScoreSet.name: {
          const {pubkey: id, initScore} =
            phalaRegistry.initialScoreSet.v1182.decode(event)
          const worker = assertGet(workerMap, id)
          worker.initialScore = initScore
          break
        }
      }
    }
  }

  let workerCount = 0
  let idleWorkerPInit = 0
  let idleWorkerPInstant = 0
  let idleWorkerCount = 0
  for (const [, session] of sessionMap) {
    if (session.state === WorkerState.WorkerIdle) {
      idleWorkerPInstant += session.pInstant
      idleWorkerPInit += session.pInit
      idleWorkerCount += 1
    }
    if (session.isBound) {
      workerCount += 1
    }
  }

  globalState.workerCount = workerCount
  globalState.idleWorkerPInit = idleWorkerPInit
  globalState.idleWorkerPInstant = idleWorkerPInstant
  globalState.idleWorkerCount = idleWorkerCount

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
