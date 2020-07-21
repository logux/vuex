import { Ref, ComputedRef } from 'vue'

import { Channel } from '..'

export type Channels = ComputedRef<Channel[]> | Channel[]

/*
 * @param channels Channels to subscribe.
 * @return `true` during data loading.
 */
export function useSubscription (
  channels: Channels
): Ref<boolean>
