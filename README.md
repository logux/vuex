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

The current version is for Vue 3 and Vuex 4.
For Vue 2 support, we have [0.8 version from a separate branch](https://github.com/logux/vuex/tree/0.8).

[Vuex]: https://vuex.vuejs.org
[Logux Client]: https://github.com/logux/client
[logux.io]: https://logux.io/

## Install

```sh
npm install @logux/core @logux/client @logux/vuex vuex@next
```
or
```sh
yarn add @logux/core @logux/client @logux/vuex vuex@next
```

## Usage

See [documentation] for Logux API.

[documentation]: https://github.com/logux/docs

```js
import { CrossTabClient } from '@logux/client'
import { createStoreCreator } from '@logux/vuex'

const client = new CrossTabClient({
  server: process.env.NODE_ENV === 'development'
    ? 'ws://localhost:31337'
    : 'wss://logux.example.com',
  subprotocol: '1.0.0',
  userId: 'anonymous',
  token: ''
})

const createStore = createStoreCreator(client)

const store = createStore({
  state: {},
  mutations: {},
  actions: {},
  modules: {}
})

store.client.start()

export default store
```

## Subscription

### `useSubscription`

Composable function that subscribes for channels during component initialization and unsubscribes on unmount.

```html
<template>
  <h1 v-if="isSubscribing">Loading</h1>
  <h1 v-else>{{ user.name }}</h1>
</template>

<script>
import { toRefs } from 'vue'
import { useStore, useSubscription } from '@logux/vuex'

export default {
  props: ['userId'],
  setup (props) {
    let store = useStore()
    let { userId } = toRefs(props)
    let isSubscribing = useSubscription(() => [`user/${userId.value}`])

    let user = computed(() => store.state.users[userId.value])

    return {
      user,
      isSubscribing
    }
  }
})
</script>
```

### `Subscribe`

Component-wrapper that subscribes for channels during component initialization and unsubscribes on unmount.

```html
<template>
  <subscribe :channels="channels" v-slot="{ isSubscribing }">
    <h1 v-if="isSubscribing">Loading</h1>
    <h1 v-else>{{ user.name }}</h1>
  </subscribe>
</template>

<script>
import { toRefs, computed } from 'vue'
import { Subscribe, useStore } from '@logux/vuex'

export default {
  components: { Subscribe },
  props: ['userId'],
  setup (props) {
    let store = useStore()
    let { userId } = toRefs(props)

    let user = computed(() => store.state.users[userId.value])
    let channels = computed(() => [`users/${userId.value}`])

    return {
      user,
      channels
    }
  }
}
</script>
```

## Using with Typescript

Place the following code in your project to allow this.$store to be typed correctly:

```ts
// shims-vuex.d.ts

import { LoguxVuexStore } from '@logux/vuex'

declare module '@vue/runtime-core' {
  // Declare your own store states.
  interface State {
    count: number
  }

  interface ComponentCustomProperties {
    $store: LoguxVuexStore<State>
  }
}
```

## Devtools

Vue Devtools plugin that adds Logux events to the timeline.

```js
import { createApp } from 'vue'
import { devtools } from '@logux/vuex'

import { store } from './store'

let app = createApp(…)

app.use(devtools, store.client, {
  layers: {
    state: false
  },
  ignoreActions: ['user/add']
})
```
