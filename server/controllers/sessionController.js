import Session from '../models/Session.js'
import { generateSessionCode } from '../utils/sessionCode.js'

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