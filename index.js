let { useStore } = require('vuex')

let { createLogux } = require('./create-logux')
// let { loguxMixin } = require('./mixin')
let { loguxComponent } = require('./component')
let { useSubscription } = require('./composable')

module.exports = {
  useStore,
  createLogux,
  // loguxMixin,
  loguxComponent,
  useSubscription
}
