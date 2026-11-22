export interface DemoLabReport {
  id: string;
  fileName: string;
  title: string;
  fileType: string;
  type: string;
  date: string;
  createdAt: string;
  status: 'reviewed' | 'pending';
  isActive?: boolean;
  aiSummary?: string;
  extractedData?: {
    rawText?: string;
    healthScore?: number;
    abnormalValues?: {
      name: string;
      value: string;
      normalRange: string;
      status: string;
      clinicalSignificance?: string;
      possibleCauses?: string[];
    }[];
    normalValues?: any[];
    conditions?: { name: string; severity: string; description?: string }[];
  };
  flags?: {
    vitalsFromReport?: Record<string, number | null>;
    medications?: any[];
    nutrition?: any;
    symptomsToWatch?: any[];
    mentalHealth?: any;
    recommendations?: any[];
    alerts?: any[];
  };
}

const globalForDemo = globalThis as unknown as {
  __demoLabReports?: Map<string, DemoLabReport[]>;
};

const demoMap = globalForDemo.__demoLabReports ?? new Map<string, DemoLabReport[]>();
globalForDemo.__demoLabReports = demoMap;

export function isDbConfigured(): boolean {
  const url = process.env.DATABASE_URL || '';
  return url.startsWith('mysql://') && !url.includes('user:password@localhost');
}

export function getDemoReports(userId: string): DemoLabReport[] {
  return demoMap.get(userId) || [];
}

export function addDemoReport(userId: string, report: DemoLabReport): void {
  const existing = (demoMap.get(userId) || []).map((r) => ({ ...r, isActive: false }));
  demoMap.set(userId, [{ ...report, isActive: true }, ...existing].slice(0, 20));
}

export function activateDemoReport(userId: string, reportId: string): boolean {
  const list = demoMap.get(userId);
  if (!list) return false;
  let found = false;
  const updated = list.map((r) => {
    if (r.id === reportId) {
      found = true;
      return { ...r, isActive: true };
    }
    return { ...r, isActive: false };
  });
  demoMap.set(userId, updated);
  return found;
}
