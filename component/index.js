const {
  subscribe,
  unsubscribe,
  unifyChannelsObject,
  subscriptionsId
} = require('../mixin')

let loguxComponent = {
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
      handler (newChannels, oldChannels) {
        let newSubscriptions = unifyChannelsObject(newChannels)
        let oldSubscriptions = unifyChannelsObject(oldChannels)

        let newId = subscriptionsId(newSubscriptions)
        let oldId = subscriptionsId(oldSubscriptions)

        if (newId !== oldId) {
          this.subscribe(newSubscriptions)
          oldChannels && this.unsubscribe(oldSubscriptions)
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
  render (h) {
    let { isSubscribing } = this
    let defaultSlot = this.$scopedSlots.default

    if (!defaultSlot) {
      throw new Error('Provided scoped slot is empty')
    }

    let vnode = defaultSlot({ isSubscribing })

    // for arrays and single text nodes
    if (vnode.length > 1 || !vnode[0].tag) {
      return h(this.tag, {}, vnode)
    }

    return vnode
  }
}

module.exports = { loguxComponent }
