import {
  type BlockRangeOption,
  type DataSource,
} from '@subsquid/substrate-processor'

const config: {
  dataSource: DataSource
  blockRange: Exclude<BlockRangeOption['range'], undefined>
} = {
  blockRange: {from: 2},
  dataSource: {archive: 'http://54.39.243.230:9005/graphql'},
}

export default config
