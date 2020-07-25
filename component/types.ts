import {
  h,
  toRefs,
  computed,
  defineComponent
} from 'vue'

import { loguxComponent } from '..'

defineComponent({
  setup () {
    return () => h(loguxComponent, {
      channels: ['users']
    })
  },
})

defineComponent({
  props: {
    id: String
  },
  setup (props) {
    let { id } = toRefs(props)

    return () => h(loguxComponent, {
      channels: [
        { channel: 'users' },
        { channel: `users/${id}`, fields: ['name'] }
      ]
    })
  },
})

defineComponent({
  props: {
    id: String
  },
  setup (props) {
    let { id } = toRefs(props)

    let channels = computed(() => {
      return [
        { channel: 'users' },
        { channel: `users/${id}`, fields: ['name'] }
      ]
    })

    return () => h(loguxComponent, {
      channels: channels.value
    })
  },
})
