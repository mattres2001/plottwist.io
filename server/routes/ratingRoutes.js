import express from 'express'
import { protect } from '../middleware/auth.js'
import { submitRating, getAverageRating } from '../controllers/ratingController.js'

const ratingRouter = express.Router()

ratingRouter.post('/', protect, submitRating)
ratingRouter.get('/:sessionCode', protect, getAverageRating)

export default ratingRouter
