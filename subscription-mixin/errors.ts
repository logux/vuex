import mixins from 'vue-typed-mixins';

import { subscriptionMixin } from "./..";

mixins(subscriptionMixin).extend({
  mounted() {
    // THROWS Type 'boolean' is not assignable to type 'string'.
    let message: string = this.isSubscribing;

    console.log(message);
  }
});
