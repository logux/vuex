let Vuex = require('vuex')
let { TestTime } = require('@logux/core')
let { mount, createLocalVue } = require('@vue/test-utils')
let { delay } = require('nanodelay')

let { createLogux, loguxComponent: subscribe } = require('..')

let localVue = createLocalVue()

localVue.use(Vuex)

function createComponent (component, options) {
  let Logux = createLogux({
    subprotocol: '1.0.0',
    server: 'wss://localhost:1337',
    userId: '',
    time: new TestTime()
  })
  let store = new Logux.Store(() => ({ }))
  let wrapper = mount(component, { store, localVue, ...options })
  wrapper.client = store.client
  return wrapper
}

let UserPhoto = {
  name: 'UserPhoto',
  props: ['id', 'isSubscribing'],
  render (h) {
    return h('img', {
      attrs: {
        isSubscribing: this.isSubscribing,
        src: `${ this.id }.jpg`
      }
    })
  }
}

let SubscribeUserPhoto = {
  name: 'SubscribeUserPhoto',
  props: ['id'],
  render (h) {
    return h(subscribe, {
      props: {
        channels: [{ channel: `users/${ this.id }`, fields: ['photo'] }]
      },
      scopedSlots: {
        default: props => h(UserPhoto, {
          props: { ...props, id: this.id }
        })
      }
    })
  }
}

it('throw empty scoped slot', () => {
  jest.spyOn(console, 'error').mockImplementation()

  expect(() => {
    createComponent({
      render (h) {
        return h(subscribe, {
          props: { channels: ['users'] }
        })
      }
    })
  }).toThrow('Provided scoped slot is empty')
})

it('returns wrapped component', () => {
  let component = createComponent(SubscribeUserPhoto, {
    propsData: { id: '1' }
  })
  expect(component.findComponent(UserPhoto).exists()).toBe(true)
  expect(component.html()).toBe('<img issubscribing="true" src="1.jpg">')
})

it('subscribes', async () => {
  let User = {}
  let SubscribeUser = {
    props: ['id'],
    render (h) {
      return h(subscribe, {
        props: {
          channels: [`users/${ this.id }`]
        }
      }, [User])
    }
  }
  let component = createComponent({
    render (h) {
      return h('div', [
        h(SubscribeUser, {
          props: { id: 1, key: 1 }
        }),
        h(SubscribeUser, {
          props: { id: 1, key: 2 }
        }),
        h(SubscribeUser, {
          props: { id: 2, key: 3 }
        })
      ])
    }
  })
  await delay(1)
  expect(component.client.log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'users/1' },
    { type: 'logux/subscribe', channel: 'users/2' }
  ])
})

it('subscribes by channel name', async () => {
  let User = {}
  let SubscribeUser = {
    render (h) {
      return h(subscribe, {
        props: {
          channels: ['users']
        }
      }, [User])
    }
  }
  let component = createComponent({
    render (h) {
      return h('div', [
        h(SubscribeUser, { props: { key: 1 } }),
        h(SubscribeUser, { props: { key: 2 } })
      ])
    }
  })
  await delay(1)
  expect(component.client.log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'users' }
  ])
})

it('unsubscribes', async () => {
  let UserList = {
    data: () => ({
      users: { a: 1, b: 1, c: 2 }
    }),
    methods: {
      change ($e) {
        this.users = $e.users
      }
    },
    render (h) {
      return h('div', {
        on: {
          click: this.change
        }
      }, Object.keys(this.users).map(key => {
        return h(SubscribeUserPhoto, {
          props: { id: this.users[key], key }
        })
      }))
    }
  }
  let component = createComponent(UserList)
  await delay(1)
  expect(component.client.log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'users/1', fields: ['photo'] },
    { type: 'logux/subscribe', channel: 'users/2', fields: ['photo'] }
  ])
  component.trigger('click', { users: { a: 1, c: 2 } })
  await delay(1)
  expect(component.client.log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'users/1', fields: ['photo'] },
    { type: 'logux/subscribe', channel: 'users/2', fields: ['photo'] },
    { type: 'logux/unsubscribe', channel: 'users/2', fields: ['photo'] },
    { type: 'logux/subscribe', channel: 'users/2', fields: ['photo'] }
  ])
  component.trigger('click', { users: { a: 1 } })
  await delay(1)
  expect(component.client.log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'users/1', fields: ['photo'] },
    { type: 'logux/subscribe', channel: 'users/2', fields: ['photo'] },
    { type: 'logux/unsubscribe', channel: 'users/2', fields: ['photo'] },
    { type: 'logux/subscribe', channel: 'users/2', fields: ['photo'] },
    { type: 'logux/unsubscribe', channel: 'users/2', fields: ['photo'] }
  ])
})

