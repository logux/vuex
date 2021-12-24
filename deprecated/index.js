import { CrossTabClient } from '@logux/client'

import { createStoreCreator } from '../store/index.js'

export function createLogux (config = {}) {
  // eslint-disable-next-line no-console
  console.warn(
    'createLogux() will be removed soon ' +
      'Use createStoreCreator(client, opts) instead.'
  )

  let reasonlessHistory = config.reasonlessHistory || 1000
  let saveStateEvery = config.saveStateEvery || 50
  let onMissedHistory = config.onMissedHistory
  let cleanEvery = config.cleanEvery || 25

  delete config.reasonlessHistory
  delete config.saveStateEvery
  delete config.onMissedHistory
  delete config.cleanEvery

  let client = new CrossTabClient(config)

  return {
    Store: function Store (options = {}) {
      let createStore = createStoreCreator(client, {
        cleanEvery,
        saveStateEvery,
        onMissedHistory,
        reasonlessHistory
      })
      return createStore(options)
    }
  }
}
