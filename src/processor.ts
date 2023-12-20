import {lookupArchive} from '@subsquid/archive-registry'
import {
  type BlockHeader,
  type DataHandlerContext,
  SubstrateBatchProcessor,
  type SubstrateBatchProcessorFields,
  assertNotNull,
} from '@subsquid/substrate-processor'
import type {Store} from '@subsquid/typeorm-store'
import {phalaComputation, phalaRegistry} from './types/events'

const from = Number.parseInt(assertNotNull(process.env.FROM))

export const processor = new SubstrateBatchProcessor()
  .setGateway(lookupArchive('phala', {release: 'ArrowSquid'}))
  .setRpcEndpoint(assertNotNull(process.env.RPC_ENDPOINT))
  .setBlockRange({from})
  .includeAllBlocks()
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
export type SubstrateBlock = BlockHeader<Fields>
