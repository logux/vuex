import Vuex from 'vuex'

function installLoguxVuex (Vue) {
  Vue.mixin({
    beforeCreate () {
      if (this.$store) {
        this.$logux = this.$store
      }
    }
  })
}

export function LoguxVuex (Vue) {
  Vue.use(Vuex)
  installLoguxVuex(Vue)
}
