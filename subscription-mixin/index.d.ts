import type { ExtendedVue, Vue } from "vue/types/vue";

export type LoguxSubscription = {
  channel: string
  [key: string]: any
};

export const subscriptionMixin: ExtendedVue<
  Vue,
  {
    isSubscribing: boolean,
    $_loguxVuex_ignoreResponse: {
      [id: string]: boolean
    }
  },
  {
    $_loguxVuex_subscribe(subscriptions: LoguxSubscription[]): Promise<void>;
    $_loguxVuex_unsubscribe(subscriptions: LoguxSubscription[]): void;
  },
  {},
  {}
>
