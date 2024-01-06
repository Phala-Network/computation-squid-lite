import {type Ctx, type SubstrateBlock} from './processor'
import {encodeAddress, fromBits, toBalance} from './utils/converter'
import {phalaComputation, phalaRegistry} from './types/events'

const decodeEvent = (
  event: Ctx['blocks'][number]['events'][number]
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) => {
  const {name} = event
  const error = new Error(
    `Unsupported spec: ${event.name} v${event.block.specVersion}`
  )
  switch (name) {
    case phalaComputation.sessionBound.name: {
      if (phalaComputation.sessionBound.v1199.is(event)) {
        const {session, worker} =
          phalaComputation.sessionBound.v1199.decode(event)
        return {
          name,
          args: {sessionId: encodeAddress(session), workerId: worker},
        }
      } else {
        throw error
      }
    }
    case phalaComputation.sessionUnbound.name: {
      if (phalaComputation.sessionUnbound.v1199.is(event)) {
        const {session, worker} =
          phalaComputation.sessionUnbound.v1199.decode(event)
        return {
          name,
          args: {sessionId: encodeAddress(session), workerId: worker},
        }
      } else {
        throw error
      }
    }
    case phalaComputation.sessionSettled.name: {
      if (phalaComputation.sessionSettled.v1199.is(event)) {
        const {session, vBits, payoutBits} =
          phalaComputation.sessionSettled.v1199.decode(event)
        return {
          name,
          args: {
            sessionId: encodeAddress(session),
            v: fromBits(vBits),
            payout: fromBits(payoutBits).round(12, 0),
          },
        }
      } else {
        throw error
      }
    }
    case phalaComputation.workerStarted.name: {
      if (phalaComputation.workerStarted.v1199.is(event)) {
        const {session, initV, initP} =
          phalaComputation.workerStarted.v1199.decode(event)
        return {
          name,
          args: {
            sessionId: encodeAddress(session),
            initV: fromBits(initV),
            initP,
          },
        }
      } else {
        throw error
      }
    }
    case phalaComputation.workerStopped.name: {
      if (phalaComputation.workerStopped.v1199.is(event)) {
        const {session} = phalaComputation.workerStopped.v1199.decode(event)
        return {name, args: {sessionId: encodeAddress(session)}}
      } else {
        throw error
      }
    }
    case phalaComputation.workerReclaimed.name: {
      if (phalaComputation.workerReclaimed.v1199.is(event)) {
        const {session, originalStake, slashed} =
          phalaComputation.workerReclaimed.v1199.decode(event)
        return {
          name,
          args: {
            sessionId: encodeAddress(session),
            originalStake: toBalance(originalStake),
            slashed: toBalance(slashed),
          },
        }
      } else {
        throw error
      }
    }
    case phalaComputation.workerEnterUnresponsive.name: {
      if (phalaComputation.workerEnterUnresponsive.v1199.is(event)) {
        const {session} =
          phalaComputation.workerEnterUnresponsive.v1199.decode(event)
        return {name, args: {sessionId: encodeAddress(session)}}
      } else {
        throw error
      }
    }
    case phalaComputation.workerExitUnresponsive.name: {
      if (phalaComputation.workerExitUnresponsive.v1199.is(event)) {
        const {session} =
          phalaComputation.workerExitUnresponsive.v1199.decode(event)
        return {name, args: {sessionId: encodeAddress(session)}}
      } else {
        throw error
      }
    }
    case phalaComputation.benchmarkUpdated.name: {
      if (phalaComputation.benchmarkUpdated.v1199.is(event)) {
        const {session, pInstant} =
          phalaComputation.benchmarkUpdated.v1199.decode(event)
        return {name, args: {sessionId: encodeAddress(session), pInstant}}
      } else {
        throw error
      }
    }
    case phalaRegistry.workerAdded.name: {
      if (phalaRegistry.workerAdded.v1260.is(event)) {
        const {pubkey, confidenceLevel} =
          phalaRegistry.workerAdded.v1260.decode(event)
        return {
          name,
          args: {workerId: pubkey, confidenceLevel},
        }
      } else if (phalaRegistry.workerAdded.v1199.is(event)) {
        const {pubkey, confidenceLevel} =
          phalaRegistry.workerAdded.v1199.decode(event)
        return {
          name,
          args: {workerId: pubkey, confidenceLevel},
        }
      } else {
        throw error
      }
    }
    case phalaRegistry.workerUpdated.name: {
      if (phalaRegistry.workerUpdated.v1260.is(event)) {
        const {pubkey, confidenceLevel} =
          phalaRegistry.workerUpdated.v1260.decode(event)
        return {
          name,
          args: {workerId: pubkey, confidenceLevel},
        }
      } else if (phalaRegistry.workerUpdated.v1199.is(event)) {
        const {pubkey, confidenceLevel} =
          phalaRegistry.workerUpdated.v1199.decode(event)
        return {
          name,
          args: {workerId: pubkey, confidenceLevel},
        }
      } else {
        throw error
      }
    }
    case phalaRegistry.initialScoreSet.name: {
      if (phalaRegistry.initialScoreSet.v1182.is(event)) {
        const {pubkey, initScore} =
          phalaRegistry.initialScoreSet.v1182.decode(event)
        return {
          name,
          args: {workerId: pubkey, initialScore: initScore},
        }
      } else {
        throw error
      }
    }
  }
}

const decodeEvents = (
  ctx: Ctx
): Array<
  Exclude<ReturnType<typeof decodeEvent>, undefined> & {
    block: SubstrateBlock
  }
> => {
  const decodedEvents = []

  for (const block of ctx.blocks) {
    for (const event of block.events) {
      const decoded = decodeEvent(event)
      if (decoded != null) {
        decodedEvents.push({...decoded, block: block.header})
      }
    }
  }

  return decodedEvents
}

export default decodeEvents
