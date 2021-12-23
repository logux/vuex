export function unifyChannelsObject (channels) {
  if (!channels) {
    return [[{}, '']]
  }
  return channels.map(i => {
    let subscription = typeof i === 'string' ? { channel: i } : i
    return [subscription, JSON.stringify(subscription)]
  })
}

export function subscriptionsId (subscriptions) {
  return subscriptions.map(i => i[1]).sort().join(' ')
}

export function subscribe (store, subscriptions) {
  if (!store.subscriptions) store.subscriptions = {}
  if (!store.subscribers) store.subscribers = {}

  return Promise.all(subscriptions.map(i => {
    let subscription = i[0]
    let json = i[1]
    if (!store.subscribers[json]) store.subscribers[json] = 0
    store.subscribers[json] += 1
    if (store.subscribers[json] === 1) {
      let action = { ...subscription, type: 'logux/subscribe' }
      store.subscriptions[json] = store.commit.sync(action)
    }
    return store.subscriptions[json]
  }))
}

export function unsubscribe (store, subscriptions) {
  subscriptions.forEach(i => {
    let subscription = i[0]
    let json = i[1]
    store.subscribers[json] -= 1
    if (store.subscribers[json] === 0) {
      let action = { ...subscription, type: 'logux/unsubscribe' }
      store.log.add(action, { sync: true })
      delete store.subscriptions[json]
    }
  })
}
