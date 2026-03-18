import express from 'express'
import { protect } from '../middleware/auth.js';
import {
    startSession
} from '../controllers/sessionController.js'

const sessionRouter = express.Router();

sessionRouter.post('/start', protect, startSession)

export default sessionRouter;