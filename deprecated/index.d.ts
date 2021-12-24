import { ClientOptions } from '@logux/client'

import { LoguxVuexOptions, LoguxVuexStore } from '../store/index.js'

/**
 * @deprecated Use createStoreCreator(client, opts) instead.
 */
export function createLogux(config: LoguxVuexOptions & ClientOptions): {
  Store: typeof LoguxVuexStore
}
