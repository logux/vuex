import { Plugin } from 'vue'
import { App } from '@vue/devtools-api'
import { Client, CrossTabClient } from '@logux/vuex'

export interface DevtoolsOptions {
	layers?: {
		/**
		 * Disable connection state layer.
		 */
		state?: boolean

		/**
		 * Disable tab role layer.
		 */
		role?: boolean

		/**
		 * Disable action layer.
		 */
		action?: boolean

		/**
		 * Disable subscription layer.
		 */
		subscription?: boolean

		/**
		 * Disable user layer.
		 */
		user?: boolean

		/**
		 * Disable action cleaned layer.
		 */
		clean?: boolean
	}

	/**
   * Disable action messages with specific types.
   */
  ignoreActions?: string[]
}

/**
 * Vue Devtools plugin that add Logux events to the timeline.
 *
 * ```js
 * import { createApp } from 'vue'
 * import { devtools } from '@logux/vuex'
 *
 * import App from './App.vue'
 * import { store } from './store'
 * …
 * let app = createApp(App)
 *
 * app.use(store)
 * app.use(devtools, store.client, {
 *   layers: {
 *     state: false
 *   },
 *   ignoreActions: ['user/add']
 * })
 * ```
 *
 * @param app Vue app instance.
 * @param client Logux Client instance.
 * @param options Disable specific layers or action types.
 */
export function devtools (
	app: App,
	client: Client | CrossTabClient,
	options?: DevtoolsOptions
): void
