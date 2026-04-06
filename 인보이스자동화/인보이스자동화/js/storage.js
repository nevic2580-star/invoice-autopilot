/* ============================================
   STORAGE MODULE - Data Management + Demo Data
   ============================================ */

const Storage = (() => {
  const KEYS = {
    invoices: 'inv_invoices',
    vessels: 'inv_vessels',
    approvers: 'inv_approvers',
    kinds: 'inv_kinds',
    categories: 'inv_categories',
    ports: 'inv_ports',
    accounts: 'inv_accounts',
    settings: 'inv_settings',
    initialized: 'inv_initialized'
  };

  /** 비용 구분 × 기기 분류 → GMS / GLV (기준표 — localStorage와 병합 시 코드 보정에 사용) */
  const KIND_MASTER_DEFINITIONS = [
    { id: 'K01', name: '갑판보조기기_PMS', nameKo: '갑판보조기기_PMS', category: 'PMS', glv: '52624150', gms: '53841' },
    { id: 'K02', name: '주기관_PMS', nameKo: '주기관_PMS', category: 'PMS', glv: '52624110', gms: '53842' },
    { id: 'K03', name: '발전기_PMS', nameKo: '발전기_PMS', category: 'PMS', glv: '52624120', gms: '53843' },
    { id: 'K04', name: '보일러_PMS', nameKo: '보일러_PMS', category: 'PMS', glv: '52624130', gms: '53836' },
    { id: 'K05', name: '기관보조기기_PMS', nameKo: '기관보조기기_PMS', category: 'PMS', glv: '52624140', gms: '53844' },
    { id: 'K06', name: '전기전자_PMS', nameKo: '전기전자_PMS', category: 'PMS', glv: '52624160', gms: '53845' },
    { id: 'K07', name: '안전장비_PMS', nameKo: '안전장비_PMS', category: 'PMS', glv: '52624150', gms: '53846' },
    { id: 'K08', name: '갑판보조기기', nameKo: '갑판보조기기', category: 'NON_PMS', glv: '52624180', gms: '53902' },
    { id: 'K09', name: '주기관', nameKo: '주기관', category: 'NON_PMS', glv: '52624180', gms: '53903' },
    { id: 'K10', name: '발전기', nameKo: '발전기', category: 'NON_PMS', glv: '52624180', gms: '53905' },
    { id: 'K11', name: '보일러', nameKo: '보일러', category: 'NON_PMS', glv: '52624180', gms: '53915' },
    { id: 'K12', name: '기관보조기기', nameKo: '기관보조기기', category: 'NON_PMS', glv: '52624180', gms: '53906' },
    { id: 'K13', name: '전기전자', nameKo: '전기전자', category: 'NON_PMS', glv: '52624180', gms: '53907' },
    { id: 'K14', name: '안전장비', nameKo: '안전장비', category: 'NON_PMS', glv: '52624180', gms: '53908' },
    { id: 'K15', name: 'Drydock Repair (Outside Work)', nameKo: 'Drydock Repair (Outside Work)', category: '입거비용', glv: '52624190', gms: '53892' },
    { id: 'K16', name: 'Drydock Initiatives (신규설비 CCTV 등)', nameKo: 'Drydock Initiatives (신규설비 CCTV 등)', category: '입거비용', glv: '52624190', gms: '53899' },
    { id: 'K17', name: 'Drydock Repair (Outside Work)_투자', nameKo: 'Drydock Repair (Outside Work)', category: '입거투자', glv: '52624190', gms: '53892' },
    { id: 'K18', name: 'Drydock Initiatives (CCTV 등)_투자', nameKo: 'Drydock Initiatives (신규설비 CCTV 등)', category: '입거투자', glv: '52624190', gms: '53899' },
    { id: 'K19', name: 'OTHERS', nameKo: 'OTHERS', category: '기타관리비', glv: '52629990', gms: '53881' },
    { id: 'K20', name: '사전승인비_Rule & Regulations', nameKo: '사전승인비_Rule & Regulations', category: '국적변경', glv: '52629990', gms: '53884' },
    { id: 'K21', name: '선주사정책비_수리비', nameKo: '선주사정책비_수리비', category: '정책비', glv: '52624200', gms: '53882' },
    { id: 'K22', name: '선주사정책비_자재비', nameKo: '선주사정책비_자재비', category: '정책비', glv: '52624200', gms: '53883' },
    { id: 'K23', name: '안전장비비', nameKo: '안전장비비', category: '선용품', glv: '52623640', gms: '53864' },
    { id: 'K24', name: '일반소모품비', nameKo: '일반소모품비', category: '선용품', glv: '52623610', gms: '53866' },
    { id: 'K25', name: '초기인수선박관리비', nameKo: '초기인수선박관리비', category: '초도', glv: '52629150', gms: '53888' }
  ];

  function lookupGmsGlvByCostAndKind(category, kindName) {
    if (!category || !kindName) return null;
    const ref = KIND_MASTER_DEFINITIONS.find(r => r.category === category && r.name === kindName);
    return ref ? { gms: ref.gms, glv: ref.glv } : null;
  }

  /* ---- Basic CRUD ---- */
  function getAll(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch { return []; }
  }

  function saveAll(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function getById(key, id) {
    return getAll(key).find(item => item.id === id) || null;
  }

  function add(key, item) {
    const data = getAll(key);
    data.push(item);
    saveAll(key, data);
    return item;
  }

  function update(key, id, updates) {
    const data = getAll(key);
    const idx = data.findIndex(item => item.id === id);
    if (idx === -1) return null;
    data[idx] = { ...data[idx], ...updates, updatedAt: new Date().toISOString() };
    saveAll(key, data);
    return data[idx];
  }

  function remove(key, id) {
    const data = getAll(key).filter(item => item.id !== id);
    saveAll(key, data);
  }

  /* ---- Invoice Operations ---- */
  function getInvoices() { return getAll(KEYS.invoices); }

  function getInvoice(id) { return getById(KEYS.invoices, id); }

  function addInvoice(invoice) {
    invoice.id = invoice.id || generateInvoiceId();
    invoice.createdAt = new Date().toISOString();
    invoice.updatedAt = new Date().toISOString();
    return add(KEYS.invoices, invoice);
  }

  function updateInvoice(id, updates) {
    return update(KEYS.invoices, id, updates);
  }

  function deleteInvoice(id) {
    remove(KEYS.invoices, id);
  }

  function generateInvoiceId() {
    const now = new Date();
    const year = now.getFullYear();
    const invoices = getInvoices();
    const yearInvoices = invoices.filter(i => i.id && i.id.startsWith(`COV-${year}`));
    const nextNum = yearInvoices.length + 1;
    return `COV-${year}-${String(nextNum).padStart(4, '0')}`;
  }

  /* ---- Master Data ---- */
  function getVessels() { return getAll(KEYS.vessels); }
  function addVessel(v) { return add(KEYS.vessels, v); }
  function updateVessel(id, u) { return update(KEYS.vessels, id, u); }
  function deleteVessel(id) { remove(KEYS.vessels, id); }

  function getApprovers() { return getAll(KEYS.approvers); }
  function addApprover(a) { return add(KEYS.approvers, a); }
  function updateApprover(id, u) { return update(KEYS.approvers, id, u); }
  function deleteApprover(id) { remove(KEYS.approvers, id); }

  function getKinds() {
    const stored = getAll(KEYS.kinds);
    if (!stored.length) return [];
    return stored.map(row => {
      const ref = KIND_MASTER_DEFINITIONS.find(r => r.id === row.id);
      if (ref) return { ...row, gms: ref.gms, glv: ref.glv, category: ref.category, name: ref.name, nameKo: ref.nameKo };
      return row;
    });
  }
  function getCategories() { return getAll(KEYS.categories); }
  function getPorts() { return getAll(KEYS.ports); }
  function getAccounts() { return getAll(KEYS.accounts); }

  function addMasterItem(key, item) { return add(key, item); }
  function updateMasterItem(key, id, u) { return update(key, id, u); }
  function deleteMasterItem(key, id) { remove(key, id); }

  /* ---- Settings ---- */
  function getSettings() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.settings)) || { lang: 'ko', currentUser: 'admin' };
    } catch {
      return { lang: 'ko', currentUser: 'admin' };
    }
  }

  function saveSetting(key, value) {
    const s = getSettings();
    s[key] = value;
    localStorage.setItem(KEYS.settings, JSON.stringify(s));
  }

  /* ---- Export ---- */
  function exportCSV() {
    const invoices = getInvoices();
    if (!invoices.length) return '';
    const headers = [
      'ID', 'Vessel Name', 'Vessel Code', 'Kind', 'Order No.', 'ACCT. NO',
      'Category', 'Work Description', 'Currency', 'Estimated Amount', 'Actual Amount',
      'Difference', 'Difference Rate(%)', 'Work Start', 'Work End', 'Work Port',
      'Planned', 'Ops Consulted', 'Reason', 'Remarks', 'Status',
      'Supervisor', 'Supervisor Date', 'Team Lead', 'Team Lead Date', 'Created At'
    ];
    const rows = invoices.map(i => [
      i.id, i.vesselName, i.vesselCode, i.kind, i.orderNo, i.acctNo,
      i.category, `"${(i.workDescription || '').replace(/"/g, '""')}"`,
      i.currency, i.estimatedAmount, i.actualAmount,
      i.difference, i.differenceRate, i.workStartDate, i.workEndDate, i.workPort,
      i.isPlanned ? 'Y' : 'N', i.opsConsulted ? 'Y' : 'N',
      `"${(i.reason || '').replace(/"/g, '""')}"`,
      `"${(i.remarks || '').replace(/"/g, '""')}"`,
      i.status,
      i.approval?.supervisor?.name || '', i.approval?.supervisor?.date || '',
      i.approval?.teamLead?.name || '', i.approval?.teamLead?.date || '',
      i.createdAt
    ]);

    const BOM = '\uFEFF';
    return BOM + headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
  }

  function downloadCSV(filename) {
    const csv = exportCSV();
    if (!csv) return;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `invoices_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ---- Demo Data Seeding ---- */
  function seedDemoData() {
    if (localStorage.getItem(KEYS.initialized)) return false;

    // Vessels
    const vessels = [
      {id:'V01', vesselName:'GLOVIS CORONA', vesselCode:'GNA (HGNA)', vesselType:'PCTC', active:true},
      {id:'V02', vesselName:'GLOVIS CHORUS', vesselCode:'GHS (HGHS)', vesselType:'PCTC', active:true},
      {id:'V03', vesselName:'GLOVIS COMET', vesselCode:'GVC (HGVC)', vesselType:'PCTC', active:true},
      {id:'V04', vesselName:'GLOVIS CENTURY', vesselCode:'GCE (HGCE)', vesselType:'PCTC', active:true},
      {id:'V05', vesselName:'GLOVIS CHALLENGE', vesselCode:'GCG (HGCG)', vesselType:'PCTC', active:true},
      {id:'V06', vesselName:'GLOVIS COURAGE', vesselCode:'GCO (HGCO)', vesselType:'PCTC', active:true},
      {id:'V07', vesselName:'GLOVIS CHAMPION', vesselCode:'GCN (HGCN)', vesselType:'PCTC', active:true},
      {id:'V08', vesselName:'GLOVIS CONDOR', vesselCode:'GCD (HGCD)', vesselType:'PCTC', active:true},
      {id:'V09', vesselName:'GLOVIS CARDINAL', vesselCode:'GCA (HGCA)', vesselType:'PCTC', active:true},
      {id:'V10', vesselName:'GLOVIS COMPANION', vesselCode:'GOP (HGOP)', vesselType:'PCTC', active:true},
      {id:'V11', vesselName:'GLOVIS COUGAR', vesselCode:'GCU (HGCU)', vesselType:'PCTC', active:true},
      {id:'V12', vesselName:'GLOVIS SPIRIT', vesselCode:'GSP (HGSP)', vesselType:'PCTC', active:true},
      {id:'V13', vesselName:'GLOVIS SUPREME', vesselCode:'GSU (HGSU)', vesselType:'PCTC', active:true},
      {id:'V14', vesselName:'GLOVIS SUPERIOR', vesselCode:'GSE (HGSE)', vesselType:'PCTC', active:true},
      {id:'V15', vesselName:'GLOVIS SUNRISE', vesselCode:'GSZ (HGSZ)', vesselType:'PCTC', active:true},
      {id:'V16', vesselName:'GLOVIS SUMMIT', vesselCode:'GSM (HGSM)', vesselType:'PCTC', active:true},
      {id:'V17', vesselName:'GLOVIS SYMPHONY', vesselCode:'GSY (HGSY)', vesselType:'PCTC', active:true},
      {id:'V18', vesselName:'GLOVIS SOLOMON', vesselCode:'GLS (HGLS)', vesselType:'PCTC', active:true},
      {id:'V19', vesselName:'GLOVIS SPLENDOR', vesselCode:'GLE (HGLE)', vesselType:'PCTC', active:true},
      {id:'V20', vesselName:'GLOVIS SIRIUS', vesselCode:'GOU (HGOU)', vesselType:'PCTC', active:true},
      {id:'V21', vesselName:'GLOVIS SPRING', vesselCode:'GSR (HGSR)', vesselType:'PCTC', active:true},
      {id:'V22', vesselName:'GLOVIS CROWN', vesselCode:'GSC (SMCW)', vesselType:'PCTC', active:true},
      {id:'V23', vesselName:'GLOVIS CRYSTAL', vesselCode:'GCY (SMCR)', vesselType:'PCTC', active:true},
      {id:'V24', vesselName:'GLOVIS CAPTAIN', vesselCode:'GTN (SMCP)', vesselType:'PCTC', active:true},
      {id:'V25', vesselName:'GLOVIS COSMOS', vesselCode:'GSS (SMCS)', vesselType:'PCTC', active:true},
      {id:'V26', vesselName:'GLOVIS SUN', vesselCode:'GSN (SMSN)', vesselType:'PCTC', active:true},
      {id:'V27', vesselName:'GLOVIS STELLA', vesselCode:'GTA (SMST)', vesselType:'PCTC', active:true},
      {id:'V28', vesselName:'GLOVIS SONIC', vesselCode:'GOS (SMSO)', vesselType:'PCTC', active:true},
      {id:'V29', vesselName:'GLOVIS SAFETY', vesselCode:'GSA (SMSA)', vesselType:'PCTC', active:true},
      {id:'V30', vesselName:'GLOVIS SKY', vesselCode:'GKY (SMSK)', vesselType:'PCTC', active:true},
      {id:'V31', vesselName:'GLOVIS SUNLIGHT', vesselCode:'GLL (SMSU)', vesselType:'PCTC', active:true},
      {id:'V32', vesselName:'GLOVIS SILVER', vesselCode:'SVR (HSVR)', vesselType:'PCTC', active:true},
      {id:'V33', vesselName:'GLOVIS ADVANCE', vesselCode:'GLAV (GLAV)', vesselType:'BULK', active:true},
      {id:'V34', vesselName:'GLOVIS DESIRE', vesselCode:'GLDE (SMGD)', vesselType:'BULK', active:true},
      {id:'V35', vesselName:'GLOVIS DAYLIGHT', vesselCode:'GLDY (SMDL)', vesselType:'BULK', active:true},
      {id:'V36', vesselName:'GLOVIS DIAMOND', vesselCode:'GLDA (SMDM)', vesselType:'BULK', active:true},
      {id:'V37', vesselName:'VL RENAISSANCE', vesselCode:'VLRN (VLRN)', vesselType:'VLCC', active:true},
      {id:'V38', vesselName:'VL BREEZE', vesselCode:'VLBZ (VLBZ)', vesselType:'VLCC', active:true},
      {id:'V39', vesselName:'VL BRIGHT', vesselCode:'VLBT (VLBT)', vesselType:'VLCC', active:true},
      {id:'V40', vesselName:'VL PIONEER', vesselCode:'VLPO (VLPO)', vesselType:'VLCC', active:true},
      {id:'V41', vesselName:'NAVIOS CONSTELLATION', vesselCode:'SMAK (SMAK)', vesselType:'CNTR', active:true},
      {id:'V42', vesselName:'NAVIOS UNISON', vesselCode:'SMAM (SMAM)', vesselType:'CNTR', active:true},
      {id:'V43', vesselName:'HMM OCEAN', vesselCode:'SMHO (SMHO)', vesselType:'CNTR', active:true},
      {id:'V44', vesselName:'HMM SKY', vesselCode:'SMHS (SMHS)', vesselType:'CNTR', active:true},
      {id:'V45', vesselName:'JOO HYE', vesselCode:'SMJH (SMJH)', vesselType:'BULK', active:true},
      {id:'V46', vesselName:'BOYANG TAURUS', vesselCode:'SMBT (SMBT)', vesselType:'BULK', active:true},
      {id:'V47', vesselName:'WOODSIDE SCARLET IBIS', vesselCode:'WOSI (WOSI)', vesselType:'LNG', active:true},
      {id:'V48', vesselName:'VL BRILLIANT', vesselCode:'VLBR (VLBR)', vesselType:'VLCC', active:true},
      {id:'V49', vesselName:'VL PRIME', vesselCode:'VLPM (VLPM)', vesselType:'VLCC', active:true},
      {id:'V50', vesselName:'VL PROSPERITY', vesselCode:'VLPP (VLPP)', vesselType:'VLCC', active:true},
      {id:'V51', vesselName:'OC GRANDE', vesselCode:'OCGD (OCGD)', vesselType:'CHEMICAL', active:true},
      {id:'V52', vesselName:'V. PROGRESS', vesselCode:'VPRO (VPRO)', vesselType:'VLCC', active:true},
      {id:'V53', vesselName:'TAEBAEK EXPLORER', vesselCode:'TEEX (TEEX)', vesselType:'LPG', active:true},
      {id:'V54', vesselName:'SOBAEK EXPLORER', vesselCode:'SOEX (SOEX)', vesselType:'LPG', active:true}
    ];
    saveAll(KEYS.vessels, vessels);

    const approvers = [
      { id: 'A001', name: '박민수', nameEn: 'Minsu Park', role: 'supervisor', active: true },
      { id: 'A002', name: '이정호', nameEn: 'Jungho Lee', role: 'supervisor', active: true },
      { id: 'A003', name: '김태훈', nameEn: 'Taehoon Kim', role: 'supervisor', active: true },
      { id: 'A004', name: '최영진', nameEn: 'Youngjin Choi', role: 'teamlead', active: true },
      { id: 'A005', name: '정수현', nameEn: 'Soohyun Jung', role: 'teamlead', active: true }
    ];
    saveAll(KEYS.approvers, approvers);

    const kinds = KIND_MASTER_DEFINITIONS.map(k => ({ ...k }));
    saveAll(KEYS.kinds, kinds);

    const categories = [
      { id: 'C01', name: 'PMS', nameKo: 'PMS' },
      { id: 'C02', name: 'NON_PMS', nameKo: 'NON_PMS' },
      { id: 'C03', name: '입거비용', nameKo: '입거비용' },
      { id: 'C04', name: '입거투자', nameKo: '입거투자' },
      { id: 'C05', name: '기타관리비', nameKo: '기타관리비' },
      { id: 'C06', name: '국적변경', nameKo: '국적변경' },
      { id: 'C07', name: '정책비', nameKo: '정책비' },
      { id: 'C08', name: '선용품', nameKo: '선용품' },
      { id: 'C09', name: '초도', nameKo: '초도' }
    ];
    saveAll(KEYS.categories, categories);

    const ports = [
      { id: 'P001', country: 'KR', countryName: '한국', name: 'Busan', nameKo: '부산' },
      { id: 'P002', country: 'KR', countryName: '한국', name: 'Gwangyang', nameKo: '광양' },
      { id: 'P003', country: 'KR', countryName: '한국', name: 'Ulsan', nameKo: '울산' },
      { id: 'P021', country: 'CN', countryName: '중국', name: 'Shanghai', nameKo: '상하이' },
      { id: 'P022', country: 'CN', countryName: '중국', name: 'Qingdao', nameKo: '칭다오' },
      { id: 'P023', country: 'CN', countryName: '중국', name: 'Ningbo', nameKo: '닝보' },
      { id: 'P041', country: 'SG', countryName: '싱가포르', name: 'Singapore', nameKo: '싱가포르' },
      { id: 'P061', country: 'AE', countryName: 'UAE', name: 'Dubai', nameKo: '두바이' },
      { id: 'P081', country: 'NL', countryName: '네덜란드', name: 'Rotterdam', nameKo: '로테르담' }
    ];
    saveAll(KEYS.ports, ports);

    const accounts = Array.from(new Set(kinds.map(k=>k.glv))).map((code,i) => ({
      id: 'AC'+String(i+1).padStart(2,'0'),
      code: code,
      name: 'GLV Code ' + code,
      nameKo: 'GLV 계정 ' + code
    }));
    saveAll(KEYS.accounts, accounts);

    const vendors = [
      { id: 'VD01', name: '해양테크(주)', code: 'VEN-001' },
      { id: 'VD02', name: '마린에지니어링', code: 'VEN-002' },
      { id: 'VD03', name: '글로벌선박수리', code: 'VEN-003' },
      { id: 'VD04', name: '대양마린', code: 'VEN-004' },
      { id: 'VD05', name: '오션스페어즈', code: 'VEN-005' },
      { id: 'VD06', name: '항해통신네트워크', code: 'VEN-006' },
      { id: 'VD07', name: '선체도장정비(주)', code: 'VEN-007' },
      { id: 'VD08', name: '제일선용품', code: 'VEN-008' },
      { id: 'VD09', name: '안전해상장비', code: 'VEN-009' },
      { id: 'VD10', name: '터보차저메이트', code: 'VEN-010' },
      { id: 'VD11', name: '에코스크러버테크', code: 'VEN-011' },
      { id: 'VD12', name: '보일러마이스터', code: 'VEN-012' },
      { id: 'VD13', name: '씨월드메인터넌스', code: 'VEN-013' },
      { id: 'VD14', name: '엔진부품조달(주)', code: 'VEN-014' },
      { id: 'VD15', name: '드라이도크서포트', code: 'VEN-015' },
      { id: 'VD16', name: '네비시스템즈', code: 'VEN-016' },
      { id: 'VD17', name: '일렉트릭마린', code: 'VEN-017' },
      { id: 'VD18', name: '한국수산장비', code: 'VEN-018' },
      { id: 'VD19', name: '퍼시픽서플라이', code: 'VEN-019' },
      { id: 'VD20', name: '유니버셜부품(주)', code: 'VEN-020' },
      { id: 'VD21', name: '부산마린서비스', code: 'VEN-021' },
      { id: 'VD22', name: '싱가포르파츠', code: 'VEN-022' },
      { id: 'VD23', name: '상하이리페어', code: 'VEN-023' },
      { id: 'VD24', name: '유럽마린네트워크', code: 'VEN-024' },
      { id: 'VD25', name: '글로벌엔진수리', 일: 'VEN-025' },
      { id: 'VD26', name: '밸브테크(주)', code: 'VEN-026' },
      { id: 'VD27', name: '라이프보트안전', code: 'VEN-027' },
      { id: 'VD28', name: '배터리앤파워', code: 'VEN-028' },
      { id: 'VD29', name: '해광엔지니어링', code: 'VEN-029' },
      { id: 'VD30', name: '동양선박지원(주)', code: 'VEN-030' }
    ];
    for (let i = 31; i <= 218; i++) {
      vendors.push({ id: `VD${String(i).padStart(3,'0')}`, name: `협력업체_${String(i).padStart(3,'0')}(주)`, code: `VEN-${String(i).padStart(3,'0')}` });
    }
    saveAll('inv_vendors', vendors);

    const users = [
      { id: 'U1', username: 'super1', password: '1', role: 'supervisor', name: '박감독' },
      { id: 'U2', username: 'team1', password: '1', role: 'teamlead', name: '최팀장' },
      { id: 'U3', username: 'vendor1', password: '1', role: 'vendor', name: '해양테크(주)', vendorId: 'VD01' }
    ];
    saveAll('inv_users', users);

    const demoInvoices = generateDemoInvoices(vessels, kinds, categories, ports, accounts, approvers, vendors);
    saveAll(KEYS.invoices, demoInvoices);

    localStorage.setItem(KEYS.initialized, 'true');
    return true;
  }

  function generateDemoInvoices(vessels, kinds, categories, ports, accounts, approvers, vendors) {
    const invoices = [];
    const statuses = ['제출완료', '감독확인', '팀장확인'];
    const currencies = ['USD', 'KRW', 'EUR', 'JPY', 'SGD'];

    for (let i = 0; i < 25; i++) {
      const vessel = vessels[i % vessels.length];
      const vendor = vendors[i % vendors.length];
      const kindObj = kinds[Math.floor(Math.random() * kinds.length)];
      const catObj = categories.find(c => c.name === kindObj.category) || categories[0];
      const port = ports[i % ports.length];
      const acct = accounts.find(a => a.code === kindObj.glv) || accounts[0];
      const currency = currencies[i % currencies.length];

      const baseDate = new Date();
      baseDate.setMonth(baseDate.getMonth() - Math.floor(Math.random() * 6));
      baseDate.setDate(Math.floor(Math.random() * 28) + 1);
      const startDate = new Date(baseDate);
      const endDate = new Date(baseDate);
      endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 14) + 1);

      let estimated, actual;
      if (currency === 'KRW') {
        estimated = Math.floor((Math.random() * 90 + 10) * 100) * 10000;
      } else if (currency === 'JPY') {
        estimated = Math.floor((Math.random() * 900 + 100)) * 10000;
      } else {
        estimated = Math.floor(Math.random() * 45000 + 5000);
      }
      actual = estimated + Math.floor((Math.random() - 0.3) * 0.3 * estimated);
      if (actual < 0) actual = estimated;

      const difference = actual - estimated;
      const differenceRate = estimated > 0 ? Number(((difference / estimated) * 100).toFixed(1)) : 0;

      const statusIdx = Math.min(Math.floor(Math.random() * 3), 2);
      
      let approval = {
        supervisor: { name: null, date: null, status: 'pending', comment: '' },
        teamLead: { name: null, date: null, status: 'pending', comment: '' }
      };

      if (statusIdx >= 1) {
        approval.supervisor = {
          name: approvers[0].name,
          date: new Date(endDate.getTime() + 86400000 * 2).toISOString().slice(0, 10),
          status: 'approved', comment: '확인 완료'
        };
      }
      if (statusIdx >= 2) {
        approval.teamLead = {
          name: approvers[3].name,
          date: new Date(endDate.getTime() + 86400000 * 4).toISOString().slice(0, 10),
          status: 'approved', comment: '승인합니다'
        };
      }

      invoices.push({
        id: `COV-2026-${String(i + 1).padStart(4, '0')}`,
        vendorId: vendor.id,
        vendorName: vendor.name,
        vesselName: vessel.vesselName,
        vesselCode: vessel.vesselCode,
        kind: statusIdx > 0 ? kindObj.name : '',
        orderNo: `${String(Math.floor(Math.random() * 90000000 + 10000000))}`,
        acctNo: statusIdx > 0 ? acct.code : '',
        category: statusIdx > 0 ? catObj.name : '',
        workDescription: `${kindObj.name} 관련 작업`,
        workDescriptionKo: `${kindObj.name} 수리 및 점검`,
        currency: currency,
        estimatedAmount: estimated,
        actualAmount: actual,
        difference: difference,
        differenceRate: differenceRate,
        workStartDate: startDate.toISOString().slice(0, 10),
        workEndDate: endDate.toISOString().slice(0, 10),
        workPort: port.name,
        isPlanned: Math.random() > 0.3,
        opsConsulted: Math.random() > 0.4,
        reason: '정기 점검',
        remarks: statusIdx > 0 ? `GMS Code: ${kindObj.gms}` : '',
        approval: approval,
        status: statuses[statusIdx],
        isDuplicate: false,
        duplicateWarnings: [],
        createdAt: new Date(startDate.getTime() - 86400000 * 3).toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: vendor.id
      });
    }

    return invoices;
  }

  function resetData() {
    Object.values(KEYS).forEach(key => localStorage.removeItem(key));
    localStorage.removeItem('inv_users');
    localStorage.removeItem('inv_vendors');
    seedDemoData();
  }

  /* ---- PUBLIC API ---- */
  return {
    KEYS,
    // Invoice
    getInvoices, getInvoice, addInvoice, updateInvoice, deleteInvoice, generateInvoiceId,
    // Vessels
    getVessels, addVessel, updateVessel, deleteVessel,
    // Approvers
    getApprovers, addApprover, updateApprover, deleteApprover,
    // Users & Vendors
    getUsers: () => getAll('inv_users'),
    getVendors: () => getAll('inv_vendors'),
    // Master
    getKinds, lookupGmsGlvByCostAndKind, getCategories, getPorts, getAccounts,
    addMasterItem, updateMasterItem, deleteMasterItem,
    // Settings
    getSettings, saveSetting,
    // Export
    exportCSV, downloadCSV,
    // Demo
    seedDemoData, resetData,
    // Generic
    getAll, saveAll, add, update, remove
  };
})();

// Auto-migrate to new 54 vessels data, 218 vendors & ports
if(Storage.getVessels().length < 10 || Storage.getPorts().length < 8 || !Storage.getUsers() || Storage.getUsers().length === 0) { 
  Storage.resetData(); 
  console.log("Master Data has been migrated to the new schema.");
}
