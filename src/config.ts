import {lookupArchive} from '@subsquid/archive-registry'
import {
  type BlockRangeOption,
  type DataSource,
} from '@subsquid/substrate-processor'

const config: {
  dataSource: DataSource
  blockRange: Exclude<BlockRangeOption['range'], undefined>
} = {
  blockRange: {from: 4000001},
  dataSource: {archive: lookupArchive('khala')},
}

export default config
