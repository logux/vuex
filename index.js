let { useStore } = require('vuex')
let { Client, CrossTabClient } = require('@logux/client')

let { devtools } = require('./devtools')
let { Subscribe } = require('./component')
let { useSubscription } = require('./composable')
let { createStoreCreator } = require('./store')

module.exports = {
  Client,
  devtools,
  useStore,
  Subscribe,
  CrossTabClient,
  useSubscription,
  createStoreCreator
}
