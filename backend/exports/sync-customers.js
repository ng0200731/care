/**
 * Run in browser console at localhost:3002
 * This script:
 * 1. Extracts all customer data from localStorage
 * 2. Sends it to the backend database
 * 3. Shows what was found
 */
(async function() {
  const allCustomers = [];

  // 1. Scan ALL localStorage keys for customer data
  console.log('=== SCANNING LOCALSTORAGE ===');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    console.log(`Key: ${key}`);

    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const data = JSON.parse(raw);

      // Check if this has customer info
      if (Array.isArray(data)) {
        data.forEach(item => {
          if (item.customerName || item.companyName || item.customerId) {
            allCustomers.push({
              source: key,
              id: item.id || item.projectId || '',
              customerName: item.customerName || item.companyName || '',
              person: item.person || item.contact || item.contactPerson || '',
              email: item.email || item.emailPrefix || '',
              tel: item.tel || item.phone || item.companyTel || '',
            });
          }
        });
      } else if (data && typeof data === 'object') {
        if (data.customerName || data.companyName) {
          allCustomers.push({
            source: key,
            id: data.id || '',
            customerName: data.customerName || data.companyName || '',
            person: data.person || data.contact || '',
            email: data.email || '',
            tel: data.tel || '',
          });
        }
      }
    } catch(e) {}
  }

  // 2. Deduplicate by customerName
  const unique = [];
  const seen = new Set();
  allCustomers.forEach(c => {
    const key = c.customerName.toLowerCase().trim();
    if (key && !seen.has(key)) {
      seen.add(key);
      unique.push(c);
    }
  });

  console.log('=== ALL CUSTOMERS FOUND ===');
  console.log(`Total: ${unique.length}`);
  unique.forEach((c, i) => console.log(`${i+1}. ${c.customerName} (from: ${c.source})`));

  // 3. Send to backend
  try {
    const resp = await fetch('/api/customers/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customers: unique })
    });
    const result = await resp.json();
    console.log('=== SYNC RESULT ===', result);
  } catch(e) {
    console.log('Backend sync failed:', e.message);
    // Fallback: copy to clipboard
    const json = JSON.stringify(unique, null, 2);
    await navigator.clipboard.writeText(json);
    console.log('Customer data copied to clipboard!');
  }
})();
