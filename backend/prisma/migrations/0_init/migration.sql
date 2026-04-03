-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "gleif_version_0_4";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "latvia";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "register";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "slovakia";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "uk_version_0_4";

-- CreateTable
CREATE TABLE "gleif_version_0_4"."entity_annotations" (
    "_link" TEXT,
    "_link_entity_statement" TEXT,
    "motivation" TEXT,
    "description" TEXT,
    "statementpointertarget" BOOLEAN,
    "creationdate" TIMESTAMP(6),
    "url" TEXT,
    "createdby_name" TEXT,
    "createdby_uri" TEXT
);

-- CreateTable
CREATE TABLE "gleif_version_0_4"."entity_recorddetails_addresses" (
    "_link" TEXT,
    "_link_entity_statement" TEXT,
    "type" TEXT,
    "address" TEXT,
    "postcode" TEXT,
    "country_name" TEXT,
    "country_code" TEXT
);

-- CreateTable
CREATE TABLE "gleif_version_0_4"."entity_recorddetails_identifiers" (
    "_link" TEXT,
    "_link_entity_statement" TEXT,
    "id" TEXT,
    "scheme" TEXT,
    "schemename" TEXT,
    "uri" TEXT
);

-- CreateTable
CREATE TABLE "gleif_version_0_4"."entity_source_assertedby" (
    "_link" TEXT,
    "_link_entity_statement" TEXT,
    "name" TEXT,
    "uri" TEXT
);

-- CreateTable
CREATE TABLE "gleif_version_0_4"."entity_statement" (
    "_link" TEXT,
    "statementid" TEXT,
    "declarationsubject" TEXT,
    "statementdate" TIMESTAMP(6),
    "recordid" TEXT,
    "recordstatus" TEXT,
    "recordtype" TEXT,
    "recorddetails_iscomponent" BOOLEAN,
    "recorddetails_foundingdate" TIMESTAMP(6),
    "recorddetails_name" TEXT,
    "recorddetails_uri" TEXT,
    "recorddetails_entitytype_type" TEXT,
    "recorddetails_entitytype_details" TEXT,
    "recorddetails_jurisdiction_name" TEXT,
    "recorddetails_jurisdiction_code" TEXT,
    "publicationdetails_publicationdate" TIMESTAMP(6),
    "publicationdetails_bodsversion" DECIMAL,
    "publicationdetails_license" TEXT,
    "publicationdetails_publisher_name" TEXT,
    "publicationdetails_publisher_url" TEXT,
    "source_type" TEXT,
    "source_url" TEXT,
    "recorddetails_alternatenames" TEXT,
    "recorddetails_dissolutiondate" TIMESTAMP(6)
);

-- CreateTable
CREATE TABLE "gleif_version_0_4"."relationship_annotations" (
    "_link" TEXT,
    "_link_relationship_statement" TEXT,
    "motivation" TEXT,
    "description" TEXT,
    "statementpointertarget" BOOLEAN,
    "creationdate" TIMESTAMP(6),
    "createdby_name" TEXT,
    "createdby_uri" TEXT
);

-- CreateTable
CREATE TABLE "gleif_version_0_4"."relationship_recorddetails_interests" (
    "_link" TEXT,
    "_link_relationship_statement" TEXT,
    "directorindirect" TEXT,
    "type" TEXT,
    "beneficialownershiporcontrol" BOOLEAN,
    "details" TEXT,
    "startdate" TIMESTAMP(6)
);

-- CreateTable
CREATE TABLE "gleif_version_0_4"."relationship_source_assertedby" (
    "_link" TEXT,
    "_link_relationship_statement" TEXT,
    "name" TEXT,
    "uri" TEXT
);

