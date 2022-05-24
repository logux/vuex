import {
  h,
  ref,
  toRefs,
  reactive,
  computed,
  nextTick,
  Fragment,
  defineComponent,
  ComponentPublicInstance
} from 'vue'
import { CrossTabClient, ClientMeta } from '@logux/client'
import { mount, VueWrapper } from '@vue/test-utils'
import { TestLog, TestTime } from '@logux/core'
import { delay } from 'nanodelay'
import { jest } from '@jest/globals'

import { useStore, useSubscription, createStoreCreator } from '../index.js'

interface ExtendedComponent extends VueWrapper<ComponentPublicInstance> {
  client?: any
}

function createComponent(component: any, options?: any): ExtendedComponent {
  let client = new CrossTabClient<{}, TestLog<ClientMeta>>({
    server: 'wss://localhost:1337',
    subprotocol: '1.0.0',
    userId: '10',
    time: new TestTime()
  })
  let createStore = createStoreCreator(client)
  let store = createStore({})
  let wrapper: ExtendedComponent = mount(component, {
    ...options,
    global: {
      plugins: [store],
      components: {
        UserPhoto
      }
    }
  })
  wrapper.client = store.client
  return wrapper
}

let UserPhoto = defineComponent({
  props: {
    id: { type: String, required: true },
    debounce: { type: Number, default: 0 }
  },
  setup(props) {
    let { id, debounce } = toRefs(props)
    let src = computed(() => `${id.value}.jpg`)

    let isSubscribing = useSubscription(
      computed(() => {
        return [{ channel: `users/${id.value}`, fields: ['photo'] }]
      }),
      { debounce: debounce.value }
    )

    return {
      src,
      isSubscribing
    }
  },
  template: `
    <img :issubscribing="isSubscribing" :src="src" />
  `
})

it('subscribes', async () => {
  let component = createComponent({
    template: `
      <div>
        <user-photo :id="'1'"></user-photo>
        <user-photo :id="'1'"></user-photo>
        <user-photo :id="'2'"></user-photo>
      </div>
    `
  })
  await delay(1)
  expect(component.client.log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'users/1', fields: ['photo'] },
    { type: 'logux/subscribe', channel: 'users/2', fields: ['photo'] }
  ])
})

it('accepts channel names', async () => {
  let User = defineComponent({
    props: ['id'],
    setup({ id }) {
      useSubscription([`users/${id}`, `users/${id}/comments`])
      return () => h('div')
    }
  })
  let component = createComponent({
    render() {
      return h('div', [h(User, { id: '1' })])
    }
  })
  await delay(1)
  expect(component.client.log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'users/1' },
    { type: 'logux/subscribe', channel: 'users/1/comments' }
  ])
})

it('unsubscribes', async () => {
  let UserList = defineComponent({
    setup() {
      let state = reactive({
        users: {}
      })
      state.users = { a: '1', b: '1', c: '2' }

      function change(e: Event & { users: string }): void {
        state.users = e.users
      }

      return {
        ...toRefs(state),
        change
      }
    },
    template: `
      <div @click="change">
        <user-photo
          v-for="(u, k) in users"
          :id="u"
          :key="k"
        ></user-photo>
      </div>
    `
  })

  let component = createComponent(UserList)
  let log = component.client.log

  expect(log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'users/1', fields: ['photo'] },
    { type: 'logux/subscribe', channel: 'users/2', fields: ['photo'] }
  ])

  component.trigger('click', { users: { a: '1', c: '2' } })
  await nextTick()
  expect(log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'users/1', fields: ['photo'] },
    { type: 'logux/subscribe', channel: 'users/2', fields: ['photo'] }
  ])

  component.trigger('click', { users: { a: '1' } })
  await nextTick()
  expect(log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'users/1', fields: ['photo'] },
    { type: 'logux/subscribe', channel: 'users/2', fields: ['photo'] },
    { type: 'logux/unsubscribe', channel: 'users/2', fields: ['photo'] }
  ])
})

it('changes subscription', async () => {
  let Profile = {
    setup() {
      let id = ref('1')

      function change(e: Event & { id: string }): void {
        id.value = e.id
      }

      return {
        id,
        change
      }
    },
    template: `
      <div @click="change">
        <user-photo :id="id"></user-photo>
      </div>
    `
  }

  let component = createComponent(Profile)
  let log = component.client.log

  expect(log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'users/1', fields: ['photo'] }
  ])

  component.trigger('click', { id: '2' })
  await nextTick()
  expect(log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'users/1', fields: ['photo'] },
    { type: 'logux/unsubscribe', channel: 'users/1', fields: ['photo'] },
    { type: 'logux/subscribe', channel: 'users/2', fields: ['photo'] }
  ])
})

it('does not resubscribe on non-relevant props changes', async () => {
  let component = createComponent({
    setup() {
      let id = ref('1')

      function change(e: Event & { id: string }): void {
        id.value = e.id
      }

      return {
        id,
        change
      }
    },
    template: `
      <div @click="change">
        <user-photo :id="'1'" :nonId="id"></user-photo>
      </div>
    `
  })

  let resubscriptions = 0
  component.client.log.on('add', () => {
    resubscriptions += 1
  })

  component.trigger('click', { id: 2 })
  await nextTick()
  expect(resubscriptions).toBe(0)
})

