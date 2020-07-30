let {
  ref,
  toRefs,
  nextTick,
  computed
} = require('vue')
let { delay } = require('nanodelay')
let { mount } = require('@vue/test-utils')
let { TestTime } = require('@logux/core')

let {
  loguxComponent,
  CrossTabClient,
  createStoreCreator
} = require('..')

function createComponent (component, options) {
  let client = new CrossTabClient({
    server: 'wss://localhost:1337',
    subprotocol: '1.0.0',
    userId: '10',
    time: new TestTime()
  })
  let createStore = createStoreCreator(client)
  let store = createStore()
  let wrapper = mount(component, {
    ...options,
    global: {
      plugins: [store],
      components: {
        UserPhoto,
        loguxComponent,
        SubscribeUserPhoto
      }
    }
  })
  wrapper.client = store.client
  return wrapper
}

let UserPhoto = {
  name: 'UserPhoto',
  props: {
    id: String,
    isSubscribing: Boolean
  },
  setup (props) {
    let {
      id,
      isSubscribing
    } = toRefs(props)
    let src = computed(() => `${id.value}.jpg`)
    return {
      src,
      isSubscribing
    }
  },
  template: `
    <img :issubscribing="isSubscribing" :src="src" />
  `
}

let SubscribeUserPhoto = {
  props: {
    id: String
  },
  setup (props) {
    let { id } = toRefs(props)
    let channels = computed(() => {
      return [
        { channel: `users/${id.value}`, fields: ['photo'] }
      ]
    })
    return {
      id,
      channels
    }
  },
  template: `
    <logux-component :channels="channels" v-slot="{ isSubscribing }">
      <user-photo
        :id="id"
        :isSubscribing="isSubscribing.value"
      ></user-photo>
    </logux-component>
  `
}

it('throw empty scoped slot', () => {
  jest.spyOn(console, 'warn').mockImplementation()
  jest.spyOn(console, 'error').mockImplementation()

  expect(() => {
    createComponent(loguxComponent, {
      props: {
        channels: ['users']
      }
    })
  }).toThrow('Provided scoped slot is empty')
})

it('returns wrapped component', async () => {
  let component = createComponent(SubscribeUserPhoto, {
    props: { id: '1' }
  })
  expect(component.findComponent({ name: 'UserPhoto' }).exists()).toBe(true)
  expect(component.html()).toBe('<img issubscribing="true" src="1.jpg">')
})

it('subscribes', async () => {
  let SubscribeUser = {
    props: {
      id: String
    },
    setup (props) {
      let { id } = toRefs(props)
      let channels = computed(() => {
        return [`users/${id.value}`]
      })
      return {
        id,
        channels
      }
    },
    template: `
      <logux-component :channels="channels"><div></div></logux-component>
    `
  }
  let component = createComponent({
    components: { SubscribeUser },
    template: `
      <subscribe-user :id="'1'"></subscribe-user>
      <subscribe-user :id="'1'"></subscribe-user>
      <subscribe-user :id="'2'"></subscribe-user>
    `
  })
  await nextTick()
  expect(component.client.log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'users/1' },
    { type: 'logux/subscribe', channel: 'users/2' }
  ])
})

it('subscribes by channel name', async () => {
  let SubscribeUser = {
    template: `
      <logux-component :channels="['users']"><div></div></logux-component>
    `
  }
  let component = createComponent({
    components: { SubscribeUser },
    template: `
      <subscribe-user></subscribe-user>
      <subscribe-user></subscribe-user>
    `
  })
  await delay(1)
  expect(component.client.log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'users' }
  ])
})

it('unsubscribes', async () => {
  let UserList = {
    setup () {
      let users = ref({ a: '1', b: '1', c: '2' })

      function change (e) {
        users.value = e.users
      }

      return {
        users,
        change
      }
    },
    template: `
      <div @click="change">
        <subscribe-user-photo
          v-for="(u, k) in users"
          :id="u"
          :key="k"
        ></subscribe-user-photo>
      </div>
    `
  }

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
  let component = createComponent({
    setup () {
      let id = ref('1')

      function change ({ id: newId }) {
        id.value = newId
      }

      return {
        id,
        change
      }
    },
    template: `
      <div @click="change">
        <subscribe-user-photo :id="id"></subscribe-user-photo>
      </div>
    `
  })

  expect(component.client.log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'users/1', fields: ['photo'] }
  ])

  component.trigger('click', { id: '2' })
  await nextTick()
  expect(component.client.log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'users/1', fields: ['photo'] },
    { type: 'logux/unsubscribe', channel: 'users/1', fields: ['photo'] },
    { type: 'logux/subscribe', channel: 'users/2', fields: ['photo'] }
  ])
})

it('does not resubscribe on non-relevant props changes', async () => {
  let component = createComponent({
    setup () {
      let id = ref('1')

      function change (e) {
        id.value = e.id
      }

      return {
        id,
        change
      }
    },
    template: `
      <div @click="change">
        <subscribe-user-photo :id="'1'" :nonId="id"></subscribe-user-photo>
      </div>
    `
  })

  let resubscriptions = 0
  component.client.log.on('add', () => {
    resubscriptions += 1
  })

  component.trigger('click', { id: 2 })
  await nextTick()
  expect(resubscriptions).toEqual(0)
})

it('supports multiple channels', async () => {
  let SubscribeUser = {
    props: {
      id: String
    },
    setup (props) {
      let { id } = toRefs(props)
      let channels = computed(() => {
        return [
          `users/${id.value}`,
          `pictures/${id.value}`
        ]
      })
      return { channels }
    },
    template: `
      <logux-component :channels="channels"><div></div></logux-component>
    `
  }
  let component = createComponent({
    components: { SubscribeUser },
    template: `
      <subscribe-user :id="'1'"></subscribe-user>
      <subscribe-user :id="'1'"></subscribe-user>
      <subscribe-user :id="'2'"></subscribe-user>
    `
  })
  expect(component.client.log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'users/1' },
    { type: 'logux/subscribe', channel: 'pictures/1' },
    { type: 'logux/subscribe', channel: 'users/2' },
    { type: 'logux/subscribe', channel: 'pictures/2' }
  ])
})

it('reports about subscription end', async () => {
  let component = createComponent({
    setup () {
      let id = ref('1')

      function change (e) {
        id.value = e.id
      }

      return {
        id,
        change
      }
    },
    template: `
      <div @click="change">
        <subscribe-user-photo :id="id"></subscribe-user-photo>
      </div>
    `
  })

  let isSubscribing = () => component.find('img').attributes('issubscribing')
  let nodeId = component.client.nodeId
  let log = component.client.log

  await nextTick()
  expect(isSubscribing()).toBe("true")

  component.trigger('click', { id: '1' })
  await nextTick()
  expect(isSubscribing()).toBe("true")

  component.trigger('click', { id: '2' })
  await nextTick()
  expect(isSubscribing()).toBe("true")

  log.add({ type: 'logux/processed', id: `1 ${nodeId} 0` })
  await delay(10)
  expect(isSubscribing()).toBe("true")

  log.add({ type: 'logux/processed', id: `3 ${nodeId} 0` })
  await delay(10)
  expect(isSubscribing()).toBe("false")
})
