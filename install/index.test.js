let { TestTime } = require('@logux/core')
let { mount, createLocalVue } = require('@vue/test-utils')

let { LoguxVuex, createLogux } = require('..')

function createComponent (component) {
  let localVue = createLocalVue()

  localVue.use(LoguxVuex)

  let Logux = createLogux({
    subprotocol: '1.0.0',
    server: 'wss://localhost:1337',
    userId: '10',
    time: new TestTime()
  })

  let store = new Logux.Store(() => ({ state: { value: 0 } }))
  let wrapper = mount(component, { localVue, store })

  return wrapper
}

it('provide $logux', () => {
  let child = {
    render: h => h('div')
  }
  let component = createComponent({
    render (h) {
      return h('div', [h(child)])
    }
  })

  expect(component.vm.$logux).toEqual(component.vm.$store)
  expect(component.vm.$children[0].$logux).toEqual(component.vm.$children[0].$store)
})
