// api/helth.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import clientPromise from '../lib/mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const client = await clientPromise;
        const admin = client.db().admin();
        const result = await admin.ping();
        return res.status(200).json({ ok: true, result });
    } catch (err: any) {
        // 1) console.error to show full stack in Vercel logs
        console.error("HEALTH CHECK ERROR (detailed):", err && (err.stack || err));

        // 2) Also return error details in response for fast debugging (REMOVE after fix)
        const message = err && err.message ? err.message : String(err);
        const stack = err && err.stack ? err.stack : null;
        return res.status(500).json({ ok: false, error: message, stack });
    }
}
