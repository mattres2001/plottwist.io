import { Webhook } from '@clerk/clerk-sdk-node';
import User from '../models/User.js';

export const handleClerkWebhook = async (req, res) => {
    const signature = req.headers['x-clerk-signature'];

    let event;
    try {
        event = Webhook.verify(req.body, signature, process.env.CLERK_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook verification failed:', err);
        return res.status(400).send('Invalid signature');
    }

    console.log('Webhook event received:', event.type);

    if (event.type === 'user.created') {
        const user = event.data;
        try {
            await User.create({ clerkId: user.id, email: user.email_address });
            console.log('User saved to DB:', user.id);
        } catch (err) {
            console.error('Error saving user:', err);
        }
    }

    res.status(200).send('Webhook received');
};