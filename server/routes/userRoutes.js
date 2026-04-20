import express from 'express'
import { protect } from '../middleware/auth.js'
import { getUserProfile, updateUser } from '../controllers/UserController.js'

const userRouter = express.Router()

userRouter.get('/profile', protect, getUserProfile)
userRouter.put('/profile', protect, updateUser)

export default userRouter