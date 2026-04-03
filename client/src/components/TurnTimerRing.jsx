import React from 'react'
import { TURN_DURATION_SEC } from './sessionConstants'

const TurnTimerRing = ({ seconds, total = TURN_DURATION_SEC, urgency }) => {
  const r = 22
  const circ = 2 * Math.PI * r
  const progress = (seconds / total) * circ
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="56" height="56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
        <circle
          cx="28" cy="28" r={r} fill="none"
          stroke={urgency ? '#ef4444' : '#7dd3fc'}
          strokeWidth="3"
          strokeDasharray={`${progress} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s linear, stroke 0.5s' }}
        />
      </svg>
      <span className={`font-mono font-bold text-sm ${urgency ? 'text-red-400' : 'text-white'}`}>
        {seconds}
      </span>
    </div>
  )
}

export default TurnTimerRing
