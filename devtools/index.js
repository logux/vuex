let { setupDevtoolsPlugin } = require('@vue/devtools-api')
let { parseId } = require('@logux/core/parse-id')

const subscriptionLayerId = 'logux:subscription'
const actionLayerId = 'logux:action'
const stateLayerId = 'logux:state'
const cleanLayerId = 'logux:clean'
const roleLayerId = 'logux:role'
const userLayerId = 'logux:user'
const color = 0xf5a623

function devtools (app, client, options = {}) {
  let layers = options.layers || {}
  let ignoreActions = options.ignoreActions || []

  setupDevtoolsPlugin(
    {
      id: 'logux',
      label: 'Logux devtools',
      app
    },
    api => {
      let node = client.node

      let sent = {}
      let cleaned = {}
      let prevConnected = false
      let ignore = (ignoreActions || []).reduce((all, i) => {
        all[i] = true
        return all
      }, {})

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

      client.on('add', (action, meta) => {
        let time = Date.now()

        if (meta.tab && meta.tab !== client.tabId) return
        if (ignore[action.type]) return
        if (meta.sync) sent[meta.id] = action

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
          if (sent[action.id]) {
            let processed = sent[action.id]
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
            } else {
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
            data.type = 'added and cleaned'
          }

          let { nodeId } = parseId(meta.id)
          if (nodeId !== node.localNodeId) {
            data.from = nodeId
          }

          api.addTimelineEvent({
            layerId: actionLayerId,
            event: {
              time,
              data: {
                type: 'added',
                action,
                meta
              }
            }
          })
        }
      })

      api.addTimelineLayer({
        id: userLayerId,
        label: 'Logux User',
        color
      })

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
  )
}

module.exports = { devtools }
