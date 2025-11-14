// مطلوب Env Variables:
// NEXT_PUBLIC_SUPABASE_URL
// NEXT_PUBLIC_SUPABASE_ANON_KEY
// NEXT_PUBLIC_BOT_USERNAME (optional)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function restHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  };
}

async function supabase(method, table, body, query = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  const res = await fetch(url, {
    method,
    headers: restHeaders(),
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default async function handler(req, res) {
  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const action = searchParams.get('action');

  try {
    if (action === 'registerUser') {
      const userID = searchParams.get('userID');
      const ref = searchParams.get('ref');

      // تحقق من وجود المستخدم
      const existing = await supabase('GET', 'players', null, `?user_id=eq.${userID}&select=*`);
      if (existing && existing.length > 0) {
        return res.json({ success: true, message: 'User already exists' });
      }

      // إدخال المستخدم الجديد
      await supabase('POST', 'players', {
        user_id: userID,
        referred_by: ref || null,
        points: 0,
        usdt: 0,
        referrals: 0
      });

      // منطق الإحالة
      if (ref && ref !== userID) {
        const refUsers = await supabase('GET', 'players', null, `?user_id=eq.${ref}&select=*`);
        if (refUsers && refUsers.length > 0) {
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
      const userID = searchParams.get('userID');
      const rows = await supabase('GET', 'players', null, `?user_id=eq.${userID}&select=*`);
      if (!rows || rows.length === 0) {
        return res.json({ success: false, error: 'User not found' });
      }
      return res.json({ success: true, data: rows[0] });
    }

    return res.json({ success: false, error: 'Unknown action' });
  } catch (e) {
    return res.json({ success: false, error: e.message });
  }
}
