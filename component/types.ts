import {
  h,
  toRefs,
  computed,
  defineComponent
} from 'vue'

import { Subscribe } from '..'

defineComponent({
  setup () {
    return () => h(Subscribe, {
      channels: ['users']
    })
  },
})

defineComponent({
  props: ['id'],
  setup (props) {
    let { id } = toRefs(props)

    return () => h(Subscribe, {
      channels: [
        { channel: 'users' },
        { channel: `users/${id}`, fields: ['name'] }
      ]
    })
  },
})

defineComponent({
  props: ['id'],
  setup (props) {
    let { id } = toRefs(props)

    let channels = computed(() => {
      return [
        { channel: 'users' },
        { channel: `users/${id}`, fields: ['name'] }
      ]
    })

    return () => h(Subscribe, {
      channels: channels.value
    })
  },
})
