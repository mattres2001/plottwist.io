import React from 'react'
import TurnTimerRing from './TurnTimerRing'
import { SCREENPLAY_ACTIONS, TURN_DURATION_SEC } from './sessionConstants'

const ActionPrompt = ({ playerName, isMyTurn, onSelectAction, turnTimeLeft }) => {
  const urgency = turnTimeLeft <= 10

  if (!isMyTurn) {
    return (
      <div
        className="fixed right-8 top-1/2 z-50 -translate-y-1/2 flex items-center gap-4 px-5 py-3 rounded-2xl shadow-xl"
        style={{ background: 'rgba(10,10,20,0.85)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)' }}
      >
        <span className="w-2.5 h-2.5 rounded-full bg-white/40 animate-pulse" />
        <span className="text-white/80 text-sm font-medium">
          Waiting for <span className="text-white font-bold">{playerName}</span> to pick an action…
        </span>
        <TurnTimerRing seconds={turnTimeLeft} total={TURN_DURATION_SEC} urgency={urgency} />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-[520px] rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(135deg, rgba(15,15,25,0.97) 0%, rgba(30,20,50,0.97) 100%)', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        <div className="px-6 pt-5 pb-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Your Turn</p>
            <h2 className="text-white font-bold text-xl">Choose your next move</h2>
          </div>
          <TurnTimerRing seconds={turnTimeLeft} total={TURN_DURATION_SEC} urgency={urgency} />
        </div>
        <div className="p-5 grid grid-cols-1 gap-2">
          {SCREENPLAY_ACTIONS.map((action) => (
            <button
              key={action.tag}
              onClick={() => onSelectAction(action)}
              className="group flex items-center gap-4 px-5 py-3.5 rounded-xl text-left transition-all duration-200 hover:scale-[1.02] cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(125,211,252,0.15)'; e.currentTarget.style.borderColor = 'rgba(125,211,252,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
            >
              <span className="text-2xl w-8 text-center">{action.icon}</span>
              <div className="flex-1">
                <span className="text-white font-semibold tracking-wide">[{action.label}]</span>
                <span className="text-white/40 text-sm ml-3">{action.desc}</span>
              </div>
              <span className="text-sky-300/0 group-hover:text-sky-300/80 text-lg transition-all duration-200">→</span>
            </button>
          ))}
        </div>
        <div className="h-1 w-full bg-white/10 relative overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${urgency ? 'bg-red-500' : 'bg-sky-300'}`}
            style={{ width: `${(turnTimeLeft / TURN_DURATION_SEC) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default ActionPrompt
