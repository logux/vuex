/* eslint-disable jest/no-conditional-expect */
import { TestTime } from '@logux/core'
import { jest } from '@jest/globals'
import Vuex from 'vuex'
import Vue from 'vue'

import { createLogux } from './index.js'

Vue.config.productionTip = false
Vue.config.devtools = false
Vue.use(Vuex)

function increment (state) {
  state.value = state.value + 1
}

it('creates Vuex store', () => {
  let spy = jest.spyOn(console, 'warn').mockImplementation(() => {})

  let Logux = createLogux({
    server: 'wss://localhost:1337',
    subprotocol: '1.0.0',
    userId: '10',
    time: new TestTime()
  })
  let store = new Logux.Store({ state: { value: 0 }, mutations: { increment } })
  store.commit({ type: 'increment' })
  expect(store.state).toEqual({ value: 1 })
  // eslint-disable-next-line no-console
  expect(spy.mock.calls).toHaveLength(1)
})
