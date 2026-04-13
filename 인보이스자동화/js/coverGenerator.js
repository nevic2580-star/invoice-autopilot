/* ============================================
   COVER GENERATOR - Invoice Cover Page
   ============================================ */

const CoverGenerator = (() => {
  function generateCoverHTML(invoice, lang = 'ko') {
    const isKo = lang === 'ko';
    const diff = invoice.difference || (invoice.actualAmount - invoice.estimatedAmount);
    const diffRate = invoice.differenceRate || (invoice.estimatedAmount > 0
      ? ((diff / invoice.estimatedAmount) * 100).toFixed(1)
      : 0);
    const diffClass = diff > 0 ? 'diff-positive' : diff < 0 ? 'diff-negative' : 'diff-neutral';

    return `
    <div class="cover-preview print-area" id="coverPrintArea">
      <div class="cover-info">
        ${isKo ? '문서번호' : 'Doc No.'}: ${invoice.id} &nbsp;|&nbsp;
        ${isKo ? '작성일' : 'Date'}: ${new Date(invoice.createdAt).toLocaleDateString(isKo ? 'ko-KR' : 'en-US')}
      </div>

      <h2>📋 ${isKo ? 'INVOICE COVER PAGE' : 'INVOICE COVER PAGE'}</h2>

      <table class="cover-table">
        <tbody>
          <tr>
            <th>${isKo ? '선박명' : 'Vessel Name'}</th>
            <td>${invoice.vesselName || '-'}</td>
            <th>${isKo ? '선박코드' : 'Vessel Code'}</th>
            <td>${invoice.vesselCode || '-'}</td>
          </tr>
          <tr>
            <th>${isKo ? '비용 구분' : 'Cost Category'}</th>
            <td>${invoice.category || '-'}</td>
            <th>R.O ${isKo ? '번호' : 'No.'}</th>
            <td>${invoice.orderNo || '-'}</td>
          </tr>
          <tr>
            <th>${isKo ? '기기 분류' : 'Eq. Category'}</th>
            <td>${invoice.kind || '-'}</td>
            <th>GMS / GLV ${isKo ? '코드' : 'Code'}</th>
            <td><span style="font-weight:600">${invoice.gmsCode || '-'}</span> / ${invoice.acctNo || '-'}</td>
          </tr>
          <tr>
            <th>${isKo ? '작업상세 내역' : 'Work Description'}</th>
            <td colspan="3">${(isKo ? invoice.workDescriptionKo || invoice.workDescription : invoice.workDescription) || '-'}</td>
          </tr>
          <tr>
            <th>${isKo ? '통화' : 'Currency'}</th>
            <td>${invoice.currency || '-'}</td>
            <th>${isKo ? '견적금액' : 'Estimated Amount'}</th>
            <td style="text-align: right; font-weight: 600;">${formatCurrency(invoice.estimatedAmount, invoice.currency)}</td>
          </tr>
          <tr>
            <th>${isKo ? '실제발생금액' : 'Actual Amount'}</th>
            <td style="text-align: right; font-weight: 600;">${formatCurrency(invoice.actualAmount, invoice.currency)}</td>
            <th>${isKo ? '견적가대비 실적가 차이' : 'Est. vs Actual Diff.'}</th>
            <td style="text-align: right;" class="${diffClass}">
              <strong>${diff >= 0 ? '+' : ''}${formatCurrency(diff, invoice.currency)}</strong>
              <br><span style="font-size: 0.75rem;">(${diffRate >= 0 ? '+' : ''}${diffRate}%)</span>
            </td>
          </tr>
          <tr>
            <th>${isKo ? '작업시작일' : 'Work Start'}</th>
            <td>${invoice.workStartDate || '-'}</td>
            <th>${isKo ? '작업종료일' : 'Work End'}</th>
            <td>${invoice.workEndDate || '-'}</td>
          </tr>
          <tr>
            <th>${isKo ? '작업항구' : 'Work Port'}</th>
            <td>${invoice.workPort || '-'}</td>
            <th>${isKo ? '계획반영여부' : 'Planned'}</th>
            <td>
              <span style="color: ${invoice.isPlanned ? '#10b981' : '#ef4444'}; font-weight:600;">
                ${invoice.isPlanned ? (isKo ? '✅ 예' : '✅ Yes') : (isKo ? '❌ 아니오' : '❌ No')}
              </span>
            </td>
          </tr>
          <tr>
            <th>${isKo ? '운항담당자 협의여부' : 'Ops Consultation'}</th>
            <td>
              <span style="color: ${invoice.opsConsulted ? '#10b981' : '#ef4444'}; font-weight:600;">
                ${invoice.opsConsulted ? (isKo ? '✅ 예' : '✅ Yes') : (isKo ? '❌ 아니오' : '❌ No')}
              </span>
            </td>
            <th></th>
            <td></td>
          </tr>
          <tr>
            <th>${isKo ? '발생사유' : 'Reason'}</th>
            <td colspan="3">${invoice.reason || '-'}</td>
          </tr>
          <tr>
            <th>${isKo ? '특기사항' : 'Remarks'}</th>
            <td colspan="3">${invoice.remarks || '-'}</td>
          </tr>
        </tbody>
      </table>

      <!-- Approval Section -->
      <div class="cover-approval-section">
        <div class="cover-approval-box">
          <div class="title">${isKo ? '감독확인' : 'Supervisor'}</div>
          <div class="sign-area">
            ${renderApprovalSign(invoice.approval?.supervisor, isKo)}
          </div>
        </div>
        <div class="cover-approval-box">
          <div class="title">${isKo ? '팀장확인' : 'Team Lead'}</div>
          <div class="sign-area">
            ${renderApprovalSign(invoice.approval?.teamLead, isKo)}
          </div>
        </div>
      </div>
    </div>`;
  }

  function renderApprovalSign(approval, isKo) {
    if (!approval || approval.status === 'pending') {
      return `<span style="color: #999;">${isKo ? '미결재' : 'Pending'}</span>`;
    }
    if (approval.status === 'rejected') {
      return `
        <span class="approved-stamp" style="color: #cc0000;">❌ ${isKo ? '반려' : 'Rejected'}</span>
        <span style="font-size: 0.7rem;">${approval.name || ''}</span>
        <span style="font-size: 0.65rem; color: #999;">${approval.date || ''}</span>`;
    }
    return `
      <span class="approved-stamp">✅ ${isKo ? '승인' : 'Approved'}</span>
      <span style="font-size: 0.75rem; font-weight: 600;">${approval.name || ''}</span>
      <span style="font-size: 0.65rem; color: #999;">${approval.date || ''}</span>`;
  }

  function formatCurrency(amount, currency) {
    if (amount == null || isNaN(amount)) return '-';
    const num = Number(amount);
    switch (currency) {
      case 'KRW': return '₩' + num.toLocaleString('ko-KR');
      case 'USD': return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2 });
      case 'EUR': return '€' + num.toLocaleString('en-US', { minimumFractionDigits: 2 });
      case 'JPY': return '¥' + num.toLocaleString('ja-JP');
      case 'SGD': return 'S$' + num.toLocaleString('en-US', { minimumFractionDigits: 2 });
      default: return num.toLocaleString();
    }
  }

  function printCover(invoice, lang = 'ko') {
    const html = generateCoverHTML(invoice, lang);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice Cover - ${invoice.id}</title>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Noto Sans KR', sans-serif; padding: 15mm 20mm; background: white; color: #000; }
          .cover-preview { display: flex; flex-direction: column; background: white; color: #000; padding: 0; max-width: 100%; height: 95vh; }
          .cover-preview h2 { text-align: center; font-size: 16pt; margin-bottom: 16pt; padding-bottom: 8pt; border-bottom: 2px solid #000; color: #000; }
          .cover-info { text-align: right; font-size: 9pt; color: #444; margin-bottom: 8pt; }
          .cover-table { width: 100%; border-collapse: collapse; margin-bottom: 20pt; flex: 0 0 auto; }
          .cover-table th, .cover-table td { border: 1px solid #333; padding: 6pt 8pt; font-size: 9pt; color: #000; vertical-align: middle; }
          .cover-table th { background: #e8edf5; font-weight: 700; width: 110pt; text-align: left; }
          .cover-table tr:nth-last-child(2) td, .cover-table tr:nth-last-child(1) td { height: 120pt; vertical-align: top; }
          .cover-table tr:nth-last-child(2) th, .cover-table tr:nth-last-child(1) th { vertical-align: top; padding-top: 12pt; }
          .cover-approval-section { display: flex; justify-content: flex-end; margin-top: auto; flex: 0 0 auto; }
          .cover-approval-box { width: 120pt; border: 1px solid #333; text-align: center; }
          .cover-approval-box + .cover-approval-box { border-left: none; }
          .cover-approval-box .title { background: #e8edf5; padding: 6pt; font-size: 8pt; font-weight: 700; border-bottom: 1px solid #333; }
          .cover-approval-box .sign-area { height: 60pt; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 8pt; padding: 4pt; }
          .approved-stamp { color: #0066cc; font-weight: 700; }
          .diff-positive { color: #cc0000; }
          .diff-negative { color: #006600; }
          @page { size: A4; margin: 10mm; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>${html}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }

  function showPreviewModal(invoice, lang = 'ko') {
    const html = generateCoverHTML(invoice, lang);
    const modal = document.getElementById('modal-overlay');
    if (!modal) return;

    modal.querySelector('.modal').className = 'modal modal-lg';
    modal.querySelector('.modal-header h2').textContent =
      lang === 'ko' ? '📄 인보이스 커버 미리보기' : '📄 Invoice Cover Preview';
    modal.querySelector('.modal-body').innerHTML = html;
    modal.querySelector('.modal-footer').innerHTML = `
      <button class="btn btn-secondary" onclick="App.closeModal()">
        ${lang === 'ko' ? '닫기' : 'Close'}
      </button>
      <button class="btn btn-primary" onclick="CoverGenerator.printCover(Storage.getInvoice('${invoice.id}'), '${lang}')">
        🖨️ ${lang === 'ko' ? '인쇄' : 'Print'}
      </button>
    `;
    modal.classList.add('active');
  }

  return {
    generateCoverHTML,
    formatCurrency,
    printCover,
    showPreviewModal
  };
})();
