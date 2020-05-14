import Vue from 'vue'
import typedMixins from 'vue-typed-mixins'
import Component, { mixins } from 'vue-class-component'

import { loguxMixin, loguxMixinComponent } from '.'

// vue-typed-mixins
typedMixins(loguxMixin).extend({
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
class UserList extends mixins(loguxMixin, props) implements loguxMixinComponent {
  get channels () {
    return [
      'users',
      { channel: `user/${ this.id }`, fields: ['name'] }
    ]
  }

  mounted() {
    console.log(this.isSubscribing)

    // just a positive test
    this.$_logux_subscribe([[{ channel: 'users' }, '']])
  }
}

let photo = new UserList()
console.log(photo)
