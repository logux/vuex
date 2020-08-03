import {
  h,
  defineComponent
} from 'vue'

import { Subscribe } from '..'

defineComponent({
  setup () {
    return () => h(Subscribe, {
      // THROWS No overload matches this call.
      channels: 'users'
    })
  },
})
