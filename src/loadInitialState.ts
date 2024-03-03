import {BigDecimal} from '@subsquid/big-decimal'
import fetch from 'node-fetch'
import {GlobalState, Session, Worker, WorkerState} from './model'
import type {Ctx} from './processor'
import {assertGet, fromBits, save, toBalance} from './utils'
import {updateSessionShares} from './worker'

interface InitialState {
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

const loadInitialState = async (ctx: Ctx): Promise<void> => {
  const initialState = await fetch(
    'https://raw.githubusercontent.com/Phala-Network/computation-squid-lite/main/initial_state/khala_4000000.json',
  ).then(async (res) => (await res.json()) as InitialState)
  const globalState = new GlobalState({
    id: '0',
    idleWorkerShares: BigDecimal(0),
    idleWorkerCount: 0,
    idleWorkerPInit: 0,
    idleWorkerPInstant: 0,
    workerCount: 0,
  })
  const workerMap = new Map<string, Worker>()
  const sessionMap = new Map<string, Session>()

  for (const w of initialState.workers) {
    const worker = new Worker({
      id: w.id,
      confidenceLevel: w.confidenceLevel,
      initialScore: w.initialScore,
    })
    workerMap.set(worker.id, worker)
  }

  for (const s of initialState.sessions) {
    const session = new Session({
      id: s.id,
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
      shares: BigDecimal(0),
    })
    if (s.worker != null) {
      const worker = assertGet(workerMap, s.worker)
      session.worker = worker
      updateSessionShares(session, worker)
      globalState.workerCount++
      if (session.state === WorkerState.WorkerIdle) {
        globalState.idleWorkerShares = globalState.idleWorkerShares.plus(
          session.shares,
        )
        globalState.idleWorkerCount++
        globalState.idleWorkerPInit += session.pInit
        globalState.idleWorkerPInstant += session.pInstant
      }
    }
    sessionMap.set(session.id, session)
  }

  await save(ctx, [globalState, workerMap, sessionMap])
}

export default loadInitialState
