import { z } from 'zod';

export const peptideInput = z.object({
  name: z.string().min(1).max(80),
  dose: z.string().min(1).max(40),
  route: z.enum(['injection', 'oral']).default('injection'),
  scheduleType: z.enum(['daily', 'weekdays', 'cycle']).default('daily'),
  weekdays: z.array(z.number().int().min(0).max(6)).default([]),
  cycleOnDays: z.number().int().positive().max(90).nullable().optional(),
  cycleOffDays: z.number().int().nonnegative().max(90).nullable().optional(),
  cycleAnchor: z.string().nullable().optional(), // ISO date
  timeOfDay: z.string().max(20).default('morning'),
});

export type PeptideInput = z.infer<typeof peptideInput>;

export const onboardingSchema = z.object({
  name: z.string().min(1).max(60).default('Carol'),
  heightIn: z.number().positive().max(100).nullable().optional(),
  startingWeight: z.number().positive().max(1500).nullable().optional(),
  goalWeight: z.number().positive().max(1500).nullable().optional(),
  targetDate: z.string().nullable().optional(),
  goals: z.array(z.string()).default([]),
  waterGoalOz: z.number().int().positive().max(500).default(64),
  peptides: z.array(peptideInput).default([]),
});

export const HEALTH_GOALS = [
  'Lose weight',
  'Build lean muscle',
  'More energy',
  'Better sleep',
  'Balanced mood',
  'Healthy skin & hair',
  'Reduce inflammation',
  'Longevity',
];
