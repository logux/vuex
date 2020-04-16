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

function convertVNodeArray (h, wrapperTag, nodes) {
  // for arrays and single text nodes
  if (nodes.length > 1 || !nodes[0].tag) return h(wrapperTag, {}, nodes)
  return nodes[0]
}

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
    subscribe (subscriptions) {
      this.isSubscribing = true

      let id = subscriptionsId(subscriptions)
      delete this.ignoreResponse[id]

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
        if (!this.ignoreResponse[id]) {
          this.isSubscribing = false
        }
      })
    },
    unsubscribe (subscriptions) {
      let id = subscriptionsId(subscriptions)
      this.ignoreResponse[id] = true

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
  },
  render (h) {
    let { isSubscribing } = this
    
    let defaultSlot = this.$scopedSlots.default
    if (!defaultSlot) return null
    
    let node = defaultSlot({ isSubscribing })
    return Array.isArray(node) ? convertVNodeArray(h, this.tag, node) : node
  }
}

module.exports = { subscriptionComponent }
