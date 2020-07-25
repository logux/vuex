import {
  h,
  defineComponent
} from 'vue'

import { loguxComponent } from '..'

defineComponent({
  setup () {
    return () => h(loguxComponent, {
      // THROWS No overload matches this call.
      channels: 'users'
    })
  },
})
