let Vue = require('vue')
let Vuex = require('vuex')
let { TestPair, TestTime } = require('@logux/core')
let { delay } = require('nanodelay')

let { createLogux } = require('..')

Vue.config.productionTip = false
Vue.config.devtools = false
Vue.use(Vuex)

function initLogux (opts = { }) {
  if (!opts.server) opts.server = 'wss://localhost:1337'
  opts.subprotocol = '1.0.0'
  opts.userId = '10'
  opts.time = new TestTime()

  return createLogux(opts)
}

function createStore (mutations, opts) {
  let Logux = initLogux(opts)
  let store = new Logux.Store({ state: { value: 0 }, mutations })
  return store
}

function createStoreWithModule (namespaced, mutations, opts) {
  let Logux = initLogux(opts)
  let store = new Logux.Store({
    modules: {
      user: { namespaced, state: { value: 0 }, mutations }
    }
  })
  return store
}

function increment (state) {
  state.value = state.value + 1
}

function historyLine (state, action) {
  state.value = state.value + action.value
}

it('throws error on missed config', () => {
  expect(() => {
    createLogux()
  }).toThrow('Missed server option in Logux client')
})

it('creates Vuex store', () => {
  let store = createStore({ increment })
  store.commit({ type: 'increment' })
  expect(store.state).toEqual({ value: 1 })
})

it('unify commit arguments', async () => {
  let store = createStore({ historyLine })
  store.commit('historyLine', 1)
  store.commit({ type: 'historyLine', value: 1 })
  expect(store.state).toEqual({ value: 2 })

  store.sync('historyLine', 1, { reasons: ['test1'] })
  store.sync({ type: 'historyLine', value: 1 }, { reasons: ['test2'] })
  await delay(10)
  let log = store.log.store.created
  expect(log[2][0]).toEqual({ type: 'historyLine', value: 1 })
  expect(log[2][1].sync).toBe(true)
  expect(log[2][1].reasons).toEqual(['test1', 'syncing'])
  expect(log[3][1].reasons).toEqual(['test2', 'syncing'])
})

it('creates Logux client', () => {
  let store = createStore({ increment })
  expect(store.client.options.subprotocol).toEqual('1.0.0')
})

it('not found mutation', () => {
  let store = createStore({ increment })

  store.crossTab({ type: 'mutation' })
  store.commit('increment')
  store.commit('increment')
  store.commit({ type: 'logux/state', state: { value: 1 } })
  expect(store.state).toEqual({ value: 1 })
})

it('commit mutation with prefixed name', async () => {
  let store = createStore({
    'utils/clean': state => {
      state.value = 0
    },
    increment
  })

  store.commit('increment')
  store.commit('increment')
  await store.crossTab('increment')
  store.commit('utils/clean')
  expect(store.state.value).toBe(0)
})

it('commit root mutation in namespaced module', () => {
  let Logux = createLogux({
    server: 'wss://localhost:1337',
    subprotocol: '1.0.0',
    userId: '10',
    time: new TestTime()
  })
  let store = new Logux.Store({
    state: { value: 0 },
    mutations: { increment },
    modules: {
      user: {
        namespaced: true,
        state: { value: 0 },
        mutations: { increment },
        actions: {
          someAction ({ commit }) {
            commit('increment')
            commit('increment', null, { root: true })
          }
        }
      }
    }
  })

  store.dispatch('user/someAction')
  expect(store.state).toEqual({ value: 1, user: { value: 1 } })
  expect(store.log.actions()).toEqual([
    { type: 'user/increment' },
    { type: 'increment' }
  ])
})

it('sets tab ID', async () => {
  let store = createStore({ increment })

  await new Promise(resolve => {
    store.log.on('add', (action, meta) => {
      expect(meta.tab).toEqual(store.client.tabId)
      expect(meta.reasons).toEqual([`timeTravelTab${store.client.tabId}`])
      resolve()
    })
    store.commit({ type: 'increment' })
  })
})

it('has shortcut for add', async () => {
  let store = createStore({ increment })

  await store.crossTab({ type: 'increment' }, { reasons: ['test'] })
  expect(store.state).toEqual({ value: 1 })
  expect(store.log.store.created[0][1].reasons).toEqual(['test'])
})

