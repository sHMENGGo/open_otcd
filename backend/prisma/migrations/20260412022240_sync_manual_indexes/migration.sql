CREATE EXTENSION IF NOT EXISTS "pg_trgm";


-- CreateIndex
CREATE INDEX "idx_entity_addresses_statementid" ON "latvia"."entity_addresses"("statementid");

-- CreateIndex
CREATE INDEX "idx_entity_identifiers_statementid" ON "latvia"."entity_identifiers"("statementid");

-- CreateIndex
CREATE INDEX "idx_entity_source_assertedby_statementid" ON "latvia"."entity_source_assertedby"("statementid");

-- CreateIndex
CREATE INDEX "idx_ooc_interests_statementid" ON "latvia"."ooc_interests"("statementid");

-- CreateIndex
CREATE INDEX "idx_ooc_source_assertedby_statementid" ON "latvia"."ooc_source_assertedby"("statementid");

-- CreateIndex
CREATE INDEX "idx_person_addresses_statementid" ON "latvia"."person_addresses"("statementid");

-- CreateIndex
CREATE INDEX "idx_person_identifiers_statementid" ON "latvia"."person_identifiers"("statementid");

-- CreateIndex
CREATE INDEX "idx_person_names_fullname" ON "latvia"."person_names"("fullname");

-- CreateIndex
CREATE INDEX "idx_person_names_fullname_gin" ON "latvia"."person_names" USING GIN ("fullname" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "idx_person_names_statementid" ON "latvia"."person_names"("statementid");

-- CreateIndex
CREATE INDEX "idx_person_nationalities_statementid" ON "latvia"."person_nationalities"("statementid");

-- CreateIndex
CREATE INDEX "idx_person_source_assertedby_statementid" ON "latvia"."person_source_assertedby"("statementid");
