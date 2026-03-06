import React, { useEffect, useRef, useState } from 'react'
import { assets } from "../assets/assets.js"
import { useNavigate, useParams } from 'react-router-dom'

const ROUND_DURATION_MS = 5000   // 5s for "Round X Start" / "Round X End"
const WRITING_DURATION_MS = 5 * 60 * 1000  // 5 min per round
const REST_DURATION_MS = 5000   // 2s rest after each round end
const GAME_DURATION_SEC = 15 * 60  // 15 min total game
const ROUND_DURATION_SEC = 5 * 60  // 5 min per round

const PHASES = [
  { label: 'Act 1 Start', duration: ROUND_DURATION_MS },
  { label: 'Writing', duration: WRITING_DURATION_MS },
  { label: 'Act 1 End', duration: ROUND_DURATION_MS },
  { label: 'Rest Period', duration: REST_DURATION_MS },
  { label: 'Act 2 Start', duration: ROUND_DURATION_MS },
  { label: 'Writing', duration: WRITING_DURATION_MS },
  { label: 'Act 2 End', duration: ROUND_DURATION_MS },
  { label: 'Rest Period', duration: REST_DURATION_MS },
  { label: 'Act 3 Start', duration: ROUND_DURATION_MS },
  { label: 'Writing', duration: WRITING_DURATION_MS },
  { label: 'Act 3 End', duration: ROUND_DURATION_MS },
  { label: 'The End', duration: REST_DURATION_MS },
]

const Session = () => {
  const navigate = useNavigate()
  const { sessionCode } = useParams()
  const [showConfirm, setShowConfirm] = useState(false)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [roundTimeRemaining, setRoundTimeRemaining] = useState(ROUND_DURATION_SEC)
  const isRestRef = useRef(false)

  const phase = PHASES[phaseIndex]
  const isRoundScreen = phase.label.startsWith('Act')
  isRestRef.current = phase.label === 'Rest Period' || phase.label === 'The End'

  useEffect(() => {
    if (phase.label === 'Writing') {
      setRoundTimeRemaining(ROUND_DURATION_SEC)
    }
  }, [phaseIndex])

  useEffect(() => {
    if (phaseIndex >= PHASES.length - 1) return
    const t = setTimeout(() => {
      setPhaseIndex((i) => Math.min(i + 1, PHASES.length - 1))
    }, phase.duration)
    return () => clearTimeout(t)
  }, [phaseIndex, phase.duration])

  useEffect(() => {
    const interval = setInterval(() => {
      if (phase.label === 'Writing') {
        setElapsedSeconds((s) => Math.min(s + 1, GAME_DURATION_SEC))
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [phase.label])

  useEffect(() => {
    const interval = setInterval(() => {
      if (phase.label === 'Writing') {
        setRoundTimeRemaining((r) => Math.max(0, r - 1))
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [phase.label])

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <img
        src={assets.bg_image_login}
        className="absolute inset-0 h-full w-full object-cover"
        alt="background"
      />

      {(isRoundScreen || phase.label === 'Rest Period' || phase.label === 'The End') && (
        <div className="absolute inset-0 bg-black/50 z-[5]" />
      )}

      <a
        href="#"
        onClick={(e) => {
          e.preventDefault()
          setShowConfirm(true)
        }}
        className="absolute top-10 left-5 z-20 bg-white/80 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-200"
      >
        Leave
      </a>

      <div className="absolute top-10 right-6 z-20 bg-black/60 text-white px-3 py-1 rounded-lg font-mono text-base">
        Session Code: {sessionCode || '—'}
      </div>

      {isRoundScreen && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <span className="text-center font-bold text-4xl md:text-5xl text-white drop-shadow-lg">
            {phase.label}
          </span>
        </div>
      )}

      {/* Document writing UI goes here (during Writing phase) */}

      {phase.label === 'Rest Period' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="px-8 py-4 rounded-xl text-center font-bold text-2xl md:text-3xl shadow-lg bg-black/60 text-white">
            Rest Period
          </div>
        </div>
      )}

      {phase.label === 'The End' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <span className="text-center font-bold text-4xl md:text-5xl text-white drop-shadow-lg">
            The End
          </span>
        </div>
      )}

      <div className="absolute bottom-16 right-6 z-20 bg-black/60 text-white px-3 py-1 rounded-lg font-mono text-base">
        {formatTime(roundTimeRemaining)}
      </div>

      <div className="absolute bottom-6 right-6 z-20 bg-black/60 text-white px-3 py-1 rounded-lg font-mono text-base">
        {formatTime(elapsedSeconds)}/15:00
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <p className="text-lg mb-4">Are you sure you want to leave?</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false)
                  navigate('/')
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Session