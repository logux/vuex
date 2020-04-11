import Vue from 'vue'
import typedMixins from 'vue-typed-mixins'
import Component, { mixins } from 'vue-class-component'

import { subscriptionMixin, SubscriptionComponent } from '..'

// vue-typed-mixins
typedMixins(subscriptionMixin).extend({
  computed: {
    channels () {
      return [
        'user',
        { channel: `user/1`, fields: ['name'] }
      ]
    }
  },
  mounted() {
    console.log(this.isSubscribing)
  }
})

// vue-class-component
const props = Vue.extend({
  props: {
    id: String
  }
})

@Component
class UserList extends mixins(subscriptionMixin, props) implements SubscriptionComponent {
  get channels () {
    return [
      'users',
      { channel: `user/${ this.id }`, fields: ['name'] }
    ]
  }

  mounted() {
    console.log(this.isSubscribing)
  }
}

let photo = new UserList()
console.log(photo)
