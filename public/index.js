/* /public/index.js – Referral System – Telegram WebApp & Outside */
/* يستخدم فقط الـ IDs الموجودة في HTML – لا يوجد Auto-Create */

/* ====== Helpers ====== */
const $ = id => document.getElementById(id);
const BOT_USERNAME = 'Game_win_usdtBot'; // سيتم استبداله بـ ENV عند البناء

function getTelegramUserID() {
  try {
    const t = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (t?.id) {
      localStorage.setItem('tg_user_id', String(t.id));
      return String(t.id);
    }
  } catch {}
  try {
    const s = localStorage.getItem('tg_user_id');
    if (s) return s;
  } catch {}
  return null;
}

function getRefParam() {
  try {
    const t = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
    if (t?.startsWith('ref_')) return t.replace('ref_', '');
  } catch {}
  try {
    const p = new URLSearchParams(window.location.search).get('ref');
    if (p) return p;
  } catch {}
  return null;
}

/* ====== API ====== */
async function api(action, params = {}) {
  const url = new URL('/api/index', location.origin);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url);
  return r.json();
}

async function registerUser(userID, ref) {
  return api('registerUser', { userID, ref });
}

async function getProfile(userID) {
  return api('getProfile', { userID });
}

/* ====== UI ====== */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  if (id === 'home') id = null;
  const el = id ? document.getElementById(id) : document.getElementById('home');
  if (el) el.classList.add('active');
}

function showCopySuccess() {
  const m = $('copyMsg');
  if (!m) return;
  m.style.opacity = 1;
  setTimeout(() => m.style.opacity = 0, 1500);
}

function updateUI(data) {
  if ($('points'))   $('points').textContent   = data.points ?? 0;
  if ($('usdt'))     $('usdt').textContent     = data.usdt   ?? '0.00';
  if ($('refCount')) $('refCount').textContent = data.referrals ?? 0;
  if ($('userImg') && data.photo_url) {
    $('userImg').src = data.photo_url;
    $('userImg').style.display = 'block';
  }
}

/* ====== Buttons ====== */
function setupButtons() {
  const map = {
    withdrawBtn : () => showPage('withdraw'),
    taskBtn     : () => showPage('task'),
    adsBtn      : () => alert('ADS feature coming soon!'),
    swapBtn     : () => showPage('swap'),
    ledbordBtn  : () => showPage('ledbord'),
    refalBtn    : () => showPage('refal'),
    backWithdraw: () => showPage('home'),
    backTask    : () => showPage('home'),
    backSwap    : () => showPage('home'),
    backLedbord : () => showPage('home'),
    backRefal   : () => showPage('home'),
    copyBtn     : async () => {
      const userID = getTelegramUserID();
      if (!userID) return alert('User not found');
      const link = `https://t.me/${BOT_USERNAME}/earn?startapp=ref_${userID}`;
      try {
        await navigator.clipboard.writeText(link);
        showCopySuccess();
      } catch {
        alert('Copy failed, please copy manually:\n' + link);
      }
    }
  };
  Object.entries(map).forEach(([id, fn]) => {
    const el = $(id);
    if (el) el.addEventListener('click', fn);
  });
}

/* ====== Init ====== */
(async function init() {
  const userID = getTelegramUserID();
  const ref    = getRefParam();
  if (!userID) {
    alert('Unable to get User ID');
    return;
  }
  await registerUser(userID, ref);
  const profile = await getProfile(userID);
  if (profile.success) updateUI(profile.data);
  setupButtons();
  showPage('home');
})();
