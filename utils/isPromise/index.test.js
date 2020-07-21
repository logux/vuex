let { isPromise } = require('.')

it('isPromise', () => {
  let promise = new Promise(() => {}, () => {})
  let func = () => {}
  expect(isPromise(1)).toBe(false)
  expect(isPromise(promise)).toBe(true)
  expect(isPromise(func)).toBe(false)
})
