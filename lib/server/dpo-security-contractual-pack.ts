import type { UserRole } from "@/lib/server/auth"
import { getPermissionMatrixForExport, type PermissionMatrixRow } from "@/lib/server/rbac"

export type DpoSecurityContractualPackInput = {
  cabinetOrgId: string
  cabinetName: string
  consultantEmail: string
  consultantRole: UserRole
  generatedAtISO?: string
  appUrl?: string
}

export type DpoSecurityContractualPack = {
  meta: {
    title: string
    version: "2026.04"
    generatedAtISO: string
    cabinetOrgId: string
    cabinetName: string
    consultantEmail: string
    consultantRole: UserRole
  }
  contractualDocuments: Array<{
    id: string
    title: string
    status: "signature_ready" | "operational_policy" | "production_policy" | "client_ready_policy"
    purpose: string
    owner: string
    clientFacingSummary: string
  }>
  subprocessors: Array<{
    name: string
    exactProvider: string
    role: string
    purpose: string
    region: string
    dataProcessed: string
    dataCategories: string[]
    aiMode: "n/a" | "ai_off" | "ai_on_optional"
    trainingUse: "no_customer_training" | "not_applicable"
    euOnlyMode: "yes" | "not_required" | "disabled_by_default"
    enabledWhen: string
    status: "production_required" | "optional" | "disabled_by_default" | "active"
  }>
  productionStorage: {
    backend: "supabase_production"
    databaseRegion: string
    evidenceBucket: string
    evidenceRegion: string
    backupPolicy: string
    retentionPolicy: string
    exportPolicy: string
    deletionPolicy: string
  }
  legalTerms: Array<{
    id: string
    title: string
    status: "signature_ready" | "production_policy" | "client_ready_policy"
    clauses: string[]
  }>
  evidenceDeletionPolicy: {
    softDelete: string
    reasonRequired: string
    auditLog: string
    restoreWindow: string
    permanentDelete: string
  }
  securityControls: Array<{
    id: string
    area: string
    control: string
    evidenceInProduct: string
    migrationImpact: string
  }>
  dataLifecycle: Array<{
    stage: string
    handling: string
    exportOrDeletion: string
  }>
  aiAssurance: {
    aiMode: "configurable_on_off"
    noTrainingCommitment: string
    sensitiveClientMode: string
    providerBoundary: string
  }
  permissionMatrix: PermissionMatrixRow[]
  clientFacingDisclaimer: string
  pilotReadinessChecklist: string[]
}

