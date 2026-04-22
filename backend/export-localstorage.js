/**
 * Run this script in the browser console at localhost:3002
 * to export all localStorage data as JSON
 *
 * Paste the output into a file: backend/exports/localstorage-export.json
 */

(function exportAllLocalStorage() {
  const allData = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    try {
      const value = localStorage.getItem(key);
      allData[key] = JSON.parse(value);
    } catch {
      allData[key] = localStorage.getItem(key);
    }
  }

  // Copy to clipboard
  const json = JSON.stringify(allData, null, 2);
  navigator.clipboard.writeText(json).then(() => {
    console.log('✅ All localStorage data copied to clipboard!');
    console.log(`Total keys: ${Object.keys(allData).length}`);
    console.log(`Total size: ${(json.length / 1024).toFixed(1)} KB`);
    console.log('\nKeys found:');
    Object.keys(allData).forEach(k => {
      const v = allData[k];
      const size = typeof v === 'string' ? v.length : JSON.stringify(v).length;
      console.log(`  ${k}: ${size} chars`);
    });

    // Also show customer-related data specifically
    console.log('\n--- CUSTOMER DATA ---');
    Object.keys(allData).forEach(k => {
      if (k.toLowerCase().includes('customer')) {
        console.log(`${k}:`, JSON.stringify(allData[k]).substring(0, 500));
      }
    });

    console.log('\n--- PROJECT DATA ---');
    Object.keys(allData).forEach(k => {
      if (k.toLowerCase().includes('project')) {
        console.log(`${k}:`, JSON.stringify(allData[k]).substring(0, 500));
      }
    });

    console.log('\n--- LAYOUT DATA ---');
    Object.keys(allData).forEach(k => {
      if (k.toLowerCase().includes('layout')) {
        const size = JSON.stringify(allData[k]).length;
        console.log(`${k}: ${size} chars`);
      }
    });

    console.log('\n--- ORDER DATA ---');
    Object.keys(allData).forEach(k => {
      if (k.toLowerCase().includes('order')) {
        console.log(`${k}:`, JSON.stringify(allData[k]).substring(0, 500));
      }
    });
  });
})();