it('listen for action from other tabs', () => {
  let store = createStore({ increment })
  store.client.emitter.emit('add', { type: 'increment' }, { id: '1 t 0' })
  expect(store.state).toEqual({ value: 1 })
})

it('saves previous states', async () => {
  let calls = 0
  let store = createStore({
    A () {
      calls += 1
    }
  })

  let promise = Promise.resolve()
  for (let i = 0; i < 60; i++) {
    if (i % 2 === 0) {
      promise = promise.then(() => {
        return store.crossTab({ type: 'A' }, { reasons: ['test'] })
      })
    } else {
      store.commit({ type: 'A' })
    }
  }

  await promise
  expect(calls).toEqual(60)
  calls = 0
  await store.crossTab(
    { type: 'A' }, { id: '57 10:test1 1', reasons: ['test'] }
  )
  expect(calls).toEqual(10)
})

it('changes history recording frequency', async () => {
  let calls = 0
  let store = createStore({
    A () {
      calls += 1
    }
  }, {
    saveStateEvery: 1
  })

  await Promise.all([
    store.crossTab({ type: 'A' }, { reasons: ['test'] }),
    store.crossTab({ type: 'A' }, { reasons: ['test'] }),
    store.crossTab({ type: 'A' }, { reasons: ['test'] }),
    store.crossTab({ type: 'A' }, { reasons: ['test'] })
  ])
  calls = 0
  await store.crossTab(
    { type: 'A' }, { id: '3 10:test1 1', reasons: ['test'] }
  )
  expect(calls).toEqual(2)
})

it('cleans its history on removing action', async () => {
  let calls = 0
  let store = createStore({
    A () {
      calls += 1
    }
  }, {
    saveStateEvery: 2
  })
  let nodeId = store.client.nodeId

  await Promise.all([
    store.crossTab({ type: 'A' }, { reasons: ['test'] }),
    store.crossTab({ type: 'A' }, { reasons: ['test'] }),
    store.crossTab({ type: 'A' }, { reasons: ['test'] }),
    store.crossTab({ type: 'A' }, { reasons: ['test'] }),
    store.crossTab({ type: 'A' }, { reasons: ['test'] }),
    store.crossTab({ type: 'A' }, { reasons: ['test'] })
  ])
  await store.log.changeMeta(`5 ${nodeId} 0`, { reasons: [] })
  calls = 0
  await store.crossTab(
    { type: 'A' }, { id: `5 ${nodeId} 1`, reasons: ['test'] }
  )
  expect(calls).toEqual(3)
})

it('changes history', async () => {
  let store = createStore({ historyLine })

  await Promise.all([
    store.crossTab(
      { type: 'historyLine', value: 'a' }, { reasons: ['test'] }
    ),
    store.crossTab(
      { type: 'historyLine', value: 'b' }, { reasons: ['test'] }
    )
  ])
  store.commit({ type: 'historyLine', value: 'c' })
  store.commit({ type: 'historyLine', value: 'd' })
  await store.crossTab(
    { type: 'historyLine', value: '|' },
    { id: '2 10:test1 1', reasons: ['test'] }
  )
  expect(store.state.value).toEqual('0ab|cd')
})

it('undoes actions', async () => {
  let store = createStore({ historyLine })
  let nodeId = store.client.nodeId

  await Promise.all([
    store.crossTab(
      { type: 'historyLine', value: 'a' }, { reasons: ['test'] }),
    store.crossTab(
      { type: 'historyLine', value: 'b' }, { reasons: ['test'] }),
    store.crossTab(
      { type: 'historyLine', value: 'c' }, { reasons: ['test'] })
  ])
  expect(store.state.value).toEqual('0abc')
  store.crossTab(
    { type: 'logux/undo', id: `2 ${nodeId} 0` }, { reasons: ['test'] }
  )
  await delay(1)
  expect(store.state.value).toEqual('0ac')
})

