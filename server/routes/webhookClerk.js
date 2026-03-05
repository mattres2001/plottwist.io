import { Webhook } from '@clerk/clerk-sdk-node';
import User from '../models/User.js';

export const handleClerkWebhook = async (req, res) => {
    try {
        // Pass raw body + headers
        const event = Webhook.verify(
            req.body,            // raw Buffer
            req.headers,         // svix headers
            process.env.CLERK_WEBHOOK_SECRET
        );

        console.log('Event type:', event.type);

        if (event.type === 'user.created') {
            const user = event.data;
            await User.create({ clerkId: user.id, email: user.email_address });
            console.log('User saved to DB:', user.id);
        }

        res.status(200).send('Webhook received');
    } catch (err) {
        console.error('Webhook verification failed:', err);
        res.status(400).send('Invalid signature');
    }
};