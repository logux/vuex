import { createLogux } from '..'

let opts = {
  server: 'wss://localhost:1337',
  subprotocol: '1.0.0',
  userId: '10',
}

interface RootState {
  value: number
}

let Logux = createLogux(opts)
let store = new Logux.Store<RootState>({
  state: {
    value: 0
  },
  mutations: {
    increment(state: RootState): void {
      state.value = state.value + 1
    }
  }
})

// THROWS Type 'number' is not assignable to type 'string[] | undefined'.
store.commit.crossTab('increment', null, { reasons: 1 })
