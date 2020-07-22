import {
  toRefs,
  computed,
  defineComponent
} from 'vue'

import { useSubscription } from '..'

defineComponent({
  setup () {
    useSubscription(['users'])

    let channels = computed(() => ['users'])
    useSubscription(channels)
  }
})

defineComponent({
  props: {
    id: String
  },
  setup (props) {
    let { id } = toRefs(props)
    useSubscription([
      { channel: 'users' },
      { channel: `user/${id}` }
    ])

    let channels = computed(() => [
      { channel: 'users' },
      { channel: `user/${id}` }
    ])
    useSubscription(channels)
  }
})
