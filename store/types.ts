import { CrossTabClient } from "@logux/client"
import { createStoreCreator } from '..'

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
store.local('increment', null, { reasons: ['reason'] })
store.crossTab({ type: 'increment' }, { reasons: ['reason'] })
store.sync({ type: 'increment' }).then(meta => {
  console.log(meta.id)
})
