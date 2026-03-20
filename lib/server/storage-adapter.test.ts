// Sprint 10 — Storage Adapter tests
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  readFileMock: vi.fn(),
  writeFileMock: vi.fn(),
  mkdirMock: vi.fn(),
  hasSupabaseConfigMock: vi.fn(),
  getConfiguredDataBackendMock: vi.fn(),
  supabaseSelectMock: vi.fn(),
  supabaseUpsertMock: vi.fn(),
}))

vi.mock("node:fs", () => ({
  promises: {
    readFile: mocks.readFileMock,
    writeFile: mocks.writeFileMock,
    mkdir: mocks.mkdirMock,
  },
}))

vi.mock("@/lib/server/supabase-rest", () => ({
  hasSupabaseConfig: mocks.hasSupabaseConfigMock,
  supabaseSelect: mocks.supabaseSelectMock,
  supabaseUpsert: mocks.supabaseUpsertMock,
}))

vi.mock("@/lib/server/supabase-tenancy", () => ({
  getConfiguredDataBackend: mocks.getConfiguredDataBackendMock,
}))

import {
  LocalFileStorage,
  createLocalStorage,
  createAdaptiveStorage,
} from "./storage-adapter"

type TestState = { value: string; count: number }
const ORIGINAL_ALLOW_LOCAL_FALLBACK = process.env.COMPLISCAN_ALLOW_LOCAL_FALLBACK

describe("LocalFileStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.mkdirMock.mockResolvedValue(undefined)
    mocks.writeFileMock.mockResolvedValue(undefined)
    delete process.env.COMPLISCAN_ALLOW_LOCAL_FALLBACK
  })

  it("returnează null când fișierul nu există", async () => {
    mocks.readFileMock.mockRejectedValue(new Error("ENOENT"))
    const storage = new LocalFileStorage<TestState>("test")
    const result = await storage.read("org-1")
    expect(result).toBeNull()
  })

  it("citește starea din fișier", async () => {
    const state: TestState = { value: "hello", count: 42 }
    mocks.readFileMock.mockResolvedValue(JSON.stringify(state))
    const storage = new LocalFileStorage<TestState>("test")
    const result = await storage.read("org-1")
    expect(result).toEqual(state)
  })

  it("scrie starea în fișier JSON formatat", async () => {
    const state: TestState = { value: "world", count: 7 }
    const storage = new LocalFileStorage<TestState>("test")
    await storage.write("org-2", state)
    expect(mocks.mkdirMock).toHaveBeenCalledOnce()
    expect(mocks.writeFileMock).toHaveBeenCalledWith(
      expect.stringContaining("test-org-2.json"),
      JSON.stringify(state, null, 2),
      "utf8"
    )
  })
})

describe("createLocalStorage factory", () => {
  it("creează o instanță LocalFileStorage", () => {
    const storage = createLocalStorage<TestState>("prefix")
    expect(storage).toBeDefined()
    expect(typeof storage.read).toBe("function")
    expect(typeof storage.write).toBe("function")
  })
})

describe("createAdaptiveStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.mkdirMock.mockResolvedValue(undefined)
    mocks.writeFileMock.mockResolvedValue(undefined)
    delete process.env.COMPLISCAN_ALLOW_LOCAL_FALLBACK
  })

  afterAll(() => {
    if (ORIGINAL_ALLOW_LOCAL_FALLBACK === undefined) {
      delete process.env.COMPLISCAN_ALLOW_LOCAL_FALLBACK
      return
    }
    process.env.COMPLISCAN_ALLOW_LOCAL_FALLBACK = ORIGINAL_ALLOW_LOCAL_FALLBACK
  })

  it("folosește storage local când Supabase nu e configurat", async () => {
    mocks.hasSupabaseConfigMock.mockReturnValue(false)
    mocks.getConfiguredDataBackendMock.mockReturnValue("local")
    const storage = createAdaptiveStorage<TestState>("nis2", "nis2_state")
    // Testăm că funcționează și scrie local
    await storage.write("org-1", { value: "test", count: 1 })
    expect(mocks.writeFileMock).toHaveBeenCalledWith(
      expect.stringContaining("nis2-org-1.json"),
      expect.any(String),
      "utf8"
    )
  })

  it("folosește storage local când backend=local chiar dacă Supabase e configurat", async () => {
    mocks.hasSupabaseConfigMock.mockReturnValue(true)
    mocks.getConfiguredDataBackendMock.mockReturnValue("local")
    const storage = createAdaptiveStorage<TestState>("nis2", "nis2_state")
    mocks.readFileMock.mockResolvedValue(JSON.stringify({ value: "x", count: 0 }))
    const result = await storage.read("org-2")
    expect(result).toEqual({ value: "x", count: 0 })
  })

  it("returnează instanță validă (read + write funcționale)", async () => {
    mocks.hasSupabaseConfigMock.mockReturnValue(false)
    mocks.getConfiguredDataBackendMock.mockReturnValue("local")
    const storage = createAdaptiveStorage<TestState>("nis2", "nis2_state")
    expect(typeof storage.read).toBe("function")
    expect(typeof storage.write).toBe("function")
  })

  it("cade pe storage local când citirea din Supabase eșuează și fallback-ul local este permis", async () => {
    mocks.hasSupabaseConfigMock.mockReturnValue(true)
    mocks.getConfiguredDataBackendMock.mockReturnValue("supabase")
    mocks.supabaseSelectMock.mockRejectedValue(new Error("relation public.nis2_state does not exist"))
    mocks.readFileMock.mockResolvedValue(JSON.stringify({ value: "local", count: 3 }))

    const storage = createAdaptiveStorage<TestState>("nis2", "nis2_state")
    const result = await storage.read("org-3")

    expect(result).toEqual({ value: "local", count: 3 })
  })

  it("cade pe storage local când scrierea în Supabase eșuează și fallback-ul local este permis", async () => {
    mocks.hasSupabaseConfigMock.mockReturnValue(true)
    mocks.getConfiguredDataBackendMock.mockReturnValue("supabase")
    mocks.supabaseUpsertMock.mockRejectedValue(new Error("relation public.nis2_state does not exist"))

    const storage = createAdaptiveStorage<TestState>("nis2", "nis2_state")
    await storage.write("org-4", { value: "fallback", count: 7 })

    expect(mocks.writeFileMock).toHaveBeenCalledWith(
      expect.stringContaining("nis2-org-4.json"),
      JSON.stringify({ value: "fallback", count: 7 }, null, 2),
      "utf8"
    )
  })

  it("blochează fallback-ul local în mod strict când storage-ul cloud nu poate fi citit", async () => {
    mocks.hasSupabaseConfigMock.mockReturnValue(true)
    mocks.getConfiguredDataBackendMock.mockReturnValue("supabase")
    process.env.COMPLISCAN_ALLOW_LOCAL_FALLBACK = "false"
    mocks.supabaseSelectMock.mockRejectedValue(new Error("relation public.nis2_state does not exist"))
    mocks.readFileMock.mockRejectedValue(new Error("ENOENT"))

    const storage = createAdaptiveStorage<TestState>("nis2", "nis2_state")

    await expect(storage.read("org-5")).rejects.toThrow(
      "SUPABASE_STATE_REQUIRED: relation public.nis2_state does not exist"
    )
  })
})
