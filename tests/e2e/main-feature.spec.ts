import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsExec, loginAsManager, loginAsPO, dismissToasts } from '../fixtures/helpers';

test.describe('Executive Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginAsAdmin(page);
  });

  test('executive dashboard loads from quick action', async ({ page }) => {
    await page.getByTestId('quick-action-executive-dashboard').click();
    await expect(page).toHaveURL(/\/executive/);
    await expect(page.getByRole('heading', { name: 'Executive Dashboard' })).toBeVisible();
  });

  test('executive dashboard shows KPI tiles with PO count', async ({ page }) => {
    await page.goto('/executive', { waitUntil: 'domcontentloaded' });
    // KPI tile shows "Total POs" label
    await expect(page.getByText('Total POs')).toBeVisible();
    // Should show 12 POs (from seed)
    await expect(page.getByText('12', { exact: true }).first()).toBeVisible();
  });

  test('executive dashboard has team filter', async ({ page }) => {
    await page.goto('/executive', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('team-filter')).toBeVisible();
  });

  test('executive dashboard has CSV export button', async ({ page }) => {
    await page.goto('/executive', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('export-csv-btn')).toBeVisible();
  });

  test('executive dashboard shows maturity distribution section', async ({ page }) => {
    await page.goto('/executive', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Maturity Distribution')).toBeVisible();
  });

  test('executive dashboard shows dimension averages/radar', async ({ page }) => {
    await page.goto('/executive', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Dimension Averages').or(page.getByText('Radar'))).toBeVisible();
  });
});

test.describe('Executive Dashboard - Exec Viewer Access', () => {
  test('exec viewer can access executive dashboard', async ({ page }) => {
    await dismissToasts(page);
    await loginAsExec(page);
    await page.getByTestId('quick-action-executive-dashboard').click();
    await expect(page).toHaveURL(/\/executive/);
    await expect(page.getByRole('heading', { name: 'Executive Dashboard' })).toBeVisible();
  });
});

test.describe('Manager Team View', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginAsManager(page);
  });

  test('manager can navigate to team view', async ({ page }) => {
    await page.getByTestId('quick-action-my-team').click();
    await expect(page).toHaveURL(/\/manager/);
    await expect(page.getByRole('heading', { name: 'My Team' })).toBeVisible();
  });

  test('manager team view shows team members table', async ({ page }) => {
    await page.goto('/manager', { waitUntil: 'domcontentloaded' });
    // Should show "Team Members" section heading
    await expect(page.getByText('Team Members')).toBeVisible();
    // Team rows use data-testid="team-row-{po_id}"
    await expect(page.locator('[data-testid^="team-row-"]').first()).toBeVisible();
  });

  test('manager team view shows KPI tiles', async ({ page }) => {
    await page.goto('/manager', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Team Size')).toBeVisible();
    await expect(page.getByText('Avg Score')).toBeVisible();
  });

  test('manager team view shows completion and alignment KPIs', async ({ page }) => {
    await page.goto('/manager', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Completed')).toBeVisible();
    await expect(page.getByText('Avg Alignment')).toBeVisible();
  });

  test('manager can view individual PO scorecard', async ({ page }) => {
    await page.goto('/manager', { waitUntil: 'domcontentloaded' });
    // Click the first view scorecard button
    const viewBtn = page.locator('[data-testid^="view-scorecard-"]').first();
    await expect(viewBtn).toBeVisible();
    await viewBtn.click();
    await expect(page).toHaveURL(/\/scorecard\//);
  });
});

test.describe('Individual Scorecard - Product Owner', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginAsPO(page);
  });

  test('product owner can navigate to scorecard', async ({ page }) => {
    await page.getByTestId('quick-action-my-scorecard').click();
    await expect(page).toHaveURL(/\/scorecard/);
    await expect(page.getByRole('heading', { name: 'My Scorecard' })).toBeVisible();
  });

  test('scorecard shows overall score KPI', async ({ page }) => {
    await page.goto('/scorecard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Overall Score')).toBeVisible();
  });

  test('scorecard shows partner avg and manager KPIs', async ({ page }) => {
    await page.goto('/scorecard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Partner Avg')).toBeVisible();
    await expect(page.getByText('Manager').first()).toBeVisible();
    await expect(page.getByText('Alignment', { exact: true })).toBeVisible();
  });

  test('scorecard shows dimension breakdown', async ({ page }) => {
    await page.goto('/scorecard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Dimension Breakdown')).toBeVisible();
    await expect(page.getByText('Score Summary')).toBeVisible();
  });

  test('scorecard shows dimension names', async ({ page }) => {
    await page.goto('/scorecard', { waitUntil: 'domcontentloaded' });
    // At least one dimension name should appear
    await expect(page.getByText('Strategy & Outcomes').first()).toBeVisible();
  });

  test('scorecard shows maturity badge', async ({ page }) => {
    await page.goto('/scorecard', { waitUntil: 'domcontentloaded' });
    // Wait for scorecard to load (not show loading spinner)
    await expect(page.getByText('Overall Score')).toBeVisible({ timeout: 15000 });
    // MaturityBadge renders one of these bands
    const maturityBands = ['Foundational', 'Developing', 'Performing', 'Leading', 'Elite'];
    let found = false;
    for (const band of maturityBands) {
      const count = await page.getByText(band).count();
      if (count > 0) {
        found = true;
        break;
      }
    }
    expect(found).toBeTruthy();
  });
});

test.describe('Scorecard - Admin access', () => {
  test('admin can view scorecard from executive page', async ({ page }) => {
    await dismissToasts(page);
    await loginAsAdmin(page);
    await page.goto('/executive', { waitUntil: 'domcontentloaded' });
    const viewBtn = page.locator('[data-testid^="view-po-"]').first();
    await expect(viewBtn).toBeVisible();
    await viewBtn.click();
    await expect(page).toHaveURL(/\/scorecard\//);
    await expect(page.getByText('Overall Score')).toBeVisible();
  });
});

test.describe('Seed Demo Data', () => {
  test('seed demo data button is visible and clickable for admin', async ({ page }) => {
    await dismissToasts(page);
    await loginAsAdmin(page);
    const seedBtn = page.getByTestId('seed-demo-btn');
    await expect(seedBtn).toBeVisible();
    await expect(seedBtn).toBeEnabled();
    // Note: We don't click because seed invalidates current user session (known bug)
  });

  test('seed demo button exists on admin console', async ({ page }) => {
    await dismissToasts(page);
    await loginAsAdmin(page);
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    const seedBtn = page.getByTestId('seed-demo-btn');
    await expect(seedBtn).toBeVisible();
    await expect(seedBtn).toBeEnabled();
  });
});
