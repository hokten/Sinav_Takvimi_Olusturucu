/*
  Warnings:

  - You are about to drop the column `departmentId` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `isSharedSource` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `parentId` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `mainDeptId` on the `Instructor` table. All the data in the column will be lost.
  - You are about to drop the column `sideDeptIds` on the `Instructor` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `RoomAssignment` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `SharedExamSupervisors` table. All the data in the column will be lost.
  - You are about to drop the column `fromDepartmentId` on the `SlotRequest` table. All the data in the column will be lost.
  - You are about to drop the `UserDepartment` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[roomId,programId]` on the table `RoomAssignment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[examId,programId]` on the table `SharedExamSupervisors` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `programId` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `programId` to the `Exam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mainProgramId` to the `Instructor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `programId` to the `RoomAssignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `programId` to the `SharedExamSupervisors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fromProgramId` to the `SlotRequest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserProgramType" AS ENUM ('MAIN', 'SIDE');

-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "Department" DROP CONSTRAINT "Department_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Exam" DROP CONSTRAINT "Exam_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "Instructor" DROP CONSTRAINT "Instructor_mainDeptId_fkey";

-- DropForeignKey
ALTER TABLE "RoomAssignment" DROP CONSTRAINT "RoomAssignment_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "SharedExamSupervisors" DROP CONSTRAINT "SharedExamSupervisors_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "SlotRequest" DROP CONSTRAINT "SlotRequest_fromDepartmentId_fkey";

-- DropForeignKey
ALTER TABLE "UserDepartment" DROP CONSTRAINT "UserDepartment_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "UserDepartment" DROP CONSTRAINT "UserDepartment_userId_fkey";

-- DropIndex
DROP INDEX "RoomAssignment_roomId_departmentId_key";

-- DropIndex
DROP INDEX "SharedExamSupervisors_examId_departmentId_key";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "departmentId",
ADD COLUMN     "programId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Department" DROP COLUMN "color",
DROP COLUMN "isSharedSource",
DROP COLUMN "parentId";

-- AlterTable
ALTER TABLE "Exam" DROP COLUMN "departmentId",
ADD COLUMN     "programId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Instructor" DROP COLUMN "mainDeptId",
DROP COLUMN "sideDeptIds",
ADD COLUMN     "mainProgramId" TEXT NOT NULL,
ADD COLUMN     "sideProgramIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "RoomAssignment" DROP COLUMN "departmentId",
ADD COLUMN     "programId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SharedExamSupervisors" DROP COLUMN "departmentId",
ADD COLUMN     "programId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SlotRequest" DROP COLUMN "fromDepartmentId",
ADD COLUMN     "fromProgramId" TEXT NOT NULL;

-- DropTable
DROP TABLE "UserDepartment";

-- DropEnum
DROP TYPE "UserDepartmentType";

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "isSharedSource" BOOLEAN NOT NULL DEFAULT false,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProgram" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "type" "UserProgramType" NOT NULL DEFAULT 'MAIN',

    CONSTRAINT "UserProgram_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProgram_userId_programId_key" ON "UserProgram"("userId", "programId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomAssignment_roomId_programId_key" ON "RoomAssignment"("roomId", "programId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedExamSupervisors_examId_programId_key" ON "SharedExamSupervisors"("examId", "programId");

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgram" ADD CONSTRAINT "UserProgram_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProgram" ADD CONSTRAINT "UserProgram_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomAssignment" ADD CONSTRAINT "RoomAssignment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Instructor" ADD CONSTRAINT "Instructor_mainProgramId_fkey" FOREIGN KEY ("mainProgramId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedExamSupervisors" ADD CONSTRAINT "SharedExamSupervisors_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotRequest" ADD CONSTRAINT "SlotRequest_fromProgramId_fkey" FOREIGN KEY ("fromProgramId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
