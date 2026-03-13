import { describe, expect, it } from "vitest"

import {
  normalizeRepoSyncFiles,
  validateProviderRepoSyncPayload,
  validateRepoSyncPayload,
} from "./repo-sync"

describe("repo-sync validation", () => {
  it("pastreaza doar fisierele relevante si elimina duplicatele", () => {
    const files = normalizeRepoSyncFiles({
      files: [
        { path: "package.json", content: '{"name":"x"}' },
        { path: "package.json", content: '{"name":"y"}' },
        { path: "README.md", content: "ignore" },
      ],
    })

    expect(files).toHaveLength(1)
    expect(files[0]).toEqual({ path: "package.json", content: '{"name":"y"}' })
  })

  it("valideaza payload-ul generic", () => {
    const payload = validateRepoSyncPayload({
      provider: "github",
      repository: "org/repo",
      branch: "main",
      files: [{ path: "compliscan.yaml", content: "version: '1.0'" }],
    })

    expect(payload.provider).toBe("github")
    expect(payload.files).toHaveLength(1)
  })

  it("respinge arrays prea mari", () => {
    expect(() =>
      validateRepoSyncPayload({
        files: new Array(13).fill({ path: "package.json", content: "{}" }),
      })
    ).toThrow("Repo sync accepta maxim 12 fisiere per request.")
  })

  it("normalizeaza payload-ul providerului", () => {
    const payload = validateProviderRepoSyncPayload("gitlab", {
      projectPath: "group/project",
      manifests: {
        "package.json": '{"name":"demo"}',
      },
    })

    expect(payload.projectPath).toBe("group/project")
    expect(payload.manifests?.["package.json"]).toBe('{"name":"demo"}')
  })
})
