const {
  subscribe,
  unsubscribe,
  unifyChannelsObject,
  subscriptionsId
} = require('../subscription-mixin')

let subscriptionComponent = {
  props: {
    channels: {
      type: Array,
      required: true
    },
    tag: {
      type: String,
      default: 'div'
    }
  },
  data: () => ({
    isSubscribing: false,
    ignoreResponse: {}
  }),
  watch: {
    channels: {
      handler (channels, oldChannels) {
        let subscriptions = unifyChannelsObject(channels)
        let oldSubscriptions = unifyChannelsObject(oldChannels)

        if (subscriptions[0][1] !== oldSubscriptions[0][1]) {
          oldChannels && this.unsubscribe(oldSubscriptions)
          this.subscribe(subscriptions)
        }
      },
      immediate: true
    }
  },
  beforeDestroy () {
    let subscriptions = unifyChannelsObject(this.channels)
    this.unsubscribe(subscriptions)
  },
  methods: {
    async subscribe (subscriptions) {
      this.isSubscribing = true

      let id = subscriptionsId(subscriptions)
      delete this.ignoreResponse[id]

      await subscribe(this.$store, subscriptions)
      if (!this.ignoreResponse[id]) {
        this.isSubscribing = false
      }
    },
    unsubscribe (subscriptions) {
      let id = subscriptionsId(subscriptions)
      this.ignoreResponse[id] = true

      unsubscribe(this.$store, subscriptions)
    }
  },
  render () {
    let { isSubscribing } = this
    let defaultSlot = this.$scopedSlots.default

    if (!defaultSlot) {
      throw new Error('Provided scoped slot is empty')
    }

    return defaultSlot({ isSubscribing })
  }
}

module.exports = { subscriptionComponent }
