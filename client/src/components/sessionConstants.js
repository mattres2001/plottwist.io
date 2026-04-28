// Note: this does not effect Session.jsx, this is for other components
// Session.jsx has its own constants 

// export const ROUND_DURATION_MS = 5000
// export const WRITING_DURATION_MS = 5 * 60 * 1000
// export const REST_DURATION_MS = 5000
// export const GAME_DURATION_SEC = 15 * 60
// export const ROUND_DURATION_SEC = 5 * 60
export const WRITING_DURATION_MS = 2 * 60 * 1000  // 2 min per act (3 acts = 6 min total)
export const ROUND_DURATION_MS = 3000              // 3 sec for act start/end screens
export const REST_DURATION_MS = 3000               // 3 sec rest between acts
export const GAME_DURATION_SEC = 6 * 60            // 6 min total ✅ already correct
export const ROUND_DURATION_SEC = 2 * 60           // 2 min per round ✅ already correct
export const BETWEEN_TURN_COUNTDOWN = 3

export const TURN_DURATION_SEC = 30
export const ACTION_PROMPT_SEC = 5

export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 4

export const MOCK_PLAYERS = ['Alice', 'Bob', 'Charlie', 'Diana']

export const SCREENPLAY_ACTIONS = [
  { label: 'Scene', tag: 'SCENE' },
  { label: 'Action', tag: 'ACTION' },
  { label: 'Character', tag: 'CHARACTER' },
  { label: 'Dialogue', tag: 'DIALOGUE' },
  { label: 'Transition', tag: 'TRANSITION' },
]

export const PHASES = [
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
