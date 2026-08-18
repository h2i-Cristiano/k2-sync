-- =============================================================================
-- K2-Sync — SNAPSHOT DO SCHEMA (ARQUIVO GERADO)
-- =============================================================================
--
-- NAO EDITAR A MAO. Este arquivo e um retrato do banco, nao a fonte da verdade.
--
--   Fonte da verdade : supabase/migrations/
--   Gerado em        : 2026-08-16
--   Comando          : supabase db dump --schema public > database-schema.sql
--
-- Regerar sempre que aplicar migrations, para o arquivo nao voltar a divergir.
--
-- -----------------------------------------------------------------------------
-- POR QUE ESTE ARQUIVO FOI SUBSTITUIDO
-- -----------------------------------------------------------------------------
--
-- A versao anterior era um script de bootstrap escrito a mao em 2026-07-26 e
-- nunca atualizado. Em 2026-08-16 ela divergia assim do banco:
--
--   tabelas          8 de 15   (services, products, stock_movements,
--                               financial_entries, financial_categories,
--                               service_materials, appointment_materials
--                               nao existiam no arquivo)
--   policies         12 de 43
--   modelo de RLS    auth.jwt() ->> 'tenant_id'  — abandonado em
--                    20260727020000 e substituido por public.user_tenant_id()
--   funcoes          2 de 11
--   profiles.tenant_id   declarado NOT NULL, mas a coluna sempre foi nullable
--
-- Esse ultimo item causou um incidente: a divergencia foi lida como schema
-- drift a corrigir, o NOT NULL foi aplicado no banco e derrubou o trigger
-- handle_new_user, quebrando todo o cadastro de usuarios. O tenant_id NULL e
-- estado transitorio do signup, por design — ver a migration 20260816030000.
--
-- Um arquivo gerado nao pode mentir sobre o banco. Por isso a troca.
--
-- =============================================================================




SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."confirm_all_unconfirmed_users"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW(),
      confirmed_at = NOW()
  WHERE email_confirmed_at IS NULL;
  
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;


ALTER FUNCTION "public"."confirm_all_unconfirmed_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."confirm_user_email"("p_email" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW(),
      confirmed_at = NOW()
  WHERE email = p_email
    AND email_confirmed_at IS NULL;
END;
$$;


