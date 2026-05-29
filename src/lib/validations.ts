import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  gender: z.string().optional(),
});

export const vitalSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  value: z.number({ error: 'Value is required' }).finite('Invalid value'),
  unit: z.string().min(1, 'Unit is required'),
});

export const symptomSchema = z.object({
  description: z.string().min(1, 'Description is required').max(2000),
  severity: z.number().min(1).max(10),
});

export const medicationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  dosage: z.string().min(1, 'Dosage is required').max(100),
  frequency: z.string().min(1, 'Frequency is required').max(100),
  startDate: z.string().optional(),
});

export const moodSchema = z.object({
  mood: z.number().min(1).max(5),
  note: z.string().max(1000).optional(),
  stress: z.number().min(1).max(10),
  sleep: z.number().min(1).max(12),
});

export const skinSchema = z.object({
  description: z.string().min(1, 'Description is required').max(2000),
});

export const labReportSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  type: z.string().min(1, 'Type is required').max(100),
  date: z.string().optional(),
});

export const reportSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  type: z.string().min(1, 'Type is required').max(100),
});

export const familyMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  relationship: z.string().min(1, 'Relationship is required').max(50),
  conditions: z.string().optional(),
});

export const healthProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  height: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
});