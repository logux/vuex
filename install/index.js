const { install: installVuex } = require('vuex')

function installLoguxVuex (Vue) {
  Vue.mixin({
    beforeCreate () {
      if (this.$store) {
        this.$logux = this.$store
      }
    }
  })
}

function LoguxVuex (Vue) {
  installVuex(Vue)
  installLoguxVuex(Vue)
}

module.exports = { LoguxVuex }
