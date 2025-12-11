// api/auth/login.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import clientPromise from '../../lib/mongodb';
import bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

    try {
        const client = await clientPromise;
        const db = client.db(); // or client.db('yourDBname')
        const users = db.collection('users');
        const user = await users.findOne({ email });

        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        // TODO: create session / token; simplified response for now
        return res.status(200).json({ ok: true, userId: String(user._id), email: user.email });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: 'Server error' });
    }
}
