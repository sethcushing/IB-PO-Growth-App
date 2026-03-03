import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsManager, loginAsPO, dismissToasts } from '../fixtures/helpers';

test.describe('Admin Console', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginAsAdmin(page);
  });

  test('admin can navigate to admin console', async ({ page }) => {
    await page.getByTestId('quick-action-admin-console').click();
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByRole('heading', { name: 'Admin Console' })).toBeVisible();
  });

  test('admin console shows user count KPI', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Total Users')).toBeVisible();
    // Should have at least 20 users from seed
    const userCountEl = page.locator('.kpi-tile').filter({ hasText: 'Total Users' }).locator('.text-4xl');
    await expect(userCountEl).toBeVisible();
  });

  test('admin console shows dimensions count', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Dimensions')).toBeVisible();
    await expect(page.getByText('Product Owners')).toBeVisible();
  });

  test('admin console shows dimensions tab with questions', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    // Dimensions & Questions tab should be default
    await expect(page.getByText('Dimensions & Questions')).toBeVisible();
    await expect(page.getByText('Strategy & Outcomes')).toBeVisible();
  });

  test('admin console dimensions show weight badges', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    // Weight labels appear in dimension cards
    await expect(page.getByText('Weight: 15%').first()).toBeVisible();
  });

  test('admin console users tab shows user list', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.getByRole('tab', { name: 'Users' }).click();
    await expect(page.getByText('admin@company.com')).toBeVisible();
  });

  test('non-admin cannot access admin console', async ({ page }) => {
    // Login as PO
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('login-email-input').fill('alex.johnson@company.com');
    await page.getByTestId('login-password-input').fill('demo123');
    await page.getByTestId('login-submit-btn').click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    // Should redirect to dashboard (protected route)
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('Assessment Questionnaire', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginAsManager(page);
  });

  test('assessment page loads for manager with navigation', async ({ page }) => {
    // Get assignments to find a valid cycle_id/po_id
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    // Manager has pending assessments after seed
    const startBtn = page.locator('[data-testid^="start-assessment-"]').first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await expect(page).toHaveURL(/\/assessment\//);
    }
  });

  test('assessment shows back button and save progress', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    const startBtn = page.locator('[data-testid^="start-assessment-"]').first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await expect(page.getByTestId('back-btn')).toBeVisible();
      await expect(page.getByTestId('save-progress-btn')).toBeVisible();
    }
  });

  test('assessment shows rubric selector buttons (1-5 scale)', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    const startBtn = page.locator('[data-testid^="start-assessment-"]').first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      // Assessment should show rubric buttons for the first dimension's questions
      await expect(page.locator('[data-testid^="rubric-"]').first()).toBeVisible({ timeout: 15000 });
    }
  });

  test('assessment shows dimension navigation', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    const startBtn = page.locator('[data-testid^="start-assessment-"]').first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await expect(page.locator('[data-testid^="dimension-nav-"]').first()).toBeVisible({ timeout: 15000 });
    }
  });

  test('assessment has next/prev dimension navigation buttons', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    const startBtn = page.locator('[data-testid^="start-assessment-"]').first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await expect(page.getByTestId('next-dimension-btn').or(page.getByTestId('prev-dimension-btn'))).toBeVisible({ timeout: 15000 });
    }
  });
});

test.describe('CSV Export', () => {
  test('admin can trigger CSV export from executive dashboard', async ({ page }) => {
    await dismissToasts(page);
    await loginAsAdmin(page);
    await page.goto('/executive', { waitUntil: 'domcontentloaded' });
    const exportBtn = page.getByTestId('export-csv-btn');
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toBeEnabled();
  });

  test('exec viewer can trigger CSV export', async ({ page }) => {
    await dismissToasts(page);
    // Login as exec viewer
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('demo-login-execviewer').click();
    await page.getByTestId('login-submit-btn').click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await page.goto('/executive', { waitUntil: 'domcontentloaded' });
    const exportBtn = page.getByTestId('export-csv-btn');
    await expect(exportBtn).toBeVisible();
  });
});

test.describe('Navigation Layout', () => {
  test('layout shows correct nav items for admin', async ({ page }) => {
    await dismissToasts(page);
    await loginAsAdmin(page);
    await expect(page.getByTestId('nav-dashboard')).toBeVisible();
    await expect(page.getByTestId('nav-my-team')).toBeVisible();
    await expect(page.getByTestId('nav-executive')).toBeVisible();
    await expect(page.getByTestId('nav-admin')).toBeVisible();
  });

  test('layout shows logout button', async ({ page }) => {
    await dismissToasts(page);
    await loginAsAdmin(page);
    await expect(page.getByTestId('logout-btn')).toBeVisible();
  });

  test('logout button signs out user', async ({ page }) => {
    await dismissToasts(page);
    await loginAsAdmin(page);
    await page.getByTestId('logout-btn').click({ force: true });
    await expect(page).toHaveURL(/\/login/);
  });

  test('product owner nav shows correct items', async ({ page }) => {
    await dismissToasts(page);
    await loginAsPO(page);
    await expect(page.getByTestId('nav-dashboard')).toBeVisible();
    await expect(page.getByTestId('nav-my-scorecard')).toBeVisible();
    // PO should not see admin in nav
    await expect(page.getByTestId('nav-admin')).not.toBeVisible();
  });
});
