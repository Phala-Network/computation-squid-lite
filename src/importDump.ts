import {BigDecimal} from '@subsquid/big-decimal'
import {readFile} from 'fs/promises'
import path from 'path'
import config from './config'
import {GlobalState, Session, Worker, WorkerState} from './model'
import {type Ctx} from './processor'
import {assertGet, fromBits, toBalance} from './utils'
import {updateWorkerShares} from './worker'

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
  const fromHeight = config.blockRange.from
  const dumpFile = await readFile(
    path.join(__dirname, `../assets/dump_lite_${fromHeight - 1}.json`),
    'utf8'
  )
  const dump = JSON.parse(dumpFile) as Dump
  const globalState = new GlobalState({
    id: '0',
    idleWorkerShares: BigDecimal(0),
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
      if (session.state === WorkerState.WorkerIdle) {
        globalState.idleWorkerShares = globalState.idleWorkerShares.plus(
          worker.shares
        )
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
