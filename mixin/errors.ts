import Component, { mixins } from 'vue-class-component'

import { loguxMixin } from '..'

@Component
class UserPhoto extends mixins(loguxMixin) {
  mounted() {
    // THROWS Type 'boolean' is not assignable to type 'string'.
    let message: string = this.isSubscribing

    // THROWS Type 'never[]' is not assignable to type 'string'.
    this.$_logux_subscribe([[{ channel: [] }, '']])

    console.log(message)
  }
}

let photo = new UserPhoto()
console.log(photo)
