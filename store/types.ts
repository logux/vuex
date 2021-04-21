import { CrossTabClient } from '@logux/client'

import { createStoreCreator } from '../index.js'

interface RootState {
  value: number
}

let client = new CrossTabClient({
  server: 'wss://localhost:1337',
  subprotocol: '1.0.0',
  userId: '10'
})

let createStore = createStoreCreator(client)

let store = createStore<RootState>({
  state: {
    value: 0
  },
  mutations: {
    increment(state) {
      state.value = state.value + 1
    }
  }
})

store.commit('increment')
store.commit({ type: 'increment' })
store.commit({ type: 'increment' }, { silent: true })
store.commit.local('increment', null, { reasons: ['reason'] })
store.commit.crossTab({ type: 'increment' }, { reasons: ['reason'] })
store.commit.sync({ type: 'increment' }).then(meta => {
  console.log(meta.id)
})
