# Banco de Dados — Schema e Migrations

## Visao Geral

O K2-Sync usa **Supabase PostgreSQL** com **RLS (Row Level Security)** para isolamento multi-tenant. Todas as tabelas possuem `tenant_id` e policies que filtram dados automaticamente por tenant.

## Schema

### 1. tenants

Tabela central do multi-tenant. Cada clinica/studio e um tenant.

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() |
| name | TEXT | NOT NULL |
| slug | TEXT | UNIQUE, NOT NULL |
| plan | TEXT | DEFAULT 'free', CHECK (free/basico/essencial/pro) |
| settings | JSONB | DEFAULT '{}' |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

### 2. profiles

Extende `auth.users`. Um profile por usuario.

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| id | UUID | PK, FK → auth.users(id) ON DELETE CASCADE |
| full_name | TEXT | NOT NULL |
| avatar_url | TEXT | NULLABLE |
| phone | TEXT | NULLABLE |
| role | TEXT | DEFAULT 'professional', CHECK (admin/professional/receptionist) |
| tenant_id | UUID | FK → tenants(id) ON DELETE CASCADE, **NULLABLE** |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

> [!note] tenant_id nullable
> `tenant_id` e nullable porque o trigger `handle_new_user` cria o profile SEM tenant_id.
> O RPC `create_tenant_for_user` preenche o tenant_id imediatamente apos.

### 3. patients

Pacientes da clinica.

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants, NOT NULL |
| full_name | TEXT | NOT NULL |
| email | TEXT | NULLABLE |
| phone | TEXT | NULLABLE |
| cpf | TEXT | NULLABLE |
| rg | TEXT | NULLABLE |
| birth_date | DATE | NULLABLE |
| gender | TEXT | CHECK (M/F/O) |
| marital_status | TEXT | NULLABLE |
| occupation | TEXT | NULLABLE |
| address | JSONB | DEFAULT '{}' |
| emergency_contact | JSONB | DEFAULT '{}' |
| allergies | TEXT[] | NULLABLE |
| medications | TEXT[] | NULLABLE |
| medical_conditions | TEXT[] | NULLABLE |
| notes | TEXT | NULLABLE |
| tags | TEXT[] | NULLABLE |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

### 4. appointments

Agendamentos.

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants, NOT NULL |
| patient_id | UUID | FK → patients, NOT NULL |
| professional_id | UUID | FK → profiles, NOT NULL |
| service_type | TEXT | NOT NULL |
| scheduled_at | TIMESTAMPTZ | NOT NULL |
| duration_minutes | INTEGER | DEFAULT 60 |
| status | TEXT | DEFAULT 'scheduled', CHECK (scheduled/confirmed/in_progress/completed/cancelled/no_show) |
| notes | TEXT | NULLABLE |
| is_home_visit | BOOLEAN | DEFAULT FALSE |
| home_visit_address | JSONB | NULLABLE |
| travel_cost | DECIMAL(10,2) | NULLABLE |
| total_cost | DECIMAL(10,2) | NULLABLE |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

### 5. anamnesis

Formularios de anamnese digital.

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants, NOT NULL |
| patient_id | UUID | FK → patients, NOT NULL |
| professional_id | UUID | FK → profiles, NOT NULL |
| form_type | TEXT | CHECK (massage/facial/body/general/dental/salon) |
| data | JSONB | DEFAULT '{}' |
| signature_hash | TEXT | NULLABLE |
| signature_ip | TEXT | NULLABLE |
| signature_timestamp | TIMESTAMPTZ | NULLABLE |
| status | TEXT | DEFAULT 'draft', CHECK (draft/completed/signed) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

#### Campos JSONB (data)

```json
{
  "chief_complaint": "string",
  "pain_location": "string",
  "pain_intensity": "string",
  "pain_frequency": "string",
  "pain_duration": "string",
  "previous_treatments": "string",
  "allergies": "string",
  "medications": "string",
  "medical_conditions": "string",
  "previous_surgeries": "string",
  "pregnant": "string",
  "pregnancy_weeks": "string",
  "smokes": "string",
  "drinks": "string",
  "exercise_frequency": "string",
  "sleep_quality": "string",
  "stress_level": "string",
  "diet": "string",
  "expectations": "string",
  "consent_name": "string",
  "consent_cpf": "string (000.000.000-00)",
  "consent_signature_image": "base64",
  "consent_signature_typed_name": "string",
  "consent_signature_timestamp": "ISO string",
  "consent_photo": "base64",
  "consent_photo_timestamp": "ISO string",
  "consent_lgpd_accepted": true,
  "consent_marketing_accepted": false
}
```

