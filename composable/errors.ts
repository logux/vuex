import { defineComponent, computed } from 'vue'
import { useStore } from 'vuex'

import { useSubscription } from '..'

defineComponent({
  setup() {
    // THROWS Argument of type 'string' is not assignable to parameter of type 'Channels'.
    let isSubscribing = useSubscription('users')

    // THROWS Type 'number' is not assignable to type 'Channel'.
    useSubscription([1])

    // THROWS Type 'number' is not assignable to type 'string'.
    useSubscription([{ channel: 1 }])

    // THROWS Argument of type 'ComputedRef<string>' is not assignable to parameter of type 'Channels'.
    useSubscription(computed(() => 'users'))

    let store = useStore()
    // THROWS Type 'Store<any>' is missing the following properties from type 'LoguxVuexStore<any, Log<ClientMeta, LogStore>, Client<{}, Log<ClientMeta, LogStore>>>': on, client, log, initialize
    useSubscription(
      computed(() => ['users']),
      { store }
    )

    // THROWS Argument of type 'ComputedRef<number[]>' is not assignable to parameter of type 'Channels'.
    useSubscription(computed(() => [1]))

    // THROWS Argument of type 'ComputedRef<{ channel: number; }[]>' is not assignable to parameter of type 'Channels'.
    useSubscription(computed(() => [{ channel: 1 }]))

    // THROWS This condition will always return 'false' since the types 'boolean' and 'string' have no overlap.
    if (isSubscribing.value === 'yes') {
    }
  }
})
