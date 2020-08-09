import {
  Ref,
  ComputedGetter,
  ComputedRef
} from '@vue/reactivity'

export type Channel =
  | string
  | {
      channel: string
      [key: string]: any
    }

export type Channels =
  | ComputedGetter<Channel[]>
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
 *   props: ['userId'],
 *   setup (props) {
 *     let store = useStore()
 *     let { userId } = toRefs(props)
 *     let isSubscribing = useSubscription(() => [`user/${userId.value}`])
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
 * @return `true` during data loading.
 */
export function useSubscription (
  channels: Channels
): Ref<boolean>
