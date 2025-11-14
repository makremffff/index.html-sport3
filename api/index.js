/* /api/index.js – Serverless – Vercel */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const restHeaders = () => ({
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json'
});

async function supabase(method, table, body = null, query = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  const opt = { method, headers: restHeaders() };
  if (body) opt.body = JSON.stringify(body);
  const r = await fetch(url, opt);
  if (!r.ok) throw new Error(await r.text());
  if (method === 'GET') return r.json();
  return r;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { action, userID, ref } = req.query;
    if (!userID) throw new Error('userID required');

    if (action === 'registerUser') {
      const exists = await supabase('GET', 'players', null, `?user_id=eq.${userID}&select=*`);
      if (exists.length > 0) return res.json({ success: true });

      const insertBody = { user_id: userID, referred_by: ref || null, points: 0, usdt: 0, referrals: 0 };
      await supabase('POST', 'players', insertBody);

      if (ref && ref !== userID) {
        const refUsers = await supabase('GET', 'players', null, `?user_id=eq.${ref}&select=*`);
        if (refUsers.length > 0) {
          const refUser = refUsers[0];
          await supabase('PATCH', 'players', {
            referrals: refUser.referrals + 1,
            points: refUser.points + 5000,
            usdt: refUser.usdt + 0
          }, `?user_id=eq.${ref}`);
        }
      }
      return res.json({ success: true });
    }

    if (action === 'getProfile') {
      const rows = await supabase('GET', 'players', null, `?user_id=eq.${userID}&select=*`);
      if (rows.length === 0) throw new Error('User not found');
      return res.json({ success: true, data: rows[0] });
    }

    throw new Error('Unknown action');
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
}