it('ignores cleaned history from non-legacy actions', async () => {
  let onMissedHistory = jest.fn()
  let store = createStore({ historyLine }, {
    onMissedHistory,
    saveStateEvery: 2
  })

  await Promise.all([
    store.crossTab(
      { type: 'historyLine', value: 'a' }, { reasons: ['one'] }
    ),
    store.crossTab(
      { type: 'historyLine', value: 'b' }, { reasons: ['test'] }
    ),
    store.crossTab(
      { type: 'historyLine', value: 'c' }, { reasons: ['test'] }
    ),
    store.crossTab(
      { type: 'historyLine', value: 'd' }, { reasons: ['test'] }
    )
  ])
  await store.log.removeReason('one')
  store.crossTab(
    { type: 'historyLine', value: '|' },
    { id: '1 10:test1 0', reasons: ['test'] }
  )
  await delay(1)
  expect(store.state.value).toEqual('0|bcd')
  expect(onMissedHistory).not.toHaveBeenCalledWith()
})

it('does not replays actions on logux/ actions', async () => {
  let commited = []
  let saveCommited = (state, action) => commited.push(action.type)
  let store = createStore({
    'A': saveCommited,
    'B': saveCommited,
    'logux/processed': saveCommited,
    'logux/subscribe': saveCommited,
    'logux/unsubscribe': saveCommited
  })

  store.log.add({ type: 'A' }, { reasons: ['t'] })
  store.log.add({ type: 'logux/processed' }, { time: 0 })
  store.log.add({ type: 'logux/subscribe' }, { sync: true, time: 0 })
  store.log.add({ type: 'logux/unsubscribe' }, { sync: true, time: 0 })
  store.log.add({ type: 'B' }, { reasons: ['t'], time: 0 })
  await delay(1)
  expect(commited).toEqual(['A', 'B', 'A'])
  expect(store.log.actions()).toEqual([
    { type: 'logux/subscribe' },
    { type: 'logux/unsubscribe' },
    { type: 'B' },
    { type: 'A' }
  ])
})

it('replays history for reason-less action', async () => {
  let store = createStore({ historyLine })

  await Promise.all([
    store.crossTab(
      { type: 'historyLine', value: 'a' }, { reasons: ['test'] }),
    store.crossTab(
      { type: 'historyLine', value: 'b' }, { reasons: ['test'] }),
    store.crossTab(
      { type: 'historyLine', value: 'c' }, { reasons: ['test'] })
  ])
  store.crossTab(
    { type: 'historyLine', value: '|' },
    { id: '1 10:test1 1', noAutoReason: true }
  )
  await delay(1)
  expect(store.state.value).toEqual('0a|bc')
  expect(store.log.store.created).toHaveLength(3)
})

it('replays actions before staring since initial state', async () => {
  let onMissedHistory = jest.fn()
  let store = createStore({ historyLine }, {
    onMissedHistory,
    saveStateEvery: 2
  })

  await Promise.all([
    store.crossTab(
      { type: 'historyLine', value: 'b' }, { reasons: ['test'] }),
    store.crossTab(
      { type: 'historyLine', value: 'c' }, { reasons: ['test'] }),
    store.crossTab(
      { type: 'historyLine', value: 'd' }, { reasons: ['test'] })
  ])
  store.crossTab(
    { type: 'historyLine', value: '|' },
    { id: '0 10:test1 0', reasons: ['test'] }
  )
  await delay(1)
  expect(onMissedHistory).not.toHaveBeenCalled()
  expect(store.state.value).toEqual('0|bcd')
})

it('replays actions on missed history', async () => {
  let onMissedHistory = jest.fn()
  let store = createStore({ historyLine }, {
    reasonlessHistory: 2,
    onMissedHistory,
    saveStateEvery: 2,
    cleanEvery: 1
  })

  store.commit({ type: 'historyLine', value: 'a' })
  store.commit({ type: 'historyLine', value: 'b' })
  store.commit({ type: 'historyLine', value: 'c' })
  store.commit({ type: 'historyLine', value: 'd' })
  await delay(1)
  store.crossTab(
    { type: 'historyLine', value: '[' },
    { id: '0 10:test1 0', reasons: ['test'] }
  )
  await delay(1)
  expect(store.state.value).toEqual('0abc[d')
  expect(onMissedHistory).toHaveBeenCalledWith(
    { type: 'historyLine', value: '[' }
  )
  store.crossTab(
    { type: 'historyLine', value: ']' },
    { id: '0 10:test1 1', reasons: ['test'] }
  )
  await delay(1)
  expect(store.state.value).toEqual('0abc[]d')
})

