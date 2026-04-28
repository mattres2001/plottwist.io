import Rating from '../models/Rating.js'
import Session from '../models/Session.js'
import Script from '../models/Script.js'

export const submitRating = async (req, res) => {
  try {
    const { userId } = req.auth()
    const { sessionCode, score } = req.body

    if (!sessionCode || !score || score < 1 || score > 5) {
      return res.json({ success: false, message: 'Invalid rating data' })
    }

    await Rating.findOneAndUpdate(
      { _id: `${sessionCode}-${userId}` },
      { documentId: sessionCode, userId, score },
      { upsert: true, new: true }
    )

    const ratings = await Rating.find({ documentId: sessionCode })
    const average = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
    const rounded = Math.round(average * 10) / 10

    const session = await Session.findOne({ code: sessionCode })
    if (session) {
      await Script.findOneAndUpdate(
        { sessionId: session._id },
        { averageRating: rounded, ratingCount: ratings.length }
      )
    }

    res.json({ success: true, average: rounded })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export const getAverageRating = async (req, res) => {
  try {
    const { sessionCode } = req.params

    const ratings = await Rating.find({ documentId: sessionCode })

    if (ratings.length === 0) {
      return res.json({ success: true, average: null, count: 0 })
    }

    const average = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length

    res.json({ success: true, average: Math.round(average * 10) / 10, count: ratings.length })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}
