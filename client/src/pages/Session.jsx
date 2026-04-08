import { useEffect, useRef, useState } from 'react'
import { assets } from "../assets/assets.js"
import { useNavigate, useParams } from 'react-router-dom'
import DocumentWindow from '../components/DocumentWindow';
import WaitingRoom from '../components/WaitingRoom.jsx'
import StarRating from '../components/StarRating.jsx'
import ActionPrompt from '../components/ActionPrompt.jsx'
import TurnHUD from '../components/TurnHUD.jsx'
import { socket } from "../socket"
import { useUser } from '@clerk/clerk-react'
import { store } from '../store/store.js'
import {
  GAME_DURATION_SEC,
  ROUND_DURATION_SEC,
  TURN_DURATION_SEC,
  MIN_PLAYERS,
  MOCK_PLAYERS,
  PHASES
} from '../components/sessionConstants.js'

// ─── Main Session Component ──────────────────────────────────────────────────
const Session = () => {

  const navigate = useNavigate()
  const { sessionCode } = useParams()
  const { user } = useUser()

  // ── Waiting room state ──
  // In a real app, `joinedPlayers` would come from your backend/socket.
  // Here we simulate players joining every 3 seconds for demo purposes.
  // const [joinedPlayers, setJoinedPlayers] = useState([])
  const [sessionStarted, setSessionStarted] = useState(false)
  const IS_HOST = true // simulate: current user is the host

  const updatePlayers = store((state) => state.setSession)
  const addPlayer = store((state) => state.addPlayer)
  const players = store((state) => state.session?.players || [])

  console.log("USER OBJECT:", user)
  console.log("USERNAME FIELD:", user.username)

  // Websocket Connection
  useEffect(() => {
    if (!user) return // ✅ wait for user

    // ✅ Connect if not already
    if (!socket.connected) {
      socket.connect()
    }

    // ✅ Join session (important if user refreshes page)
    socket.emit("join_session", {
      sessionCode,
      userId: user?.id,
      username: user?.username
    })

    // ✅ Listen for events
    socket.on("players_updated", (players) => {
      const current = store.getState().session

      console.log("📦 BEFORE:", current)

      store.getState().setSession({
        ...current,
        players
      })

      console.log("📦 AFTER:", store.getState().session)
    })

    socket.on("session_started", () => {
        console.log("Session started")
    })

    // 🧹 Cleanup listeners ONLY (not disconnect)
    return () => {
        socket.off("players_updated")
        socket.off("session_started")
      }
  }, [sessionCode])

  const handleStartSession = () => {
    if (players.length >= MIN_PLAYERS) {
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

  // SCENE — player deletes "INT." or "EXT." and types their location and time
  const handleSceneAction = () => {
    editorRef.current?.insertHTML(`<p style="text-align:center"><b>INT. / EXT. &nbsp;[LOCATION] - [DAY / NIGHT]</b></p>`)
  }

  // ACTION — inserts a blank centered line for the player to write the action
  const handleActionAction = () => {
    editorRef.current?.insertHTML(`<p style="text-align:center">[ACTION]</p>`)
  }

  // CHARACTER — player overwrites the placeholder with the character's name
  const handleCharacterAction = () => {
    editorRef.current?.insertHTML(`<p style="text-align:center"><b>[CHARACTER NAME]</b></p>`)
  }

  // DIALOGUE — player overwrites the placeholder with the spoken line
  const handleDialogueAction = () => {
    editorRef.current?.insertHTML(`<p style="text-align:center">[DIALOGUE]</p>`)
  }

  // TRANSITION — player overwrites with e.g. CUT TO:, FADE OUT., DISSOLVE TO:
  const TRANSITION_OPTIONS = ['CUT TO:', 'FADE OUT.', 'SMASH CUT TO:', 'DISSOLVE TO:', 'MATCH CUT TO:']
  const handleTransitionAction = () => {
    editorRef.current?.insertHTML(`<p style="text-align:center"><b>${pick(TRANSITION_OPTIONS)}</b></p>`)
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
        players={players}
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