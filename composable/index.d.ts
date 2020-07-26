import { Ref, ComputedRef } from 'vue'

export type Channel =
  | string
  | {
      channel: string
      [key: string]: any
    }

export type Channels =
  | ComputedRef<Channel[]>
  | Channel[]

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
 * import { toRefs } from 'vue'
 * import { useStore, useSubscription } from '@logux/vuex'
 *
 * export default {
 *   props: {
 *     userId: String
 *   },
 *   setup (props) {
 *     let store = useStore()
 *     let { userId } = toRefs(props)
 *
 *     let channels = computed(() => [`user/${userId}`])
 *     let isSubscribing = useSubscription(channels)
 *
 *     let user = computed(() => store.state.users[userId])
 *
 *     return { isSubscribing, user }
 *   }
 * })
 * </script>
 *
 * ```
 * @param channels Channels to subscribe.
 * @return `true` during data loading.
 */
export function useSubscription (
  channels: Channels
): Ref<boolean>
