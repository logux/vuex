import { Ref } from 'vue'

import { LoguxVuexStore } from '../index.js'

export type Channel =
  | string
  | {
      channel: string
      [key: string]: any
    }

export type Channels = Channel[] | Ref<Channel[]>

export interface useSubscriptionOptions {
  /**
   * Logux Vuex store.
   */
  store?: LoguxVuexStore
  /**
   * Delay in milliseconds to avoid returning `true` when switching between `channels`.
   */
  debounce?: number
}

/**
 * Composable function that subscribes
 * for channels during component initialization
 * and unsubscribes on unmount.
 *
 * It watches for `channels` changes
 * and returns `isSubscribing` flag that indicates loading state.
 *
 * ```html
 * <template>
 *   <div v-if="isSubscribing">Loading</div>
 *   <h1 v-else>{{ user.name }}</h1>
 * </template>
 *
 * <script>
 * import { computed, toRefs } from 'vue'
 * import { useStore, useSubscription } from '@logux/vuex'
 *
 * export default {
 *   props: ['userId'],
 *   setup (props) {
 *     let store = useStore()
 *     let { userId } = toRefs(props)
 *
 *     let channels = computed(() => [`user/${userId.value}`])
 *     let isSubscribing = useSubscription(channels)
 *
 *     let user = computed(() => store.state.users[userId.value])
 *
 *     return { isSubscribing, user }
 *   }
 * })
 * </script>
 *
 * ```
 * @param channels Channels to subscribe.
 * @param options Options.
 * @return `true` during data loading.
 */
export function useSubscription(
  channels: Channels,
  options?: useSubscriptionOptions
): Ref<boolean>
