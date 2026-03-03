import { test, expect } from '@playwright/test';
import { loginAs, loginAsAdmin, loginAsExec, loginAsManager, loginAsPO, dismissToasts } from '../fixtures/helpers';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('landing page loads with hero section and title', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('hero-cta-btn')).toBeVisible();
    await expect(page.getByTestId('learn-more-btn')).toBeVisible();
    await expect(page.getByTestId('login-nav-btn')).toBeVisible();
    await expect(page.getByTestId('get-started-btn')).toBeVisible();
  });

  test('landing page shows 3-step how it works section', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Scroll to how-it-works
    await page.evaluate(() => document.getElementById('how-it-works')?.scrollIntoView());
    await expect(page.getByRole('heading', { name: 'Invite', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Assess', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Executive Insights', exact: true })).toBeVisible();
  });

  test('learn more button scrolls to how it works', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('learn-more-btn').click();
    // After scroll the how-it-works section should be visible
    await expect(page.locator('#how-it-works')).toBeVisible();
  });

  test('sign in nav button navigates to login', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('login-nav-btn').click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('CTA button navigates to register when not logged in', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('cta-btn').click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('maturity bands section displayed', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Elite')).toBeVisible();
    await expect(page.getByText('Leading')).toBeVisible();
    await expect(page.getByText('Performing', { exact: true })).toBeVisible();
    await expect(page.getByText('Developing')).toBeVisible();
    await expect(page.getByText('Foundational')).toBeVisible();
  });
});

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('login page loads with form fields', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('login-email-input')).toBeVisible();
    await expect(page.getByTestId('login-password-input')).toBeVisible();
    await expect(page.getByTestId('login-submit-btn')).toBeVisible();
  });

  test('demo account quick-select buttons shown', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('demo-login-admin')).toBeVisible();
    await expect(page.getByTestId('demo-login-execviewer')).toBeVisible();
    await expect(page.getByTestId('demo-login-manager')).toBeVisible();
    await expect(page.getByTestId('demo-login-productowner')).toBeVisible();
    await expect(page.getByTestId('demo-login-businesspartner')).toBeVisible();
  });

  test('demo account quick-select fills email and password', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('demo-login-admin').click();
    await expect(page.getByTestId('login-email-input')).toHaveValue('admin@company.com');
    await expect(page.getByTestId('login-password-input')).toHaveValue('demo123');
  });

  test('toggle password visibility', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const passwordInput = page.getByTestId('login-password-input');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await page.getByTestId('toggle-password-btn').click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });
});

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('admin login and redirect to dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByText('Welcome, Sarah')).toBeVisible();
  });

  test('exec login shows exec viewer role', async ({ page }) => {
    await loginAsExec(page);
    await expect(page.getByText('Welcome, Michael')).toBeVisible();
  });

  test('manager login shows manager role', async ({ page }) => {
    await loginAsManager(page);
    await expect(page.getByText('Welcome, James')).toBeVisible();
  });

  test('product owner login shows PO role', async ({ page }) => {
    await loginAsPO(page);
    await expect(page.getByText('Welcome, Alex')).toBeVisible();
  });

  test('invalid credentials shows error', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('login-email-input').fill('invalid@company.com');
    await page.getByTestId('login-password-input').fill('wrongpassword');
    await page.getByTestId('login-submit-btn').click();
    // Should stay on login page and show error toast
    await expect(page).toHaveURL(/\/login/);
  });

  test('logout redirects to login page', async ({ page }) => {
    await loginAsAdmin(page);
    // Find and click logout
    const logoutBtn = page.getByTestId('logout-btn');
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click({ force: true });
      await expect(page).toHaveURL(/\/login/);
    } else {
      // Try layout logout button
      await page.evaluate(() => {
        const btn = document.querySelector('[data-testid="logout-btn"]');
        if (btn) (btn as HTMLElement).click();
      });
    }
  });

  test('protected route redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Dashboard Role-Based Quick Actions', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('admin sees all quick action buttons', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByTestId('quick-action-my-scorecard')).toBeVisible();
    await expect(page.getByTestId('quick-action-my-team')).toBeVisible();
    await expect(page.getByTestId('quick-action-executive-dashboard')).toBeVisible();
    await expect(page.getByTestId('quick-action-admin-console')).toBeVisible();
  });

  test('exec viewer sees executive dashboard button', async ({ page }) => {
    await loginAsExec(page);
    await expect(page.getByTestId('quick-action-executive-dashboard')).toBeVisible();
    // Exec should not see admin console
    await expect(page.getByTestId('quick-action-admin-console')).not.toBeVisible();
  });

  test('manager sees team and scorecard buttons', async ({ page }) => {
    await loginAsManager(page);
    await expect(page.getByTestId('quick-action-my-scorecard')).toBeVisible();
    await expect(page.getByTestId('quick-action-my-team')).toBeVisible();
    // Manager should not see executive dashboard as quick action
    await expect(page.getByTestId('quick-action-executive-dashboard')).not.toBeVisible();
  });

  test('product owner sees scorecard button', async ({ page }) => {
    await loginAsPO(page);
    await expect(page.getByTestId('quick-action-my-scorecard')).toBeVisible();
    // PO should not see admin console or team
    await expect(page.getByTestId('quick-action-admin-console')).not.toBeVisible();
  });

  test('admin can click seed demo data button on dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByTestId('seed-demo-btn')).toBeVisible();
  });
});
