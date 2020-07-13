function isPromise (val) {
  return val && typeof val.then === 'function'
}

module.exports = { isPromise }
