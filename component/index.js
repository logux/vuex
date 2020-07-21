let { toRefs } = require('vue')

let { useSubscription } = require('../composable')

let loguxComponent = {
  name: 'LoguxComponent',
  props: {
    channels: {
      type: Array,
      required: true
    }
  },
  setup (props, { slots }) {
    let { channels } = toRefs(props)

    let defaultSlot = slots.default

    if (!defaultSlot) {
      throw new Error('Provided scoped slot is empty')
    }

    let isSubscribing = useSubscription(channels)

    return () => defaultSlot({ isSubscribing })
  }
}

module.exports = { loguxComponent }
