import type { ExtendedVue, Vue } from 'vue/types/vue'

import { Channel } from '../mixin'

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
 *     <div v-if="isSubscribing">
 *       <h1>Loading</h1>
 *     </div>
 *     <div v-else>
 *       <h1>{{ user.name }}</h1>
 *     </div>
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
export const loguxComponent: ExtendedVue<
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
