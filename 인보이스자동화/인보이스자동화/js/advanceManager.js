const AdvanceManager = (() => {
  let selectedMonth = ''; // Default to "All Time" to match Approval page
  let checkedInvoiceIds = new Set();
  let exchangeRates = { KRW: 1350, EUR: 1.08, JPY: 150, SGD: 1.35 };
  
  let sortField = 'createdAt';
  let sortDir = 'desc';

  function toggleSort(field) {
    if (sortField === field) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortDir = 'asc';
    }
    App.navigateTo('advance');
  }

  function updateRate(currency, value) {
    if (value && !isNaN(value)) {
      exchangeRates[currency] = Number(value);
      App.navigateTo('advance');
    }
  }

  function getUsdAmount(inv) {
    if (inv.manualUsdAmount != null) return inv.manualUsdAmount;
    const baseAmt = inv.actualAmount || inv.estimatedAmount;
    if (inv.currency === 'USD') return baseAmt;
    if (inv.currency === 'KRW') return baseAmt / (exchangeRates.KRW || 1350);
    if (inv.currency === 'EUR') return baseAmt * (exchangeRates.EUR || 1.08);
    if (inv.currency === 'JPY') return baseAmt / (exchangeRates.JPY || 150);
    if (inv.currency === 'SGD') return baseAmt / (exchangeRates.SGD || 1.35);
    // Unknown currency -> default to 0 if manual not set
    return 0; 
  }

  function updateManualUsd(id, value) {
    const inv = Storage.getInvoice(id);
    if (inv) {
      if (value === '') {
        delete inv.manualUsdAmount;
      } else {
        inv.manualUsdAmount = Number(value);
      }
      Storage.updateInvoice(id, inv);
      App.navigateTo('advance'); // re-render to update sums
    }
  }

  function renderAdvancePage(lang='ko') {
    const isKo = lang==='ko', t=(k,e)=>isKo?k:e;
    
    // Allow empty selectedMonth for "All Time"
    let invoices = Storage.getInvoices().filter(i => i.status !== '입력');
    if (selectedMonth) {
      invoices = invoices.filter(i => i.createdAt && i.createdAt.startsWith(selectedMonth));
    }
    
    invoices.sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';
      if (sortField === 'usdAmount') {
        valA = getUsdAmount(a);
        valB = getUsdAmount(b);
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
      
    // Pre-calculate grouping for the selected box
    const vesselGroup = {};
    const accountGroup = {};
    const categoryGroup = {};
    const kindGroup = {};
    let grandTotal = 0;
    
    invoices.forEach(inv => {
      if(checkedInvoiceIds.has(inv.id)) {
        const usdAmt = getUsdAmount(inv);
        // By Vessel
        if(!vesselGroup[inv.vesselName]) vesselGroup[inv.vesselName] = { count: 0, amount: 0 };
        vesselGroup[inv.vesselName].count++;
        vesselGroup[inv.vesselName].amount += usdAmt;
        
        // By Account (GLV)
        let acctLabel = '분류전(Uncategorized)';
        if (inv.acctNo) {
          const accObj = Storage.getAccounts().find(a => a.code === inv.acctNo);
          const name = accObj ? (isKo ? accObj.nameKo : accObj.name) : '';
          acctLabel = name && name !== inv.acctNo ? `${inv.acctNo} (${name})` : inv.acctNo;
        }
        
        if(!accountGroup[acctLabel]) accountGroup[acctLabel] = { count: 0, amount: 0 };
        accountGroup[acctLabel].count++;
        accountGroup[acctLabel].amount += usdAmt;

        // By Category (Cost Type)
        const cat = inv.category || '기타';
        if(!categoryGroup[cat]) categoryGroup[cat] = { count: 0, amount: 0 };
        categoryGroup[cat].count++;
        categoryGroup[cat].amount += usdAmt;

        // By Kind (Eq Category)
        let kindLabel = '미분류(Uncategorized)';
        if (inv.kind) {
          const kindObj = Storage.getKinds().find(k => k.id === inv.kind || k.name === inv.kind);
          const name = kindObj ? (isKo ? kindObj.nameKo : kindObj.name) : inv.kind;
          kindLabel = name && name !== inv.kind ? `${inv.kind} (${name})` : inv.kind;
        }
        if(!kindGroup[kindLabel]) kindGroup[kindLabel] = { count: 0, amount: 0 };
        kindGroup[kindLabel].count++;
        kindGroup[kindLabel].amount += usdAmt;

        grandTotal += usdAmt;
      }
    });

    const sortIcon = (field) => sortField === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';
    return `
    <div class="page-header">
      <div class="page-title"><span class="page-icon">🧾</span><div>
        <h1>${t('선급금 청구서 관리','Advance Payment Request')}</h1>
        <div class="page-subtitle">${t('청구 대상 인보이스 집계 및 USD 환산','Aggregate invoices and convert to USD')}</div>
      </div></div>
      <div class="page-actions" style="display:flex;gap:10px;align-items:center;">
        <div style="background:var(--card-bg);padding:6px 12px;border-radius:6px;display:flex;gap:10px;border:1px solid var(--border-color);">
          <div style="font-size:0.8rem;">
            <label style="color:var(--text-muted);margin-right:2px;">KRW/USD</label>
            <input type="number" class="form-input" style="width:70px;padding:2px;font-size:0.85rem;" value="${exchangeRates.KRW}" onchange="AdvanceManager.updateRate('KRW', this.value)">
          </div>
          <div style="font-size:0.8rem;">
            <label style="color:var(--text-muted);margin-right:2px;">EUR/USD</label>
            <input type="number" class="form-input" style="width:60px;padding:2px;font-size:0.85rem;" step="0.01" value="${exchangeRates.EUR}" onchange="AdvanceManager.updateRate('EUR', this.value)">
          </div>
          <div style="font-size:0.8rem;">
            <label style="color:var(--text-muted);margin-right:2px;">JPY/USD</label>
            <input type="number" class="form-input" style="width:60px;padding:2px;font-size:0.85rem;" value="${exchangeRates.JPY}" onchange="AdvanceManager.updateRate('JPY', this.value)">
          </div>
          <div style="font-size:0.8rem;">
            <label style="color:var(--text-muted);margin-right:2px;">SGD/USD</label>
            <input type="number" class="form-input" style="width:60px;padding:2px;font-size:0.85rem;" step="0.01" value="${exchangeRates.SGD}" onchange="AdvanceManager.updateRate('SGD', this.value)">
          </div>
        </div>
        <input type="month" class="form-input" style="width:130px" value="${selectedMonth}" onchange="AdvanceManager.onMonthChange(this.value)">
        <button class="btn btn-ghost" onclick="AdvanceManager.onMonthChange('')" title="전체 기간 보기">🔄 ${t('전체','All')}</button>
        <button class="btn btn-ghost" onclick="AdvanceManager.exportExcel()">📥 ${t('Excel 다운로드','Excel Export')}</button>
        <button class="btn btn-primary" onclick="AdvanceManager.printSummary()">${t('🖨️ 인쇄','Print')}</button>
      </div>
    </div>
    <div class="page-body">
      <div class="split-view">
        <div class="split-view-left" style="flex:2; overflow-y:auto; padding:10px;">
          <h3 style="margin-bottom:10px">${t('대상 인보이스 선택','Select Invoices')}</h3>
          <div style="margin-bottom:10px">
            <button class="btn btn-secondary btn-sm" onclick="AdvanceManager.selectAll(true)">${t('전체 선택','Select All')}</button>
            <button class="btn btn-ghost btn-sm" onclick="AdvanceManager.selectAll(false)">${t('선택 해제','Deselect All')}</button>
          </div>
          <div class="table-container" style="overflow-x:auto;">
            <table class="data-table" style="min-width:850px;">
              <thead>
                <tr>
                  <th width="40" style="text-align:center"><input type="checkbox" onchange="AdvanceManager.selectAll(this.checked)"></th>
                  <th style="white-space:nowrap;cursor:pointer;" onclick="AdvanceManager.toggleSort('status')">${t('선급/상태','Status')}${sortIcon('status')}</th>
                  <th style="white-space:nowrap;cursor:pointer;" onclick="AdvanceManager.toggleSort('vesselName')">${t('선박명','Vessel')}${sortIcon('vesselName')}</th>
                  <th style="white-space:nowrap;cursor:pointer;" onclick="AdvanceManager.toggleSort('vendorName')">${t('업체명','Vendor')}${sortIcon('vendorName')}</th>
                  <th style="white-space:nowrap;cursor:pointer;" onclick="AdvanceManager.toggleSort('category')">${t('비용구분','Cost Cat.')}${sortIcon('category')}</th>
                  <th style="white-space:nowrap;cursor:pointer;" onclick="AdvanceManager.toggleSort('kind')">${t('기기분류','Eq Cat.')}${sortIcon('kind')}</th>
                  <th style="white-space:nowrap;cursor:pointer;" onclick="AdvanceManager.toggleSort('estimatedAmount')">${t('원본 통화 금액','Orig. Amt')}${sortIcon('estimatedAmount')}</th>
                  <th style="white-space:nowrap;cursor:pointer;" onclick="AdvanceManager.toggleSort('usdAmount')">${t('USD 변환 금액','USD Amt')}${sortIcon('usdAmount')}</th>
                </tr>
              </thead>
              <tbody>
                ${invoices.length === 0 ? `<tr><td colspan="6" align="center">${t('조회된 데이터가 없습니다.','No data found.')}</td></tr>` : ''}
                ${invoices.map(inv => {
                  const amt = inv.actualAmount || inv.estimatedAmount;
                  const usd = getUsdAmount(inv);
                  const statusClass = (inv.status==='입력'||inv.status==='제출완료'||inv.status==='접수') ? 'pending' : 'approved';
                  return `
                  <tr>
                    <td style="text-align:center"><input type="checkbox" class="adv-checkbox" value="${inv.id}" ${checkedInvoiceIds.has(inv.id)?'checked':''} onchange="AdvanceManager.toggleCheck('${inv.id}', this.checked)"></td>
                    <td><span class="badge badge-status-${statusClass}">${inv.status}</span></td>
                    <td style="font-weight:600">${inv.vesselName}</td>
                    <td>${inv.vendorName || '-'}</td>
                    <td>${inv.category || '-'}</td>
                    <td>${inv.kind || '-'}</td>
                    <td style="color:var(--text-secondary);font-size:0.9rem;">${inv.currency} ${CoverGenerator.formatCurrency(amt, inv.currency)}</td>
                    <td>
                      <div style="display:flex;align-items:center;">
                        <span style="font-weight:600;margin-right:6px;">$</span>
                        <input type="number" class="form-input" style="width:100px;text-align:right;padding:2px 6px;" value="${usd.toFixed(2)}" onchange="AdvanceManager.updateManualUsd('${inv.id}', this.value)">
                      </div>
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="split-view-right" style="flex:1; padding:10px; display:flex; flex-direction:column; gap:20px;">
          
          <div>
            <h3 style="margin-bottom:10px">📊 ${t('선박별 집계','Summary by Vessel')}</h3>
            <div class="glass-card">
              ${Object.keys(vesselGroup).length === 0 ? 
                `<div style="text-align:center;color:var(--text-muted);padding:20px 0;">${t('선택된 인보이스가 없습니다.','No invoices selected.')}</div>` 
                :
                Object.keys(vesselGroup).sort().map(v => `
                  <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid var(--border-color)">
                    <div style="font-weight:600">${v} <span style="font-weight:normal; font-size:0.85em; color:var(--text-muted)">(${vesselGroup[v].count}건)</span></div>
                    <div style="font-weight:700; color:var(--primary-color)">$ ${CoverGenerator.formatCurrency(vesselGroup[v].amount, 'USD')}</div>
                  </div>
                `).join('')
              }
            </div>
          </div>

          <div>
            <h3 style="margin-bottom:10px">📊 ${t('계정(GLV)별 집계','Summary by Account')}</h3>
            <div class="glass-card">
              ${Object.keys(accountGroup).length === 0 ? 
                `<div style="text-align:center;color:var(--text-muted);padding:20px 0;">${t('선택된 인보이스가 없습니다.','No invoices selected.')}</div>` 
                :
                Object.keys(accountGroup).sort().map(a => `
                  <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid var(--border-color)">
                    <div style="font-weight:600">${a} <span style="font-weight:normal; font-size:0.85em; color:var(--text-muted)">(${accountGroup[a].count}건)</span></div>
                    <div style="font-weight:700; color:var(--primary-color)">$ ${CoverGenerator.formatCurrency(accountGroup[a].amount, 'USD')}</div>
                  </div>
                `).join('')
              }
            </div>
          </div>

          <div>
            <h3 style="margin-bottom:10px">📊 ${t('비용 구분(Cost Cat.)별 집계','Summary by Cost Category')}</h3>
            <div class="glass-card">
              ${Object.keys(categoryGroup).length === 0 ? 
                `<div style="text-align:center;color:var(--text-muted);padding:20px 0;">${t('선택된 인보이스가 없습니다.','No invoices selected.')}</div>` 
                :
                Object.keys(categoryGroup).sort().map(c => `
                  <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid var(--border-color)">
                    <div style="font-weight:600">${c} <span style="font-weight:normal; font-size:0.85em; color:var(--text-muted)">(${categoryGroup[c].count}건)</span></div>
                    <div style="font-weight:700; color:var(--primary-color)">$ ${CoverGenerator.formatCurrency(categoryGroup[c].amount, 'USD')}</div>
                  </div>
                `).join('')
              }
            </div>
          </div>

          <div>
            <h3 style="margin-bottom:10px">📊 ${t('기기 분류(Eq Cat.)별 집계','Summary by Eq Category')}</h3>
            <div class="glass-card">
              ${Object.keys(kindGroup).length === 0 ? 
                `<div style="text-align:center;color:var(--text-muted);padding:20px 0;">${t('선택된 인보이스가 없습니다.','No invoices selected.')}</div>` 
                :
                Object.keys(kindGroup).sort().map(c => `
                  <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid var(--border-color)">
                    <div style="font-weight:600">${c} <span style="font-weight:normal; font-size:0.85em; color:var(--text-muted)">(${kindGroup[c].count}건)</span></div>
                    <div style="font-weight:700; color:var(--primary-color)">$ ${CoverGenerator.formatCurrency(kindGroup[c].amount, 'USD')}</div>
                  </div>
                `).join('')
              }
            </div>
          </div>

          <div class="glass-card" style="background:rgba(0,123,255,0.05);border:2px solid var(--primary-color);">
            <div style="display:flex; justify-content:space-between; padding:5px 10px;">
              <div style="font-weight:800; font-size:1.1rem; color:var(--text-primary)">Total Advance Request</div>
              <div style="font-weight:800; font-size:1.2rem; color:var(--primary-color)">$ ${CoverGenerator.formatCurrency(grandTotal, 'USD')}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
    `;
  }

  function onMonthChange(val) {
    selectedMonth = val;
    App.navigateTo('advance');
  }

  function toggleCheck(id, isChecked) {
    if(isChecked) checkedInvoiceIds.add(id);
    else checkedInvoiceIds.delete(id);
    App.navigateTo('advance');
  }

  function selectAll(isChecked) {
    let invoices = Storage.getInvoices().filter(i => i.status !== '입력');
    if (selectedMonth) {
      invoices = invoices.filter(i => i.createdAt && i.createdAt.startsWith(selectedMonth));
    }
    if(isChecked) {
      invoices.forEach(i => checkedInvoiceIds.add(i.id));
    } else {
      invoices.forEach(i => checkedInvoiceIds.delete(i.id));
    }
    App.navigateTo('advance');
  }

  function printSummary() {
    if(checkedInvoiceIds.size === 0) {
      alert(App.getLang() === 'ko' ? '먼저 인보이스를 선택하세요.' : 'Select invoices first.');
      return;
    }
    window.print();
  }

  function exportExcel() {
    if(checkedInvoiceIds.size === 0) {
      alert(App.getLang() === 'ko' ? '먼저 인보이스를 선택하세요.' : 'Select invoices first.');
      return;
    }
    let invoices = Storage.getInvoices().filter(i => i.status !== '입력');
    if (selectedMonth) {
      invoices = invoices.filter(i => i.createdAt && i.createdAt.startsWith(selectedMonth));
    }
    const vesselGroup = {};
    const accountGroup = {};
    const categoryGroup = {};
    const kindGroup = {};
    let grandTotal = 0;
    
    const isKo=App.getLang()==='ko';
    invoices.forEach(inv => {
      if(checkedInvoiceIds.has(inv.id)) {
        const usdAmt = getUsdAmount(inv);
        if(!vesselGroup[inv.vesselName]) vesselGroup[inv.vesselName] = { count: 0, amount: 0 };
        vesselGroup[inv.vesselName].count++;
        vesselGroup[inv.vesselName].amount += usdAmt;
        
        // By Account (GLV)
        let acctLabel = '분류전(Uncategorized)';
        if (inv.acctNo) {
          const accObj = Storage.getAccounts().find(a => a.code === inv.acctNo);
          const name = accObj ? (isKo ? accObj.nameKo : accObj.name) : '';
          acctLabel = name && name !== inv.acctNo ? `${inv.acctNo} (${name})` : inv.acctNo;
        }

        if(!accountGroup[acctLabel]) accountGroup[acctLabel] = { count: 0, amount: 0 };
        accountGroup[acctLabel].count++;
        accountGroup[acctLabel].amount += usdAmt;

        const cat = inv.category || '기타';
        if(!categoryGroup[cat]) categoryGroup[cat] = { count: 0, amount: 0 };
        categoryGroup[cat].count++;
        categoryGroup[cat].amount += usdAmt;

        let kindLabel = '미분류(Uncategorized)';
        if (inv.kind) {
          const kindObj = Storage.getKinds().find(k => k.id === inv.kind || k.name === inv.kind);
          const name = kindObj ? (isKo ? kindObj.nameKo : kindObj.name) : inv.kind;
          kindLabel = name && name !== inv.kind ? `${inv.kind} (${name})` : inv.kind;
        }
        if(!kindGroup[kindLabel]) kindGroup[kindLabel] = { count: 0, amount: 0 };
        kindGroup[kindLabel].count++;
        kindGroup[kindLabel].amount += usdAmt;

        grandTotal += usdAmt;
      }
    });

    if (typeof ExcelExporter !== 'undefined') {
      ExcelExporter.exportAdvancePayment(vesselGroup, accountGroup, categoryGroup, kindGroup, grandTotal, selectedMonth || '전체기간', invoices.filter(i=>checkedInvoiceIds.has(i.id)).map(i=>({
        ...i,
        usdAmount: getUsdAmount(i)
      })));
    }
  }

  return { renderAdvancePage, onMonthChange, toggleCheck, selectAll, printSummary, exportExcel, updateRate, updateManualUsd, getUsdAmount, exchangeRates, toggleSort };
})();
