import { useState, useEffect } from 'react'
import { assets } from "../assets/assets.js"

const MIN_PLAYERS = 2
const MAX_PLAYERS = 4

// ─── Waiting Room ────────────────────────────────────────────────────────────
const WaitingRoom = ({ sessionCode, players, onStart, isHost }) => {
  const canStart = players.length >= MIN_PLAYERS
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative h-screen w-screen flex items-center justify-center overflow-hidden">
      <img
        src={assets.bg_image_login}
        className="absolute inset-0 h-full w-full object-cover"
        alt="background"
      />
      <div className="absolute inset-0 bg-black/65" />

      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 2px)',
        }}
      />

      <div className="absolute top-10 right-6 z-20 bg-black/60 text-white px-3 py-1 rounded-lg font-mono text-base">
        Session Code: {sessionCode || '—'}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-lg px-4">

        <div className="text-center">
          <h1 className="text-white font-bold text-4xl tracking-tight drop-shadow-lg">
            Waiting for players to join{dots}
          </h1>
          <p className="text-white/40 text-sm mt-2">
            At least {MIN_PLAYERS} players needed to start
          </p>
        </div>

        <div
          className="w-full rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(10,10,20,0.7)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            className="px-6 py-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span className="text-white/50 text-xs uppercase tracking-widest font-mono">
              Players
            </span>
            <span className="text-white/50 text-xs font-mono">
              <span className={players.length >= MIN_PLAYERS ? 'text-sky-300' : 'text-white/50'}>
                {players.length}
              </span>
              <span className="text-white/30"> / {MAX_PLAYERS}</span>
            </span>
          </div>

          <div className="p-4 flex flex-col gap-2">
            {Array.from({ length: MAX_PLAYERS }).map((_, i) => {
              const player = players[i]
              const isYou = i === 0
              return (
                <div
                  key={i}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300"
                  style={{
                    background: player
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(255,255,255,0.02)',
                    border: player
                      ? isYou
                        ? '1px solid rgba(125,211,252,0.3)'
                        : '1px solid rgba(255,255,255,0.08)'
                      : '1px dashed rgba(255,255,255,0.08)',
                  }}
                >
                  {player ? (
                    <>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{
                          background: isYou
                            ? 'rgba(125,211,252,0.2)'
                            : 'rgba(255,255,255,0.1)',
                          border: isYou
                            ? '1px solid rgba(125,211,252,0.5)'
                            : '1px solid rgba(255,255,255,0.15)',
                          color: isYou ? '#7dd3fc' : 'rgba(255,255,255,0.7)',
                        }}
                      >
                        {player[0].toUpperCase()}
                      </div>
                      <span className={`font-medium text-sm ${isYou ? 'text-sky-300' : 'text-white/80'}`}>
                        {player}
                      </span>
                      {isYou && (
                        <span className="ml-auto text-sky-300/50 text-xs font-mono uppercase tracking-wider">
                          You {isHost ? '· Host' : ''}
                        </span>
                      )}
                      {i === 1 && (
                        <span className="ml-auto">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.1)' }}
                      />
                      <span className="text-white/20 text-sm italic">
                        Waiting for player{dots}
                      </span>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Start button — host only */}
        {isHost ? (
          <button
            onClick={canStart ? onStart : undefined}
            disabled={!canStart}
            className="w-full py-4 rounded-xl font-bold text-base tracking-wide transition-all duration-300"
            style={{
              background: canStart
                ? 'linear-gradient(135deg, #38bdf8 0%, #7dd3fc 100%)'
                : 'rgba(255,255,255,0.06)',
              color: canStart ? '#001a2e' : 'rgba(255,255,255,0.2)',
              border: canStart
                ? '1px solid rgba(125,211,252,0.6)'
                : '1px solid rgba(255,255,255,0.08)',
              cursor: canStart ? 'pointer' : 'not-allowed',
              boxShadow: canStart ? '0 4px 24px rgba(125,211,252,0.3)' : 'none',
            }}
          >
            {canStart ? 'Start Session →' : `Waiting for ${MIN_PLAYERS - players.length} more player${MIN_PLAYERS - players.length !== 1 ? 's' : ''}…`}
          </button>
        ) : (
          <div
            className="w-full py-4 rounded-xl text-center text-white/30 text-sm font-mono"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px dashed rgba(255,255,255,0.08)',
            }}
          >
            Waiting for host to start{dots}
          </div>
        )}
      </div>
    </div>
  )
}

export default WaitingRoom