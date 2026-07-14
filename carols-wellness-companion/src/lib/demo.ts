import { prisma } from './prisma';
import { today, addDays } from './date';
import { isPeptideDueOn } from './schedule';
import { INJECTION_SITES } from './schedule';

/** Remove all user data (used by demo reset). */
export async function clearAllData() {
  await prisma.$transaction([
    prisma.doseLog.deleteMany({}),
    prisma.chatMessage.deleteMany({}),
    prisma.waterLog.deleteMany({}),
    prisma.mealLog.deleteMany({}),
    prisma.moodEnergyLog.deleteMany({}),
    prisma.sleepLog.deleteMany({}),
    prisma.journalEntry.deleteMany({}),
    prisma.weighIn.deleteMany({}),
    prisma.peptide.deleteMany({}),
  ]);
}

/**
 * Populate a realistic demo dataset: profile, peptides, 8 weeks of weigh-ins,
 * dose history, water, mood, sleep, and a couple of journal entries.
 */
export async function seedDemoData() {
  await clearAllData();
  const start = today();

  // Profile
  const profile = await prisma.profile.findFirst();
  const profileData = {
    name: 'Carol',
    heightIn: 65,
    startingWeight: 182,
    goalWeight: 150,
    targetDate: addDays(start, 90),
    goals: ['Lose weight', 'More energy', 'Better sleep'],
    waterGoalOz: 64,
    onboarded: true,
  };
  if (profile) {
    await prisma.profile.update({ where: { id: profile.id }, data: profileData });
  } else {
    await prisma.profile.create({ data: profileData });
  }

  // Peptides
  const sema = await prisma.peptide.create({
    data: {
      name: 'Semaglutide',
      dose: '0.5 mg',
      route: 'injection',
      scheduleType: 'weekdays',
      weekdays: [1], // Mondays
      timeOfDay: 'morning',
    },
  });
  const bpc = await prisma.peptide.create({
    data: {
      name: 'BPC-157',
      dose: '250 mcg',
      route: 'injection',
      scheduleType: 'daily',
      timeOfDay: 'evening',
    },
  });
  const nad = await prisma.peptide.create({
    data: {
      name: 'NAD+',
      dose: '50 mg',
      route: 'oral',
      scheduleType: 'cycle',
      cycleOnDays: 5,
      cycleOffDays: 2,
      cycleAnchor: addDays(start, -56),
      timeOfDay: 'morning',
    },
  });
  const peptides = [sema, bpc, nad];

  // 56 days of history
  const doseData: { peptideId: string; date: Date; injectionSite: string | null }[] = [];
  const waterData: { date: Date; amountOz: number }[] = [];
  const moodData: { date: Date; mood: number; energy: number }[] = [];
  const sleepData: { date: Date; hours: number }[] = [];
  let siteIdx = 0;

  for (let i = 56; i >= 0; i--) {
    const d = addDays(start, -i);
    for (const p of peptides) {
      if (!isPeptideDueOn(p, d)) continue;
      // ~88% adherence, and don't pre-log the remainder of today
      const skip = i === 0 ? p.timeOfDay === 'evening' : Math.random() < 0.12;
      if (skip) continue;
      const site = p.route === 'injection' ? INJECTION_SITES[siteIdx++ % INJECTION_SITES.length] : null;
      doseData.push({ peptideId: p.id, date: d, injectionSite: site });
    }
    // water: 3-8 increments
    const cups = 3 + Math.floor(Math.random() * 6);
    for (let c = 0; c < cups; c++) waterData.push({ date: d, amountOz: 8 });
    moodData.push({ date: d, mood: 3 + Math.floor(Math.random() * 3), energy: 2 + Math.floor(Math.random() * 4) });
    sleepData.push({ date: d, hours: 6 + Math.round(Math.random() * 6) / 2 });
  }

  await prisma.doseLog.createMany({ data: doseData });
  await prisma.waterLog.createMany({ data: waterData });
  await prisma.moodEnergyLog.createMany({ data: moodData });
  await prisma.sleepLog.createMany({ data: sleepData });

  // Weekly weigh-ins trending down from 182 -> ~168
  const weighInData: { date: Date; weight: number; waist: number; hips: number }[] = [];
  let w = 182;
  for (let week = 8; week >= 0; week--) {
    weighInData.push({
      date: addDays(start, -week * 7),
      weight: Math.round(w * 10) / 10,
      waist: Math.round((34 - (8 - week) * 0.3) * 10) / 10,
      hips: Math.round((42 - (8 - week) * 0.25) * 10) / 10,
    });
    w -= 1.6 + Math.random();
  }
  await prisma.weighIn.createMany({ data: weighInData });

  // Journal
  await prisma.journalEntry.createMany({
    data: [
      {
        date: addDays(start, -10),
        title: 'Feeling hopeful',
        content: 'Down almost 12 lbs and my energy is noticeably better in the mornings. Proud of showing up.',
      },
      {
        date: addDays(start, -3),
        title: 'Tough day',
        content: 'Cravings were rough today but I drank my water and got a walk in. Small wins count.',
      },
    ],
  });
}
