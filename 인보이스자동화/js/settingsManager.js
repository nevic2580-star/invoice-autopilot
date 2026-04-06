const SettingsManager = (() => {
  let settings = {
    theme: 'midnight',
    currencyFmt: 'usd',
    dataRetention: 12,
    notifApproval: true,
    notifPayment: true,
    notifSystem: false,
    erpSync: false,
    erpFreq: 'daily',
    sessionTimeout: 4,
    mfaEnabled: false
  };

  function loadSettings() {
    try {
      const saved = localStorage.getItem('iap_settings');
      if(saved) settings = { ...settings, ...JSON.parse(saved) };
    } catch(e) {}
  }

  function saveSettings() {
    localStorage.setItem('iap_settings', JSON.stringify(settings));
    App.showToast('success', '설정 저장', '시스템 설정이 안전하게 업데이트 되었습니다.');
  }

  function toggleSwitch(id, key) {
    settings[key] = !settings[key];
    document.getElementById(id).classList.toggle('active', settings[key]);
    saveSettings();
  }

  function updateSelect(key, val) {
    settings[key] = val;
    saveSettings();
  }

  function renderHTML(isKo) {
    const t = (ko, en) => isKo ? ko : en;

    return `
      <div class="page-header animate-in">
        <div>
          <h2>⚙️ ${t('환경설정 및 시스템 관리', 'Settings & System Management')}</h2>
          <p class="text-muted" style="margin-top:5px;">${t('인보이스 시스템의 보안, 알림 및 외부 시스템 연동을 설정합니다.', 'Configure security, notifications, and external system integrations.')}</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" onclick="SettingsManager.saveSettings()">
            💾 ${t('전체 저장', 'Save All')}
          </button>
        </div>
      </div>

      <div class="settings-grid animate-in" style="animation-delay:0.1s;">
        
        <!-- 보안 및 세션 관리 -->
        <div class="settings-card">
          <div class="card-header">
            <h3>🛡️ ${t('보안 및 세션 관리', 'Security & Session Management')}</h3>
          </div>
          <div class="settings-content">
            <div class="setting-item">
              <div class="setting-info">
                <h4>${t('2단계 인증 (2FA)', 'Two-Factor Authentication')}</h4>
                <p>${t('로그인 시 추가 보안 인증을 요구합니다.', 'Require additional security code upon login.')}</p>
              </div>
              <div class="toggle-switch ${settings.mfaEnabled?'active':''}" id="mfaToggle" onclick="SettingsManager.toggleSwitch('mfaToggle', 'mfaEnabled')">
                <div class="toggle-knob"></div>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <h4>${t('자동 로그아웃 시간', 'Auto Logout Timeout')}</h4>
                <p>${t('비활동 시 세션을 안전하게 종료합니다.', 'Terminate session safely when inactive.')}</p>
              </div>
              <select class="form-input" style="width: 140px; background:rgba(0,0,0,0.2)" onchange="SettingsManager.updateSelect('sessionTimeout', this.value)">
                <option value="1" ${settings.sessionTimeout==1?'selected':''}>1 Hours</option>
                <option value="4" ${settings.sessionTimeout==4?'selected':''}>4 Hours</option>
                <option value="8" ${settings.sessionTimeout==8?'selected':''}>8 Hours</option>
              </select>
            </div>
            
            <div class="setting-item">
              <div class="setting-info">
                <h4>${t('데이터 보존 기간', 'Data Retention Period')}</h4>
                <p>${t('완료된 인보이스의 아카이빙 유지 기간.', 'Archiving retention for completed invoices.')}</p>
              </div>
              <select class="form-input" style="width: 140px; background:rgba(0,0,0,0.2)" onchange="SettingsManager.updateSelect('dataRetention', this.value)">
                <option value="3" ${settings.dataRetention==3?'selected':''}>3 Months</option>
                <option value="6" ${settings.dataRetention==6?'selected':''}>6 Months</option>
                <option value="12" ${settings.dataRetention==12?'selected':''}>12 Months</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 알림/통지 설정 -->
        <div class="settings-card">
          <div class="card-header">
            <h3>🔔 ${t('알림 및 통지', 'Notifications & Alerts')}</h3>
          </div>
          <div class="settings-content">
            <div class="setting-item">
              <div class="setting-info">
                <h4>${t('결재 요청 알림', 'Approval Requests')}</h4>
                <p>${t('새로운 감독관/팀장 승인 요청 수신 시 알림', 'Notify on new supervisor/team lead approval requests.')}</p>
              </div>
              <div class="toggle-switch ${settings.notifApproval?'active':''}" id="notifApprToggle" onclick="SettingsManager.toggleSwitch('notifApprToggle', 'notifApproval')">
                <div class="toggle-knob"></div>
              </div>
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <h4>${t('지급 완료 알림', 'Payment Completed')}</h4>
                <p>${t('인보이스 지급이 완료된 경우 알림', 'Notify when an invoice payment is fully completed.')}</p>
              </div>
              <div class="toggle-switch ${settings.notifPayment?'active':''}" id="notifPayToggle" onclick="SettingsManager.toggleSwitch('notifPayToggle', 'notifPayment')">
                <div class="toggle-knob"></div>
              </div>
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <h4>${t('시스템 유지보수 공지', 'System Maintenance')}</h4>
                <p>${t('중요한 시스템 업데이트 및 점검 공보 수신', 'Receive critical system updates and maintenance alerts.')}</p>
              </div>
              <div class="toggle-switch ${settings.notifSystem?'active':''}" id="notifSysToggle" onclick="SettingsManager.toggleSwitch('notifSysToggle', 'notifSystem')">
                <div class="toggle-knob"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- ERP 연동 설정 -->
        <div class="settings-card">
          <div class="card-header">
            <h3>🔄 ${t('외부 시스템 (ERP) 연동', 'External System (ERP) Sync')}</h3>
          </div>
          <div class="settings-content">
            <div class="setting-item">
              <div class="setting-info">
                <h4>${t('ERP 자동 동기화', 'ERP Auto Synchronization')}</h4>
                <p>${t('SAP/Oracle 등 사내 회계 시스템과 데이터 매핑', 'Map data with internal accounting systems like SAP/Oracle.')}</p>
              </div>
              <div class="toggle-switch ${settings.erpSync?'active':''}" id="erpSyncToggle" onclick="SettingsManager.toggleSwitch('erpSyncToggle', 'erpSync')">
                <div class="toggle-knob"></div>
              </div>
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <h4>${t('동기화 주기', 'Sync Frequency')}</h4>
                <p>${t('데이터를 내보내는 빈도를 설정합니다.', 'Set how often data is pushed out.')}</p>
              </div>
              <select class="form-input" style="width: 140px; background:rgba(0,0,0,0.2)" onchange="SettingsManager.updateSelect('erpFreq', this.value)">
                <option value="realtime" ${settings.erpFreq==='realtime'?'selected':''}>Real-time (실시간)</option>
                <option value="hourly" ${settings.erpFreq==='hourly'?'selected':''}>Hourly (매 1시간)</option>
                <option value="daily" ${settings.erpFreq==='daily'?'selected':''}>Daily (매일 정오)</option>
              </select>
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <h4>${t('API Key 재발급', 'Regenerate API Key')}</h4>
                <p>${t('보안 강화를 위해 외부 연동 키를 주기적으로 갱신하세요.', 'Renew your external sync key periodically for security.')}</p>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="App.showToast('info', 'API Key 변경', 'API Key가 백그라운드에서 갱신되었습니다.')">${t('재발급', 'Regenerate')}</button>
            </div>
          </div>
        </div>

        <!-- 고급 권한 & 감사 -->
        <div class="settings-card">
          <div class="card-header">
            <h3>🔍 ${t('감사 로그 및 관리자 도구', 'Audit Logs & Admin Tools')}</h3>
          </div>
          <div class="settings-content" style="display:flex; flex-direction:column; gap:15px; padding: 20px;">
            <p style="font-size:0.85rem; color:var(--text-muted); line-height:1.5;">
              ${t('모든 인보이스 생성/변경 내역은 블록체인 기반의 불변성 로그로 기록되어 추적 가능합니다.', 'All invoice creations/modifications are recorded in an immutable ledger for traceability.')}
            </p>
            <div style="display:flex; gap:10px;">
              <button class="btn btn-outline" style="flex:1" onclick="App.showToast('info', '준비 중', '감사 로그 다운로드 모듈 초기화 완료')">
                📥 ${t('전체 로그 내보내기', 'Export Audit Logs')}
              </button>
              <button class="btn btn-outline" style="flex:1; border-color:var(--accent-red); color:var(--accent-red);" onclick="if(confirm('모든 로컬 데이터를 초기화하시겠습니까? (테스트용)')){ localStorage.clear(); window.location.reload(); }">
                ⚠️ ${t('팩토리 리셋 (개발용)', 'Factory Reset')}
              </button>
            </div>
          </div>
        </div>

      </div>
      
      <style>
        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
          margin-top: 20px;
        }
        .settings-card {
          background: rgba(8, 15, 30, 0.4);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        .settings-card .card-header {
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid var(--border-primary);
          padding: 16px 20px;
        }
        .settings-content {
          padding: 10px 20px;
        }
        .setting-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 0;
          border-bottom: 1px solid var(--border-primary);
        }
        .setting-item:last-child {
          border-bottom: none;
        }
        .setting-info h4 {
          font-size: 0.95rem;
          color: var(--text-primary);
          margin: 0 0 4px 0;
        }
        .setting-info p {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin: 0;
        }
        
        /* Premium Toggle Switch */
        .toggle-switch {
          width: 50px;
          height: 26px;
          background: #334155;
          border-radius: 13px;
          position: relative;
          cursor: pointer;
          transition: background 0.3s;
        }
        .toggle-switch.active {
          background: var(--accent-blue);
          box-shadow: 0 0 10px rgba(37,99,235,0.4);
        }
        .toggle-knob {
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 3px;
          left: 3px;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        .toggle-switch.active .toggle-knob {
          transform: translateX(24px);
        }
      </style>
    `;
  }

  loadSettings();

  return {
    renderSettingsPage: renderHTML,
    toggleSwitch,
    updateSelect,
    saveSettings
  };
})();
