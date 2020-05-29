import { Unsubscribe } from 'nanoevents'
import { Action, Log } from '@logux/core'
import { ClientMeta, ClientOptions, CrossTabClient } from '@logux/client'
import { Payload as VuexPayload, Commit as VuexCommit, Store as VuexStore, CommitOptions, StoreOptions as VuexStoreOptions, Dispatch as VuexDispatch } from 'vuex'

export type VuexAction = Action & VuexPayload

export interface LoguxCommitAction {
  (type: string, payload?: any, meta?: Partial<ClientMeta>): Promise<ClientMeta>
  <A extends VuexAction>(action: A, meta?: Partial<ClientMeta>): Promise<ClientMeta>
}

export interface LoguxCommit extends VuexCommit {
  (type: string, payload?: any, options?: CommitOptions): void
  <A extends VuexAction>(payloadWithType: A, options?: CommitOptions): void

  sync: LoguxCommitAction
  crossTab: LoguxCommitAction
  local: LoguxCommitAction
}

interface StateListener<S> {
  <A extends VuexAction>(state: S, prevState: S, action: A, meta: ClientMeta): void
}

export class LoguxVuexStore<S = any> extends VuexStore<S> {
  constructor (options: VuexStoreOptions<S>)
  dispatch: VuexDispatch

  /**
   * Add action to log with Vuex compatible API.
   */
  commit: LoguxCommit

  /**
   * Add sync action to log and update store state.
   * This action will be visible only for server and all browser tabs.
   *
   * ```js
   * this.$logux.sync(
   *   { type: 'CHANGE_NAME', name },
   *   { reasons: ['lastName'] }
   * ).then(meta => {
   *   store.log.removeReason('lastName', { maxAdded: meta.added - 1 })
   * })
   * ```
   *
   * @param action The new action.
   * @param meta Action’s metadata.
   * @returns Promise when action will be processed by the server.
   */
  sync: LoguxCommitAction

  /**
   * Add cross-tab action to log and update store state.
   * This action will be visible only for all tabs.
   *
   * ```js
   * this.$logux.crossTab(
   *   { type: 'CHANGE_FAVICON', favicon },
   *   { reasons: ['lastFavicon'] }
   * ).then(meta => {
   *   store.log.removeReason('lastFavicon', { maxAdded: meta.added - 1 })
   * })
   * ```
   *
   * @param action The new action.
   * @param meta Action’s metadata.
   * @returns Promise when action will be saved to the log.
   */
  crossTab: LoguxCommitAction

  /**
   * Add local action to log and update store state.
   * This action will be visible only for current tab.
   *
   * ```js
   *
   * this.$logux.local(
   *   { type: 'OPEN_MENU' },
   *   { reasons: ['lastMenu'] }
   * ).then(meta => {
   *   store.log.removeReason('lastMenu', { maxAdded: meta.added - 1 })
   * })
   * ```
   *
   * @param action The new action.
   * @param meta Action’s metadata.
   * @returns Promise when action will be saved to the log.
   */
  local: LoguxCommitAction

  /**
   * Subscribe for store events. Supported events:
   *
   * * `change`: when store was changed by action.
   *
   * ```js
   * store.on('change', (state, prevState, action, meta) => {
   *   console.log(state, prevState, action, meta)
   * })
   * ```
   *
   * @param event The event name.
   * @param listener The listener function.
   * @returns Unbind listener from event.
   */
  on(event: 'change', listener: StateListener<S>): Unsubscribe

  /**
   * Logux synchronization client.
   */
  client: CrossTabClient

  /**
   * The Logux log.
   */
  log: Log<ClientMeta>
}

export type LoguxConfig = ClientOptions & {
  /**
   * How many actions without `meta.reasons` will be kept for time travel.
   * Default is `1000`.
   */
  reasonlessHistory?: number

  /**
   * How often save state to history. Default is `50`.
   */
  saveStateEvery?: number

  /**
   * Callback when there is no history to replay actions accurate.
   */
  onMissedHistory?: (action: Action) => void

  /**
   * How often we need to clean log from old actions. Default is every `25`
   * actions.
   */
  cleanEvery?: number
}

/**
 * Creates Logux client and attach it to Vuex.Store instance.
 *
 * ```js
 * import { createLogux } from '@logux/vuex'
 *
 * const Logux = createLogux({
 *   subprotocol: '1.0.0',
 *   server: process.env.NODE_ENV === 'development'
 *     ? 'ws://localhost:31337'
 *     : 'wss://logux.example.com',
 *   userId: 'anonymous',
 *   token: ''
 * })
 *
 * const store = new Logux.Store({
 *  state: {},
 *  mutations: {},
 *  actions: {},
 *  modules: {}
 * })
 *
 * store.client.start()
 * ```
 *
 * @param config Logux Client config.
 * @returns Vuex’s `Store` instance.
 */
export function createLogux(config: LoguxConfig): {
  Store: typeof LoguxVuexStore
}