-- CreateTable
CREATE TABLE "gleif_version_0_4"."relationship_statement" (
    "_link" TEXT,
    "statementid" TEXT,
    "declarationsubject" TEXT,
    "statementdate" TIMESTAMP(6),
    "recordid" TEXT,
    "recordstatus" TEXT,
    "recordtype" TEXT,
    "recorddetails_subject" TEXT,
    "recorddetails_iscomponent" BOOLEAN,
    "recorddetails_interestedparty_reason" TEXT,
    "recorddetails_interestedparty_description" TEXT,
    "publicationdetails_publicationdate" TIMESTAMP(6),
    "publicationdetails_bodsversion" DECIMAL,
    "publicationdetails_license" TEXT,
    "publicationdetails_publisher_name" TEXT,
    "publicationdetails_publisher_url" TEXT,
    "source_type" TEXT,
    "source_url" TEXT,
    "recorddetails_interestedparty" TEXT
);

-- CreateTable
CREATE TABLE "latvia"."entity_addresses" (
    "_link" TEXT,
    "_link_entity_statement" TEXT,
    "type" TEXT,
    "address" TEXT,
    "country" TEXT,
    "statementid" TEXT,
    "id" SERIAL NOT NULL,

    CONSTRAINT "entity_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "latvia"."entity_identifiers" (
    "_link" TEXT,
    "_link_entity_statement" TEXT,
    "identifier_number" TEXT,
    "scheme" TEXT,
    "statementid" TEXT,
    "id" SERIAL NOT NULL,

    CONSTRAINT "entity_identifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "latvia"."entity_source_assertedby" (
    "_link" TEXT,
    "_link_entity_statement" TEXT,
    "name" TEXT,
    "statementid" TEXT,
    "id" SERIAL NOT NULL,

    CONSTRAINT "entity_source_assertedby_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "latvia"."entity_statement" (
    "_link" TEXT,
    "statementid" TEXT NOT NULL,
    "statementtype" TEXT,
    "statementdate" TIMESTAMP(6),
    "iscomponent" BOOLEAN,
    "entitytype" TEXT,
    "name" TEXT,
    "foundingdate" TIMESTAMP(6),
    "incorporatedinjurisdiction_name" TEXT,
    "incorporatedinjurisdiction_code" TEXT,
    "publicationdetails_publicationdate" TIMESTAMP(6),
    "publicationdetails_bodsversion" TEXT,
    "publicationdetails_license" TEXT,
    "publicationdetails_publisher_name" TEXT,
    "publicationdetails_publisher_url" TEXT,
    "source_type" TEXT,
    "unspecifiedentitydetails_reason" TEXT,
    "unspecifiedentitydetails_description" TEXT,

    CONSTRAINT "entity_statement_pkey" PRIMARY KEY ("statementid")
);

-- CreateTable
CREATE TABLE "latvia"."ooc_interests" (
    "_link" TEXT,
    "_link_ooc_statement" TEXT,
    "type" TEXT,
    "interestlevel" TEXT,
    "beneficialownershiporcontrol" BOOLEAN,
    "details" TEXT,
    "share_exact" DECIMAL,
    "statementid" TEXT,
    "id" SERIAL NOT NULL,

    CONSTRAINT "ooc_interests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "latvia"."ooc_source_assertedby" (
    "_link" TEXT,
    "_link_ooc_statement" TEXT,
    "name" TEXT,
    "statementid" TEXT,
    "id" SERIAL NOT NULL,

    CONSTRAINT "ooc_source_assertedby_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "latvia"."ooc_statement" (
    "_link" TEXT,
    "statementid" TEXT NOT NULL,
    "statementtype" TEXT,
    "statementdate" TIMESTAMP(6),
    "iscomponent" BOOLEAN,
    "subject_describedbyentitystatement" TEXT,
    "interestedparty_describedbypersonstatement" TEXT,
    "publicationdetails_publicationdate" TIMESTAMP(6),
    "publicationdetails_bodsversion" TEXT,
    "publicationdetails_license" TEXT,
    "publicationdetails_publisher_name" TEXT,
    "publicationdetails_publisher_url" TEXT,
    "source_type" TEXT,
    "interestedparty_describedbyentitystatement" TEXT,
    "componentstatementids" TEXT,
    "interestedparty_unspecified_reason" TEXT,
    "interestedparty_unspecified_description" TEXT,

    CONSTRAINT "ooc_statement_pkey" PRIMARY KEY ("statementid")
);