ALTER FUNCTION "public"."confirm_user_email"("p_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."consume_appointment_materials"("p_appointment_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_tenant UUID;
  r RECORD;
BEGIN
  SELECT tenant_id INTO v_tenant FROM appointments WHERE id = p_appointment_id;
  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'Atendimento não encontrado';
  END IF;

  FOR r IN
    SELECT am.product_id, am.quantity, am.tenant_id
    FROM appointment_materials am
    WHERE am.appointment_id = p_appointment_id AND am.tenant_id = v_tenant
  LOOP
    UPDATE products
    SET stock_quantity = stock_quantity - r.quantity
    WHERE id = r.product_id AND tenant_id = v_tenant
      AND stock_quantity >= r.quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Estoque insuficiente para o material (produto %). Ajuste o estoque ou os materiais da sessão.', r.product_id;
    END IF;

    INSERT INTO stock_movements (tenant_id, product_id, quantity, movement_type, reason, appointment_id, created_by)
    VALUES (v_tenant, r.product_id, -r.quantity, 'session', 'Consumo em atendimento', p_appointment_id, auth.uid());
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."consume_appointment_materials"("p_appointment_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "plan" "text" DEFAULT 'free'::"text" NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "tenants_plan_check" CHECK (("plan" = ANY (ARRAY['free'::"text", 'basico'::"text", 'essencial'::"text", 'pro'::"text"])))
);

ALTER TABLE ONLY "public"."tenants" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenants" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_tenant_for_user"("p_name" "text", "p_slug" "text", "p_full_name" "text") RETURNS SETOF "public"."tenants"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_tenant tenants%ROWTYPE;
  current_tenant UUID;
BEGIN
  -- Check if user already has a tenant assigned
  SELECT tenant_id INTO current_tenant FROM profiles WHERE id = auth.uid();
  IF current_tenant IS NOT NULL THEN
    RAISE EXCEPTION 'O usuário já possui uma clínica/consultório vinculada.';
  END IF;

  INSERT INTO tenants (name, slug)
  VALUES (p_name, p_slug)
  RETURNING * INTO new_tenant;

  INSERT INTO profiles (id, full_name, role, tenant_id)
  VALUES (auth.uid(), p_full_name, 'admin', new_tenant.id)
  ON CONFLICT (id) DO UPDATE
  SET full_name = p_full_name, role = 'admin', tenant_id = new_tenant.id;

  RETURN NEXT new_tenant;
END;
$$;


ALTER FUNCTION "public"."create_tenant_for_user"("p_name" "text", "p_slug" "text", "p_full_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'professional')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."restore_appointment_materials"("p_appointment_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_tenant UUID;
  r RECORD;
BEGIN
  SELECT tenant_id INTO v_tenant FROM appointments WHERE id = p_appointment_id;
  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'Atendimento não encontrado';
  END IF;

  FOR r IN
    SELECT am.product_id, am.quantity, am.tenant_id
    FROM appointment_materials am
    WHERE am.appointment_id = p_appointment_id AND am.tenant_id = v_tenant
  LOOP
    UPDATE products
    SET stock_quantity = stock_quantity + r.quantity
    WHERE id = r.product_id AND tenant_id = v_tenant;

    INSERT INTO stock_movements (tenant_id, product_id, quantity, movement_type, reason, appointment_id, created_by)
    VALUES (v_tenant, r.product_id, r.quantity, 'session', 'Restauração (atendimento revertido)', p_appointment_id, auth.uid());
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."restore_appointment_materials"("p_appointment_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_products_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_products_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_services_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_services_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;


ALTER FUNCTION "public"."user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_tenant_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;


ALTER FUNCTION "public"."user_tenant_id"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."anamnesis" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "professional_id" "uuid" NOT NULL,
    "form_type" "text" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "signature_hash" "text",
    "signature_ip" "text",
    "signature_timestamp" timestamp with time zone,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "anamnesis_form_type_check" CHECK (("form_type" = ANY (ARRAY['massage'::"text", 'facial'::"text", 'body'::"text", 'general'::"text", 'dental'::"text", 'salon'::"text"]))),
    CONSTRAINT "anamnesis_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'completed'::"text", 'signed'::"text"])))
);

ALTER TABLE ONLY "public"."anamnesis" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."anamnesis" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appointment_materials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "appointment_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "quantity" numeric DEFAULT 1 NOT NULL,
    "unit_price" numeric(10,2) DEFAULT 0 NOT NULL,
    "unit_cost" numeric(10,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."appointment_materials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appointments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "professional_id" "uuid" NOT NULL,
    "service_type" "text" NOT NULL,
    "scheduled_at" timestamp with time zone NOT NULL,
    "duration_minutes" integer DEFAULT 60 NOT NULL,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "notes" "text",
    "is_home_visit" boolean DEFAULT false,
    "home_visit_address" "jsonb",
    "travel_cost" numeric(10,2),
    "total_cost" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "commission_percent" numeric(5,2) DEFAULT 0,
    "commission_amount" numeric(10,2) DEFAULT 0,
    CONSTRAINT "appointments_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'confirmed'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text", 'no_show'::"text"])))
);

ALTER TABLE ONLY "public"."appointments" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."appointments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "uuid",
    "old_data" "jsonb",
    "new_data" "jsonb",
    "ip_address" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE ONLY "public"."audit_logs" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "financial_categories_type_check" CHECK (("type" = ANY (ARRAY['payable'::"text", 'receivable'::"text"])))
);


ALTER TABLE "public"."financial_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_entries" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "due_date" "date" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "category" "text",
    "notes" "text",
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "appointment_id" "uuid",
    "patient_id" "uuid",
    CONSTRAINT "financial_entries_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'overdue'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "financial_entries_type_check" CHECK (("type" = ANY (ARRAY['payable'::"text", 'receivable'::"text"])))
);


