import React, { useEffect, useRef, useState } from 'react'
import { assets } from "../assets/assets.js"
import { useNavigate, useParams } from 'react-router-dom'
import DocumentWindow from '../components/DocumentWindow';
import WaitingRoom from '../components/WaitingRoom.jsx'
import { useAuth } from '@clerk/clerk-react'

const ROUND_DURATION_MS = 5000
const WRITING_DURATION_MS = 5 * 60 * 1000
const REST_DURATION_MS = 5000
const GAME_DURATION_SEC = 15 * 60
const ROUND_DURATION_SEC = 5 * 60

const TURN_DURATION_SEC = 30
const ACTION_PROMPT_SEC = 5

const MIN_PLAYERS = 2

// Mock player list — replace with real multiplayer data
const MOCK_PLAYERS = ['Alice', 'Bob', 'Charlie', 'Diana']

const SCREENPLAY_ACTIONS = [
  { label: 'Scene',      tag: 'SCENE'},
  { label: 'Action',     tag: 'ACTION'},
  { label: 'Character',  tag: 'CHARACTER'},
  { label: 'Dialogue',   tag: 'DIALOGUE'},
  { label: 'Transition', tag: 'TRANSITION'},
]

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
    {[1,2,3,4,5].map((star)=>{
      const filled = (hoveredStar || rating) >= star
      return (
        <span
          key={star}
          className={`${onRate ? 'cursor-pointer' : ''} text-${size} leading-none transition-colors duration-150 ${filled ? 'text-sky-300' : 'text-white/40'}`}
          onMouseEnter={()=>onHover && onHover(star)}
          onClick={()=>onRate && onRate(star)}
        >
          {filled ? '★' : '☆'}
        </span>
      )
    })}
  </div>
)

