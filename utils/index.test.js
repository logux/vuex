import { find, deepCopy, isPromise } from '.'

it('find', () => {
  let list = [33, 22, 112, 222, 43]
  expect(find(list, a => { return a % 2 === 0 })).toBe(22)
})

it('deepCopy: nornal structure', () => {
  let original = {
    a: 1,
    b: 'string',
    c: true,
    d: null,
    e: undefined
  }
  let copy = deepCopy(original)

  expect(copy).toEqual(original)
})

it('deepCopy: nested structure', () => {
  let original = {
    a: {
      b: 1,
      c: [2, 3, {
        d: 4
      }]
    }
  }
  let copy = deepCopy(original)

  expect(copy).toEqual(original)
})

it('deepCopy: circular structure', () => {
  let original = {
    a: 1
  }
  original.circular = original

  let copy = deepCopy(original)

  expect(copy).toEqual(original)
})

it('isPromise', () => {
  let promise = new Promise(() => {}, () => {})
  let func = () => {}
  expect(isPromise(1)).toBe(false)
  expect(isPromise(promise)).toBe(true)
  expect(isPromise(func)).toBe(false)
})
