export * from './types'
export * from './engine'
export { COMPLEXECON_CAMPAIGN } from './complexecon'
export { ARMSTRONG_CAMPAIGN, TRACK_RECORD_CLOSE } from './armstrong'
export { CHESS_CAMPAIGN } from './chess'

import type { Campaign, CampaignId } from './types'
import { COMPLEXECON_CAMPAIGN } from './complexecon'
import { ARMSTRONG_CAMPAIGN } from './armstrong'
import { CHESS_CAMPAIGN } from './chess'

export const CAMPAIGNS: Record<CampaignId, Campaign> = {
  complexecon: COMPLEXECON_CAMPAIGN,
  armstrong: ARMSTRONG_CAMPAIGN,
  chess: CHESS_CAMPAIGN,
}