export function buildDpoSecurityContractualPack(
  input: DpoSecurityContractualPackInput
): DpoSecurityContractualPack {
  const generatedAtISO = input.generatedAtISO ?? new Date().toISOString()
  const appUrl = input.appUrl?.replace(/\/+$/, "") || process.env.NEXT_PUBLIC_URL || "https://compliscan.ro"

  return {
    meta: {
      title: "DPO Migration Confidence Pack — security + contractual",
      version: "2026.04",
      generatedAtISO,
      cabinetOrgId: input.cabinetOrgId,
      cabinetName: input.cabinetName,
      consultantEmail: input.consultantEmail,
      consultantRole: input.consultantRole,
    },
    contractualDocuments: [
      {
        id: "dpa-controller-processor",
        title: "DPA CompliScan ↔ cabinet DPO",
        status: "signature_ready",
        purpose:
          "Stabilește rolurile, scopurile, categoriile de date, măsurile tehnice și obligațiile de asistență pentru cabinet.",
        owner: "CompliScan + cabinet DPO",
        clientFacingSummary:
          "Document semnabil client-ready: cabinetul completează datele societății și îl semnează înainte de clienți reali.",
      },
      {
        id: "subprocessors-list",
        title: "Listă subprocessori și servicii tehnice",
        status: "client_ready_policy",
        purpose:
          "Arată ce servicii pot procesa date în numele platformei și ce rămâne configurabil de client.",
        owner: "CompliScan",
        clientFacingSummary:
          "Listă atașabilă DPA-ului semnat; include provider exact, regiune, date procesate, AI/training și mod EU-only.",
      },
      {
        id: "security-brief",
        title: "Security brief pentru pilot",
        status: "production_policy",
        purpose:
          "Descrie controalele minime pentru acces, audit trail, export, ștergere, backup și incident response.",
        owner: "CompliScan",
        clientFacingSummary:
          "Brief de securitate client-facing pentru pilot/producție controlată; nu este certificare externă.",
      },
      {
        id: "ai-processing-brief",
        title: "AI processing brief",
        status: "production_policy",
        purpose:
          "Clarifică modul AI ON/OFF, provider boundary și faptul că documentele client-facing cer validare umană.",
        owner: "CompliScan + cabinet DPO",
        clientFacingSummary:
          "Pentru clienți sensibili, cabinetul poate lucra template-only cu AI OFF; AI ON se activează explicit per workspace.",
      },
    ],
    subprocessors: [
      {
        name: "Vercel",
        exactProvider: "Vercel Inc. / Vercel platform project configured for fra1 serverless runtime",
        role: "hosting/runtime",
        purpose: "Rulează aplicația web și API-urile CompliScan.",
        region: "fra1 — Frankfurt, Germany pentru rutele server-side care procesează date client",
        dataProcessed:
          "request metadata, session cookies, workspace routing metadata, runtime logs minimale; fișierele de evidence nu se stochează în Vercel",
        dataCategories: ["conturi utilizator", "metadata workspace", "request logs operaționale"],
        aiMode: "n/a",
        trainingUse: "not_applicable",
        euOnlyMode: "yes",
        enabledWhen: "întotdeauna pentru aplicația web și API runtime",
        status: "production_required",
      },
      {
        name: "Supabase",
        exactProvider: "Supabase project production — Postgres + Storage private bucket",
        role: "database/auth/storage option",
        purpose: "Persistență structurată pentru tenancy, state și artefacte când este activat backend-ul cloud.",
        region: "eu-central-1 — Frankfurt, Germany",
        dataProcessed:
          "org_state, memberships, event ledger, evidence_objects metadata, fișiere evidence în bucket privat",
        dataCategories: ["tenancy", "state client", "audit trail", "evidence metadata", "evidence files"],
        aiMode: "n/a",
        trainingUse: "not_applicable",
        euOnlyMode: "yes",
        enabledWhen: "obligatoriu pentru producție; local_fallback este permis doar pentru demo/dev",
        status: "production_required",
      },
      {
        name: "Resend",
        exactProvider: "Resend transactional email workspace configured for EU sending policy",
        role: "transactional email",
        purpose: "Trimite notificări de magic link, aprobări, respingeri și rapoarte.",
        region: "EU transactional email route; dacă EU route nu este contractat, notificările client-facing rămân OFF pentru clienți sensibili",
        dataProcessed:
          "email destinatar, nume cabinet, titlu document, token magic link, status notificare; nu trimite conținutul documentului în email",
        dataCategories: ["email destinatar", "subiect notificare", "metadata minimă document"],
        aiMode: "n/a",
        trainingUse: "not_applicable",
        euOnlyMode: "yes",
        enabledWhen: "opțional; doar dacă pilotul activează notificări email",
        status: "optional",
      },
      {
        name: "Mistral AI",
        exactProvider: "Mistral AI API — EU provider route for DPO production pilot",
        role: "AI document assistance",
        purpose: "Asistă generarea de drafturi când AI este ON pentru clientul respectiv.",
        region: "EU provider route — Paris/France data plane pentru pilotul DPO",
        dataProcessed:
          "prompt minim, tip document, variabile template, fragmente strict necesare; nu primește evidence files brute",
        dataCategories: ["prompt document", "context minim introdus de utilizator"],
        aiMode: "ai_on_optional",
        trainingUse: "no_customer_training",
        euOnlyMode: "yes",
        enabledWhen: "doar pe client/workspace cu AI ON; implicit AI OFF pentru healthcare/fintech sensibil",
        status: "optional",
      },
      {
        name: "Google Gemini",
        exactProvider: "Google Gemini API — global provider endpoint disabled by default for DPO production pilot",
        role: "AI document assistance fallback",
        purpose: "Fallback pentru drafturi doar dacă cabinetul optează explicit pentru provider non-EU-only.",
        region: "global provider endpoint — dezactivat implicit pentru producția DPO",
        dataProcessed:
          "prompt minim și context document doar dacă AI ON + provider Gemini este ales explicit",
        dataCategories: ["prompt document", "context minim introdus de utilizator"],
        aiMode: "ai_off",
        trainingUse: "no_customer_training",
        euOnlyMode: "disabled_by_default",
        enabledWhen: "nu este folosit în pilotul DPO standard; se activează doar prin decizie explicită a cabinetului",
        status: "disabled_by_default",
      },
      {
        name: "Stripe",
        exactProvider: "Stripe Payments Europe, Ltd.",
        role: "billing",
        purpose: "Gestionare abonamente și facturare.",
        region: "Ireland/EU pentru merchant of record; poate implica procesare globală Stripe pentru plăți",
        dataProcessed:
          "date facturare cabinet, subscription metadata, payment status; nu procesează documente client/evidence",
        dataCategories: ["date facturare", "subscription metadata"],
        aiMode: "n/a",
        trainingUse: "not_applicable",
        euOnlyMode: "not_required",
        enabledWhen: "doar după activarea billing-ului live",
        status: "optional",
      },
    ],
    productionStorage: {
      backend: "supabase_production",
      databaseRegion: "eu-central-1 — Frankfurt, Germany",
      evidenceBucket: process.env.COMPLISCAN_SUPABASE_EVIDENCE_BUCKET?.trim() || "compliscan-evidence-private",
      evidenceRegion: "eu-central-1 — Frankfurt, Germany",
      backupPolicy:
        "Backup Supabase production + export cabinet manual la pilot exit; local_fallback nu este permis pentru clienți reali.",
      retentionPolicy:
        "Datele operaționale se păstrează pe durata contractului; după offboarding se aplică export + ștergere în termenul DPA agreat.",
      exportPolicy:
        "Export client Audit Pack și export cabinet complet sunt disponibile înainte de ștergere sau migrare.",
      deletionPolicy:
        "Dovezile se șterg soft cu motiv și audit log; ștergerea definitivă este owner-only după fereastra de restore sau la offboarding.",
    },
    legalTerms: [
      {
        id: "dpa-signable-terms",
        title: "DPA final semnabil",
        status: "signature_ready",
        clauses: [
          "CompliScan acționează ca processor pentru cabinetul DPO; cabinetul rămâne controller/processor conform contractelor sale cu clienții.",
          "Scopul procesării: organizare workflow, approvals, evidence ledger, raport lunar, export Audit Pack.",
          "Categoriile de date: date utilizatori cabinet, date contacte client, metadata documente, artefacte evidence încărcate de cabinet.",
          "Subprocessorii sunt listați explicit în tabelul de subprocessori și nu primesc date peste scopul tehnic indicat.",
          "CompliScan asistă cabinetul pentru export, ștergere, incident response și audit trail conform termenelor DPA.",
        ],
      },
      {
        id: "retention-deletion-terms",
        title: "Retention + deletion terms",
        status: "production_policy",
        clauses: [
          "Export complet înainte de offboarding: client Audit Pack + cabinet archive.",
          "Soft delete pentru evidence: motiv obligatoriu, audit event, 30 zile restore.",
          "Hard delete: doar owner, motiv obligatoriu, audit event, ștergere fișier storage + metadata evidence.",
          "Conturile și workspace-urile inactive se păstrează conform contractului și se șterg la cererea owner-ului după export.",
        ],
      },
      {
        id: "incident-response-terms",
        title: "Incident response terms",
        status: "production_policy",
        clauses: [
          "Incidentele de securitate sunt triatate intern imediat, cu evidență în event ledger operațional.",
          "Cabinetul primește notificare fără întârziere nejustificată când incidentul poate afecta datele clienților săi.",
          "Notificarea include natura incidentului, datele potențial afectate, măsuri aplicate și pașii următori.",
          "CompliScan păstrează logurile relevante pentru investigație și exportă artefactele cerute de cabinet.",
        ],
      },
      {
        id: "ai-processing-terms",
        title: "AI processing terms",
        status: "production_policy",
        clauses: [
          "AI este configurabil ON/OFF per workspace/client; clienții sensibili pornesc implicit cu AI OFF.",
          "Când AI este OFF, documentele se generează template-only, fără apel către provider AI.",
          "Când AI este ON, se trimit doar prompturi minime și context strict necesar; evidence files brute nu se trimit către AI.",
          "Conținutul clientului nu este folosit de CompliScan pentru training de modele proprii.",
          "Documentele AI rămân drafturi de lucru și cer validare profesională înainte de utilizare oficială.",
        ],
      },
    ],
    evidenceDeletionPolicy: {
      softDelete:
        "Ștergerea inițială mută dovada în deletedEvidenceMeta, elimină dovada activă din task și cere revalidare.",
      reasonRequired: "Motiv obligatoriu de minim 8 caractere pentru orice soft/hard delete.",
      auditLog: "Fiecare delete/restore/permanent delete creează event ledger cu actor, rol, timestamp, motiv și evidenceId.",
      restoreWindow: "30 zile restore window; dovada soft-deleted nu poate fi descărcată public în această perioadă.",
      permanentDelete:
        "Ștergere definitivă doar owner: elimină fișierul din storage privat și metadata evidence_objects, păstrând doar event ledger-ul.",
    },
    securityControls: [
      {
        id: "rbac",
        area: "Access control",
        control: "Roluri explicite: owner, partner_manager, compliance, reviewer, viewer.",
        evidenceInProduct: "Matrice RBAC exportată în pachet + teste unitare pentru acțiuni sensibile.",
        migrationImpact: "Cabinetul poate migra gradual fără să ofere tuturor drepturi de owner.",
      },
      {
        id: "audit-trail",
        area: "Audit trail",
        control: "Evenimente append-only pentru documente, approvals, comments, rejections și schimbări de stare.",
        evidenceInProduct: "event ledger în dashboard/export + hash chain pentru events ledger.",
        migrationImpact: "Aprobările și respingerile nu mai rămân doar în email.",
      },
      {
        id: "evidence-ledger",
        area: "Evidence",
        control: "Fiecare aprobare sau dovadă validată intră în taskState/evidence ledger cu quality status.",
        evidenceInProduct: "Audit Pack include evidence ledger, traceability matrix și manifest SHA-256.",
        migrationImpact: "Consultantul poate arăta ce este validat și ce lipsește.",
      },
      {
        id: "evidence-delete-hardening",
        area: "Evidence deletion",
        control: "Dovezile se șterg soft cu motiv obligatoriu, restore window și event ledger; hard delete este owner-only.",
        evidenceInProduct: "/api/tasks/[id]/evidence/[evidenceId] DELETE/PATCH + UI task card.",
        migrationImpact: "Dovezile nu dispar fără urmă, iar greșelile pot fi restaurate controlat.",
      },
      {
        id: "exports",
        area: "Portability",
        control: "Export client Audit Pack + export complet cabinet/client.",
        evidenceInProduct: `${appUrl}/api/partner/export`,
        migrationImpact: "Cabinetul nu este blocat: poate scoate datele portofoliului pentru backup sau exit.",
      },
      {
        id: "ai-off",
        area: "AI governance",
        control: "AI poate fi dezactivat per client sensibil; generatorul folosește template-only.",
        evidenceInProduct: "white-label AI settings + runtime scenario Cobalt AI OFF.",
        migrationImpact: "Cabinetul poate testa clienți banking/healthcare fără expunere la AI provider.",
      },
      {
        id: "baseline",
        area: "Readiness",
        control: "Baseline-ul se validează doar după dovezi suficiente și findings închise.",
        evidenceInProduct: "endpoint /api/state/baseline + Audit Pack audit_ready după baseline validat.",
        migrationImpact: "Se separă dosarul de lucru de dosarul final audit_ready.",
      },
    ],
    dataLifecycle: [
      {
        stage: "Import / creare client",
        handling: "Datele sunt stocate per workspace client și legate de cabinet prin membership.",
        exportOrDeletion: "Clientul poate fi exportat individual; cabinetul poate exporta portofoliul.",
      },
      {
        stage: "Generare document",
        handling: "Draftul rămâne document de lucru până la validarea consultantului.",
        exportOrDeletion: "Documentele generate apar în export și Audit Pack când sunt relevante.",
      },
      {
        stage: "Magic link client",
        handling: "Link-ul este semnat HMAC și expiră; acțiunile clientului intră în event/evidence ledger.",
        exportOrDeletion: "Aprobările/respingerea/comentariile se exportă ca dovezi trasabile.",
      },
      {
        stage: "Pilot exit / offboarding",
        handling: "Cabinetul exportă arhiva completă și decide retenția.",
        exportOrDeletion:
          "Ștergerea finală rămâne acțiune controlată de owner, cu audit trail și procedură contractuală.",
      },
    ],
    aiAssurance: {
      aiMode: "configurable_on_off",
      noTrainingCommitment:
        "CompliScan nu folosește conținutul clienților pentru antrenarea modelelor proprii. Providerii AI sunt apelați doar când AI este activ și conform setărilor cabinetului.",
      sensitiveClientMode:
        "Pentru clienți sensibili, cabinetul poate seta AI OFF și folosi strict template-uri aprobate de cabinet.",
      providerBoundary:
        "Gemini/Mistral sunt servicii externe. Documentele generate rămân drafturi de lucru și cer validare profesională înainte de utilizare oficială.",
    },
    permissionMatrix: getPermissionMatrixForExport(),
    clientFacingDisclaimer:
      "Document de lucru pregătit de cabinet. Necesită validare profesională înainte de utilizare oficială.",
    pilotReadinessChecklist: [
      "DPA CompliScan ↔ cabinet revizuit și semnat.",
      "Lista subprocessori atașată contractului.",
      "Roluri cabinet definite: owner, partner_manager, compliance, reviewer, viewer.",
      "AI OFF stabilit pentru clienții sensibili înainte de import.",
      "Template-urile cabinetului încărcate pentru DPA, Privacy Policy, RoPA și DSAR.",
      "Export cabinet testat înainte de primul client real.",
      "Raport lunar client-facing validat pe un client pseudonimizat.",
      "Politica de offboarding/export convenită înainte de pilot.",
    ],
  }
}

