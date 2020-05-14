function unifyChannelsObject (channels) {
  if (!channels) {
    return [[{}, '']]
  }
  return channels.map(i => {
    let subscription = typeof i === 'string' ? { channel: i } : i
    return [subscription, JSON.stringify(subscription)]
  })
}

function subscriptionsId (subscriptions) {
  return subscriptions.map(i => i[1]).sort().join(' ')
}

function subscribe (store, subscriptions) {
  if (!store.subscriptions) store.subscriptions = { }
  if (!store.subscribers) store.subscribers = { }

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

let loguxMixin = {
  data: () => ({
    isSubscribing: false,
    $_logux_ignoreResponse: {}
  }),
  watch: {
    channels: {
      handler (newChannels, oldChannels) {
        let newSubscriptions = unifyChannelsObject(newChannels)
        let oldSubscriptions = unifyChannelsObject(oldChannels)

        let newId = subscriptionsId(newSubscriptions)
        let oldId = subscriptionsId(oldSubscriptions)

        if (newId !== oldId) {
          this.$_logux_subscribe(newSubscriptions)
          oldChannels && this.$_logux_unsubscribe(oldSubscriptions)
        }
      },
      immediate: true
    }
  },
  beforeDestroy () {
    let subscriptions = unifyChannelsObject(this.channels)
    this.$_logux_unsubscribe(subscriptions)
  },
  methods: {
    async $_logux_subscribe (subscriptions) {
      this.isSubscribing = true

      let id = subscriptionsId(subscriptions)
      delete this.$data.$_logux_ignoreResponse[id]

      await subscribe(this.$store, subscriptions)
      if (!this.$data.$_logux_ignoreResponse[id]) {
        this.isSubscribing = false
      }
    },
    $_logux_unsubscribe (subscriptions) {
      let id = subscriptionsId(subscriptions)
      this.$data.$_logux_ignoreResponse[id] = true

      unsubscribe(this.$store, subscriptions)
    }
  }
}

module.exports = {
  loguxMixin,
  subscribe,
  unsubscribe,
  unifyChannelsObject,
  subscriptionsId
}