-- CreateTable
CREATE TABLE "latvia"."person_addresses" (
    "_link" TEXT,
    "_link_person_statement" TEXT,
    "type" TEXT,
    "country" TEXT,
    "statementid" TEXT,
    "id" SERIAL NOT NULL,

    CONSTRAINT "person_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "latvia"."person_identifiers" (
    "_link" TEXT,
    "_link_person_statement" TEXT,
    "identifier_number" TEXT,
    "scheme" TEXT,
    "statementid" TEXT,
    "id" SERIAL NOT NULL,

    CONSTRAINT "person_identifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "latvia"."person_names" (
    "_link" TEXT,
    "_link_person_statement" TEXT,
    "type" TEXT,
    "fullname" TEXT,
    "familyname" TEXT,
    "givenname" TEXT,
    "statementid" TEXT,
    "id" SERIAL NOT NULL,

    CONSTRAINT "person_names_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "latvia"."person_nationalities" (
    "_link" TEXT,
    "_link_person_statement" TEXT,
    "name" TEXT,
    "code" TEXT,
    "statementid" TEXT,
    "id" SERIAL NOT NULL,

    CONSTRAINT "person_nationalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "latvia"."person_source_assertedby" (
    "_link" TEXT,
    "_link_person_statement" TEXT,
    "name" TEXT,
    "statementid" TEXT,
    "id" SERIAL NOT NULL,

    CONSTRAINT "person_source_assertedby_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "latvia"."person_statement" (
    "_link" TEXT,
    "statementid" TEXT NOT NULL,
    "statementtype" TEXT,
    "statementdate" TIMESTAMP(6),
    "iscomponent" BOOLEAN,
    "persontype" TEXT,
    "birthdate" TEXT,
    "publicationdetails_publicationdate" TIMESTAMP(6),
    "publicationdetails_bodsversion" TEXT,
    "publicationdetails_license" TEXT,
    "publicationdetails_publisher_name" TEXT,
    "publicationdetails_publisher_url" TEXT,
    "source_type" TEXT,
    "unspecifiedpersondetails_reason" TEXT,

    CONSTRAINT "person_statement_pkey" PRIMARY KEY ("statementid")
);

-- CreateTable
CREATE TABLE "register"."entity_addresses" (
    "_link" TEXT,
    "_link_entity_statement" TEXT,
    "address" TEXT,
    "country" TEXT,
    "type" TEXT
);

-- CreateTable
CREATE TABLE "register"."entity_identifiers" (
    "_link" TEXT,
    "_link_entity_statement" TEXT,
    "id" TEXT,
    "scheme" TEXT,
    "schemename" TEXT,
    "uri" TEXT
);

-- CreateTable
CREATE TABLE "register"."entity_statement" (
    "_link" TEXT,
    "statementtype" TEXT,
    "entitytype" TEXT,
    "foundingdate" TIMESTAMP(6),
    "statementid" TEXT,
    "statementdate" TIMESTAMP(6),
    "iscomponent" BOOLEAN,
    "name" TEXT,
    "incorporatedinjurisdiction_code" TEXT,
    "incorporatedinjurisdiction_name" TEXT,
    "publicationdetails_bodsversion" DECIMAL,
    "publicationdetails_license" TEXT,
    "publicationdetails_publicationdate" TIMESTAMP(6),
    "publicationdetails_publisher_name" TEXT,
    "publicationdetails_publisher_url" TEXT,
    "dissolutiondate" TIMESTAMP(6),
    "replacesstatements" TEXT,
    "alternatenames" TEXT,
    "source_assertedby" BOOLEAN,
    "source_description" TEXT,
    "source_retrievedat" TIMESTAMP(6),
    "source_type" TEXT,
    "source_url" TEXT
);

