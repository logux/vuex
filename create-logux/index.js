let { createNanoEvents } = require('nanoevents')
let { CrossTabClient } = require('@logux/client/cross-tab-client')
let { isFirstOlder } = require('@logux/core/is-first-older')
let Vuex = require('vuex')

let { deepCopy, forEachValue } = require('../utils')

function createLogux (config = {}) {
  let reasonlessHistory = config.reasonlessHistory || 1000
  let saveStateEvery = config.saveStateEvery || 50
  let onMissedHistory = config.onMissedHistory
  let cleanEvery = config.cleanEvery || 25

  delete config.reasonlessHistory
  delete config.saveStateEvery
  delete config.onMissedHistory
  delete config.cleanEvery

  let client = new CrossTabClient(config)
  let log = client.log

  let Store = function Store (vuexConfig) {
    let store = new Vuex.Store(deepCopy(vuexConfig))
    let mutations = collectMutations(deepCopy(vuexConfig))
    let emitter = createNanoEvents()

    let historyCleaned = false
    let stateHistory = {}
    let processing = {}

    let actionCount = 0
    function saveHistory (meta) {
      actionCount += 1
      if (saveStateEvery === 1 || actionCount % saveStateEvery === 1) {
        stateHistory[meta.id] = deepCopy(store.state)
      }
    }

    store.client = client
    store.log = log
    store.on = emitter.on.bind(emitter)

    let init
    store.initialize = new Promise(resolve => {
      init = resolve
    })

    let prevMeta
    let storeCommit = store.commit

    function originCommit (action, options) {
      if (action.type === 'logux/state') {
        store.replaceState(action.state)
        return
      }
      if (action.type in store._mutations) {
        if (hasSimplePayload(action)) {
          storeCommit(action.type, action.payload, options)
          return
        }
        storeCommit(action, options)
      }
    }

    store.commit = (type, payload, _options) => {
      let { action, options } = unifyCommitArgs(type, payload, _options)
      let meta = {
        id: log.generateId(),
        tab: store.client.tabId,
        reasons: ['timeTravelTab' + store.client.tabId],
        commit: true
      }

      log.add(action, meta)
      prevMeta = meta
      let prevState = deepCopy(store.state)
      originCommit(action, options)
      emitter.emit('change', deepCopy(store.state), prevState, action, meta)
      saveHistory(meta)
    }

    store.local = (type, payload, _meta) => {
      let { action, meta } = unifyCommitArgs(type, payload, _meta)
      meta.tab = client.tabId
      if (meta.reasons || meta.keepLast) meta.noAutoReason = true
      return log.add(action, meta)
    }

    store.crossTab = (type, payload, _meta) => {
      let { action, meta } = unifyCommitArgs(type, payload, _meta)
      if (meta.reasons || meta.keepLast) meta.noAutoReason = true
      return log.add(action, meta)
    }

    store.sync = (type, payload, _meta) => {
      let { action, meta } = unifyCommitArgs(type, payload, _meta)
      if (meta.reasons || meta.keepLast) meta.noAutoReason = true

      meta.sync = true

      if (typeof meta.id === 'undefined') {
        meta.id = log.generateId()
      }

      return new Promise((resolve, reject) => {
        processing[meta.id] = [resolve, reject]
        log.add(action, meta)
      })
    }

    store.commit.local = store.local
    store.commit.crossTab = store.crossTab
    store.commit.sync = store.sync

    function replaceState (state, actions, pushHistory) {
      let last = actions.length ? actions[actions.length - 1][1] : ''
      let newState = actions.reduceRight((prev, [action, id]) => {
        let changed = deepCopy(prev)

        if (action.type in mutations) {
          mutations[action.type].forEach(mutation => {
            let mutationState = changed
            if (mutation.path.length) {
              mutationState = mutation.path.reduce((obj, key) => {
                return obj[key]
              }, changed)
            }

            let mutationPayload = action
            if (hasSimplePayload(action)) {
              mutationPayload = action.payload
            }
            mutation.fn(mutationState, mutationPayload)
          })
        }

        if (pushHistory && id === last) {
          stateHistory[pushHistory] = changed
        } else if (stateHistory[id]) {
          stateHistory[id] = changed
        }

        return changed
      }, state)
      originCommit({ type: 'logux/state', state: newState })
      return newState
    }

    let replaying
    function replay (actionId) {
      let ignore = {}
      let actions = []
      let replayed = false
      let newAction
      let collecting = true

      replaying = new Promise(resolve => {
        log.each((action, meta) => {
          if (meta.tab && meta.tab !== client.tabId) return true

          if (collecting || !stateHistory[meta.id]) {
            if (action.type === 'logux/undo') {
              ignore[action.id] = true
              return true
            } else if (action.type.startsWith('logux/')) {
              return true
            }

            if (!ignore[meta.id]) actions.push([action, meta.id])
            if (meta.id === actionId) {
              newAction = action
              collecting = false
            }

            return true
          } else {
            replayed = true
            replaceState(stateHistory[meta.id], actions)
            return false
          }
        }).then(() => {
          if (!replayed) {
            if (historyCleaned) {
              if (onMissedHistory) {
                onMissedHistory(newAction)
              }
              for (let i = actions.length - 1; i >= 0; i--) {
                let id = actions[i][1]
                if (stateHistory[id]) {
                  replayed = true
                  replaceState(
                    stateHistory[id],
                    actions.slice(0, i).concat([[newAction, actionId]]),
                    id
                  )
                  break
                }
              }
            }

            if (!replayed) {
              let state = collectState(deepCopy(vuexConfig))
              replaceState(state, actions)
            }
          }

          replaying = false
          resolve()
        })
      })

      return replaying
    }

    log.on('preadd', (action, meta) => {
      let type = action.type
      let isLogux = type.startsWith('logux/')
      if (type === 'logux/undo') {
        meta.reasons.push('reasonsLoading')
      }
      if (!isLogux && !isFirstOlder(prevMeta, meta)) {
        meta.reasons.push('replay')
      }
      if (!isLogux && !meta.noAutoReason && !meta.commit) {
        meta.reasons.push('timeTravel')
      }
    })

    let wait = {}

    async function process (action, meta) {
      if (replaying) {
        wait[meta.id] = true
        await replaying
        if (wait[meta.id]) {
          delete wait[meta.id]
          await process(action, meta)
        }
        return
      }

      if (action.type === 'logux/undo') {
        let [undoAction, undoMeta] = await log.byId(action.id)
        if (undoAction) {
          log.changeMeta(meta.id, {
            reasons: undoMeta.reasons.filter(i => i !== 'syncing')
          })
          delete stateHistory[action.id]
          await replay(action.id)
        } else {
          await log.changeMeta(meta.id, { reasons: [] })
        }
        if (processing[action.id]) {
          let error = new Error(
            'Server undid Logux action because of ' + action.reason
          )
          error.action = action
          processing[action.id][1](error)
          delete processing[action.id]
        }
      } else if (!action.type.startsWith('logux/')) {
        if (isFirstOlder(prevMeta, meta)) {
          prevMeta = meta
          originCommit(action)
          if (meta.added) saveHistory(meta)
        } else {
          await replay(meta.id)
          if (meta.reasons.includes('replay')) {
            log.changeMeta(meta.id, {
              reasons: meta.reasons.filter(i => i !== 'replay')
            })
          }
        }
      }
    }

    let lastAdded = 0
    let addCalls = 0
    client.on('add', (action, meta) => {
      if (meta.added > lastAdded) lastAdded = meta.added

      if (action.type === 'logux/processed') {
        if (processing[action.id]) {
          processing[action.id][0](meta)
          delete processing[action.id]
        }
      } else if (!meta.noAutoReason) {
        addCalls += 1
        if (addCalls % cleanEvery === 0 && lastAdded > reasonlessHistory) {
          historyCleaned = true
          log.removeReason('timeTravel', {
            maxAdded: lastAdded - reasonlessHistory
          })
          log.removeReason('timeTravelTab' + store.client.tabId, {
            maxAdded: lastAdded - reasonlessHistory
          })
        }
      }

      if (!meta.commit) {
        let prevState = deepCopy(store.state)
        process(action, meta).then(() => {
          let currentState = deepCopy(store.state)
          emitter.emit('change', currentState, prevState, action, meta)
        })
      }
    })

    client.on('clean', (action, meta) => {
      delete wait[meta.id]
      delete stateHistory[meta.id]
    })

    let previous = []
    let ignores = {}
    log.each((action, meta) => {
      if (!meta.tab) {
        if (action.type === 'logux/undo') {
          ignores[action.id] = true
        } else if (!ignores[meta.id]) {
          previous.push([action, meta])
        }
      }
    }).then(() => {
      if (previous.length > 0) {
        Promise.all(previous.map(i => process(...i))).then(init)
      } else {
        init()
      }
    })

    return store
  }

  return { Store }
}

