import React from 'react'

const TurnHUD = ({ playerName, isMyTurn, turnTimeLeft }) => (
  <div
    className="absolute top-7 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 rounded-full"
    style={{
      background: 'rgba(0,0,0,0.7)',
      border: isMyTurn ? '1px solid rgba(125,211,252,0.6)' : '1px solid rgba(255,255,255,0.15)',
      backdropFilter: 'blur(8px)',
    }}
  >
    <span className={`w-2 h-2 rounded-full animate-pulse ${isMyTurn ? 'bg-sky-300' : 'bg-white/40'}`} />
    <span className="text-white text-sm font-medium">
      {isMyTurn
        ? <span className="text-sky-300 font-bold">Your turn</span>
        : <span className="text-white/60">{playerName}'s turn</span>
      }
    </span>
    <span className="font-mono text-xs text-white/50 ml-1">{turnTimeLeft}s</span>
  </div>
)

export default TurnHUD
