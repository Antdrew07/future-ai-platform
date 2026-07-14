/** Tiny classNames helper (no external dependency). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** Clamp a number between min and max. */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Round to a fixed number of decimals, returning a number. */
export function round(n: number, decimals = 1): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

/** Compute BMI from weight (lbs) and height (inches). Returns null if invalid. */
export function bmi(weightLbs?: number | null, heightIn?: number | null): number | null {
  if (!weightLbs || !heightIn) return null;
  const val = (703 * weightLbs) / (heightIn * heightIn);
  if (!isFinite(val) || val <= 0) return null;
  return round(val, 1);
}

/** Rotating "foods that support you today" suggestions. */
export const FOOD_SUGGESTIONS: string[][] = [
  ['Greek yogurt with berries', 'Salmon & greens', 'Eggs and avocado', 'A handful of almonds'],
  ['Cottage cheese & fruit', 'Grilled chicken salad', 'Lentil soup', 'Turkey roll-ups'],
  ['Protein smoothie', 'Tuna & mixed greens', 'Roasted veggies & tofu', 'Edamame'],
  ['Oatmeal with chia', 'Shrimp stir-fry', 'Chicken & quinoa bowl', 'Apple with peanut butter'],
  ['Veggie omelette', 'Steak & asparagus', 'Baked cod & broccoli', 'Cheese & walnuts'],
  ['Berry protein bowl', 'Chicken lettuce wraps', 'Bean & veggie chili', 'Hard-boiled eggs'],
  ['Smoked salmon toast', 'Grilled fish tacos (lettuce)', 'Turkey & sweet potato', 'Pistachios'],
];

/** Deterministic pick of a food-suggestion set for a given date. */
export function foodsForDate(d: Date): string[] {
  const dayIndex = Math.floor(d.getTime() / (1000 * 60 * 60 * 24));
  return FOOD_SUGGESTIONS[((dayIndex % FOOD_SUGGESTIONS.length) + FOOD_SUGGESTIONS.length) % FOOD_SUGGESTIONS.length];
}

export const MOOD_EMOJI = ['😞', '😕', '😐', '🙂', '😄'];
export const ENERGY_EMOJI = ['🔋', '🥱', '😌', '⚡', '🔥'];
