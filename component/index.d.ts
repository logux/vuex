import { VNodeProps } from 'vue'

import {
  Channels,
  Subscribe as SubscribeImpl
} from '../index.js'

export interface SubscribeProps {
  channels: Channels
}

/**
 * Component-wrapper that subscribes
 * for channels during component initialization
 * and unsubscribes on unmount.
 *
 * It watches for `channels` changes
 * and `isSubscribing` indicates loading state.
 *
 * ```html
 * <template>
 *   <subscribe :channels="channels" v-slot="{ isSubscribing }">
 *     <h1 v-if="isSubscribing">Loading</h1>
 *     <h1 v-else>{{ user.name }}</h1>
 *   </subscribe>
 * </template>
 *
 * <script>
 * import { toRefs, computed } from 'vue'
 * import { useStore, Subscribe } from '@logux/vuex'
 *
 * export default {
 *   components: { Subscribe },
 *   props: ['userId'],
 *   setup (props) {
 *     let store = useStore()
 *     let { userId } = toRefs(props)
 *
 *     let user = computed(() => store.state.users[userId.value])
 *     let channels = computed(() => [`users/${userId.value}`])
 *
 *     return {
 *       user,
 *       channels
 *     }
 *   }
 * }
 * </script>
 * ```
 */
export const Subscribe: new () => {
  $props: VNodeProps & SubscribeProps
}
