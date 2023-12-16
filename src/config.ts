import {lookupArchive} from '@subsquid/archive-registry'
import {assertNotNull, type DataSource} from '@subsquid/substrate-processor'
import {type Range} from '@subsquid/util-internal-processor-tools'

const config: {
  dataSource: DataSource
  blockRange: Range
} = {
  blockRange: {from: 4000001},
  dataSource: {
    archive: lookupArchive('khala', {release: 'ArrowSquid'}),
    chain: {
      url: assertNotNull(process.env.RPC_ENDPOINT),
      rateLimit: 100,
    },
  },
}

export default config
