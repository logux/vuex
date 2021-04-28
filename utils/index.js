export function find (list, f) {
  return list.filter(f)[0]
}

export function deepCopy (obj, cache = []) {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  let hit = find(cache, c => c.original === obj)
  if (hit) {
    return hit.copy
  }

  let copy = Array.isArray(obj) ? [] : {}
  cache.push({
    original: obj,
    copy
  })

  Object.keys(obj).forEach(key => {
    copy[key] = deepCopy(obj[key], cache)
  })

  return copy
}

export function forEachValue (obj, fn) {
  Object.keys(obj).forEach(key => fn(obj[key], key))
}

export function isPromise (val) {
  return val && typeof val.then === 'function'
}
