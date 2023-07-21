import {BigDecimal} from '@subsquid/big-decimal'
import {
  BatchProcessorItem,
  DataHandlerContext,
  SubstrateBatchProcessor,
  toHex,
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
import {
  PhalaComputationBenchmarkUpdatedEvent,
  PhalaComputationSessionBoundEvent,
  PhalaComputationSessionSettledEvent,
  PhalaComputationSessionUnboundEvent,
  PhalaComputationWorkerEnterUnresponsiveEvent,
  PhalaComputationWorkerExitUnresponsiveEvent,
  PhalaComputationWorkerStartedEvent,
  PhalaComputationWorkerStoppedEvent,
  PhalaRegistryInitialScoreSetEvent,
  PhalaRegistryWorkerAddedEvent,
  PhalaRegistryWorkerUpdatedEvent,
} from './types/events'
import {assertGet, encodeAddress, fromBits, toMap} from './utils'
import {updateWorkerShares} from './worker'
import importDump from './importDump'

const processor = new SubstrateBatchProcessor()
  .setDataSource(config.dataSource)
  .setBlockRange(config.blockRange)
  .includeAllBlocks(config.blockRange)
  .addEvent('PhalaComputation.SessionBound')
  .addEvent('PhalaComputation.SessionUnbound')
  .addEvent('PhalaComputation.SessionSettled')
  .addEvent('PhalaComputation.WorkerStarted')
  .addEvent('PhalaComputation.WorkerStopped')
  .addEvent('PhalaComputation.WorkerReclaimed')
  .addEvent('PhalaComputation.WorkerEnterUnresponsive')
  .addEvent('PhalaComputation.WorkerExitUnresponsive')
  .addEvent('PhalaComputation.BenchmarkUpdated')

  .addEvent('PhalaRegistry.WorkerAdded')
  .addEvent('PhalaRegistry.WorkerUpdated')
  .addEvent('PhalaRegistry.InitialScoreSet')

type Item = BatchProcessorItem<typeof processor>
export type Ctx = DataHandlerContext<Store, Item>

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
    const blockTime = new Date(block.header.timestamp)
    for (const item of block.items) {
      switch (item.name) {
        case 'PhalaComputation.SessionBound': {
          // Memo: SessionBound happens before PoolWorkerAdded
          const e = new PhalaComputationSessionBoundEvent(ctx, item.event)
          const {session: sessionIdBytes, worker: workerIdU8a} = e.asV1199
          const sessionId = encodeAddress(sessionIdBytes)
          const workerId = toHex(workerIdU8a)
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
        case 'PhalaComputation.SessionUnbound': {
          const e = new PhalaComputationSessionUnboundEvent(ctx, item.event)
          const {session: sessionIdBytes, worker: workerIdU8a} = e.asV1199
          const sessionId = encodeAddress(sessionIdBytes)
          const workerId = toHex(workerIdU8a)
          const session = assertGet(sessionMap, sessionId)
          const worker = assertGet(workerMap, workerId)
          assert(session.worker)
          assert(session.worker.id === workerId)
          worker.session = null
          worker.shares = null
          session.isBound = false
          break
        }
        case 'PhalaComputation.SessionSettled': {
          const e = new PhalaComputationSessionSettledEvent(ctx, item.event)
          const {session: sessionIdBytes, vBits, payoutBits} = e.asV1199
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
        case 'PhalaComputation.WorkerStarted': {
          const e = new PhalaComputationWorkerStartedEvent(ctx, item.event)
          const {session: sessionIdBytes, initV, initP} = e.asV1199
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
        case 'PhalaComputation.WorkerStopped': {
          const e = new PhalaComputationWorkerStoppedEvent(ctx, item.event)
          const {session: sessionIdBytes} = e.asV1199
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
        case 'PhalaComputation.WorkerEnterUnresponsive': {
          const e = new PhalaComputationWorkerEnterUnresponsiveEvent(
            ctx,
            item.event
          )
          const {session: sessionIdBytes} = e.asV1199
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
        case 'PhalaComputation.WorkerExitUnresponsive': {
          const e = new PhalaComputationWorkerExitUnresponsiveEvent(
            ctx,
            item.event
          )
          const {session: sessionIdBytes} = e.asV1199
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
        case 'PhalaComputation.BenchmarkUpdated': {
          const e = new PhalaComputationBenchmarkUpdatedEvent(ctx, item.event)
          const {session: sessionIdBytes, pInstant} = e.asV1199
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
        case 'PhalaRegistry.WorkerAdded': {
          const e = new PhalaRegistryWorkerAddedEvent(ctx, item.event)
          const {pubkey, confidenceLevel} = e.asV1199
          const id = toHex(pubkey)
          const worker = new Worker({id, confidenceLevel})
          workerMap.set(id, worker)
          await ctx.store.save(worker)
          break
        }
        case 'PhalaRegistry.WorkerUpdated': {
          const e = new PhalaRegistryWorkerUpdatedEvent(ctx, item.event)
          const {pubkey, confidenceLevel} = e.asV1199
          const id = toHex(pubkey)
          const worker = assertGet(workerMap, id)
          worker.confidenceLevel = confidenceLevel
          break
        }
        case 'PhalaRegistry.InitialScoreSet': {
          const e = new PhalaRegistryInitialScoreSetEvent(ctx, item.event)
          const {pubkey, initScore} = e.asV1182
          const id = toHex(pubkey)
          const worker = assertGet(workerMap, id)
          worker.initialScore = initScore
          break
        }
      }
    }
  }

  let workerCount = 0
  let idleWorkerPInstant = 0
  let idleWorkerCount = 0
  for (const [, session] of sessionMap) {
    if (session.state === WorkerState.WorkerIdle) {
      idleWorkerPInstant += session.pInstant
      idleWorkerCount += 1
    }
    if (session.isBound) {
      workerCount += 1
    }
  }

  globalState.workerCount = workerCount
  globalState.idleWorkerPInstant = idleWorkerPInstant
  globalState.idleWorkerCount = idleWorkerCount

  await ctx.store.save(globalState)
  await ctx.store.save([...sessionMap.values()])
  await ctx.store.save([...workerMap.values()])

  const lastBlock = ctx.blocks.at(-1)
  assert(lastBlock)
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
