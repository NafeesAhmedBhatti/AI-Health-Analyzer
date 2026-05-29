// ─── Lab Report Types ─────────────────────────────────

export interface AbnormalValue {
  name: string;
  value: string | number;
  unit: string;
  status: string;
  normalRange?: string;
  category?: string;
}

export interface HealthCondition {
  name: string;
  severity: string;
  description?: string;
}

export interface Recommendation {
  text: string;
  urgency?: string;
  category?: string;
  evidence?: string;
}

export interface ExtractedData {
  healthScore?: number;
  confidence?: number;
  abnormalValues?: AbnormalValue[];
  normalValues?: AbnormalValue[];
  conditions?: HealthCondition[];
}

export interface ReportFlags {
  recommendations?: Recommendation[];
  vitalsFromReport?: Record<string, number>;
  medications?: MedicationInfo[];
  nutrition?: NutritionInfo;
  mentalHealth?: MentalHealthInfo;
  alerts?: AlertInfo[];
}

export interface ActiveReport {
  id: string;
  fileName: string;
  fileType: string;
  createdAt: string;
}

// ─── Medication Types ────────────────────────────────

export interface MedicationInfo {
  name: string;
  dosage: string;
  frequency: string;
  reason?: string;
  brandName?: string;
  category?: string;
  sideEffects?: string[];
  contraindications?: string[];
  monitoring?: string;
  durationWeeks?: number;
}

// ─── Nutrition Types ─────────────────────────────────

export interface MacroSplit {
  protein: string;
  carbs: string;
  fats: string;
}

export interface Meal {
  name: string;
  time: string;
  calories: number;
  foods: string[];
}

export interface FoodItem {
  name: string;
  reason: string;
  servingSize?: string;
  alternative?: string;
}

export interface Supplement {
  name: string;
  dosage: string;
  reason: string;
}

export interface NutritionPlan {
  dailyCalories: number;
  macroSplit: MacroSplit;
  meals: Meal[];
  weeklyPlan: Record<string, string[]>;
  foodsToAdd: FoodItem[];
  foodsToAvoid: FoodItem[];
  supplements: Supplement[];
}

export interface NutritionInfo {
  name?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

// ─── Vitals Types ────────────────────────────────────

export interface VitalSummary {
  type: string;
  value: number;
  unit: string;
  recordedAt: string;
  anomaly?: {
    isAbnormal: boolean;
    severity: string;
    message: string;
  };
}

export interface VitalReading {
  id: string;
  type: string;
  value: number;
  unit: string;
  recordedAt: string;
  anomaly?: {
    isAbnormal: boolean;
    severity: string;
    message: string;
  };
}

// ─── Alert Types ─────────────────────────────────────

export interface AlertInfo {
  title: string;
  message: string;
  severity: string;
  type: string;
}

export interface HealthAlert {
  id: string;
  title: string;
  message: string;
  severity: string;
  type: string;
  read: boolean;
  createdAt: string;
}

// ─── Mental Health Types ─────────────────────────────

export interface MentalHealthInfo {
  moodScore?: number;
  anxietyScore?: number;
  energyScore?: number;
  sleepQuality?: number;
  notes?: string;
  exercise?: ExerciseInfo;
  relaxationTips?: string[];
  cognitiveEffects?: string;
  professionalHelp?: string;
  anxietyRisk?: string;
}

export interface ExerciseInfo {
  type: string;
  duration: string;
  frequency: string;
  notes: string;
}

// ─── Chat Types ──────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Dashboard Types ─────────────────────────────────

export interface DashboardStats {
  heartRate: number | null;
  bloodPressure: string | null;
  bloodPressureSys: number | null;
  bloodPressureDia: number | null;
  oxygenLevel: number | null;
  weight: number | null;
  temperature: number | null;
  bmi: number | null;
  activeMedications: number;
  unreadAlerts: number;
  totalLabReports: number;
}

export interface DashboardData {
  healthScore: number;
  aiInsight: string;
  confidence: number;
  recommendations: Recommendation[];
  conditions: HealthCondition[];
  abnormalValues: AbnormalValue[];
  activeReport: ActiveReport | null;
  stats: DashboardStats;
  labReports: { id: string; fileName: string; fileType: string; status: string; createdAt: string }[];
  alerts: HealthAlert[];
}

// ─── Trends Types ────────────────────────────────────

export interface HealthScorePoint {
  date: string;
  score: number;
  reportName: string;
}

export interface VitalChartPoint {
  date: string;
  value: number;
  unit: string;
}

export interface MoodDataPoint {
  date: string;
  moodScore: number;
  anxietyScore: number;
  energyScore: number;
  sleepQuality: number;
}

export interface TrendsData {
  vitalsByType: Record<string, VitalChartPoint[]>;
  moodData: MoodDataPoint[];
  healthScores: HealthScorePoint[];
  days: number;
}