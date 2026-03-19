import Link from "next/link"
import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { Button } from "@/components/evidence-os/Button"

export const metadata = {
  title: "Politica de Confidențialitate — CompliAI",
}

export default function PrivacyPage() {
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
        <h1 className="text-2xl font-bold text-eos-text">Politica de Confidențialitate</h1>
        <p className="mt-2 text-sm text-eos-text-muted">Ultima actualizare: 18 martie 2026</p>

        <div className="prose prose-sm mt-8 max-w-none text-eos-text [&_a]:text-eos-primary [&_h2]:text-eos-text [&_h3]:text-eos-text [&_strong]:text-eos-text">
          <h2>1. Operatorul de Date</h2>
          <p>
            Operatorul datelor cu caracter personal este CompliAI SRL (în curs de constituire),
            cu sediul în România. Contact: <a href="mailto:privacy@compliscan.ro">privacy@compliscan.ro</a>
          </p>

          <h2>2. Categorii de Date Prelucrate</h2>
          <ul>
            <li><strong>Date de cont:</strong> adresă email, parolă (hash bcrypt), nume organizație, CUI</li>
            <li><strong>Date de utilizare:</strong> logs de acces, IP, browser, acțiuni în aplicație</li>
            <li><strong>Date de conformitate:</strong> documentele, răspunsurile la chestionare și datele introduse de utilizator în scopuri de compliance — aceste date aparțin utilizatorului</li>
            <li><strong>Date de facturare:</strong> procesate integral de Stripe — CompliAI nu stochează date de card</li>
          </ul>

          <h2>3. Scopurile Prelucrării</h2>
          <ul>
            <li>Furnizarea și îmbunătățirea Serviciului</li>
            <li>Autentificarea și securizarea conturilor</li>
            <li>Facturarea și gestionarea abonamentelor</li>
            <li>Comunicări de serviciu (notificări, digest săptămânal)</li>
            <li>Respectarea obligațiilor legale</li>
          </ul>

          <h2>4. Temeiurile Juridice (Art. 6 GDPR)</h2>
          <ul>
            <li><strong>Executarea contractului</strong> (Art. 6(1)(b)) — pentru furnizarea Serviciului</li>
            <li><strong>Consimțământ</strong> (Art. 6(1)(a)) — pentru emailuri de marketing (opțional)</li>
            <li><strong>Obligație legală</strong> (Art. 6(1)(c)) — pentru facturare și arhivare fiscală</li>
            <li><strong>Interes legitim</strong> (Art. 6(1)(f)) — pentru securitate și detectarea fraudei</li>
          </ul>

          <h2>5. Destinatari și Transferuri</h2>
          <p>
            Datele pot fi accesate de subprocesori contractuali, toți cu sediul în UE sau cu
            garanții adecvate (SCC):
          </p>
          <ul>
            <li><strong>Stripe Inc.</strong> — procesare plăți (SCC)</li>
            <li><strong>Supabase</strong> — stocare date (EU region)</li>
            <li><strong>Resend</strong> — trimitere email (SCC)</li>
            <li><strong>Google Cloud</strong> — OCR și AI (EU region)</li>
          </ul>

          <h2>6. Retenție</h2>
          <p>
            Datele de cont se păstrează pe durata contractului și 3 ani după închiderea
            contului (obligații fiscale). Datele de utilizare anonimizate pot fi păstrate
            nedefinit în scopuri statistice.
          </p>

          <h2>7. Drepturile Tale (Art. 15–22 GDPR)</h2>
          <p>Ai dreptul la: acces, rectificare, ștergere, portabilitate, restricționare,
          opoziție și retragerea consimțământului. Cereri la:&nbsp;
          <a href="mailto:privacy@compliscan.ro">privacy@compliscan.ro</a>
          </p>
          <p>Ai dreptul să depui plângere la ANSPDCP (Autoritatea Națională de Supraveghere).</p>

          <h2>8. Cookie-uri</h2>
          <p>
            Serviciul folosește cookie-uri strict necesare (sesiune autentificare) și, cu
            consimțământul tău, cookie-uri analitice. Nu folosim cookie-uri de tracking
            de la terți în absența consimțământului explicit.
          </p>

          <h2>9. Modificări</h2>
          <p>
            Modificările semnificative vor fi notificate cu cel puțin 30 de zile înainte
            prin email sau banner în aplicație.
          </p>
        </div>
      </main>

      <footer className="border-t border-eos-border-subtle py-6 text-center text-xs text-eos-text-muted">
        <Link href="/terms" className="hover:text-eos-text">Termeni</Link>
        {" · "}
        <Link href="/dpa" className="hover:text-eos-text">DPA</Link>
        {" · "}
        <Link href="/" className="hover:text-eos-text">Acasă</Link>
      </footer>
    </div>
  )
}
