/* ========== أدوات Telegram ========== */
function getTelegramUserID() {
  try {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id)
      return window.Telegram.WebApp.initDataUnsafe.user.id;
  } catch {}
  return localStorage.getItem('userID') || null;
}

function getRefParam() {
  try {
    const start_param = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
    if (start_param?.startsWith('ref_')) return start_param.replace('ref_', '');
  } catch {}
  const q = new URLSearchParams(window.location.search);
  return q.get('start_param')?.replace('ref_', '') || null;
}

/* ========== API helper ========== */
async function api(action, params = {}) {
  const usp = new URLSearchParams({ action, ...params });
  const res = await fetch(`/api/index?${usp}`);
  if (!res.ok) throw new Error('API error');
  return res.json();
}

/* ========== الوظائف الرئيسية ========== */
async function registerUser(userID, ref) {
  return api('registerUser', { userID, ref });
}

async function getProfile(userID) {
  return api('getProfile', { userID });
}

/* ========== تحديث الواجهة ========== */
function updateUI(data) {
  // نقوم بالتحديث فقط إذا وجدنا العنصر
  const set = (id, txt) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  };
  set('points', data.points ?? 0);
  set('usdt', data.usdt ?? 0);
  set('status', `الإحالات: ${data.referrals ?? 0}`);
  set('profile', `نقاطك: ${data.points ?? 0} | USDT: ${data.usdt ?? 0}`);

  const refLink = `https://t.me/Game_win_usdtBot/earn?startapp=ref_${data.user_id}`;
  const refEl = document.getElementById('refLink');
  if (refEl) refEl.value = refLink;
}

/* ========== أزرار ========== */
function setupButtons() {
  const btn = document.getElementById('copyRef');
  if (!btn) return;
  btn.style.display = 'block';
  btn.onclick = () => {
    const inp = document.getElementById('refLink');
    if (!inp) return;
    inp.style.display = 'block';
    inp.select();
    document.execCommand('copy');
    alert('تم النسخ!');
  };
}

/* ========== التهيئة ========== */
(async function init() {
  try {
    const userID = getTelegramUserID();
    if (!userID) return console.warn('لا يوجد userID');
    localStorage.setItem('userID', userID);

    const ref = getRefParam();
    await registerUser(userID, ref);
    const profile = await getProfile(userID);
    updateUI(profile);
    setupButtons();
  } catch (e) {
    console.error(e);
  }
})();
