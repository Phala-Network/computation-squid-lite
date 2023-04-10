import {lookupArchive} from '@subsquid/archive-registry'
import {
  type BlockRangeOption,
  type DataSource,
} from '@subsquid/substrate-processor'

type Network = 'khala' | 'phala'

const NETWORK: Network = 'khala'

const config: {
  network: Network
  dataSource: DataSource
  blockRange: Exclude<BlockRangeOption['range'], undefined>
} = {
  network: NETWORK,
  blockRange: {from: 3670131},
  dataSource: {archive: lookupArchive(NETWORK)},
}

export default config
