// E2E module test — visit each nav item, verify data loads, report any issues.
// Run via agent-browser eval.

(async () => {
  const modules = [
    'dashboard', 'followups', 'notifications',
    'leads', 'appointments', 'calls', 'counselling',
    'students', 'courses', 'enrollments', 'batches',
    'payments', 'emi', 'invoices', 'income', 'expenses',
    'colleges', 'collegeApplications',
    'companies', 'jobOpenings', 'jobApplications', 'placements',
    'employees', 'targets', 'incentiveRules',
    'offices', 'auditLogs', 'reports', 'settings',
  ];
  const results = {};
  for (const mod of modules) {
    // Navigate by setting hash
    window.location.hash = mod;
    await new Promise(r => setTimeout(r, 1500));
    const h1 = document.querySelector('h1')?.textContent || 'NO HEADING';
    const rows = document.querySelectorAll('table tbody tr').length;
    const emptyState = document.body.textContent?.includes('No records found') || document.body.textContent?.includes('No data');
    const errorState = document.body.textContent?.includes('error') || document.body.textContent?.includes('Error');
    results[mod] = { heading: h1.slice(0, 40), rows, empty: emptyState, error: errorState };
  }
  document.title = JSON.stringify(results);
})();