### 6. medical_records

Prontuarios eletronicos.

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants, NOT NULL |
| patient_id | UUID | FK → patients, NOT NULL |
| professional_id | UUID | FK → profiles, NOT NULL |
| appointment_id | UUID | FK → appointments, ON DELETE SET NULL |
| session_number | INTEGER | NULLABLE |
| chief_complaint | TEXT | NULLABLE |
| assessment | TEXT | NULLABLE |
| treatment_plan | TEXT | NULLABLE |
| notes | TEXT | NULLABLE |
| ai_suggestions | JSONB | NULLABLE |
| ai_disclaimer_shown | BOOLEAN | DEFAULT FALSE |
| status | TEXT | DEFAULT 'draft', CHECK (draft/completed/approved) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

### 7. payments

Pagamentos.

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants, NOT NULL |
| patient_id | UUID | FK → patients, NOT NULL |
| appointment_id | UUID | FK → appointments, ON DELETE SET NULL |
| amount | DECIMAL(10,2) | NOT NULL |
| deposit_percent | DECIMAL(5,2) | NULLABLE |
| deposit_amount | DECIMAL(10,2) | NULLABLE |
| payment_method | TEXT | CHECK (pix/cash/card/transfer) |
| payment_type | TEXT | CHECK (deposit/full/remainder) |
| status | TEXT | DEFAULT 'pending', CHECK (pending/paid/refunded/cancelled) |
| transaction_id | TEXT | NULLABLE |
| paid_at | TIMESTAMPTZ | NULLABLE |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

### 8. audit_logs

Log de auditoria.

| Coluna | Tipo | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants, NOT NULL |
| user_id | UUID | FK → auth.users, ON DELETE SET NULL |
| action | TEXT | NOT NULL |
| table_name | TEXT | NOT NULL |
| record_id | UUID | NULLABLE |
| old_data | JSONB | NULLABLE |
| new_data | JSONB | NULLABLE |
| ip_address | TEXT | NULLABLE |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

## Indexes

```sql
CREATE INDEX idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX idx_patients_tenant ON patients(tenant_id);
CREATE INDEX idx_patients_name ON patients(tenant_id, full_name);
CREATE INDEX idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX idx_appointments_professional ON appointments(professional_id, scheduled_at);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_anamnesis_tenant ON anamnesis(tenant_id);
CREATE INDEX idx_anamnesis_patient ON anamnesis(patient_id);
CREATE INDEX idx_medical_records_tenant ON medical_records(tenant_id);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
```

## RLS (Row Level Security)

Todas as 8 tabelas possuem:
- `ENABLE ROW LEVEL SECURITY`
- `FORCE ROW LEVEL SECURITY`

### Politicas

**Politica de isolamento por tenant (profile-based):**

```sql
CREATE POLICY policy_name ON table_name
  FOR ALL USING (tenant_id = public.user_tenant_id());
```

**Politicas extras para profiles:**

```sql
-- Auto-leitura (corrige chicken-and-egg com tenant_id)
CREATE POLICY profiles_self_read ON profiles
  FOR SELECT USING (id = auth.uid());

-- Auto-atualizacao
CREATE POLICY profiles_self_update ON profiles
  FOR UPDATE USING (id = auth.uid());
```

### user_tenant_id()

Funcao helper que busca o `tenant_id` do usuario logado:

```sql
CREATE OR REPLACE FUNCTION public.user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

> [!important] Profile-based vs JWT-based
> A funcao busca no `profiles`, NAO no JWT.
> Isso evita problemas com sessoes desatualizadas ou primeiro login apos signup.

## Triggers

### update_updated_at()

Trigger automatico para atualizar `updated_at`:

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Aplicado em: tenants, profiles, patients, appointments, anamnesis, medical_records, payments.

### handle_new_user()

Trigger que cria profile automaticamente no signup:

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

> [!note] Sem tenant_id
> O trigger cria profile SEM tenant_id (nullable).
> O RPC `create_tenant_for_user` preenche o tenant_id imediatamente apos.

## RPCs

### create_tenant_for_user

Cria tenant e profile de admin no signup:

```sql
CREATE OR REPLACE FUNCTION create_tenant_for_user(
  p_name TEXT,
  p_slug TEXT,
  p_full_name TEXT
)
RETURNS SETOF tenants AS $$
DECLARE
  new_tenant tenants%ROWTYPE;