function hasSimplePayload (action) {
  return 'payload' in action && typeof action.payload !== 'object'
}

function unifyCommitArgs (type, payload = {}, options = {}) {
  let action
  let meta

  if (typeof type === 'object' && type.type) {
    action = type
    meta = payload
  }

  if (typeof type === 'string') {
    if (typeof payload === 'object') {
      action = { type, ...payload }
    } else {
      action = { type, payload }
    }
    meta = options
  }

  return { action, meta, options: meta }
}

function collectState (store) {
  let state = store.state || {}
  function collectModuleState (module, moduleName, moduleState) {
    if (moduleName) {
      moduleState[moduleName] = module.state
    }
    if (module.modules) {
      forEachValue(module.modules, (childModule, childModuleName) => {
        let childModuleState =
          moduleName ? moduleState[moduleName] : moduleState
        collectModuleState(childModule, childModuleName, childModuleState)
      })
    }
  }
  collectModuleState(store, false, state)
  return state
}

function collectMutations (store) {
  let mutations = []
  function collectModuleMutations (module, moduleName, _namespace, _path) {
    let namespace = _namespace || ''
    let path = _path || []
    if (moduleName) {
      if (module.namespaced) {
        namespace = _namespace + moduleName + '/'
      }
      path = [..._path, moduleName]
    }
    if (module.mutations) {
      forEachValue(module.mutations, (mutation, _type) => {
        let type = namespace + _type
        let entry = mutations[type] || (mutations[type] = [])
        entry.push({ fn: mutation, path })
      })
    }
    if (module.modules) {
      forEachValue(module.modules, (childModule, childModuleName) => {
        collectModuleMutations(childModule, childModuleName, namespace, path)
      })
    }
  }
  collectModuleMutations(store)
  return mutations
}

module.exports = { createLogux }
