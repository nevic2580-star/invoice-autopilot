/* ============================================
   NOTIFICATION CENTER - Alerts & Activity Log
   ============================================ */
const NotificationCenter = (() => {
  const STORAGE_KEY = 'inv_notifications';
  const LOG_KEY = 'inv_activity_log';

  function getNotifications() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  }

  function saveNotifications(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function addNotification(notification) {
    const data = getNotifications();
    const item = {
      id: 'N' + Date.now(),
      ...notification,
      read: false,
      createdAt: new Date().toISOString()
    };
    data.unshift(item);
    if (data.length > 50) data.pop(); // Keep last 50
    saveNotifications(data);
    updateBadge();
    return item;
  }

  function markAsRead(id) {
    const data = getNotifications();
    const item = data.find(n => n.id === id);
    if (item) { item.read = true; saveNotifications(data); }
    updateBadge();
  }

  function markAllRead() {
    const data = getNotifications();
    data.forEach(n => n.read = true);
    saveNotifications(data);
    updateBadge();
  }

  function getUnreadCount() {
    return getNotifications().filter(n => !n.read).length;
  }

  function updateBadge() {
    const count = getUnreadCount();
    const badge = document.getElementById('notifBadge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
      if (count > 0) badge.classList.add('pulse');
      else badge.classList.remove('pulse');
    }
  }

  /* --- Activity Log --- */
  function getActivityLog() {
    try { return JSON.parse(localStorage.getItem(LOG_KEY)) || []; } catch { return []; }
  }

  function logActivity(action) {
    const data = getActivityLog();
    const user = (typeof Auth !== 'undefined' && Auth.getCurrentUser()) || { name: 'System' };
    data.unshift({
      id: 'L' + Date.now(),
      action: action.action,
      detail: action.detail || '',
      invoiceId: action.invoiceId || '',
      userName: user.name,
      userRole: user.role || 'system',
      timestamp: new Date().toISOString()
    });
    if (data.length > 200) data.length = 200;
    localStorage.setItem(LOG_KEY, JSON.stringify(data));
  }

  /* --- UI Rendering --- */
  function togglePanel() {
    const panel = document.getElementById('notifPanel');
    if (!panel) return;
    const isOpen = panel.classList.contains('open');
    if (isOpen) {
      panel.classList.remove('open');
    } else {
      panel.classList.add('open');
      renderPanel();
    }
  }

  function renderPanel() {
    const panel = document.getElementById('notifPanelBody');
    if (!panel) return;
    const notifs = getNotifications().slice(0, 20);

    if (!notifs.length) {
      panel.innerHTML = `<div class="notif-empty">
        <div style="font-size:2rem;margin-bottom:8px">🔔</div>
        <div style="color:var(--text-muted);font-size:0.85rem">새로운 알림이 없습니다</div>
      </div>`;
      return;
    }

    panel.innerHTML = notifs.map(n => {
      const icons = { approval: '✅', reject: '❌', submit: '📤', create: '📝', delete: '🗑️', system: '⚙️' };
      const icon = icons[n.type] || '📋';
      const timeAgo = getTimeAgo(n.createdAt);
      return `<div class="notif-item ${n.read ? '' : 'unread'}" onclick="NotificationCenter.markAsRead('${n.id}')">
        <div class="notif-icon">${icon}</div>
        <div class="notif-content">
          <div class="notif-title">${n.title}</div>
          <div class="notif-desc">${n.message}</div>
          <div class="notif-time">${timeAgo}</div>
        </div>
      </div>`;
    }).join('');
  }

  function getTimeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
  }

  /* --- Convenience Creators --- */  
  function notifyApproval(invoiceId, approverName, stage) {
    addNotification({
      type: 'approval',
      title: `결재 승인 (${stage})`,
      message: `${invoiceId} - ${approverName}님이 승인했습니다.`
    });
    logActivity({ action: 'approval', detail: `${stage} 승인: ${approverName}`, invoiceId });
  }

  function notifyReject(invoiceId, approverName, stage, reason) {
    addNotification({
      type: 'reject',
      title: `결재 반려 (${stage})`,
      message: `${invoiceId} - ${approverName}님이 반려 (사유: ${reason.slice(0,30)}...)`
    });
    logActivity({ action: 'reject', detail: `${stage} 반려: ${reason}`, invoiceId });
  }

  function notifySubmit(invoiceId, vesselName) {
    addNotification({
      type: 'submit',
      title: '인보이스 제출',
      message: `${invoiceId} - ${vesselName} 인보이스가 제출되었습니다.`
    });
    logActivity({ action: 'submit', detail: `${vesselName} 인보이스 제출`, invoiceId });
  }

  function simulateEmailPreview(invoice) {
    const modal = document.getElementById('modal-overlay');
    if (!modal) return;
    
    modal.querySelector('.modal').className = 'modal modal-lg';
    modal.querySelector('.modal-header h2').innerHTML = '📧 감독관 메일 수신 미리보기 (Email Preview)';
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: white; color: #0f172a;">
        <div style="background-color: #0f172a; padding: 16px 20px; color: white;">
          <h2 style="margin: 0; font-size: 1.2rem; color: white;">[결재 요청] 인보이스 승인이 필요합니다</h2>
        </div>
        <div style="padding: 24px;">
          <p style="margin-top: 0; color: #334155; font-size: 1rem;">안녕하세요 감독관님,</p>
          <p style="color: #334155; line-height: 1.6; font-size: 0.95rem;">
            <strong>${invoice.vendorName || '(업체명)'}</strong>에서 새로운 선박 인보이스(문서번호: <strong>${invoice.id}</strong>)의 결재를 제출하였습니다.
            아래 내역을 확인하신 후 시스템에 접속하여 승인 또는 반려를 진행해 주시기 바랍니다.
          </p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; width: 120px;">선박명</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${invoice.vesselName} <span style="color:#94a3b8">(RO: ${invoice.orderNo})</span></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; border-top: 1px solid #e2e8f0;">작업 구분</td>
                <td style="padding: 8px 0; color: #0f172a; border-top: 1px solid #e2e8f0;">${invoice.kind || '-'} / ${invoice.category || '-'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; border-top: 1px solid #e2e8f0;">작업 내용</td>
                <td style="padding: 8px 0; color: #0f172a; border-top: 1px solid #e2e8f0;">${invoice.workDescription}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; border-top: 1px solid #e2e8f0;">청구 금액</td>
                <td style="padding: 8px 0; color: #0f172a; border-top: 1px solid #e2e8f0; font-weight: bold; color: #2563eb; font-size: 1.1rem;">
                  ${Number(invoice.actualAmount).toLocaleString()} ${invoice.currency}
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; border-top: 1px solid #e2e8f0;">제출 일자</td>
                <td style="padding: 8px 0; color: #0f172a; border-top: 1px solid #e2e8f0;">${new Date().toLocaleString('ko-KR')}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <div style="display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; cursor:pointer;" onclick="App.closeModal(); App.showToast('info','안내','실제 메일에서는 시스템 로그인 화면으로 이동합니다.')">
              시스템 바로가기 (Click to Review)
            </div>
          </div>
          
          <div style="margin-top: 30px; font-size: 0.8rem; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            이 메일은 Invoice AutoPilot 시스템에서 자동 발송되었습니다. 회신하지 마십시오.<br>
            © 2026 Maritime Invoice Automation System
          </div>
        </div>
      </div>
    `;

    modal.querySelector('.modal-body').innerHTML = `
      <div style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 6px; margin-bottom: 20px; font-size: 0.85rem; color: var(--text-muted); border: 1px solid var(--border-primary);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span><strong>보낸사람 (From):</strong> system@autopilot.com</span>
          <span><strong>받는사람 (To):</strong> <span style="color:var(--text-accent)">supervisor_${invoice.vesselCode?.toLowerCase() || 'vessel'}@company.com</span></span>
        </div>
        <div><strong>제목 (Subject):</strong> [결재 요청] ${invoice.vesselName} 선박 인보이스 승인 요망 (${invoice.id})</div>
      </div>
      <div>${emailHtml}</div>
    `;

    modal.querySelector('.modal-footer').innerHTML = `
      <button class="btn btn-secondary" onclick="App.closeModal()">닫기 (Close)</button>
      <button class="btn btn-primary" onclick="App.showToast('success', '메일 발송됨', 'SMTP 연동 완료 시 진짜 메일로 발송됩니다.'); App.closeModal()">✉️ 실제 메일 발송 시뮬레이션</button>
    `;
    modal.classList.add('active');
  }

  return {
    getNotifications, addNotification, markAsRead, markAllRead,
    getUnreadCount, updateBadge,
    getActivityLog, logActivity,
    togglePanel, renderPanel,
    notifyApproval, notifyReject, notifySubmit, simulateEmailPreview
  };
})();
