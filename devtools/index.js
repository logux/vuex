import { setupDevtoolsPlugin } from '@vue/devtools-api'
import { parseId } from '@logux/core/parse-id'

const subscriptionLayerId = 'logux:subscription'
const actionLayerId = 'logux:action'
const stateLayerId = 'logux:state'
const cleanLayerId = 'logux:clean'
const roleLayerId = 'logux:role'
const userLayerId = 'logux:user'
const color = 0xf5a623

export function devtools (app, client, options = {}) {
  let layers = options.layers || {}
  let ignoreActions = options.ignoreActions || []

  let node = client.node

  let sent = {}
  let cleaned = {}
  let subscribing = {}
  let prevConnected = false
  let ignore = ignoreActions.reduce((all, i) => {
    all[i] = true
    return all
  }, {})

  setupDevtoolsPlugin(
    {
      id: 'logux',
      label: 'Logux devtools',
      packageName: '@logux/vuex',
      homepage: 'https://github.com/logux/vuex',
      app
    },
    api => {
      if (layers.state !== false) {
        api.addTimelineLayer({
          id: stateLayerId,
          label: 'Logux State',
          color
        })
      }

      if (layers.role !== false) {
        api.addTimelineLayer({
          id: roleLayerId,
          label: 'Logux Tab Role',
          color
        })
      }

      if (layers.action !== false) {
        api.addTimelineLayer({
          id: actionLayerId,
          label: 'Logux Action',
          color
        })
      }

      if (layers.subscription !== false) {
        api.addTimelineLayer({
          id: subscriptionLayerId,
          label: 'Logux Subscription',
          color
        })
      }

      if (layers.user !== false) {
        api.addTimelineLayer({
          id: userLayerId,
          label: 'Logux User',
          color
        })
      }

      if (layers.clean !== false) {
        api.addTimelineLayer({
          id: cleanLayerId,
          label: 'Logux Clean',
          color
        })
      }

      if (layers.state !== false) {
        client.on('state', () => {
          let details
          let time = Date.now()

          if (client.state === 'connecting' && node.connection.url) {
            details = {
              nodeId: node.localNodeId,
              server: node.connection.url
            }
          } else if (client.connected && !prevConnected && node.remoteNodeId) {
            prevConnected = true
            details = {
              server: node.remoteNodeId
            }
          } else if (!client.connected) {
            prevConnected = false
          }

          let data = {
            state: client.state
          }

          if (details) {
            data.details = details
          }

          api.addTimelineEvent({
            layerId: stateLayerId,
            event: {
              time,
              data
            }
          })
        })
      }

      if (layers.role !== false) {
        client.on('role', () => {
          api.addTimelineEvent({
            layerId: roleLayerId,
            event: {
              time: Date.now(),
              data: {
                role: client.role
              }
            }
          })
        })
      }

      if (layers.subscription !== false) {
        client.on('add', (action, meta) => {
          if (
            action.type !== 'logux/subscribe' &&
            action.type !== 'logux/unsubscribe' &&
            action.type !== 'logux/processed'
          ) return

          if (meta.tab && meta.tab !== client.tabId) return
          if (ignore[action.type]) return
          subscribing[meta.id] = action

          let time = Date.now()

          if (action.type === 'logux/subscribe') {
            let data = {
              type: 'subscribing',
              channel: action.channel
            }

            if (Object.keys(action).length === 2) {
              data.action = action
            }

            api.addTimelineEvent({
              layerId: subscriptionLayerId,
              event: { time, data }
            })
          } else if (action.type === 'logux/unsubscribe') {
            let data = {
              type: 'unsubscribed',
              channel: action.channel
            }

            if (Object.keys(action).length === 2) {
              data.action = action
            }

            api.addTimelineEvent({
              layerId: subscriptionLayerId,
              event: { time, data }
            })
          } else if (action.type === 'logux/processed') {
            if (subscribing[action.id]) {
              let processed = subscribing[action.id]
              if (processed.type === 'logux/subscribe') {
                api.addTimelineEvent({
                  layerId: subscriptionLayerId,
                  event: {
                    time,
                    data: {
                      type: 'subscribed',
                      channel: processed.channel,
                      action: processed
                    }
                  }
                })
                delete subscribing[action.id]
              }
              if (processed.type === 'logux/unsubscribe') {
                delete subscribing[action.id]
              }
            }
          }
        })
      }

      if (layers.action !== false) {
        client.on('add', (action, meta) => {
          if (meta.tab && meta.tab !== client.tabId) return
          if (ignore[action.type]) return
          if (meta.sync) sent[meta.id] = action

          let time = Date.now()

          if (
            action.type !== 'logux/subscribe' &&
            action.type !== 'logux/unsubscribe'
          ) {
            if (action.type === 'logux/processed') {
              if (sent[action.id]) {
                let processed = sent[action.id]
                if (processed.type !== 'logux/subscribe') {
                  api.addTimelineEvent({
                    layerId: actionLayerId,
                    event: {
                      time,
                      data: {
                        type: 'processed',
                        action: processed
                      }
                    }
                  })
                }
                delete sent[action.id]
              } else {
                api.addTimelineEvent({
                  layerId: actionLayerId,
                  event: {
                    time,
                    data: {
                      type: 'processed',
                      action
                    }
                  }
                })
              }
            } else if (action.type === 'logux/undo') {
              let data = {
                type: 'undid',
                actionId: action.id,
                reason: action.reason
              }

              if (sent[action.id]) {
                data.details = {
                  action: sent[action.id]
                }
                delete sent[action.id]
              }

              if (Object.keys(action).length > 3) {
                if (!data.details) data.details = {}
                data.details.undo = action
              }

              api.addTimelineEvent({
                layerId: actionLayerId,
                event: { time, data }
              })
            } else {
              let data = {
                type: 'added',
                action,
                meta
              }

              if (meta.reasons.length === 0) {
                cleaned[meta.id] = true
                data.type += ' and cleaned'
              }

              let { nodeId } = parseId(meta.id)
              if (nodeId !== node.localNodeId) {
                data.from = nodeId
              }

              api.addTimelineEvent({
                layerId: actionLayerId,
                event: { time, data }
              })
            }
          }
        })
      }

      if (layers.user !== false) {
        client.on('user', userId => {
          api.addTimelineEvent({
            layerId: userLayerId,
            event: {
              time: Date.now(),
              data: {
                userId,
                nodeId: client.nodeId
              }
            }
          })
        })
      }

      if (layers.clean !== false) {
        client.on('clean', (action, meta) => {
          if (cleaned[meta.id]) {
            delete cleaned[meta.id]
            return
          }
          if (meta.tab && meta.tab !== client.id) return
          if (ignore[action.type]) return
          if (action.type.startsWith('logux/')) return

          api.addTimelineEvent({
            layerId: cleanLayerId,
            event: {
              time: Date.now(),
              data: { action, meta }
            }
          })
        })
      }
    }
  )
}
