-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "isSharedSource" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "isShared" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "SharedExamSupervisors" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "supervisorIds" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "SharedExamSupervisors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedExamSupervisors_examId_departmentId_key" ON "SharedExamSupervisors"("examId", "departmentId");

-- AddForeignKey
ALTER TABLE "SharedExamSupervisors" ADD CONSTRAINT "SharedExamSupervisors_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedExamSupervisors" ADD CONSTRAINT "SharedExamSupervisors_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
