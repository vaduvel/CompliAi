"use client"

export function openHtmlPreview(html: string) {
  const previewWindow = window.open("", "_blank")
  if (!previewWindow) {
    throw new Error("Browserul a blocat fereastra noua.")
  }

  previewWindow.document.write(html)
  previewWindow.document.close()
}

export function sanitizeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-")
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export function getFileNameFromDisposition(contentDisposition: string | null) {
  if (!contentDisposition) return null
  const match = contentDisposition.match(/filename=\"?([^\";]+)\"?/i)
  return match?.[1] ?? null
}

export async function toBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export async function copyTextToClipboard(text: string) {
  await navigator.clipboard.writeText(text)
}
