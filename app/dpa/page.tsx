import Link from "next/link"
import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { Button } from "@/components/evidence-os/Button"

export const metadata = {
  title: "Acord de Prelucrare a Datelor (DPA) — CompliAI",
}

export default function DpaPage() {
  return (
    <div className="min-h-screen bg-eos-surface-base text-eos-text">
      <header className="border-b border-eos-border-subtle bg-eos-surface-primary">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/">
            <CompliScanLogoLockup variant="flat" size="sm" />
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Conectare</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-bold text-eos-text">
          Acord de Prelucrare a Datelor (DPA)
        </h1>
        <p className="mt-2 text-sm text-eos-text-muted">
          Ultima actualizare: 18 martie 2026 · Art. 28 GDPR
        </p>

        <div className="prose prose-sm mt-8 max-w-none text-eos-text [&_a]:text-eos-primary [&_h2]:text-eos-text [&_h3]:text-eos-text [&_strong]:text-eos-text">
          <p>
            Prezentul Acord de Prelucrare a Datelor („DPA") se aplică automat tuturor
            utilizatorilor CompliAI care, prin utilizarea Serviciului, acționează în calitate
            de operatori de date conform GDPR și implică CompliAI în calitate de persoană
            împuternicită de operator (procesator).
          </p>

          <h2>1. Definiții</h2>
          <ul>
            <li><strong>Operator:</strong> organizația utilizatoare a CompliAI (clientul)</li>
            <li><strong>Procesator:</strong> CompliAI SRL</li>
            <li><strong>Date Personale:</strong> orice date cu caracter personal introduse de Operator în Serviciu</li>
            <li><strong>GDPR:</strong> Regulamentul (UE) 2016/679</li>
          </ul>

          <h2>2. Obiectul Prelucrării</h2>
          <p>
            CompliAI prelucrează datele introduse de Operator exclusiv pentru furnizarea
            funcționalităților Serviciului: stocare, calcul scor conformitate, generare documente,
            export rapoarte. Nu există prelucrare în scopuri proprii ale CompliAI fără
            consimțământ explicit.
          </p>

          <h2>3. Categoriile de Date și Subiecți</h2>
          <ul>
            <li>Date de identificare angajați (pentru chestionare HR, inventar AI)</li>
            <li>Date de contact (email, telefon) ale persoanelor de contact</li>
            <li>Date operaționale (incidente, riscuri, findinguri de conformitate)</li>
          </ul>

          <h2>4. Instrucțiunile Operatorului</h2>
          <p>
            CompliAI prelucrează datele conform instrucțiunilor documentate ale Operatorului,
            transmise prin interfața Serviciului. Dacă o instrucțiune încalcă GDPR, CompliAI
            va notifica Operatorul înainte de executare.
          </p>

          <h2>5. Obligațiile CompliAI (Art. 28(3) GDPR)</h2>
          <ul>
            <li>Confidențialitate: accesul personalului la datele Operatorului este limitat și documentat</li>
            <li>Securitate: măsuri tehnice și organizatorice conform Art. 32 GDPR</li>
            <li>Sub-procesori: notificare prealabilă cu 30 de zile la adăugarea de noi sub-procesori</li>
            <li>Asistență: sprijin pentru exercitarea drepturilor persoanelor vizate</li>
            <li>Ștergere: ștergerea sau returnarea datelor la finalizarea contractului</li>
            <li>Audit: informații și acces pentru verificarea conformității</li>
          </ul>

          <h2>6. Sub-procesori Actuali</h2>
          <ul>
            <li>Stripe Inc. — procesare plăți (SCC cu garanții adecvate)</li>
            <li>Supabase Inc. — stocare date (region EU, Frankfurt)</li>
            <li>Resend Inc. — trimitere email tranzacțional (SCC)</li>
            <li>Google Cloud Platform — servicii AI/OCR (region EU)</li>
          </ul>

          <h2>7. Transferuri Internaționale</h2>
          <p>
            Transferurile de date în afara SEE se realizează exclusiv pe baza Clauzelor
            Contractuale Standard (SCC) aprobate de Comisia Europeană sau a altor mecanisme
            de transfer adecvate.
          </p>

          <h2>8. Notificare Incidente</h2>
          <p>
            CompliAI va notifica Operatorul fără întârzieri nejustificate, și în cel mult
            72 de ore de la constatare, în cazul unui incident de securitate care afectează
            datele Operatorului.
          </p>

          <h2>9. Durata și Ștergerea</h2>
          <p>
            DPA este valabil pe durata contractului de servicii. La terminarea contractului,
            CompliAI va șterge sau returna datele în termen de 30 de zile, conform opțiunii
            Operatorului.
          </p>

          <h2>10. Contact DPO</h2>
          <p>
            Pentru exercitarea drepturilor sau solicitări DPA:{" "}
            <a href="mailto:dpo@compliscan.ro">dpo@compliscan.ro</a>
          </p>
        </div>
      </main>

      <footer className="border-t border-eos-border-subtle py-6 text-center text-xs text-eos-text-muted">
        <Link href="/terms" className="hover:text-eos-text">Termeni</Link>
        {" · "}
        <Link href="/privacy" className="hover:text-eos-text">Privacy</Link>
        {" · "}
        <Link href="/" className="hover:text-eos-text">Acasă</Link>
      </footer>
    </div>
  )
}
