import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("node:fs", () => ({
  promises: {
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    appendFile: vi.fn(),
  },
}))

import { promises as fs } from "node:fs"

import { appendFileSafe, writeFileSafe } from "@/lib/server/fs-safe"

const mkdirMock = vi.mocked(fs.mkdir)
const writeFileMock = vi.mocked(fs.writeFile)
const appendFileMock = vi.mocked(fs.appendFile)

function nodeError(code: string) {
  const error = new Error(code) as NodeJS.ErrnoException
  error.code = code
  return error
}

describe("fs-safe", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    mkdirMock.mockReset()
    writeFileMock.mockReset()
    appendFileMock.mockReset()
  })

  it("skips writes when the local filesystem path is missing in serverless", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    mkdirMock.mockRejectedValue(nodeError("ENOENT"))

    await expect(writeFileSafe("/var/task/.data/users.json", "{}")).resolves.toBe(false)
    expect(warnSpy).toHaveBeenCalled()
  })

  it("skips appends when the local filesystem path is missing in serverless", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    mkdirMock.mockRejectedValue(nodeError("ENOENT"))

    await expect(appendFileSafe("/var/task/.data/analytics.jsonl", "event")).resolves.toBe(false)
    expect(warnSpy).toHaveBeenCalled()
  })
})
