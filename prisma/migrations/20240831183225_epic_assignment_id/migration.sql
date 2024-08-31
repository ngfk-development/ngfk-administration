/*
  Warnings:

  - A unique constraint covering the columns `[harvest_assignment_id]` on the table `epics` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "epics" ADD COLUMN     "harvest_assignment_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "epics_harvest_assignment_id_key" ON "epics"("harvest_assignment_id");
