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
  PHASES,
  BETWEEN_TURN_COUNTDOWN
} from '../components/sessionConstants.js'

const calcPhaseState = (sessionStartedAt) => {
  let elapsed = Date.now() - sessionStartedAt
  let totalWritingMs = 0
  let t = 0
  for (let i = 0; i < PHASES.length; i++) {
    const p = PHASES[i]
    if (elapsed < t + p.duration) {
      const elapsedInPhase = elapsed - t
      return {
        phaseIndex: i,
        roundTimeRemaining: p.label === 'Writing' ? Math.ceil((p.duration - elapsedInPhase) / 1000) : ROUND_DURATION_SEC,
        elapsedSeconds: Math.floor(totalWritingMs / 1000) + (p.label === 'Writing' ? Math.floor(elapsedInPhase / 1000) : 0)
      }
    }
    if (p.label === 'Writing') totalWritingMs += p.duration
    t += p.duration
  }
  return { phaseIndex: PHASES.length - 1, roundTimeRemaining: 0, elapsedSeconds: Math.floor(totalWritingMs / 1000) }
}

// ─── Main Session Component ──────────────────────────────────────────────────
const Session = () => {

  const navigate = useNavigate()
  const { sessionCode } = useParams()
  const { user } = useUser()

  const [scriptPrompt, setScriptPrompt] = useState(null)
  const [showPromptReveal, setShowPromptReveal] = useState(false)
  const [promptCountdown, setPromptCountdown] = useState(5)

  const [actionSuggestions, setActionSuggestions] = useState([])
  const [loadingActions, setLoadingActions] = useState(false)
  const [showActionBuilder, setShowActionBuilder] = useState(false)

  const [dialogueSuggestions, setDialogueSuggestions] = useState([])
  const [loadingDialogue, setLoadingDialogue] = useState(false)
  const [showDialogueBuilder, setShowDialogueBuilder] = useState(false)

  const [characterSuggestions, setCharacterSuggestions] = useState([])
  const [loadingCharacter, setLoadingCharacter] = useState(false)

  const [sceneSuggestions, setSceneSuggestions] = useState([])
  const [loadingScenes, setLoadingScenes] = useState(false)

  const [betweenTurns, setBetweenTurns] = useState(false)
  const [betweenTurnsCountdown, setBetweenTurnsCountdown] = useState(BETWEEN_TURN_COUNTDOWN)

  const [showDocument, setShowDocument] = useState(false)  

  // ── Waiting room state ──
  // In a real app, `joinedPlayers` would come from your backend/socket.
  // Here we simulate players joining every 3 seconds for demo purposes.
  // const [joinedPlayers, setJoinedPlayers] = useState([])
  const [sessionStarted, setSessionStarted] = useState(false)

  const updatePlayers = store((state) => state.setSession)
  const addPlayer = store((state) => state.addPlayer)
  const players = store((state) => state.session?.players || [])
  const sessionHostId = store((state) => state.session?.hostId)

  const IS_HOST = user?.id === sessionHostId

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

    // Request full document state — handles reconnects and late joins
    socket.emit("request_state", { sessionCode })

    // ✅ Listen for events
    socket.on("players_updated", ({ players, hostId }) => {
      const current = store.getState().session
      store.getState().setSession({
        ...current,
        players,
        hostId: hostId ?? current.hostId
      })
    })

    socket.on("session_started", ({ sessionStartedAt, scriptPrompt }) => {
        sessionStartedAtRef.current = sessionStartedAt
        if (scriptPrompt) setScriptPrompt(scriptPrompt)
        setShowPromptReveal(true) 
        // setScriptPrompt(scriptPrompt)
        // setSessionStarted(true)
        // console.log("Session started")
    })

    socket.on("turn_update", ({ currentTurnIndex, turnStartedAt }) => {
      setCurrentPlayerIndex(currentTurnIndex)
      turnStartedAtRef.current = turnStartedAt
      setShowSceneBuilder(false)
      setShowCharacterBuilder(false)
      setShowTransitionBuilder(false)
      setShowActionBuilder(false)
      setShowDialogueBuilder(false)
      setShowActionPrompt(false)
      setShowDocument(false)
      setBetweenTurns(true)
    })

    // Another player submitted a move — append their content and sync structure state
    socket.on("move_broadcast", ({ type, content }) => {
      setLockedContent(prev => prev + content)
      setStructureState(prev => {
        switch (type) {
          case 'SCENE': return { hasScene: true, lastWasScene: true, lastWasCharacter: false, lastWasDialogue: false, lastWasTransition: false  }
          case 'CHARACTER': return { ...prev, lastWasScene: false, lastWasCharacter: true, lastWasDialogue: false, lastWasTransition: false  }
          case 'DIALOGUE': return { ...prev, lastWasScene: false, lastWasCharacter: false, lastWasDialogue: true, lastWasTransition: false  }
          case 'TRANSITION': return { ...prev, lastWasScene: false, lastWasCharacter: false, lastWasDialogue: false, lastWasTransition: true }
          default: return { ...prev, lastWasScene: false, lastWasTransition: false }
        }
      })
    })

    // Full state sync on reconnect or late join
    socket.on("state_sync", ({ moves, isActive, currentTurnIndex, turnStartedAt, hostId, sessionStartedAt, scriptPrompt: syncedPrompt }) => {
      if (hostId) {
        const current = store.getState().session
        store.getState().setSession({ ...current, hostId })
      }
      if (moves.length > 0) {
        setLockedContent(moves.map(m => m.content).join(''))
        let structure = { hasScene: false, lastWasCharacter: false, lastWasDialogue: false }
        for (const move of moves) {
          switch (move.type) {
            case 'SCENE': structure = { hasScene: true, lastWasScene: true, lastWasCharacter: false, lastWasDialogue: false, lastWasTransition: true  }; break
            case 'CHARACTER': structure = { ...structure, lastWasScene: false, lastWasCharacter: true, lastWasDialogue: false, lastWasTransition: true  }; break
            case 'DIALOGUE': structure = { ...structure, lastWasScene: false, lastWasCharacter: false, lastWasDialogue: true, lastWasTransition: true  }; break
            case 'TRANSITION': structure = { ...structure, lastWasScene: false, lastWasCharacter: false, lastWasDialogue: false, lastWasTransition: true }; break
            default: structure = { ...structure, lastWasScene: false, lastWasTransition: false }; break
          }
        }
        setStructureState(structure)
      }
      if (isActive && sessionStartedAt) {
        sessionStartedAtRef.current = sessionStartedAt
        const { phaseIndex: pi, roundTimeRemaining: rtr, elapsedSeconds: es } = calcPhaseState(sessionStartedAt)
        prevPhaseRef.current = pi
        setPhaseIndex(pi)
        setRoundTimeRemaining(rtr)
        setElapsedSeconds(es)
        setSessionStarted(true)
        setCurrentPlayerIndex(currentTurnIndex)
        turnStartedAtRef.current = turnStartedAt
      } else if (isActive) {
        setSessionStarted(true)
        setCurrentPlayerIndex(currentTurnIndex)
        turnStartedAtRef.current = turnStartedAt
      }
      if (syncedPrompt) setScriptPrompt(syncedPrompt)
    })

    socket.on("action_suggestions", ({ suggestions }) => {
      setActionSuggestions(suggestions)
      setLoadingActions(false)
    })

    socket.on("dialogue_suggestions", ({ suggestions }) => {
      setDialogueSuggestions(suggestions)
      setLoadingDialogue(false)
    })

    socket.on("character_suggestions", ({ suggestions }) => {
      setCharacterSuggestions(suggestions)
      setLoadingCharacter(false)
    })

    socket.on("scene_suggestions", ({ suggestions }) => {
      setSceneSuggestions(suggestions)
      setLoadingScenes(false)
    })

    // 🧹 Cleanup listeners ONLY (not disconnect)
    return () => {
        socket.off("players_updated")
        socket.off("session_started")
        socket.off("turn_update")
        socket.off("move_broadcast")
        socket.off("state_sync")
        socket.off("action_suggestions")
        socket.off("dialogue_suggestions")
        socket.off("character_suggestions")
        socket.off("scene_suggestions")
      }
  }, [sessionCode])

  useEffect(() => {
    if (!showPromptReveal) return

    setPromptCountdown(5)
    const interval = setInterval(() => {
      setPromptCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setShowPromptReveal(false)
          setSessionStarted(true)  // NOW start the game
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [showPromptReveal])

  useEffect(() => {
    if (!betweenTurns) return

    setBetweenTurnsCountdown(BETWEEN_TURN_COUNTDOWN)
    const interval = setInterval(() => {
      setBetweenTurnsCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setBetweenTurns(false)
          setShowActionPrompt(true)
          return BETWEEN_TURN_COUNTDOWN
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [betweenTurns])

  useEffect(() => {
    if (!sessionStarted) return;

    const interval = setInterval(() => {
      if (!turnStartedAtRef.current) return;

      const elapsed = (Date.now() - turnStartedAtRef.current) / 1000;
      const remaining = Math.max(0, TURN_DURATION_SEC - elapsed);

      setTurnTimeLeft(Math.ceil(remaining));
    }, 500);

    return () => clearInterval(interval);
  }, [sessionStarted]);

  const handleStartSession = () => {
    if (players.length >= MIN_PLAYERS) {
      // setSessionStarted(true)
      socket.emit("start_session", sessionCode)
    }
  }

  const [structureState, setStructureState] = useState({
    hasScene: false,
    lastWasScene: false,
    lastWasCharacter: false,
    lastWasDialogue: false,
    lastWasTransition: false,
  })

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
  const [showSceneBuilder, setShowSceneBuilder] = useState(false)

  // Character builder
  const [showCharacterBuilder, setShowCharacterBuilder] = useState(false)

  const MY_PLAYER_INDEX = 0
  const isWriting = PHASES[phaseIndex]?.label === 'Writing'
  // const currentPlayer = MOCK_PLAYERS[currentPlayerIndex]
  const currentPlayer = players[currentPlayerIndex]?.username
  const myIndex = players.findIndex(p => p.userId === user.id)
  const isMyTurn = currentPlayerIndex === myIndex

  const currentAct = PHASES[phaseIndex]?.label.startsWith('Act') 
    ? PHASES[phaseIndex].label 
    : PHASES.slice(0, phaseIndex).reverse().find(p => p.label.startsWith('Act'))?.label ?? 'Act 1'

  const isRestRef = useRef(false)
  const prevPhaseRef = useRef(0)
  const scriptSavedRef = useRef(false)
  const editorRef = useRef(null) // ref to DocumentEditor — call editorRef.current.insertHTML(html) to insert content

  const phase = PHASES[phaseIndex]
  const isRoundScreen = phase.label.startsWith('Act')

  isRestRef.current = phase.label === 'Rest Period' || phase.label === 'The End'

  const storyboardImage = {
    url:"https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?q=80&w=1856&auto=format&fit=crop",
    title:"Generated Storyboard"
  }

  const turnStartedAtRef = useRef(null)
  const sessionStartedAtRef = useRef(null)

  useEffect(() => {
    if (!sessionStarted) return
    if (!turnStartedAtRef.current) return

    const interval = setInterval(() => {
      const elapsed = (Date.now() - turnStartedAtRef.current) / 1000
      const remaining = Math.max(0, TURN_DURATION_SEC - elapsed)
      setTurnTimeLeft(Math.ceil(remaining))
    }, 250)

    return () => clearInterval(interval)
  }, [sessionStarted, currentPlayerIndex])


  useEffect(() => {
    if (isWriting) {
      // setCurrentPlayerIndex(0)
      setTurnTimeLeft(TURN_DURATION_SEC)
      setSelectedAction(null)
      setShowActionPrompt(true)
    } else {
      setShowActionPrompt(false)
    }
  }, [isWriting])

  // Moves whatever is currently in the editor into lockedContent, making it permanent,
  // then broadcasts the move to all other players in the session.
  const flushToLocked = (actionType) => {
    setTimeout(() => {
      const html = editorRef.current?.flushContent()
      if (html && html !== '<p></p>' && html !== '<p></p><p></p>') {
        setLockedContent(prev => prev + html)
        socket.emit('submit_move', {
          sessionCode,
          userId: user.id,
          type: actionType,
          content: html
        })
      }
    }, 0)
  }

  // SCENE — opens the scene builder modal; INT/EXT and DAY/NIGHT choices are sticky
  const handleSceneAction = () => {
    setSceneSuggestions([])
    setLoadingScenes(true)
    setShowSceneBuilder(true)
    socket.emit("request_scene_suggestions", {
      sessionCode,
      scriptContent: lockedContent,
      currentAct
    })
  }

  const handleConfirmScene = (heading) => {
    editorRef.current?.insertHTML(`<p style="text-align:center"><b>${heading}</b></p><p><br></p>`)
    setStructureState({
      hasScene: true,
      lastWasScene: true,
      lastWasCharacter: false,
      lastWasDialogue: false,
      lastWasTransition: false
    })
    setShowSceneBuilder(false)
    flushToLocked('SCENE')
    endTurn()
  }
  // ACTION — inserts a blank centered line for the player to write the action
  const handleActionAction = () => {
    setActionSuggestions([])
    setLoadingActions(true)
    setShowActionBuilder(true)
    socket.emit("request_action_suggestions", {
      sessionCode,
      scriptContent: lockedContent,
      currentAct
    })
  }

  const handleConfirmAction = (suggestion) => {
    editorRef.current?.insertHTML(`<p style="text-align:left"><em>${suggestion}</em></p><p><br></p>`)
    setStructureState(prev => ({
      ...prev,
      lastWasScene: false,
      lastWasCharacter: false,
      lastWasDialogue: false,
      lastWasTransition: false
    }))
    setShowActionBuilder(false)
    flushToLocked('ACTION')
    endTurn()
  }

  const allowedActions = (() => {
    // 1. If no scene exists → ONLY scene allowed
    if (!structureState.hasScene) {
      return ['SCENE']
    }

    // 2. If last was CHARACTER → ONLY dialogue allowed
    if (structureState.lastWasCharacter) {
      return ['DIALOGUE']
    }

    // 3. Dialogue can happen anytime after character, but not first
    const base = ['ACTION', 'CHARACTER']

    // Only allow a new SCENE if the last action wasn't also a SCENE
    if (!structureState.lastWasScene) 
      base.unshift('SCENE')


    if (!structureState.lastWasTransition) base.push('TRANSITION')

    if (structureState.lastWasDialogue) {
      return base // can continue normally after dialogue
    }

    return base
  })()

  // CHARACTER — opens builder modal for player to type the character's name
  const handleCharacterAction = () => {
    setCharacterSuggestions([])
    setLoadingCharacter(true)
    setShowCharacterBuilder(true)
    socket.emit("request_character_suggestions", {
      sessionCode,
      scriptContent: lockedContent,
      currentAct
    })
  }

  const handleConfirmCharacter = (name) => {
    const uppercased = name.trim().toUpperCase()
    editorRef.current?.insertHTML(`<p style="text-align:center"><b>${uppercased}</b></p>`)
    setStructureState(prev => ({
      ...prev,
      lastWasScene: false,
      lastWasCharacter: true,
      lastWasDialogue: false,
      lastWasTransition: false
    }))
    setShowCharacterBuilder(false)
    flushToLocked('CHARACTER')
    endTurn()
  }

  // DIALOGUE — player overwrites the placeholder with the spoken line
  const handleDialogueAction = () => {
    setDialogueSuggestions([])
    setLoadingDialogue(true)
    setShowDialogueBuilder(true)
    socket.emit("request_dialogue_suggestions", {
      sessionCode,
      scriptContent: lockedContent,
      currentAct
    })
  }

  const handleConfirmDialogue = (suggestion) => {
    editorRef.current?.insertHTML(`<p style="text-align:center">${suggestion}</p><p><br></p>`)
    setStructureState(prev => ({
      ...prev,
      lastWasScene: false,
      lastWasCharacter: false,
      lastWasDialogue: true,
      lastWasTransition: false
    }))
    setShowDialogueBuilder(false)
    flushToLocked('DIALOGUE')
    endTurn()
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
    editorRef.current?.insertHTML(`<p style="text-align:right"><b>${t}</b></p><p><br></p>`)
    setShowTransitionBuilder(false)
    flushToLocked('TRANSITION')
    setStructureState(prev => ({
      ...prev,
      lastWasScene: false,  // ← add to any handler that resets structure
      lastWasCharacter: false,
      lastWasDialogue: false,
      lastWasTransition: true
    }))
    endTurn()
  }

  const ACTION_HANDLERS = {
    SCENE:      handleSceneAction,
    ACTION:     handleActionAction,
    CHARACTER:  handleCharacterAction,
    DIALOGUE:   handleDialogueAction,
    TRANSITION: handleTransitionAction,
  }

  const handleSelectAction = (action) => {
    if (!allowedActions.includes(action.tag)) {
      console.warn("Blocked illegal action:", action.tag)
      return
    }

    setSelectedAction(action)
    setShowActionPrompt(false)
    // Delegates entirely to the ACTION_HANDLERS above — no plain text appended here anymore
    ACTION_HANDLERS[action.tag]?.()
  }

  const endTurn = () => {
    // setCurrentPlayerIndex(i => (i + 1) % MOCK_PLAYERS.length)
    socket.emit("request_end_turn", { sessionCode })
    setSelectedAction(null)
    // setShowActionPrompt(true)
    setTurnTimeLeft(TURN_DURATION_SEC)
    setShowSceneBuilder(false)
    setShowCharacterBuilder(false)
    setShowTransitionBuilder(false)
    setShowActionBuilder(false)
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
    let delay = phase.duration
    if (sessionStartedAtRef.current) {
      let phaseStartMs = sessionStartedAtRef.current
      for (let i = 0; i < phaseIndex; i++) phaseStartMs += PHASES[i].duration
      delay = Math.max(0, phase.duration - (Date.now() - phaseStartMs))
    }
    const t = setTimeout(()=>{
      setPhaseIndex(i => Math.min(i+1,PHASES.length-1))
    }, delay)
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
      if (!scriptSavedRef.current) {
        scriptSavedRef.current = true
        socket.emit("save_script", { sessionCode, content: lockedContent })
      }
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
  if (showPromptReveal) {
    return (
      <div className="relative h-screen w-screen flex flex-col items-center justify-center overflow-hidden bg-black">
        <img
          src={assets.bg_image_login}
          className="absolute inset-0 h-full w-full object-cover opacity-30"
          alt="background"
        />
        <div className="absolute inset-0 bg-black/70" />

        <div className="relative z-10 flex flex-col items-center gap-10 text-center px-8 max-w-2xl">
          <p className="text-white/40 text-xs uppercase tracking-[0.3em] font-mono">
            Your Prompt
          </p>

          <h1
            className="text-white font-bold text-4xl md:text-5xl leading-tight drop-shadow-lg"
            style={{ textShadow: '0 0 40px rgba(125,211,252,0.3)' }}
          >
            {scriptPrompt}
          </h1>

          <p className="text-white/40 text-sm font-mono">
            Writing begins in...
          </p>

          {/* Countdown ring */}
          <div className="relative flex items-center justify-center">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
              <circle
                cx="48" cy="48" r="40"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="4"
              />
              <circle
                cx="48" cy="48" r="40"
                fill="none"
                stroke="#7dd3fc"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - promptCountdown / 5)}`}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <span className="absolute text-white font-bold text-3xl font-mono">
              {promptCountdown}
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (!sessionStarted) {
    return (
      <WaitingRoom
        sessionCode={sessionCode}
        players={players}
        onStart={handleStartSession}
        isHost={IS_HOST}
        onLeave={() => {
          socket.emit("leave_session", { sessionCode, userId: user?.id })
          navigate('/')
        }}
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
        className="absolute top-10 left-5 z-[60] bg-white/80 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg shadow-lg"
      >
        Leave
      </a>

      {scriptPrompt && (
        <div
          className="absolute top-24 left-5 z-[60] px-4 py-3 rounded-xl text-left max-w-[220px]"
          style={{
            background: 'rgba(10,10,20,0.75)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <p className="text-white/40 text-xs uppercase tracking-widest mb-1 font-mono">Prompt</p>
          <p className="text-white font-semibold text-sm leading-snug">{scriptPrompt}</p>
        </div>
      )}

      <div className="absolute top-10 right-6 z-20 bg-black/60 text-white px-3 py-1 rounded-lg font-mono text-base">
        Session Code: {sessionCode || '—'}
      </div>

      {isWriting && (
        <div className="absolute bottom-16 left-6 z-20 bg-black/60 text-white px-3 py-1 rounded-lg font-mono text-base">
          {currentAct}
        </div>
      )}

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
          allowedActions={allowedActions}
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
          <button
            onClick={() => setShowDocument(prev => !prev)}
            className="absolute bottom-14 left-1/2 -translate-x-1/2 z-[60] px-4 py-1.5 rounded-lg text-xs font-mono transition-all duration-200"
            style={{
              background: 'rgba(10,10,20,0.75)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            {showDocument ? 'Hide Script ↑' : 'Show Script ↓'}
          </button>

          {/* Always show the document */}
          <div className="absolute bottom-0 z-10 px-3 py-0 rounded-lg font-mono">
            <DocumentWindow
              ref={editorRef}
              lockedContent={lockedContent}
              currentContent={currentContent}
              onContentChange={setCurrentContent}
              isMyTurn={isMyTurn}
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
          {/* {isMyTurn && !showActionPrompt && (
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
          )} */}

          {!showActionPrompt && (
            <div className="fixed right-8 bottom-[45%] z-20">
              {betweenTurns ? (
                <div
                  className="px-6 py-4 rounded-xl text-center"
                  style={{
                    background: 'rgba(10,10,20,0.85)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <p className="text-white/40 text-xs uppercase tracking-widest mb-1 font-mono">Next turn in</p>
                  <p className="text-white font-bold text-9xl font-mono">{betweenTurnsCountdown}</p>
                </div>
              ) : (
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
              )}
            </div>
          )}

          {/* Scene Builder Modal */}
          {showSceneBuilder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSceneBuilder(false)} />
              <div
                className="relative z-10 w-[420px] rounded-2xl overflow-hidden shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(15,15,25,0.98) 0%, rgba(30,20,50,0.98) 100%)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <div className="px-6 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Scene Heading</p>
                  <h2 className="text-white font-bold text-lg">Where does this take place?</h2>
                </div>

                <div className="p-4 flex flex-col gap-2">
                  {loadingScenes ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                      <p className="text-white/40 text-sm font-mono">Generating scenes...</p>
                    </div>
                  ) : (
                    sceneSuggestions.map((heading, i) => (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleConfirmScene(heading)
                        }}
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
                        {heading}
                      </button>
                    ))
                  )}
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

                <div className="p-4 flex flex-col gap-2">
                  {loadingCharacter ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                      <p className="text-white/40 text-sm font-mono">Generating characters...</p>
                    </div>
                  ) : (
                    characterSuggestions.map((name, i) => (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleConfirmCharacter(name)
                        }}
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
                        {name}
                      </button>
                    ))
                  )}
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

          {showDialogueBuilder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDialogueBuilder(false)} />
              <div
                className="relative z-10 w-[420px] rounded-2xl overflow-hidden shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(15,15,25,0.98) 0%, rgba(30,20,50,0.98) 100%)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <div className="px-6 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Dialogue</p>
                  <h2 className="text-white font-bold text-lg">What do they say?</h2>
                </div>

                <div className="p-4 flex flex-col gap-2">
                  {loadingDialogue ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                      <p className="text-white/40 text-sm font-mono">Generating dialogue...</p>
                    </div>
                  ) : (
                    dialogueSuggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleConfirmDialogue(suggestion)}
                        }
                        className="w-full px-5 py-3 rounded-xl font-mono text-sm text-left transition-all duration-150"
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
                        "{suggestion}"
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {showActionBuilder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowActionBuilder(false)} />
              <div
                className="relative z-10 w-[420px] rounded-2xl overflow-hidden shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(15,15,25,0.98) 0%, rgba(30,20,50,0.98) 100%)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <div className="px-6 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Action</p>
                  <h2 className="text-white font-bold text-lg">What happens next?</h2>
                </div>

                <div className="p-4 flex flex-col gap-2">
                  {loadingActions ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                      <p className="text-white/40 text-sm font-mono">Generating suggestions...</p>
                    </div>
                  ) : (
                    actionSuggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleConfirmAction(suggestion)
                        }}
                        className="w-full px-5 py-3 rounded-xl font-mono text-sm text-left transition-all duration-150"
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
                        {suggestion}
                      </button>
                    ))
                  )}
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

                  <div className="flex gap-3 mt-4">
                    {!showStoryboard && (
                      <button
                        onClick={handleGenerateStoryboard}
                        className="flex-1 bg-sky-400 hover:bg-sky-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
                      >
                        Generate Storyboard →
                      </button>
                    )}
                    <button
                      onClick={() => setShowDocument(true)}
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 border border-white/20"
                    >
                      View Script →
                    </button>
                  </div>
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
        {formatTime(elapsedSeconds)}/{formatTime(GAME_DURATION_SEC)}
      </div>

      {showDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDocument(false)} />
          <div
            className="relative z-10 w-[600px] h-[80vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            style={{
              background: 'linear-gradient(135deg, rgba(15,15,25,0.98) 0%, rgba(30,20,50,0.98) 100%)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <div className="px-6 pt-5 pb-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="text-white font-bold text-lg">Full Script</h2>
              <button onClick={() => setShowDocument(false)} className="text-white/40 hover:text-white text-sm font-mono">Close ✕</button>
            </div>
            <div
              className="flex-1 overflow-y-auto p-6 text-white font-mono text-sm leading-relaxed"
              style={{ fontFamily: "'Courier New', Courier, monospace" }}
              dangerouslySetInnerHTML={{ __html: lockedContent }}
            />
          </div>
        </div>
      )}

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
                onClick={()=>{ setShowConfirm(false); socket.emit("leave_session", { sessionCode, userId: user?.id }); navigate('/') }}
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