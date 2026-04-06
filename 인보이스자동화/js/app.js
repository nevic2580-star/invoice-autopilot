/* ============================================
   APP MODULE - Routing, i18n, Events, Master
   ============================================ */
const App = (() => {
  let currentPage='dashboard', currentLang='ko', editId=null;

  function init() {
    Storage.seedDemoData();
    const settings=Storage.getSettings();
    currentLang=settings.lang||'ko';

    if (!Auth || !Auth.isLoggedIn()) {
      document.getElementById('loginContainer').style.display = 'flex';
      document.getElementById('appContainer').style.display = 'none';
      return;
    }

    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'flex';

    const user = Auth.getCurrentUser();
    document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();
    document.getElementById('userNameLabel').textContent = user.name;
    const roleTxt = user.role === 'vendor' ? '업체' : (user.role === 'supervisor' ? '담당감독' : '팀장');
    document.getElementById('userRoleLabel').textContent = roleTxt;

    // Role specific UI adjustments
    if (user.role === 'vendor') {
      document.getElementById('navDashboard').style.display = 'none';
      document.getElementById('navAdvance').style.display = 'none';
      document.getElementById('navSettings').style.display = 'none';
      navigateTo('register');
    } else {
      navigateTo('dashboard');
    }

    updateLangButtons();
    setupEvents();

    // Start session timeout monitor
    if (Auth.startSessionMonitor) Auth.startSessionMonitor();

    // Update notification badge
    if (typeof NotificationCenter !== 'undefined') NotificationCenter.updateBadge();
  }

  function getLang(){return currentLang;}

  function setLang(lang){currentLang=lang;Storage.saveSetting('lang',lang);updateLangButtons();navigateTo(currentPage,editId);}

  function updateLangButtons(){document.querySelectorAll('.lang-btn').forEach(b=>{b.classList.toggle('active',b.dataset.lang===currentLang);});}

  function navigateTo(page,eid=null) {
    currentPage=page;editId=eid;
    const main=document.getElementById('mainContent');if(!main)return;
    document.querySelectorAll('.nav-item').forEach(n=>{n.classList.toggle('active',n.dataset.page===page);});
    updateApprovalBadge();
    switch(page){
      case 'dashboard':main.innerHTML=Dashboard.renderDashboard(currentLang);setTimeout(()=>Dashboard.drawCharts(),100);break;
      case 'register':main.innerHTML=InvoiceManager.renderRegisterPage(currentLang,eid);setTimeout(()=>{InvoiceManager.onCategoryChange();InvoiceManager.calcDifference();},50);break;
      case 'list':main.innerHTML=InvoiceManager.renderListPage(currentLang);break;
      case 'advance':main.innerHTML=AdvanceManager.renderAdvancePage(currentLang);break;
      case 'approval':main.innerHTML=ApprovalWorkflow.renderApprovalPage(currentLang);setTimeout(()=>ApprovalWorkflow.initTabEvents(),50);break;
      case 'analysis':main.innerHTML=AnalysisEngine.renderAnalysisPage(currentLang);setTimeout(()=>AnalysisEngine.initTabEvents(),50);break;
      case 'master':main.innerHTML=renderMasterPage();setTimeout(()=>initMasterTabs(),50);break;
      case 'settings':main.innerHTML=typeof SettingsManager !== 'undefined' ? SettingsManager.renderSettingsPage(currentLang) : 'Settings Loading...';break;
      default:main.innerHTML=Dashboard.renderDashboard(currentLang);setTimeout(()=>Dashboard.drawCharts(),100);
    }
    window.scrollTo(0,0);
  }

  function updateApprovalBadge(){
    const inv=Storage.getInvoices();
    const pending=inv.filter(i=>i.status==='입력'||i.status==='감독확인').length;
    const badge=document.getElementById('approvalBadge');
    if(badge){badge.textContent=pending;badge.style.display=pending>0?'inline':'none';}
  }

  function setupEvents(){
    // Mobile toggle
    document.getElementById('mobileToggle')?.addEventListener('click',()=>{document.querySelector('.sidebar')?.classList.toggle('open');});
    // Close sidebar on overlay click (mobile)
    document.addEventListener('click',e=>{
      if(window.innerWidth<=768&&!e.target.closest('.sidebar')&&!e.target.closest('#mobileToggle')){document.querySelector('.sidebar')?.classList.remove('open');}
      // Close notification panel when clicking outside
      if(!e.target.closest('.notif-panel')&&!e.target.closest('.notif-bell-wrapper')){document.getElementById('notifPanel')?.classList.remove('open');}
    });
    // Resize handler for charts
    let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(currentPage==='dashboard')Dashboard.drawCharts();},250);});
  }

  /* ---- Vessel Type Utility ---- */
  function getVesselTypeBadge(vesselName) {
    const vessels = Storage.getVessels();
    const vessel = vessels.find(v => v.vesselName === vesselName);
    const type = vessel?.vesselType || '';
    const typeLC = type.toLowerCase();
    const icons = { pctc: '🚗', bulk: '⛽', vlcc: '🛢️', cntr: '📦', lng: '🔥', lpg: '💨', chemical: '⚗️' };
    const icon = icons[typeLC] || '🚢';
    return `<span class="badge badge-vessel badge-vessel-${typeLC}">${icon} ${type}</span>`;
  }

  /* ---- Toast ---- */
  function showToast(type,title,msg){
    const container=document.getElementById('toastContainer');if(!container)return;
    const icons={success:'✅',error:'❌',warning:'⚠️',info:'ℹ️'};
    const toast=document.createElement('div');toast.className=`toast ${type}`;
    toast.innerHTML=`<span class="toast-icon">${icons[type]||'ℹ️'}</span><div class="toast-content"><div class="toast-title">${title}</div>${msg?`<div class="toast-message">${msg}</div>`:''}</div><button class="toast-close" onclick="this.parentElement.remove()">✕</button>`;
    container.appendChild(toast);setTimeout(()=>toast.remove(),4000);
  }

  /* ---- Modal ---- */
  function closeModal(){document.getElementById('modal-overlay')?.classList.remove('active');}

  /* ---- Auth Helpers ---- */
  function handleLogin() {
    const u = document.getElementById('loginUsername').value;
    const p = document.getElementById('loginPassword').value;
    const res = Auth.login(u, p);
    if(res.success) window.location.reload();
    else showToast('error', '로그인 실패', res.message);
  }
  
  function handleRegister() {
    const search = document.getElementById('regVendorSearch').value;
    const u = document.getElementById('regUsername').value;
    const p = document.getElementById('regPassword').value;
    
    // Extract vendor name if selected from datalist (sometimes format is "Name (Code)")
    const cleanSearch = search.split(' (')[0];
    const vendors = Storage.getVendors();
    const vendor = vendors.find(v => v.name === cleanSearch);
    if(!vendor) return showToast('error', '업체 검색 실패', '유효한 업체를 선택하세요.');
    
    const res = Auth.registerVendor(vendor.id, u, p);
    if(res.success) {
      Auth.login(u, p);
      window.location.reload();
    } else {
      showToast('error', '가입 실패', res.message);
    }
  }

  function toggleLoginMode(mode) {
    document.getElementById('formLogin').style.display = mode==='login'?'block':'none';
    document.getElementById('formRegister').style.display = mode==='register'?'block':'none';
    document.getElementById('tabLogin').classList.toggle('active', mode==='login');
    document.getElementById('tabRegister').classList.toggle('active', mode==='register');
    
    if (mode === 'register') {
      const dl = document.getElementById('vendorsDatalist');
      dl.innerHTML = Storage.getVendors().map(v => `<option value="${v.name}">${v.name} (${v.code})</option>`).join('');
    }
  }

  /* ---- Master Data Page ---- */
  function renderMasterPage(){
    const isKo=currentLang==='ko',t=(k,e)=>isKo?k:e;
    const vessels=Storage.getVessels(),approvers=Storage.getApprovers(),kinds=Storage.getKinds(),categories=Storage.getCategories(),ports=Storage.getPorts(),accounts=Storage.getAccounts();
    return `
    <div class="page-header"><div class="page-title"><span class="page-icon">⚙️</span><div>
      <h1>${t('마스터 데이터 관리','Master Data')}</h1>
      <div class="page-subtitle">${t('선박, 결재자, Kind, 분류 등 기준정보 관리','Manage vessels, approvers, kinds, categories')}</div>
    </div></div>
    <div class="page-actions"><button class="btn btn-danger btn-sm" onclick="if(confirm('${t('모든 데이터를 초기화하시겠습니까?','Reset all data?')}')){Storage.resetData();App.navigateTo('master');}">🔄 ${t('데이터 초기화','Reset Data')}</button></div></div>
    <div class="page-body">
      <div class="tab-nav">
        <button class="tab-item active" data-tab="mVessel">${t('🚢 선박','🚢 Vessels')}</button>
        <button class="tab-item" data-tab="mApprover">${t('👤 결재자','👤 Approvers')}</button>
        <button class="tab-item" data-tab="mKind">${t('🔧 Kind','🔧 Kinds')}</button>
        <button class="tab-item" data-tab="mCategory">${t('📂 분류','📂 Categories')}</button>
        <button class="tab-item" data-tab="mPort">${t('⚓ 항구','⚓ Ports')}</button>
        <button class="tab-item" data-tab="mAccount">${t('💳 계정','💳 Accounts')}</button>
      </div>
      <div id="tab-mVessel" class="tab-content active">
        ${renderMasterTable(t('선박 목록','Vessels'),['ID',t('선박명','Name'),t('코드','Code'),t('유형','Type')],
          vessels.map(v=>`<tr><td>${v.id}</td><td style="font-weight:500;color:var(--text-primary)">${v.vesselName}</td><td>${v.vesselCode}</td><td>${v.vesselType||'-'}</td></tr>`))}
      </div>
      <div id="tab-mApprover" class="tab-content" style="display:none">
        ${renderMasterTable(t('결재자 목록','Approvers'),['ID',t('이름','Name'),t('영문명','English'),t('역할','Role')],
          approvers.map(a=>`<tr><td>${a.id}</td><td style="font-weight:500;color:var(--text-primary)">${a.name}</td><td>${a.nameEn||'-'}</td><td><span class="badge ${a.role==='supervisor'?'badge-status-supervisor':'badge-status-teamlead'}">${a.role==='supervisor'?t('감독','Supervisor'):t('팀장','Team Lead')}</span></td></tr>`))}
      </div>
      <div id="tab-mKind" class="tab-content" style="display:none">
        ${renderMasterTable('Kind',['ID',t('영문','English'),t('한글','Korean')],
          kinds.map(k=>`<tr><td>${k.id}</td><td>${k.name}</td><td>${k.nameKo}</td></tr>`))}
      </div>
      <div id="tab-mCategory" class="tab-content" style="display:none">
        ${renderMasterTable(t('분류','Categories'),['ID',t('영문','English'),t('한글','Korean')],
          categories.map(c=>`<tr><td>${c.id}</td><td>${c.name}</td><td>${c.nameKo}</td></tr>`))}
      </div>
      <div id="tab-mPort" class="tab-content" style="display:none">
        ${renderMasterTable(t('항구','Ports'),['ID',t('영문','English'),t('한글','Korean')],
          ports.map(p=>`<tr><td>${p.id}</td><td>${p.name}</td><td>${p.nameKo}</td></tr>`))}
      </div>
      <div id="tab-mAccount" class="tab-content" style="display:none">
        ${renderMasterTable(t('계정','Accounts'),['ID',t('코드','Code'),t('영문','English'),t('한글','Korean')],
          accounts.map(a=>`<tr><td>${a.id}</td><td style="font-weight:500">${a.code}</td><td>${a.name}</td><td>${a.nameKo}</td></tr>`))}
      </div>
    </div>`;
  }

  function renderMasterTable(title,headers,rows){
    return `<div class="glass-card" style="padding:0"><div style="padding:16px 20px;border-bottom:1px solid var(--border-primary)"><h3>${title}</h3></div>
      <div class="table-container"><table class="data-table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.join('')}</tbody></table></div></div>`;
  }

  function initMasterTabs(){
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

  // Re-init tabs whenever master page renders is handled in navigateTo above

  return {
    init, getLang, setLang, navigateTo, showToast, closeModal, updateApprovalBadge,
    handleLogin, handleRegister, toggleLoginMode, getVesselTypeBadge,
    getCurrentUser: () => Auth ? Auth.getCurrentUser() : null
  };
})();

document.addEventListener('DOMContentLoaded', App.init);