it('works without onMissedHistory', async () => {
  let store = createStore({ historyLine }, {
    reasonlessHistory: 2,
    saveStateEvery: 2,
    cleanEvery: 1
  })
  store.commit({ type: 'ADD', value: 'a' })
  store.commit({ type: 'ADD', value: 'b' })
  store.commit({ type: 'ADD', value: 'c' })
  store.commit({ type: 'ADD', value: 'd' })
  await delay(1)
  await store.crossTab(
    { type: 'ADD', value: '|' },
    { id: '0 10:test1 0', reasons: ['test'] }
  )
})

it('does not fall on missed onMissedHistory', async () => {
  let store = createStore({ historyLine })

  await store.crossTab(
    { type: 'historyLine', value: 'a' }, { reasons: ['first'] }
  )
  await store.log.removeReason('first')
  await store.crossTab(
    { type: 'historyLine', value: '|' },
    { id: '0 10:test1 0', reasons: ['test'] }
  )
  await delay(1)
  expect(store.state.value).toEqual('0|')
})

it('cleans action added without reason', async () => {
  let store = createStore({ historyLine }, { reasonlessHistory: 3 })

  store.local({ type: 'historyLine', value: 0 }, { reasons: ['test'] })
  expect(store.log.entries()[0][1].reasons).toEqual(['test'])

  function add (index) {
    return () => {
      store.commit({ type: 'historyLine', value: 4 * index - 3 })
      store.local({ type: 'historyLine', value: 4 * index - 2 })
      store.crossTab({ type: 'historyLine', value: 4 * index - 1 })
      store.sync({ type: 'historyLine', value: 4 * index })
    }
  }

  let promise = Promise.resolve()
  for (let i = 1; i <= 6; i++) {
    promise = promise.then(add(i))
  }

  await promise
  await delay(1)

  let entries = store.log.entries()
  let last = entries[entries.length - 1]
  expect(last[1].reasons).toEqual(['syncing', 'timeTravel'])
  store.commit({ type: 'historyLine', value: 25 })
  await store.log.removeReason('syncing')
  await delay(1)
  expect(store.log.actions()).toEqual([
    { type: 'historyLine', value: 0 },
    { type: 'historyLine', value: 23 },
    { type: 'historyLine', value: 24 },
    { type: 'historyLine', value: 25 }
  ])
})

it('cleans last 1000 by default', async () => {
  let store = createStore({ increment })

  let promise = Promise.resolve()
  for (let i = 0; i < 1050; i++) {
    promise = promise.then(() => {
      store.commit({ type: 'increment' })
    })
  }
  await promise
  await delay(1)
  expect(store.log.actions()).toHaveLength(1000)
})

it('copies reasons to undo action', async () => {
  let store = createStore({ increment })
  let nodeId = store.client.nodeId

  await store.crossTab(
    { type: 'increment' }, { reasons: ['a', 'b'] }
  )
  await store.crossTab(
    { type: 'logux/undo', id: `1 ${nodeId} 0` }, { reasons: [] }
  )
  let result = await store.log.byId(`2 ${nodeId} 0`)
  expect(result[0].type).toEqual('logux/undo')
  expect(result[1].reasons).toEqual(['a', 'b'])
})

it('commits local actions', async () => {
  let store = createStore({ increment })

  await store.local({ type: 'increment' }, { reasons: ['test'] })
  expect(store.log.store.created[0][0]).toEqual({ type: 'increment' })
  expect(store.log.store.created[0][1].tab).toEqual(store.client.tabId)
  expect(store.log.store.created[0][1].reasons).toEqual(['test'])
})

it('allows to miss meta for local actions', async () => {
  let store = createStore({ increment })
  store.log.on('preadd', (action, meta) => {
    meta.reasons.push('preadd')
  })
  await store.local({ type: 'increment' })
  expect(store.log.store.created[0][0]).toEqual({ type: 'increment' })
})

it('commits sync actions', async () => {
  let store = createStore({ increment })

  store.sync({ type: 'increment' }, { reasons: ['test'] })
  await delay(1)
  let log = store.log.store.created
  expect(log[0][0]).toEqual({ type: 'increment' })
  expect(log[0][1].sync).toBe(true)
  expect(log[0][1].reasons).toEqual(['test', 'syncing'])
})

