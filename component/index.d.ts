import type { ExtendedVue, Vue } from 'vue/types/vue'

import { Channel, Subscription } from '../mixin/index.js'

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
 *   <logux-component :channels="[`user/${ userId }`]" v-slot="{ isSubscribing }">
 *     <h1 v-if="isSubscribing">Loading</h1>
 *     <h1 v-else>{{ user.name }}</h1>
 *   </logux-component>
 * </template>
 *
 * <script>
 * import { loguxComponent } from '@logux/vuex'
 *
 * export default {
 *   name: 'UserProfile',
 *   components: {
 *     loguxComponent
 *   },
 *   props: ['userId'],
 *   computed: {
 *     user () {
 *       return this.$store.state.user[this.userId]
 *     }
 *   }
 * }
 * </script>
 * ```
 */
export const loguxComponent: ExtendedVue<
  Vue,
  {
    /**
     * Indicates loading state.
     */
    isSubscribing: boolean
    ignoreResponse: {
      [id: string]: boolean
    }
  },
  {
    subscribe(subscriptions: Subscription[]): Promise<void>
    unsubscribe(subscriptions: Subscription[]): void
  },
  {},
  {
    tag: string
    channels: Channel[]
  }
>
