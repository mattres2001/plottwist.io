// routes/webhookClerk.js
import Clerk from '@clerk/clerk-sdk-node';
import User from '../models/User.js';

export const handleClerkWebhook = async (req, res) => {
    try {
        const event = Clerk.webhooks.verifyRequest({
            payload: req.body,          // raw Buffer from express.raw()
            secret: process.env.CLERK_WEBHOOK_SECRET,
            headers: req.headers        // Svix headers included here
        });

        console.log('Webhook event type:', event.type);

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