import { Log } from '@logux/core'
import { InjectionKey } from 'vue'
import { Client, ClientMeta } from '@logux/client'

import { LoguxVuexStore } from '../index.js'

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
export function useStore<
  S = any,
  L extends Log = Log<ClientMeta>,
  C extends Client = Client<{}, L>
>(
  injectKey?: InjectionKey<LoguxVuexStore<S, L, C>> | string
): LoguxVuexStore<S, L, C>