it('changes subscription', async () => {
  let component = createComponent({
    data: () => ({ id: 1 }),
    methods: {
      change ($e) {
        this.id = $e.id
      }
    },
    render (h) {
      return h('div', {
        on: { click: this.change }
      }, [
        h(SubscribeUserPhoto, {
          props: { id: this.id }
        })
      ])
    }
  })
  await delay(1)
  expect(component.client.log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'users/1', fields: ['photo'] }
  ])
  component.trigger('click', { id: 2 })
  await delay(1)
  expect(component.client.log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'users/1', fields: ['photo'] },
    { type: 'logux/subscribe', channel: 'users/2', fields: ['photo'] },
    { type: 'logux/unsubscribe', channel: 'users/1', fields: ['photo'] }
  ])
})

it('does not resubscribe on non-relevant props changes', () => {
  let component = createComponent({
    data: () => ({ id: 1 }),
    methods: {
      change ($e) {
        this.id = $e.id
      }
    },
    render (h) {
      return h('div', {
        on: { click: this.change }
      }, [
        h(SubscribeUserPhoto, {
          props: { id: 1, nonId: this.id }
        })
      ])
    }
  })

  let resubscriptions = 0
  component.client.log.on('add', () => {
    resubscriptions += 1
  })

  component.trigger('click', { id: 2 })
  expect(resubscriptions).toEqual(0)
})

it('supports multiple channels', async () => {
  let User = {}
  let SubscribeUser = {
    props: ['id'],
    render (h) {
      return h(subscribe, {
        props: {
          channels: [
            `users/${ this.id }`,
            `pictures/${ this.id }`
          ]
        }
      }, [User])
    }
  }
  let component = createComponent({
    render (h) {
      return h('div', [
        h(SubscribeUser, { props: { id: 1, key: 1 } }),
        h(SubscribeUser, { props: { id: 1, key: 2 } }),
        h(SubscribeUser, { props: { id: 2, key: 3 } })
      ])
    }
  })
  await delay(1)
  expect(component.client.log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'users/1' },
    { type: 'logux/subscribe', channel: 'pictures/1' },
    { type: 'logux/subscribe', channel: 'users/2' },
    { type: 'logux/subscribe', channel: 'pictures/2' }
  ])
})

it('reports about subscription end', async () => {
  let component = createComponent({
    data: () => ({
      id: 1
    }),
    methods: {
      change ($e) {
        this.id = $e.id
      }
    },
    render (h) {
      return h('div', {
        on: { click: this.change }
      }, [
        h(SubscribeUserPhoto, { props: { id: this.id } })
      ])
    }
  })

  let nodeId = component.client.nodeId
  let log = component.client.log

  await delay(1)
  expect(component.findComponent(subscribe).vm.$data.isSubscribing).toBe(true)

  component.trigger('click', { id: 1 })
  await delay(1)
  expect(component.findComponent(subscribe).vm.$data.isSubscribing).toBe(true)

  component.trigger('click', { id: 2 })
  await delay(1)
  expect(component.findComponent(subscribe).vm.$data.isSubscribing).toBe(true)

  log.add({ type: 'logux/processed', id: `1 ${ nodeId } 0` })
  await delay(1)
  expect(component.findComponent(subscribe).vm.$data.isSubscribing).toBe(true)

  log.add({ type: 'logux/processed', id: `2 ${ nodeId } 0` })
  await delay(1)
  expect(component.findComponent(subscribe).vm.$data.isSubscribing).toBe(false)
})

it('functional channels', async () => {
  let SubscribeUserList = {
    props: ['ids'],
    render (h) {
      return h(subscribe, {
        props: {
          channels: this.ids.map(id => `users/${ id }`)
        }
      }, [h('div')])
    }
  }

  let component = createComponent({
    data: () => ({ ids: [1] }),
    methods: {
      change ($e) {
        this.ids = $e.ids
      }
    },
    render (h) {
      return h('div', {
        on: { click: this.change }
      }, [
        h(SubscribeUserList, { props: { ids: this.ids } })
      ])
    }
  })
  await localVue.nextTick()
  component.trigger('click', { ids: [1, 2] })
  await delay(10)
  expect(component.client.log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'users/1' },
    { type: 'logux/subscribe', channel: 'users/2' }
  ])
})

it('avoid the same channels 123', async () => {
  let component = createComponent({
    data: () => ({ ids: [1] }),
    methods: {
      change ($e) {
        this.ids = $e.ids
      }
    },
    render (h) {
      return h(subscribe, {
        props: {
          channels: this.ids.map(id => `users/${ id }`)
        },
        scopedSlots: {
          default: () => {
            return h('div', {
              on: { click: this.change }
            })
          }
        }
      })
    }
  })

  component.trigger('click', { ids: [1, 2] })
  await localVue.nextTick()
  expect(component.client.log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'users/1' },
    { type: 'logux/subscribe', channel: 'users/2' }
  ])

  component.trigger('click', { ids: [1, 2] })
  await localVue.nextTick()
  expect(component.client.log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'users/1' },
    { type: 'logux/subscribe', channel: 'users/2' }
  ])
})
