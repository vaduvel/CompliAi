#!/usr/bin/env node
import { spawn } from "node:child_process"

const steps = [
  { label: "lint", cmd: "npm", args: ["run", "lint"] },
  { label: "test", cmd: "npm", args: ["test"] },
  { label: "build", cmd: "npm", args: ["run", "build"] },
  { label: "verify:supabase:strict", cmd: "npm", args: ["run", "verify:supabase:strict"] },
  { label: "verify:supabase:rls", cmd: "npm", args: ["run", "verify:supabase:rls"] },
]

const runStep = (step) =>
  new Promise((resolve) => {
    const child = spawn(step.cmd, step.args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
    })
    child.on("error", (error) => resolve({ step, code: 1, error: error.message }))
    child.on("exit", (code) => resolve({ step, code: code ?? 1 }))
  })

const failures = []

for (const step of steps) {
  const { code } = await runStep(step)
  if (code !== 0) {
    failures.push({ step: step.label, code })
    break
  }
}

if (failures.length > 0) {
  const failure = failures[0]
  console.error(`\nRelease preflight failed at '${failure.step}' (exit ${failure.code}).`)
  process.exit(1)
}

console.log("\nRelease preflight passed.")
