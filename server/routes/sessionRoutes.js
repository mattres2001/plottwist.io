import express from 'express'
import { protect } from '../middleware/auth.js'
import {
  startSession,
  joinSession,
  getSessionByCode
} from '../controllers/sessionController.js'

const sessionRouter = express.Router()

sessionRouter.post('/start', protect, startSession)
sessionRouter.post('/join', protect, joinSession)
sessionRouter.get('/:code', protect, getSessionByCode)

export default sessionRouter