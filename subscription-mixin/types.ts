import mixins from 'vue-typed-mixins';

import { subscriptionMixin } from "./..";

mixins(subscriptionMixin).extend({
  mounted() {
    console.log(this.isSubscribing);
  }
});
