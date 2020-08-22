import {
  ref,
  defineComponent
} from 'vue'

import { useSubscription } from '..'

defineComponent({
  setup () {
    // THROWS Argument of type 'string' is not assignable to parameter of type 'Channels'.
    let isSubscribing = useSubscription('users')

    // THROWS Type 'number' is not assignable to type 'Channel'.
    useSubscription([1])

    // THROWS Type 'number' is not assignable to type 'string'.
    useSubscription([{ channel: 1 }])

    // THROWS Argument of type '() => string' is not assignable to parameter of type 'Channels'.
    useSubscription(() => 'users')

    // THROWS Argument of type '() => number[]' is not assignable to parameter of type 'Channels'.
    useSubscription(() => [1])

    // THROWS Argument of type '() => { channel: number; }[]' is not assignable to parameter of type 'Channels'.
    useSubscription(() => [{ channel: 1 }])

    let channels = ref([
      { channel: 'user/1' }
    ])

    // THROWS Argument of type 'Ref<{ channel: string; }[]>' is not assignable to parameter of type 'Channels'.
    useSubscription(channels)

    // THROWS This condition will always return 'false' since the types 'boolean' and 'string' have no overlap.
    if (isSubscribing.value === 'yes') {}
  }
})
