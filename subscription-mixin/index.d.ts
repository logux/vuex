import type { ExtendedVue, Vue } from 'vue/types/vue'

export type Channel = string | {
  channel: string
  [key: string]: any
}

export interface SubscriptionComponent {
  channels: Channel[]
}

export const subscriptionMixin: ExtendedVue<
  Vue,
  {
    isSubscribing: boolean,
    $_loguxVuex_ignoreResponse: {
      [id: string]: boolean
    }
  },
  {
    $_loguxVuex_subscribe(subscriptions: Channel[]): Promise<void>
    $_loguxVuex_unsubscribe(subscriptions: Channel[]): void
  },
  {},
  {}
>
