import { Page, expect } from '@playwright/test';

export const BASE_URL = 'https://growth-eval-suite.preview.emergentagent.com';

export async function waitForAppReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
}

export async function dismissToasts(page: Page) {
  await page.addLocatorHandler(
    page.locator('[data-sonner-toast], .Toastify__toast, [role="status"].toast, .MuiSnackbar-root'),
    async () => {
      const close = page.locator('[data-sonner-toast] [data-close], [data-sonner-toast] button[aria-label="Close"], .Toastify__close-button, .MuiSnackbar-root button');
      await close.first().click({ timeout: 2000 }).catch(() => {});
    },
    { times: 10, noWaitAfter: true }
  );
}

export async function loginAs(page: Page, email: string, password: string = 'demo123') {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('login-password-input').fill(password);
  await page.getByTestId('login-submit-btn').click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}

export async function loginAsAdmin(page: Page) {
  return loginAs(page, 'admin@company.com');
}

export async function loginAsExec(page: Page) {
  return loginAs(page, 'exec@company.com');
}

export async function loginAsManager(page: Page) {
  return loginAs(page, 'james.chen@company.com');
}

export async function loginAsPO(page: Page) {
  return loginAs(page, 'alex.johnson@company.com');
}

export async function loginAsPartner(page: Page) {
  return loginAs(page, 'lisa.wang@company.com');
}

export async function checkForErrors(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const errorElements = Array.from(
      document.querySelectorAll('.error, [class*="error"], [id*="error"]')
    );
    return errorElements.map(el => el.textContent || '').filter(Boolean);
  });
}
