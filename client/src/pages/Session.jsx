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

const StarRating = ({ rating, onRate, hoveredStar, onHover, size = "6xl" }) => (
  <div className="flex gap-2 justify-center" onMouseLeave={() => onHover && onHover(0)}>
    {[1, 2, 3, 4, 5].map((star) => {
      const filled = (hoveredStar || rating) >= star
      return (
        <span
          key={star}
          className={`${onRate ? 'cursor-pointer' : ''} text-${size} leading-none transition-colors duration-150 ${filled ? 'text-amber-400' : 'text-white/40'}`}
          onMouseEnter={() => onHover && onHover(star)}
          onClick={() => onRate && onRate(star)}
        >
          {filled ? '★' : '☆'}
        </span>
      )
    })}
  </div>
)

const Session = () => {
  const navigate = useNavigate()
  const { sessionCode } = useParams()
  const [showConfirm, setShowConfirm] = useState(false)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [roundTimeRemaining, setRoundTimeRemaining] = useState(ROUND_DURATION_SEC)
  const [sessionRating, setSessionRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [ratingSubmitted, setRatingSubmitted] = useState(false)
  const [overallRating, setOverallRating] = useState(null)
  const [showStoryboard, setShowStoryboard] = useState(false)
  const isRestRef = useRef(false)

  const phase = PHASES[phaseIndex]
  const isRoundScreen = phase.label.startsWith('Act')
  isRestRef.current = phase.label === 'Rest Period' || phase.label === 'The End'

  // Sample image from Gallery.jsx
  const storyboardImage = {
    url: "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?q=80&w=1856&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Generated Storyboard"
  }

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

  // Fetch overall rating when component mounts or when rating is submitted
  useEffect(() => {
    if (phase.label === 'The End') {
      // FETCH from MongoDB: get overall rating for this session
      // e.g. GET /api/sessions/:sessionCode/rating
      // This would return { overallRating: 4.5 }
      
      // Mock data for demonstration
      setTimeout(() => {
        setOverallRating(4.7)
      }, 500)
    }
  }, [phase.label, sessionCode])

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleRating = (star) => {
    setSessionRating(star)
    setRatingSubmitted(true)
    // SEND to MongoDB backend: persist session rating
    // e.g. POST /api/sessions/:sessionCode/rate { rating: star }
    console.log(`Session ${sessionCode} rated: ${star}/5`)
    
    // After submitting, fetch updated overall rating
    // FETCH from MongoDB: get updated overall rating
    // e.g. GET /api/sessions/:sessionCode/rating
    // This would return updated { overallRating: 4.7 }
  }

  const handleGenerateStoryboard = () => {
    setShowStoryboard(true)
    // Here you would typically trigger an API call to generate the storyboard
    console.log("Generating storyboard...")
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
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
          
          {!ratingSubmitted && (
            <span className="text-center font-bold text-4xl md:text-5xl text-white drop-shadow-lg mb-12">
              The End
            </span>
          )}
          
          
          <div className={`flex gap-8 items-center pointer-events-auto ${ratingSubmitted ? 'mt-0' : ''}`}>
           
            <div className="bg-black/60 text-white px-12 py-8 rounded-lg font-mono w-[500px]">
              {!ratingSubmitted ? (
                <>
                  <p className="text-white text-2xl mb-6 text-center">Rate this session</p>
                  <StarRating
                    rating={sessionRating}
                    onRate={handleRating}
                    hoveredStar={hoveredStar}
                    onHover={setHoveredStar}
                    size="6xl"
                  />
                </>
              ) : (
                <div className="flex flex-col gap-8">
                  
                  <div className="text-center">
                    <p className="text-white/80 text-lg mb-2">Your rating</p>
                    <StarRating
                      rating={sessionRating}
                      size="4xl"
                    />
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className="text-amber-400 font-bold text-xl">{sessionRating}</span>
                      <span className="text-white/60 text-sm">/ 5</span>
                    </div>
                  </div>
                  
                  <div className="w-full border-t border-white/20"></div>

                  <div className="text-center">
                    <p className="text-white/80 text-lg mb-2">Community rating</p>
                    {overallRating ? (
                      <>
                        <StarRating
                          rating={Math.round(overallRating)}
                          size="4xl"
                        />
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <span className="text-amber-400 font-bold text-xl">{overallRating.toFixed(1)}</span>
                          <span className="text-white/60 text-sm">/ 5</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-white/40 text-lg">Loading community ratings...</div>
                    )}
                  </div>

                  {/* Generate Storyboard Button */}
                  {!showStoryboard && (
                    <button
                      onClick={handleGenerateStoryboard}
                      className="mt-4 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
                    >
                      Generate Storyboard →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Storyboard Section */}
            {showStoryboard && (
              <div className="bg-black/60 text-white rounded-lg font-mono w-[500px] overflow-hidden">
                <h3 className="text-2xl font-bold py-4 px-6 text-center border-b border-white/20">
                  Your Storyboard
                </h3>
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={storyboardImage.url}
                    alt={storyboardImage.title}
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
            )}
          </div>
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