it('reports about subscription end', async () => {
  let component = createComponent({
    setup() {
      let id = ref('1')

      function change(e: Event & { id: string }): void {
        id.value = e.id
      }

      return {
        id,
        change
      }
    },
    template: `
      <div @click="change">
        <user-photo :id="id" :debounce="250"></user-photo>
      </div>
    `
  })

  let isSubscribing = (): string | undefined =>
    component.find('img').attributes('issubscribing')
  let nodeId = component.client.nodeId
  let log = component.client.log

  expect(isSubscribing()).toBe('true')

  component.trigger('click', { id: '1' })
  await nextTick()
  expect(isSubscribing()).toBe('true')

  component.trigger('click', { id: '2' })
  await nextTick()
  expect(isSubscribing()).toBe('true')

  log.add({ type: 'logux/processed', id: `1 ${nodeId} 0` })
  await delay(10)
  expect(isSubscribing()).toBe('true')

  log.add({ type: 'logux/processed', id: `3 ${nodeId} 0` })
  await delay(10)
  expect(isSubscribing()).toBe('false')

  component.trigger('click', { id: '3' })
  await nextTick()
  expect(isSubscribing()).toBe('false')

  log.add({ type: 'logux/processed', id: `7 ${nodeId} 0` })
  await delay(10)
  expect(isSubscribing()).toBe('false')

  component.trigger('click', { id: '4' })
  await nextTick()
  expect(isSubscribing()).toBe('false')

  component.trigger('click', { id: '5' })
  await nextTick()
  expect(isSubscribing()).toBe('false')

  await delay(250)
  expect(isSubscribing()).toBe('true')

  log.add({ type: 'logux/processed', id: `10 ${nodeId} 0` })
  await delay(10)
  expect(isSubscribing()).toBe('true')

  log.add({ type: 'logux/processed', id: `12 ${nodeId} 0` })
  await delay(10)
  expect(isSubscribing()).toBe('false')
})

it('works on channels size changes', async () => {
  jest.spyOn(console, 'error')

  let UserList = defineComponent({
    props: ['ids'],
    setup(props) {
      let { ids } = toRefs(props)

      let isSubscribing = useSubscription(
        computed(() => {
          if (typeof ids === 'undefined') return []
          return ids.value.map((id: string) => `users/${id}`)
        })
      )

      return () =>
        h('div', {
          isSubscribing: isSubscribing.value
        })
    }
  })

  let component = createComponent({
    components: { UserList },
    setup() {
      let ids = ref([1])

      function change(e: Event & { ids: number[] }): void {
        ids.value = e.ids
      }

      return {
        ids,
        change
      }
    },
    template: `
      <div @click="change">
        <user-list :ids="ids"></user-list>
      </div>
    `
  })

  component.trigger('click', { ids: [1, 2] })
  await nextTick()
  // eslint-disable-next-line no-console
  expect(console.error).not.toHaveBeenCalled()
})

it('reports about subscription end with non-reactive channels', async () => {
  let User = defineComponent({
    props: ['id'],
    setup({ id }) {
      let isSubscribing = useSubscription([`users/${id}`])
      return () =>
        h('li', {
          isSubscribing: isSubscribing.value
        })
    }
  })

  let List = defineComponent({
    props: {
      ids: { type: Array, required: true }
    },
    setup(props) {
      let { ids } = toRefs(props)
      return () =>
        h(
          Fragment,
          ids.value.map(id => h(User, { id }))
        )
    }
  })

  let component = createComponent(List, {
    props: {
      ids: ['1', '2', '3']
    }
  })

  let isSubscribing = (): (string | undefined)[] =>
    component.findAll('li').map(el => el.attributes('issubscribing'))
  let nodeId = component.client.nodeId
  let log = component.client.log

  expect(isSubscribing()).toEqual(['true', 'true', 'true'])

  log.add({ type: 'logux/processed', id: `2 ${nodeId} 0` })
  await delay(10)
  expect(isSubscribing()).toEqual(['true', 'false', 'true'])

  await component.setProps({ ids: ['1', '2'] })
  expect(isSubscribing()).toEqual(['true', 'false'])
})

it('don’t resubscribe on the same channel', async () => {
  let List = defineComponent({
    props: {
      ids: { type: Array, required: true }
    },
    setup(props) {
      useSubscription(computed(() => props.ids.map(id => `users/${id}`)))
      return () => h('div')
    }
  })

  let component = createComponent(List, {
    props: {
      ids: [0, 1, 2]
    }
  })

  await component.setProps({ ids: [0, 1, 2] })
  expect(component.client.log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'users/0' },
    { type: 'logux/subscribe', channel: 'users/1' },
    { type: 'logux/subscribe', channel: 'users/2' }
  ])
})

it('supports different store sources', async () => {
  let component = createComponent({
    setup() {
      let store = useStore()

      async function subscribe(): Promise<void> {
        await nextTick()
        useSubscription(
          computed(() => ['users']),
          { store }
        )
      }
      subscribe()

      return () => h('div')
    }
  })

  await delay(10)
  expect(component.client.log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'users' }
  ])
})
