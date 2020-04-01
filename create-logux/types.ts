import { createLogux } from '..'

let opts = {
  server: 'wss://localhost:1337',
  subprotocol: '1.0.0',
  userId: "10",
}

interface RootState {
  value: number;
}

let Logux = createLogux(opts)
let store = new Logux.Store<RootState>({
  state: { value: 0 },
  mutations: {
    increment(state) {
      state.value = state.value + 1
    }
  }
})

store.commit('increment')
store.commit({ type: 'increment' })
store.commit({ type: 'increment' }, { silent: true })
store.commit.crossTab({ type: 'increment' }, { reasons: ['reason'] })
store.commit.sync({ type: 'increment' }).then(meta => {
  console.log(meta.id)
})
