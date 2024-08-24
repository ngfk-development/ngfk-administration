/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `projects` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "contacts_harvest_id_moneybird_id_moneybird_version_idx";

-- DropIndex
DROP INDEX "customers_harvest_id_moneybird_id_moneybird_version_moneybi_idx";

-- DropIndex
DROP INDEX "projects_harvest_id_jira_id_moneybird_id_updated_at_idx";

-- CreateTable
CREATE TABLE "epics" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "harvest_id" INTEGER,
    "jira_id" TEXT,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL,
    "created_origin" "Service" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_origin" "Service" NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "epics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "epics_harvest_id_key" ON "epics"("harvest_id");

-- CreateIndex
CREATE UNIQUE INDEX "epics_jira_id_key" ON "epics"("jira_id");

-- CreateIndex
CREATE UNIQUE INDEX "epics_code_key" ON "epics"("code");

-- CreateIndex
CREATE INDEX "contacts_moneybird_version_first_name_last_name_email_idx" ON "contacts"("moneybird_version", "first_name", "last_name", "email");

-- CreateIndex
CREATE INDEX "customers_moneybird_version_moneybird_customer_number_idx" ON "customers"("moneybird_version", "moneybird_customer_number");

-- CreateIndex
CREATE UNIQUE INDEX "projects_code_key" ON "projects"("code");

-- CreateIndex
CREATE INDEX "projects_updated_at_idx" ON "projects"("updated_at");

-- AddForeignKey
ALTER TABLE "epics" ADD CONSTRAINT "epics_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
