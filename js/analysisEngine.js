/* ============================================
   ANALYSIS ENGINE - 견적 vs 실적 분석
   ============================================ */
const AnalysisEngine = (() => {
  function renderAnalysisPage(lang='ko') {
    const isKo=lang==='ko', t=(k,e)=>isKo?k:e, invoices=Storage.getInvoices();
    const totalEst=invoices.reduce((s,i)=>s+toUSD(i.estimatedAmount,i.currency),0);
    const totalAct=invoices.reduce((s,i)=>s+toUSD(i.actualAmount,i.currency),0);
    const totalDiff=totalAct-totalEst;
    const avgRate=invoices.length?invoices.reduce((s,i)=>s+(i.differenceRate||0),0)/invoices.length:0;
    const overBudget=invoices.filter(i=>i.differenceRate>20).length;
    const planned=invoices.filter(i=>i.isPlanned).length;
    const unplanned=invoices.length-planned;
    return `
    <div class="page-header"><div class="page-title"><span class="page-icon">📈</span><div>
      <h1>${t('실적 분석','Performance Analysis')}</h1>
      <div class="page-subtitle">${t('견적 대비 실적 분석 및 트렌드','Estimate vs Actual analysis & trends')}</div>
    </div></div></div>
    <div class="page-body">
      <div class="stats-grid">
        <div class="stat-card blue animate-in"><div class="stat-icon">💰</div>
          <div class="stat-value">$${Math.round(totalEst).toLocaleString()}</div>
          <div class="stat-label">${t('총 견적 (USD 환산)','Total Est. (USD)')}</div></div>
        <div class="stat-card ${totalDiff>0?'red':'emerald'} animate-in"><div class="stat-icon">📊</div>
          <div class="stat-value">$${Math.round(totalAct).toLocaleString()}</div>
          <div class="stat-label">${t('총 실적 (USD 환산)','Total Actual (USD)')}</div></div>
        <div class="stat-card amber animate-in"><div class="stat-icon">⚠️</div>
          <div class="stat-value">${overBudget}</div>
          <div class="stat-label">${t('견적 20%+ 초과건','Over 20% Budget')}</div></div>
        <div class="stat-card emerald animate-in"><div class="stat-icon">📋</div>
          <div class="stat-value">${avgRate.toFixed(1)}%</div>
          <div class="stat-label">${t('평균 차이율','Avg. Diff Rate')}</div></div>
      </div>
      <div class="tab-nav">
        <button class="tab-item active" data-tab="byvessel">${t('🚢 선박별','🚢 By Vessel')}</button>
        <button class="tab-item" data-tab="bykind">${t('🔧 Kind별','🔧 By Kind')}</button>
        <button class="tab-item" data-tab="byport">${t('⚓ 항구별','⚓ By Port')}</button>
        <button class="tab-item" data-tab="planned">${t('📋 계획/비계획','📋 Plan Analysis')}</button>
        <button class="tab-item" data-tab="overbudget">${t('⚠️ 견적초과','⚠️ Over Budget')}</button>
      </div>
      <div id="tab-byvessel" class="tab-content active">${renderByVessel(invoices,isKo)}</div>
      <div id="tab-bykind" class="tab-content" style="display:none">${renderByKind(invoices,isKo)}</div>
      <div id="tab-byport" class="tab-content" style="display:none">${renderByPort(invoices,isKo)}</div>
      <div id="tab-planned" class="tab-content" style="display:none">${renderPlannedAnalysis(invoices,isKo,planned,unplanned)}</div>
      <div id="tab-overbudget" class="tab-content" style="display:none">${renderOverBudget(invoices,isKo)}</div>
    </div>`;
  }

  function toUSD(amount,currency) {
    const rates={USD:1,KRW:0.00075,EUR:1.08,JPY:0.0067,SGD:0.74};
    return (amount||0)*(rates[currency]||1);
  }

  function groupBy(arr,key) {
    return arr.reduce((g,item)=>{const k=item[key]||'Unknown';(g[k]=g[k]||[]).push(item);return g;},{});
  }

  function renderGroupTable(groups,invoices,isKo) {
    const t=(k,e)=>isKo?k:e;
    let rows='';
    const entries=Object.entries(groups).map(([name,items])=>{
      const est=items.reduce((s,i)=>s+toUSD(i.estimatedAmount,i.currency),0);
      const act=items.reduce((s,i)=>s+toUSD(i.actualAmount,i.currency),0);
      const diff=act-est, rate=est>0?((diff/est)*100).toFixed(1):0;
      return {name,count:items.length,est,act,diff,rate:parseFloat(rate)};
    }).sort((a,b)=>b.act-a.act);
    entries.forEach(e=>{
      const dc=e.rate>0?'diff-positive':e.rate<0?'diff-negative':'diff-neutral';
      const bar=Math.min(Math.abs(e.rate),100);
      rows+=`<tr><td style="font-weight:500;color:var(--text-primary)">${e.name}</td><td style="text-align:center">${e.count}</td>
        <td style="text-align:right">$${Math.round(e.est).toLocaleString()}</td>
        <td style="text-align:right;font-weight:600">$${Math.round(e.act).toLocaleString()}</td>
        <td style="text-align:right" class="${dc}">${e.rate>=0?'+':''}$${Math.round(Math.abs(e.diff)).toLocaleString()}</td>
        <td style="min-width:150px"><div style="display:flex;align-items:center;gap:8px">
          <div class="progress-bar" style="flex:1"><div class="progress-fill ${e.rate>20?'red':e.rate>0?'amber':'emerald'}" style="width:${bar}%"></div></div>
          <span class="${dc}" style="font-size:0.78rem;font-weight:600;min-width:50px;text-align:right">${e.rate>=0?'+':''}${e.rate}%</span>
        </div></td></tr>`;
    });
    return `<div class="glass-card" style="padding:0"><div class="table-container"><table class="data-table"><thead><tr>
      <th>${t('구분','Group')}</th><th style="text-align:center">${t('건수','Count')}</th>
      <th style="text-align:right">${t('견적(USD)','Est.(USD)')}</th><th style="text-align:right">${t('실적(USD)','Actual(USD)')}</th>
      <th style="text-align:right">${t('차이','Diff')}</th><th>${t('차이율','Diff Rate')}</th>
    </tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }

  function renderByVessel(inv,isKo){return renderGroupTable(groupBy(inv,'vesselName'),inv,isKo);}
  function renderByKind(inv,isKo){return renderGroupTable(groupBy(inv,'kind'),inv,isKo);}
  function renderByPort(inv,isKo){return renderGroupTable(groupBy(inv,'workPort'),inv,isKo);}

  function renderPlannedAnalysis(inv,isKo,planned,unplanned) {
    const t=(k,e)=>isKo?k:e;
    const pInv=inv.filter(i=>i.isPlanned),uInv=inv.filter(i=>!i.isPlanned);
    const pEst=pInv.reduce((s,i)=>s+toUSD(i.estimatedAmount,i.currency),0);
    const pAct=pInv.reduce((s,i)=>s+toUSD(i.actualAmount,i.currency),0);
    const uEst=uInv.reduce((s,i)=>s+toUSD(i.estimatedAmount,i.currency),0);
    const uAct=uInv.reduce((s,i)=>s+toUSD(i.actualAmount,i.currency),0);
    const pRate=pEst>0?(((pAct-pEst)/pEst)*100).toFixed(1):0;
    const uRate=uEst>0?(((uAct-uEst)/uEst)*100).toFixed(1):0;
    return `<div class="stats-grid" style="grid-template-columns:1fr 1fr">
      <div class="glass-card" style="text-align:center"><h3 style="margin-bottom:12px;color:var(--accent-emerald)">✅ ${t('계획 작업','Planned')}</h3>
        <div style="font-size:2rem;font-weight:700;margin-bottom:4px">${planned}${t('건',' items')}</div>
        <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:12px">${t('견적','Est')}: $${Math.round(pEst).toLocaleString()} → ${t('실적','Act')}: $${Math.round(pAct).toLocaleString()}</div>
        <div style="font-size:1.2rem;font-weight:600" class="${pRate>0?'diff-positive':'diff-negative'}">${pRate>=0?'+':''}${pRate}% ${t('차이율','diff')}</div></div>
      <div class="glass-card" style="text-align:center"><h3 style="margin-bottom:12px;color:var(--accent-amber)">⚡ ${t('비계획 작업','Unplanned')}</h3>
        <div style="font-size:2rem;font-weight:700;margin-bottom:4px">${unplanned}${t('건',' items')}</div>
        <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:12px">${t('견적','Est')}: $${Math.round(uEst).toLocaleString()} → ${t('실적','Act')}: $${Math.round(uAct).toLocaleString()}</div>
        <div style="font-size:1.2rem;font-weight:600" class="${uRate>0?'diff-positive':'diff-negative'}">${uRate>=0?'+':''}${uRate}% ${t('차이율','diff')}</div></div>
    </div>`;
  }

  function renderOverBudget(inv,isKo) {
    const t=(k,e)=>isKo?k:e;
    const over=inv.filter(i=>i.differenceRate>20).sort((a,b)=>b.differenceRate-a.differenceRate);
    if(!over.length)return `<div class="glass-card"><div class="empty-state"><div class="empty-icon">✅</div><div class="empty-title">${t('견적 20% 초과건이 없습니다','No items over 20% budget')}</div></div></div>`;
    return `<div class="glass-card" style="padding:0"><div class="table-container"><table class="data-table"><thead><tr>
      <th>ID</th><th>${t('선박','Vessel')}</th><th>${t('작업','Work')}</th><th>Kind</th>
      <th style="text-align:right">${t('견적','Est.')}</th><th style="text-align:right">${t('실적','Actual')}</th>
      <th style="text-align:right">${t('차이율','Diff%')}</th><th>${t('사유','Reason')}</th>
    </tr></thead><tbody>${over.map(i=>`<tr>
      <td><span style="color:var(--text-accent);cursor:pointer" onclick="CoverGenerator.showPreviewModal(Storage.getInvoice('${i.id}'),App.getLang())">${i.id}</span></td>
      <td>${i.vesselName}</td><td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${isKo?i.workDescriptionKo||i.workDescription:i.workDescription}</td>
      <td><span class="badge badge-kind">${i.kind}</span></td>
      <td style="text-align:right">${CoverGenerator.formatCurrency(i.estimatedAmount,i.currency)}</td>
      <td style="text-align:right;font-weight:600">${CoverGenerator.formatCurrency(i.actualAmount,i.currency)}</td>
      <td style="text-align:right" class="diff-positive" style="font-weight:700">⚠️ +${i.differenceRate}%</td>
      <td style="font-size:0.78rem">${i.reason||'-'}</td>
    </tr>`).join('')}</tbody></table></div></div>`;
  }

  function initTabEvents(){
    document.querySelectorAll('.tab-item[data-tab]').forEach(tab=>{
      tab.addEventListener('click',()=>{
        document.querySelectorAll('.tab-item[data-tab]').forEach(t=>t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c=>c.style.display='none');
        tab.classList.add('active');
        const target=document.getElementById('tab-'+tab.dataset.tab);
        if(target)target.style.display='block';
      });
    });
  }

  return {renderAnalysisPage,initTabEvents,toUSD};
})();
