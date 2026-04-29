# CompliScan x DPO Complet — Pilot Trust Pack v1

**Data:** 29 aprilie 2026  
**Status:** pilot-ready draft, nu documentație juridică finală semnată  
**Scop:** pachet scurt pentru un cabinet DPO care vrea să testeze CompliScan responsabil pe 1-2 clienți reali sau pseudonimizați.

Acest pack separă în documente clare conținutul care exista deja în `security-contractual-pack.md` din runtime demo-ul DPO Production Trust Hardening. Nu introduce o teză nouă de produs. Este doar forma consumabilă pentru pilot.

## Ce conține

1. `01-DPA-CompliScan-DPO-Complet.md` — template contractual pentru relația CompliScan ↔ cabinet DPO.
2. `02-Subprocessors.md` — lista subprocessorilor, regiuni, date procesate, AI/training/EU-only.
3. `03-Security-and-Hosting.md` — hosting, storage, acces, audit trail, magic links, RBAC.
4. `04-Backup-Retention-Deletion.md` — backup, retenție, export, soft delete, hard delete, offboarding.
5. `05-AI-Processing-Terms.md` — AI ON/OFF, Mistral/Gemini, no-training, template-only mode.
6. `06-Client-Facing-Explainer.md` — explicație simplă pentru clientul cabinetului.
7. `07-Offboarding-Test-Report.md` — ce a fost testat în runtime pentru export, ștergere și restore.

## Validare produs asociată

Pachetul se bazează pe runtime demo-ul:

- ZIP: `/Users/vaduvageorge/Downloads/compliscan-dpo-production-trust-hardening-2026-04-28.zip`
- Runtime checks: `118/118 PASS`
- Commit: `79654bc feat(dpo): harden production trust controls`

Flow verificat:

- portofoliu DPO Complet cu Apex, Lumen și Cobalt;
- work queue cu DSAR critic;
- DPA aprobat prin magic link;
- comment/reject pe magic link;
- token alterat blocat;
- evidence ledger și traceability;
- import template `.docx`, `.md`, `.txt`;
- AI OFF pentru client sensibil;
- Apex trece în `audit_ready` după baseline validat;
- export complet cabinet;
- soft delete evidence cu motiv, restore window și revalidare.

## Ce NU este încă final

- DPA-ul trebuie completat cu datele juridice reale și semnat.
- Subprocessorii trebuie confirmați împreună cu configurarea reală de producție.
- Mediul real de producție trebuie să ruleze pe Supabase production, nu `local_fallback`.
- Backup/offboarding trebuie rulat pe mediul real înainte de migrare completă.
- Documentele trebuie revizuite de fondator + consultant DPO/avocat înainte de producție cu date sensibile.

## Cum se folosește în pilot

1. Trimite acest pack către consultantul DPO înainte de pilot.
2. Alege 1 client pseudonimizat și 1 client real cu risc redus.
3. Activează AI OFF pentru clientul sensibil.
4. Importă 2-3 template-uri reale ale cabinetului.
5. Rulează un workflow: DPA vendor → magic link → approve/reject/comment → evidence → raport lunar → export.
6. La final, rulează export + offboarding test.

## Formulare scurtă pentru email

> Am separat pachetul de încredere pentru pilot: DPA template, subprocessori, hosting/security, backup/retenție/ștergere, AI processing, explicație pentru clientul final și raport de offboarding test. Nu sunt documente juridice finale semnate, dar sunt suficiente pentru a evalua responsabil un pilot controlat pe 1-2 clienți.
