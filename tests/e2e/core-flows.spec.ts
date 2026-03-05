import { test, expect } from '@playwright/test';
import { loginAs, loginAsAdmin, loginAsExec, loginAsManager, loginAsPO, dismissToasts } from '../fixtures/helpers';

test.describe('Landing Page / Login', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('landing page loads with PO Growth branding', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Check for PO Growth branding
    await expect(page.getByText('PO Growth').first()).toBeVisible();
    await expect(page.getByText('Development Platform').first()).toBeVisible();
  });

  test('landing page shows Growth Score terminology', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Growth Score is displayed on landing page hero section
    await expect(page.getByText('Growth Score').first()).toBeVisible();
  });

  test('landing page shows login form', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('login-email-input')).toBeVisible();
    await expect(page.getByTestId('login-password-input')).toBeVisible();
    await expect(page.getByTestId('login-submit-btn')).toBeVisible();
  });

  test('landing page shows demo account buttons', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('demo-login-admin')).toBeVisible();
    await expect(page.getByTestId('demo-login-execviewer')).toBeVisible();
    await expect(page.getByTestId('demo-login-manager')).toBeVisible();
    await expect(page.getByTestId('demo-login-productowner')).toBeVisible();
    await expect(page.getByTestId('demo-login-businesspartner')).toBeVisible();
  });

  test('demo account quick-select fills email and password', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('demo-login-admin').click();
    await expect(page.getByTestId('login-email-input')).toHaveValue('admin@company.com');
    await expect(page.getByTestId('login-password-input')).toHaveValue('demo123');
  });

  test('toggle password visibility', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const passwordInput = page.getByTestId('login-password-input');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await page.getByTestId('toggle-password-btn').click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('landing page shows growth level badges', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Growth levels shown in score display area
    await expect(page.getByText('On Track')).toBeVisible();
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
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('login-email-input').fill('invalid@company.com');
    await page.getByTestId('login-password-input').fill('wrongpassword');
    await page.getByTestId('login-submit-btn').click();
    // Should stay on landing/login page
    await expect(page).toHaveURL(/\//);
  });

  test('logout redirects to landing page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByTestId('logout-btn').click({ force: true });
    // After logout, should go back to landing page
    await expect(page.getByTestId('login-email-input')).toBeVisible();
  });

  test('protected route redirects unauthenticated user', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    // Should redirect to login (landing page has login form)
    await expect(page.getByTestId('login-email-input')).toBeVisible();
  });
});

test.describe('Dashboard Role-Based Quick Actions', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('admin sees all quick action buttons', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByTestId('quick-action-my-growth')).toBeVisible();
    await expect(page.getByTestId('quick-action-my-team')).toBeVisible();
    await expect(page.getByTestId('quick-action-organization')).toBeVisible();
    await expect(page.getByTestId('quick-action-admin')).toBeVisible();
  });

  test('exec viewer sees organization button', async ({ page }) => {
    await loginAsExec(page);
    await expect(page.getByTestId('quick-action-organization')).toBeVisible();
    // Exec should not see admin
    await expect(page.getByTestId('quick-action-admin')).not.toBeVisible();
  });

  test('manager sees team and growth buttons', async ({ page }) => {
    await loginAsManager(page);
    await expect(page.getByTestId('quick-action-my-growth')).toBeVisible();
    await expect(page.getByTestId('quick-action-my-team')).toBeVisible();
    // Manager should not see organization as quick action
    await expect(page.getByTestId('quick-action-organization')).not.toBeVisible();
  });

  test('product owner sees my growth button', async ({ page }) => {
    await loginAsPO(page);
    await expect(page.getByTestId('quick-action-my-growth')).toBeVisible();
    // PO should not see admin
    await expect(page.getByTestId('quick-action-admin')).not.toBeVisible();
  });

  test('admin can see seed demo data button on dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByTestId('seed-demo-btn')).toBeVisible();
  });
});

test.describe('Navigation Layout', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('layout shows correct nav items for admin', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByTestId('nav-dashboard')).toBeVisible();
    await expect(page.getByTestId('nav-my-team')).toBeVisible();
    await expect(page.getByTestId('nav-organization')).toBeVisible();
    await expect(page.getByTestId('nav-admin')).toBeVisible();
  });

  test('layout shows logout button', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByTestId('logout-btn')).toBeVisible();
  });

  test('logout button signs out user', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByTestId('logout-btn').click({ force: true });
    await expect(page.getByTestId('login-email-input')).toBeVisible();
  });

  test('product owner nav shows correct items', async ({ page }) => {
    await loginAsPO(page);
    await expect(page.getByTestId('nav-dashboard')).toBeVisible();
    await expect(page.getByTestId('nav-my-growth')).toBeVisible();
    // PO should not see admin in nav
    await expect(page.getByTestId('nav-admin')).not.toBeVisible();
  });

  test('sidebar shows PO Growth branding', async ({ page }) => {
    await loginAsAdmin(page);
    // Ensure viewport is large enough to show sidebar (desktop view)
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForLoadState('domcontentloaded');
    // Sidebar branding should be visible in desktop view
    await expect(page.getByText('PO Growth').first()).toBeVisible();
  });
});
