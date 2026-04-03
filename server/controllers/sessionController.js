import Session from '../models/Session.js'
import { generateSessionCode } from '../utils/sessionCode.js'
import { io } from '../server.js'

export const startSession = async (req, res) => {
    try {
        const { userId } = req.auth();
        
        let code;
        let exists = true;
        
        // generate unique session code
        while (exists) {
            code = generateSessionCode();
            exists = await Session.findOne({ 
                code, 
                status: { $in: ['waiting', 'active'] }
            });
        }

        const newSession = await Session.create({
            code,
            hostId: userId,
            players: [userId],
            status: 'waiting'
        })

        res.json({
            success: true,
            newSession
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export const joinSession = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { code } = req.body;
        const session = await Session.findOne({
            code,
            status: 'waiting'
        });

        if (!session) {
            return res.json({
                success: false,
                message: "Session doesn't exist"
            })
        }

        const alreadyJoined = session.players.includes(userId);

        if (!alreadyJoined) {
            session.players.push(userId);
            await session.save();
        }

        res.json({
            success: true,
            session
        })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}