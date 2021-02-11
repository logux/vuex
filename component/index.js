import { defineComponent, toRefs } from 'vue'

import { useSubscription } from '../composable/index.js'

export let Subscribe = defineComponent({
  name: 'LoguxSubscribe',
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
})