ALTER TABLE "public"."financial_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."medical_records" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "professional_id" "uuid" NOT NULL,
    "appointment_id" "uuid",
    "session_number" integer,
    "chief_complaint" "text",
    "assessment" "text",
    "treatment_plan" "text",
    "notes" "text",
    "ai_suggestions" "jsonb",
    "ai_disclaimer_shown" boolean DEFAULT false,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "medical_records_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'completed'::"text", 'approved'::"text"])))
);

ALTER TABLE ONLY "public"."medical_records" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."medical_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patients" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "cpf" "text",
    "rg" "text",
    "birth_date" "date",
    "gender" "text",
    "marital_status" "text",
    "occupation" "text",
    "address" "jsonb" DEFAULT '{}'::"jsonb",
    "emergency_contact" "jsonb" DEFAULT '{}'::"jsonb",
    "allergies" "text"[],
    "medications" "text"[],
    "medical_conditions" "text"[],
    "notes" "text",
    "tags" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "patients_gender_check" CHECK (("gender" = ANY (ARRAY['M'::"text", 'F'::"text", 'O'::"text"])))
);

ALTER TABLE ONLY "public"."patients" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."patients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "appointment_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "deposit_percent" numeric(5,2),
    "deposit_amount" numeric(10,2),
    "payment_method" "text" NOT NULL,
    "payment_type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "transaction_id" "text",
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payments_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['pix'::"text", 'cash'::"text", 'card'::"text", 'transfer'::"text"]))),
    CONSTRAINT "payments_payment_type_check" CHECK (("payment_type" = ANY (ARRAY['deposit'::"text", 'full'::"text", 'remainder'::"text"]))),
    CONSTRAINT "payments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'refunded'::"text", 'cancelled'::"text"])))
);

ALTER TABLE ONLY "public"."payments" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "unit" "text" DEFAULT 'un'::"text" NOT NULL,
    "cost" numeric(10,2) DEFAULT 0 NOT NULL,
    "price" numeric(10,2) DEFAULT 0 NOT NULL,
    "stock_quantity" numeric DEFAULT 0 NOT NULL,
    "min_stock" numeric DEFAULT 0 NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "avatar_url" "text",
    "phone" "text",
    "role" "text" DEFAULT 'professional'::"text" NOT NULL,
    "tenant_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'professional'::"text", 'receptionist'::"text"])))
);

ALTER TABLE ONLY "public"."profiles" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_materials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "service_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "quantity" numeric DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."service_materials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "color" "text" DEFAULT '#6B7280'::"text" NOT NULL,
    "duration_minutes" integer DEFAULT 60 NOT NULL,
    "price" numeric(10,2) DEFAULT 0 NOT NULL,
    "commission_percent" numeric(5,2) DEFAULT 0,
    "active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stock_movements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "quantity" numeric NOT NULL,
    "movement_type" "text" NOT NULL,
    "reason" "text",
    "appointment_id" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "stock_movements_movement_type_check" CHECK (("movement_type" = ANY (ARRAY['stock_in'::"text", 'adjust'::"text", 'session'::"text"])))
);


ALTER TABLE "public"."stock_movements" OWNER TO "postgres";


