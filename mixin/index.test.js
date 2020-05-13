let Vuex = require('vuex')
let { TestTime } = require('@logux/core')
let { mount, createLocalVue } = require('@vue/test-utils')
let { delay } = require('nanodelay')

let { createLogux, loguxMixin } = require('..')

let localVue = createLocalVue()

localVue.use(Vuex)

function createComponent (content) {
  let Logux = createLogux({
    subprotocol: '1.0.0',
    server: 'wss://localhost:1337',
    userId: '',
    time: new TestTime()
  })
  let store = new Logux.Store(() => ({ }))
  let component = mount(content, { store, localVue })
  component.client = store.client
  return component
}

let UserPhoto = {
  mixins: [loguxMixin],
  props: ['id'],
  computed: {
    channels () {
      return [
        { channel: `users/${ this.id }`, fields: ['photo'] }
      ]
    }
  },
  render (h) {
    return h('img', {
      attrs: {
        isSubscribing: this.isSubscribing,
        src: `${ this.id }.jpg`
      }
    })
  }
}

it('subscribes', async () => {
  let component = createComponent({
    render (h) {
      return h('div', [
        h(UserPhoto, {
          props: { id: '1', key: 1 }
        }),
        h(UserPhoto, {
          props: { id: '1', key: 2 }
        }),
        h(UserPhoto, {
          props: { id: '2', key: 3 }
        })
      ])
    }
  })
  await delay(1)
  expect(component.client.log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'users/1', fields: ['photo'] },
    { type: 'logux/subscribe', channel: 'users/2', fields: ['photo'] }
  ])
})

it('accepts channel names', async () => {
  let User = {
    mixins: [loguxMixin],
    props: ['id'],
    computed: {
      channels () {
        return [`users/${ this.id }`, `users/${ this.id }/comments`]
      }
    },
    render: h => h('div')
  }
  let component = createComponent({
    render (h) {
      return h(User, {
        props: { id: '1', key: 1 }
      })
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
        return h(UserPhoto, {
          props: { id: this.users[key], key }
        })
      }))
    }
  }

  let component = createComponent({
    render (h) {
      return h(UserList, { })
    }
  })
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
        h(UserPhoto, {
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
        h(UserPhoto, {
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
        h(UserPhoto, { props: { id: this.id } })
      ])
    }
  })

  let nodeId = component.client.nodeId
  let log = component.client.log

  await delay(1)
  expect(component.vm.$children[0].isSubscribing).toBe(true)

  component.trigger('click', { id: 1 })
  await delay(1)
  expect(component.vm.$children[0].isSubscribing).toBe(true)

  component.trigger('click', { id: 2 })
  await localVue.nextTick()
  expect(component.vm.$children[0].isSubscribing).toBe(true)

  log.add({ type: 'logux/processed', id: `1 ${ nodeId } 0` })
  await delay(1)
  expect(component.vm.$children[0].isSubscribing).toBe(true)

  log.add({ type: 'logux/processed', id: `2 ${ nodeId } 0` })
  await delay(1)
  expect(component.vm.$children[0].isSubscribing).toBe(false)
})

it('works on channels size changes 123', () => {
  jest.spyOn(console, 'error')

  let UserList = {
    mixins: [loguxMixin],
    props: ['ids'],
    computed: {
      channels () {
        return this.ids.map(id => `users/${ id }`)
      }
    },
    render: h => h('div')
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
        h(UserList, { props: { ids: this.ids } })
      ])
    }
  })
  localVue.nextTick(() => {
    component.trigger('click', { ids: [1, 2] })
  })
  expect(console.error).not.toHaveBeenCalled()
})

it('avoid the same channels', async () => {
  let component = createComponent({
    mixins: [loguxMixin],
    data: () => ({ ids: [1] }),
    computed: {
      channels () {
        return this.ids.map(id => `users/${ id }`)
      }
    },
    methods: {
      change ($e) {
        this.ids = $e.ids
      }
    },
    render (h) {
      return h('div', {
        on: { click: this.change }
      })
    }
  })

  component.trigger('click', { ids: [1] })
  await localVue.nextTick()
  expect(component.client.log.actions()).toEqual([
    { type: 'logux/subscribe', channel: 'users/1' }
  ])
})
