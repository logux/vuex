let { useStore } = require('vuex')
let { Client, CrossTabClient } = require('@logux/client')

let { loguxComponent } = require('./component')
let { useSubscription } = require('./composable')
let { createStoreCreator } = require('./store')

module.exports = {
  Client,
  useStore,
  CrossTabClient,
  loguxComponent,
  useSubscription,
  createStoreCreator
}
