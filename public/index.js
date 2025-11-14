/* ========== إعدادات ========== */
const BOT_USERNAME = window.ENV?.NEXT_PUBLIC_BOT_USERNAME || 'Game_win_usdtBot';

/* ========== مساعدين ========== */
function getTelegramUserID() {
  try {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
      return String(window.Telegram.WebApp.initDataUnsafe.user.id);
    }
    return localStorage.getItem('fallbackUserID') || 'fallback_' + Math.random().toString(36).slice(2);
  } catch {
    return localStorage.getItem('fallbackUserID') || 'fallback_' + Math.random().toString(36).slice(2);
  }
}

function getRefParam() {
  try {
    // من Telegram
    const sp = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
    if (sp && sp.startsWith('ref_')) return sp.replace('ref_', '');
    // من URL
    const p = new URLSearchParams(location.search);
    const ref = p.get('ref') || p.get('startapp') || '';
    if (ref.startsWith('ref_')) return ref.replace('ref_', '');
    return ref;
  } catch {
    return '';
  }
}

function el(id) {
  return document.getElementById(id) || document.querySelector(`[name="${id}"]`);
}

function setText(id, text) {
  const elem = el(id);
  if (elem) elem.textContent = text;
}

function setImage(id, src) {
  const elem = el(id);
  if (elem) elem.src = src;
}

function showCopySuccess() {
  const m = el('copyMsg');
  if (!m) return;
  m.style.opacity = '1';
  setTimeout(() => m.style.opacity = '0', 2000);
}

/* ========== API ========== */
async function api(action, params = {}) {
  const url = new URL('/api/index', location.origin);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url);
  return res.json();
}

async function registerUser(userID, ref) {
  return api('registerUser', { userID, ref });
}

async function getProfile(userID) {
  return api('getProfile', { userID });
}

/* ========== تحديث الواجهة ========== */
function updateUI(data) {
  setText('points', data.points ?? 0);
  setText('usdt', data.usdt ?? 0);
  setText('refCount', data.referrals ?? 0);
  if (data.photo_url) setImage('userImg', data.photo_url);
  // إنشاء رابط الإحالة
  const link = `https://t.me/${BOT_USERNAME}/earn?startapp=ref_${data.user_id}`;
  // زر النسخ
  const btn = el('copyBtn');
  if (btn) {
    btn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(link);
        showCopySuccess();
      } catch {
        // fallback
        const ta = document.createElement('textarea');
        ta.value = link;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showCopySuccess();
      }
    };
  }
}

/* ========== تهيئة ========== */
(async function init() {
  const userID = getTelegramUserID();
  const ref = getRefParam();
  // تسجيل أو جلب البيانات
  await registerUser(userID, ref);
  const prof = await getProfile(userID);
  if (prof.success) updateUI(prof.data);
})();
