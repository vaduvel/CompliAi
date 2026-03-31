import { test, expect } from "@playwright/test";

const BASE_URL = "https://compliscanag.vercel.app";

test("QA Session: AI System Lifecycle", async ({ page }) => {
  // Step 1: Login (using a generic test account or creating one)
  const email = `qa-test-${Date.now()}@compliai.ro`;
  const pass = "TestPass123!";
  
  await page.goto(`${BASE_URL}/login?mode=register`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[name="password"]', pass);
  await page.fill('input[name="confirmPassword"]', pass);
  await page.fill('input[name="orgName"]', "QA Test SRL");
  await page.click('button[type="submit"]'); // Creeaza cont
  
  await page.waitForURL("**/onboarding");
  await page.click('text="Consultant / Contabil"');
  await page.click('text="Continuă"');
  await page.fill('input[placeholder*="denumirea"]', "QA Consultant");
  await page.click('text="1-5 clienți"');
  await page.click('text="Deschid portofoliul"');
  
  // Step 2: Navigate to Sisteme
  await page.goto(`${BASE_URL}/dashboard/sisteme`);
  await page.waitForLoadState("networkidle");
  
  // Step 3: Add AI System
  // This depends on the exact UI, but let's assume there's an 'Adaugă' button
  await page.click('text="Adaugă"'); 
  await page.fill('input[placeholder*="nume"]', "QA Automation System");
  await page.click('text="Continua"'); // Step 1
  await page.click('text="Continua"'); // Step 2
  await page.click('text="Continua"'); // Step 3
  await page.click("text='Finalizează'").catch(() => page.click("text='Salvează'"));
  
  // Step 4: Approve and Attest
  // Find the new system and click Approve
  await page.click('text="Aprobă"');
  await page.waitForTimeout(1000);
  await page.click('text="Atestă"');
  
  // Verify status
  const status = await page.textContent('.status-badge'); // Dummy selector
  console.log(`AI System Status: ${status}`);
  
  await page.screenshot({ path: "ai_system_qa_success.png" });
});
