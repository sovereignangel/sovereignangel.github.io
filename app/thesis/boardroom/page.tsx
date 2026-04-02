'use client'

import TheMachine from '@/components/thesis/boardroom/TheMachine'
import MachineDial from '@/components/thesis/boardroom/MachineDial'

export default function BoardRoomPage() {
  return (
    <div className="h-full grid gap-2 min-h-0 grid-cols-1 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="space-y-3 py-2">
            <TheMachine />
          </div>
        </div>
      </div>
      <div className="min-h-0 overflow-y-auto">
        <MachineDial />
      </div>
    </div>
  )
}