it('cleans sync action after processing', async () => {
  jest.spyOn(console, 'warn').mockImplementation(() => {})
  let pair = new TestPair()
  let store = createStore({ increment }, { server: pair.left })
  let resultA, resultB

  store.sync({ type: 'A' }).then(() => {
    resultA = 'processed'
  }).catch(e => {
    expect(e.message).toContain('undid')
    expect(e.message).toContain('because of error')
    resultA = e.action.reason
  })

  store.sync({ type: 'B' }, { id: '3 10:1:1 0' }).then(() => {
    resultB = 'processed'
  }).catch(e => {
    expect(e.message).toContain('undid')
    expect(e.message).toContain('because of error')
    resultB = e.action.reason
  })

  store.log.removeReason('timeTravel')
  await store.log.add({ type: 'logux/processed', id: '0 10:1:1 0' })
  expect(resultA).toBeUndefined()
  expect(resultB).toBeUndefined()
  expect(store.log.actions()).toEqual([{ type: 'A' }, { type: 'B' }])
  await store.log.add({ type: 'logux/processed', id: '1 10:1:1 0' })
  expect(resultA).toEqual('processed')
  expect(resultB).toBeUndefined()
  expect(store.log.actions()).toEqual([{ type: 'B' }])
  store.log.add({ type: 'logux/undo', reason: 'error', id: '3 10:1:1 0' })
  await delay(1)
  expect(resultB).toEqual('error')
  expect(store.log.actions()).toEqual([])
  expect(console.warn).not.toHaveBeenCalled()
})

it('applies old actions from store', async () => {
  let store1 = createStore({ historyLine }, { reasonlessHistory: 2 })
  let store2

  await Promise.all([
    store1.commit.crossTab(
      { type: 'historyLine', value: '1' }, { id: '0 10:x 1', reasons: ['test'] }
    ),
    store1.commit.crossTab(
      { type: 'historyLine', value: '2' }, { id: '0 10:x 2', reasons: ['test'] }
    ),
    store1.commit.crossTab(
      { type: 'historyLine', value: '3' }, { id: '0 10:x 3', reasons: ['test'] }
    ),
    store1.commit.crossTab(
      { type: 'historyLine', value: '4' }, { id: '0 10:x 4', reasons: ['test'] }
    ),
    store1.log.add(
      { type: 'historyLine', value: '5' },
      { id: '0 10:x 5', reasons: ['test'], tab: 'test2' }
    ),
    store1.commit.crossTab(
      { type: 'logux/undo', id: '0 10:x 2' },
      { id: '0 10:x 6', reasons: ['test'] }
    )
  ])
  store2 = createStore({ historyLine }, { store: store1.log.store })

  store2.commit({ type: 'historyLine', value: 'a' })
  store2.commit({ type: 'historyLine', value: 'b' })
  store2.commit.crossTab(
    { type: 'historyLine', value: 'c' }, { reasons: ['test'] }
  )
  store2.commit({ type: 'historyLine', value: 'd' })
  store2.commit({ type: 'historyLine', value: 'e' })
  expect(store2.state.value).toEqual('0abde')

  await store2.initialize
  expect(store2.state.value).toEqual('0134abcde')
})

