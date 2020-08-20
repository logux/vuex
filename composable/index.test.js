let {
  h,
  ref,
  toRefs,
  computed,
  nextTick,
  Fragment
} = require('vue')
let { delay } = require('nanodelay')
let { mount } = require('@vue/test-utils')
let { TestTime } = require('@logux/core')

let {
  CrossTabClient,
  useSubscription,
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
        UserPhoto
      }
    }
  })
  wrapper.client = store.client
  return wrapper
}

let UserPhoto = {
  props: {
    id: String
  },
  setup (props) {
    let { id } = toRefs(props)
    let src = computed(() => `${id.value}.jpg`)

    let isSubscribing = useSubscription(() => {
      return [
        { channel: `users/${id.value}`, fields: ['photo'] }
      ]
    })

    return {
      src,
      isSubscribing
    }
  },
  template: `
    <img :issubscribing="isSubscribing" :src="src" />
  `
}

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
  let User = {
    props: {
      id: String
    },
    setup ({ id }) {
      useSubscription([`users/${id}`, `users/${id}/comments`])
      return () => h('div')
    }
  }
  let component = createComponent({
    render () {
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
        <user-photo
          v-for="(u, k) in users"
          :id="u"
          :key="k"
        ></user-photo>
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
  let Profile = {
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
  expect(resubscriptions).toEqual(0)
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
        <user-photo :id="id"></user-photo>
      </div>
    `
  })

  let isSubscribing = () => component.find('img').attributes('issubscribing')
  let nodeId = component.client.nodeId
  let log = component.client.log

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

it('works on channels size changes', async () => {
  jest.spyOn(console, 'error')

  let UserList = {
    props: {
      ids: Array
    },
    setup (props) {
      let { ids } = toRefs(props)

      let isSubscribing = useSubscription(() => {
        return ids.value.map(id => `users/${id}`)
      })

      return () => h('div', {
        isSubscribing: isSubscribing.value
      })
    }
  }

  let component = createComponent({
    components: { UserList },
    setup () {
      let ids = ref([1])

      function change (e) {
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
  expect(console.error).not.toHaveBeenCalled()
})

it('reports about subscription end with non-reactive channels', async () => {
  let User = {
    props: {
      id: String
    },
    setup ({ id }) {
      let isSubscribing = useSubscription([`users/${id}`])
      return () => h('div', {
        isSubscribing: isSubscribing.value
      })
    }
  }
  let component = createComponent({
    props: {
      ids: Array
    },
    setup (props) {
      let { ids } = toRefs(props)
      return () => h(Fragment, ids.value.map(id => h(User, { id })))
    }
  }, {
    props: {
      ids: ['1', '2', '3']
    }
  })

  let isSubscribing = () => component.findAll('div').map(el => el.attributes('issubscribing'))
  let nodeId = component.client.nodeId
  let log = component.client.log

  expect(isSubscribing()).toEqual(["true", "true", "true"])

  log.add({ type: 'logux/processed', id: `2 ${nodeId} 0` })
  await delay(10)
  expect(isSubscribing()).toEqual(["true", "false", "true"])

  await component.setProps({ ids: ['1', '2'] })
  expect(isSubscribing()).toEqual(["true", "false"])
})

it('don’t resubscribe on the same channel', async () => {
  let component = createComponent({
    props: {
      id: Number
    },
    setup (props) {
      useSubscription(() => [`users/${props.id}`])
      return () => h('div')
    }
  }, {
    props: {
      id: 1
    }
  })

  await component.setProps({ id: 1 })
  expect(component.client.log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'users/1' }
  ])
})
