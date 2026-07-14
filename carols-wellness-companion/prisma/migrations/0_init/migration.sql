-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Carol',
    "heightIn" DOUBLE PRECISION,
    "startingWeight" DOUBLE PRECISION,
    "goalWeight" DOUBLE PRECISION,
    "targetDate" TIMESTAMP(3),
    "goals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "waterGoalOz" INTEGER NOT NULL DEFAULT 64,
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Peptide" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "route" TEXT NOT NULL DEFAULT 'injection',
    "scheduleType" TEXT NOT NULL DEFAULT 'daily',
    "weekdays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "cycleOnDays" INTEGER,
    "cycleOffDays" INTEGER,
    "cycleAnchor" TIMESTAMP(3),
    "timeOfDay" TEXT NOT NULL DEFAULT 'morning',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Peptide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoseLog" (
    "id" TEXT NOT NULL,
    "peptideId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "injectionSite" TEXT,

    CONSTRAINT "DoseLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeighIn" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "waist" DOUBLE PRECISION,
    "hips" DOUBLE PRECISION,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeighIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaterLog" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "amountOz" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaterLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealLog" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "mealType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MealLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoodEnergyLog" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "mood" INTEGER NOT NULL,
    "energy" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoodEnergyLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SleepLog" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SleepLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Peptide_active_idx" ON "Peptide"("active");

-- CreateIndex
CREATE INDEX "DoseLog_date_idx" ON "DoseLog"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DoseLog_peptideId_date_key" ON "DoseLog"("peptideId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WeighIn_date_key" ON "WeighIn"("date");

-- CreateIndex
CREATE INDEX "WaterLog_date_idx" ON "WaterLog"("date");

-- CreateIndex
CREATE INDEX "MealLog_date_idx" ON "MealLog"("date");

-- CreateIndex
CREATE UNIQUE INDEX "MoodEnergyLog_date_key" ON "MoodEnergyLog"("date");

-- CreateIndex
CREATE UNIQUE INDEX "SleepLog_date_key" ON "SleepLog"("date");

-- CreateIndex
CREATE INDEX "JournalEntry_date_idx" ON "JournalEntry"("date");

-- CreateIndex
CREATE INDEX "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "DoseLog" ADD CONSTRAINT "DoseLog_peptideId_fkey" FOREIGN KEY ("peptideId") REFERENCES "Peptide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

