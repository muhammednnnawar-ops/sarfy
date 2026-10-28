// Sarfy - Frontend REST API Connector for MySQL / HostArmada cPanel
// يتعامل بسلاسة مع السيرفر: يدعم المزامنة السحابية مع MySQL عند الاتصال
// ويوفر وضع عدم الاتصال (Offline Fallback) التلقائي 100% دون أي توقف أو أخطاء

// مفتاح تخزين توكن جلسة تسجيل الدخول في المتصفح
const AUTH_TOKEN_KEY = 'sarfy_auth_token';

export function getAuthToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {}
}

// بناء الترويسات المطلوبة مع إرفاق توكن الجلسة إن وُجد
function authHeaders(extra = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...extra
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function checkBackendStatus() {
  // إذا كان التطبيق مفتوحاً كملف محلي في المتصفح file:///
  if (typeof window === 'undefined' || !window.location || window.location.protocol === 'file:') {
    return {
      isServer: false,
      connected: false,
      mode: 'local_file',
      message: 'تشغيل محلي كملف (file://) - البيانات تُحفظ في الذاكرة المحلية للمتصفح'
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('./api.php?action=test', {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        isServer: true,
        connected: false,
        mode: 'http_no_api',
        message: `تعذر الاتصال بـ api.php (رمز الاستجابة: ${res.status})`
      };
    }

    const data = await res.json();
    return {
      isServer: true,
      connected: !!data.connected,
      mode: data.connected ? 'mysql_online' : 'mysql_error',
      database: data.database || '',
      tablesCount: data.tables_count || 0,
      tables: data.tables || [],
      message: data.message || (data.connected ? 'متصل بقاعدة البيانات MySQL' : data.error || 'تعذر الاتصال بقاعدة البيانات')
    };
  } catch (err) {
    return {
      isServer: true,
      connected: false,
      mode: 'network_offline',
      message: 'الواجهة البرمجية api.php غير متاحة أو غير مجهزة حالياً'
    };
  }
}

export async function fetchServerData(userId = 'user_1', options = {}) {
  if (typeof window === 'undefined' || !window.location || window.location.protocol === 'file:') {
    return null;
  }

  try {
    const { lastUpdated = '', pollOnly = false } = options;
    let url = `./api.php?action=get_data&user_id=${encodeURIComponent(userId)}`;
    if (lastUpdated) {
      url += `&last_updated=${encodeURIComponent(lastUpdated)}`;
    }
    if (pollOnly) {
      url += `&poll_only=1`;
    }
    const res = await fetch(url, { cache: 'no-store', headers: authHeaders() });
    if (!res.ok) return null;
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('تعذر جلب البيانات من السيرفر:', err);
  }
  return null;
}

export async function syncDataToServer(state, userId = 'user_1') {
  if (typeof window === 'undefined' || !window.location || window.location.protocol === 'file:') {
    return { success: false, reason: 'offline_file' };
  }

  try {
    const res = await fetch('./api.php?action=sync_all', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        user_id: userId,
        data: state
      })
    });

    if (!res.ok) {
      return { success: false, status: res.status };
    }

    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('تعذر مزامنة البيانات مع MySQL:', err);
    return { success: false, error: err.message };
  }
}

export async function registerUserOnServer(userObj) {
  if (typeof window === 'undefined' || !window.location || window.location.protocol === 'file:') {
    return { success: false, reason: 'offline_file' };
  }

  try {
    const res = await fetch('./api.php?action=auth&sub=register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userObj)
    });
    const json = await res.json().catch(() => null);
    // حفظ توكن الجلسة تلقائياً عند نجاح التسجيل
    if (json && json.success && json.token) {
      setAuthToken(json.token);
    }
    if (!res.ok) {
      return { success: false, error: json?.error || `خطأ السيرفر (${res.status})` };
    }
    return json;
  } catch (err) {
    return { success: false, error: 'تعذر الاتصال بـ api.php: ' + err.message };
  }
}

export async function checkServerLogin(credentials) {
  if (typeof window === 'undefined' || !window.location || window.location.protocol === 'file:') {
    return { success: false, reason: 'offline_file' };
  }

  try {
    const res = await fetch('./api.php?action=auth&sub=login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    const json = await res.json().catch(() => null);
    // حفظ توكن الجلسة تلقائياً عند نجاح تسجيل الدخول
    if (json && json.success && json.token) {
      setAuthToken(json.token);
    }
    if (!res.ok) {
      return { success: false, error: json?.error || `خطأ استجابة السيرفر (${res.status})` };
    }
    return json;
  } catch (err) {
    return { success: false, error: 'تعذر الاتصال بالسيرفر: ' + err.message };
  }
}

export async function checkServerUser() {
  if (typeof window === 'undefined' || !window.location || window.location.protocol === 'file:') {
    return null;
  }

  try {
    const res = await fetch('./api.php?action=auth&sub=check_user');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

// -------------------------------------------------------------
// وظائف لوحة تحكم مالك التطبيق (Admin / Owner Functions)
// -------------------------------------------------------------
export async function adminGetUsers() {
  if (typeof window === 'undefined' || !window.location || window.location.protocol === 'file:') {
    return { success: false, users: [], stats: { total_users: 0, active_users: 0, total_transactions: 0 } };
  }
  try {
    const res = await fetch('./api.php?action=admin&sub=users_list', { headers: authHeaders() });
    if (!res.ok) return { success: false, users: [] };
    return await res.json();
  } catch (err) {
    return { success: false, users: [], error: err.message };
  }
}

export async function adminToggleStatus(userId, status) {
  try {
    const res = await fetch('./api.php?action=admin&sub=update_status', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ userId, status })
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function adminUpdateRole(userId, role) {
  try {
    const res = await fetch('./api.php?action=admin&sub=update_role', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ userId, role })
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function adminDeleteUser(userId) {
  try {
    const res = await fetch('./api.php?action=admin&sub=delete_user', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ userId })
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function adminCreateClient(clientData) {
  try {
    const res = await fetch('./api.php?action=admin&sub=create_client', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(clientData)
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}
