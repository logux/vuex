import type { ExtendedVue, Vue } from 'vue/types/vue'

export type Channel = string | {
  channel: string
  [key: string]: any
}

export interface SubscriptionComponent {
  channels: Channel[]
}

/**
 * Mixin, which takes care of subscribtions and unsubscribtions
 * in your component during the life cycle.
 *
 * It watches for `channels` changes
 * and `isSubscribing` indicates loading state.
 *
 * ```html
 * <template>
 *   <div v-if="isSubscribing">
 *     <h1>Loading</h1>
 *   </div>
 *   <div v-else>
 *     <h1>{{ user.name }}</h1>
 *   </div>
 * </template>
 *
 * <script>
 * import { subscriptionMixin } from '@logux/vuex'
 *
 * export default {
 *   name: 'UserProfile',
 *   mixins: [subscriptionMixin],
 *   props: {
 *     userId: String
 *   },
 *   computed: {
 *     user () {
 *       return this.$store.state.user
 *     },
 *     channels () {
 *       return [`user/${ userId }`]
 *     }
 *   }
 * }
 * </script>
 * ```
 */
export const subscriptionMixin: ExtendedVue<
  Vue,
  {
    /**
     * Indicates loading state.
     */
    isSubscribing: boolean,
    $_loguxVuex_ignoreResponse: {
      [id: string]: boolean
    }
  },
  {
    $_loguxVuex_subscribe(subscriptions: Channel[]): Promise<void>
    $_loguxVuex_unsubscribe(subscriptions: Channel[]): void
  },
  {},
  {}
>
