# Logux Vuex

<img align="right" width="95" height="148" title="Logux logotype"
     src="https://logux.io/branding/logotype.svg">

Logux is a new way to connect client and server. Instead of sending
HTTP requests (e.g., AJAX and GraphQL) it synchronizes log of operations
between client, server, and other clients.

* **[Guide, recipes, and API](https://logux.io/)**
* **[Chat](https://gitter.im/logux/logux)** for any questions
* **[Issues](https://github.com/logux/logux/issues)**
  and **[roadmap](https://github.com/logux/logux/projects/1)**
* **[Projects](https://logux.io/guide/architecture/parts/)**
  inside Logux ecosystem

This repository contains [Vuex] compatible API on top of the [Logux Client].

The current version is for Vue 3 and Vuex 4. It doesn’t work with Vue 2.
But if you still need for Vue 2 support, use [0.8 version from a separate branch](https://github.com/logux/vuex/tree/0.8).

[Vuex]: https://vuex.vuejs.org
[Logux Client]: https://github.com/logux/client
[logux.io]: https://logux.io/

## Install

```sh
npm install @logux/vuex vuex
```
or
```sh
yarn add @logux/vuex vuex
```

## Usage

See [documentation] for Logux API.

[documentation]: https://github.com/logux/docs

```js
import { createLogux } from '@logux/vuex'

const Logux = createLogux({
  server: process.env.NODE_ENV === 'development'
    ? 'ws://localhost:31337'
    : 'wss://logux.example.com',
  subprotocol: '1.0.0',
  userId: 'anonymous',
  token: ''
})

const store = new Logux.Store({
  state: {},
  mutations: {},
  actions: {},
  modules: {}
})

store.client.start()

export default store
```

```html
<template>
  <logux-component :channels="channels" v-slot="{ isSubscribing }">
    <h1 v-if="isSubscribing">Loading</h1>
    <h1 v-else>{{ user.name }}</h1>
  </logux-component>
</template>

<script>
import { toRefs, computed } from 'vue'
import { useStore, loguxComponent } from '@logux/vuex'

export default {
  components: {
    loguxComponent
  },
  props: {
    userId: String
  },
  setup (props) {
    let store = useStore()
    let { userId } = toRefs(props)

    let user = computed(() => store.state.users[userId])
    let channels = computed(() => [`users/${ userId }`])

    return {
      user,
      channels
    }
  }
}
</script>
```
