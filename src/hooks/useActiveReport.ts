'use client';

import { useState, useEffect } from 'react';

interface ActiveReport {
  id: string;
  fileName: string;
  createdAt: string;
}

export function useActiveReport() {
  const [report, setReport] = useState<ActiveReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/active-report')
      .then(r => r.json())
      .then(data => setReport(data.activeReport))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { report, loading };
}