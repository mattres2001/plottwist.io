import User from '../models/User'

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.auth?.userId

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.status(200).json({
      user: {
        fullName: user.full_name || '',
        username: user.username || '',
        bio: user.bio || '',
        favoriteGenre: user.favoriteGenre || '',
        location: user.location || '',
      },
    })
  } catch (error) {
    console.error('getUserProfile error:', error)
    return res.status(500).json({ message: 'Server error' })
  }
}

export const updateUser = async (req, res) => {
  try {
    const userId = req.auth?.userId

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { fullName, username, bio, favoriteGenre, location } = req.body

    const user = await User.findByIdAndUpdate(
      userId,
      {
        full_name: fullName,
        username,
        bio,
        favoriteGenre,
        location,
      },
      {
        new: true,
      }
    )

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        fullName: user.full_name || '',
        username: user.username || '',
        bio: user.bio || '',
        favoriteGenre: user.favoriteGenre || '',
        location: user.location || '',
      },
    })
  } catch (error) {
    console.error('updateUser error:', error)
    return res.status(500).json({ message: 'Server error' })
  }
}