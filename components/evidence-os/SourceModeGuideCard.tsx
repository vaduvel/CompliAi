import { Card, CardContent } from "@/components/evidence-os/Card"
import type { ScanSourceType } from "@/components/evidence-os/ScanSourceTypeSelector"

interface SourceModeGuideCardProps {
  sourceType: ScanSourceType
}

export function SourceModeGuideCard({ sourceType }: SourceModeGuideCardProps) {
  const content = {
    document: {
      title: "Flux pentru documente scanate",
      description:
        "Incarci PDF sau imagine, extragem textul, il revizuiesti si apoi rulezi analiza finala pe continutul curatat.",
      steps: [
        "Alegi fisierul si ii confirmi numele.",
        "Verifici textul extras daca OCR-ul a corectat ceva prost.",
        "Pornesti analiza si mergi direct la rezultatul documentului.",
      ],
    },
    text: {
      title: "Flux pentru text manual",
      description:
        "Cand ai deja politica, contractul sau ToS-ul copiat, sari peste OCR si pregatesti analiza direct pe textul introdus.",
      steps: [
        "Dai un nume clar analizei.",
        "Lipesti continutul relevant in zona de text.",
        "Pregatesti analiza si confirmi rezultatul ca pe un document normal.",
      ],
    },
    manifest: {
      title: "Flux pentru autodiscovery din cod",
      description:
        "Incarci manifestul, detectam provideri si framework-uri AI, apoi confirmi uman ce sisteme intra in inventarul oficial.",
      steps: [
        "Alegi `package.json`, `requirements.txt` sau lockfile-ul relevant.",
        "Rulezi autodiscovery si revizuiesti sistemele propuse.",
        "Editezi, confirmi si folosesti drift-ul fata de baseline-ul validat.",
      ],
    },
    yaml: {
      title: "Flux pentru compliscan.yaml",
      description:
        "Incarci configuratia declarata a sistemului AI, verificam providerul, modelul, datele, human oversight si drift-ul fata de baseline.",
      steps: [
        "Adaugi fisierul `compliscan.yaml` sau lipesti continutul direct.",
        "Validam configuratia si generam findings cu mapare legala si dovezi necesare.",
        "Folosesti rezultatul ca sursa de adevar pentru control, audit si drift detection.",
      ],
    },
  }[sourceType]

  return (
    <Card className="border-eos-border-subtle bg-eos-bg-panel">
      <CardContent className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-eos-text-tertiary">Mod activ</p>
          <h2 className="mt-2 text-2xl font-semibold text-eos-text">{content.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-eos-text-muted">{content.description}</p>
        </div>
        <div className="grid gap-3">
          {content.steps.map((step, index) => (
            <div
              key={`${sourceType}-${index}`}
              className="rounded-eos-lg border border-eos-border-subtle bg-eos-bg-inset p-4"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-eos-text-tertiary">Pas {index + 1}</p>
              <p className="mt-2 text-sm text-eos-text">{step}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
