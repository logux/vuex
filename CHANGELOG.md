# Change Log
This project adheres to [Semantic Versioning](http://semver.org/).

## 0.10.0
 * Moved project to ESM-only type. Applications must use ESM too
 * Dropped Node.js 10 support
 * Fixed types performance by replacing type to interface
 * Simplified `useSubscription` API: `channels` cannot be function, but can be `computed`, `ref`
 * Moved `@logux/core` and `@logux/client` to peer dependencies
 * Removed `Client` and `CrossTabClient` from exports
 * Updated Vue to 3.0.11

## 0.9.24
 * Update Vue to 3.0.10

## 0.9.23
 * Update Vue to 3.0.9

## 0.9.22
 * Update Vue to 3.0.8

## 0.9.21
 * Fix bug that caused performance degradation related to `store.on('change', …)`
 * Update nanoevents to 5.1.13
 * Update dependencies

## 0.9.20
 * Update Vue to 3.0.7
 * Update nanoevents to 5.1.12
 * Update dependencies

## 0.9.19
 * Update dependencies

## 0.9.18
 * Update Vue to 3.0.5
 * Update Vuex to 4.0.0
 * Update dependencies
 * Refactor `useSubscription` for Vue 3.0.5

## 0.9.17
 * Add `debounce` for `useSubscription` to avoid flashing between channels
 * Update typings

## 0.9.16
 * Fix eternal `false` loading indication on `channels` changes
 * Update dependencies

## 0.9.15
 * Update Vue to 3.0.0 One Piece
 * Update dependencies

## 0.9.14
 * Update Vue to release candidate 13
 * Update dependencies

## 0.9.13
 * Update Vue to release candidate 12
 * Update dependencies

## 0.9.12
 * Rewrite tests with TypeScript
 * Extend `useStore` typings

## 0.9.11
 * Update Vue to release candidate 11
 * Update dependencies

## 0.9.10
 * Fix broken state after second logux/undo
 * Update Vue to release candidate 10
 * Update dependencies

## 0.9.9
 * Fix `useSubscription` subscribing on the same channels.

## 0.9.8
 * Fix `useSubscription` types, `options` argument can be undefined.

## 0.9.7
 * Add `store` option from `useSubscription` to support different store sources.

## 0.9.6
 * Update Vue to release candidate 9

## 0.9.5
 * Update Vue to release candidate 8

## 0.9.4
 * Update Vue to release candidate 7

## 0.9.3
 * Fix `useStore` types, add lost `key` argument
 * Update dependencies
   * Logux Client to 0.9.2
   * Vue to release candidate 6

## 0.9.2
 * `useSubscription`’s argument `channels` can be a getter function

## 0.9.1
 * Fix Typescript exports

## 0.9.0
 * Add Vue 3 support
 * Add `useSubscription` composable function
 * Add `useStore` shortcut from Vuex
 * Fix Typescript support
 * Update dependencies
 * Refactor helpers
 * Rename `loguxComponent` to `Subscribe`
 * Remove Vue 2 support
 * Remove `loguxMixin` mixin
 * Remove `LoguxVuex` plugin API
 * Remove `store.local`, `store.crossTab` and `store.sync` aliases

## 0.8.0
 * Add logux `commit` to vuex `action` context  ([#31](https://github.com/logux/vuex/issues/31))
 * Update dependencies

## 0.7.1
 * Fix native Vuex payload behavior

## 0.7.0
 * Add Vue plugin API
   ```js
   import Vue from 'vue'
   import { LoguxVuex, createLogux } from '@logux/vuex'

   Vue.use(LoguxVuex)
   ```
 * Add new API
   * `this.$logux.local`
   * `this.$logux.crossTab`
   * `this.$logux.sync`
   * `store.commit.local`, `store.commit.crossTab`, `store.commit.sync` still available as alias to `this.$logux`
 * Fix native Vuex payload behavior
 * Refactor TypeScript support
 * Update dependencies

## 0.6.1
 * Fix component render with temporary no children

## 0.6.0
 * Add `tag` property for component to wrap multiple children and single text
 * Replace shared helpers
 * Update dependencies

## 0.5.1
 * Add ES modules support

## 0.5.0
 * Add full support of Vuex modules
 * Fix incorrect behavior with modules ([#26](https://github.com/logux/vuex/issues/26))
 * Update dependencies

## 0.4.0
 * Add `loguxComponent`, component with scoped slots ([#18](https://github.com/logux/vuex/pull/18), [#25](https://github.com/logux/vuex/pull/25)) (by Stanislav Lashmanov)
 * Fix incorrect subscription after changing `channels` in `subscriptionMixin`
 * Fix incorrect TypeScript for mixin’s private methods
 * Rename mixin’s private methods
 * Rename mixin `subscriptionMixin` to `loguxMixin`
 * Rename folder `/subscription-mixin` to `/mixin`
 * Update dependencies

## 0.3.2
 * Update dependencies

## 0.3.1
 * Unify commit arguments
   * `commit.sync`, `commit.crossTab` & `commit.local` arguments can be either `(action, meta?)` or `(type, payload?, meta?)`
 * Fix dirty commit payload

## 0.3.0
 * Add TypeScript definitions (by Nikolay Govorov)
 * Add API docs via TypeDoc
 * Fix `commit.sync` return `ClientMeta`
 * Fix typo in mixin
 * Update to Logux Core 0.5 and Logux Client 0.8
   * Use WebSocket Protocol 3
   * Add `store.client.changeUser`
   * Add support for dynamic `token`
   * `userId` must be always a string without ":"
   * Rename `credentials` option to `token`
 * Move Vuex to peerDependencies.

## 0.2.0
* Add `subscriptionMixin` mixin
  * Adds `isSubscribing` property to component
* Rename `checkEvery` to `cleanEvery`
* Mark package as side effect free

## 0.1.2
* Fix possible bugs

## 0.1.1
* Fix peerDependencies
* Move to yarn from npm
* More familiar API for Vue developers
  * `createLoguxStore` renamed to `createLogux`
  * `createLogux` return `{ Store }`

## 0.1.0
* Initial release.
