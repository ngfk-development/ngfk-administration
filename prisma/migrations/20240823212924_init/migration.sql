-- CreateEnum
CREATE TYPE "Service" AS ENUM ('moneybird', 'harvest', 'jira');

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "harvest_id" INTEGER,
    "moneybird_id" TEXT,
    "moneybird_version" INTEGER,
    "moneybird_customer_number" TEXT,
    "company_name" TEXT,
    "address" TEXT,
    "zipcode" TEXT,
    "city" TEXT,
    "country" TEXT,
    "chamber_of_commerce_number" TEXT,
    "tax_number" TEXT,
    "created_origin" "Service" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_origin" "Service" NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "harvest_id" INTEGER,
    "moneybird_id" TEXT,
    "moneybird_version" INTEGER,
    "first_name" TEXT,
    "last_name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "title" TEXT,
    "created_origin" "Service" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_origin" "Service" NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "harvest_id" INTEGER,
    "jira_id" TEXT,
    "moneybird_id" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "active" BOOLEAN NOT NULL,
    "billable" BOOLEAN NOT NULL,
    "hourly_rate" INTEGER NOT NULL,
    "created_origin" "Service" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_origin" "Service" NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_harvest_id_key" ON "customers"("harvest_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_moneybird_id_key" ON "customers"("moneybird_id");

-- CreateIndex
CREATE INDEX "customers_harvest_id_moneybird_id_moneybird_version_moneybi_idx" ON "customers"("harvest_id", "moneybird_id", "moneybird_version", "moneybird_customer_number");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_harvest_id_key" ON "contacts"("harvest_id");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_moneybird_id_key" ON "contacts"("moneybird_id");

-- CreateIndex
CREATE INDEX "contacts_harvest_id_moneybird_id_moneybird_version_idx" ON "contacts"("harvest_id", "moneybird_id", "moneybird_version");

-- CreateIndex
CREATE UNIQUE INDEX "projects_harvest_id_key" ON "projects"("harvest_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_jira_id_key" ON "projects"("jira_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_moneybird_id_key" ON "projects"("moneybird_id");

-- CreateIndex
CREATE INDEX "projects_harvest_id_jira_id_moneybird_id_updated_at_idx" ON "projects"("harvest_id", "jira_id", "moneybird_id", "updated_at");

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
