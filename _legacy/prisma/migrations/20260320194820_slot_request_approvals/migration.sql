-- AlterEnum
ALTER TYPE "SlotRequestStatus" ADD VALUE 'WITHDRAWN';

-- CreateTable
CREATE TABLE "SlotRequestApproval" (
    "id" TEXT NOT NULL,
    "slotRequestId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlotRequestApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SlotRequestApproval_slotRequestId_programId_key" ON "SlotRequestApproval"("slotRequestId", "programId");

-- AddForeignKey
ALTER TABLE "SlotRequestApproval" ADD CONSTRAINT "SlotRequestApproval_slotRequestId_fkey" FOREIGN KEY ("slotRequestId") REFERENCES "SlotRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotRequestApproval" ADD CONSTRAINT "SlotRequestApproval_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;
