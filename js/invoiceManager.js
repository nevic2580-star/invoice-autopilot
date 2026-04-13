/* ============================================
   INVOICE MANAGER - CRUD + Duplicate Detection
   ============================================ */
const InvoiceManager = (() => {
  let listSortKey = '';
  let listSortDir = 'asc';
  let registerEditInvoiceId = null;

  function getListRowsForUser() {
    const user = App.getCurrentUser();
    let inv = Storage.getInvoices();
    if (user && user.role === 'vendor') {
      inv = inv.filter(i => i.vendorId === user.vendorId || i.createdBy === user.id || i.vendorName === user.name);
    }
    return inv;
  }

  const repairCodes = [
    {code:'ME1',name:'PISTON OVHL'}, {code:'ME2',name:'Main Engine 5년차 정비'}, {code:'ME3',name:'Main Engine FIV 재생'}, {code:'ME4',name:'EXH V/V SPINDLE 재생'}, {code:'ME5',name:'PISTON CROWN 재생'}, {code:'ME6',name:'MAIN BEARING 개방'}, {code:'ME7',name:'HPS PUMP 신환'}, {code:'ME8',name:'Main Engine F.O PUMP 재생'}, {code:'ME9',name:'Main Engine F.O PUMP OVHL'}, {code:'ME10',name:'A.V DAMPER 개방점검'}, {code:'ME11',name:'Main Engine CYL CRANK PIN BEARING OVHL'}, {code:'ME12',name:'Main Engine T/C OVHL'}, {code:'ME13',name:'Main Engine FUEL LINKAGE OVHL'}, {code:'ME14',name:'Main Engine GOVERNOR OVHL'}, {code:'ME15',name:'PNEUMATIC SYS OVHL'}, {code:'ME16',name:'Main Engine CYL LINER OVHL'}, {code:'ME17',name:'Main Engine CYL X-HEAD OVHL'}, {code:'ME18',name:'Main Engine T/C SPARES'}, {code:'ME19',name:'EXH V/V SEAT 재생'}, {code:'ME20',name:'Main Engine STAY BOLT 신환'}, {code:'ME21',name:'Main Engine VIT CONTROL ACTUATOR'}, {code:'ME22',name:'ALPHA LUB SYS ANNUAL INSPECTION'}, {code:'ME23',name:'Main Engine BMS PNEUMATIC VALVE OVHL'}, {code:'ME24',name:'Main Engine STARTING AIR V/V 수리'}, {code:'ME25',name:'TACHO 수리'}, {code:'ME26',name:'Main Engine BMS 정기점검'}, {code:'ME27',name:'BMS 정기점검'}, {code:'ME28',name:'MAIN L.O PUMP OVHL'}, {code:'ME29',name:'CYL COVER 수리'}, {code:'ME30',name:'ALPHA LUBRICATOR 수리'}, {code:'ME31',name:'Main Engine BMS 입거 정기점검'}, {code:'ME32',name:'MPC BOARD'}, {code:'ME33',name:'EPL LIMIT SETTING 점검'}, {code:'ME34',name:'MOP B 재생수리'}, {code:'GE1',name:'G/E FIV NOZZLE 재생'}, {code:'GE2',name:'G/E T/C CARTRIDGE OVHL'}, {code:'GE3',name:'G/E T/C CARTRIDGE 자재'}, {code:'GE4',name:'G/E GOVERNOR OVHL'}, {code:'GE5',name:'G/E GOVERNOR 점검'}, {code:'GE6',name:'G/E T/C CARTRIDGE 재생수리'}, {code:'GE7',name:'G/E F.O PUMP BARREL 재생'}, {code:'GE8',name:'G/E CYL LINER HEAD 수압 TEST TOOL'}, {code:'GE9',name:'G/E T/C OVHL'}, {code:'GE10',name:'EMERGENCY G/E'}, {code:'GE11',name:'SPEED MONITORING UNIT'}, {code:'GE12',name:'G/E VISCOMETER SENSOR 점검'}, {code:'BE1',name:'BOILER 개방검사'}, {code:'BE2',name:'BOILER 공연비 조정'}, {code:'BE3',name:'BOILER WATER LEVEL CONTROLLER 신환'}, {code:'DK1',name:'GYRO COMPASS/AUTO PILOT 연차검사'}, {code:'DK2',name:'ECDIS S/W UPDATE'}, {code:'DK3',name:'RADAR MAGNETRON 교환'}, {code:'DK4',name:'MAGNETIC COMPASS 자차 수정'}, {code:'DK5',name:'RORO ANNUAL INSPECTION'}, {code:'DK6',name:'ELEVATOR ANNUAL INSPECTION'}, {code:'DK7',name:'BALLAST REMOTE CONTROL SYS 점검'}, {code:'DK8',name:'RADAR SCANNER MOTOR 교체'}, {code:'DK9',name:'RADAR SCANNER MOTOR 자재'}, {code:'DK10',name:'RADAR MAGNETRON 자재'}, {code:'DK11',name:'ECDIS MONITOR 설치'}, {code:'DK12',name:'BALLAST TANK LEVEL GAUGE 검교정'}, {code:'DK13',name:'BALLAST TANK LEVEL GAUGE BARRIER자재'}, {code:'DK14',name:'ACC LADDER ANNUAL INSPECTION'}, {code:'DK15',name:'GYRO INVERTER ASSY'}, {code:'DK16',name:'수중점검 입거전'}, {code:'DK17',name:'RORO 입거전 점검'}, {code:'DK18',name:'수중검사'}, {code:'DK20',name:'VDR BATTERY 신환'}, {code:'DK21',name:'ECDIS HDD 신환'}, {code:'DK22',name:'EPIRB 신환'}, {code:'DK23',name:'SART BATTERY 신환'}, {code:'DK24',name:'LIFTER ANNUAL INSPECTION'}, {code:'DK25',name:'STEERING GEAR ANNUAL INSPECTION'}, {code:'DK26',name:'SERVICE CAR 수리'}, {code:'DK27',name:'LIFTER 수리'}, {code:'DK28',name:'FORK LIFT 수리'}, {code:'DK29',name:'RORO HYD PUMP 신환'}, {code:'DK30',name:'WIDS SENSOR'}, {code:'DK31',name:'WINCH/WINDLASS ANNUAL INSPECTION'}, {code:'DK32',name:'GYRO SENSITIVE ELEMENT 신환'}, {code:'DK33',name:'TANKER CARGO TANK MONITORING SYS 수리'}, {code:'DK34',name:'HATCH COVER ANNUAL INSPECTION'}, {code:'DK35',name:'선저소제'}, {code:'DK36',name:'VHF BATTERY 신환'}, {code:'DK37',name:'RORO SYS 수리'}, {code:'DK38',name:'ELEVATOR MAIN WIRE 신환'}, {code:'DK39',name:'BALLAST TANK LEVEL INDICATING SYSTEM'}, {code:'DK40',name:'CLEANING CAR 연차점검'}, {code:'DK41',name:'HOSE HANDLING CRANE ANNUAL INSPECTION'}, {code:'DK42',name:'WINDLASS BRAKE LINING 교체'}, {code:'DK43',name:'PROPELLER SHAFT INSPECTION'}, {code:'DK44',name:'SERVICE AIR COMPRESSOR MOTOR 신환'}, {code:'DK45',name:'CARGO HOLD 계측'}, {code:'DK46',name:'CARGO GEAR TEST'}, {code:'DK47',name:'H/C LEVEL SENSOR 제작'}, {code:'DK48',name:'WASHING MACHINE 점검'}, {code:'DK49',name:'GYRO COMPASS OVHL'}, {code:'DK50',name:'INMARSAT 점검 및 수리'}, {code:'DK51',name:'항해통신 장비 공급'}, {code:'DK52',name:'CITADEL PHONE 수리'}, {code:'DK53',name:'H/C HYD CYL 제작'}, {code:'DK54',name:'CARGO PUMP 정기점검'}, {code:'DK55',name:'VRCS 수리'}, {code:'DK56',name:'X-BAND RADAR REPLACE POWER SUPPLY FAN'}, {code:'DK57',name:'X-BAND RADAR REPLACE PROCESS/CCU FAN'}, {code:'DK58',name:'S-BAND RADAR REPLACE POWER SUPPLY FAN'}, {code:'DK59',name:'S-BAND RADAR REPLACE SCANNER FAN'}, {code:'DK60',name:'CHECK & POLISHING - PROPELLER'}, {code:'DK61',name:'DOPPLER SPEED LOG'}, {code:'DK62',name:'PROVISION CRANE SOFT START'}, {code:'DK63',name:'PROVISION CRANE HYD CYLINDER VERHAUL'}, {code:'DK64',name:'MF/HF'}, {code:'DK65',name:'UHF'}, {code:'DK66',name:'CCTV 수리'}, {code:'DK67',name:'LOAD COMPUTER'}, {code:'DK68',name:'BOW THRUSTER ACB 점검'}, {code:'DK69',name:'BOW THRUSTER INSPECTION'}, {code:'DK70',name:'BRIDGE WINDOW'}, {code:'DK71',name:'MGPS SYSTEM INSPECTION'}, {code:'DK72',name:'ICCP SYSTEM INSPECTION'}, {code:'DK73',name:'HULL DRAFT MARKING'}, {code:'DK74',name:'[VLCC] ODME INSPECTION'}, {code:'DK75',name:'[VLCC] STRIPPING PUMP STEAM CHEST 점검'}, {code:'DK76',name:'RUDDER ANGLE INDICATOR 조정'}, {code:'ER1',name:'O.W.S 15PPM ALARM CALIBRATION'}, {code:'ER2',name:'MACHINERY SAFETY CHECK'}, {code:'ER3',name:'INCINERATOR GENERAL INSPECTION'}, {code:'ER4',name:'C.S.W PUMP M/SEAL 재생'}, {code:'ER5',name:'C.S.W PUMP MOTOR 재생수리'}, {code:'ER6',name:'TORQUE WRENCH 검교정'}, {code:'ER7',name:'PRESSURE CALIBRATOR 검교정'}, {code:'ER8',name:'TEMP CALIBRATIOR 검교정'}, {code:'ER9',name:'DIESEL POWER PACK 정기점검'}, {code:'ER10',name:'DEFLECTION GAUGE 검교정'}, {code:'ER11',name:'LINER GAUGE 검교정'}, {code:'ER12',name:'GAUGE 검교정'}, {code:'ER13',name:'HYDRAULIC POWER PACK 정기점검'}, {code:'ER14',name:'O.W.S 15PPM ALARM 신환'}, {code:'ER15',name:'BWTS CALIBRATION OF SENSORS'}, {code:'ER16',name:'CALIBRATE - CEMS SENSOR by special list'}, {code:'ER17',name:'ANNUAL INSPECTION & CALIBRATION BY SPECIALIST'}, {code:'ER18',name:'FACTORY CALIBRATION - PAH SENSOR'}, {code:'ER19',name:'REPLACE - INTERNAL LIGHT SOURCE OF PAH SENSOR'}, {code:'ER20',name:'EGCS CEMS ANNUAL INSPECTION'}, {code:'ER21',name:'EGCS 세정수 분석'}, {code:'ER22',name:'EGCS 내부 방청'}, {code:'ER23',name:'ROPE GUARD U/W INSPECTION'}, {code:'ER24',name:'PURIFIER POWER SUPPLY MODULE'}, {code:'ER25',name:'AIR DRYER'}, {code:'ER26',name:'AIR COND OVERHAUL'}, {code:'ER27',name:'선내 냉동기 GENERAL INSPECTION'}, {code:'ER28',name:'MAIN L.O COOLER TEMP CONTROLLER (EP-CON)'}, {code:'ER29',name:'[VLCC] SCR NOX SPOT CHECK'}, {code:'EL1',name:'MEGGER TESTER 검교정'}, {code:'EL2',name:'MCCB 점검'}, {code:'EL3',name:'원격의로설비 네트워크신설'}, {code:'EL4',name:'INSULATION TESTER 검교정'}, {code:'EL5',name:'AMS 입거 정기점검'}, {code:'EL6',name:'AMS 정기점검'}, {code:'EL7',name:'LIGHTING SIGNAL PCB 재생'}, {code:'EL8',name:'NAVIGATION LED MODULE 재생수리'}, {code:'EL9',name:'AMS 수리'}, {code:'EL10',name:'WIFI/CABLE 수리 등'}, {code:'EL11',name:'EOCR'}, {code:'EL12',name:'FAN MOTOR'}, {code:'EL13',name:'ECHO SOUNDER'}, {code:'EL14',name:'SYNCHRO PANEL BOARD'}, {code:'EL15',name:'AUTO TEL'}, {code:'EL16',name:'ACONIS 수리'}, {code:'EL17',name:'DGPS'}, {code:'EL18',name:'WELDING safety inspection'}, {code:'EL19',name:'[VLCC] UTI CALIBRATION WITH CERT'}, {code:'SE1',name:'FDS ANNUAL INSPECTION'}, {code:'SE2',name:'PORTABLE GAS DETECTOR/ALCHOL TESTER 검교정'}, {code:'SE3',name:'SE ANNUAL INSPECTION'}, {code:'SE4',name:'SR ANNUAL INSPECTION'}, {code:'SE5',name:'IMMERSION SUITS 점검'}, {code:'SE6',name:'SR DRYDOCK INSPECTION'}, {code:'SE7',name:'SE DRYDOCK INSPECTION'}, {code:'SE8',name:'LIFERAFT ANNUAL INSPECTION'}, {code:'SE9',name:'SR 자재'}, {code:'SE10',name:'MR CALIBRATION'}, {code:'SE11',name:'FDS 수리'}, {code:'SE12',name:'SCBA HYD TEST'}, {code:'SE13',name:'소화기 약재 충전'}, {code:'SE14',name:'소각기 내화 벽돌 재시공'}, {code:'SE15',name:'SE DAVIT ANNUAL INSPECTION'}, {code:'SE16',name:'산소 소생기 구입'}, {code:'SE17',name:'LIFERAFT HRU 보급'}, {code:'SE18',name:'소화기 HYD TEST'}, {code:'SE19',name:'ALCOHOL TESTER 검교정'}, {code:'SE20',name:'SAFETY DEVICE'}, {code:'SE21',name:'SSAS'}, {code:'SE22',name:'FDS ISOLATOR (REPEATER)'}, {code:'SE23',name:'FIXED CO2 CYLINDER HYD TEST & RECHARGER'}
  ];

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
    registerEditInvoiceId = editId || null;
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
    
    // Find initial country display name
    let initialCountryCode = inv?.workCountry || '';
    let isManualCountry = false;
    if (initialCountryCode && !countries.find(c => c.code === initialCountryCode)) {
      isManualCountry = true;
    }

    const regions = [
      {
        label: '1. 아시아 (Asia)',
        codes: ['KR', 'CN', 'JP', 'SG', 'VN', 'MY', 'ID', 'IN', 'TW', 'TH']
      },
      {
        label: '2. 중동 및 아프리카 (Middle East & Africa)',
        codes: ['AE', 'SA', 'EG', 'ZA', 'MA']
      },
      {
        label: '3. 유럽 (Europe)',
        codes: ['NL', 'DE', 'BE', 'GB', 'FR', 'IT', 'ES', 'GR', 'TR']
      },
      {
        label: '4. 아메리카 및 오세아니아 (Americas & Oceania)',
        codes: ['US', 'CA', 'PA', 'BR', 'MX', 'AU']
      }
    ];

    let countryOptsHtml = '';
    regions.forEach(region => {
      countryOptsHtml += `<optgroup label="${region.label}">`;
      region.codes.forEach(code => {
        const c = countries.find(co => co.code === code);
        if (c) {
          countryOptsHtml += `<option value="${c.code}" ${(initialCountryCode === c.code && !isManualCountry) ? 'selected' : ''}>${c.name}</option>`;
        }
      });
      countryOptsHtml += `</optgroup>`;
    });

    // Add unmapped countries to a final group
    const mappedCodes = new Set(regions.flatMap(r => r.codes));
    const unmappedCountries = countries.filter(c => !mappedCodes.has(c.code));
    if (unmappedCountries.length > 0) {
      countryOptsHtml += `<optgroup label="기타 (Others)">`;
      unmappedCountries.forEach(c => {
        countryOptsHtml += `<option value="${c.code}" ${(initialCountryCode === c.code && !isManualCountry) ? 'selected' : ''}>${c.name}</option>`;
      });
      countryOptsHtml += `</optgroup>`;
    }
    
    let initialPortName = inv?.workPort || '';
    let isManualPort = false;
    
    let portOptsHtml = '';
    if (isManualCountry) {
      isManualPort = true;
    } else if (initialCountryCode) {
      if (initialPortName && !ports.find(p => p.country === initialCountryCode && p.name === initialPortName)) {
        isManualPort = true;
      }
      portOptsHtml = ports.filter(p => p.country === initialCountryCode).map(p =>
        `<option value="${p.name}" ${(initialPortName === p.name && !isManualPort) ? 'selected' : ''}>${p.nameKo} (${p.name})</option>`
      ).join('');
    }
    
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
              <div class="form-grid-2">
                <div class="form-group"><label class="form-label">선박명 (Vessel) <span class="required">*</span></label>
                  <input type="text" class="form-input" id="vesselName" list="vesselsList" required onchange="InvoiceManager.onVesselChange()" value="${inv?.vesselName||''}" placeholder="선택 또는 직접 입력">
                  <datalist id="vesselsList">
                    ${vessels.map(v=>`<option value="${v.vesselName}"></option>`).join('')}
                  </datalist>
                  <input type="hidden" id="vesselCode" value="${inv?.vesselCode||''}">
                </div>
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
                <div class="form-group"><label class="form-label">수리 코드 (Repair Code)</label>
                  <select class="form-select" id="repairCode" onchange="document.getElementById('repairDesc').value=this.options[this.selectedIndex].getAttribute('data-desc')||''">
                    <option value="" data-desc="">-- 수리코드 선택 --</option>
                    ${repairCodes.map(c=>`<option value="${c.code}" data-desc="${c.name}" ${inv?.repairCode===c.code?'selected':''}>${c.code} - ${c.name}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group"><label class="form-label">수리 내용 (Repair Description)</label>
                  <input class="form-input" type="text" id="repairDesc" readonly value="${inv?.repairDesc||''}" placeholder="코드 선택시 자동입력" style="background-color: var(--bg-level2);">
                </div>
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
              <div class="form-grid-2">
                <div class="form-group"><label class="form-label">통화 (Currency) <span class="required">*</span></label>
                  <select class="form-select" id="currency" required onchange="InvoiceManager.calcDifference()">
                    ${['USD','KRW','EUR','JPY','SGD'].map(c=>`<option value="${c}" ${(inv?.currency||'USD')===c?'selected':''}>${c}</option>`).join('')}
                  </select></div>
                <div class="form-group"><label class="form-label">견적금액 (Estimated) <span class="required">*</span></label>
                  <input class="form-input" type="text" id="estimatedAmount" required value="${inv?.estimatedAmount != null && inv.estimatedAmount !== '' ? Number(inv.estimatedAmount).toLocaleString() : ''}" oninput="InvoiceManager.formatNumberInput(this)" onblur="InvoiceManager.calcDifference()"></div>
              </div>
              <div class="form-grid-3" style="margin-top:12px;">
                <div class="form-group"><label class="form-label">실제발생 총액 (Actual Total) <span class="required">*</span></label>
                  <input class="form-input" type="text" id="actualAmount" required value="${inv?.actualAmount != null && inv.actualAmount !== '' ? Number(inv.actualAmount).toLocaleString() : ''}" oninput="InvoiceManager.formatNumberInput(this)"></div>
                <div class="form-group"><label class="form-label">순수 작업비 (Labor) <span class="required">*</span></label>
                  <input class="form-input" type="text" id="laborAmount" required value="${inv?.laborAmount != null && inv.laborAmount !== '' ? Number(inv.laborAmount).toLocaleString() : ''}" oninput="InvoiceManager.formatNumberInput(this)"></div>
                <div class="form-group"><label class="form-label">부대비용 (Misc 등)</label>
                  <input class="form-input" type="text" id="miscAmount" readonly title="교통비, 숙박비, OT, 부가세 등 (자동계산)" value="${inv?.miscAmount != null && inv.miscAmount !== '' ? Number(inv.miscAmount).toLocaleString() : ''}" style="background-color: var(--bg-level2); font-weight: bold;"></div>
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
                  <input class="form-input" type="date" id="invoiceDate" required value="${inv?.invoiceDate||''}" onclick="this.showPicker && this.showPicker()"></div>
              </div>
              <div class="form-grid-3">
                <div class="form-group"><label class="form-label">작업시작일 (Work Start) <span class="required">*</span></label>
                  <input class="form-input" type="date" id="workStartDate" required value="${inv?.workStartDate||''}" onclick="this.showPicker && this.showPicker()"></div>
                <div class="form-group"><label class="form-label">작업종료일 (Work End) <span class="required">*</span></label>
                  <input class="form-input" type="date" id="workEndDate" required value="${inv?.workEndDate||''}" onclick="this.showPicker && this.showPicker()"></div>
                <div class="form-group"><label class="form-label">국가 (Country) <span class="required">*</span></label>
                  <select class="form-select" id="workCountry" onchange="InvoiceManager.onCountryInput()" required>
                    <option value="">-- 국가 선택 (Select) --</option>
                    ${countryOptsHtml}
                    <option value="DIRECT" ${isManualCountry ? 'selected' : ''}>직접 입력 (Direct Input)</option>
                  </select>
                </div>
              </div>
              <div class="form-grid-3" style="margin-top:12px;">
                <div class="form-group" id="manualCountryContainer" style="display:${isManualCountry ? 'block' : 'none'};"><label class="form-label">직접 입력 (Manual Country)</label>
                  <input class="form-input" type="text" id="manualCountry" placeholder="국가명 입력" value="${isManualCountry ? initialCountryCode : ''}">
                </div>
                <div class="form-group"><label class="form-label">작업항구 (Port) <span class="required">*</span></label>
                  <select class="form-select" id="workPort" onchange="InvoiceManager.onPortInput()" required>
                    <option value="">${initialCountryCode && !isManualCountry ? '-- 항구 선택 (Select) --' : '국가를 먼저 선택하세요'}</option>
                    ${portOptsHtml}
                    <option value="DIRECT" ${isManualPort ? 'selected' : ''}>리스트에 없음 (Direct Input)</option>
                  </select>
                </div>
                <div class="form-group" id="manualPortContainer" style="display:${isManualPort ? 'block' : 'none'};"><label class="form-label">직접 입력 (Manual Port)</label>
                  <input class="form-input" type="text" id="manualPort" placeholder="항구명 입력" value="${isManualPort ? initialPortName : ''}">
                </div>
              </div>
            </div>
            
            ${isVendor ? '' : `
            <div class="glass-card animate-in" style="margin-bottom:16px">
              <div class="card-header"><h3>📋 추가 정보 (Additional Info)</h3></div>
              <div class="form-grid-2">
                <div class="form-group"><label class="form-label">계획반영여부 (Planned)</label>
                  <div class="toggle-switch"><div class="toggle-track ${inv?.category==='NON_PMS'?'':(inv?.isPlanned!==false?'active':'')}" id="isPlannedToggle" onclick="InvoiceManager.handlePlannedToggle(this)" style="${inv?.category==='NON_PMS'?'pointer-events:none;opacity:0.5;':''}"></div>
                  <span class="toggle-label">${inv?.category==='NON_PMS'?'아니오 (No)':(inv?.isPlanned!==false?'예 (Yes)':'아니오 (No)')}</span></div></div>
                <div class="form-group"><label class="form-label">운항담당자 협의여부 (Ops Consultation)</label>
                  <div class="toggle-switch"><div class="toggle-track ${inv?.opsConsulted!==false?'active':''}" id="opsConsultedToggle" onclick="InvoiceManager.handleOpsToggle(this)"></div>
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

  function handlePlannedToggle(el) {
    el.classList.toggle('active');
    if (el.nextElementSibling) {
      el.nextElementSibling.innerText = el.classList.contains('active') 
        ? (App.getLang() === 'ko' ? '예 (Yes)' : 'Yes') 
        : (App.getLang() === 'ko' ? '아니오 (No)' : 'No');
    }
  }

  function handleOpsToggle(el) {
    el.classList.toggle('active');
    if (el.nextElementSibling) {
      el.nextElementSibling.innerText = el.classList.contains('active') 
        ? (App.getLang() === 'ko' ? '예 (Yes)' : 'Yes') 
        : (App.getLang() === 'ko' ? '아니오 (No)' : 'No');
    }
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
    
    // 계획반영여부 토글 제어 (NON_PMS 선택 시 '아니오'로 고정)
    const plannedToggle = document.getElementById('isPlannedToggle');
    if (plannedToggle) {
      if (cat === 'NON_PMS') {
        plannedToggle.classList.remove('active');
        plannedToggle.style.pointerEvents = 'none';
        plannedToggle.style.opacity = '0.5';
        if (plannedToggle.nextElementSibling) {
          plannedToggle.nextElementSibling.innerText = App.getLang() === 'ko' ? '아니오 (No)' : 'No';
        }
      } else {
        plannedToggle.style.pointerEvents = 'auto';
        plannedToggle.style.opacity = '1';
      }
    }
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

  function onCountryInput() {
    const rawVal = document.getElementById('workCountry').value;
    const manualCountryContainer = document.getElementById('manualCountryContainer');
    const portSelect = document.getElementById('workPort');
    const manualPortContainer = document.getElementById('manualPortContainer');

    if (!portSelect) return;
    
    portSelect.innerHTML = '<option value="">-- 항구 선택 (Select) --</option>';

    if (rawVal === 'DIRECT') {
      if (manualCountryContainer) manualCountryContainer.style.display = 'block';
      portSelect.innerHTML = '<option value="DIRECT" selected>리스트에 없음 (Direct Input)</option>';
      if (manualPortContainer) manualPortContainer.style.display = 'block';
    } else {
      if (manualCountryContainer) manualCountryContainer.style.display = 'none';
      if (manualPortContainer) manualPortContainer.style.display = 'none';
      
      const ports = Storage.getPorts();
      const countryCode = rawVal;
      
      if (countryCode) {
        const cPorts = ports.filter(p => p.country === countryCode);
        cPorts.forEach(p => {
          portSelect.innerHTML += `<option value="${p.name}">${p.nameKo} (${p.name})</option>`;
        });
        portSelect.innerHTML += '<option value="DIRECT">리스트에 없음 (Direct Input)</option>';
      } else {
        portSelect.innerHTML = '<option value="">국가를 먼저 선택하세요</option>';
      }
    }
  }

  function onPortInput() {
    const pVal = document.getElementById('workPort').value;
    const manualPortContainer = document.getElementById('manualPortContainer');
    if (manualPortContainer) {
      if (pVal === 'DIRECT') {
        manualPortContainer.style.display = 'block';
        document.getElementById('manualPort').focus();
      } else {
        manualPortContainer.style.display = 'none';
      }
    }
  }

  function calcDifference(){
    const estEl = document.getElementById('estimatedAmount');
    const labEl = document.getElementById('laborAmount');
    const miscEl = document.getElementById('miscAmount');
    const actEl = document.getElementById('actualAmount');
    const dEl = document.getElementById('differenceDisplay');
    const rEl = document.getElementById('differenceRateDisplay');
    
    if (labEl && miscEl && actEl) {
      const actStr = (actEl.value || '').replace(/,/g, '') || '0';
      const labStr = (labEl.value || '').replace(/,/g, '') || '0';
      const totalAct = parseFloat(actStr) || 0;
      const laborAct = parseFloat(labStr) || 0;
      
      const miscAct = totalAct - laborAct;
      // If actual amount is provided, calculate the remainder for misc
      if (actEl.value !== '') {
        miscEl.value = Number(miscAct).toLocaleString();
      } else {
        miscEl.value = '';
      }
    }
    
    if (!dEl && !rEl) return;
    const estStr = (estEl?.value || '').replace(/,/g, '') || '0';
    const actStr = (actEl?.value || '').replace(/,/g, '') || '0';
    const est = parseFloat(estStr);
    const act = parseFloat(actStr);
    const estN = Number.isFinite(est) ? est : 0;
    const actN = Number.isFinite(act) ? act : 0;
    const diff = actN - estN;
    const rate = estN > 0 ? ((diff / estN) * 100).toFixed(1) : 0;
    const cur = document.getElementById('currency')?.value || 'USD';
    const fmt = (typeof CoverGenerator !== 'undefined' && CoverGenerator.formatCurrency)
      ? (a, c) => CoverGenerator.formatCurrency(a, c)
      : (a) => String(a);
    try {
      if (dEl) {
        dEl.textContent = (diff >= 0 ? '+' : '') + fmt(diff, cur);
        dEl.className = 'form-calculated' + (diff > 0 ? ' danger' : diff < 0 ? ' warning' : '');
      }
      if (rEl) {
        rEl.textContent = (Number(rate) >= 0 ? '+' : '') + rate + '%';
        rEl.className = 'form-calculated' + (Math.abs(Number(rate)) > 20 ? ' danger' : Math.abs(Number(rate)) > 10 ? ' warning' : '');
      }
    } catch (e) {
      if (dEl) dEl.textContent = '-';
      if (rEl) rEl.textContent = '-';
    }
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
    const dups=invoices.filter(i=>i.orderNo&&i.orderNo.toLowerCase()===orderNo.toLowerCase()&&i.id!==registerEditInvoiceId);
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
      lab=parseFloat(document.getElementById('laborAmount').value.replace(/,/g, ''))||0,
      misc=parseFloat(document.getElementById('miscAmount').value.replace(/,/g, ''))||0,
      act=parseFloat(document.getElementById('actualAmount').value.replace(/,/g, ''))||0,
      diff=act-est,
      rate=est>0?Number(((diff/est)*100).toFixed(1)):0;
    
    let wCountry = document.getElementById('workCountry')?.value||'';
    if (wCountry === 'DIRECT') {
      wCountry = document.getElementById('manualCountry').value.trim();
    }
    
    let wPort = document.getElementById('workPort').value;
    if (wPort === 'DIRECT') {
      wPort = document.getElementById('manualPort').value.trim();
    }
      
    const data={vesselName:document.getElementById('vesselName').value,vesselCode:document.getElementById('vesselCode').value,
      kind:document.getElementById('kind')?.value||'',orderNo:document.getElementById('orderNo').value.trim(),
      acctNo:document.getElementById('glvCode')?.value||'',category:document.getElementById('category')?.value||'',
      gmsCode:document.getElementById('gmsCode')?.value||'',
      workDescription:document.getElementById('workDescription').value.trim(),
      currency:document.getElementById('currency').value,
      repairCode:document.getElementById('repairCode')?.value||'',
      repairDesc:document.getElementById('repairDesc')?.value||'',
      estimatedAmount:est,laborAmount:lab,miscAmount:misc,actualAmount:act,difference:diff,differenceRate:rate,
      invoiceDate:document.getElementById('invoiceDate').value,
      workStartDate:document.getElementById('workStartDate').value,workEndDate:document.getElementById('workEndDate').value,
      workCountry:wCountry,
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
      // Notification
      if (typeof NotificationCenter !== 'undefined') {
        NotificationCenter.notifySubmit(saved.id, data.vesselName);
      }
      if(u && u.role === 'vendor') {
        App.showToast('success', isKo ? '제출 완료' : 'Submitted', isKo ? '제출이 완료되었습니다.' : 'Successfully submitted.');
        App.navigateTo('list');
      }
      else {
        App.showToast('success',isKo?'등록 완료':'Registered',`${saved.id} ${isKo?'등록되었습니다.':'registered.'}`);
        CoverGenerator.showPreviewModal(saved,App.getLang());
      }
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
      '<th style="width:40px;text-align:center"></th>',
      renderListSortHeader('vesselName', '선박명 (Vessel)', isKo),
      renderListSortHeader('orderNo', 'R.O No.', isKo),
      renderListSortHeader('workDescription', '작업내용 (Work)', isKo),
      renderListSortHeader('estimatedAmount', '견적 (Est.)', isKo, true),
      renderListSortHeader('actualAmount', '실적 (Actual)', isKo, true),
      renderListSortHeader('differenceRate', '차이율(%)', isKo, true)
    ];
    if (isAdmin) {
      head.push(
        renderListSortHeader('planned', '계획', isKo),
        renderListSortHeader('opsConsulted', '운항', isKo)
      );
    }
    head.push(renderListSortHeader('status', '상태 (Status)', isKo));
    head.push('<th style="white-space:nowrap">액션 (Act)</th>');
    return `<div class="table-container glass-card" style="padding:0;overflow-x:auto;overflow-y:auto;max-height:75vh"><table class="data-table" style="min-width:1200px"><thead style="position:sticky;top:0;z-index:10;background:var(--bg-secondary,#0d1b3e)"><tr>${head.join('')}</tr></thead><tbody>${invoices.map(inv=>{
      const dc=inv.differenceRate>0?'diff-positive':inv.differenceRate<0?'diff-negative':'diff-neutral';
      const isApproved = inv.status === '팀장확인완료' || inv.status === '지급완료';
      return `<tr onclick="InvoiceManager.toggleDetail('${inv.id}')" style="cursor:pointer" class="invoice-row-main" id="row_main_${inv.id}">
        <td style="text-align:center"><span id="exp_icon_${inv.id}" style="font-size:0.8rem;transition:transform 0.2s;display:inline-block">▶</span></td>
        <td style="font-weight:500;color:var(--text-primary)">
           <div style="display:flex;align-items:center;gap:6px">
             ${inv.vesselName} ${App.getVesselTypeBadge(inv.vesselName)}
           </div>
        </td>
        <td><span ${isAdmin ? `style="color:var(--text-accent);font-weight:bold" onclick="event.stopPropagation();App.navigateTo('register', '${inv.id}')"` : `style="font-weight:bold"`}>${isAdmin ? 'RO ' : ''}${inv.orderNo}</span></td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${isKo?inv.workDescriptionKo||inv.workDescription:inv.workDescription}</td>
        <td style="text-align:right">${CoverGenerator.formatCurrency(inv.estimatedAmount,inv.currency)}</td>
        <td style="text-align:right;font-weight:600">${CoverGenerator.formatCurrency(inv.actualAmount,inv.currency)}</td>
        <td style="text-align:right" class="${dc}">${inv.differenceRate>=0?'+':''}${inv.differenceRate}%</td>
        ${isAdmin ? `
          <td style="text-align:center" onclick="event.stopPropagation()">
            <div class="toggle-track ${inv.planned?'active':''}" onclick="InvoiceManager.toggleInlineField('${inv.id}','planned',this)" style="display:inline-block;width:36px;height:20px;cursor:pointer" title="${inv.planned?'Y':'N'}"></div>
          </td>
          <td style="text-align:center" onclick="event.stopPropagation()">
            <div class="toggle-track ${inv.opsConsulted?'active':''}" onclick="InvoiceManager.toggleInlineField('${inv.id}','opsConsulted',this)" style="display:inline-block;width:36px;height:20px;cursor:pointer" title="${inv.opsConsulted?'Y':'N'}"></div>
          </td>
        ` : ''}
        <td>${isAdmin ? ApprovalWorkflow.getStatusBadge(inv.status, isKo) : getVendorStatusBadge(inv.status, isKo)}</td>
        <td style="white-space:nowrap" onclick="event.stopPropagation()">
          ${(inv.status === '팀장확인완료' || inv.status === '결재완료' || inv.status === '지급완료') && isAdmin ? `<button class="btn btn-outline btn-sm" onclick="CoverGenerator.printCover(Storage.getInvoice('${inv.id}'),App.getLang())">🖨️ ${isKo ? '커버 출력' : 'Print Cover'}</button>` : ''}
          ${user && user.role === 'supervisor' && (inv.status === '접수' || inv.status === '신규접수' || inv.status === '제출완료') ? `<button class="btn btn-primary btn-sm" onclick="InvoiceManager.approveAsSupervisor('${inv.id}')">✏️ ${isKo ? '감독 승인':'Sup. Approve'}</button>` : ''}
          ${user && user.role === 'supervisor' && inv.status === '감독확인완료' ? `<button class="btn btn-secondary btn-sm" style="background:#e11d48;color:white;border:none" onclick="InvoiceManager.returnInvoice('${inv.id}')">↩️ ${isKo ? '반려(Return)':'Return'}</button>` : ''}
          ${user && user.role === 'teamlead' && (inv.status === '감독확인' || inv.status === '감독확인완료') ? `<button class="btn btn-secondary btn-sm" onclick="InvoiceManager.approveAsTeamLead('${inv.id}')" style="background:#8b5cf6;color:white;border:none">✍️ ${isKo ? '팀장 승인':'TL Approve'}</button>` : ''}
          ${user && user.role === 'teamlead' && (inv.status === '감독확인' || inv.status === '감독확인완료') ? `<button class="btn btn-danger btn-sm" onclick="InvoiceManager.rejectAsTeamLead('${inv.id}')">↩️ ${isKo ? '팀장 반려':'TL Reject'}</button>` : ''}
          <button class="btn btn-ghost btn-sm" onclick="App.navigateTo('register','${inv.id}')" title="수정 (Edit)">✏️</button>
          <button class="btn btn-ghost btn-sm" onclick="InvoiceManager.confirmDelete('${inv.id}')" title="삭제 (Delete)">🗑️</button>
        </td>
      </tr>
      <tr class="invoice-row-detail" id="row_detail_${inv.id}" style="display:none;background-color:rgba(255,255,255,0.03);">
        <td colspan="${isAdmin?11:9}" style="padding:16px;">
           <div style="display:flex; gap:20px; flex-wrap:wrap;">
             <div style="flex:1; min-width:200px;">
               <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:4px;">📌 기본 정보</div>
               <div style="font-size:0.85rem; margin-bottom:4px"><strong>ID:</strong> ${inv.id}</div>
               <div style="font-size:0.85rem; margin-bottom:4px"><strong>접수일자:</strong> ${inv.createdAt?new Date(inv.createdAt).toISOString().split('T')[0]:'-'}</div>
               <div style="font-size:0.85rem; margin-bottom:4px"><strong>발행일자:</strong> ${inv.invoiceDate||'-'}</div>
             </div>
             ${isAdmin ? `
             <div style="flex:1; min-width:250px;">
               <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:4px;">📊 회계 분류</div>
               <div style="display:flex;gap:8px;margin-bottom:8px;">
                 <select class="form-select" onchange="InvoiceManager.updateInlineCategory('${inv.id}', this.value)" style="padding:4px;font-size:0.8rem;flex:1;">
                   <option value="">- 비용구분 -</option>${Storage.getCategories().map(c=>`<option value="${c.name}" ${inv.category===c.name?'selected':''}>${c.nameKo}</option>`).join('')}
                 </select>
                 <select class="form-select" id="inline_kind_${inv.id}" onchange="InvoiceManager.updateInlineKind('${inv.id}', this.value)" style="padding:4px;font-size:0.8rem;flex:1;">
                   <option value="">- 기기 분류 -</option>${inv.category ? Storage.getKinds().filter(k=>k.category===inv.category).map(k=>`<option value="${k.name}" ${inv.kind===k.name?'selected':''}>${k.nameKo}</option>`).join('') : ''}
                 </select>
               </div>
               <div style="display:flex;gap:8px;">
                 <div style="flex:1;font-size:0.85rem;"><strong>GMS:</strong> <span id="inline_gms_${inv.id}">${inv.gmsCode||'-'}</span></div>
                 <div style="flex:1;font-size:0.85rem;"><strong>GLV:</strong> <span id="inline_glv_${inv.id}">${inv.acctNo||'-'}</span></div>
               </div>
               <div style="display:flex;gap:8px;margin-top:8px;">
                 <div style="flex:1;font-size:0.85rem;"><strong>수리코드:</strong> ${inv.repairCode||'-'}</div>
                 <div style="flex:2;font-size:0.85rem;"><strong>수리내용:</strong> ${inv.repairDesc||'-'}</div>
               </div>
             </div>
             <div style="flex:1; min-width:200px;">
               <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:4px;">✅ 결재 현황</div>
               <div style="font-size:0.85rem; margin-bottom:4px"><strong>감독승인:</strong> ${inv.approval?.supervisor?.name ? `${inv.approval.supervisor.name} (${inv.approval.supervisor.date})` : '<span style="color:var(--text-muted)">대기중</span>'}</div>
               <div style="font-size:0.85rem; margin-bottom:4px"><strong>팀장승인:</strong> ${inv.approval?.teamLead?.name ? `${inv.approval.teamLead.name} (${inv.approval.teamLead.date})` : '<span style="color:var(--text-muted)">대기중</span>'}</div>
               <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:4px; margin-top:12px;">📝 참고사항</div>
               <div style="margin-bottom:8px"><strong>사유 (Reason):</strong>
                 <div onclick="InvoiceManager.openTextModal('${inv.id}','reason')" style="padding:4px 8px;font-size:0.8rem;background:var(--card-bg);border-radius:4px;cursor:pointer;border:1px solid rgba(255,255,255,0.1)">${inv.reason || '<span style="color:var(--text-muted)">클릭하여 입력</span>'}</div>
               </div>
               <div><strong>특기사항 (Remarks):</strong>
                 <div onclick="InvoiceManager.openTextModal('${inv.id}','remarks')" style="padding:4px 8px;font-size:0.8rem;background:var(--card-bg);border-radius:4px;cursor:pointer;border:1px solid rgba(255,255,255,0.1)">${inv.remarks || '<span style="color:var(--text-muted)">클릭하여 입력</span>'}</div>
               </div>
             </div>` : ''}
           </div>
        </td>
      </tr>`;}).join('')}</tbody></table></div>`;
  }

  // Simplified status badge for vendor users — shows only up to supervisor confirmation
  function getVendorStatusBadge(status, isKo) {
    // Map internal statuses to vendor-visible steps
    // Step 0: submitted, Step 1: supervisor confirmed, Step 2: done (paid)
    const steps = [
      { label: isKo ? '제출완료' : 'Submitted',   color: '#3b82f6' },
      { label: isKo ? '감독확인' : 'Sup. Reviewed', color: '#f59e0b' },
      { label: isKo ? '처리완료' : 'Completed',    color: '#10b981' }
    ];
    const statusToStep = {
      '접수': 0, '신규접수': 0, '제출완료': 0, '입력': 0,
      '감독확인': 1, '감독확인완료': 1,
      '팀장확인': 2, '팀장확인완료': 2, '결재완료': 2, '지급완료': 2, '반려': 0
    };
    const step = statusToStep[status] ?? 0;
    let dots = '';
    for (let i = 0; i < steps.length; i++) {
      const filled = i <= step;
      const c = filled ? steps[i].color : 'rgba(255,255,255,0.15)';
      dots += `<span class="stepper-dot" style="background:${c};${filled ? `box-shadow:0 0 6px ${c}80` : 'border:1px solid rgba(255,255,255,0.2)'}" title="${steps[i].label}"></span>`;
      if (i < steps.length - 1) {
        const lc = i < step ? steps[i + 1].color : 'rgba(255,255,255,0.1)';
        dots += `<span class="stepper-line" style="background:${lc}"></span>`;
      }
    }
    return `<div class="status-stepper"><div class="stepper-track">${dots}</div><div class="stepper-label" style="color:${steps[step].color};font-weight:600">${steps[step].label}</div></div>`;
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
    // Remove auto-extraction mapping for target fields per user request
    setVal('acctNo', data.acctNo);
    setVal('workDescription', data.workDescription);
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

  function rejectAsTeamLead(id) {
    const isKo = App.getLang() === 'ko';
    const reason = prompt(isKo ? '팀장 반려 사유를 입력하세요:' : 'Enter team lead rejection reason:');
    if (reason === null) return; // cancelled
    if (!reason.trim()) {
      App.showToast('error', isKo ? '입력 필요' : 'Required', isKo ? '반려 사유를 입력해주세요.' : 'Please enter rejection reason.');
      return;
    }
    const inv = Storage.getInvoice(id);
    if (!inv) return;
    const user = App.getCurrentUser();

    inv.status = '감독확인완료'; // return to supervisor stage
    inv.approval = inv.approval || {};
    inv.approval.teamLead = {
      name: user ? user.name : '시스템',
      date: new Date().toISOString().slice(0, 10),
      status: 'rejected',
      comment: reason
    };
    // Keep supervisor approval intact
    Storage.updateInvoice(id, inv);
    App.showToast('warning', isKo ? '팀장 반려' : 'TL Rejected', isKo ? `팀장 반려 처리되었습니다. (사유: ${reason})` : `Rejected: ${reason}`);
    filterList();
    if(typeof NotificationCenter !== 'undefined') NotificationCenter.logActivity({action:'reject', detail: `${id} 팀장 반려: ${reason}`});
  }

  function toggleDetail(id) {
    const detailRow = document.getElementById(`row_detail_${id}`);
    const icon = document.getElementById(`exp_icon_${id}`);
    if (detailRow) {
      if (detailRow.style.display === 'none') {
        detailRow.style.display = 'table-row';
        if (icon) icon.style.transform = 'rotate(90deg)';
      } else {
        detailRow.style.display = 'none';
        if (icon) icon.style.transform = 'rotate(0deg)';
      }
    }
  }

  function returnInvoice(id) {
    const isKo = App.getLang() === 'ko';
    if (!confirm(isKo ? '해당 인보이스를 부서 내 반려 처리하시겠습니까?' : 'Return this invoice?')) return;
    const inv = Storage.getInvoice(id);
    if (!inv) return;
    inv.status = '반려';
    inv.approval = inv.approval || {};
    inv.approval.supervisor = { name: null, date: null, status: 'pending' };
    Storage.updateInvoice(id, inv);
    App.showToast('info', isKo ? '반려 완료' : 'Returned', isKo ? '인보이스가 반려되었습니다.' : 'Invoice returned.');
    filterList();
    if(typeof NotificationCenter !== 'undefined') NotificationCenter.logActivity({action:'return', detail: `${id} 반려`});
  }

  return {
    renderRegisterPage, renderListPage, onVesselChange, onKindChange, onCategoryChange, calcDifference, 
    checkDuplicate, handleSubmit, filterList, toggleListSort, confirmDelete,
    handleDragOver, handleDragLeave, handleDrop, handleFileSelect, resetUpload,
    updateInlineCategory, updateInlineKind, toggleDetail, returnInvoice,
    toggleInlineField, updateInlineText, openTextModal, saveModalText, approveAsSupervisor, approveAsTeamLead, rejectAsTeamLead,
    handlePlannedToggle, handleOpsToggle, formatNumberInput, onCountryInput, onPortInput
  };
})();
