import Session from '../models/Session'
import { generateSessionCode } from '../utils/sessionCode'

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
            code: code,
            hostId: userId
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