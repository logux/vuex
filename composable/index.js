import { ref, isRef, watch, computed, onBeforeUnmount } from 'vue'
import { useStore } from 'vuex'

export function useSubscription(channels, options = {}) {
  let store = options.store || useStore()
  let debounce = options.debounce || 0
  let isSubscribing = ref(true)
  let channelsRef

  if (typeof channels === 'function') {
    channelsRef = computed(channels)
  } else if (isRef(channels)) {
    channelsRef = channels
  }

  if (channelsRef) {
    let subscriptions = computed(() => unifyChannelsObject(channelsRef.value))
    let id = computed(() => subscriptionsId(subscriptions.value))

    watch(
      () => id.value,
      (newId, oldId, onInvalidate) => {
        let oldSubscriptions = subscriptions.value
        let ignoreResponse = false
        let timeout

        function resetTimeout() {
          clearTimeout(timeout)
          timeout = null
        }

        if (debounce > 0) {
          timeout = setTimeout(() => {
            isSubscribing.value = true
          }, debounce)
        } else {
          isSubscribing.value = true
        }

        subscribe(store, subscriptions.value).then(() => {
          if (timeout) resetTimeout(timeout)
          if (!ignoreResponse) {
            isSubscribing.value = false
          }
        })

        onInvalidate(() => {
          ignoreResponse = true
          unsubscribe(store, oldSubscriptions)
          if (timeout) resetTimeout(timeout)
        })
      },
      { immediate: true }
    )
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

function unifyChannelsObject(channels) {
  return channels.map(i => {
    let subscription = typeof i === 'string' ? { channel: i } : i
    return [subscription, JSON.stringify(subscription)]
  })
}

function subscriptionsId(subscriptions) {
  return subscriptions
    .map(i => i[1])
    .sort()
    .join(' ')
}

function subscribe(store, subscriptions) {
  if (!store.subscriptions) store.subscriptions = {}
  if (!store.subscribers) store.subscribers = {}

  return Promise.all(
    subscriptions.map(i => {
      let subscription = i[0]
      let json = i[1]
      if (!store.subscribers[json]) store.subscribers[json] = 0
      store.subscribers[json] += 1
      if (store.subscribers[json] === 1) {
        let action = { ...subscription, type: 'logux/subscribe' }
        store.subscriptions[json] = store.commit.sync(action)
      }
      return store.subscriptions[json]
    })
  )
}

function unsubscribe(store, subscriptions) {
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
