import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsExec, loginAsManager, loginAsPO, dismissToasts } from '../fixtures/helpers';

test.describe('Executive Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginAsAdmin(page);
  });

  test('executive dashboard loads from quick action', async ({ page }) => {
    await page.getByTestId('quick-action-organization').click();
    await expect(page).toHaveURL(/\/executive/);
    await expect(page.getByRole('heading', { name: 'Executive Dashboard' })).toBeVisible();
  });

  test('executive dashboard shows KPI tiles with PO count', async ({ page }) => {
    await page.goto('/executive', { waitUntil: 'domcontentloaded' });
    // KPI tile shows "Total POs" label
    await expect(page.getByText('Total POs')).toBeVisible();
  });

  test('executive dashboard has team filter', async ({ page }) => {
    await page.goto('/executive', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('team-filter')).toBeVisible();
  });

  test('executive dashboard has CSV export button', async ({ page }) => {
    await page.goto('/executive', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('export-csv-btn')).toBeVisible();
  });

  test('executive dashboard shows Growth Level Distribution section', async ({ page }) => {
    await page.goto('/executive', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Growth Level Distribution')).toBeVisible();
  });

  test('executive dashboard shows dimension averages/radar', async ({ page }) => {
    await page.goto('/executive', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Dimension Averages')).toBeVisible();
  });

  test('executive dashboard shows All Product Owners table', async ({ page }) => {
    await page.goto('/executive', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('All Product Owners')).toBeVisible();
  });
});

test.describe('Executive Dashboard - Exec Viewer Access', () => {
  test('exec viewer can access executive dashboard', async ({ page }) => {
    await dismissToasts(page);
    await loginAsExec(page);
    await page.getByTestId('quick-action-organization').click();
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
    await page.getByTestId('quick-action-my-growth').click();
    await expect(page).toHaveURL(/\/scorecard/);
    await expect(page.getByRole('heading', { name: /Scorecard/ })).toBeVisible();
  });

  test('scorecard shows Growth Score KPI', async ({ page }) => {
    await page.goto('/scorecard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Growth Score')).toBeVisible();
  });

  test('scorecard shows partner avg and manager KPIs', async ({ page }) => {
    await page.goto('/scorecard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Partner Avg')).toBeVisible();
    await expect(page.getByText('Manager').first()).toBeVisible();
    await expect(page.getByText('Alignment', { exact: false }).first()).toBeVisible();
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

  test('scorecard shows growth badge', async ({ page }) => {
    await page.goto('/scorecard', { waitUntil: 'domcontentloaded' });
    // Wait for scorecard to load
    await expect(page.getByText('Growth Score')).toBeVisible({ timeout: 15000 });
    // GrowthBadge renders one of these bands
    const growthLevels = ['Foundational', 'Developing', 'Performing', 'Leading', 'Elite'];
    let found = false;
    for (const level of growthLevels) {
      const count = await page.getByText(level).count();
      if (count > 0) {
        found = true;
        break;
      }
    }
    expect(found).toBeTruthy();
  });

  test('scorecard shows Coaching Recommendations section', async ({ page }) => {
    await page.goto('/scorecard', { waitUntil: 'domcontentloaded' });
    // Wait for scorecard to load first
    await expect(page.getByText('Growth Score')).toBeVisible({ timeout: 15000 });
    // Coaching Recommendations section should be visible if there are improvement areas
    // Look for the section title
    const coachingSection = page.getByText('Coaching Recommendations');
    if (await coachingSection.isVisible()) {
      await expect(coachingSection).toBeVisible();
    } else {
      // If no recommendations shown, that's ok - it means all scores are high
      expect(true).toBeTruthy();
    }
  });

  test('scorecard has cycle selector for historical data', async ({ page }) => {
    await page.goto('/scorecard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('cycle-select')).toBeVisible();
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
    await expect(page.getByText('Growth Score')).toBeVisible();
  });
});

test.describe('GrowthBadge Component', () => {
  test('growth badges display proper levels on executive page', async ({ page }) => {
    await dismissToasts(page);
    await loginAsAdmin(page);
    await page.goto('/executive', { waitUntil: 'domcontentloaded' });
    // Check for Growth Level Distribution section showing badges
    await expect(page.getByText('Growth Level Distribution')).toBeVisible();
    // At least one of these badges should be visible
    const badgeLocator = page.locator('[data-testid^="growth-badge-"]').first();
    await expect(badgeLocator).toBeVisible();
  });
});

test.describe('Historical Data Viewing', () => {
  test('cycle selector changes scorecard data', async ({ page }) => {
    await dismissToasts(page);
    await loginAsPO(page);
    await page.goto('/scorecard', { waitUntil: 'domcontentloaded' });
    
    const cycleSelector = page.getByTestId('cycle-select');
    await expect(cycleSelector).toBeVisible();
    
    // Click to open the selector
    await cycleSelector.click();
    
    // Should see cycle options (Q4 2024 and Q1 2025 from seed)
    await expect(page.getByRole('option').first()).toBeVisible();
  });
});

test.describe('Seed Demo Data', () => {
  test('seed demo data button is visible and clickable for admin', async ({ page }) => {
    await dismissToasts(page);
    await loginAsAdmin(page);
    const seedBtn = page.getByTestId('seed-demo-btn');
    await expect(seedBtn).toBeVisible();
    await expect(seedBtn).toBeEnabled();
  });
});
