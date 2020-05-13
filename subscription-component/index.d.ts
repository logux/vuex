import type { ExtendedVue, Vue } from 'vue/types/vue'

import { Channel } from '../subscription-mixin'

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
 *   <subscription-component :channels="[`user/${ userId }`]" v-slot="{ isSubscribing }">
 *     <div v-if="isSubscribing">
 *       <h1>Loading</h1>
 *     </div>
 *     <div v-else>
 *       <h1>{{ user.name }}</h1>
 *     </div>
 *   </subscription-component>
 * </template>
 *
 * <script>
 * import { subscriptionComponent } from '@logux/vuex'
 *
 * export default {
 *   name: 'UserProfile',
 *   components: {
 *     subscriptionComponent
 *   },
 *   props: {
 *     userId: String
 *   },
 *   computed: {
 *     user () {
 *       return this.$store.state.user
 *     }
 *   }
 * }
 * </script>
 * ```
 */
export const subscriptionComponent: ExtendedVue<
  Vue,
  {
    /**
     * Indicates loading state.
     */
    isSubscribing: boolean,
    ignoreResponse: {
      [id: string]: boolean
    }
  },
  {
    subscribe(subscriptions: Channel[]): Promise<void>
    unsubscribe(subscriptions: Channel[]): void
  },
  {},
  {
    tag: string,
    channels: Channel[]
  }
>