it('applies old actions from store in modules', async () => {
  let store1 = createStoreWithModule(
    false,
    { 'user/historyLine': historyLine },
    { reasonlessHistory: 2 }
  )
  let store2

  await Promise.all([
    store1.commit.crossTab(
      { type: 'user/historyLine', value: '1' },
      { id: '0 10:x 1', reasons: ['test'] }
    ),
    store1.commit.crossTab(
      { type: 'user/historyLine', value: '2' },
      { id: '0 10:x 2', reasons: ['test'] }
    ),
    store1.commit.crossTab(
      { type: 'user/historyLine', value: '3' },
      { id: '0 10:x 3', reasons: ['test'] }
    ),
    store1.commit.crossTab(
      { type: 'user/historyLine', value: '4' },
      { id: '0 10:x 4', reasons: ['test'] }
    ),
    store1.log.add(
      { type: 'user/historyLine', value: '5' },
      { id: '0 10:x 5', reasons: ['test'], tab: 'test2' }
    ),
    store1.commit.crossTab(
      { type: 'logux/undo', id: '0 10:x 2' },
      { id: '0 10:x 6', reasons: ['test'] }
    )
  ])
  store2 = createStoreWithModule(
    false,
    { 'user/historyLine': historyLine },
    { store: store1.log.store }
  )

  store2.commit({ type: 'user/historyLine', value: 'a' })
  store2.commit({ type: 'user/historyLine', value: 'b' })
  store2.commit.crossTab(
    { type: 'user/historyLine', value: 'c' }, { reasons: ['test'] }
  )
  store2.commit({ type: 'user/historyLine', value: 'd' })
  store2.commit({ type: 'user/historyLine', value: 'e' })
  expect(store2.state.user.value).toEqual('0abde')

  await store2.initialize
  expect(store2.state.user.value).toEqual('0134abcde')
})

it('applies old actions from store in namespaced modules', async () => {
  let store1 = createStoreWithModule(
    true,
    { historyLine },
    { reasonlessHistory: 2 }
  )
  let store2

  await Promise.all([
    store1.commit.crossTab(
      { type: 'user/historyLine', value: '1' },
      { id: '0 10:x 1', reasons: ['test'] }
    ),
    store1.commit.crossTab(
      { type: 'user/historyLine', value: '2' },
      { id: '0 10:x 2', reasons: ['test'] }
    ),
    store1.commit.crossTab(
      { type: 'user/historyLine', value: '3' },
      { id: '0 10:x 3', reasons: ['test'] }
    ),
    store1.commit.crossTab(
      { type: 'user/historyLine', value: '4' },
      { id: '0 10:x 4', reasons: ['test'] }
    ),
    store1.log.add(
      { type: 'user/historyLine', value: '5' },
      { id: '0 10:x 5', reasons: ['test'], tab: 'test2' }
    ),
    store1.commit.crossTab(
      { type: 'logux/undo', id: '0 10:x 2' },
      { id: '0 10:x 6', reasons: ['test'] }
    )
  ])
  store2 = createStoreWithModule(
    true,
    { historyLine },
    { store: store1.log.store }
  )

  store2.commit({ type: 'user/historyLine', value: 'a' })
  store2.commit({ type: 'user/historyLine', value: 'b' })
  store2.commit.crossTab(
    { type: 'user/historyLine', value: 'c' }, { reasons: ['test'] }
  )
  store2.commit({ type: 'user/historyLine', value: 'd' })
  store2.commit({ type: 'user/historyLine', value: 'e' })
  expect(store2.state.user.value).toEqual('0abde')

  await store2.initialize
  expect(store2.state.user.value).toEqual('0134abcde')
})

