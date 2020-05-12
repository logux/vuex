# Change Log
This project adheres to [Semantic Versioning](http://semver.org/).

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
