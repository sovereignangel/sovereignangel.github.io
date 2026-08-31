export * from './types'
export * from './engine'
export { COMPLEXECON_CAMPAIGN } from './complexecon'
export { ARMSTRONG_CAMPAIGN, TRACK_RECORD_CLOSE } from './armstrong'

import type { Campaign, CampaignId } from './types'
import { COMPLEXECON_CAMPAIGN } from './complexecon'
import { ARMSTRONG_CAMPAIGN } from './armstrong'

export const CAMPAIGNS: Record<CampaignId, Campaign> = {
  complexecon: COMPLEXECON_CAMPAIGN,
  armstrong: ARMSTRONG_CAMPAIGN,
}
