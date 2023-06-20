import {BigDecimal} from '@subsquid/big-decimal'
import {GlobalState, Session, Worker, WorkerState} from './model'
import {type Ctx} from './processor'
import {assertGet, fromBits, toBalance} from './utils'
import {updateWorkerShares} from './worker'
import fetch from 'node-fetch'

interface Dump {
  timestamp: number
  workers: Array<{
    id: string
    confidenceLevel: number
    initialScore: number | null
  }>
  sessions: Array<{
    id: string
    v: string
    ve: string
    state: WorkerState
    pInit: number
    pInstant: number
    totalReward: string
    coolingDownStartTime: number
    stake: string
    worker: string | null
  }>
}

const importDump = async (ctx: Ctx): Promise<void> => {
  const dump = await fetch(
    'https://raw.githubusercontent.com/Phala-Network/computation-squid-lite/main/dump/khala_4000000.json'
  ).then(async (res) => (await res.json()) as Dump)
  const globalState = new GlobalState({
    id: '0',
    idleWorkerShares: BigDecimal(0),
    idleWorkerCount: 0,
    idleWorkerPInstant: 0,
    workerCount: 0,
  })
  const workerMap = new Map<string, Worker>()
  const sessionMap = new Map<string, Session>()

  for (const w of dump.workers) {
    const worker = new Worker({
      id: w.id,
      confidenceLevel: w.confidenceLevel,
      initialScore: w.initialScore,
    })
    workerMap.set(worker.id, worker)
  }

  // MEMO: insert worker first to avoid invalid foreign key
  await ctx.store.insert([...workerMap.values()])

  for (const s of dump.sessions) {
    const session = new Session({
      id: s.id,
      isBound: false,
      v: fromBits(s.v),
      ve: fromBits(s.ve),
      state: s.state,
      pInit: s.pInit,
      pInstant: s.pInstant,
      totalReward: toBalance(s.totalReward),
      coolingDownStartTime:
        s.coolingDownStartTime === 0
          ? null
          : new Date(s.coolingDownStartTime * 1000),
      stake: toBalance(s.stake),
    })
    if (s.worker != null) {
      const worker = assertGet(workerMap, s.worker)
      session.isBound = true
      session.worker = worker
      worker.session = session
      updateWorkerShares(worker, session)
      globalState.workerCount++
      if (session.state === WorkerState.WorkerIdle) {
        globalState.idleWorkerShares = globalState.idleWorkerShares.plus(
          worker.shares
        )
        globalState.idleWorkerCount++
        globalState.idleWorkerPInstant += session.pInstant
      }
    }
    sessionMap.set(session.id, session)
  }

  for (const x of [globalState, sessionMap, workerMap]) {
    if (x instanceof Map) {
      await ctx.store.save([...x.values()])
    } else {
      await ctx.store.save(x)
    }
  }
}

export default importDump
