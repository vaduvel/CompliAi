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
    status: "draft_for_review" | "operational_policy"
    purpose: string
    owner: string
    clientFacingSummary: string
  }>
  subprocessors: Array<{
    name: string
    role: string
    purpose: string
    region: string
    dataCategories: string[]
    status: "configured_by_customer" | "optional" | "active"
  }>
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
        status: "draft_for_review",
        purpose:
          "Stabilește rolurile, scopurile, categoriile de date, măsurile tehnice și obligațiile de asistență pentru cabinet.",
        owner: "CompliScan + cabinet DPO",
        clientFacingSummary:
          "Document contractual de lucru. Necesită validarea profesională a cabinetului înainte de semnare.",
      },
      {
        id: "subprocessors-list",
        title: "Listă subprocessori și servicii tehnice",
        status: "operational_policy",
        purpose:
          "Arată ce servicii pot procesa date în numele platformei și ce rămâne configurabil de client.",
        owner: "CompliScan",
        clientFacingSummary:
          "Lista trebuie revizuită la activarea producției și atașată DPA-ului semnat.",
      },
      {
        id: "security-brief",
        title: "Security brief pentru pilot",
        status: "operational_policy",
        purpose:
          "Descrie controalele minime pentru acces, audit trail, export, ștergere, backup și incident response.",
        owner: "CompliScan",
        clientFacingSummary:
          "Brief de securitate pentru pilot controlat, nu certificare externă.",
      },
      {
        id: "ai-processing-brief",
        title: "AI processing brief",
        status: "operational_policy",
        purpose:
          "Clarifică modul AI ON/OFF, provider boundary și faptul că documentele client-facing cer validare umană.",
        owner: "CompliScan + cabinet DPO",
        clientFacingSummary:
          "Pentru clienți sensibili, cabinetul poate lucra template-only cu AI OFF.",
      },
    ],
    subprocessors: [
      {
        name: "Vercel",
        role: "hosting/runtime",
        purpose: "Rulează aplicația web și API-urile CompliScan.",
        region: "EU/Global edge, conform configurației Vercel",
        dataCategories: ["conturi utilizator", "metadata workspace", "artefacte operaționale"],
        status: "active",
      },
      {
        name: "Supabase",
        role: "database/auth/storage option",
        purpose: "Persistență structurată pentru tenancy, state și artefacte când este activat backend-ul cloud.",
        region: "EU, conform proiectului configurat",
        dataCategories: ["tenancy", "state client", "audit trail", "evidence metadata"],
        status: "configured_by_customer",
      },
      {
        name: "Resend",
        role: "transactional email",
        purpose: "Trimite notificări de magic link, aprobări, respingeri și rapoarte.",
        region: "EU/US, conform contului Resend",
        dataCategories: ["email destinatar", "subiect notificare", "metadata minimă document"],
        status: "optional",
      },
      {
        name: "Google Gemini / Mistral EU",
        role: "AI document assistance",
        purpose: "Asistă generarea de drafturi atunci când AI este ON.",
        region: "Provider-specific; Mistral EU disponibil pentru preferință UE",
        dataCategories: ["prompt document", "context minim introdus de utilizator"],
        status: "optional",
      },
      {
        name: "Stripe",
        role: "billing",
        purpose: "Gestionare abonamente și facturare.",
        region: "EU/Global, conform Stripe",
        dataCategories: ["date facturare", "subscription metadata"],
        status: "optional",
      },
    ],
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
    "| Serviciu | Rol | Scop | Regiune | Status |",
    "| --- | --- | --- | --- | --- |",
    ...pack.subprocessors.map(
      (item) =>
        `| ${item.name} | ${item.role} | ${item.purpose} | ${item.region} | ${item.status} |`
    ),
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
