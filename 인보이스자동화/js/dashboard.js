/* ============================================
   DASHBOARD MODULE - Enhanced KPI Dashboard
   Stats, Charts, Gauge, Trend Line, Vessel Type Filter
   ============================================ */
const Dashboard = (() => {
  let selectedVesselType = 'ALL';

  function renderDashboard(lang='ko') {
    const isKo=lang==='ko', t=(k,e)=>isKo?k:e;
    const allInvoices=Storage.getInvoices();
    const invoices = selectedVesselType === 'ALL' ? allInvoices : filterByVesselType(allInvoices, selectedVesselType);

    const total=invoices.length;
    const pending=invoices.filter(i=>i.status==='입력'||i.status==='감독확인'||i.status==='제출완료').length;
    const approved=invoices.filter(i=>i.status==='결재완료'||i.status==='팀장확인'||i.status==='지급완료').length;
    const overBudget=invoices.filter(i=>i.differenceRate>20).length;
    const dups=invoices.filter(i=>i.isDuplicate).length;
    const totalActUSD=invoices.reduce((s,i)=>s+AnalysisEngine.toUSD(i.actualAmount,i.currency),0);
    const processingRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    // Get vessel types for filter
    const vesselTypes = getVesselTypes();

    return `
    <div class="page-header"><div class="page-title"><span class="page-icon">📊</span><div>
      <h1>${t('대시보드','Dashboard')}</h1>
      <div class="page-subtitle">${t('인보이스 현황 종합','Invoice Overview')}</div>
    </div></div>
    <div class="page-actions">
      <button class="btn btn-ghost" onclick="ExcelExporter.exportInvoiceList()" title="Excel Download">
        📥 ${t('Excel 다운로드','Excel Export')}
      </button>
      <button class="btn btn-primary" onclick="App.navigateTo('register')">+ ${t('새 인보이스','New Invoice')}</button>
    </div></div>

    <div class="page-body">
      <!-- Vessel Type Filter -->
      <div class="vessel-type-tabs">
        <button class="vessel-type-tab ${selectedVesselType==='ALL'?'active':''}" onclick="Dashboard.setVesselType('ALL')">
          🚢 ${t('전체','All')} (${allInvoices.length})
        </button>
        ${vesselTypes.map(vt => `
          <button class="vessel-type-tab ${selectedVesselType===vt.type?'active':''}" onclick="Dashboard.setVesselType('${vt.type}')">
            ${vt.icon} ${vt.type} (${vt.count})
          </button>
        `).join('')}
      </div>

      <!-- KPI Stats -->
      <div class="stats-grid">
        <div class="stat-card blue animate-in"><div class="stat-icon">📋</div>
          <div class="stat-value">${total}</div><div class="stat-label">${t('총 인보이스','Total Invoices')}</div></div>
        <div class="stat-card amber animate-in"><div class="stat-icon">⏳</div>
          <div class="stat-value">${pending}</div><div class="stat-label">${t('결재 대기','Pending Approval')}</div>
          <div class="stat-change ${pending>0?'negative':'positive'}">${pending>0?'⚡ '+t('처리 필요','Action needed'):'✅ '+t('모두 처리됨','All clear')}</div></div>
        <div class="stat-card ${overBudget>0?'red':'emerald'} animate-in"><div class="stat-icon">⚠️</div>
          <div class="stat-value">${overBudget}</div><div class="stat-label">${t('견적 20%+ 초과','Over Budget 20%+')}</div></div>
        <div class="stat-card emerald animate-in"><div class="stat-icon">💰</div>
          <div class="stat-value">$${(totalActUSD/1000).toFixed(0)}K</div><div class="stat-label">${t('총 실적 (USD)','Total Actual (USD)')}</div></div>
      </div>

      <!-- Gauge + Monthly Trend -->
      <div class="charts-grid" style="grid-template-columns:300px 1fr">
        <div class="chart-container animate-in" style="text-align:center">
          <div class="card-header"><h3>📈 ${t('월간 처리율','Processing Rate')}</h3></div>
          <div class="gauge-widget" style="margin:20px auto">
            <canvas id="gaugeChart" width="200" height="200"></canvas>
            <div class="gauge-center">
              <div class="gauge-value">${processingRate}%</div>
              <div class="gauge-label">${t('결재 완료','Approved')}</div>
            </div>
          </div>
          <div style="font-size:0.78rem;color:var(--text-muted);margin-top:8px">
            ${approved}/${total} ${t('건 처리','processed')}
          </div>
        </div>
        <div class="trend-chart-container animate-in">
          <div class="card-header"><h3>📊 ${t('6개월 트렌드','6-Month Trend')}</h3></div>
          <canvas id="trendChart" height="200"></canvas>
        </div>
      </div>

      <!-- Vessel & Kind Charts -->
      <div class="charts-grid">
        <div class="chart-container animate-in">
          <div class="card-header"><h3>🚢 ${t('선박별 비용 현황','Vessel Cost Overview')}</h3></div>
          <canvas id="vesselChart" height="250"></canvas>
        </div>
        <div class="chart-container animate-in">
          <div class="card-header"><h3>🔧 ${t('Kind별 분포','Kind Distribution')}</h3></div>
          <canvas id="kindChart" height="250"></canvas>
        </div>
      </div>

      <div class="charts-grid" style="grid-template-columns:1fr 1fr">
        <div class="chart-container animate-in">
          <div class="card-header"><h3>📊 ${t('상태별 현황','Status Overview')}</h3></div>
          <canvas id="statusChart" height="220"></canvas>
        </div>
        <div class="chart-container animate-in">
          <div class="card-header"><h3>💱 ${t('통화별 분포','Currency Distribution')}</h3></div>
          <canvas id="currencyChart" height="220"></canvas>
        </div>
      </div>

      <div class="charts-grid" style="grid-template-columns:1fr 1fr">
        <div class="chart-container animate-in">
          <div class="card-header"><h3>⚡ ${t('결재 대기 목록','Pending Approvals')}</h3></div>
          ${renderPendingList(invoices,isKo)}
        </div>
        <div class="chart-container animate-in">
          <div class="card-header"><h3>🕓 ${t('최근 활동','Recent Activity')}</h3></div>
          ${renderActivityTimeline(isKo)}
        </div>
      </div>

      <div class="glass-card animate-in" style="margin-top:16px">
        <div class="card-header"><h3>🕐 ${t('최근 등록 인보이스','Recent Invoices')}</h3>
          <span class="card-action" onclick="App.navigateTo('list')">${t('전체보기 →','View All →')}</span></div>
        ${renderRecentTable(invoices.slice(-8).reverse(),isKo)}
      </div>
    </div>`;
  }

  /* ---- Vessel Type Helpers ---- */
  function getVesselTypes() {
    const vessels = Storage.getVessels();
    const invoices = Storage.getInvoices();
    const types = {};
    const icons = { PCTC: '🚗', BULK: '⛽', VLCC: '🛢️', CNTR: '📦', LNG: '🔥', LPG: '💨', CHEMICAL: '⚗️' };
    
    invoices.forEach(inv => {
      const vessel = vessels.find(v => v.vesselName === inv.vesselName);
      const vType = vessel?.vesselType || 'OTHER';
      if (!types[vType]) types[vType] = { type: vType, icon: icons[vType] || '🚢', count: 0 };
      types[vType].count++;
    });
    
    return Object.values(types).sort((a, b) => b.count - a.count);
  }

  function filterByVesselType(invoices, type) {
    const vessels = Storage.getVessels();
    return invoices.filter(inv => {
      const vessel = vessels.find(v => v.vesselName === inv.vesselName);
      return vessel?.vesselType === type;
    });
  }

  function setVesselType(type) {
    selectedVesselType = type;
    App.navigateTo('dashboard');
  }

  /* ---- Activity Timeline ---- */
  function renderActivityTimeline(isKo) {
    if (typeof NotificationCenter === 'undefined') return '<div style="text-align:center;padding:30px;color:var(--text-muted)">활동 없음</div>';
    const logs = NotificationCenter.getActivityLog().slice(0, 8);
    if (!logs.length) return `<div style="text-align:center;padding:30px;color:var(--text-muted)">📝 ${isKo?'최근 활동 없음':'No recent activity'}</div>`;
    
    return `<div class="activity-timeline">${logs.map(log => {
      const actionIcons = { approval: '✅', reject: '❌', submit: '📤', login: '🔑', logout: '🚪', export: '📥', create: '📝' };
      const icon = actionIcons[log.action] || '📋';
      const time = new Date(log.timestamp).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      return `<div class="activity-item ${log.action}">
        <div>
          <div style="font-size:0.85rem;font-weight:500">${icon} ${log.detail}</div>
          <div style="font-size:0.72rem;color:var(--text-muted)">${log.userName} · ${time}</div>
        </div>
      </div>`;
    }).join('')}</div>`;
  }

  function renderPendingList(invoices,isKo) {
    const pending=invoices.filter(i=>i.status==='입력'||i.status==='감독확인'||i.status==='제출완료').slice(0,5);
    if(!pending.length)return `<div style="text-align:center;padding:30px;color:var(--text-muted)">✅ ${isKo?'대기건 없음':'No pending items'}</div>`;
    return pending.map(i=>`
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-primary)">
        <div><div style="font-weight:500;font-size:0.85rem;color:var(--text-primary)">${i.vesselName} ${App.getVesselTypeBadge(i.vesselName)}</div>
          <div style="font-size:0.72rem;color:var(--text-muted)">${i.id} | ${isKo?i.workDescriptionKo||i.workDescription:i.workDescription}</div></div>
        <div style="text-align:right">${ApprovalWorkflow.getStatusBadge(i.status,isKo)}</div>
      </div>`).join('');
  }

  function renderRecentTable(invoices,isKo) {
    if(!invoices.length)return `<div style="text-align:center;padding:20px;color:var(--text-muted)">${isKo?'데이터 없음':'No data'}</div>`;
    return `<table class="data-table"><thead><tr>
      <th>ID</th><th>${isKo?'선박':'Vessel'}</th><th>${isKo?'유형':'Type'}</th><th>${isKo?'작업':'Work'}</th>
      <th style="text-align:right">${isKo?'실적':'Actual'}</th><th>${isKo?'상태':'Status'}</th>
    </tr></thead><tbody>${invoices.map(i=>`<tr>
      <td><span style="color:var(--text-accent);cursor:pointer" onclick="CoverGenerator.showPreviewModal(Storage.getInvoice('${i.id}'),App.getLang())">${i.id}</span></td>
      <td>${i.vesselName}</td>
      <td>${App.getVesselTypeBadge(i.vesselName)}</td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${isKo?i.workDescriptionKo||i.workDescription:i.workDescription}</td>
      <td style="text-align:right;font-weight:600">${CoverGenerator.formatCurrency(i.actualAmount,i.currency)}</td>
      <td>${ApprovalWorkflow.getStatusBadge(i.status,isKo)}</td>
    </tr>`).join('')}</tbody></table>`;
  }

  /* ---- Chart Drawing ---- */
  function drawCharts() {
    const allInvoices=Storage.getInvoices();
    const invoices = selectedVesselType === 'ALL' ? allInvoices : filterByVesselType(allInvoices, selectedVesselType);
    drawGaugeChart(invoices);
    drawTrendChart(allInvoices);
    drawVesselChart(invoices);
    drawKindChart(invoices);
    drawStatusChart(invoices);
    drawCurrencyChart(invoices);
  }

  /* ---- Gauge Chart ---- */
  function drawGaugeChart(invoices) {
    const canvas = document.getElementById('gaugeChart'); if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const total = invoices.length;
    const approved = invoices.filter(i => i.status === '결재완료' || i.status === '팀장확인' || i.status === '지급완료').length;
    const rate = total > 0 ? approved / total : 0;
    
    const cx = 100, cy = 110, r = 75;
    const startAngle = 0.75 * Math.PI;
    const endAngle = 2.25 * Math.PI;
    const sweepAngle = endAngle - startAngle;

    ctx.clearRect(0, 0, 200, 200);
    
    // Background arc
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Progress arc
    const progressEnd = startAngle + sweepAngle * rate;
    const gradient = ctx.createLinearGradient(0, 0, 200, 0);
    gradient.addColorStop(0, '#3b82f6');
    gradient.addColorStop(0.5, '#10b981');
    gradient.addColorStop(1, '#06b6d4');
    
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, progressEnd);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Glow effect
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, progressEnd);
    ctx.strokeStyle = 'rgba(59,130,246,0.15)';
    ctx.lineWidth = 24;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  /* ---- 6-Month Trend Line Chart ---- */
  function drawTrendChart(invoices) {
    const canvas = document.getElementById('trendChart'); if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth * 2; canvas.height = 400; ctx.scale(2, 2);
    const w = canvas.offsetWidth, h = 200;

    // Generate 6 months of data
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString('ko-KR', { year: '2-digit', month: 'short' });
      const monthInvs = invoices.filter(inv => inv.createdAt && inv.createdAt.startsWith(key));
      const est = monthInvs.reduce((s, ii) => s + AnalysisEngine.toUSD(ii.estimatedAmount, ii.currency), 0);
      const act = monthInvs.reduce((s, ii) => s + AnalysisEngine.toUSD(ii.actualAmount, ii.currency), 0);
      months.push({ key, label, est, act, count: monthInvs.length });
    }

    const maxVal = Math.max(...months.map(m => Math.max(m.est, m.act)), 1);
    const chartH = h - 50, chartW = w - 80;
    
    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = 20 + chartH * (1 - i / 4);
      ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(w - 10, y); ctx.stroke();
      ctx.fillStyle = '#64748b'; ctx.font = '10px Inter'; ctx.textAlign = 'right';
      ctx.fillText('$' + Math.round(maxVal * i / 4 / 1000) + 'K', 55, y + 3);
    }

    // Draw lines
    const padX = 60, stepX = chartW / (months.length - 1 || 1);

    // Area fill for Actual
    ctx.beginPath();
    months.forEach((m, i) => {
      const x = padX + i * stepX;
      const y = 20 + chartH * (1 - m.act / maxVal);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(padX + (months.length - 1) * stepX, 20 + chartH);
    ctx.lineTo(padX, 20 + chartH);
    ctx.closePath();
    const areaGrad = ctx.createLinearGradient(0, 20, 0, 20 + chartH);
    areaGrad.addColorStop(0, 'rgba(59,130,246,0.15)');
    areaGrad.addColorStop(1, 'rgba(59,130,246,0)');
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // Estimated line
    ctx.beginPath();
    months.forEach((m, i) => {
      const x = padX + i * stepX;
      const y = 20 + chartH * (1 - m.est / maxVal);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.stroke();
    ctx.setLineDash([]);

    // Actual line
    ctx.beginPath();
    months.forEach((m, i) => {
      const x = padX + i * stepX;
      const y = 20 + chartH * (1 - m.act / maxVal);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    const lineGrad = ctx.createLinearGradient(0, 0, w, 0);
    lineGrad.addColorStop(0, '#3b82f6');
    lineGrad.addColorStop(1, '#10b981');
    ctx.strokeStyle = lineGrad; ctx.lineWidth = 3; ctx.stroke();

    // Data points + labels
    months.forEach((m, i) => {
      const x = padX + i * stepX;
      const yAct = 20 + chartH * (1 - m.act / maxVal);
      
      // Point
      ctx.beginPath(); ctx.arc(x, yAct, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6'; ctx.fill();
      ctx.strokeStyle = '#0a1628'; ctx.lineWidth = 2; ctx.stroke();

      // Glow
      ctx.beginPath(); ctx.arc(x, yAct, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(59,130,246,0.15)'; ctx.fill();
      
      // Month label
      ctx.fillStyle = '#94a3b8'; ctx.font = '10px Noto Sans KR'; ctx.textAlign = 'center';
      ctx.fillText(m.label, x, 20 + chartH + 16);
      ctx.fillText(m.count + '건', x, 20 + chartH + 28);
    });

    // Legend
    ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(w - 150, 8); ctx.lineTo(w - 130, 8);
    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#94a3b8'; ctx.font = '10px Inter'; ctx.textAlign = 'left'; ctx.fillText('Estimated', w - 126, 11);

    ctx.beginPath(); ctx.moveTo(w - 70, 8); ctx.lineTo(w - 50, 8);
    ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#94a3b8'; ctx.fillText('Actual', w - 46, 11);
  }

  /* ---- Currency Distribution Chart ---- */
  function drawCurrencyChart(invoices) {
    const canvas = document.getElementById('currencyChart'); if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth * 2; canvas.height = 440; ctx.scale(2, 2);
    const w = canvas.offsetWidth, h = 220;

    const groups = {};
    invoices.forEach(i => {
      const c = i.currency || 'USD';
      groups[c] = (groups[c] || 0) + 1;
    });

    const entries = Object.entries(groups).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((s, e) => s + e[1], 0);
    if (!total) return;

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    const barH = 28, gap = 14, startY = 20;
    const maxC = Math.max(...entries.map(e => e[1]), 1);

    entries.forEach(([name, count], i) => {
      const y = startY + i * (barH + gap);
      const bw = (count / maxC) * (w - 170);
      const pct = ((count / total) * 100).toFixed(0);

      // Label
      ctx.fillStyle = '#f1f5f9'; ctx.font = 'bold 12px Inter'; ctx.textAlign = 'right';
      ctx.fillText(name, 60, y + barH / 2 + 4);

      // Bar background
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      roundRect(ctx, 70, y, w - 170, barH, 6); ctx.fill();

      // Bar
      const g = ctx.createLinearGradient(70, 0, 70 + bw, 0);
      g.addColorStop(0, colors[i % colors.length]);
      g.addColorStop(1, colors[i % colors.length] + '88');
      ctx.fillStyle = g;
      ctx.beginPath(); roundRect(ctx, 70, y, Math.max(bw, 2), barH, 6); ctx.fill();

      // Count + %
      ctx.fillStyle = '#f1f5f9'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'left';
      ctx.fillText(`${count}건 (${pct}%)`, 70 + bw + 10, y + barH / 2 + 4);
    });
  }

  function drawVesselChart(invoices) {
    const canvas=document.getElementById('vesselChart');if(!canvas)return;
    const ctx=canvas.getContext('2d');
    canvas.width=canvas.offsetWidth*2;canvas.height=500;ctx.scale(2,2);
    const w=canvas.offsetWidth,h=250;
    const groups={};invoices.forEach(i=>{const k=i.vesselName;if(!groups[k])groups[k]={est:0,act:0};groups[k].est+=AnalysisEngine.toUSD(i.estimatedAmount,i.currency);groups[k].act+=AnalysisEngine.toUSD(i.actualAmount,i.currency);});
    const entries=Object.entries(groups).sort((a,b)=>b[1].act-a[1].act).slice(0,6);
    if(!entries.length)return;
    const maxVal=Math.max(...entries.map(e=>Math.max(e[1].est,e[1].act)));
    const barW=(w-80)/(entries.length*3);
    const chartH=h-60;
    ctx.clearRect(0,0,w,h);
    ctx.strokeStyle='rgba(255,255,255,0.05)';ctx.lineWidth=1;
    for(let i=0;i<=4;i++){const y=30+chartH*(1-i/4);ctx.beginPath();ctx.moveTo(60,y);ctx.lineTo(w-10,y);ctx.stroke();
      ctx.fillStyle='#64748b';ctx.font='10px Inter';ctx.textAlign='right';ctx.fillText('$'+Math.round(maxVal*i/4/1000)+'K',55,y+3);}
    entries.forEach(([name,data],idx)=>{
      const x=70+idx*(barW*3);
      const estH=(data.est/maxVal)*chartH;const actH=(data.act/maxVal)*chartH;
      const gEst=ctx.createLinearGradient(0,30+chartH-estH,0,30+chartH);
      gEst.addColorStop(0,'#3b82f6');gEst.addColorStop(1,'#1d4ed8');
      ctx.fillStyle=gEst;ctx.beginPath();roundRect(ctx,x,30+chartH-estH,barW,estH,4);ctx.fill();
      const gAct=ctx.createLinearGradient(0,30+chartH-actH,0,30+chartH);
      gAct.addColorStop(0,data.act>data.est?'#f59e0b':'#10b981');gAct.addColorStop(1,data.act>data.est?'#d97706':'#059669');
      ctx.fillStyle=gAct;ctx.beginPath();roundRect(ctx,x+barW+4,30+chartH-actH,barW,actH,4);ctx.fill();
      ctx.fillStyle='#94a3b8';ctx.font='9px Noto Sans KR';ctx.textAlign='center';
      const label=name.length>10?name.slice(0,10)+'…':name;
      ctx.fillText(label,x+barW,30+chartH+14);
    });
    ctx.fillStyle='#3b82f6';ctx.fillRect(w-140,8,10,10);ctx.fillStyle='#94a3b8';ctx.font='10px Inter';ctx.textAlign='left';ctx.fillText('Est.',w-126,17);
    ctx.fillStyle='#f59e0b';ctx.fillRect(w-80,8,10,10);ctx.fillStyle='#94a3b8';ctx.fillText('Actual',w-66,17);
  }

  function drawKindChart(invoices) {
    const canvas=document.getElementById('kindChart');if(!canvas)return;
    const ctx=canvas.getContext('2d');
    canvas.width=canvas.offsetWidth*2;canvas.height=500;ctx.scale(2,2);
    const w=canvas.offsetWidth, h=250;
    
    const isKo = App.getLang()==='ko';
    const kinds = typeof Storage !== 'undefined' ? Storage.getKinds() : [];
    
    const groups={};
    invoices.forEach(i=>{
      let kName = isKo ? '미분류' : 'Uncategorized';
      if(i.kind) {
         const k = kinds.find(x => x.id === i.kind || x.name === i.kind);
         kName = k ? (isKo ? k.nameKo : k.name) : i.kind;
         if(kName.length > 20) kName = kName.slice(0,18)+'…';
      }
      groups[kName]=(groups[kName]||0)+AnalysisEngine.toUSD(i.actualAmount,i.currency);
    });
    
    const entries=Object.entries(groups).sort((a,b)=>b[1]-a[1]).slice(0, 6);
    const total=Object.values(groups).reduce((s,e)=>s+e,0);
    if(!total) return;
    
    const colors=['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];
    const maxVal=Math.max(...entries.map(e=>e[1]), 1);
    
    const barH=22, gap=13, startY=20;
    
    entries.forEach(([name, val], i) => {
      const y = startY + i * (barH + gap);
      const bw = (val / maxVal) * (w - 200);
      const pct = ((val / total) * 100).toFixed(0);

      // Label (Left)
      ctx.fillStyle = '#94a3b8'; ctx.font = '11px Noto Sans KR'; ctx.textAlign = 'right';
      ctx.fillText(name, 120, y + barH / 2 + 4);

      // Bar BG
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      roundRect(ctx, 130, y, w - 200, barH, 4); ctx.fill();

      // Bar Fill
      const g = ctx.createLinearGradient(130, 0, 130 + bw, 0);
      g.addColorStop(0, colors[i % colors.length]);
      g.addColorStop(1, colors[i % colors.length] + '99');
      ctx.fillStyle = g;
      ctx.beginPath(); roundRect(ctx, 130, y, Math.max(bw, 2), barH, 4); ctx.fill();

      // Value & Pct (Right)
      ctx.fillStyle = '#f1f5f9'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'left';
      ctx.fillText(`$${Math.round(val/1000)}K (${pct}%)`, 130 + bw + 8, y + barH / 2 + 4);
    });
  }

  function drawStatusChart(invoices) {
    const canvas=document.getElementById('statusChart');if(!canvas)return;
    const ctx=canvas.getContext('2d');
    canvas.width=canvas.offsetWidth*2;canvas.height=440;ctx.scale(2,2);
    const w=canvas.offsetWidth,h=220;
    const statuses=['입력','제출완료','감독확인','팀장확인','결재완료','지급완료'];
    const colors=['#64748b','#f59e0b','#3b82f6','#8b5cf6','#10b981','#06b6d4'];
    const counts=statuses.map(s=>invoices.filter(i=>i.status===s).length);
    const maxC=Math.max(...counts,1);
    const barH=22,gap=10,startY=15;
    counts.forEach((c,i)=>{
      const y=startY+i*(barH+gap);
      const bw=(c/maxC)*(w-160);
      ctx.fillStyle='#94a3b8';ctx.font='11px Noto Sans KR';ctx.textAlign='right';ctx.fillText(statuses[i],80,y+barH/2+4);
      ctx.fillStyle='rgba(255,255,255,0.03)';roundRect(ctx,90,y,w-160,barH,4);ctx.fill();
      const g=ctx.createLinearGradient(90,0,90+bw,0);g.addColorStop(0,colors[i]);g.addColorStop(1,colors[i]+'99');
      ctx.fillStyle=g;ctx.beginPath();roundRect(ctx,90,y,Math.max(bw,2),barH,4);ctx.fill();
      ctx.fillStyle='#f1f5f9';ctx.font='bold 11px Inter';ctx.textAlign='left';ctx.fillText(c+'건',90+bw+8,y+barH/2+4);
    });
  }

  function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}

  return { renderDashboard, drawCharts, setVesselType };
})();
