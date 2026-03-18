import Link from "next/link"
import { FileQuestion } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-eos-bg px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-eos-surface text-eos-text-muted">
          <FileQuestion className="size-7" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold text-eos-text">404</h1>
        <p className="mt-2 text-sm text-eos-text-muted">Pagina nu a fost găsită.</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-eos-md bg-eos-primary px-4 py-2 text-sm font-medium text-eos-primary-text"
        >
          Mergi la dashboard
        </Link>
      </div>
    </div>
  )
}
