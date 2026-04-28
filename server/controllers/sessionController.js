import Session from '../models/Session.js'
import Move from '../models/Move.js'
import Script from '../models/Script.js'
import { generateSessionCode } from '../utils/sessionCode.js'
import { io } from '../server.js'

export const startSession = async (req, res) => {
  try {
    const { userId } = req.auth()

    let code
    let exists = true

    while (exists) {
      code = generateSessionCode()
      exists = await Session.findOne({
        code,
        status: { $in: ['waiting', 'active'] }
      })
    }

    const newSession = await Session.create({
      code,
      hostId: userId,
      players: [userId],
      status: 'waiting'
    })

    res.json({ success: true, newSession })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export const joinSession = async (req, res) => {
  try {
    const { userId } = req.auth()
    const { code } = req.body

    if (!code) {
      return res.json({ success: false, message: 'Session code is required' })
    }

    const session = await Session.findOne({
      code: code.toUpperCase(),
      status: { $in: ['waiting', 'active'] }
    })

    if (!session) {
      return res.json({ success: false, message: 'Session not found' })
    }

    if (!session.players.includes(userId)) {
      session.players.push(userId)
      await session.save()
    }

    res.json({ success: true, session })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export const getSessionByCode = async (req, res) => {
  try {
    const { code } = req.params

    const session = await Session.findOne({
      code: code.toUpperCase()
    })

    if (!session) {
      return res.json({ success: false, message: 'Session not found' })
    }

    res.json({ success: true, session })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export const endSession = async (req, res) => {
  try {
    const { code } = req.params
    const { script, prompt } = req.body

    const session = await Session.findOneAndUpdate(
      { code: code.toUpperCase() },
      { status: 'ended' },
      { new: true }
    )

    if (!session) {
      return res.json({ success: false, message: 'Session not found' })
    }

    await Script.create({
      sessionId: session._id,
      content: script ?? '',
      prompt: prompt ?? '',
      players: session.players
    })

    res.json({ success: true })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export const getGallerySessions = async (req, res) => {
  try {
    const scripts = await Script.find()
      .sort({ createdAt: -1 })
      .populate('sessionId', 'code')

    res.json({ success: true, scripts })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export const getSessionMoves = async (req, res) => {
  try {
    const { code } = req.params

    const session = await Session.findOne({ code: code.toUpperCase() })
    if (!session) {
      return res.json({ success: false, message: 'Session not found' })
    }

    const moves = await Move.find({ sessionId: session._id }).sort({ createdAt: 1 })
    res.json({ success: true, moves })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}