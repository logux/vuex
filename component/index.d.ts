import { VNodeProps } from 'vue'

import {
  Channels,
  loguxComponent as loguxComponentImpl
} from '..'

export interface loguxComponentProps {
  channels: Channels
}

/**
 * Component with scoped slots,
 * which takes care of subscribtions and unsubscribtions
 * during the life cycle.
 *
 * It watches for `channels` changes
 * and `isSubscribing` indicates loading state.
 *
 * ```html
 * <template>
 *   <logux-component :channels="channels" v-slot="{ isSubscribing }">
 *     <h1 v-if="isSubscribing">Loading</h1>
 *     <h1 v-else>{{ user.name }}</h1>
 *   </logux-component>
 * </template>
 *
 * <script>
 * import { toRefs, computed } from 'vue'
 * import { useStore, loguxComponent } from '@logux/vuex'
 *
 * export default {
 *   components: {
 *     loguxComponent
 *   },
 *   props: {
 *     userId: String
 *   },
 *   setup (props) {
 *     let store = useStore()
 *     let { userId } = toRefs(props)
 *
 *     let user = computed(() => store.state.users[userId])
 *     let channels = computed(() => [`users/${ userId }`])
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
export const loguxComponent = (loguxComponentImpl as any) as {
  new (): {
    $props: VNodeProps & loguxComponentProps
  }
}
