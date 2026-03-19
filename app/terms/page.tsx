import Link from "next/link"
import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { Button } from "@/components/evidence-os/Button"

export const metadata = {
  title: "Termeni și Condiții — CompliAI",
}

export default function TermsPage() {
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
        <h1 className="text-2xl font-bold text-eos-text">Termeni și Condiții de Utilizare</h1>
        <p className="mt-2 text-sm text-eos-text-muted">Ultima actualizare: 18 martie 2026</p>

        <div className="prose prose-sm mt-8 max-w-none text-eos-text [&_a]:text-eos-primary [&_h2]:text-eos-text [&_h3]:text-eos-text [&_strong]:text-eos-text">
          <h2>1. Serviciul CompliAI</h2>
          <p>
            CompliAI (denumit în continuare &ldquo;Serviciul&rdquo;) este un instrument digital de asistență
            în pregătirea conformității cu reglementările aplicabile în Uniunea Europeană,
            inclusiv GDPR, EU AI Act, NIS2 și cerințele e-Factura ANAF. Serviciul este operat
            de CompliAI SRL (în curs de constituire) cu sediul în România.
          </p>

          <h2>2. Natura Serviciului — Disclamer Juridic</h2>
          <p>
            <strong>CompliAI NU oferă consultanță juridică.</strong> Conținutul generat de
            Serviciu — inclusiv documente, rapoarte, scoruri de conformitate și recomandări —
            reprezintă instrumente de asistență și pregătire, nu avize juridice cu forță legală.
          </p>
          <p>
            Utilizatorii sunt responsabili pentru validarea finală a documentelor generate
            împreună cu un avocat sau consultant juridic calificat înainte de utilizare oficială.
            CompliAI nu garantează conformitatea deplină și nu se substituie consilierii
            juridice profesionale.
          </p>

          <h2>3. Eligibilitate și Conturi</h2>
          <p>
            Serviciul este destinat persoanelor juridice (societăți comerciale, ONG-uri,
            instituții publice) cu sediul sau activitate în Uniunea Europeană. Prin crearea
            unui cont, utilizatorul declară că are cel puțin 18 ani și autoritatea legală de
            a acționa în numele organizației.
          </p>

          <h2>4. Planuri și Facturare</h2>
          <p>
            Serviciul oferă planuri gratuite și cu plată (Pro, Partner). Facturarea planurilor
            cu plată se realizează lunar prin Stripe. Prețurile afișate sunt în EUR și nu includ
            TVA, care se adaugă conform legislației aplicabile.
          </p>
          <p>
            Perioada de trial de 14 zile este gratuită, fără obligații, fără necesitatea
            unui card de plată. La expirarea trial-ului, contul revine la planul gratuit
            dacă nu a fost efectuată o plată.
          </p>

          <h2>5. Proprietate Intelectuală</h2>
          <p>
            Codul sursă, design-ul, algoritmii și modelele de date ale Serviciului sunt
            proprietatea CompliAI. Documentele generate de utilizator pe baza datelor proprii
            aparțin utilizatorului.
          </p>

          <h2>6. Protecția Datelor</h2>
          <p>
            Prelucrarea datelor cu caracter personal este descrisă în{" "}
            <Link href="/privacy">Politica de Confidențialitate</Link> și în{" "}
            <Link href="/dpa">Acordul de Prelucrare a Datelor (DPA)</Link>.
          </p>

          <h2>7. Limitarea Răspunderii</h2>
          <p>
            În măsura permisă de legea aplicabilă, CompliAI nu este răspunzătoare pentru:
            decizii de afaceri luate pe baza informațiilor din Serviciu; amenzi, sancțiuni sau
            consecințe juridice rezultate din conformitate incompletă; pierderi indirecte sau
            daune consecvente.
          </p>

          <h2>8. Modificarea Termenilor</h2>
          <p>
            CompliAI poate modifica acești Termeni cu notificare de minim 30 de zile prin
            email sau în aplicație. Continuarea utilizării după notificare constituie acceptul
            noilor termeni.
          </p>

          <h2>9. Drept Aplicabil</h2>
          <p>
            Acești Termeni sunt guvernați de legea română. Litigiile se vor soluționa pe cale
            amiabilă sau, în caz de eșec, la instanțele competente din România.
          </p>

          <h2>10. Contact</h2>
          <p>
            Pentru întrebări juridice sau privind termenii:{" "}
            <a href="mailto:legal@compliscan.ro">legal@compliscan.ro</a>
          </p>
        </div>
      </main>

      <footer className="border-t border-eos-border-subtle py-6 text-center text-xs text-eos-text-muted">
        <Link href="/privacy" className="hover:text-eos-text">Privacy</Link>
        {" · "}
        <Link href="/dpa" className="hover:text-eos-text">DPA</Link>
        {" · "}
        <Link href="/" className="hover:text-eos-text">Acasă</Link>
      </footer>
    </div>
  )
}
