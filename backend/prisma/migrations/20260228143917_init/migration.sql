-- CreateTable
CREATE TABLE "UserInfo" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "currentCTC" TEXT,
    "expectedCTC" TEXT,
    "noticePeriod" TEXT,
    "isServing" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "location" TEXT,
    "linkedinUrl" TEXT,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpEmail" TEXT,
    "smtpPassword" TEXT,
    "aiTone" TEXT NOT NULL DEFAULT 'formal',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeProfile" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "rawText" TEXT NOT NULL,
    "profileSummary" JSONB NOT NULL,
    "skills" JSONB,
    "experience" JSONB,
    "education" JSONB,
    "projects" JSONB,
    "uploadedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" SERIAL NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "hrEmail" TEXT,
    "jobUrl" TEXT,
    "extractedJob" JSONB NOT NULL,
    "generatedCv" TEXT NOT NULL,
    "emailSubject" TEXT NOT NULL,
    "emailBody" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);
