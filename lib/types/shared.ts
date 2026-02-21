import { Timestamp } from 'firebase/firestore'

// Shared type aliases used across multiple domains
export type NervousSystemState = 'regulated' | 'slightly_spiked' | 'spiked'
export type BodyFelt = 'open' | 'neutral' | 'tense'
export type TrainingType = 'strength' | 'yoga' | 'vo2' | 'zone2' | 'rest' | 'none'
export type RevenueStreamType = 'recurring' | 'one_time' | 'organic'
export type SignalType = 'problem' | 'market' | 'research' | 'arbitrage'
export type SignalStatus = 'open' | 'testing' | 'shipped' | 'archived'
export type ProjectStatus = 'spine' | 'pre_launch' | 'backup' | 'archived' | 'optionality'
export type ProjectHealth = 'on_track' | 'stalled' | 'accelerating'
export type MarketSignalType = 'customer_complaint' | 'competitor_move' | 'tech_shift' | 'price_opportunity' | 'distribution'
export type ThesisConnection = 'ai' | 'markets' | 'mind'
export type ThesisPillar = 'ai' | 'markets' | 'mind'
export type NervousSystemTrigger = 'ambiguous_commitment' | 'unseen' | 'stalled_momentum' | 'validation_drop' | 'other'
export type ActionType = 'ship' | 'ask' | 'signal' | 'regulate' | 'explore' | 'compound'
export type ConversationType = 'customer_discovery' | 'sme_discovery' | 'market_conversation' | 'investor' | 'partnership' | 'advisor' | 'other'
export type ExternalSignalSource = 'rss_feed' | 'blog' | 'hacker_news' | 'manual' | 'telegram'
export type ExternalSignalStatus = 'inbox' | 'reviewed' | 'converted' | 'archived'
export type ExternalSignalReadStatus = 'unread' | 'read' | 'disliked'

// Re-export Timestamp for convenience
export { Timestamp }
