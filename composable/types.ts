import { toRefs, computed, defineComponent } from 'vue'

import { useSubscription, useStore } from '../index.js'

defineComponent({
  setup() {
    useSubscription(['users'])

    useSubscription(computed(() => ['users']))

    let store = useStore()
    useSubscription(
      computed(() => ['users']),
      { store }
    )

    let channels = computed(() => ['users'])
    useSubscription(channels)
  }
})

defineComponent({
  props: ['id'],
  setup(props) {
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
