export type PeptideDTO = {
  id: string;
  name: string;
  dose: string;
  route: string;
  timeOfDay: string;
  logged: boolean;
  injectionSite: string | null;
};

export type MealDTO = { id: string; mealType: string; description: string };

export type DashboardDTO = {
  todayISO: string;
  name: string;
  duePeptides: PeptideDTO[];
  waterOz: number;
  waterGoalOz: number;
  mood: number | null;
  energy: number | null;
  sleepHours: number | null;
  meals: MealDTO[];
  streak: number;
  lastInjectionSite: string | null;
  foods: string[];
};
