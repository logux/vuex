let { useStore } = require('vuex')
let {
  ref,
  isRef,
  watch,
  onBeforeUnmount
} = require('vue')

let {
  subscribe,
  unsubscribe,
  unifyChannelsObject,
  subscriptionsId
} = require('../helpers')

function useSubscription (channels) {
  let isSubscribing = ref(true)
  let store = useStore()

  if (isRef(channels)) {
    watch(channels, (newChannels, oldChannels, onInvalidate) => {
      let subscriptions = unifyChannelsObject(newChannels)
      let oldSubscriptions = unifyChannelsObject(oldChannels)

      let id = subscriptionsId(subscriptions)
      let oldId = subscriptionsId(oldSubscriptions)

      let ignoreResponse

      if (id !== oldId) {
        ignoreResponse = false

        subscribe(store, subscriptions).then(() => {
          if (!ignoreResponse) {
            isSubscribing.value = false
          }
        })
      }

      onInvalidate(() => {
        ignoreResponse = true
        unsubscribe(store, subscriptions)
      })
    }, { immediate: true })
  } else {
    let subscriptions = unifyChannelsObject(channels)
    let ignoreResponse = false

    subscribe(store, subscriptions).then(() => {
      if (!ignoreResponse) {
        isSubscribing.value = false
      }
    })

    onBeforeUnmount(() => {
      ignoreResponse = true
      unsubscribe(store, subscriptions)
    })
  }

  return isSubscribing
}

module.exports = { useSubscription }
