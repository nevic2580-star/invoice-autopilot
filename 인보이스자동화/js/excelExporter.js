/* ============================================
   EXCEL EXPORTER - SheetJS (XLSX) Export
   ============================================ */
const ExcelExporter = (() => {

  function isSheetJSLoaded() {
    return typeof XLSX !== 'undefined';
  }

  /* --- Invoice List Export --- */
  function exportInvoiceList() {
    if (!isSheetJSLoaded()) {
      App.showToast('error', '오류', 'Excel 라이브러리가 로드되지 않았습니다. 인터넷 연결을 확인하세요.');
      return;
    }

    const invoices = Storage.getInvoices();
    if (!invoices.length) {
      App.showToast('warning', '경고', '내보낼 인보이스가 없습니다.');
      return;
    }

    const wb = XLSX.utils.book_new();

    // --- Sheet 1: Invoice List ---
    const headers = [
      'ID', '선박명 (Vessel)', '선박코드 (Code)', 'Kind', 'R.O No.', 'ACCT. NO',
      '분류 (Category)', '작업내역 (Work Description)', '통화 (Currency)',
      '견적금액 (Estimated)', '실제금액 (Actual)', '차이 (Difference)', '차이율 (%)',
      '작업시작 (Start)', '작업종료 (End)', '작업항구 (Port)',
      '계획 (Planned)', '운항협의 (Ops)', '사유 (Reason)', '비고 (Remarks)',
      '상태 (Status)', '업체명 (Vendor)',
      '감독 (Supervisor)', '감독일 (Date)', '팀장 (Team Lead)', '팀장일 (Date)',
      '발행일자 (Invoice Date)', '접수일자 (Received Date)'
    ];

    const rows = invoices.map(i => [
      i.id, i.vesselName, i.vesselCode, i.kind, 'RO' + i.orderNo, i.acctNo,
      i.category, i.workDescription, i.currency,
      i.estimatedAmount, i.actualAmount, i.difference, i.differenceRate,
      i.workStartDate, i.workEndDate, i.workPort,
      i.isPlanned ? 'Y' : 'N', i.opsConsulted ? 'Y' : 'N',
      i.reason, i.remarks, i.status, i.vendorName || '',
      i.approval?.supervisor?.name || '', i.approval?.supervisor?.date || '',
      i.approval?.teamLead?.name || '', i.approval?.teamLead?.date || '',
      i.invoiceDate || '',
      i.createdAt ? i.createdAt.slice(0, 10) : ''
    ]);

    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Column widths
    ws['!cols'] = [
      { wch: 16 }, { wch: 22 }, { wch: 16 }, { wch: 18 }, { wch: 12 }, { wch: 12 },
      { wch: 14 }, { wch: 30 }, { wch: 8 },
      { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 8 },
      { wch: 12 }, { wch: 12 }, { wch: 14 },
      { wch: 6 }, { wch: 6 }, { wch: 20 }, { wch: 20 },
      { wch: 10 }, { wch: 16 },
      { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
      { wch: 14 }, { wch: 14 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, '인보이스 목록');

    // --- Sheet 2: Summary by Vessel ---
    const vesselGroups = {};
    invoices.forEach(inv => {
      if (!vesselGroups[inv.vesselName]) vesselGroups[inv.vesselName] = { count: 0, est: 0, act: 0, code: inv.vesselCode };
      vesselGroups[inv.vesselName].count++;
      vesselGroups[inv.vesselName].est += inv.estimatedAmount || 0;
      vesselGroups[inv.vesselName].act += inv.actualAmount || 0;
    });

    const summaryHeaders = ['선박명 (Vessel)', '선박코드 (Code)', '건수 (Count)', '총 견적 (Est.)', '총 실적 (Actual)', '차이 (Diff)', '차이율 (%)'];
    const summaryRows = Object.entries(vesselGroups).map(([name, d]) => {
      const diff = d.act - d.est;
      const rate = d.est > 0 ? ((diff / d.est) * 100).toFixed(1) : 0;
      return [name, d.code, d.count, d.est, d.act, diff, Number(rate)];
    }).sort((a, b) => b[4] - a[4]);

    const ws2 = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
    ws2['!cols'] = [{ wch: 24 }, { wch: 16 }, { wch: 8 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 8 }];
    XLSX.utils.book_append_sheet(wb, ws2, '선박별 요약');

    // --- Sheet 3: Summary by Kind ---
    const kindGroups = {};
    invoices.forEach(inv => {
      const k = inv.kind || 'Unknown';
      if (!kindGroups[k]) kindGroups[k] = { count: 0, est: 0, act: 0 };
      kindGroups[k].count++;
      kindGroups[k].est += inv.estimatedAmount || 0;
      kindGroups[k].act += inv.actualAmount || 0;
    });

    const kindHeaders = ['Kind 구분', '건수 (Count)', '총 견적 (Est.)', '총 실적 (Actual)', '차이 (Diff)', '차이율 (%)'];
    const kindRows = Object.entries(kindGroups).map(([name, d]) => {
      const diff = d.act - d.est;
      const rate = d.est > 0 ? ((diff / d.est) * 100).toFixed(1) : 0;
      return [name, d.count, d.est, d.act, diff, Number(rate)];
    }).sort((a, b) => b[3] - a[3]);

    const ws3 = XLSX.utils.aoa_to_sheet([kindHeaders, ...kindRows]);
    ws3['!cols'] = [{ wch: 30 }, { wch: 8 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 8 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Kind별 요약');

    // Download
    const fileName = `인보이스_보고서_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
    App.showToast('success', 'Excel 다운로드', `${fileName} 파일이 저장되었습니다.`);
    NotificationCenter.logActivity({ action: 'export', detail: 'Excel 인보이스 목록 다운로드' });
  }

  /* --- Advance Payment Export --- */
  function exportAdvancePayment(vesselGroups, accountGroups, categoryGroups, kindGroups, grandTotal, month, invoices) {
    if (!isSheetJSLoaded()) {
      App.showToast('error', '오류', 'Excel 라이브러리가 로드되지 않았습니다.');
      return;
    }

    const wb = XLSX.utils.book_new();
    
    // Sheet 1: List Detail
    const headers1 = ['선박명 (Vessel)', '업체명 (Vendor)', '계정 (ACCT. NO)', '비용구분 (Cost Cat.)', '기기분류 (Eq Cat.)', '원본 통화 (Currency)', '원본 금액 (Orig. Amt)', 'USD 금액 (USD Amt)'];
    const rows1 = invoices.map(i => [
      i.vesselName, i.vendorName || '-', i.acctNo || '-', i.category || '기타', i.kind || '-', i.currency, i.actualAmount || i.estimatedAmount, i.usdAmount
    ]);
    const ws1 = XLSX.utils.aoa_to_sheet([[`선급금 대상 목록 - ${month}`], [], headers1, ...rows1]);
    ws1['!cols'] = [{ wch: 22 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws1, '대상 목록');

    // Sheet 2: Summary By Vessel
    const headers2 = ['선박명 (Vessel)', '건수 (Count)', '청구 금액 (USD Amount)'];
    const rows2 = Object.entries(vesselGroups).sort().map(([vessel, data]) => [vessel, data.count, data.amount]);
    rows2.push(['합계 (Total)', rows2.reduce((s, r) => s + r[1], 0), grandTotal]);
    const ws2 = XLSX.utils.aoa_to_sheet([[`선박별 선급금 청구 - ${month}`], [], headers2, ...rows2]);
    ws2['!cols'] = [{ wch: 26 }, { wch: 10 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws2, '선박별 요약');

    // Sheet 3: Summary By Account
    const headers3 = ['계정 (GLV Account)', '건수 (Count)', '청구 금액 (USD Amount)'];
    const rows3 = Object.entries(accountGroups).sort().map(([acct, data]) => [acct, data.count, data.amount]);
    rows3.push(['합계 (Total)', rows3.reduce((s, r) => s + r[1], 0), grandTotal]);
    const ws3 = XLSX.utils.aoa_to_sheet([[`계정별 선급금 청구 - ${month}`], [], headers3, ...rows3]);
    ws3['!cols'] = [{ wch: 26 }, { wch: 10 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws3, '계정별 요약');

    // Sheet 4: Summary By Category
    const headers4 = ['비용 구분 (Cost Category)', '건수 (Count)', '청구 금액 (USD Amount)'];
    const rows4 = Object.entries(categoryGroups).sort().map(([cat, data]) => [cat, data.count, data.amount]);
    rows4.push(['합계 (Total)', rows4.reduce((s, r) => s + r[1], 0), grandTotal]);
    const ws4 = XLSX.utils.aoa_to_sheet([[`비용구분별 선급금 청구 - ${month}`], [], headers4, ...rows4]);
    ws4['!cols'] = [{ wch: 26 }, { wch: 10 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws4, '비용구분별 요약');

    // Sheet 5: Summary By Kind
    const headers5 = ['기기 분류 (Eq Category)', '건수 (Count)', '청구 금액 (USD Amount)'];
    const rows5 = Object.entries(kindGroups).sort().map(([kind, data]) => [kind, data.count, data.amount]);
    rows5.push(['합계 (Total)', rows5.reduce((s, r) => s + r[1], 0), grandTotal]);
    const ws5 = XLSX.utils.aoa_to_sheet([[`기기분류별 선급금 청구 - ${month}`], [], headers5, ...rows5]);
    ws5['!cols'] = [{ wch: 26 }, { wch: 10 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws5, '기기분류별 요약');

    const fileName = `선급금_청구서_${month}.xlsx`;
    XLSX.writeFile(wb, fileName);
    App.showToast('success', 'Excel 다운로드', `${fileName} 파일이 저장되었습니다.`);
    NotificationCenter.logActivity({ action: 'export', detail: `선급금 청구서 다운로드 (${month})` });
  }

  return { exportInvoiceList, exportAdvancePayment, isSheetJSLoaded };
})();