-- CreateTable
CREATE TABLE "register"."ooc_interests" (
    "_link" TEXT,
    "_link_ooc_statement" TEXT,
    "type" TEXT,
    "startdate" TIMESTAMP(6),
    "share_exact" TEXT,
    "share_maximum" TEXT,
    "share_minimum" TEXT,
    "enddate" TIMESTAMP(6),
    "details" TEXT,
    "share_exclusivemaximum" BOOLEAN,
    "share_exclusiveminimum" BOOLEAN
);

-- CreateTable
CREATE TABLE "register"."ooc_statement" (
    "_link" TEXT,
    "statementtype" TEXT,
    "statementdate" TIMESTAMP(6),
    "iscomponent" BOOLEAN,
    "statementid" TEXT,
    "interestedparty_describedbypersonstatement" TEXT,
    "publicationdetails_bodsversion" DECIMAL,
    "publicationdetails_license" TEXT,
    "publicationdetails_publicationdate" TIMESTAMP(6),
    "publicationdetails_publisher_name" TEXT,
    "publicationdetails_publisher_url" TEXT,
    "source_assertedby" BOOLEAN,
    "source_description" TEXT,
    "source_retrievedat" TIMESTAMP(6),
    "source_type" TEXT,
    "source_url" TEXT,
    "subject_describedbyentitystatement" TEXT,
    "interestedparty_describedbyentitystatement" TEXT
);

-- CreateTable
CREATE TABLE "register"."person_addresses" (
    "_link" TEXT,
    "_link_person_statement" TEXT,
    "address" TEXT,
    "country" TEXT,
    "type" TEXT
);

-- CreateTable
CREATE TABLE "register"."person_identifiers" (
    "_link" TEXT,
    "_link_person_statement" TEXT,
    "id" TEXT,
    "schemename" TEXT,
    "uri" TEXT
);

-- CreateTable
CREATE TABLE "register"."person_names" (
    "_link" TEXT,
    "_link_person_statement" TEXT,
    "fullname" TEXT,
    "type" TEXT,
    "familyname" TEXT,
    "givenname" TEXT
);

-- CreateTable
CREATE TABLE "register"."person_nationalities" (
    "_link" TEXT,
    "_link_person_statement" TEXT,
    "code" TEXT,
    "name" TEXT
);

-- CreateTable
CREATE TABLE "register"."person_statement" (
    "_link" TEXT,
    "statementtype" TEXT,
    "iscomponent" BOOLEAN,
    "statementid" TEXT,
    "persontype" TEXT,
    "statementdate" TIMESTAMP(6),
    "publicationdetails_bodsversion" DECIMAL,
    "publicationdetails_license" TEXT,
    "publicationdetails_publicationdate" TIMESTAMP(6),
    "publicationdetails_publisher_name" TEXT,
    "publicationdetails_publisher_url" TEXT,
    "source_assertedby" BOOLEAN,
    "source_description" TEXT,
    "source_retrievedat" TIMESTAMP(6),
    "source_type" TEXT,
    "source_url" TEXT,
    "replacesstatements" TEXT,
    "birthdate" TIMESTAMP(6)
);

-- CreateTable
CREATE TABLE "slovakia"."entity_addresses" (
    "_link" TEXT,
    "_link_entity_statement" TEXT,
    "address" TEXT,
    "country" TEXT,
    "type" TEXT
);

-- CreateTable
CREATE TABLE "slovakia"."entity_identifiers" (
    "_link" TEXT,
    "_link_entity_statement" TEXT,
    "id" TEXT,
    "scheme" TEXT,
    "schemename" TEXT,
    "uri" TEXT
);

-- CreateTable
CREATE TABLE "slovakia"."entity_statement" (
    "_link" TEXT,
    "statementtype" TEXT,
    "entitytype" TEXT,
    "foundingdate" TIMESTAMP(6),
    "statementid" TEXT,
    "statementdate" TIMESTAMP(6),
    "iscomponent" BOOLEAN,
    "name" TEXT,
    "incorporatedinjurisdiction_code" TEXT,
    "incorporatedinjurisdiction_name" TEXT,
    "publicationdetails_bodsversion" DECIMAL,
    "publicationdetails_license" TEXT,
    "publicationdetails_publicationdate" TIMESTAMP(6),
    "publicationdetails_publisher_name" TEXT,
    "publicationdetails_publisher_url" TEXT,
    "dissolutiondate" TIMESTAMP(6),
    "replacesstatements" TEXT,
    "alternatenames" TEXT
);

