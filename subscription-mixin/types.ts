import mixins from 'vue-typed-mixins';

import { subscriptionMixin } from "./..";

mixins(subscriptionMixin).extend({
  computed: {
    channels () {
      return [
        'user',
        { channel: `user/1`, fields: ['name'] }
      ]
    }
  },
  mounted() {
    console.log(this.isSubscribing);
  }
});
