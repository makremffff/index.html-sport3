// استخدام متغيرات البيئة
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const restHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json'
};

async function supabase(method, table, body = null, query = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  const res = await fetch(url, {
    method,
    headers: restHeaders,
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error('Supabase error');
  return res.json();
}

/* ========== المنطق ========== */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const action = searchParams.get('action');

  try {
    if (action === 'registerUser') {
      const userID = searchParams.get('userID');
      const ref = searchParams.get('ref');

      // جلب المستخدم إن وجد
      const existing = await supabase('GET', 'players', null, `?user_id=eq.${userID}`);
      if (existing.length > 0)
        return res.json({ success: true, msg: 'exists' });

      // إدخال المستخدم الجديد
      await supabase('POST', 'players', {
        user_id: userID,
        referred_by: ref || null,
        points: 0,
        usdt: 0,
        referrals: 0
      });

      // مكافأة الإحالة
      if (ref && ref !== userID) {
        const [refUser] = await supabase('GET', 'players', null, `?user_id=eq.${ref}`);
        if (refUser) {
          await supabase('PATCH', 'players', {
            referrals: refUser.referrals + 1,
            points: refUser.points + 5000,
            usdt: refUser.usdt + 0.25
          }, `?user_id=eq.${ref}`);
        }
      }

      return res.json({ success: true });
    }

    if (action === 'getProfile') {
      const userID = searchParams.get('userID');
      const [row] = await supabase('GET', 'players', null, `?user_id=eq.${userID}`);
      if (!row) return res.status(404).json({ error: 'Not found' });
      return res.json(row);
    }

    return res.status(400).json({ error: 'Bad request' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
};