-- CreateTable
CREATE TABLE "slovakia"."ooc_statement" (
    "_link" TEXT,
    "statementtype" TEXT,
    "statementdate" TIMESTAMP(6),
    "iscomponent" BOOLEAN,
    "statementid" TEXT,
    "interestedparty_describedbypersonstatement" TEXT,
    "publicationdetails_bodsversion" DECIMAL,
    "publicationdetails_license" TEXT,
    "publicationdetails_publicationdate" TIMESTAMP(6),
    "publicationdetails_publisher_name" TEXT,
    "publicationdetails_publisher_url" TEXT,
    "source_assertedby" BOOLEAN,
    "source_description" TEXT,
    "source_retrievedat" TIMESTAMP(6),
    "source_type" TEXT,
    "source_url" TEXT,
    "subject_describedbyentitystatement" TEXT
);

-- CreateTable
CREATE TABLE "slovakia"."person_addresses" (
    "_link" TEXT,
    "_link_person_statement" TEXT,
    "address" TEXT,
    "country" TEXT,
    "type" TEXT
);

-- CreateTable
CREATE TABLE "slovakia"."person_identifiers" (
    "_link" TEXT,
    "_link_person_statement" TEXT,
    "id" TEXT,
    "schemename" TEXT,
    "uri" TEXT
);

-- CreateTable
CREATE TABLE "slovakia"."person_names" (
    "_link" TEXT,
    "_link_person_statement" TEXT,
    "fullname" TEXT,
    "type" TEXT
);

-- CreateTable
CREATE TABLE "slovakia"."person_nationalities" (
    "_link" TEXT,
    "_link_person_statement" TEXT,
    "code" TEXT,
    "name" TEXT
);

-- CreateTable
CREATE TABLE "slovakia"."person_statement" (
    "_link" TEXT,
    "statementtype" TEXT,
    "birthdate" TIMESTAMP(6),
    "statementid" TEXT,
    "iscomponent" BOOLEAN,
    "statementdate" TIMESTAMP(6),
    "persontype" TEXT,
    "publicationdetails_bodsversion" DECIMAL,
    "publicationdetails_license" TEXT,
    "publicationdetails_publicationdate" TIMESTAMP(6),
    "publicationdetails_publisher_name" TEXT,
    "publicationdetails_publisher_url" TEXT,
    "source_assertedby" BOOLEAN,
    "source_description" TEXT,
    "source_retrievedat" TIMESTAMP(6),
    "source_type" TEXT,
    "source_url" TEXT
);

-- CreateTable
CREATE TABLE "uk_version_0_4"."entity_annotations" (
    "_link" TEXT,
    "_link_entity_statement" TEXT,
    "motivation" TEXT,
    "description" TEXT,
    "statementpointertarget" BOOLEAN,
    "creationdate" TIMESTAMP(6),
    "url" TEXT,
    "createdby_name" TEXT,
    "createdby_uri" TEXT
);

-- CreateTable
CREATE TABLE "uk_version_0_4"."entity_recorddetails_addresses" (
    "_link" TEXT,
    "_link_entity_statement" TEXT,
    "type" TEXT,
    "address" TEXT,
    "postcode" TEXT,
    "country_name" TEXT,
    "country_code" TEXT
);

-- CreateTable
CREATE TABLE "uk_version_0_4"."entity_recorddetails_identifiers" (
    "_link" TEXT,
    "_link_entity_statement" TEXT,
    "id" TEXT,
    "scheme" TEXT,
    "schemename" TEXT,
    "uri" TEXT
);

