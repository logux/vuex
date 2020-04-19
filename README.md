# Logux Vuex

<img align="right" width="95" height="148" title="Logux logotype"
     src="https://logux.io/branding/logotype.svg">

Logux is a new way to connect client and server. Instead of sending
HTTP requests (e.g., AJAX and GraphQL) it synchronizes log of operations
between client, server, and other clients.

**Documentation: [logux.io]**

This repository contains [Vuex] compatible API on top of [Logux Client].

[Vuex]: https://vuex.vuejs.org
[Logux Client]: https://github.com/logux/client
[logux.io]: https://logux.io/

## Install

```sh
npm install @logux/vuex vuex
```

## Usage

See [documentation] for Logux API.

[documentation]: https://github.com/logux/docs

```js
import Vue from 'vue'
import Vuex from 'vuex'
import { createLogux } from '@logux/vuex'

Vue.use(Vuex)

const Logux = createLogux({
  subprotocol: '1.0.0',
  server: process.env.NODE_ENV === 'development'
    ? 'ws://localhost:31337'
    : 'wss://logux.example.com',
  userId: '',
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
  <div v-if="isSubscribing">
    <h1>Loading</h1>
  </div>
  <div v-else>
    <h1>{{ counter }}</h1>
    <button @click="increment" />
  </div>
</template>

<script>
import { subscriptionMixin } from '@logux/vuex'

export default {
  name: 'Counter',
  mixins: [subscriptionMixin],
  computed: {
    // Retrieve counter state from store
    counter () {
      return this.$store.state.counter
    },
    // Load current counter from server and subscribe to counter changes
    channels () {
      return ['counter']
    }
  },
  methods: {
    increment () {
      // Send action to the server and all tabs in this browser
      this.$store.commit.sync({ type: 'INC' })
    }
  }
}
</script>
```
