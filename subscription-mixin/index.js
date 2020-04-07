let Vue = require('vue')

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

let subscriptionMixin = Vue.extend({
  data: () => ({
    isSubscribing: false,
    $_loguxVuex_ignoreResponse: {}
  }),
  watch: {
    channels: {
      handler (channels, oldChannels) {
        let subscriptions = unifyChannelsObject(channels)
        let oldSubscriptions = unifyChannelsObject(oldChannels)

        if (subscriptions[0][1] !== oldSubscriptions[0][1]) {
          oldChannels && this.$_loguxVuex_unsubscribe(oldSubscriptions)
          this.$_loguxVuex_subscribe(subscriptions)
        }
      },
      immediate: true
    }
  },
  beforeDestroy () {
    let subscriptions = unifyChannelsObject(this.channels)
    this.$_loguxVuex_unsubscribe(subscriptions)
  },
  methods: {
    $_loguxVuex_subscribe (subscriptions) {
      this.isSubscribing = true

      let id = subscriptionsId(subscriptions)
      delete this.$data.$_loguxVuex_ignoreResponse[id]

      if (!this.$store.subscriptions) this.$store.subscriptions = { }
      if (!this.$store.subscribers) this.$store.subscribers = { }

      return Promise.all(subscriptions.map(i => {
        let subscription = i[0]
        let json = i[1]
        if (!this.$store.subscribers[json]) this.$store.subscribers[json] = 0
        this.$store.subscribers[json] += 1
        if (this.$store.subscribers[json] === 1) {
          let action = { ...subscription, type: 'logux/subscribe' }
          this.$store.subscriptions[json] = this.$store.commit.sync(action)
        }
        return this.$store.subscriptions[json]
      })).then(() => {
        if (!this.$data.$_loguxVuex_ignoreResponse[id]) {
          this.isSubscribing = false
        }
      })
    },
    $_loguxVuex_unsubscribe (subscriptions) {
      let id = subscriptionsId(subscriptions)
      this.$data.$_loguxVuex_ignoreResponse[id] = true

      subscriptions.forEach(i => {
        let subscription = i[0]
        let json = i[1]
        this.$store.subscribers[json] -= 1
        if (this.$store.subscribers[json] === 0) {
          let action = { ...subscription, type: 'logux/unsubscribe' }
          this.$store.log.add(action, { sync: true })
          delete this.$store.subscriptions[json]
        }
      })
    }
  }
})

module.exports = subscriptionMixin