ALTER TABLE ONLY "public"."anamnesis"
    ADD CONSTRAINT "anamnesis_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appointment_materials"
    ADD CONSTRAINT "appointment_materials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appointment_materials"
    ADD CONSTRAINT "appointment_materials_tenant_id_appointment_id_product_id_key" UNIQUE ("tenant_id", "appointment_id", "product_id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_categories"
    ADD CONSTRAINT "financial_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_categories"
    ADD CONSTRAINT "financial_categories_tenant_id_type_name_key" UNIQUE ("tenant_id", "type", "name");



ALTER TABLE ONLY "public"."financial_entries"
    ADD CONSTRAINT "financial_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."medical_records"
    ADD CONSTRAINT "medical_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_materials"
    ADD CONSTRAINT "service_materials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_materials"
    ADD CONSTRAINT "service_materials_tenant_id_service_id_product_id_key" UNIQUE ("tenant_id", "service_id", "product_id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_slug_key" UNIQUE ("slug");



CREATE INDEX "idx_anamnesis_patient" ON "public"."anamnesis" USING "btree" ("patient_id");



CREATE INDEX "idx_anamnesis_tenant" ON "public"."anamnesis" USING "btree" ("tenant_id");



CREATE INDEX "idx_appointment_materials_appointment" ON "public"."appointment_materials" USING "btree" ("tenant_id", "appointment_id");



CREATE INDEX "idx_appointment_materials_tenant" ON "public"."appointment_materials" USING "btree" ("tenant_id");



CREATE INDEX "idx_appointments_patient" ON "public"."appointments" USING "btree" ("patient_id");



CREATE INDEX "idx_appointments_professional" ON "public"."appointments" USING "btree" ("professional_id", "scheduled_at");



CREATE INDEX "idx_appointments_tenant" ON "public"."appointments" USING "btree" ("tenant_id");



CREATE INDEX "idx_audit_logs_tenant" ON "public"."audit_logs" USING "btree" ("tenant_id");



CREATE INDEX "idx_financial_entries_due_date" ON "public"."financial_entries" USING "btree" ("due_date");



CREATE INDEX "idx_financial_entries_patient" ON "public"."financial_entries" USING "btree" ("patient_id");



CREATE INDEX "idx_financial_entries_tenant_status" ON "public"."financial_entries" USING "btree" ("tenant_id", "status");



CREATE INDEX "idx_financial_entries_tenant_type" ON "public"."financial_entries" USING "btree" ("tenant_id", "type");



CREATE INDEX "idx_medical_records_patient" ON "public"."medical_records" USING "btree" ("patient_id");



CREATE INDEX "idx_medical_records_tenant" ON "public"."medical_records" USING "btree" ("tenant_id");



CREATE INDEX "idx_patients_name" ON "public"."patients" USING "btree" ("tenant_id", "full_name");



CREATE INDEX "idx_patients_tenant" ON "public"."patients" USING "btree" ("tenant_id");



CREATE INDEX "idx_payments_tenant" ON "public"."payments" USING "btree" ("tenant_id");



CREATE INDEX "idx_products_active" ON "public"."products" USING "btree" ("tenant_id", "active");



CREATE INDEX "idx_products_tenant" ON "public"."products" USING "btree" ("tenant_id");



CREATE INDEX "idx_profiles_tenant" ON "public"."profiles" USING "btree" ("tenant_id");



CREATE INDEX "idx_service_materials_service" ON "public"."service_materials" USING "btree" ("tenant_id", "service_id");



CREATE INDEX "idx_service_materials_tenant" ON "public"."service_materials" USING "btree" ("tenant_id");



CREATE INDEX "idx_services_active" ON "public"."services" USING "btree" ("tenant_id", "active");



CREATE INDEX "idx_services_tenant" ON "public"."services" USING "btree" ("tenant_id");



CREATE INDEX "idx_stock_movements_appointment" ON "public"."stock_movements" USING "btree" ("appointment_id");



CREATE INDEX "idx_stock_movements_product" ON "public"."stock_movements" USING "btree" ("tenant_id", "product_id");



CREATE INDEX "idx_stock_movements_tenant" ON "public"."stock_movements" USING "btree" ("tenant_id");



CREATE OR REPLACE TRIGGER "trigger_products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."update_products_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_services_updated_at" BEFORE UPDATE ON "public"."services" FOR EACH ROW EXECUTE FUNCTION "public"."update_services_updated_at"();



CREATE OR REPLACE TRIGGER "update_anamnesis_updated_at" BEFORE UPDATE ON "public"."anamnesis" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_appointments_updated_at" BEFORE UPDATE ON "public"."appointments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_medical_records_updated_at" BEFORE UPDATE ON "public"."medical_records" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_patients_updated_at" BEFORE UPDATE ON "public"."patients" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_payments_updated_at" BEFORE UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_tenants_updated_at" BEFORE UPDATE ON "public"."tenants" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."anamnesis"
    ADD CONSTRAINT "anamnesis_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."anamnesis"
    ADD CONSTRAINT "anamnesis_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."anamnesis"
    ADD CONSTRAINT "anamnesis_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointment_materials"
    ADD CONSTRAINT "appointment_materials_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointment_materials"
    ADD CONSTRAINT "appointment_materials_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointment_materials"
    ADD CONSTRAINT "appointment_materials_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."financial_categories"
    ADD CONSTRAINT "financial_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."financial_entries"
    ADD CONSTRAINT "financial_entries_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."financial_entries"
    ADD CONSTRAINT "financial_entries_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."financial_entries"
    ADD CONSTRAINT "financial_entries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."medical_records"
    ADD CONSTRAINT "medical_records_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."medical_records"
    ADD CONSTRAINT "medical_records_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."medical_records"
    ADD CONSTRAINT "medical_records_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."medical_records"
    ADD CONSTRAINT "medical_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_materials"
    ADD CONSTRAINT "service_materials_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_materials"
    ADD CONSTRAINT "service_materials_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_materials"
    ADD CONSTRAINT "service_materials_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE "public"."anamnesis" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "anamnesis_tenant_isolation" ON "public"."anamnesis" USING ((("tenant_id" = "public"."user_tenant_id"()) AND ("public"."user_role"() IS DISTINCT FROM 'receptionist'::"text"))) WITH CHECK ((("tenant_id" = "public"."user_tenant_id"()) AND ("public"."user_role"() IS DISTINCT FROM 'receptionist'::"text")));



ALTER TABLE "public"."appointment_materials" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "appointment_materials_delete_own_tenant" ON "public"."appointment_materials" FOR DELETE USING (("tenant_id" = "public"."user_tenant_id"()));



CREATE POLICY "appointment_materials_insert_own_tenant" ON "public"."appointment_materials" FOR INSERT WITH CHECK (("tenant_id" = "public"."user_tenant_id"()));



CREATE POLICY "appointment_materials_select_own_tenant" ON "public"."appointment_materials" FOR SELECT USING (("tenant_id" = "public"."user_tenant_id"()));



CREATE POLICY "appointment_materials_update_own_tenant" ON "public"."appointment_materials" FOR UPDATE USING (("tenant_id" = "public"."user_tenant_id"())) WITH CHECK (("tenant_id" = "public"."user_tenant_id"()));



ALTER TABLE "public"."appointments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "appointments_tenant_isolation" ON "public"."appointments" USING (("tenant_id" = "public"."user_tenant_id"()));



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_logs_tenant_isolation" ON "public"."audit_logs" USING (("tenant_id" = "public"."user_tenant_id"()));



CREATE POLICY "fc_delete" ON "public"."financial_categories" FOR DELETE USING (("tenant_id" = "public"."user_tenant_id"()));



CREATE POLICY "fc_insert" ON "public"."financial_categories" FOR INSERT WITH CHECK (("tenant_id" = "public"."user_tenant_id"()));



CREATE POLICY "fc_select" ON "public"."financial_categories" FOR SELECT USING (("tenant_id" = "public"."user_tenant_id"()));



ALTER TABLE "public"."financial_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."financial_entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "financial_entries_delete_own_tenant" ON "public"."financial_entries" FOR DELETE USING (("tenant_id" = "public"."user_tenant_id"()));



CREATE POLICY "financial_entries_insert_own_tenant" ON "public"."financial_entries" FOR INSERT WITH CHECK (("tenant_id" = "public"."user_tenant_id"()));



CREATE POLICY "financial_entries_select_own_tenant" ON "public"."financial_entries" FOR SELECT USING (("tenant_id" = "public"."user_tenant_id"()));



CREATE POLICY "financial_entries_update_own_tenant" ON "public"."financial_entries" FOR UPDATE USING (("tenant_id" = "public"."user_tenant_id"()));



ALTER TABLE "public"."medical_records" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "medical_records_delete_own_tenant" ON "public"."medical_records" FOR DELETE USING ((("tenant_id" = "public"."user_tenant_id"()) AND ("public"."user_role"() IS DISTINCT FROM 'receptionist'::"text")));



CREATE POLICY "medical_records_insert_own_tenant" ON "public"."medical_records" FOR INSERT WITH CHECK ((("tenant_id" = "public"."user_tenant_id"()) AND ("public"."user_role"() IS DISTINCT FROM 'receptionist'::"text")));



CREATE POLICY "medical_records_tenant_isolation" ON "public"."medical_records" USING ((("tenant_id" = "public"."user_tenant_id"()) AND ("public"."user_role"() IS DISTINCT FROM 'receptionist'::"text"))) WITH CHECK ((("tenant_id" = "public"."user_tenant_id"()) AND ("public"."user_role"() IS DISTINCT FROM 'receptionist'::"text")));



CREATE POLICY "medical_records_update_own_tenant" ON "public"."medical_records" FOR UPDATE USING ((("tenant_id" = "public"."user_tenant_id"()) AND ("public"."user_role"() IS DISTINCT FROM 'receptionist'::"text"))) WITH CHECK ((("tenant_id" = "public"."user_tenant_id"()) AND ("public"."user_role"() IS DISTINCT FROM 'receptionist'::"text")));



ALTER TABLE "public"."patients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "patients_tenant_isolation" ON "public"."patients" USING (("tenant_id" = "public"."user_tenant_id"()));



ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payments_delete_own_tenant" ON "public"."payments" FOR DELETE USING (("tenant_id" = "public"."user_tenant_id"()));



CREATE POLICY "payments_insert_own_tenant" ON "public"."payments" FOR INSERT WITH CHECK (("tenant_id" = "public"."user_tenant_id"()));



CREATE POLICY "payments_tenant_isolation" ON "public"."payments" FOR SELECT USING (("tenant_id" = "public"."user_tenant_id"()));



CREATE POLICY "payments_update_own_tenant" ON "public"."payments" FOR UPDATE USING (("tenant_id" = "public"."user_tenant_id"())) WITH CHECK (("tenant_id" = "public"."user_tenant_id"()));



ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "products_delete_own_tenant" ON "public"."products" FOR DELETE USING (("tenant_id" = "public"."user_tenant_id"()));



CREATE POLICY "products_insert_own_tenant" ON "public"."products" FOR INSERT WITH CHECK (("tenant_id" = "public"."user_tenant_id"()));



CREATE POLICY "products_select_own_tenant" ON "public"."products" FOR SELECT USING (("tenant_id" = "public"."user_tenant_id"()));



CREATE POLICY "products_update_own_tenant" ON "public"."products" FOR UPDATE USING (("tenant_id" = "public"."user_tenant_id"())) WITH CHECK (("tenant_id" = "public"."user_tenant_id"()));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_self_read" ON "public"."profiles" FOR SELECT USING (("id" = "auth"."uid"()));



CREATE POLICY "profiles_self_update" ON "public"."profiles" FOR UPDATE USING (("id" = "auth"."uid"()));



CREATE POLICY "profiles_tenant_isolation" ON "public"."profiles" USING (("tenant_id" = "public"."user_tenant_id"()));



ALTER TABLE "public"."service_materials" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_materials_delete_own_tenant" ON "public"."service_materials" FOR DELETE USING (("tenant_id" = "public"."user_tenant_id"()));



CREATE POLICY "service_materials_insert_own_tenant" ON "public"."service_materials" FOR INSERT WITH CHECK (("tenant_id" = "public"."user_tenant_id"()));



CREATE POLICY "service_materials_select_own_tenant" ON "public"."service_materials" FOR SELECT USING (("tenant_id" = "public"."user_tenant_id"()));



CREATE POLICY "service_materials_update_own_tenant" ON "public"."service_materials" FOR UPDATE USING (("tenant_id" = "public"."user_tenant_id"())) WITH CHECK (("tenant_id" = "public"."user_tenant_id"()));



ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "services_delete_own_tenant" ON "public"."services" FOR DELETE USING (("tenant_id" = "public"."user_tenant_id"()));



CREATE POLICY "services_insert_own_tenant" ON "public"."services" FOR INSERT WITH CHECK (("tenant_id" = "public"."user_tenant_id"()));



CREATE POLICY "services_tenant_isolation" ON "public"."services" FOR SELECT USING (("tenant_id" = "public"."user_tenant_id"()));



CREATE POLICY "services_update_own_tenant" ON "public"."services" FOR UPDATE USING (("tenant_id" = "public"."user_tenant_id"())) WITH CHECK (("tenant_id" = "public"."user_tenant_id"()));



ALTER TABLE "public"."stock_movements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "stock_movements_delete_own_tenant" ON "public"."stock_movements" FOR DELETE USING (("tenant_id" = "public"."user_tenant_id"()));



CREATE POLICY "stock_movements_insert_own_tenant" ON "public"."stock_movements" FOR INSERT WITH CHECK ((("tenant_id" = "public"."user_tenant_id"()) AND (EXISTS ( SELECT 1
   FROM "public"."products" "p"
  WHERE (("p"."id" = "stock_movements"."product_id") AND ("p"."tenant_id" = "p"."tenant_id"))))));



CREATE POLICY "stock_movements_select_own_tenant" ON "public"."stock_movements" FOR SELECT USING (("tenant_id" = "public"."user_tenant_id"()));



CREATE POLICY "stock_movements_update_own_tenant" ON "public"."stock_movements" FOR UPDATE USING (("tenant_id" = "public"."user_tenant_id"()));



CREATE POLICY "tenant_isolation" ON "public"."tenants" USING (("id" = (("auth"."jwt"() ->> 'tenant_id'::"text"))::"uuid"));



ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."confirm_all_unconfirmed_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."confirm_all_unconfirmed_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."confirm_all_unconfirmed_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."confirm_user_email"("p_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."confirm_user_email"("p_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."confirm_user_email"("p_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."consume_appointment_materials"("p_appointment_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."consume_appointment_materials"("p_appointment_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."consume_appointment_materials"("p_appointment_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."tenants" TO "anon";
GRANT ALL ON TABLE "public"."tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."tenants" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_tenant_for_user"("p_name" "text", "p_slug" "text", "p_full_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_tenant_for_user"("p_name" "text", "p_slug" "text", "p_full_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_tenant_for_user"("p_name" "text", "p_slug" "text", "p_full_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."restore_appointment_materials"("p_appointment_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."restore_appointment_materials"("p_appointment_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."restore_appointment_materials"("p_appointment_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_products_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_products_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_products_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_services_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_services_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_services_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_tenant_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."user_tenant_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_tenant_id"() TO "service_role";



GRANT ALL ON TABLE "public"."anamnesis" TO "anon";
GRANT ALL ON TABLE "public"."anamnesis" TO "authenticated";
GRANT ALL ON TABLE "public"."anamnesis" TO "service_role";



GRANT ALL ON TABLE "public"."appointment_materials" TO "anon";
GRANT ALL ON TABLE "public"."appointment_materials" TO "authenticated";
GRANT ALL ON TABLE "public"."appointment_materials" TO "service_role";



GRANT ALL ON TABLE "public"."appointments" TO "anon";
GRANT ALL ON TABLE "public"."appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."appointments" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."financial_categories" TO "anon";
GRANT ALL ON TABLE "public"."financial_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_categories" TO "service_role";



GRANT ALL ON TABLE "public"."financial_entries" TO "anon";
GRANT ALL ON TABLE "public"."financial_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_entries" TO "service_role";



GRANT ALL ON TABLE "public"."medical_records" TO "anon";
GRANT ALL ON TABLE "public"."medical_records" TO "authenticated";
GRANT ALL ON TABLE "public"."medical_records" TO "service_role";



GRANT ALL ON TABLE "public"."patients" TO "anon";
GRANT ALL ON TABLE "public"."patients" TO "authenticated";
GRANT ALL ON TABLE "public"."patients" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."service_materials" TO "anon";
GRANT ALL ON TABLE "public"."service_materials" TO "authenticated";
GRANT ALL ON TABLE "public"."service_materials" TO "service_role";



GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



GRANT ALL ON TABLE "public"."stock_movements" TO "anon";
GRANT ALL ON TABLE "public"."stock_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_movements" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