-- CreateTable
CREATE TABLE "uk_version_0_4"."entity_source_assertedby" (
    "_link" TEXT,
    "_link_entity_statement" TEXT,
    "name" TEXT,
    "uri" TEXT
);

-- CreateTable
CREATE TABLE "uk_version_0_4"."entity_statement" (
    "_link" TEXT,
    "statementid" TEXT,
    "declarationsubject" TEXT,
    "statementdate" TIMESTAMP(6),
    "recordid" TEXT,
    "recordstatus" TEXT,
    "recordtype" TEXT,
    "recorddetails_iscomponent" BOOLEAN,
    "recorddetails_foundingdate" TIMESTAMP(6),
    "recorddetails_name" TEXT,
    "recorddetails_entitytype_type" TEXT,
    "recorddetails_jurisdiction_name" TEXT,
    "recorddetails_jurisdiction_code" TEXT,
    "recorddetails_publiclisting_haspubliclisting" BOOLEAN,
    "publicationdetails_publicationdate" TIMESTAMP(6),
    "publicationdetails_bodsversion" DECIMAL,
    "publicationdetails_license" TEXT,
    "publicationdetails_publisher_name" TEXT,
    "publicationdetails_publisher_url" TEXT,
    "source_type" TEXT,
    "source_url" TEXT,
    "recorddetails_uri" TEXT,
    "recorddetails_entitytype_details" TEXT,
    "recorddetails_alternatenames" TEXT
);

-- CreateTable
CREATE TABLE "uk_version_0_4"."person_annotations" (
    "_link" TEXT,
    "_link_person_statement" TEXT,
    "motivation" TEXT,
    "description" TEXT,
    "statementpointertarget" BOOLEAN,
    "creationdate" TIMESTAMP(6),
    "createdby_name" TEXT,
    "createdby_uri" TEXT
);

-- CreateTable
CREATE TABLE "uk_version_0_4"."person_recorddetails_addresses" (
    "_link" TEXT,
    "_link_person_statement" TEXT,
    "type" TEXT,
    "address" TEXT,
    "postcode" TEXT,
    "country_name" TEXT,
    "country_code" TEXT
);

-- CreateTable
CREATE TABLE "uk_version_0_4"."person_recorddetails_names" (
    "_link" TEXT,
    "_link_person_statement" TEXT,
    "type" TEXT,
    "fullname" TEXT,
    "familyname" TEXT,
    "givenname" TEXT
);

-- CreateTable
CREATE TABLE "uk_version_0_4"."person_recorddetails_nationalities" (
    "_link" TEXT,
    "_link_person_statement" TEXT,
    "name" TEXT,
    "code" TEXT
);

-- CreateTable
CREATE TABLE "uk_version_0_4"."person_recorddetails_taxresidencies" (
    "_link" TEXT,
    "_link_person_statement" TEXT,
    "name" TEXT,
    "code" TEXT
);

-- CreateTable
CREATE TABLE "uk_version_0_4"."person_source_assertedby" (
    "_link" TEXT,
    "_link_person_statement" TEXT,
    "name" TEXT,
    "uri" TEXT
);

-- CreateTable
CREATE TABLE "uk_version_0_4"."person_statement" (
    "_link" TEXT,
    "statementid" TEXT,
    "declarationsubject" TEXT,
    "statementdate" TIMESTAMP(6),
    "recordid" TEXT,
    "recordstatus" TEXT,
    "recordtype" TEXT,
    "recorddetails_iscomponent" BOOLEAN,
    "recorddetails_persontype" TEXT,
    "recorddetails_birthdate" TEXT,
    "publicationdetails_publicationdate" TIMESTAMP(6),
    "publicationdetails_bodsversion" DECIMAL,
    "publicationdetails_license" TEXT,
    "publicationdetails_publisher_name" TEXT,
    "publicationdetails_publisher_url" TEXT,
    "source_type" TEXT,
    "source_url" TEXT
);

