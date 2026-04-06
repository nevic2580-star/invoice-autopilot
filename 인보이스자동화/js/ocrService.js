/* ============================================
   OCR SERVICE - Simulation for Data Extraction
   ============================================ */
const OcrService = (() => {
  // Simulate AI data extraction delay
  function extractData(file, onProgress, onComplete, lang = 'ko') {
    let progress = 0;
    
    // Fake progress animation
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress > 100) progress = 100;
      onProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete(generateMockExtractedData(file));
        }, 500);
      }
    }, 300);
  }

  function generateMockExtractedData(file) {
    const vessels = Storage.getVessels();
    const kinds = Storage.getKinds();
    const ports = Storage.getPorts();

    const randomOf = (arr) => arr[Math.floor(Math.random() * arr.length)];
    
    const est = Math.floor(Math.random() * 40000) + 5000;
    const act = est + Math.floor((Math.random() - 0.2) * 2000);
    
    const today = new Date();
    const start = new Date(today.getTime() - 86400000 * (Math.floor(Math.random() * 20) + 10));
    const end = new Date(start.getTime() + 86400000 * (Math.floor(Math.random() * 10) + 3));

    const selectedKind = randomOf(kinds);

    return {
      vesselName: randomOf(vessels).vesselName,
      kind: selectedKind.name,
      orderNo: `RO-${today.getFullYear()}-${Math.floor(Math.random()*9000)+1000}`,
      currency: 'USD',
      estimatedAmount: est,
      actualAmount: act > 0 ? act : est,
      workStartDate: start.toISOString().split('T')[0],
      workEndDate: end.toISOString().split('T')[0],
      workPort: randomOf(ports).name,
      confidenceScore: Math.floor(Math.random() * 10) + 90
    };
  }

  return {
    extractData
  };
})();
