const {
  subscribe,
  unsubscribe,
  subscriptionsId,
  unifyChannelsObject
} = require('../helpers')

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

module.exports = { loguxMixin }
