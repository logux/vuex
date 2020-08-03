import { LoguxVuexStore } from './store'

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
export function useStore<S = any>(): LoguxVuexStore<S>

export { Client, CrossTabClient } from '@logux/client'

export { Subscribe } from './component'
export {
  Channel,
  Channels,
  useSubscription
} from './composable'
export {
  useStore,
  LoguxVuexStore,
  createStoreCreator
} from './store'
