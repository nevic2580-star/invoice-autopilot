/* ============================================
   INVOICE MANAGER - CRUD + Duplicate Detection
   ============================================ */
const InvoiceManager = (() => {
  let listSortKey = '';
  let listSortDir = 'asc';

  function getListRowsForUser() {
    const user = App.getCurrentUser();
    let inv = Storage.getInvoices();
    if (user && user.role === 'vendor') {
      inv = inv.filter(i => i.vendorId === user.vendorId || i.createdBy === user.id || i.vendorName === user.name);
    }
    return inv;
  }

  function getListFilteredFromDom() {
    const s = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const st = document.getElementById('filterStatus')?.value || '';
    const v = document.getElementById('filterVessel')?.value || '';
    const k = document.getElementById('filterKind')?.value || '';
    let inv = getListRowsForUser();
    if (s) {
      inv = inv.filter(i =>
        (i.vesselName || '').toLowerCase().includes(s) ||
        (i.orderNo || '').toLowerCase().includes(s) ||
        (i.workDescription || '').toLowerCase().includes(s) ||
        (i.id || '').toLowerCase().includes(s)
      );
    }
    if (st) inv = inv.filter(i => i.status === st);
    if (v) inv = inv.filter(i => i.vesselName === v);
    if (k) inv = inv.filter(i => i.kind === k);
    return inv;
  }

  function vesselTypeForSort(vesselName) {
    const v = Storage.getVessels().find(x => x.vesselName === vesselName);
    return v?.vesselType || '';
  }

  function sortInvoiceList(rows, key, dir) {
    if (!key) return rows.slice();
    const m = dir === 'desc' ? -1 : 1;
    const str = v => (v == null ? '' : String(v));
    const num = v => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    const ts = (inv, field) => {
      if (field === 'createdAt') return inv.createdAt ? new Date(inv.createdAt).getTime() : 0;
      if (field === 'invoiceDate') return inv.invoiceDate ? new Date(inv.invoiceDate).getTime() : 0;
      return 0;
    };
    const arr = rows.slice();
    arr.sort((a, b) => {
      let cmp = 0;
      switch (key) {
        case 'id': cmp = str(a.id).localeCompare(str(b.id), 'ko'); break;
        case 'createdAt': cmp = ts(a, 'createdAt') - ts(b, 'createdAt'); break;
        case 'invoiceDate': cmp = ts(a, 'invoiceDate') - ts(b, 'invoiceDate'); break;
        case 'vesselName': cmp = str(a.vesselName).localeCompare(str(b.vesselName), 'ko'); break;
        case 'vesselCode': cmp = str(a.vesselCode).localeCompare(str(b.vesselCode), 'ko'); break;
        case 'vesselType': cmp = vesselTypeForSort(a.vesselName).localeCompare(vesselTypeForSort(b.vesselName), 'en'); break;
        case 'category': cmp = str(a.category).localeCompare(str(b.category), 'ko'); break;
        case 'kind': cmp = str(a.kind).localeCompare(str(b.kind), 'ko'); break;
        case 'gmsCode': cmp = str(a.gmsCode).localeCompare(str(b.gmsCode), 'ko', { numeric: true }); break;
        case 'acctNo': cmp = str(a.acctNo).localeCompare(str(b.acctNo), 'ko', { numeric: true }); break;
        case 'orderNo': cmp = str(a.orderNo).localeCompare(str(b.orderNo), 'ko', { numeric: true }); break;
        case 'workDescription': {
          const wa = str(a.workDescriptionKo || a.workDescription);
          const wb = str(b.workDescriptionKo || b.workDescription);
          cmp = wa.localeCompare(wb, 'ko');
          break;
        }
        case 'estimatedAmount': cmp = num(a.estimatedAmount) - num(b.estimatedAmount); break;
        case 'actualAmount': cmp = num(a.actualAmount) - num(b.actualAmount); break;
        case 'differenceRate': cmp = num(a.differenceRate) - num(b.differenceRate); break;
        case 'planned': cmp = (a.planned ? 1 : 0) - (b.planned ? 1 : 0); break;
        case 'opsConsulted': cmp = (a.opsConsulted ? 1 : 0) - (b.opsConsulted ? 1 : 0); break;
        case 'reason': cmp = str(a.reason).localeCompare(str(b.reason), 'ko'); break;
        case 'remarks': cmp = str(a.remarks).localeCompare(str(b.remarks), 'ko'); break;
        case 'status': cmp = str(a.status).localeCompare(str(b.status), 'ko'); break;
        default: cmp = 0;
      }
      if (cmp === 0) cmp = str(a.id).localeCompare(str(b.id), 'ko');
      return cmp * m;
    });
    return arr;
  }

  function renderListSortHeader(key, labelHtml, isKo, alignRight) {
    const title = isKo ? '클릭하여 정렬 · 다시 클릭하면 역순' : 'Click to sort · again to reverse';
    const active = listSortKey === key;
    const ind = active ? (listSortDir === 'asc' ? ' ▲' : ' ▼') : '';
    const ta = alignRight ? 'text-align:right' : '';
    return `<th class="th-sortable" style="${ta};white-space:nowrap" onclick="InvoiceManager.toggleListSort('${key}')" title="${title}">${labelHtml}${ind ? `<span class="sort-ind">${ind}</span>` : ''}</th>`;
  }

  function toggleListSort(key) {
    if (listSortKey === key) listSortDir = listSortDir === 'asc' ? 'desc' : 'asc';
    else {
      listSortKey = key;
      listSortDir = 'asc';
    }
    filterList();
  }

  function renderRegisterPage(lang='ko', editId=null) {
    const isKo=lang==='ko', vessels=Storage.getVessels(), kinds=Storage.getKinds(),
      categories=Storage.getCategories(), ports=Storage.getPorts(), accounts=Storage.getAccounts();
    let inv=editId?Storage.getInvoice(editId):null;
    const user = App.getCurrentUser();
    const isVendor = user?.role === 'vendor';
    const reqAdmin = isVendor ? '' : 'required';
    const hideAdmin = isVendor ? 'style="display:none"' : '';
    
    // 포트 리스트에서 유니크 국가 추출
    const countries = Array.from(new Set(ports.map(p => p.country))).map(c => {
      const p = ports.find(pt => pt.country === c);
      return { code: c, name: p.countryName };
    });
    
    return `
    <div class="page-header">
      <div class="page-title"><span class="page-icon">📝</span><div>
        <h1>${editId ? '인보이스 수정 (Edit Invoice)' : '인보이스 등록 (Register Invoice)'}</h1>
        <div class="page-subtitle">인보이스 커버페이지 자동 생성 및 데이터 추출 (Auto-generate cover & extract data)</div>
      </div></div>
      <div class="page-actions"><button class="btn btn-secondary" onclick="App.navigateTo('list')">← 목록으로 (Back)</button></div>
    </div>
    <div class="page-body">
      <div id="duplicateWarningArea"></div>
      
      <div class="split-view">
        <!-- Left: Upload & Viewer -->
        <div class="split-view-left">
          <div class="upload-zone" id="uploadZone" onclick="document.getElementById('invoiceFileInput').click()" ondragover="InvoiceManager.handleDragOver(event)" ondragleave="InvoiceManager.handleDragLeave(event)" ondrop="InvoiceManager.handleDrop(event)">
            <div class="upload-icon">📄</div>
            <div class="upload-title">인보이스 파일 첨부 (Upload Invoice)</div>
            <div class="upload-desc">PDF, JPG/PNG (Drag & Drop)</div>
            <input type="file" id="invoiceFileInput" accept=".pdf,image/*" onchange="InvoiceManager.handleFileSelect(event)">
          </div>
          
          <div class="file-viewer" id="fileViewer" style="display:none">
            <div class="file-viewer-header">
              <div class="file-name" id="fileNameDisplay"></div>
              <button type="button" class="btn btn-ghost btn-sm" onclick="InvoiceManager.resetUpload()">취소 (Cancel)</button>
            </div>
            <div class="file-viewer-body" id="fileContentArea"></div>
            
            <div class="extraction-overlay" id="extractionOverlay">
              <div class="scanner-line"></div>
              <div class="extraction-info">
                <div class="spinner"></div>
                <div class="ext-title">데이터 분석 중... (Extracting data...)</div>
                <div class="ext-progress" id="extProgress">0%</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Invoice Form -->
        <div class="split-view-right">
          <form id="invoiceForm" onsubmit="InvoiceManager.handleSubmit(event,'${editId||''}')">
            <div class="glass-card animate-in" style="margin-bottom:16px">
              <div class="card-header"><h3>🚢 선박 및 작업 정보 (Vessel & Work Info)</h3></div>
              <div class="form-grid-3">
                <div class="form-group"><label class="form-label">선박명 (Vessel) <span class="required">*</span></label>
                  <input type="text" class="form-input" id="vesselName" list="vesselsList" required onchange="InvoiceManager.onVesselChange()" value="${inv?.vesselName||''}" placeholder="선택 또는 직접 입력">
                  <datalist id="vesselsList">
                    ${vessels.map(v=>`<option value="${v.vesselName}"></option>`).join('')}
                  </datalist>
                </div>
                <div class="form-group"><label class="form-label">선박코드 (Vessel Code)</label>
                  <input class="form-input" id="vesselCode" readonly value="${inv?.vesselCode||''}" placeholder="자동입력 (Auto)"></div>
                <div class="form-group"><label class="form-label">R.O 번호 (R.O No.) <span class="required">*</span></label>
                  <input class="form-input" type="text" id="orderNo" required value="${inv?.orderNo||''}" placeholder="숫자 8자리 입력 (8 digits)" pattern="\\d{8}" maxlength="8" oninput="this.value=this.value.replace(/\\D/g,'');InvoiceManager.checkDuplicate()"></div>
              </div>
              <div class="form-grid-2" ${hideAdmin}>
                <div class="form-group"><label class="form-label">비용 구분 (Cost Category) <span class="required">*</span></label>
                  <select class="form-select" id="category" ${reqAdmin} onchange="InvoiceManager.onCategoryChange()"><option value="">-- 선택 (Select) --</option>
                    ${categories.map(c=>`<option value="${c.name}" ${inv?.category===c.name?'selected':''}>${c.nameKo}</option>`).join('')}
                  </select></div>
                <div class="form-group"><label class="form-label">기기 분류 (Eq. Category) <span class="required">*</span></label>
                  <select class="form-select" id="kind" ${reqAdmin} onchange="InvoiceManager.onKindChange()"><option value="">-- 비용 구분을 선택하세요 --</option>
                    ${kinds.map(k=>`<option value="${k.name}" data-category="${k.category}" data-glv="${k.glv}" data-gms="${k.gms}" ${inv?.kind===k.name?'selected':''}>${k.nameKo}</option>`).join('')}
                  </select></div>
              </div>
              <div class="form-grid-2" ${hideAdmin}>
                <div class="form-group"><label class="form-label">GMS 코드</label>
                  <input class="form-input" type="text" id="gmsCode" readonly value="${inv?.gmsCode||''}" placeholder="자동입력" style="background-color: var(--bg-level2);"></div>
                <div class="form-group"><label class="form-label">GLV 코드</label>
                  <input class="form-input" type="text" id="glvCode" readonly value="${inv?.acctNo||''}" placeholder="자동입력" style="background-color: var(--bg-level2);"></div>
              </div>
              <div class="form-group"><label class="form-label">작업상세 내역 (Work Description) <span class="required">*</span></label>
                <textarea class="form-textarea" id="workDescription" required rows="3">${inv?.workDescription||''}</textarea></div>
            </div>
            
            <div class="glass-card animate-in" style="margin-bottom:16px">
              <div class="card-header"><h3>💰 금액 정보 (Amount Info)</h3></div>
              <div class="form-grid-3">
                <div class="form-group"><label class="form-label">통화 (Currency) <span class="required">*</span></label>
                  <select class="form-select" id="currency" required>
                    ${['USD','KRW','EUR','JPY','SGD'].map(c=>`<option value="${c}" ${(inv?.currency||'USD')===c?'selected':''}>${c}</option>`).join('')}
                  </select></div>
                <div class="form-group"><label class="form-label">견적금액 (Estimated) <span class="required">*</span></label>
                  <input class="form-input" type="text" id="estimatedAmount" required value="${inv?.estimatedAmount ? Number(inv.estimatedAmount).toLocaleString() : ''}" oninput="InvoiceManager.formatNumberInput(this)"></div>
                <div class="form-group"><label class="form-label">실제발생금액 (Actual) <span class="required">*</span></label>
                  <input class="form-input" type="text" id="actualAmount" required value="${inv?.actualAmount ? Number(inv.actualAmount).toLocaleString() : ''}" oninput="InvoiceManager.formatNumberInput(this)"></div>
              </div>
              <div class="form-grid-2" ${hideAdmin}>
                <div class="form-group"><label class="form-label">견적가대비 실적가 차이 (Difference)</label><div class="form-calculated" id="differenceDisplay">-</div></div>
                <div class="form-group"><label class="form-label">차이율 (Diff Rate) (%)</label><div class="form-calculated" id="differenceRateDisplay">-</div></div>
              </div>
            </div>
            
            <div class="glass-card animate-in" style="margin-bottom:16px">
              <div class="card-header"><h3>📅 일정 및 작업항구 (Schedule & Port)</h3></div>
              <div class="form-grid-2" style="margin-bottom:12px;">
                <div class="form-group"><label class="form-label">인보이스 일자 (Invoice Date) <span class="required">*</span></label>
                  <input class="form-input" type="date" id="invoiceDate" required value="${inv?.invoiceDate||''}"></div>
              </div>
              <div class="form-grid-3">
                <div class="form-group"><label class="form-label">작업시작일 (Work Start) <span class="required">*</span></label>
                  <input class="form-input" type="date" id="workStartDate" required value="${inv?.workStartDate||''}"></div>
                <div class="form-group"><label class="form-label">작업종료일 (Work End) <span class="required">*</span></label>
                  <input class="form-input" type="date" id="workEndDate" required value="${inv?.workEndDate||''}"></div>
                <div class="form-group"><label class="form-label">국가 (Country) <span class="required">*</span></label>
                  <select class="form-select" id="workCountry" onchange="InvoiceManager.onCountryChange()" required>
                    <option value="">-- 선택 (Select) --</option>
                    ${countries.map(c => `<option value="${c.code}">${c.name}</option>`).join('')}
                  </select>
                </div>
              </div>
              <div class="form-grid-3" style="margin-top:12px;">
                <div class="form-group"><label class="form-label">작업항구 (Port) <span class="required">*</span></label>
                  <div style="display:flex;gap:8px;">
                    <select class="form-select" id="workPort" required style="flex:1;">
                      <option value="">국가를 먼저 선택하세요</option>
                    </select>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('manualPortContainer').style.display='block';document.getElementById('manualPort').focus();" title="목록에 없는 항구 수기 입력">+</button>
                  </div>
                </div>
                <div class="form-group" id="manualPortContainer" style="display:none;"><label class="form-label">직접 입력 (Manual Port)</label>
                  <input class="form-input" type="text" id="manualPort" placeholder="항구명 입력">
                </div>
              </div>
            </div>
            
            ${isVendor ? '' : `
            <div class="glass-card animate-in" style="margin-bottom:16px">
              <div class="card-header"><h3>📋 추가 정보 (Additional Info)</h3></div>
              <div class="form-grid-2">
                <div class="form-group"><label class="form-label">계획반영여부 (Planned)</label>
                  <div class="toggle-switch"><div class="toggle-track ${inv?.isPlanned!==false?'active':''}" id="isPlannedToggle" onclick="this.classList.toggle('active')"></div>
                  <span class="toggle-label">${inv?.isPlanned!==false?'예 (Yes)':'아니오 (No)'}</span></div></div>
                <div class="form-group"><label class="form-label">운항담당자 협의여부 (Ops Consultation)</label>
                  <div class="toggle-switch"><div class="toggle-track ${inv?.opsConsulted!==false?'active':''}" id="opsConsultedToggle" onclick="this.classList.toggle('active')"></div>
                  <span class="toggle-label">${inv?.opsConsulted!==false?'예 (Yes)':'아니오 (No)'}</span></div></div>
              </div>
              <div class="form-group"><label class="form-label">발생사유 (Reason)</label>
                <textarea class="form-textarea" id="reason" rows="2">${inv?.reason||''}</textarea></div>
              <div class="form-group"><label class="form-label">특기사항 (Remarks)</label>
                <textarea class="form-textarea" id="remarks" rows="2">${inv?.remarks||''}</textarea></div>
            </div>
            `}
            
            <div style="display:flex;gap:12px;justify-content:flex-end">
              <button type="button" class="btn btn-secondary btn-lg" onclick="App.navigateTo('list')">취소 (Cancel)</button>
              ${isVendor 
                ? `<button type="submit" class="btn btn-primary btn-lg" id="submitBtn">📤 ${isKo ? '인보이스 제출하기' : 'Submit Invoice'}</button>`
                : `<button type="submit" class="btn btn-primary btn-lg" id="submitBtn">💾 ${editId ? (isKo ? '수정하기' : 'Update Invoice') : (isKo ? '인보이스 등록하기' : 'Register Invoice')}</button>`
              }
            </div>
          </form>
        </div>
      </div>
    </div>`;
  }


  function onVesselChange() {
    const vName = document.getElementById('vesselName').value.trim();
    const vessel = Storage.getVessels().find(v => v.vesselName === vName);
    document.getElementById('vesselCode').value = vessel ? vessel.vesselCode : '';
  }

  function onCategoryChange() {
    const s = document.getElementById('category');
    const kindSelect = document.getElementById('kind');
    if (!s || !kindSelect) return;
    
    const cat = s.value;
    const kinds = Storage.getKinds();
    
    // 이전에 선택된 기기분류 값 보존
    const prevKind = kindSelect.value;
    
    // 기기 분류 옵션 업데이트
    kindSelect.innerHTML = '<option value="">-- 기기 분류 선택 --</option>';
    if (cat) {
      const filtered = kinds.filter(k => k.category === cat);
      filtered.forEach(k => {
        kindSelect.innerHTML += `<option value="${k.name}" data-category="${k.category}" data-glv="${k.glv}" data-gms="${k.gms}">${k.nameKo}</option>`;
      });
      
      // 혹시 이전 값이 현재 목록에 있으면 다시 선택
      if (filtered.find(k => k.name === prevKind)) {
        kindSelect.value = prevKind;
      }
    }
    onKindChange(); // GMS, GLV 업데이트
  }

  function onKindChange(){
    const gmsEl = document.getElementById('gmsCode');
    const glvEl = document.getElementById('glvCode');
    const s = document.getElementById('kind');
    const cat = document.getElementById('category')?.value || '';
    if (!s || !gmsEl || !glvEl) return;
    const o = s.options[s.selectedIndex];
    if (o && o.value) {
      let gms = o.dataset.gms || '';
      let glv = o.dataset.glv || '';
      if (!gms || !glv) {
        const fb = Storage.lookupGmsGlvByCostAndKind(cat, o.value);
        if (fb) { gms = fb.gms; glv = fb.glv; }
      }
      gmsEl.value = gms;
      glvEl.value = glv;
    } else {
      gmsEl.value = '';
      glvEl.value = '';
    }
  }

  function formatNumberInput(el) {
    let val = el.value.replace(/\D/g, '');
    if (val) val = Number(val).toLocaleString();
    el.value = val;
    calcDifference();
  }

  function onCountryChange() {
    const c = document.getElementById('workCountry').value;
    const portSelect = document.getElementById('workPort');
    portSelect.innerHTML = '<option value="">-- 선택 (Select) --</option>';
    if(c) {
      Storage.getPorts().filter(p => p.country === c).forEach(p => {
        portSelect.innerHTML += `<option value="${p.name}">${p.nameKo} (${p.name})</option>`;
      });
    }
  }

  function calcDifference(){
    const estStr = document.getElementById('estimatedAmount')?.value.replace(/,/g, '') || '0';
    const actStr = document.getElementById('actualAmount')?.value.replace(/,/g, '') || '0';
    const est=parseFloat(estStr)||0, act=parseFloat(actStr)||0,
      diff=act-est, rate=est>0?((diff/est)*100).toFixed(1):0,
      cur=document.getElementById('currency')?.value||'USD',
      dEl=document.getElementById('differenceDisplay'),rEl=document.getElementById('differenceRateDisplay');
    if(dEl){dEl.textContent=(diff>=0?'+':'')+CoverGenerator.formatCurrency(diff,cur);dEl.className='form-calculated'+(diff>0?' danger':'');}
    if(rEl){rEl.textContent=(rate>=0?'+':'')+rate+'%';rEl.className='form-calculated'+(Math.abs(rate)>20?' danger':Math.abs(rate)>10?' warning':'');}
  }

  function checkDuplicate(){
    const orderNo=document.getElementById('orderNo')?.value?.trim();
    const btn = document.getElementById('submitBtn');
    if(!orderNo||orderNo.length!==8){
      document.getElementById('duplicateWarningArea').innerHTML=''; 
      if(btn) btn.disabled = false;
      return;
    }
    const invoices=Storage.getInvoices();
    const dups=invoices.filter(i=>i.orderNo&&i.orderNo.toLowerCase()===orderNo.toLowerCase());
    const area=document.getElementById('duplicateWarningArea');
    if(dups.length>0){
      area.innerHTML=`<div class="duplicate-warning"><h4>⚠️ 이미 등록된 R.O 번호입니다 (Duplicate R.O Number)</h4>
        ${dups.map(d=>`<div class="dup-item"><strong>${d.id}</strong> - ${d.vesselName} - RO${d.orderNo}<br>${d.workDescription}</div>`).join('')}
        <p style="font-size:0.78rem;color:var(--text-muted);margin-top:8px">중복된 인보이스는 제출할 수 없습니다. 번호를 다시 확인해주세요.</p></div>`;
      if(btn) btn.disabled = true;
    } else {
      area.innerHTML='';
      if(btn) btn.disabled = false;
    }
  }

  function handleSubmit(event,editId){
    event.preventDefault();const isKo=App.getLang()==='ko';
    const est=parseFloat(document.getElementById('estimatedAmount').value.replace(/,/g, ''))||0,
      act=parseFloat(document.getElementById('actualAmount').value.replace(/,/g, ''))||0,diff=act-est,
      rate=est>0?Number(((diff/est)*100).toFixed(1)):0;
    
    let wPort = document.getElementById('workPort').value;
    if(document.getElementById('manualPortContainer').style.display === 'block') {
      wPort = document.getElementById('manualPort').value.trim();
    }
      
    const data={vesselName:document.getElementById('vesselName').value,vesselCode:document.getElementById('vesselCode').value,
      kind:document.getElementById('kind')?.value||'',orderNo:document.getElementById('orderNo').value.trim(),
      acctNo:document.getElementById('glvCode')?.value||'',category:document.getElementById('category')?.value||'',
      gmsCode:document.getElementById('gmsCode')?.value||'',
      workDescription:document.getElementById('workDescription').value.trim(),currency:document.getElementById('currency').value,
      estimatedAmount:est,actualAmount:act,difference:diff,differenceRate:rate,
      invoiceDate:document.getElementById('invoiceDate').value,
      workStartDate:document.getElementById('workStartDate').value,workEndDate:document.getElementById('workEndDate').value,
      workPort:wPort,
      isPlanned:document.getElementById('isPlannedToggle')?.classList.contains('active')??true,
      opsConsulted:document.getElementById('opsConsultedToggle')?.classList.contains('active')??true,
      reason:document.getElementById('reason')?.value?.trim()||'',remarks:document.getElementById('remarks')?.value?.trim()||''};
      
    if(editId){
      Storage.updateInvoice(editId,data);
      App.showToast('success',isKo?'수정 완료':'Updated',isKo?'인보이스가 수정되었습니다.':'Invoice updated.');
      App.navigateTo('list');
    }
    else{
      data.status='접수';data.isDuplicate=false;data.duplicateWarnings=[];data.approval={supervisor:{name:null,date:null,status:'pending',comment:''},teamLead:{name:null,date:null,status:'pending',comment:''}};
      const u = App.getCurrentUser();
      data.createdBy=u?.id||'admin';
      data.vendorId=u?.vendorId||'';
      data.vendorName=u?.name||'';
      const saved=Storage.addInvoice(data);
      App.showToast('success',isKo?'등록 완료':'Registered',`${saved.id} ${isKo?'등록되었습니다.':'registered.'}`);
      // Notification
      if (typeof NotificationCenter !== 'undefined') {
        NotificationCenter.notifySubmit(saved.id, data.vesselName);
      }
      if(u && u.role === 'vendor') {
        App.navigateTo('list');
        // 메일 수신 화면 시뮬레이션 표시
        if (typeof NotificationCenter !== 'undefined') {
          setTimeout(() => NotificationCenter.simulateEmailPreview(saved), 100);
        }
      }
      else CoverGenerator.showPreviewModal(saved,App.getLang());
    }
  }

  function renderListPage(lang='ko'){
    const isKo=lang==='ko',t=(k,e)=>isKo?k:e;
    const user = App.getCurrentUser();
    const isAdmin = user && user.role !== 'vendor';
    let invoices = getListRowsForUser();
    invoices = sortInvoiceList(invoices, listSortKey, listSortDir);
    return `
    <div class="page-header"><div class="page-title"><span class="page-icon">📋</span><div>
      <h1>인보이스 진행현황 (Invoice List)</h1><div class="page-subtitle">총 ${invoices.length}건 (Total ${invoices.length} items)</div>
    </div></div><div class="page-actions">
      <button class="btn btn-ghost" onclick="ExcelExporter.exportInvoiceList()" title="Excel">📥 Excel</button>
      <button class="btn btn-secondary" onclick="Storage.downloadCSV()">📥 CSV</button>
      <button class="btn btn-primary" onclick="App.navigateTo('register')">+ 새 인보이스 (New Invoice)</button>
    </div></div>
    <div class="page-body">
      <div class="glass-card" style="margin-bottom:16px;padding:14px 16px">
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
          <div class="search-bar" style="flex:1;min-width:200px"><span class="search-icon">🔍</span>
            <input type="text" id="searchInput" placeholder="선박명, R.O번호 검색... (Search Vessel, R.O...)" oninput="InvoiceManager.filterList()"></div>
          <select class="form-select" id="filterStatus" style="width:140px" onchange="InvoiceManager.filterList()">
            <option value="">전체 상태 (All Status)</option><option value="접수">접수 (Received)</option>
            <option value="감독확인완료">감독확인완료 (Supervisor)</option><option value="팀장확인완료">팀장확인완료 (Team Lead)</option>
            <option value="지급완료">지급완료 (Paid)</option></select>
          <select class="form-select" id="filterVessel" style="width:160px" onchange="InvoiceManager.filterList()">
            <option value="">전체 선박 (All Vessels)</option>
            ${Storage.getVessels().map(v=>`<option value="${v.vesselName}">${v.vesselName}</option>`).join('')}</select>
          <select class="form-select" id="filterKind" style="width:140px; ${isAdmin ? '' : 'display:none'}" onchange="InvoiceManager.filterList()">
            <option value="">전체 Kind (All Kinds)</option>
            ${Storage.getKinds().map(k=>`<option value="${k.name}">${k.nameKo} (${k.name})</option>`).join('')}</select>
        </div>
      </div>
      <div id="invoiceTableContainer">${renderTable(invoices,isKo)}</div>
    </div>`;
  }

  function renderTable(invoices,isKo){
    const t=(k,e)=>isKo?k:e;
    const user = App.getCurrentUser();
    const isAdmin = user && user.role !== 'vendor';
    if(!invoices.length)return `<div class="glass-card"><div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">인보이스가 없습니다 (No invoices)</div><button class="btn btn-primary" onclick="App.navigateTo('register')">+ 새 인보이스 (New)</button></div></div>`;
    const head = [
      renderListSortHeader('id', 'ID', isKo),
      renderListSortHeader('createdAt', '접수 일자 (Rcv Date)', isKo),
      renderListSortHeader('invoiceDate', '발행 일자 (Inv Date)', isKo),
      renderListSortHeader('vesselName', '선박명 (Vessel)', isKo),
      renderListSortHeader('vesselCode', '선박코드 (Code)', isKo),
      renderListSortHeader('vesselType', '유형', isKo)
    ];
    if (isAdmin) {
      head.push(
        renderListSortHeader('category', '비용 구분 (Cost)', isKo),
        renderListSortHeader('kind', '기기 분류 (Eq)', isKo),
        renderListSortHeader('gmsCode', 'GMS 코드', isKo),
        renderListSortHeader('acctNo', 'GLV 코드', isKo)
      );
    }
    head.push(
      renderListSortHeader('orderNo', 'R.O No.', isKo),
      renderListSortHeader('workDescription', '작업내용 (Work)', isKo),
      renderListSortHeader('estimatedAmount', '견적 (Est.)', isKo, true),
      renderListSortHeader('actualAmount', '실적 (Actual)', isKo, true),
      renderListSortHeader('differenceRate', '차이율 (Diff%)', isKo, true)
    );
    if (isAdmin) {
      head.push(
        renderListSortHeader('planned', '계획 (Plan)', isKo),
        renderListSortHeader('opsConsulted', '운항 (Ops)', isKo),
        renderListSortHeader('reason', '사유 (Reason)', isKo),
        renderListSortHeader('remarks', '특기사항 (Remarks)', isKo)
      );
    }
    head.push(renderListSortHeader('status', '상태 (Status)', isKo));
    head.push('<th style="white-space:nowrap">액션 (Act)</th>');
    return `<div class="table-container glass-card" style="padding:0;overflow-x:auto;overflow-y:auto;max-height:75vh"><table class="data-table" style="min-width:2400px"><thead style="position:sticky;top:0;z-index:10;background:var(--bg-secondary,#0d1b3e)"><tr>${head.join('')}</tr></thead><tbody>${invoices.map(inv=>{
      const dc=inv.differenceRate>0?'diff-positive':inv.differenceRate<0?'diff-negative':'diff-neutral';
      const isApproved = inv.status === '팀장확인완료' || inv.status === '지급완료';
      return `<tr>
        <td><span ${isAdmin ? `style="color:var(--text-accent);cursor:pointer;font-weight:bold" onclick="App.navigateTo('register', '${inv.id}')"` : `style="font-weight:bold"`}>${inv.id}</span></td>
        <td style="font-size:0.85rem;color:var(--text-muted)">${inv.createdAt?new Date(inv.createdAt).toISOString().split('T')[0]:'-'}</td>
        <td style="font-size:0.85rem;font-weight:500;color:var(--text-primary)">${inv.invoiceDate||'-'}</td>
        <td style="font-weight:500;color:var(--text-primary)">${inv.vesselName}</td>
        <td style="font-size:0.8rem;color:var(--text-muted)">${inv.vesselCode}</td>
        <td>${App.getVesselTypeBadge(inv.vesselName)}</td>
        ${isAdmin ? `
          <td>
            <select class="form-select" onchange="InvoiceManager.updateInlineCategory('${inv.id}', this.value)" style="padding:2px 4px;font-size:0.75rem;min-width:100px;background-color:rgba(255,255,255,0.05)">
              <option value="">- 선택 -</option>
              ${Storage.getCategories().map(c=>`<option value="${c.name}" ${inv.category===c.name?'selected':''}>${c.nameKo}</option>`).join('')}
            </select>
          </td>
          <td>
            <select class="form-select" id="inline_kind_${inv.id}" onchange="InvoiceManager.updateInlineKind('${inv.id}', this.value)" style="padding:2px 4px;font-size:0.75rem;min-width:140px;background-color:rgba(255,255,255,0.05)">
              <option value="">- 기기 분류 -</option>
              ${inv.category ? Storage.getKinds().filter(k=>k.category===inv.category).map(k=>`<option value="${k.name}" ${inv.kind===k.name?'selected':''}>${k.nameKo}</option>`).join('') : ''}
            </select>
          </td>
          <td style="text-align:center">
            <div id="inline_gms_${inv.id}" style="font-size:0.8rem;font-weight:600;color:var(--text-primary)">${inv.gmsCode||'-'}</div>
          </td>
          <td style="text-align:center">
            <div id="inline_glv_${inv.id}" style="font-size:0.75rem;color:var(--text-muted)">${inv.acctNo||'-'}</div>
          </td>` : ''}<td>${isAdmin ? 'RO ' : ''}${inv.orderNo}</td>
        <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${isKo?inv.workDescriptionKo||inv.workDescription:inv.workDescription}</td>
        <td style="text-align:right">${CoverGenerator.formatCurrency(inv.estimatedAmount,inv.currency)}</td>
        <td style="text-align:right;font-weight:600">${CoverGenerator.formatCurrency(inv.actualAmount,inv.currency)}</td>
        <td style="text-align:right" class="${dc}">${inv.differenceRate>=0?'+':''}${inv.differenceRate}%</td>
        ${isAdmin ? `
          <td style="text-align:center">
            <div class="toggle-track ${inv.planned?'active':''}" onclick="InvoiceManager.toggleInlineField('${inv.id}','planned',this)" style="display:inline-block;width:36px;height:20px;cursor:pointer" title="${inv.planned?'Y':'N'}"></div>
          </td>
          <td style="text-align:center">
            <div class="toggle-track ${inv.opsConsulted?'active':''}" onclick="InvoiceManager.toggleInlineField('${inv.id}','opsConsulted',this)" style="display:inline-block;width:36px;height:20px;cursor:pointer" title="${inv.opsConsulted?'Y':'N'}"></div>
          </td>
          <td>
            <div onclick="InvoiceManager.openTextModal('${inv.id}','reason')" style="padding:4px 8px;font-size:0.75rem;min-width:100px;background:rgba(255,255,255,0.05);border-radius:4px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px;border:1px solid rgba(255,255,255,0.1)" title="${inv.reason||'클릭하여 입력'}">${inv.reason || '<span style="color:var(--text-muted)">클릭하여 입력</span>'}</div>
          </td>
          <td>
            <div onclick="InvoiceManager.openTextModal('${inv.id}','remarks')" style="padding:4px 8px;font-size:0.75rem;min-width:100px;background:rgba(255,255,255,0.05);border-radius:4px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px;border:1px solid rgba(255,255,255,0.1)" title="${inv.remarks||'클릭하여 입력'}">${inv.remarks || '<span style="color:var(--text-muted)">클릭하여 입력</span>'}</div>
          </td>
        ` : ''}
        <td>${ApprovalWorkflow.getStatusBadge(inv.status,isKo)}</td>
        <td style="white-space:nowrap">
          ${(inv.status === '팀장확인완료' || inv.status === '결재완료' || inv.status === '지급완료') && isAdmin ? `<button class="btn btn-outline btn-sm" onclick="CoverGenerator.printCover(Storage.getInvoice('${inv.id}'),App.getLang())">🖨️ ${isKo ? '커버 출력' : 'Print Cover'}</button>` : ''}
          ${user && user.role === 'supervisor' && (inv.status === '접수' || inv.status === '신규접수' || inv.status === '제출완료') ? `<button class="btn btn-primary btn-sm" onclick="InvoiceManager.approveAsSupervisor('${inv.id}')">✏️ ${isKo ? '감독 승인':'Sup. Approve'}</button>` : ''}
          ${user && user.role === 'teamlead' && (inv.status === '감독확인' || inv.status === '감독확인완료') ? `<button class="btn btn-secondary btn-sm" onclick="InvoiceManager.approveAsTeamLead('${inv.id}')" style="background:#8b5cf6;color:white;border:none">✍️ ${isKo ? '팀장 승인':'TL Approve'}</button>` : ''}
          <button class="btn btn-ghost btn-sm" onclick="App.navigateTo('register','${inv.id}')" title="수정 (Edit)">✏️</button>
          <button class="btn btn-ghost btn-sm" onclick="InvoiceManager.confirmDelete('${inv.id}')" title="삭제 (Delete)">🗑️</button>
        </td>
      </tr>`;}).join('')}</tbody></table></div>`;
  }

  function filterList(){
    const isKo = App.getLang() === 'ko';
    let inv = getListFilteredFromDom();
    inv = sortInvoiceList(inv, listSortKey, listSortDir);
    const container = document.querySelector('.table-container');
    const scrollLeft = container ? container.scrollLeft : 0;
    
    document.getElementById('invoiceTableContainer').innerHTML=renderTable(inv,isKo);
    
    const newContainer = document.querySelector('.table-container');
    if (newContainer) newContainer.scrollLeft = scrollLeft;
  }

  function confirmDelete(id){const isKo=App.getLang()==='ko';if(confirm(isKo?`${id} 삭제하시겠습니까?`:`Delete ${id}?`)){Storage.deleteInvoice(id);App.showToast('info',isKo?'삭제':'Deleted','');App.navigateTo('list');}}

  /* ---- Upload & Extraction Handlers ---- */
  function handleDragOver(e) {
    e.preventDefault();
    document.getElementById('uploadZone')?.classList.add('dragover');
  }

  function handleDragLeave(e) {
    e.preventDefault();
    document.getElementById('uploadZone')?.classList.remove('dragover');
  }

  function handleDrop(e) {
    e.preventDefault();
    document.getElementById('uploadZone')?.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }

  function handleFileSelect(e) {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  }

  function processFile(file) {
    document.getElementById('uploadZone').style.display = 'none';
    const viewer = document.getElementById('fileViewer');
    viewer.style.display = 'flex';
    document.getElementById('fileNameDisplay').textContent = file.name;

    const contentArea = document.getElementById('fileContentArea');
    contentArea.innerHTML = '';
    
    // Display preview
    const url = URL.createObjectURL(file);
    if (file.type.includes('image/')) {
      contentArea.innerHTML = `<img src="${url}" alt="Preview">`;
    } else if (file.type === 'application/pdf') {
      contentArea.innerHTML = `<iframe src="${url}#toolbar=0" frameborder="0"></iframe>`;
    } else {
      contentArea.innerHTML = `<div style="color:#fff">Preview not available</div>`;
    }

    // Start OCR Simulation
    const overlay = document.getElementById('extractionOverlay');
    overlay.classList.add('active');
    
    OcrService.extractData(file, 
      (progress) => {
        document.getElementById('extProgress').textContent = progress + '%';
      },
      (data) => {
        overlay.classList.remove('active');
        fillFormWithExtractedData(data);
        const isKo = App.getLang() === 'ko';
        App.showToast('success', isKo ? '추출 성공' : 'Extraction Success', 
          isKo ? '데이터가 자동으로 입력되었습니다.' : 'Data has been automatically filled.');
      },
      App.getLang()
    );
  }

  function resetUpload() {
    document.getElementById('fileViewer').style.display = 'none';
    document.getElementById('uploadZone').style.display = 'flex';
    document.getElementById('invoiceFileInput').value = '';
    document.getElementById('fileContentArea').innerHTML = '';
  }

  function fillFormWithExtractedData(data) {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && val) {
        el.value = val;
        el.style.borderColor = 'var(--accent-emerald)'; // Highlight updated fields
        setTimeout(() => el.style.borderColor = '', 2000);
      }
    };
    
    setVal('vesselName', data.vesselName);
    onVesselChange();
    setVal('category', data.category);
    onCategoryChange();
    setVal('kind', data.kind);
    onKindChange();
    setVal('orderNo', data.orderNo);
    setVal('acctNo', data.acctNo);
    setVal('workDescription', data.workDescription);
    setVal('estimatedAmount', data.estimatedAmount);
    setVal('actualAmount', data.actualAmount);
    setVal('workStartDate', data.workStartDate);
    setVal('workEndDate', data.workEndDate);
    setVal('workPort', data.workPort);
    
    calcDifference();
    checkDuplicate();
  }

  /* ---- Inline List Editors ---- */
  function updateInlineCategory(id, categoryName) {
    const inv = Storage.getInvoice(id);
    if (!inv) return;
    inv.category = categoryName;
    inv.kind = '';
    inv.gmsCode = '';
    inv.acctNo = '';
    Storage.updateInvoice(id, inv);
    
    const kindSelect = document.getElementById(`inline_kind_${id}`);
    if (kindSelect) {
      kindSelect.innerHTML = '<option value="">- 기기 분류 -</option>' + 
        Storage.getKinds().filter(k => k.category === categoryName)
          .map(k => `<option value="${k.name}">${k.nameKo}</option>`).join('');
    }
    
    const gmsDiv = document.getElementById(`inline_gms_${id}`);
    if (gmsDiv) gmsDiv.textContent = '-';
    const glvDiv = document.getElementById(`inline_glv_${id}`);
    if (glvDiv) glvDiv.textContent = '-';
  }

  function updateInlineKind(id, kindName) {
    const inv = Storage.getInvoice(id);
    if (!inv) return;
    const pair = kindName
      ? (Storage.lookupGmsGlvByCostAndKind(inv.category, kindName)
        || (() => {
          const k = Storage.getKinds().find(x => x.name === kindName && x.category === inv.category)
            || Storage.getKinds().find(x => x.name === kindName);
          return k && k.gms && k.glv ? { gms: k.gms, glv: k.glv } : null;
        })())
      : null;
    if (pair) {
      inv.kind = kindName;
      inv.gmsCode = pair.gms;
      inv.acctNo = pair.glv;
    } else {
      inv.kind = kindName || '';
      inv.gmsCode = '';
      inv.acctNo = '';
    }
    Storage.updateInvoice(id, inv);
    
    const gmsDiv = document.getElementById(`inline_gms_${id}`);
    if (gmsDiv) gmsDiv.textContent = inv.gmsCode || '-';
    const glvDiv = document.getElementById(`inline_glv_${id}`);
    if (glvDiv) glvDiv.textContent = inv.acctNo || '-';
  }

  function toggleInlineField(id, field, el) {
    const inv = Storage.getInvoice(id);
    if (!inv) return;
    inv[field] = !inv[field];
    Storage.updateInvoice(id, inv);
    if (el) {
      el.classList.toggle('active', inv[field]);
      el.title = inv[field] ? 'Y' : 'N';
    }
  }

  function updateInlineText(id, field, value) {
    const inv = Storage.getInvoice(id);
    if (!inv) return;
    inv[field] = value;
    Storage.updateInvoice(id, inv);
  }

  function openTextModal(id, field) {
    const inv = Storage.getInvoice(id);
    if (!inv) return;
    const isKo = App.getLang() === 'ko';
    const title = field === 'reason' ? (isKo ? '사유 (Reason)' : 'Reason') : (isKo ? '특기사항 (Remarks)' : 'Remarks');
    const currentValue = inv[field] || '';

    const modalHtml = `
      <div id="textModalOverlay" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;">
        <div class="glass-card" style="width:500px;max-width:90%;background:var(--card-bg);padding:24px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1);">
          <h3 style="margin-top:0;margin-bottom:16px;">✏️ ${title} 입력</h3>
          <textarea id="modalTextArea" class="form-input" style="width:100%;height:150px;resize:none;padding:12px;font-size:0.9rem;" placeholder="내용을 자세히 입력하세요...">${currentValue}</textarea>
          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;">
            <button class="btn btn-ghost" onclick="document.getElementById('textModalOverlay').remove()">취소 (Cancel)</button>
            <button class="btn btn-primary" onclick="InvoiceManager.saveModalText('${id}', '${field}')">저장 (Save)</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('modalTextArea').focus();
  }

  function saveModalText(id, field) {
    const val = document.getElementById('modalTextArea').value;
    updateInlineText(id, field, val);
    const overlay = document.getElementById('textModalOverlay');
    if (overlay) overlay.remove();
    filterList(); // Re-render the table to show updated text
  }

  function approveAsSupervisor(id) {
    const isKo = App.getLang() === 'ko';
    if (!confirm(isKo ? '해당 인보이스를 감독 승인 처리하시겠습니까?' : 'Approve this invoice as supervisor?')) return;
    const inv = Storage.getInvoice(id);
    if (!inv) return;
    const user = App.getCurrentUser();
    
    inv.status = '감독확인완료';
    inv.approval = inv.approval || {};
    inv.approval.supervisor = {
      name: user ? user.name : '시스템',
      date: new Date().toISOString().slice(0, 10),
      status: 'approved'
    };
    Storage.updateInvoice(id, inv);
    App.showToast('success', isKo ? '승인 완료' : 'Approved', isKo ? '감독 승인이 완료되었습니다.' : 'Supervisor approval completed.');
    filterList();
    if(typeof NotificationCenter !== 'undefined') NotificationCenter.logActivity({action:'approve', detail: `${id} 감독 승인`});
  }

  function approveAsTeamLead(id) {
    const isKo = App.getLang() === 'ko';
    if (!confirm(isKo ? '해당 인보이스를 팀장 승인 처리하시겠습니까?' : 'Approve this invoice as team lead?')) return;
    const inv = Storage.getInvoice(id);
    if (!inv) return;
    const user = App.getCurrentUser();
    
    inv.status = '팀장확인완료';
    inv.approval = inv.approval || {};
    inv.approval.teamLead = {
      name: user ? user.name : '시스템',
      date: new Date().toISOString().slice(0, 10),
      status: 'approved'
    };
    Storage.updateInvoice(id, inv);
    App.showToast('success', isKo ? '승인 완료' : 'Approved', isKo ? '팀장 승인이 완료되었습니다.' : 'Team Lead approval completed.');
    filterList();
    if(typeof NotificationCenter !== 'undefined') NotificationCenter.logActivity({action:'approve', detail: `${id} 팀장 승인`});
  }

  return {
    renderRegisterPage, renderListPage, onVesselChange, onKindChange, onCategoryChange, calcDifference, 
    checkDuplicate, handleSubmit, filterList, toggleListSort, confirmDelete,
    handleDragOver, handleDragLeave, handleDrop, handleFileSelect, resetUpload,
    updateInlineCategory, updateInlineKind,
    toggleInlineField, updateInlineText, openTextModal, saveModalText, approveAsSupervisor, approveAsTeamLead
  };
})();
