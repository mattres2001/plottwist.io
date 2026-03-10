import { Inngest } from "inngest";
import User from '../models/User.js'

// Create a client to send and receive events
export const inngest = new Inngest({ id: "plottwist-io" });

// Inngest function to save user data to database
const syncUserCreation = inngest.createFunction(
    { id: 'sync-user-from-clerk' },
    { event: 'user.created' },
    async ({event}) => {

        // 🔹 Log the event to confirm it's arriving
        console.log("Clerk event received:", event);


        const {
            id,
            email_addresses, 
            image_url,
            first_name,
            last_name
        } = event.data;
        let username = email_addresses[0].email_address.split('@')[0];

        // Check availability of username
        const existingUser = await User.findOne({username});

        if (existingUser) {
            username = username + Math.floor(Math.random() * 10000)
        }

        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            profile_picture: image_url,
            full_name: `${first_name || ""} ${last_name || ""}`.trim(),
            username
        }


        try {
            // 🔹 Log before saving
            console.log("Attempting to save user:", userData);

            await User.create(userData);

            // 🔹 Log success
            console.log("User saved successfully");
        } catch (err) {
            // 🔹 Log errors if MongoDB rejects the insert
            console.error("User creation failed:", err);
        }
    }
);

export const functions = [
    syncUserCreation
]