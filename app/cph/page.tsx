'use client'

import HuntGame from './HuntGame'

// The live game. Stays on the "get ready" screen until the hunt is unlocked
// from the /cpht console, and freezes at 19:00 Copenhagen time.
export default function CphPage() {
  return <HuntGame env="live" />
}