export function renderDpoSecurityContractualPackMarkdown(pack: DpoSecurityContractualPack): string {
  return [
    `# ${pack.meta.title}`,
    "",
    `Generat: ${pack.meta.generatedAtISO}`,
    `Cabinet: ${pack.meta.cabinetName}`,
    `Consultant: ${pack.meta.consultantEmail} (${pack.meta.consultantRole})`,
    "",
    "## Documente contractuale",
    ...pack.contractualDocuments.flatMap((doc) => [
      "",
      `### ${doc.title}`,
      `- Status: ${doc.status}`,
      `- Scop: ${doc.purpose}`,
      `- Owner: ${doc.owner}`,
      `- Rezumat client-facing: ${doc.clientFacingSummary}`,
    ]),
    "",
    "## Subprocessori",
    "",
    "| Serviciu | Provider exact | Rol | Regiune exactă | Date procesate | AI | Training | EU-only | Activare | Status |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...pack.subprocessors.map(
      (item) =>
        `| ${item.name} | ${item.exactProvider} | ${item.role} | ${item.region} | ${item.dataProcessed} | ${item.aiMode} | ${item.trainingUse} | ${item.euOnlyMode} | ${item.enabledWhen} | ${item.status} |`
    ),
    "",
    "## Storage production",
    "",
    `- Backend: ${pack.productionStorage.backend}`,
    `- DB region: ${pack.productionStorage.databaseRegion}`,
    `- Evidence bucket: ${pack.productionStorage.evidenceBucket}`,
    `- Evidence region: ${pack.productionStorage.evidenceRegion}`,
    `- Backup: ${pack.productionStorage.backupPolicy}`,
    `- Retenție: ${pack.productionStorage.retentionPolicy}`,
    `- Export: ${pack.productionStorage.exportPolicy}`,
    `- Ștergere: ${pack.productionStorage.deletionPolicy}`,
    "",
    "## Termeni legali și operaționali",
    ...pack.legalTerms.flatMap((term) => [
      "",
      `### ${term.title}`,
      `- Status: ${term.status}`,
      ...term.clauses.map((clause) => `- ${clause}`),
    ]),
    "",
    "## Evidence delete policy",
    "",
    `- Soft delete: ${pack.evidenceDeletionPolicy.softDelete}`,
    `- Motiv: ${pack.evidenceDeletionPolicy.reasonRequired}`,
    `- Audit log: ${pack.evidenceDeletionPolicy.auditLog}`,
    `- Restore: ${pack.evidenceDeletionPolicy.restoreWindow}`,
    `- Hard delete: ${pack.evidenceDeletionPolicy.permanentDelete}`,
    "",
    "## Controale securitate",
    ...pack.securityControls.flatMap((control) => [
      "",
      `### ${control.area} — ${control.control}`,
      `- Dovadă în produs: ${control.evidenceInProduct}`,
      `- Impact migrare: ${control.migrationImpact}`,
    ]),
    "",
    "## Matrice RBAC",
    "",
    "| Acțiune | Roluri |",
    "| --- | --- |",
    ...pack.permissionMatrix.map((row) => `| ${row.label} | ${row.roles.join(", ")} |`),
    "",
    "## Checklist pilot",
    ...pack.pilotReadinessChecklist.map((item) => `- [ ] ${item}`),
    "",
    `Disclaimer: ${pack.clientFacingDisclaimer}`,
    "",
  ].join("\n")
}
