import { InjectionKey } from 'vue'

import { LoguxVuexStore } from './store/index.js'

/**
 * Composable function that injects store into the component.
 *
 * ```js
 * import { useStore } from '@logux/vuex'
 *
 * export default {
 *   setup () {
 *     let store = useStore()
 *     store.commit.sync('user/rename')
 *   }
 * }
 * ```
 *
 * @returns Store instance.
 */
export function useStore<S = any> (injectKey?: InjectionKey<LoguxVuexStore<S>> | string): LoguxVuexStore<S>

export { Client, CrossTabClient } from '@logux/client'

export { Subscribe } from './component/index.js'
export {
  Channel,
  Channels,
  useSubscription
} from './composable/index.js'
export {
  LoguxVuexStore,
  createStoreCreator
} from './store/index.js'