-- CreateTable
CREATE TABLE "uk_version_0_4"."relationship_annotations" (
    "_link" TEXT,
    "_link_relationship_statement" TEXT,
    "motivation" TEXT,
    "description" TEXT,
    "statementpointertarget" BOOLEAN,
    "creationdate" TIMESTAMP(6),
    "createdby_name" TEXT,
    "createdby_uri" TEXT
);

-- CreateTable
CREATE TABLE "uk_version_0_4"."relationship_recorddetails_interests" (
    "_link" TEXT,
    "_link_relationship_statement" TEXT,
    "directorindirect" TEXT,
    "type" TEXT,
    "beneficialownershiporcontrol" BOOLEAN,
    "startdate" TIMESTAMP(6),
    "details" TEXT,
    "share_maximum" DECIMAL,
    "share_minimum" DECIMAL,
    "enddate" TIMESTAMP(6)
);

-- CreateTable
CREATE TABLE "uk_version_0_4"."relationship_source_assertedby" (
    "_link" TEXT,
    "_link_relationship_statement" TEXT,
    "name" TEXT,
    "uri" TEXT
);

-- CreateTable
CREATE TABLE "uk_version_0_4"."relationship_statement" (
    "_link" TEXT,
    "statementid" TEXT,
    "declarationsubject" TEXT,
    "statementdate" TIMESTAMP(6),
    "recordid" TEXT,
    "recordstatus" TEXT,
    "recordtype" TEXT,
    "recorddetails_subject" TEXT,
    "recorddetails_interestedparty" TEXT,
    "recorddetails_iscomponent" BOOLEAN,
    "publicationdetails_publicationdate" TIMESTAMP(6),
    "publicationdetails_bodsversion" DECIMAL,
    "publicationdetails_license" TEXT,
    "publicationdetails_publisher_name" TEXT,
    "publicationdetails_publisher_url" TEXT,
    "source_type" TEXT,
    "source_url" TEXT,
    "recorddetails_interestedparty_reason" TEXT,
    "recorddetails_interestedparty_description" TEXT
);

-- AddForeignKey
ALTER TABLE "latvia"."entity_addresses" ADD CONSTRAINT "entity_addresses_statementid_fkey" FOREIGN KEY ("statementid") REFERENCES "latvia"."entity_statement"("statementid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "latvia"."entity_identifiers" ADD CONSTRAINT "entity_identifiers_statementid_fkey" FOREIGN KEY ("statementid") REFERENCES "latvia"."entity_statement"("statementid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "latvia"."entity_source_assertedby" ADD CONSTRAINT "entity_source_assertedby_statementid_fkey" FOREIGN KEY ("statementid") REFERENCES "latvia"."entity_statement"("statementid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "latvia"."ooc_interests" ADD CONSTRAINT "ooc_interests_statementid_fkey" FOREIGN KEY ("statementid") REFERENCES "latvia"."ooc_statement"("statementid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "latvia"."ooc_source_assertedby" ADD CONSTRAINT "ooc_source_assertedby_statementid_fkey" FOREIGN KEY ("statementid") REFERENCES "latvia"."ooc_statement"("statementid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "latvia"."person_addresses" ADD CONSTRAINT "person_addresses_statementid_fkey" FOREIGN KEY ("statementid") REFERENCES "latvia"."person_statement"("statementid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "latvia"."person_identifiers" ADD CONSTRAINT "person_identifiers_statementid_fkey" FOREIGN KEY ("statementid") REFERENCES "latvia"."person_statement"("statementid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "latvia"."person_names" ADD CONSTRAINT "person_names_statementid_fkey" FOREIGN KEY ("statementid") REFERENCES "latvia"."person_statement"("statementid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "latvia"."person_nationalities" ADD CONSTRAINT "person_nationalities_statementid_fkey" FOREIGN KEY ("statementid") REFERENCES "latvia"."person_statement"("statementid") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "latvia"."person_source_assertedby" ADD CONSTRAINT "person_source_assertedby_statementid_fkey" FOREIGN KEY ("statementid") REFERENCES "latvia"."person_statement"("statementid") ON DELETE NO ACTION ON UPDATE NO ACTION;

