const { install: installVuex } = require('vuex')

function installLoguxVuex (Vue) {
  Vue.mixin({
    beforeCreate () {
      if (this.$options.store) {
        this.$logux = this.$options.store
      }
    }
  })
}

function LoguxVuex (Vue) {
  installVuex(Vue)
  installLoguxVuex(Vue)
}

module.exports = { LoguxVuex }
