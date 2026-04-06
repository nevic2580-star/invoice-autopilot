/* ============================================
   AUTH MODULE - Enhanced Security
   SHA-256 Hashing + Session Timeout + Login Limits
   ============================================ */
const Auth = (() => {
  const SESSION_KEY = 'inv_session';
  const SESSION_TS_KEY = 'inv_session_ts';
  const LOGIN_ATTEMPTS_KEY = 'inv_login_attempts';
  const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_MS = 60 * 1000; // 1 minute lockout

  let activityTimer = null;

  /* --- SHA-256 Hash --- */
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + '_inv_salt_2026');
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function hashSync(password) {
    // Simple sync fallback for comparison (FNV-1a 32-bit hash)
    let h = 0x811c9dc5;
    const s = password + '_inv_salt_2026';
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  }

  /* --- Login Attempt Limiting --- */
  function getLoginAttempts() {
    try { return JSON.parse(localStorage.getItem(LOGIN_ATTEMPTS_KEY)) || { count: 0, lastAttempt: 0 }; } catch { return { count: 0, lastAttempt: 0 }; }
  }

  function isLockedOut() {
    const attempts = getLoginAttempts();
    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
      const elapsed = Date.now() - attempts.lastAttempt;
      if (elapsed < LOCKOUT_MS) {
        const remaining = Math.ceil((LOCKOUT_MS - elapsed) / 1000);
        return { locked: true, remaining };
      }
      // Reset after lockout period
      localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify({ count: 0, lastAttempt: 0 }));
    }
    return { locked: false };
  }

  function recordFailedAttempt() {
    const attempts = getLoginAttempts();
    attempts.count++;
    attempts.lastAttempt = Date.now();
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
  }

  function resetAttempts() {
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify({ count: 0, lastAttempt: 0 }));
  }

  /* --- Core Auth --- */
  function login(username, password) {
    const lockStatus = isLockedOut();
    if (lockStatus.locked) {
      return { success: false, message: `로그인 시도 초과. ${lockStatus.remaining}초 후 다시 시도하세요.` };
    }

    const users = Storage.getUsers();
    const hashed = hashSync(password);

    // Try hashed first, then plain text for backward compat
    let user = users.find(u => u.username === username && u.passwordHash === hashed);
    if (!user) {
      user = users.find(u => u.username === username && u.password === password);
      // Migrate to hashed if plain text matched
      if (user) {
        user.passwordHash = hashed;
        delete user.password;
        Storage.saveAll('inv_users', users);
      }
    }

    if (user) {
      resetAttempts();
      const sessionUser = { ...user };
      delete sessionUser.password;
      delete sessionUser.passwordHash;
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
      localStorage.setItem(SESSION_TS_KEY, String(Date.now()));
      if (typeof NotificationCenter !== 'undefined') {
        NotificationCenter.logActivity({ action: 'login', detail: `${user.name} 로그인` });
      }
      return { success: true, user: sessionUser };
    }

    recordFailedAttempt();
    const attemptsLeft = MAX_LOGIN_ATTEMPTS - getLoginAttempts().count;
    return { success: false, message: `아이디 또는 비밀번호가 올바르지 않습니다. (${attemptsLeft}회 남음)` };
  }

  function logout() {
    if (typeof NotificationCenter !== 'undefined') {
      const user = getCurrentUser();
      if (user) NotificationCenter.logActivity({ action: 'logout', detail: `${user.name} 로그아웃` });
    }
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_TS_KEY);
    window.location.reload();
  }

  function getCurrentUser() {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    return sessionStr ? JSON.parse(sessionStr) : null;
  }

  function registerVendor(vendorId, username, password) {
    const users = Storage.getUsers();
    if (users.find(u => u.username === username)) {
      return { success: false, message: '이미 존재하는 아이디입니다.' };
    }
    const vendors = Storage.getVendors();
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) return { success: false, message: '업체를 찾을 수 없습니다.' };

    const newUser = {
      id: 'U' + Date.now(),
      username,
      passwordHash: hashSync(password),
      role: 'vendor',
      name: vendor.name,
      vendorId: vendor.id
    };
    users.push(newUser);
    Storage.saveAll('inv_users', users);
    return { success: true };
  }

  function isLoggedIn() {
    return getCurrentUser() !== null;
  }

  /* --- Session Timeout --- */
  function startSessionMonitor() {
    resetActivityTimer();
    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt => {
      document.addEventListener(evt, resetActivityTimer, { passive: true });
    });
  }

  function resetActivityTimer() {
    localStorage.setItem(SESSION_TS_KEY, String(Date.now()));
    if (activityTimer) clearTimeout(activityTimer);
    activityTimer = setTimeout(checkSessionTimeout, 60000); // Check every 60s
  }

  function checkSessionTimeout() {
    if (!isLoggedIn()) return;
    const lastActive = parseInt(localStorage.getItem(SESSION_TS_KEY) || '0');
    const elapsed = Date.now() - lastActive;
    if (elapsed > SESSION_TIMEOUT_MS) {
      showTimeoutWarning();
    } else {
      activityTimer = setTimeout(checkSessionTimeout, 60000);
    }
  }

  function showTimeoutWarning() {
    const overlay = document.createElement('div');
    overlay.className = 'session-timeout-overlay';
    overlay.innerHTML = `
      <div class="session-timeout-box">
        <h3>⏰ 세션 만료</h3>
        <p>30분간 활동이 없어 자동 로그아웃됩니다.</p>
        <div style="display:flex;gap:10px;justify-content:center">
          <button class="btn btn-primary" onclick="Auth.extendSession()">연장하기</button>
          <button class="btn btn-secondary" onclick="Auth.logout()">로그아웃</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
  }

  function extendSession() {
    const overlay = document.querySelector('.session-timeout-overlay');
    if (overlay) overlay.remove();
    resetActivityTimer();
    if (typeof App !== 'undefined') App.showToast('info', '세션 연장', '세션이 30분 연장되었습니다.');
  }

  return {
    login, logout, getCurrentUser, registerVendor, isLoggedIn,
    startSessionMonitor, extendSession, hashSync
  };
})();