// ─── Turn Action Prompt Modal ────────────────────────────────────────────────
const ActionPrompt = ({ playerName, isMyTurn, onSelectAction, timeLeft, turnTimeLeft }) => {
  const urgency = turnTimeLeft <= 10

  if (!isMyTurn) {
    return (
      <div
        className="fixed right-8 top-1/2 z-50 -translate-y-1/2 flex items-center gap-4 px-5 py-3 rounded-2xl shadow-xl"
        style={{
          background: 'rgba(10,10,20,0.85)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(10px)',
        }}
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
        style={{
          background: 'linear-gradient(135deg, rgba(15,15,25,0.97) 0%, rgba(30,20,50,0.97) 100%)',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <div
          className="px-6 pt-5 pb-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
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
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(125,211,252,0.15)'
                e.currentTarget.style.borderColor = 'rgba(125,211,252,0.4)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
              }}
            >
              <span className="text-2xl w-8 text-center">{action.icon}</span>
              <div className="flex-1">
                <span className="text-white font-semibold tracking-wide">{action.label}</span>
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

const TurnTimerRing = ({ seconds, total, urgency }) => {
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
      {isMyTurn ? <span className="text-sky-300 font-bold">Your turn</span> : <><span className="text-white/60">{playerName}'s turn</span></>}
    </span>
    <span className="font-mono text-xs text-white/50 ml-1">{turnTimeLeft}s</span>
  </div>
)

// ─── Main Session Component ──────────────────────────────────────────────────
const Session = () => {

  const navigate = useNavigate()
  const { sessionCode } = useParams()
  const { userId } = useAuth()

  // ── Waiting room state ──
  // In a real app, `joinedPlayers` would come from your backend/socket.
  // Here we simulate players joining every 3 seconds for demo purposes.
  const [joinedPlayers, setJoinedPlayers] = useState(['Alice'])
  const [sessionStarted, setSessionStarted] = useState(false)
  const IS_HOST = true // simulate: current user is the host

  // Simulate a second player joining after 3 seconds (remove in production)
  useEffect(() => {
    if (sessionStarted) return
    const t = setTimeout(() => {
      setJoinedPlayers(prev =>
        prev.includes('Bob') ? prev : [...prev, 'Bob']
      )
    }, 3000)
    return () => clearTimeout(t)
  }, [sessionStarted])

  const handleStartSession = () => {
    if (joinedPlayers.length >= MIN_PLAYERS) {
      setSessionStarted(true)
    }
  }

  const [showConfirm,setShowConfirm] = useState(false)
  const [phaseIndex,setPhaseIndex] = useState(0)
  const [elapsedSeconds,setElapsedSeconds] = useState(0)
  const [roundTimeRemaining,setRoundTimeRemaining] = useState(ROUND_DURATION_SEC)

  const [sessionRating,setSessionRating] = useState(0)
  const [hoveredStar,setHoveredStar] = useState(0)
  const [ratingSubmitted,setRatingSubmitted] = useState(false)
  const [overallRating,setOverallRating] = useState(null)

  const [showStoryboard,setShowStoryboard] = useState(false)

  const [lockedContent,setLockedContent] = useState("")
  const [currentContent,setCurrentContent] = useState("")

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [turnTimeLeft, setTurnTimeLeft] = useState(TURN_DURATION_SEC)
  const [showActionPrompt, setShowActionPrompt] = useState(false)
  const [selectedAction, setSelectedAction] = useState(null)

  // Scene builder — INT/EXT and DAY/NIGHT persist across turns; location is always editable
  const [sceneIntExt, setSceneIntExt] = useState(null)       // 'INT' | 'EXT' | null
  const [sceneDayNight, setSceneDayNight] = useState(null)   // 'DAY' | 'NIGHT' | null
  const [showSceneBuilder, setShowSceneBuilder] = useState(false)
  const [sceneLocation, setSceneLocation] = useState('')

  // Character builder
  const [showCharacterBuilder, setShowCharacterBuilder] = useState(false)
  const [characterName, setCharacterName] = useState('')

  const MY_PLAYER_INDEX = 0
  const isWriting = PHASES[phaseIndex]?.label === 'Writing'
  const currentPlayer = MOCK_PLAYERS[currentPlayerIndex]
  const isMyTurn = currentPlayerIndex === MY_PLAYER_INDEX

  const isRestRef = useRef(false)
  const prevPhaseRef = useRef(0)
  const editorRef = useRef(null) // ref to DocumentEditor — call editorRef.current.insertHTML(html) to insert content

  const phase = PHASES[phaseIndex]
  const isRoundScreen = phase.label.startsWith('Act')

  isRestRef.current = phase.label === 'Rest Period' || phase.label === 'The End'

  const storyboardImage = {
    url:"https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?q=80&w=1856&auto=format&fit=crop",
    title:"Generated Storyboard"
  }

  useEffect(() => {
    if (!isWriting || !sessionStarted) return
    setShowActionPrompt(true)
    const interval = setInterval(() => {
      setTurnTimeLeft(prev => {
        if (prev <= 1) {
          setCurrentPlayerIndex(i => (i + 1) % MOCK_PLAYERS.length)
          setSelectedAction(null)
          setShowActionPrompt(true)
          setShowSceneBuilder(false)
          setShowCharacterBuilder(false)
          setShowTransitionBuilder(false)
          return TURN_DURATION_SEC
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isWriting, currentPlayerIndex, sessionStarted])

  useEffect(() => {
    if (isWriting) {
      setCurrentPlayerIndex(0)
      setTurnTimeLeft(TURN_DURATION_SEC)
      setSelectedAction(null)
      setShowActionPrompt(true)
    } else {
      setShowActionPrompt(false)
    }
  }, [isWriting])

  // Moves whatever is currently in the editor into lockedContent, making it permanent
  const flushToLocked = () => {
    setTimeout(() => {
      const html = editorRef.current?.flushContent()
      if (html && html !== '<p></p>' && html !== '<p></p><p></p>') {
        setLockedContent(prev => prev + html)
      }
    }, 0)
  }

  // SCENE — opens the scene builder modal; INT/EXT and DAY/NIGHT choices are sticky
  const handleSceneAction = () => {
    setSceneLocation('')
    setShowSceneBuilder(true)
  }

  const handleConfirmScene = () => {
    const ie = sceneIntExt || 'INT'
    const dn = sceneDayNight || 'DAY'
    const loc = sceneLocation.trim() || 'LOCATION'
    editorRef.current?.insertHTML(`<p style="text-align:center"><b>${ie}. ${loc} - ${dn}</b></p>`)
    setShowSceneBuilder(false)
    flushToLocked()
  }

  // ACTION — inserts a blank centered line for the player to write the action
  const handleActionAction = () => {
    editorRef.current?.insertHTML(`<p style="text-align:center">ACTION</p>`)
    flushToLocked()
  }

  // CHARACTER — opens builder modal for player to type the character's name
  const handleCharacterAction = () => {
    setCharacterName('')
    setShowCharacterBuilder(true)
  }

  const handleConfirmCharacter = () => {
    const name = characterName.trim() || 'CHARACTER NAME'
    editorRef.current?.insertHTML(`<p style="text-align:center"><b>${name.toUpperCase()}</b></p>`)
    setShowCharacterBuilder(false)
    flushToLocked()
  }

  // DIALOGUE — player overwrites the placeholder with the spoken line
  const handleDialogueAction = () => {
    editorRef.current?.insertHTML(`<p style="text-align:center">DIALOGUE</p>`)
    flushToLocked()
  }

  // TRANSITION — player picks from a list of options
  const TRANSITION_OPTIONS = ['CUT TO:', 'FADE OUT.', 'SMASH CUT TO:', 'DISSOLVE TO:', 'MATCH CUT TO:']
  const [showTransitionBuilder, setShowTransitionBuilder] = useState(false)
  const [selectedTransition, setSelectedTransition] = useState(null)

  const handleTransitionAction = () => {
    setSelectedTransition(null)
    setShowTransitionBuilder(true)
  }

  const handleConfirmTransition = (option) => {
    const t = option || selectedTransition || TRANSITION_OPTIONS[0]
    editorRef.current?.insertHTML(`<p style="text-align:center"><b>${t}</b></p>`)
    setShowTransitionBuilder(false)
    flushToLocked()
  }

  const ACTION_HANDLERS = {
    SCENE:      handleSceneAction,
    ACTION:     handleActionAction,
    CHARACTER:  handleCharacterAction,
    DIALOGUE:   handleDialogueAction,
    TRANSITION: handleTransitionAction,
  }

  const handleSelectAction = (action) => {
    setSelectedAction(action)
    setShowActionPrompt(false)
    // Delegates entirely to the ACTION_HANDLERS above — no plain text appended here anymore
    ACTION_HANDLERS[action.tag]?.()
  }

  const endTurn = () => {
    setCurrentPlayerIndex(i => (i + 1) % MOCK_PLAYERS.length)
    setSelectedAction(null)
    setShowActionPrompt(true)
    setTurnTimeLeft(TURN_DURATION_SEC)
    setShowSceneBuilder(false)
    setShowCharacterBuilder(false)
    setShowTransitionBuilder(false)
  }

  useEffect(()=>{
    if (!sessionStarted) return
    if(prevPhaseRef.current !== phaseIndex){
      const prevPhase = PHASES[prevPhaseRef.current]
      if(prevPhase.label === 'Writing'){
        setLockedContent(prev => prev + '<div>' + currentContent + '</div>')
        setCurrentContent("")
      }
      if(phase.label === 'Writing'){
        setRoundTimeRemaining(ROUND_DURATION_SEC)
      }
      prevPhaseRef.current = phaseIndex
    }
  },[phaseIndex, sessionStarted])

  useEffect(()=>{
    if(!sessionStarted) return
    if(phaseIndex >= PHASES.length - 1) return
    const t = setTimeout(()=>{
      setPhaseIndex(i => Math.min(i+1,PHASES.length-1))
    },phase.duration)
    return ()=>clearTimeout(t)
  },[phaseIndex, phase.duration, sessionStarted])

  useEffect(()=>{
    if(!sessionStarted) return
    const interval = setInterval(()=>{
      if(phase.label === 'Writing'){
        setElapsedSeconds(s => Math.min(s+1,GAME_DURATION_SEC))
      }
    },1000)
    return ()=>clearInterval(interval)
  },[phase.label, sessionStarted])

  useEffect(()=>{
    if(!sessionStarted) return
    const interval = setInterval(()=>{
      if(phase.label === 'Writing'){
        setRoundTimeRemaining(r => Math.max(0,r-1))
      }
    },1000)
    return ()=>clearInterval(interval)
  },[phase.label, sessionStarted])

  useEffect(()=>{
    if(phase.label === 'The End'){
      setTimeout(()=>{ setOverallRating(4.7) },500)
    }
  },[phase.label])

  const formatTime = (totalSeconds)=>{
    const m = Math.floor(totalSeconds/60)
    const s = totalSeconds%60
    return `${m}:${s.toString().padStart(2,'0')}`
  }

  const handleRating = (star)=>{
    setSessionRating(star)
    setRatingSubmitted(true)
  }

  const handleGenerateStoryboard = ()=>{ setShowStoryboard(true) }

  // ── Bottom toolbar buttons — mirror the ACTION_HANDLERS above ──────────────
  // These call the same handler functions so edits only need to happen in one place
  const handleScene      = () => handleSceneAction()
  const handleAction     = () => handleActionAction()
  const handleCharacter  = () => handleCharacterAction()
  const handleDialogue   = () => handleDialogueAction()
  const handleTransition = () => handleTransitionAction()

  // ── Show waiting room until session is started ──
  if (!sessionStarted) {
    return (
      <WaitingRoom
        sessionCode={sessionCode}
        players={joinedPlayers}
        onStart={handleStartSession}
        isHost={IS_HOST}
      />
    )
  }

  return (
    <div className="relative h-screen w-screen bg-gray-100 flex items-center justify-center overflow-hidden">

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
        onClick={(e)=>{ e.preventDefault(); setShowConfirm(true) }}
        className="absolute top-10 left-5 z-20 bg-white/80 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg shadow-lg"
      >
        Leave
      </a>

      <div className="absolute top-10 right-6 z-20 bg-black/60 text-white px-3 py-1 rounded-lg font-mono text-base">
        Session Code: {sessionCode || '—'}
      </div>

      {isWriting && (
        <TurnHUD
          playerName={currentPlayer}
          isMyTurn={isMyTurn}
          turnTimeLeft={turnTimeLeft}
        />
      )}

      {isWriting && showActionPrompt && (
        <ActionPrompt
          playerName={currentPlayer}
          isMyTurn={isMyTurn}
          onSelectAction={handleSelectAction}
          turnTimeLeft={turnTimeLeft}
        />
      )}

      {isRoundScreen && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <span className="text-center font-bold text-4xl md:text-5xl text-white drop-shadow-lg">
            {phase.label}
          </span>
        </div>
      )}

      {phase.label === 'Writing' && (
        <>
          <div className="absolute bottom-0 z-10 px-3 py-0 rounded-lg font-mono">
            <DocumentWindow
              ref={editorRef}
              lockedContent={lockedContent}
              currentContent={currentContent}
              onContentChange={setCurrentContent}
            />
          </div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-5">
            <div className="flex gap-3 bg-black/60 text-white px-4 py-2 rounded-lg text-sm">
              <button onClick={handleScene}      className="hover:text-sky-300">Scene</button>
              <button onClick={handleAction}     className="hover:text-sky-300">Action</button>
              <button onClick={handleCharacter}  className="hover:text-sky-300">Character</button>
              <button onClick={handleDialogue}   className="hover:text-sky-300">Dialogue</button>
              <button onClick={handleTransition} className="hover:text-sky-300">Transition</button>
            </div>
          </div>

          {/* End Turn Early — only shown when it's your turn and you've already chosen an action */}
          {isMyTurn && !showActionPrompt && (
            <div className="fixed right-8 bottom-[45%] z-20">
              <button
                onClick={endTurn}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-200 shadow-lg"
                style={{
                  background: 'rgba(34,197,94,0.85)',
                  border: '1px solid rgba(34,197,94,1)',
                  color: '#ffffff',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(22,163,74,0.95)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.85)' }}
              >
                End Turn →
              </button>
            </div>
          )}

          {/* Scene Builder Modal */}
          {showSceneBuilder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSceneBuilder(false)} />
              <div
                className="relative z-10 w-[400px] rounded-2xl overflow-hidden shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(15,15,25,0.98) 0%, rgba(30,20,50,0.98) 100%)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <div className="px-6 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Scene Heading</p>
                  <h2 className="text-white font-bold text-lg">Set your scene</h2>
                </div>

                <div className="p-6 flex flex-col gap-5">
                  {/* INT / EXT — sticky */}
                  <div>
                    <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Interior / Exterior</p>
                    <div className="flex gap-2">
                      {['INT', 'EXT'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => setSceneIntExt(opt)}
                          className="flex-1 py-2 rounded-lg font-bold text-sm transition-all duration-150"
                          style={{
                            background: sceneIntExt === opt ? 'rgba(125,211,252,0.25)' : 'rgba(255,255,255,0.06)',
                            border: sceneIntExt === opt ? '1px solid rgba(125,211,252,0.6)' : '1px solid rgba(255,255,255,0.1)',
                            color: sceneIntExt === opt ? '#7dd3fc' : 'rgba(255,255,255,0.6)',
                          }}
                        >
                          {opt}.
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* DAY / NIGHT — sticky */}
                  <div>
                    <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Time of Day</p>
                    <div className="flex gap-2">
                      {['DAY', 'NIGHT'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => setSceneDayNight(opt)}
                          className="flex-1 py-2 rounded-lg font-bold text-sm transition-all duration-150"
                          style={{
                            background: sceneDayNight === opt ? 'rgba(125,211,252,0.25)' : 'rgba(255,255,255,0.06)',
                            border: sceneDayNight === opt ? '1px solid rgba(125,211,252,0.6)' : '1px solid rgba(255,255,255,0.1)',
                            color: sceneDayNight === opt ? '#7dd3fc' : 'rgba(255,255,255,0.6)',
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location — always editable */}
                  <div>
                    <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Location</p>
                    <input
                      type="text"
                      placeholder="e.g. COFFEE SHOP, ROOFTOP, CAVE..."
                      value={sceneLocation}
                      onChange={e => setSceneLocation(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && handleConfirmScene()}
                      autoFocus
                      className="w-full px-4 py-2.5 rounded-lg text-white font-mono text-sm outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.15)',
                      }}
                    />
                  </div>

                  {/* Preview */}
                  <div className="text-center font-mono text-white/70 text-sm py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span className="font-bold text-white">
                      {sceneIntExt || 'INT'}. {sceneLocation || 'LOCATION'} - {sceneDayNight || 'DAY'}
                    </span>
                  </div>

                  <button
                    onClick={handleConfirmScene}
                    className="w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-200"
                    style={{
                      background: 'rgba(125,211,252,0.2)',
                      border: '1px solid rgba(125,211,252,0.5)',
                      color: '#7dd3fc',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(125,211,252,0.35)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(125,211,252,0.2)' }}
                  >
                    Insert Scene Heading
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Character Builder Modal */}
          {showCharacterBuilder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCharacterBuilder(false)} />
              <div
                className="relative z-10 w-[360px] rounded-2xl overflow-hidden shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(15,15,25,0.98) 0%, rgba(30,20,50,0.98) 100%)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <div className="px-6 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Character</p>
                  <h2 className="text-white font-bold text-lg">Who's speaking?</h2>
                </div>

                <div className="p-6 flex flex-col gap-5">
                  <div>
                    <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Character Name</p>
                    <input
                      type="text"
                      placeholder="e.g. JOHN, DR. SMITH, NARRATOR..."
                      value={characterName}
                      onChange={e => setCharacterName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleConfirmCharacter()}
                      autoFocus
                      className="w-full px-4 py-2.5 rounded-lg text-white font-mono text-sm outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.15)',
                      }}
                    />
                  </div>

                  {/* Preview */}
                  <div className="text-center font-mono text-white/70 text-sm py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span className="font-bold text-white">
                      {characterName.trim().toUpperCase() || 'CHARACTER NAME'}
                    </span>
                  </div>

                  <button
                    onClick={handleConfirmCharacter}
                    className="w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-200"
                    style={{
                      background: 'rgba(125,211,252,0.2)',
                      border: '1px solid rgba(125,211,252,0.5)',
                      color: '#7dd3fc',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(125,211,252,0.35)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(125,211,252,0.2)' }}
                  >
                    Insert Character
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Transition Picker Modal */}
          {showTransitionBuilder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTransitionBuilder(false)} />
              <div
                className="relative z-10 w-[360px] rounded-2xl overflow-hidden shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(15,15,25,0.98) 0%, rgba(30,20,50,0.98) 100%)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <div className="px-6 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Transition</p>
                  <h2 className="text-white font-bold text-lg">Choose a transition</h2>
                </div>
                <div className="p-4 flex flex-col gap-2">
                  {TRANSITION_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      onClick={() => handleConfirmTransition(opt)}
                      className="w-full px-5 py-3 rounded-xl font-mono font-bold text-sm text-left transition-all duration-150"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.8)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(125,211,252,0.15)'
                        e.currentTarget.style.borderColor = 'rgba(125,211,252,0.4)'
                        e.currentTarget.style.color = '#7dd3fc'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                        e.currentTarget.style.color = 'rgba(255,255,255,0.8)'
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

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
                    <StarRating rating={sessionRating} size="4xl"/>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className="text-sky-300 font-bold text-xl">{sessionRating}</span>
                      <span className="text-white/60 text-sm">/ 5</span>
                    </div>
                  </div>

                  <div className="w-full border-t border-white/20"></div>

                  <div className="text-center">
                    <p className="text-white/80 text-lg mb-2">Community rating</p>
                    {overallRating ? (
                      <>
                        <StarRating rating={Math.round(overallRating)} size="4xl"/>
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <span className="text-sky-300 font-bold text-xl">{overallRating.toFixed(1)}</span>
                          <span className="text-white/60 text-sm">/ 5</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-white/40 text-lg">Loading community ratings...</div>
                    )}
                  </div>

                  {!showStoryboard && (
                    <button
                      onClick={handleGenerateStoryboard}
                      className="mt-4 bg-sky-400 hover:bg-sky-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
                    >
                      Generate Storyboard →
                    </button>
                  )}
                </div>
              )}
            </div>

            {showStoryboard && (
              <div className="bg-black/60 text-white rounded-lg font-mono w-[500px] overflow-hidden">
                <h3 className="text-2xl font-bold py-4 px-6 text-center border-b border-white/20">
                  Your Storyboard
                </h3>
                <img
                  src={storyboardImage.url}
                  alt={storyboardImage.title}
                  className="object-cover w-full h-full"
                />
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
                onClick={()=>setShowConfirm(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={()=>{ setShowConfirm(false); navigate('/') }}
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