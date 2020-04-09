import Vue from 'vue';
import typedMixins from 'vue-typed-mixins'
import Component, { mixins } from 'vue-class-component';

import { Subscription, SubscriptionComponent, subscriptionMixin } from '..'

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
    name: String
  }
});

@Component
class UserPhoto extends mixins(subscriptionMixin, props) implements SubscriptionComponent {
  get channels (): Subscription[] {
    return [
      'user',
      { channel: `user/${ this.name }`, fields: ['name'] }
    ]
  }

  mounted() {
    console.log(this.isSubscribing)
  }
}

let photo = new UserPhoto();
console.log(photo);
