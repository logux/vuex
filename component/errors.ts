import { h, defineComponent } from 'vue'

import { Subscribe } from '..'

defineComponent({
  setup() {
    return () =>
      // THROWS No overload matches this call.
      h(Subscribe, {
        channels: 'users'
      })
  }
})
