let { useStore } = require('vuex')
let {
  ref,
  unref,
  isRef,
  watch,
  computed,
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
    let subscriptions = computed(() => unifyChannelsObject(channels.value))
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
