import { Unsubscribe } from 'nanoevents'
import { Action, Log } from '@logux/core'
import {
  Client,
  ClientMeta,
  ClientOptions,
  CrossTabClient
} from '@logux/client'
import {
  CommitOptions,
  Store as VuexStore,
  Commit as VuexCommit,
  Payload as VuexPayload,
  Dispatch as VuexDispatch,
  StoreOptions as VuexStoreOptions,
  ActionContext as VuexActionContext
} from 'vuex'

export type LoguxVuexAction = Action & VuexPayload

export interface LoguxVuexCommit extends VuexCommit {
  (type: string, payload?: any, options?: CommitOptions): void
  <A extends LoguxVuexAction>(payloadWithType: A, options?: CommitOptions): void

  /**
   * Adds sync action to log and updates store state.
   * This action will be visible only for server and all browser tabs.
   *
   * ```js
   * store.commit.sync(
   *   { type: 'CHANGE_NAME', name },
   *   { reasons: ['lastName'] }
   * ).then(meta => {
   *   store.log.removeReason('lastName', { maxAdded: meta.added - 1 })
   * })
   * ```
   *
   * @param type Action type.
   * @param payload Action’s payload.
   * @param meta Action’s metadata.
   * @returns Promise when action will be processed by the server.
   */
  sync (type: string, payload?: any, meta?: Partial<ClientMeta>): Promise<ClientMeta>
  /**
   * @param action Action.
   * @param meta Action’s metadata.
   */
  sync <A extends LoguxVuexAction>(action: A, meta?: Partial<ClientMeta>): Promise<ClientMeta>

  /**
   * Adds cross-tab action to log and updates store state.
   * This action will be visible only for all tabs.
   *
   * ```js
   * store.commit.crossTab(
   *   { type: 'CHANGE_FAVICON', favicon },
   *   { reasons: ['lastFavicon'] }
   * ).then(meta => {
   *   store.log.removeReason('lastFavicon', { maxAdded: meta.added - 1 })
   * })
   * ```
   *
   * @param type Action type.
   * @param payload Action’s payload.
   * @param meta Action’s metadata.
   * @returns Promise when action will be processed by the server.
   */
  crossTab (type: string, payload?: any, meta?: Partial<ClientMeta>): Promise<ClientMeta>
  /**
   * @param action Action.
   * @param meta Action’s metadata.
   */
  crossTab <A extends LoguxVuexAction>(action: A, meta?: Partial<ClientMeta>): Promise<ClientMeta>

  /**
   * Adds local action to log and updates store state.
   * This action will be visible only for current tab.
   *
   * ```js
   *
   * store.commit.local(
   *   { type: 'OPEN_MENU' },
   *   { reasons: ['lastMenu'] }
   * ).then(meta => {
   *   store.log.removeReason('lastMenu', { maxAdded: meta.added - 1 })
   * })
   * ```
   *
   * @param type Action type.
   * @param payload Action’s payload.
   * @param meta Action’s metadata.
   * @returns Promise when action will be processed by the server.
   */
  local (type: string, payload?: any, meta?: Partial<ClientMeta>): Promise<ClientMeta>
  /**
   * @param action Action.
   * @param meta Action’s metadata.
   */
  local <A extends LoguxVuexAction>(action: A, meta?: Partial<ClientMeta>): Promise<ClientMeta>
}

interface StateListener<S> {
  <A extends LoguxVuexAction>(state: S, prevState: S, action: A, meta: ClientMeta): void
}

export interface LoguxVuexActionContext<S, R> extends VuexActionContext<S, R> {
  commit: LoguxVuexCommit
}

export type LoguxVuexActionHandler<S, R> = (
  this: LoguxVuexStore<R>,
  injectee: LoguxVuexActionContext<S, R>,
  payload?: any
) => any

export interface LoguxVuexActionObject<S, R> {
  root?: boolean
  handler: LoguxVuexActionHandler<S, R>
}

export type LoguxVuexNativeAction<S, R> =
  | LoguxVuexActionHandler<S, R>
  | LoguxVuexActionObject<S, R>

export interface LoguxVuexActionTree<S, R> {
  [key: string]: LoguxVuexNativeAction<S, R>
}

export interface LoguxVuexStoreOptions<S>
  extends Omit<VuexStoreOptions<S>, 'actions'> {
  actions?: LoguxVuexActionTree<S, S>
}

export class LoguxVuexStore<
  S = any,
  C extends Client = Client<{}, Log<ClientMeta>>,
  L extends Log = Log<ClientMeta>
> extends VuexStore<S> {
  constructor (options: LoguxVuexStoreOptions<S>)

  dispatch: VuexDispatch

  /**
   * Add action to log with Vuex compatible API.
   */
  commit: LoguxVuexCommit

  /**
   * Subscribes for store events. Supported events:
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
  on (event: 'change', listener: StateListener<S>): Unsubscribe

  /**
   * Logux synchronization client.
   */
  client: C

  /**
   * The Logux log.
   */
  log: L

  /**
   * Promise until loading the state from log store.
   */
  initialize: Promise<void>
}

export type LoguxVuexOptions = {
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
 * Vuex’s `createStore` function, compatible with Logux Client.
 *
 * @param options Vuex store options.
 * @returns Vuex store, compatible with Logux Client.
 */
export interface createStore<
  C extends Client = Client<{}, Log<ClientMeta>>,
  L extends Log = Log<ClientMeta>
> {
  <S>(options: LoguxVuexStoreOptions<S>): LoguxVuexStore<S, C, L>
}

/**
 * Connects Logux client to Vuex’s `createStore` function.
 *
 * ```js
 * import { CrossTabClient, createStoreCreator } from '@logux/vuex'
 *
 * const client = new CrossTabClient({
 *   subprotocol: '1.0.0',
 *   server: process.env.NODE_ENV === 'development'
 *     ? 'ws://localhost:31337'
 *     : 'wss://logux.example.com',
 *   userId: 'anonymous',
 *   token: ''
 * })
 *
 * const createStore = createStoreCreator(client)
 *
 * const store = createStore({
 *   state: {},
 *   mutations: {},
 *   actions: {},
 *   modules: {}
 * })
 *
 * store.client.start()
 * ```
 *
 * @param client Logux Client.
 * @param options Logux Vuex options.
 * @returns Vuex’s `createStore` function, compatible with Logux Client.
 */
export function createStoreCreator<
  C extends Client = Client<{}, Log<ClientMeta>>,
  L extends Log = Log<ClientMeta>
> (
  client: Client | CrossTabClient,
  options?: LoguxVuexOptions
): createStore<C, L>
