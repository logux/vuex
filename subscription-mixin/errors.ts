import Component, { mixins } from 'vue-class-component'

import { subscriptionMixin } from '..'

@Component
class UserPhoto extends mixins(subscriptionMixin) {
  mounted() {
    // THROWS Type 'boolean' is not assignable to type 'string'.
    let message: string = this.isSubscribing

    console.log(message)
  }
}

let photo = new UserPhoto()
console.log(photo);