BEGIN
  INSERT INTO tenants (name, slug)
  VALUES (p_name, p_slug)
  RETURNING * INTO new_tenant;

  INSERT INTO profiles (id, full_name, role, tenant_id)
  VALUES (auth.uid(), p_full_name, 'admin', new_tenant.id)
  ON CONFLICT (id) DO UPDATE
  SET full_name = p_full_name, role = 'admin', tenant_id = new_tenant.id;

  RETURN NEXT new_tenant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### confirm_user_email

Confirma email de usuario (dev/test):

```sql
CREATE OR REPLACE FUNCTION confirm_user_email(p_email TEXT)
RETURNS void AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW(), confirmed_at = NOW()
  WHERE email = p_email AND email_confirmed_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Storage

### Buckets

| Bucket | Publico | Descricao |
|--------|---------|-----------|
| avatars | Sim | Fotos de perfil |
| patients | Nao | Arquivos de pacientes |
| anamnesis | Nao | Fotos de anamnese |

### Policies

```sql
-- Avatars: leitura publica, upload autenticado
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload an avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Patients: isolamento por tenant
CREATE POLICY "Patients files are accessible only by tenant"
  ON storage.objects FOR ALL
  USING (bucket_id = 'patients'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')::text);

-- Anamnesis: isolamento por tenant
CREATE POLICY "Anamnesis files are accessible only by tenant"
  ON storage.objects FOR ALL
  USING (bucket_id = 'anamnesis'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')::text);
```

## Migrations

| # | Arquivo | Descricao |
|---|---------|-----------|
| 1 | `20260726000000_create_tenant_rpc.sql` | Cria RPC `create_tenant_for_user` |
| 2 | `20260726010000_auto_confirm_users.sql` | Funcoes para confirmar emails (dev) |
| 3 | `20260726020000_fix_tenant_rpc.sql` | Fix: ON CONFLICT DO UPDATE no RPC |
| 4 | `20260726030000_setup_dev_admin.sql` | Seed do dev admin |
| 5 | `20260727000000_fix_profiles_rls_self_read.sql` | RLS self-read para profiles |
| 6 | `20260727010000_fix_handle_new_user_trigger.sql` | Trigger sem tenant_id, profile nullable |
| 7 | `20260727020000_fix_rls_profile_based.sql` | RLS profile-based (user_tenant_id) |

### Ordem de Execucao

```
database-schema.sql (schema base)
    │
    ▼
20260726000000_create_tenant_rpc.sql
20260726010000_auto_confirm_users.sql
20260726020000_fix_tenant_rpc.sql
20260726030000_setup_dev_admin.sql
20260727000000_fix_profiles_rls_self_read.sql
20260727010000_fix_handle_new_user_trigger.sql
20260727020000_fix_rls_profile_based.sql
```

## Servicos Pre-Definidos

Definidos em `src/lib/services.ts`:

| ID | Servico | Cor | Duracao | Preco |
|----|---------|-----|---------|-------|
| massoterapia | Massoterapia | #3B82F6 | 60min | R$180 |
| estetica-facial | Estetica Facial | #EC4899 | 45min | R$200 |
| estetica-corp | Estetica Corporal | #8B5CF6 | 60min | R$250 |
| fisioterapia | Fisioterapia | #10B981 | 50min | R$160 |
| quiropraxia | Quiropraxia | #F97316 | 40min | R$170 |
| acupuntura | Acupuntura | #EF4444 | 45min | R$150 |
| spa | Spa / Bem-estar | #B89A63 | 90min | R$350 |
| danca | Danca | #06B6D4 | 60min | R$120 |
| personal | Personal Training | #059669 | 60min | R$200 |
| outro | Outro | #6B7280 | 60min | R$0 |
