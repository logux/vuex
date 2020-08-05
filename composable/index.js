let { useStore } = require('vuex')
let {
  ref,
  unref,
  isRef,
  watch,
  computed,
  onBeforeUnmount
} = require('vue')

let { isFunction } = require('../utils')

function useSubscription (channels) {
  let isSubscribing = ref(true)
  let store = useStore()

  if (isRef(channels) || isFunction(channels)) {
    let channelsRef = isFunction(channels) ? computed(channels) : channels

    let subscriptions = computed(() => unifyChannelsObject(channelsRef.value))
    let id = computed(() => subscriptionsId(subscriptions.value))

    watch(id, (newId, oldId, onInvalidate) => {
      let ignoreResponse = false
      let oldSubscriptions = unref(subscriptions)

      subscribe(store, subscriptions.value).then(() => {
        if (!ignoreResponse) {
          isSubscribing.value = false
        }
      })

      onInvalidate(() => {
        ignoreResponse = true
        unsubscribe(store, oldSubscriptions)
      })
    }, { immediate: true })
  } else {
    let subscriptions = unifyChannelsObject(channels)

    subscribe(store, subscriptions).then(() => {
      isSubscribing.value = false
    })

    onBeforeUnmount(() => {
      unsubscribe(store, subscriptions)
    })
  }

  return isSubscribing
}

function unifyChannelsObject (channels) {
  return channels.map(i => {
    let subscription = typeof i === 'string' ? { channel: i } : i
    return [subscription, JSON.stringify(subscription)]
  })
}

function subscriptionsId (subscriptions) {
  return subscriptions.map(i => i[1]).sort().join(' ')
}

function subscribe (store, subscriptions) {
  if (!store.subscriptions) store.subscriptions = {}
  if (!store.subscribers) store.subscribers = {}

  return Promise.all(subscriptions.map(i => {
    let subscription = i[0]
    let json = i[1]
    if (!store.subscribers[json]) store.subscribers[json] = 0
    store.subscribers[json] += 1
    if (store.subscribers[json] === 1) {
      let action = { ...subscription, type: 'logux/subscribe' }
      store.subscriptions[json] = store.commit.sync(action)
    }
    return store.subscriptions[json]
  }))
}

function unsubscribe (store, subscriptions) {
  subscriptions.forEach(i => {
    let subscription = i[0]
    let json = i[1]
    store.subscribers[json] -= 1
    if (store.subscribers[json] === 0) {
      let action = { ...subscription, type: 'logux/unsubscribe' }
      store.log.add(action, { sync: true })
      delete store.subscriptions[json]
    }
  })
}

module.exports = { useSubscription }
