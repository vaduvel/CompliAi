const GOOGLE_CLOUD_VISION_API_KEY = process.env.GOOGLE_CLOUD_VISION_API_KEY
const GOOGLE_CLOUD_VISION_LOCATION =
  process.env.GOOGLE_CLOUD_VISION_LOCATION ?? "eu"

export function hasVisionConfig() {
  return Boolean(GOOGLE_CLOUD_VISION_API_KEY)
}

function getVisionHost() {
  return GOOGLE_CLOUD_VISION_LOCATION
    ? `${GOOGLE_CLOUD_VISION_LOCATION}-vision.googleapis.com`
    : "vision.googleapis.com"
}

export async function extractTextWithVision(imageBase64: string) {
  if (!GOOGLE_CLOUD_VISION_API_KEY) {
    throw new Error("GOOGLE_CLOUD_VISION_API_KEY lipsa.")
  }

  const visionHost = getVisionHost()

  const response = await fetch(
    `https://${visionHost}/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: imageBase64 },
            features: [
              {
                type: "DOCUMENT_TEXT_DETECTION",
                model: "builtin/stable",
              },
            ],
            imageContext: {
              languageHints: ["ro", "en"],
            },
          },
        ],
      }),
      cache: "no-store",
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Vision API error ${response.status}: ${text}`)
  }

  const json = (await response.json()) as {
    responses?: Array<{
      fullTextAnnotation?: { text?: string }
      textAnnotations?: Array<{ description?: string }>
      error?: { message?: string }
    }>
  }

  const first = json.responses?.[0]
  if (first?.error?.message) {
    throw new Error(first.error.message)
  }

  const text =
    first?.fullTextAnnotation?.text?.trim() ||
    first?.textAnnotations?.[0]?.description?.trim() ||
    ""

  return text
}

export async function extractTextFromPdfWithVision(pdfBase64: string) {
  if (!GOOGLE_CLOUD_VISION_API_KEY) {
    throw new Error("GOOGLE_CLOUD_VISION_API_KEY lipsa.")
  }

  const visionHost = getVisionHost()
  const response = await fetch(
    `https://${visionHost}/v1/files:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            inputConfig: {
              mimeType: "application/pdf",
              content: pdfBase64,
            },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
            pages: [1, 2, 3, 4, 5],
          },
        ],
      }),
      cache: "no-store",
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Vision API error ${response.status}: ${text}`)
  }

  const json = (await response.json()) as {
    responses?: Array<{
      error?: { message?: string }
      responses?: Array<{
        fullTextAnnotation?: { text?: string }
        textAnnotations?: Array<{ description?: string }>
        error?: { message?: string }
      }>
    }>
  }

  const fileResponse = json.responses?.[0]
  if (fileResponse?.error?.message) {
    throw new Error(fileResponse.error.message)
  }

  const pages = fileResponse?.responses ?? []
  const pageTexts: string[] = []

  for (const page of pages) {
    if (page.error?.message) {
      throw new Error(page.error.message)
    }
    const text =
      page.fullTextAnnotation?.text?.trim() ||
      page.textAnnotations?.[0]?.description?.trim() ||
      ""
    if (text) pageTexts.push(text)
  }

  return pageTexts.join("\n\n").trim()
}
