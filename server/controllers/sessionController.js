import Session from '../models/Session.js'
import { generateSessionCode } from '../utils/sessionCode.js'

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