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
      { channel: `users/${id}`, fields: ['name'] }
    ])

    let channels = computed(() => [
      { channel: 'users' },
      { channel: `users/${id}`, fields: ['name'] }
    ])
    useSubscription(channels)
  }
})
