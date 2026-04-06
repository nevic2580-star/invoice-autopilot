/* ============================================
   APPROVAL WORKFLOW MODULE
   Supervisor → Team Lead Approval Chain
   ============================================ */

const ApprovalWorkflow = (() => {
  function renderApprovalPage(lang = 'ko') {
    const isKo = lang === 'ko';
    const invoices = Storage.getInvoices();
    const settings = Storage.getSettings();
    const currentUser = settings.currentUser || 'admin';

    // Get pending items
    const pendingSupervisor = invoices.filter(i => i.status === '접수');
    const pendingTeamLead = invoices.filter(i => i.status === '감독확인' || i.status === '감독확인완료');
    const recentlyApproved = invoices.filter(i =>
      i.status === '결재완료' || i.status === '팀장확인' || i.status === '팀장확인완료' || i.status === '지급완료'
    ).slice(0, 10);

    return `
    <div class="page-header">
      <div class="page-title">
        <span class="page-icon">✅</span>
        <div>
          <h1>${isKo ? '결재 관리' : 'Approval Management'}</h1>
          <div class="page-subtitle">${isKo ? '인보이스 결재 대기 및 처리' : 'Invoice approval queue and processing'}</div>
        </div>
      </div>
    </div>

    <div class="page-body">
      <!-- Approval Stats -->
      <div class="stats-grid">
        <div class="stat-card amber animate-in">
          <div class="stat-icon">👤</div>
          <div class="stat-value">${pendingSupervisor.length}</div>
          <div class="stat-label">${isKo ? '감독확인 대기' : 'Awaiting Supervisor'}</div>
        </div>
        <div class="stat-card blue animate-in">
          <div class="stat-icon">👔</div>
          <div class="stat-value">${pendingTeamLead.length}</div>
          <div class="stat-label">${isKo ? '팀장확인 대기' : 'Awaiting Team Lead'}</div>
        </div>
        <div class="stat-card emerald animate-in">
          <div class="stat-icon">✅</div>
          <div class="stat-value">${recentlyApproved.length}</div>
          <div class="stat-label">${isKo ? '최근 결재 완료' : 'Recently Approved'}</div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-nav">
        <button class="tab-item active" data-tab="supervisor">${isKo ? '👤 감독확인 대기' : '👤 Supervisor Queue'} (${pendingSupervisor.length})</button>
        <button class="tab-item" data-tab="teamlead">${isKo ? '👔 팀장확인 대기' : '👔 Team Lead Queue'} (${pendingTeamLead.length})</button>
        <button class="tab-item" data-tab="history">${isKo ? '📝 결재 이력' : '📝 Approval History'}</button>
      </div>

      <!-- Supervisor Queue -->
      <div id="tab-supervisor" class="tab-content active">
        ${pendingSupervisor.length === 0 ? renderEmptyState(isKo ? '감독확인 대기 건이 없습니다' : 'No items awaiting supervisor approval', '✅') : ''}
        ${pendingSupervisor.map(inv => renderApprovalCard(inv, 'supervisor', isKo)).join('')}
      </div>

      <!-- Team Lead Queue -->
      <div id="tab-teamlead" class="tab-content" style="display:none;">
        ${pendingTeamLead.length === 0 ? renderEmptyState(isKo ? '팀장확인 대기 건이 없습니다' : 'No items awaiting team lead approval', '✅') : ''}
        ${pendingTeamLead.map(inv => renderApprovalCard(inv, 'teamlead', isKo)).join('')}
      </div>

      <!-- History -->
      <div id="tab-history" class="tab-content" style="display:none;">
        ${renderApprovalHistory(recentlyApproved, isKo)}
      </div>
    </div>`;
  }

  function renderApprovalCard(invoice, type, isKo) {
    const diff = invoice.actualAmount - invoice.estimatedAmount;
    const diffRate = invoice.estimatedAmount > 0 ? ((diff / invoice.estimatedAmount) * 100).toFixed(1) : 0;
    const diffClass = diff > 0 ? 'diff-positive' : diff < 0 ? 'diff-negative' : 'diff-neutral';
    const isOverBudget = diffRate > 20;

    return `
    <div class="glass-card animate-in" style="margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
        <div style="flex: 1; min-width: 250px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
            <span class="badge badge-kind">${invoice.category || '분류전(Category)'} > ${invoice.kind || '분류전(Kind)'}</span>
            <span class="badge" style="background:rgba(255,255,255,0.05); border: 1px solid var(--border-primary); color:var(--text-primary)">
              <strong>GMS:</strong> ${invoice.gmsCode || '-'} | <strong>GLV:</strong> ${invoice.acctNo || '-'}
            </span>
            ${isOverBudget ? `<span class="badge badge-warning">⚠️ ${isKo ? '견적초과 20%+' : 'Over Budget 20%+'}</span>` : ''}
            ${invoice.isDuplicate ? `<span class="badge badge-duplicate">${isKo ? '중복의심' : 'Duplicate?'}</span>` : ''}
          </div>
          <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 4px;">
            🚢 ${invoice.vesselName} <span style="color: var(--text-tertiary); font-weight: 400;">(${invoice.vesselCode})</span>
          </h3>
          <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 4px;">${isKo ? invoice.workDescriptionKo || invoice.workDescription : invoice.workDescription}</p>
          <p style="font-size: 0.75rem; color: var(--text-muted);">
            ${invoice.id} &nbsp;|&nbsp; R.O: ${invoice.orderNo} &nbsp;|&nbsp; ${invoice.workPort}
          </p>
        </div>
        <div style="text-align: right; min-width: 180px;">
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">${isKo ? '견적' : 'Est.'}: ${CoverGenerator.formatCurrency(invoice.estimatedAmount, invoice.currency)}</div>
          <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 4px;">${CoverGenerator.formatCurrency(invoice.actualAmount, invoice.currency)}</div>
          <div class="${diffClass}" style="font-size: 0.82rem; font-weight: 600;">
            ${diff >= 0 ? '+' : ''}${CoverGenerator.formatCurrency(diff, invoice.currency)} (${diffRate >= 0 ? '+' : ''}${diffRate}%)
          </div>
        </div>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border-primary); flex-wrap: wrap; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 8px; font-size: 0.78rem; color: var(--text-muted);">
          <span>📅 ${invoice.workStartDate} ~ ${invoice.workEndDate}</span>
          <span>|</span>
          <span>${isKo ? '계획' : 'Planned'}: ${invoice.isPlanned ? '✅' : '❌'}</span>
          <span>|</span>
          <span>${isKo ? '운항협의' : 'Ops'}: ${invoice.opsConsulted ? '✅' : '❌'}</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-outline btn-sm" onclick="CoverGenerator.printCover(Storage.getInvoice('${invoice.id}'), App.getLang())" ${(invoice.status === '팀장확인완료' || invoice.status === '결재완료' || invoice.status === '지급완료') ? '' : 'disabled title="팀장 결재 완료 후 출력 가능"'}>
            🖨️ ${isKo ? '커버 출력' : 'Print Cover'}
          </button>
          <button class="btn btn-ghost btn-sm" onclick="App.navigateTo('register', '${invoice.id}')">
            ✏️ ${isKo ? '접수/수정' : 'Edit'}
          </button>
          <button class="btn btn-danger btn-sm" onclick="ApprovalWorkflow.showRejectModal('${invoice.id}', '${type}')">
            ❌ ${isKo ? '반려' : 'Reject'}
          </button>
          <button class="btn btn-success btn-sm" onclick="ApprovalWorkflow.processApproval('${invoice.id}', '${type}', 'approved')">
            ✅ ${type === 'supervisor' ? (isKo ? '감독확인' : 'Supervisor OK') : (isKo ? '팀장확인' : 'Team Lead OK')}
          </button>
        </div>
      </div>
    </div>`;
  }

  function renderApprovalHistory(invoices, isKo) {
    if (!invoices.length) return renderEmptyState(isKo ? '결재 이력이 없습니다' : 'No approval history', '📝');
    return `
    <div class="table-container">
      <table class="data-table">
        <thead><tr>
          <th>ID</th>
          <th>${isKo ? '선박명' : 'Vessel'}</th>
          <th>${isKo ? '작업내역' : 'Work'}</th>
          <th>${isKo ? '금액' : 'Amount'}</th>
          <th>${isKo ? '감독' : 'Supervisor'}</th>
          <th>${isKo ? '팀장' : 'Team Lead'}</th>
          <th>${isKo ? '상태' : 'Status'}</th>
          <th>${isKo ? '액션' : 'Action'}</th>
        </tr></thead>
        <tbody>
        ${invoices.map(inv => `
          <tr>
            <td><span style="color: var(--text-accent); cursor: pointer;" onclick="CoverGenerator.showPreviewModal(Storage.getInvoice('${inv.id}'), App.getLang())">${inv.id}</span></td>
            <td>${inv.vesselName}</td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${isKo ? inv.workDescriptionKo || inv.workDescription : inv.workDescription}</td>
            <td>${CoverGenerator.formatCurrency(inv.actualAmount, inv.currency)}</td>
            <td>
              ${inv.approval?.supervisor?.status === 'approved'
                ? `<span style="color: var(--accent-emerald);">✅ ${inv.approval.supervisor.name}</span>`
                : inv.approval?.supervisor?.status === 'rejected'
                  ? `<span style="color: var(--accent-red);">❌ ${inv.approval.supervisor.name}</span>`
                  : `<span style="color: var(--text-muted);">-</span>`}
            </td>
            <td>
              ${inv.approval?.teamLead?.status === 'approved'
                ? `<span style="color: var(--accent-emerald);">✅ ${inv.approval.teamLead.name}</span>`
                : inv.approval?.teamLead?.status === 'rejected'
                  ? `<span style="color: var(--accent-red);">❌ ${inv.approval.teamLead.name}</span>`
                  : `<span style="color: var(--text-muted);">-</span>`}
            </td>
            <td>${getStatusBadge(inv.status, isKo)}</td>
            <td>
              <button class="btn btn-outline btn-sm" onclick="CoverGenerator.printCover(Storage.getInvoice('${inv.id}'), App.getLang())" ${(inv.status === '팀장확인완료' || inv.status === '결재완료' || inv.status === '지급완료') ? '' : 'disabled title="팀장 결재 완료 후 출력 가능"'}>
                🖨️ ${isKo ? '출력' : 'Print'}
              </button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  }

  function renderEmptyState(msg, icon) {
    return `<div class="empty-state"><div class="empty-icon">${icon}</div><div class="empty-title">${msg}</div></div>`;
  }

  function getStatusBadge(status, isKo) {
    // Define the 4-step flow
    const steps = [
      { key: '접수',       label: '신규접수',   labelEn: 'Received',    color: '#3b82f6' },
      { key: '감독확인완료', label: '감독확인',   labelEn: 'Supervisor',  color: '#f59e0b' },
      { key: '팀장확인완료', label: '팀장승인',   labelEn: 'Team Lead',   color: '#8b5cf6' },
      { key: '지급완료',    label: '지급완료',   labelEn: 'Paid',        color: '#10b981' }
    ];

    // Map status strings to step index (0-based)
    const statusMap = {
      '입력': 0, '접수': 0, '신규접수': 0,
      '감독확인': 1, '감독확인완료': 1,
      '팀장확인': 2, '팀장확인완료': 2, '결재완료': 2,
      '지급완료': 3
    };
    const currentStep = statusMap[status] ?? 0;
    const currentColor = steps[currentStep].color;
    const currentLabel = isKo ? steps[currentStep].label : steps[currentStep].labelEn;

    // Build the mini stepper HTML
    let stepperDots = '';
    for (let i = 0; i < steps.length; i++) {
      const filled = i <= currentStep;
      const dotColor = filled ? steps[i].color : 'rgba(255,255,255,0.15)';
      const dotStyle = filled
        ? `background:${dotColor};box-shadow:0 0 6px ${dotColor}80`
        : `background:${dotColor};border:1px solid rgba(255,255,255,0.2)`;

      stepperDots += `<span class="stepper-dot" style="${dotStyle}" title="${isKo ? steps[i].label : steps[i].labelEn}"></span>`;
      if (i < steps.length - 1) {
        const lineColor = i < currentStep ? steps[i + 1].color : 'rgba(255,255,255,0.1)';
        stepperDots += `<span class="stepper-line" style="background:${lineColor}"></span>`;
      }
    }

    return `
      <div class="status-stepper">
        <div class="stepper-track">${stepperDots}</div>
        <div class="stepper-label" style="color:${currentColor};font-weight:600">${currentLabel}</div>
      </div>`;
  }

  function processApproval(invoiceId, type, result, comment = '') {
    const invoice = Storage.getInvoice(invoiceId);
    if (!invoice) return;

    const currentUser = App.getCurrentUser();
    const approverName = currentUser ? currentUser.name : '시스템';
    const today = new Date().toISOString().slice(0, 10);

    if (type === 'supervisor') {
      invoice.approval = invoice.approval || {};
      invoice.approval.supervisor = {
        name: approverName,
        date: today,
        status: result,
        comment: comment
      };
      invoice.status = result === 'approved' ? '감독확인완료' : '접수';
    } else {
      invoice.approval = invoice.approval || {};
      invoice.approval.teamLead = {
        name: approverName,
        date: today,
        status: result,
        comment: comment
      };
      if (result === 'approved') {
        invoice.status = '팀장확인완료';
      } else {
        // Reject: reset to 접수
        invoice.status = '접수';
        invoice.approval.supervisor = { name: null, date: null, status: 'pending', comment: '' };
      }
    }

    Storage.updateInvoice(invoiceId, invoice);
    const lang = App.getLang();
    const isKo = lang === 'ko';

    // Dispatch notifications
    if (typeof NotificationCenter !== 'undefined') {
      const stageName = type === 'supervisor' ? '감독확인' : '팀장확인';
      if (result === 'approved') {
        NotificationCenter.notifyApproval(invoiceId, approverName, stageName);
      } else {
        NotificationCenter.notifyReject(invoiceId, approverName, stageName, comment);
      }
    }

    if (result === 'approved') {
      App.showToast('success',
        isKo ? '결재 완료' : 'Approved',
        isKo ? `${invoiceId} 결재가 완료되었습니다.` : `${invoiceId} has been approved.`);
    } else {
      App.showToast('warning',
        isKo ? '반려 처리' : 'Rejected',
        isKo ? `${invoiceId} 반려 처리되었습니다.` : `${invoiceId} has been rejected.`);
    }

    App.navigateTo('approval');
  }

  function showRejectModal(invoiceId, type) {
    const lang = App.getLang();
    const isKo = lang === 'ko';
    const modal = document.getElementById('modal-overlay');
    if (!modal) return;

    modal.querySelector('.modal').className = 'modal';
    modal.querySelector('.modal-header h2').textContent = isKo ? '❌ 반려 사유 입력' : '❌ Enter Rejection Reason';
    modal.querySelector('.modal-body').innerHTML = `
      <div class="form-group">
        <label class="form-label">${isKo ? '반려 사유' : 'Rejection Reason'} <span class="required">*</span></label>
        <textarea class="form-textarea" id="rejectComment" rows="4" placeholder="${isKo ? '반려 사유를 입력해주세요...' : 'Enter rejection reason...'}"></textarea>
      </div>
    `;
    modal.querySelector('.modal-footer').innerHTML = `
      <button class="btn btn-secondary" onclick="App.closeModal()">${isKo ? '취소' : 'Cancel'}</button>
      <button class="btn btn-danger" onclick="ApprovalWorkflow.confirmReject('${invoiceId}', '${type}')">
        ❌ ${isKo ? '반려 확인' : 'Confirm Reject'}
      </button>
    `;
    modal.classList.add('active');
  }

  function confirmReject(invoiceId, type) {
    const comment = document.getElementById('rejectComment')?.value || '';
    if (!comment.trim()) {
      const isKo = App.getLang() === 'ko';
      App.showToast('error',
        isKo ? '입력 필요' : 'Required',
        isKo ? '반려 사유를 입력해주세요.' : 'Please enter rejection reason.');
      return;
    }
    App.closeModal();
    processApproval(invoiceId, type, 'rejected', comment);
  }

  function initTabEvents() {
    document.querySelectorAll('.tab-item[data-tab]').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab-item[data-tab]').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
        tab.classList.add('active');
        const target = document.getElementById('tab-' + tab.dataset.tab);
        if (target) target.style.display = 'block';
      });
    });
  }

  return {
    renderApprovalPage,
    processApproval,
    showRejectModal,
    confirmReject,
    initTabEvents,
    getStatusBadge
  };
})();
