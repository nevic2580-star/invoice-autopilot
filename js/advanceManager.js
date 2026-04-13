const AdvanceManager = (() => {
  let selectedMonth = '';
  let checkedInvoiceIds = new Set();
  let exchangeRates = { KRW: 1350, EUR: 1.08, JPY: 150, SGD: 1.35 };
  let sortField = 'createdAt';
  let sortDir = 'desc';
  let supDateFrom = '';
  let supDateTo = '';

  function refreshView() {
    const main = document.getElementById('mainContent');
    if (!main) return;
    const windowScrollTop = window.scrollY || document.documentElement.scrollTop;
    main.innerHTML = renderAdvancePage(typeof App !== 'undefined' ? App.getLang() : 'ko');
    window.scrollTo(0, windowScrollTop);
  }

  function toggleSort(field) {
    if (sortField === field) { sortDir = sortDir === 'asc' ? 'desc' : 'asc'; }
    else { sortField = field; sortDir = 'asc'; }
    refreshView();
  }

  function updateRate(currency, value) {
    if (value && !isNaN(value)) { exchangeRates[currency] = Number(value); refreshView(); }
  }

  function setSupDateFrom(val) { supDateFrom = val; refreshView(); }
  function setSupDateTo(val)   { supDateTo = val;   refreshView(); }
  function clearSupFilter()    { supDateFrom = ''; supDateTo = ''; refreshView(); }

  function getUsdAmount(inv) {
    if (inv.manualUsdAmount != null) return inv.manualUsdAmount;
    const baseAmt = inv.actualAmount || inv.estimatedAmount;
    if (inv.currency === 'USD') return baseAmt;
    if (inv.currency === 'KRW') return baseAmt / (exchangeRates.KRW || 1350);
    if (inv.currency === 'EUR') return baseAmt * (exchangeRates.EUR || 1.08);
    if (inv.currency === 'JPY') return baseAmt / (exchangeRates.JPY || 150);
    if (inv.currency === 'SGD') return baseAmt / (exchangeRates.SGD || 1.35);
    return 0;
  }

  function updateManualUsd(id, value) {
    const inv = Storage.getInvoice(id);
    if (inv) {
      if (value === '') { delete inv.manualUsdAmount; }
      else { inv.manualUsdAmount = Number(value); }
      Storage.updateInvoice(id, inv);
      refreshView();
    }
  }

  function renderAdvancePage(lang = 'ko') {
    const isKo = lang === 'ko', t = (k, e) => isKo ? k : e;

    let invoices = Storage.getInvoices().filter(i => i.status !== '입력');
    if (selectedMonth) invoices = invoices.filter(i => i.createdAt && i.createdAt.startsWith(selectedMonth));
    if (supDateFrom) invoices = invoices.filter(i => { const d = i.approval?.supervisor?.date || ''; return d >= supDateFrom; });
    if (supDateTo)   invoices = invoices.filter(i => { const d = i.approval?.supervisor?.date || ''; return d && d <= supDateTo; });

    invoices.sort((a, b) => {
      let valA = a[sortField] || '', valB = b[sortField] || '';
      if (sortField === 'usdAmount') { valA = getUsdAmount(a); valB = getUsdAmount(b); }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    const vesselGroup = {}, accountGroup = {}, categoryGroup = {}, kindGroup = {};
    let grandTotal = 0;

    invoices.forEach(inv => {
      if (!checkedInvoiceIds.has(inv.id)) return;
      const usdAmt = getUsdAmount(inv);

      if (!vesselGroup[inv.vesselName]) vesselGroup[inv.vesselName] = { count: 0, amount: 0 };
      vesselGroup[inv.vesselName].count++; vesselGroup[inv.vesselName].amount += usdAmt;

      let acctLabel = '분류전';
      if (inv.acctNo) {
        const accObj = Storage.getAccounts().find(a => a.code === inv.acctNo);
        const name = accObj ? (isKo ? accObj.nameKo : accObj.name) : '';
        acctLabel = name && name !== inv.acctNo ? `${inv.acctNo} (${name})` : inv.acctNo;
      }
      if (!accountGroup[acctLabel]) accountGroup[acctLabel] = { count: 0, amount: 0 };
      accountGroup[acctLabel].count++; accountGroup[acctLabel].amount += usdAmt;

      const cat = inv.category || '기타';
      if (!categoryGroup[cat]) categoryGroup[cat] = { count: 0, amount: 0 };
      categoryGroup[cat].count++; categoryGroup[cat].amount += usdAmt;

      let kindLabel = '미분류';
      if (inv.kind) {
        const kindObj = Storage.getKinds().find(k => k.id === inv.kind || k.name === inv.kind);
        const name = kindObj ? (isKo ? kindObj.nameKo : kindObj.name) : inv.kind;
        kindLabel = name && name !== inv.kind ? `${inv.kind} (${name})` : inv.kind;
      }
      if (!kindGroup[kindLabel]) kindGroup[kindLabel] = { count: 0, amount: 0 };
      kindGroup[kindLabel].count++; kindGroup[kindLabel].amount += usdAmt;

      grandTotal += usdAmt;
    });

    const sortIcon = (f) => sortField === f ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

    const renderSummaryGroup = (group) => {
      const entries = Object.entries(group).sort();
      if (!entries.length) return `<div style="color:var(--text-muted);font-size:0.8rem;padding:6px 0;">${t('선택 없음', 'None')}</div>`;
      return entries.map(([k, v]) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05);gap:8px;">
          <span style="font-size:0.8rem;color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${k}">
            ${k} <span style="color:var(--text-muted);font-size:0.75rem;">(${v.count})</span>
          </span>
          <span style="font-size:0.82rem;font-weight:700;color:var(--primary-color);white-space:nowrap;">$${CoverGenerator.formatCurrency(v.amount, 'USD')}</span>
        </div>`).join('');
    };

    const hasFilter = supDateFrom || supDateTo;

    return `
    <div class="page-header">
      <div class="page-title"><span class="page-icon">🧾</span><div>
        <h1>${t('선급금 청구서 관리', 'Advance Payment Request')}</h1>
        <div class="page-subtitle">${t('청구 대상 인보이스 집계 및 USD 환산', 'Aggregate invoices and convert to USD')}</div>
      </div></div>
      <div class="page-actions" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <div style="background:var(--card-bg);padding:5px 10px;border-radius:6px;display:flex;gap:10px;border:1px solid var(--border-color);flex-wrap:wrap;align-items:center;">
          <div style="font-size:0.78rem;display:flex;align-items:center;gap:4px;"><label style="color:var(--text-muted);">KRW/USD</label><input type="number" class="form-input" style="width:70px;padding:2px;font-size:0.82rem;" value="${exchangeRates.KRW}" onchange="AdvanceManager.updateRate('KRW', this.value)"></div>
          <div style="font-size:0.78rem;display:flex;align-items:center;gap:4px;"><label style="color:var(--text-muted);">EUR/USD</label><input type="number" class="form-input" style="width:58px;padding:2px;font-size:0.82rem;" step="0.01" value="${exchangeRates.EUR}" onchange="AdvanceManager.updateRate('EUR', this.value)"></div>
          <div style="font-size:0.78rem;display:flex;align-items:center;gap:4px;"><label style="color:var(--text-muted);">JPY/USD</label><input type="number" class="form-input" style="width:58px;padding:2px;font-size:0.82rem;" value="${exchangeRates.JPY}" onchange="AdvanceManager.updateRate('JPY', this.value)"></div>
          <div style="font-size:0.78rem;display:flex;align-items:center;gap:4px;"><label style="color:var(--text-muted);">SGD/USD</label><input type="number" class="form-input" style="width:58px;padding:2px;font-size:0.82rem;" step="0.01" value="${exchangeRates.SGD}" onchange="AdvanceManager.updateRate('SGD', this.value)"></div>
        </div>
        <button class="btn btn-ghost" onclick="AdvanceManager.exportExcel()">📥 Excel</button>
        <button class="btn btn-primary" onclick="AdvanceManager.printSummary()">🖨️ ${t('인쇄', 'Print')}</button>
      </div>
    </div>

    <div class="page-body">

      <!-- ── Filter Bar ─────────────────────────────── -->
      <div class="glass-card" style="padding:12px 16px;margin-bottom:14px;">
        <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;">

          <!-- 등록월 -->
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:0.8rem;color:var(--text-muted);white-space:nowrap;">📅 ${t('등록월', 'Month')}</span>
            <input type="month" class="form-input" style="width:130px;padding:4px 8px;" value="${selectedMonth}" onchange="AdvanceManager.onMonthChange(this.value)">
            <button class="btn btn-ghost btn-sm" onclick="AdvanceManager.onMonthChange('')" title="${t('전체 기간', 'All time')}">🔄</button>
          </div>

          <div style="width:1px;height:26px;background:var(--border-color);flex-shrink:0;"></div>

          <!-- 감독 컨펌일 기간 -->
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="font-size:0.8rem;color:var(--text-muted);white-space:nowrap;">✅ ${t('감독 컨펌일', 'Sup. Confirm Date')}</span>
            <input type="date" class="form-input" style="width:138px;padding:4px 8px;" value="${supDateFrom}" onchange="AdvanceManager.setSupDateFrom(this.value)">
            <span style="color:var(--text-muted);font-size:0.85rem;">~</span>
            <input type="date" class="form-input" style="width:138px;padding:4px 8px;" value="${supDateTo}" onchange="AdvanceManager.setSupDateTo(this.value)">
            ${hasFilter ? `<button class="btn btn-ghost btn-sm" onclick="AdvanceManager.clearSupFilter()" title="${t('초기화', 'Clear')}">✕ ${t('초기화', 'Clear')}</button>` : ''}
          </div>

          <!-- 선택 버튼 -->
          <div style="margin-left:auto;display:flex;gap:8px;flex-shrink:0;">
            <button class="btn btn-secondary btn-sm" onclick="AdvanceManager.selectAll(true)">${t('전체 선택', 'Select All')}</button>
            <button class="btn btn-ghost btn-sm" onclick="AdvanceManager.selectAll(false)">${t('선택 해제', 'Deselect')}</button>
          </div>
        </div>
      </div>

      <!-- ── Main Table ──────────────────────────────── -->
      <div class="glass-card" style="padding:0;margin-bottom:16px;">
        <div class="table-container" style="overflow-x:auto;">
          <table class="data-table" style="min-width:1200px;">
            <thead>
              <tr>
                <th width="40" style="text-align:center;"><input type="checkbox" onchange="AdvanceManager.selectAll(this.checked)"></th>
                <th style="white-space:nowrap;cursor:pointer;" onclick="AdvanceManager.toggleSort('status')">${t('상태', 'Status')}${sortIcon('status')}</th>
                <th style="white-space:nowrap;cursor:pointer;" onclick="AdvanceManager.toggleSort('vesselName')">${t('선박명', 'Vessel')}${sortIcon('vesselName')}</th>
                <th style="white-space:nowrap;cursor:pointer;" onclick="AdvanceManager.toggleSort('vendorName')">${t('업체명', 'Vendor')}${sortIcon('vendorName')}</th>
                <th style="white-space:nowrap;cursor:pointer;" onclick="AdvanceManager.toggleSort('category')">${t('비용구분', 'Cost Cat.')}${sortIcon('category')}</th>
                <th style="white-space:nowrap;cursor:pointer;" onclick="AdvanceManager.toggleSort('kind')">${t('기기분류', 'Eq Cat.')}${sortIcon('kind')}</th>
                <th style="white-space:nowrap;">${t('작업내용', 'Work Desc.')}</th>
                <th style="white-space:nowrap;text-align:center;">${t('계획', 'Plan')}</th>
                <th style="white-space:nowrap;text-align:center;">${t('운항협의', 'Ops')}</th>
                <th style="white-space:nowrap;text-align:center;">${t('감독컨펌일', 'Sup.Date')}</th>
                <th style="white-space:nowrap;cursor:pointer;" onclick="AdvanceManager.toggleSort('estimatedAmount')">${t('원본금액', 'Orig.Amt')}${sortIcon('estimatedAmount')}</th>
                <th style="white-space:nowrap;cursor:pointer;" onclick="AdvanceManager.toggleSort('usdAmount')">${t('USD 금액', 'USD Amt')}${sortIcon('usdAmount')}</th>
              </tr>
            </thead>
            <tbody>
              ${invoices.length === 0
                ? `<tr><td colspan="12" style="text-align:center;padding:32px;color:var(--text-muted);">${t('조회된 데이터가 없습니다.', 'No data found.')}</td></tr>`
                : invoices.map(inv => {
                    const amt = inv.actualAmount || inv.estimatedAmount;
                    const usd = getUsdAmount(inv);
                    const statusClass = ['입력','제출완료','접수'].includes(inv.status) ? 'pending' : 'approved';
                    const supDate = inv.approval?.supervisor?.date || '';
                    const supName = inv.approval?.supervisor?.name || '';
                    const supCell = supDate
                      ? `<div style="font-size:0.8rem;font-weight:600;color:var(--accent-green)">${supDate}</div><div style="font-size:0.72rem;color:var(--text-muted)">${supName}</div>`
                      : `<span style="color:var(--text-muted);font-size:0.8rem">-</span>`;
                    const workDesc = inv.workDescriptionKo || inv.workDescription || '-';
                    const planned = inv.isPlanned ? '✅' : '<span style="color:var(--text-muted)">❌</span>';
                    const ops = inv.opsConsulted ? '✅' : '<span style="color:var(--text-muted)">❌</span>';
                    return `
                    <tr>
                      <td style="text-align:center;"><input type="checkbox" class="adv-checkbox" value="${inv.id}" ${checkedInvoiceIds.has(inv.id) ? 'checked' : ''} onchange="AdvanceManager.toggleCheck('${inv.id}', this.checked)"></td>
                      <td><span class="badge badge-status-${statusClass}">${inv.status}</span></td>
                      <td style="font-weight:600;">${inv.vesselName}</td>
                      <td>${inv.vendorName || '-'}</td>
                      <td>${inv.category || '-'}</td>
                      <td>${inv.kind || '-'}</td>
                      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.85rem;" title="${workDesc}">${workDesc}</td>
                      <td style="text-align:center;">${planned}</td>
                      <td style="text-align:center;">${ops}</td>
                      <td style="text-align:center;min-width:88px;">${supCell}</td>
                      <td style="color:var(--text-secondary);font-size:0.9rem;">${inv.currency} ${CoverGenerator.formatCurrency(amt, inv.currency)}</td>
                      <td>
                        <div style="display:flex;align-items:center;">
                          <span style="font-weight:600;margin-right:4px;">$</span>
                          <input type="number" class="form-input" style="width:100px;text-align:right;padding:2px 6px;" value="${usd.toFixed(2)}" onchange="AdvanceManager.updateManualUsd('${inv.id}', this.value)">
                        </div>
                      </td>
                    </tr>`;
                  }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── Compact Summary (bottom) ──────────────────── -->
      ${checkedInvoiceIds.size > 0 ? `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:8px;">
        <div class="glass-card" style="padding:12px 14px;">
          <div style="font-size:0.73rem;font-weight:700;color:var(--text-muted);margin-bottom:7px;letter-spacing:0.05em;text-transform:uppercase;">🚢 ${t('선박별', 'By Vessel')}</div>
          ${renderSummaryGroup(vesselGroup)}
        </div>
        <div class="glass-card" style="padding:12px 14px;">
          <div style="font-size:0.73rem;font-weight:700;color:var(--text-muted);margin-bottom:7px;letter-spacing:0.05em;text-transform:uppercase;">💳 ${t('계정(GLV)별', 'By Account')}</div>
          ${renderSummaryGroup(accountGroup)}
        </div>
        <div class="glass-card" style="padding:12px 14px;">
          <div style="font-size:0.73rem;font-weight:700;color:var(--text-muted);margin-bottom:7px;letter-spacing:0.05em;text-transform:uppercase;">📂 ${t('비용구분별', 'By Cost')}</div>
          ${renderSummaryGroup(categoryGroup)}
        </div>
        <div class="glass-card" style="padding:12px 14px;">
          <div style="font-size:0.73rem;font-weight:700;color:var(--text-muted);margin-bottom:7px;letter-spacing:0.05em;text-transform:uppercase;">🔧 ${t('기기분류별', 'By Eq Cat.')}</div>
          ${renderSummaryGroup(kindGroup)}
        </div>
      </div>
      <div class="glass-card" style="padding:14px 20px;background:rgba(0,123,255,0.08);border:2px solid var(--primary-color);display:flex;align-items:center;justify-content:space-between;">
        <div style="font-weight:800;font-size:1rem;color:var(--text-primary);">
          💰 Total Advance Request
          <span style="font-size:0.82rem;font-weight:400;color:var(--text-muted);margin-left:8px;">${t(`${checkedInvoiceIds.size}건 선택`, `${checkedInvoiceIds.size} selected`)}</span>
        </div>
        <div style="font-weight:800;font-size:1.25rem;color:var(--primary-color);">$ ${CoverGenerator.formatCurrency(grandTotal, 'USD')}</div>
      </div>`
      : `<div class="glass-card" style="padding:14px 20px;text-align:center;color:var(--text-muted);font-size:0.9rem;">
          ${t('인보이스를 선택하면 하단에 집계 요약이 표시됩니다.', 'Select invoices to see the summary below.')}
        </div>`}

    </div>`;
  }

  function onMonthChange(val) { selectedMonth = val; refreshView(); }

  function toggleCheck(id, isChecked) {
    if (isChecked) checkedInvoiceIds.add(id);
    else checkedInvoiceIds.delete(id);
    refreshView();
  }

  function selectAll(isChecked) {
    let invoices = Storage.getInvoices().filter(i => i.status !== '입력');
    if (selectedMonth) invoices = invoices.filter(i => i.createdAt && i.createdAt.startsWith(selectedMonth));
    if (isChecked) invoices.forEach(i => checkedInvoiceIds.add(i.id));
    else invoices.forEach(i => checkedInvoiceIds.delete(i.id));
    refreshView();
  }

  function printSummary() {
    if (checkedInvoiceIds.size === 0) { alert(App.getLang() === 'ko' ? '먼저 인보이스를 선택하세요.' : 'Select invoices first.'); return; }
    window.print();
  }

  function exportExcel() {
    if (checkedInvoiceIds.size === 0) { alert(App.getLang() === 'ko' ? '먼저 인보이스를 선택하세요.' : 'Select invoices first.'); return; }
    let invoices = Storage.getInvoices().filter(i => i.status !== '입력');
    if (selectedMonth) invoices = invoices.filter(i => i.createdAt && i.createdAt.startsWith(selectedMonth));

    const vesselGroup = {}, accountGroup = {}, categoryGroup = {}, kindGroup = {};
    let grandTotal = 0;
    const isKo = App.getLang() === 'ko';

    invoices.forEach(inv => {
      if (!checkedInvoiceIds.has(inv.id)) return;
      const usdAmt = getUsdAmount(inv);

      if (!vesselGroup[inv.vesselName]) vesselGroup[inv.vesselName] = { count: 0, amount: 0 };
      vesselGroup[inv.vesselName].count++; vesselGroup[inv.vesselName].amount += usdAmt;

      let acctLabel = '분류전(Uncategorized)';
      if (inv.acctNo) {
        const accObj = Storage.getAccounts().find(a => a.code === inv.acctNo);
        const name = accObj ? (isKo ? accObj.nameKo : accObj.name) : '';
        acctLabel = name && name !== inv.acctNo ? `${inv.acctNo} (${name})` : inv.acctNo;
      }
      if (!accountGroup[acctLabel]) accountGroup[acctLabel] = { count: 0, amount: 0 };
      accountGroup[acctLabel].count++; accountGroup[acctLabel].amount += usdAmt;

      const cat = inv.category || '기타';
      if (!categoryGroup[cat]) categoryGroup[cat] = { count: 0, amount: 0 };
      categoryGroup[cat].count++; categoryGroup[cat].amount += usdAmt;

      let kindLabel = '미분류(Uncategorized)';
      if (inv.kind) {
        const kindObj = Storage.getKinds().find(k => k.id === inv.kind || k.name === inv.kind);
        const name = kindObj ? (isKo ? kindObj.nameKo : kindObj.name) : inv.kind;
        kindLabel = name && name !== inv.kind ? `${inv.kind} (${name})` : inv.kind;
      }
      if (!kindGroup[kindLabel]) kindGroup[kindLabel] = { count: 0, amount: 0 };
      kindGroup[kindLabel].count++; kindGroup[kindLabel].amount += usdAmt;

      grandTotal += usdAmt;
    });

    if (typeof ExcelExporter !== 'undefined') {
      ExcelExporter.exportAdvancePayment(
        vesselGroup, accountGroup, categoryGroup, kindGroup, grandTotal,
        selectedMonth || '전체기간',
        invoices.filter(i => checkedInvoiceIds.has(i.id)).map(i => ({ ...i, usdAmount: getUsdAmount(i) }))
      );
    }
  }

  return {
    renderAdvancePage, onMonthChange, clearSupFilter, setSupDateFrom, setSupDateTo,
    toggleCheck, selectAll, printSummary, exportExcel, updateRate, updateManualUsd,
    getUsdAmount, exchangeRates, toggleSort
  };
})();