it('applies old actions from store in nested modules', async () => {
  let Logux1 = initLogux()
  let store1 = new Logux1.Store({
    state: { value: 0 },
    mutations: { historyLine },
    modules: {
      a: {
        namespaced: true,
        state: { value: 0 },
        mutations: { historyLine },
        modules: {
          b: {
            state: { value: 0 },
            mutations: { historyLine },
            modules: {
              c: {
                namespaced: true,
                state: { value: 0 },
                mutations: { historyLine },
                modules: {
                  d: {
                    namespaced: true,
                    state: { value: 0 },
                    mutations: { historyLine }
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  await Promise.all([
    store1.commit.crossTab('historyLine', '1', {
      id: '0 10:x 1', reasons: ['test']
    }),
    store1.commit.crossTab('a/historyLine', '2', {
      id: '0 10:x 2', reasons: ['test']
    }),
    store1.commit.crossTab('a/c/d/historyLine', '3', {
      id: '0 10:x 3', reasons: ['test']
    })
  ])

  let Logux2 = initLogux({ store: store1.log.store })
  let store2 = new Logux2.Store({
    state: { value: 0 },
    mutations: { historyLine },
    modules: {
      a: {
        namespaced: true,
        state: { value: 0 },
        mutations: { historyLine },
        modules: {
          b: {
            state: { value: 0 },
            mutations: { historyLine },
            modules: {
              c: {
                namespaced: true,
                state: { value: 0 },
                mutations: { historyLine },
                modules: {
                  d: {
                    namespaced: true,
                    state: { value: 0 },
                    mutations: { historyLine }
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  store2.commit('historyLine', 'a')
  expect(store2.state.value).toBe('0a')
  expect(store2.state.a.value).toBe(0)
  expect(store2.state.a.b.value).toBe(0)

  store2.commit('a/historyLine', 'b')
  expect(store2.state.value).toBe('0a')
  expect(store2.state.a.value).toBe('0b')
  expect(store2.state.a.b.value).toBe('0b')
  expect(store2.state.a.b.c.value).toBe(0)

  store2.commit('a/c/d/historyLine', 'd')
  expect(store2.state.value).toBe('0a')
  expect(store2.state.a.value).toBe('0b')
  expect(store2.state.a.b.value).toBe('0b')
  expect(store2.state.a.b.c.value).toBe(0)
  expect(store2.state.a.b.c.d.value).toBe('0d')

  await store2.initialize
  expect(store2.state.value).toBe('01a')
  expect(store2.state.a.value).toBe('02b')
  expect(store2.state.a.b.value).toBe('02b')
  expect(store2.state.a.b.c.value).toBe(0)
  expect(store2.state.a.b.c.d.value).toBe('03d')
})

it('waits for replaying', async () => {
  let store = createStore({ historyLine })
  let run
  let waiting = new Promise(resolve => {
    run = resolve
  })

  let first = true
  let originEach = store.log.each
  store.log.each = async function (...args) {
    let result = originEach.apply(this, args)
    if (first) {
      first = false
      await waiting
    }
    return result
  }

  await store.crossTab(
    { type: 'historyLine', value: 'b' }, { reasons: ['t'] }
  )
  await store.crossTab(
    { type: 'historyLine', value: 'a' }, { id: '0 test 0', reasons: ['t'] }
  )
  await Promise.all([
    store.crossTab(
      { type: 'historyLine', value: 'c' }, { reasons: ['o'] }
    ),
    store.crossTab(
      { type: 'historyLine', value: 'd' }, { reasons: ['t'] }
    )
  ])
  delay(1)
  expect(store.state.value).toEqual('0b')
  store.log.removeReason('o')
  run()
  await delay(10)
  expect(store.state.value).toEqual('0abd')
})

it('emits change event', async () => {
  let store = createStore({ historyLine })

  store.log.on('preadd', (action, meta) => {
    meta.reasons.push('test')
  })

  let calls = []
  store.on('change', (state, prevState, action, meta) => {
    expect(typeof meta.id).toEqual('string')
    calls.push([state, prevState, action])
  })

  store.commit({ type: 'historyLine', value: 'a' })
  store.local({ type: 'historyLine', value: 'c' })
  store.local(
    { type: 'historyLine', value: 'b' }, { id: '1 10:test1 1' }
  )
  await delay(10)
  expect(calls).toEqual([
    [
      { value: '0a' },
      { value: 0 },
      { type: 'historyLine', value: 'a' }
    ],
    [
      { value: '0ac' },
      { value: '0a' },
      { type: 'historyLine', value: 'c' }
    ],
    [
      { value: '0abc' },
      { value: '0ac' },
      { type: 'historyLine', value: 'b' }
    ]
  ])
})

it('warns about undoes cleaned action', async () => {
  let store = createStore({ increment })

  await store.crossTab({ type: 'logux/undo', id: '1 t 0' })
  expect(store.log.actions()).toHaveLength(0)
})

it('does not put reason on request', async () => {
  let store = createStore(increment)

  await store.crossTab({ type: 'A' }, { noAutoReason: true })
  await store.crossTab({ type: 'B' })
  expect(store.log.actions()).toEqual([{ type: 'B' }])

  await store.crossTab({ type: 'a' }, { reasons: ['a'] })
  await store.crossTab({ type: 'b' }, { keepLast: 'b' })
  expect(store.log.actions()).toEqual([
    { type: 'B' }, { type: 'a' }, { type: 'b' }
  ])
  expect(store.log.entries()[1][1].noAutoReason).toBe(true)
  expect(store.log.entries()[2][1].noAutoReason).toBe(true)
})
