# LGPD — Lei Geral de Protecao de Dados

## Visao Geral

O K2-Sync implementa conformidade total com a Lei 13.709/2018 (LGPD) para o Studio Kamke. O sistema coleta dados pessoais e dados sensiveis de saude de pacientes, com consentimento granular e separado para tratamento e marketing.

## Controlador dos Dados

| Campo | Valor |
|-------|-------|
| Estabelecimento | Studio Kamke |
| Responsavel | Michele Kamke |
| CNPJ | [XX.XXX.XXX/XXXX-XX] |
| Telefone | (XX) 98884-5326 |
| E-mail | contato@studiokamke.com.br |

## Base Legal

- **Tratamento de dados de saude:** Art. 7, I + Art. 11, I da LGPD (consentimento especifico)
- **Uso de imagem/marketing:** Art. 7, I + Art. 11, I da LGPD (consentimento especifico e granular)

> [!important] Consentimento Granular
> O consentimento para tratamento de saude e OBRIGATORIO.
> O consentimento para uso de imagem/marketing e OPCIONAL.
> Devem ser separados (Art. 8, 4: "E nula a autorizacao generica").

## Dados Coletados

### Dados Pessoais
- Nome completo
- CPF (validado via Mod-11)
- Telefone
- E-mail
- Endereco (CEP auto-fill via ViaCEP)
- Data de nascimento
- Genero
- Estado civil
- Profissao
- Contato de emergencia

### Dados de Saude (Sensiveis)
- Alergias
- Medicacoes em uso
- Condicoes medicas
- Cirurgias anteriores
- Gestacao/semanas
- Queixa principal
- Local, intensidade, frequencia e duracao da dor
- Tratamentos anteriores

### Dados de Imagem
- Fotografias capturadas durante servicos (quando autorizado)
- Videos (quando autorizado)

## Consentimento para Tratamento

### Termos implementados (11 secoes)

1. **Identificacao do Responsavel** — Studio Kamke, CNPJ
2. **Finalidade do Tratamento** — Servicos de saude, estetica, bem-estar
3. **Dados Coletados** — Pessoais, saude, sensiveis, imagem
4. **Base Legal** — Art. 7, I + Art. 11, I
5. **Direitos do Titular** — Acesso, correcao, exclusao, portabilidade, revogacao
6. **Retencao dos Dados** — Periodo necessario para finalidade
7. **Compartilhamento** — Profissionais, laboratorios, autoridades
8. **Seguranca dos Dados** — Medidas tecnicas e administrativas
9. **Cookies** — Nao utiliza
10. **Contato** — Studio Kamke, Michele Kamke
11. **Alteracoes** — Politica pode ser atualizada

### Implementacao no Formulario

- Termos em container scrollavel (`max-h-[200px]`)
- Checkbox: "Li e compreendo os termos acima" (OBRIGATORIO)
- Assinatura digital (canvas API)
- CPF com auto-formatting
- Foto com carimbo de data/hora

## Consentimento para Marketing

### Termos implementados (9 secoes)

1. **Controlador dos Dados** — Studio Kamke
2. **Finalidade Especifica** — Site, redes sociais, materiais impressos, anuncios
3. **Dados Pessoais Envolvedos** — Imagem, nome, depoimento
4. **Canais de Divulgacao** — Site, Instagram, Facebook, TikTok, folders
5. **Prazo de Utilizacao** — 2 anos (renovavel)
6. **Direito de Revogacao** — A qualquer momento
7. **Compartilhamento** — Apenas nos canais listados
8. **Seguranca** — Medidas contra uso indevido
9. **Contato** — Studio Kamke

### Implementacao no Formulario

- Termos em container scrollavel (`max-h-[150px]`)
- Checkbox separado: "Autorizo o uso da minha imagem (fotos, videos) e depoimentos para finalidades de marketing e publicidade (opcional)"
- **OPCIONAL** — nao bloqueia o submit da anamnese

## Direitos do Titular (LGPD Art. 18)

O sistema garante os seguintes direitos:

| Direito | Implementacao |
|---------|--------------|
| Acesso | Paciente pode visualizar seus dados no perfil |
| Correcao | Edicao via dialog no perfil do paciente |
| Exclusao | Exclusao com confirmacao no pacientes CRUD |
| Portabilidade | Dados em formato JSON (exportacao pendente) |
| Revogacao | Consentimento pode ser revogado a qualquer momento |
| Informacao | Termos detalham compartilhamento e retencao |

## Fluxo de Consentimento

```
Paciente preenche anamnese (5 steps)
    │
    ▼
Step 5: Consentimento
    │
    ├── Leitura dos termos LGPD (scrollavel)
    ├── Checkbox: "Li e compreendo" (OBRIGATORIO)
    │
    ├── Leitura dos termos de marketing (scrollavel)
    ├── Checkbox: "Autorizo uso de imagem" (OPCIONAL)
    │
    ├── Assinatura digital (canvas)
    │   ├── Nome completo
    │   ├── CPF (auto-formatting + Mod-11)
    │   └── Canvas touch/mouse
    │
    ├── Foto com carimbo
    │   ├── Camera do dispositivo
    │   └── Canvas overlay com timestamp
    │
    └── Submit
        ├── consent_lgpd_accepted: true (OBRIGATORIO)
        ├── consent_marketing_accepted: boolean (OPCIONAL)
        ├── consent_signature_image: base64
        ├── consent_cpf: "123.456.789-00"
        └── consent_photo: base64
```

## Armazenamento

- **Dados de saude:** Supabase PostgreSQL com RLS por tenant
- **Fotos:** Supabase Storage bucket `anamnesis` (privado, por tenant)
- **Assinaturas:** Salvas como base64 no campo `data` da anamnese
- **Retencao:** Pelo periodo necessario para a finalidade

## Seguranca

- **RLS:** Todas as tabelas com isolamento por tenant
- **HTTPS:** Comunicacao criptografada
- **Storage:** Buckets privados com policies por tenant
- **Audit Log:** Tabela `audit_logs` para rastreabilidade
- **JWT:** Tokens Supabase com tenant_id

## Notas de Implementacao

> [!warning] ReceitaWS
> O endpoint CPF da ReceitaWS foi descontinuado em 2026.
> Validacao e feita apenas via algoritmo Mod-11 (client-side).
> Nao e possivel consultar dados do CPF por API publica (LGPD).

> [!warning] Consentimento de Marketing
> O uso de fotos/videos/depoimentos para marketing requer consentimento ESPECIFICO e SEPARADO.
> Consentimento generico e nulo (Art. 8, 4 da LGPD).
> O checkbox de marketing e OPCIONAL e nao bloqueia o cadastro.
