import {
  h,
  defineComponent
} from 'vue'

import { Subscribe } from '..'

defineComponent({
  setup () {
    // THROWS No overload matches this call.
    return () => h(Subscribe, {
      channels: 'users'
    })
  },
})
