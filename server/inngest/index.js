import { Inngest } from 'inngest';
import User from '../models/User.js'

export const inngest = new Inngest({ id: "plottwist.io" });

const syncUserCreation = inngest.createFunction(
    { id: 'sync-user-from-clerk' },
    { event: 'clerk/user.created' },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data

        let username = email_addresses[0].email_address.split('@')[0]

        const user = await User.findOne({username})

        if (user) {
            username = username + Math.floor(Math.random() * 10000)
        }

        const userData = {
            _id: id,
            emaik: email_addresses[0].email_address,
            full_name: first_name + " " + last_name,
            profile_picture: image_url,
            username
        }

        await User.create(userData)
    }
)

export const functions = [
    syncUserCreation
];