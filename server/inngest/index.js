import { Inngest } from "inngest";
import User from '../models/User.js'

// Create a client to send and receive events
export const inngest = new Inngest({ id: "study-buddy-csun" });

// Inngest function to save user data to database
const syncUserCreation = inngest.createFunction(
    { id: 'sync-user-from-clerk' },
    { event: 'clerk/user.created' },
    async ({event}) => {
        const {
            id,
            email_addresses, 
            image_url
        } = event.data;
        let username = email_addresses[0].email_address.split('@')[0];

        // Check availability of username
        const user = await User.findOne({username});

        if (user) {
            username = username + Math.floor(Math.random() * 10000)
        }

        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            profile_picture: image_url, 
            username
        }
        await User.create(userData);
    }
);

export const functions = [
    syncUserCreation
]