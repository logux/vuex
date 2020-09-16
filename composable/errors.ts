import {
  ref,
  defineComponent
} from 'vue'
import { useStore } from 'vuex'

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

    let store = useStore()
    // THROWS Type 'Store<any>' is missing the following properties from type 'LoguxVuexStore<any, Client<{}, Log<ClientMeta, LogStore>>, Log<ClientMeta, LogStore>>': on, client, log, initialize
    useSubscription(() => ['users'], { store })

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
