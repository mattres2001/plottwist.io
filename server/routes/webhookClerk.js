// routes/webhookClerk.js
import { Webhook } from "svix";
import User from "../models/User.js";

export const handleClerkWebhook = async (req, res) => {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        throw new Error("CLERK_WEBHOOK_SECRET is not set");
    }

    const headers = req.headers;

    const svix_id = headers["svix-id"];
    const svix_timestamp = headers["svix-timestamp"];
    const svix_signature = headers["svix-signature"];

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return res.status(400).send("Missing Svix headers");
    }

    const payload = req.body.toString(); // raw body

    const wh = new Webhook(WEBHOOK_SECRET);

    let evt;

    try {
        evt = wh.verify(payload, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
        });
    } catch (err) {
        console.error("Webhook verification failed:", err.message);
        return res.status(400).send("Invalid signature");
    }

    console.log("Webhook verified:", evt.type);

    try {
        if (evt.type === "user.created") {
        const user = evt.data;

        await User.create({
            clerkId: user.id,
            email: user.email_addresses[0].email_address
        });

        console.log("User saved:", user.id);
        }

        res.status(200).json({ received: true });

    } catch (err) {
        console.error("Webhook DB error:", err);
        res.status(500).send("Server error");
    }
};