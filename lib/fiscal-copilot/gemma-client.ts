/**
 * FiscCopilot — Local LLM client (multi-model via Ollama / Tauri llama.cpp)
 *
 * Privacy-first: rulează LOCAL. Datele NU pleacă.
 *
 * Default model: gemma3:4b (3.3GB disk, ~4GB RAM, RO calitate solidă)
 *   - Verifier-ii fac math + logic (deterministic)
 *   - Modelul DOAR verbalizează verdictul în română
 *   - Asta permite model mic fără halucinație math
 *
 * Selectare per RAM hardware user (Tauri first-run wizard):
 *   - <12GB: phi3.5:3.8b (RO mai slab dar funcțional)
 *   - 12-20GB: gemma3:4b (default recomandat) ⭐
 *   - 20-32GB: gemma3:12b (premium, RO best)
 *   - 32+GB: gemma4:e2b sau gemma2:9b (premium top)
 */

export type GemmaModel =
  | "gemma3:4b"       // ⭐ DEFAULT — RO excelentă, 4GB RAM
  | "phi3.5:3.8b"     // Low-RAM fallback (RO mai slab)
  | "gemma3:12b"      // Premium 20+GB RAM
  | "gemma4:e2b"      // Multimodal (text+vision), 7GB RAM
  | "gemma2:2b"       // Ultra-light (NU recomandat pentru fiscal)
  | "llama3.2:3b"     // NU recomandat (halucinează lege RO)
  | "llama3.1:8b";    // Heavy fallback

export interface GemmaOptions {
  model?: GemmaModel;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  /** Disable Gemma's "thinking" mode (faster, less accurate on hard problems) */
  thinking?: boolean;
  /** Timeout în ms; default 60s */
  timeoutMs?: number;
}

export interface GemmaResponse {
  text: string;
  model: string;
  latencyMs: number;
  tokensIn?: number;
  tokensOut?: number;
}

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
// Default: gemma3:4b (3.3GB, RO excelent, 4GB RAM)
// Override via env: FISCAL_COPILOT_MODEL=phi3.5:3.8b (etc.)
const DEFAULT_MODEL: GemmaModel =
  (process.env.FISCAL_COPILOT_MODEL as GemmaModel) || "gemma3:4b";

/**
 * Apelează Gemma local via Ollama HTTP API.
 * Returnează răspunsul + metadata de latency.
 */
export async function askGemma(
  prompt: string,
  opts: GemmaOptions = {}
): Promise<GemmaResponse> {
  const model = opts.model || DEFAULT_MODEL;
  const start = Date.now();

  const body = {
    model,
    prompt,
    stream: false,
    think: opts.thinking ?? false,
    system: opts.systemPrompt,
    options: {
      temperature: opts.temperature ?? 0.2,
      num_predict: opts.maxTokens ?? 512,
      top_k: 40,
      top_p: 0.9,
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 60_000);

  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Ollama returned ${res.status}: ${await res.text()}`);
    }

    const json = (await res.json()) as {
      response: string;
      prompt_eval_count?: number;
      eval_count?: number;
    };

    return {
      text: (json.response || "").trim(),
      model,
      latencyMs: Date.now() - start,
      tokensIn: json.prompt_eval_count,
      tokensOut: json.eval_count,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Verifică dacă Ollama rulează și modelul e disponibil.
 * Util pentru health-check la pornire.
 */
export async function checkGemmaAvailable(model: GemmaModel = DEFAULT_MODEL): Promise<{
  available: boolean;
  reason?: string;
}> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { method: "GET" });
    if (!res.ok) return { available: false, reason: `Ollama HTTP ${res.status}` };
    const json = (await res.json()) as { models: Array<{ name: string }> };
    const found = json.models.some((m) => m.name === model);
    return found
      ? { available: true }
      : { available: false, reason: `Model ${model} not pulled. Run: ollama pull ${model}` };
  } catch (err) {
    return {
      available: false,
      reason: `Cannot reach Ollama at ${OLLAMA_URL}: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
