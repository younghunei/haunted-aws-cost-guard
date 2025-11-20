import { test, expect } from '@playwright/test';

/**
 * 🎨 Visual Regression Tests
 * Ensuring our haunted mansion maintains its spooky consistency
 */

test.describe('Visual Regression Tests 👻🎨', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('mansion layout consistency - demo mode', async ({ page }) => {
    // 🎃 Enter demo mode
    await page.click('text=Demo Mode');
    await expect(page.locator('[data-testid="haunted-mansion"]')).toBeVisible();
    
    // 🦇 Wait for all animations to settle
    await page.waitForTimeout(2000);
    
    // 👻 Take screenshot of full mansion
    await expect(page.locator('[data-testid="haunted-mansion"]')).toHaveScreenshot('mansion-demo-layout.png');
  });

  test('service room visual states', async ({ page }) => {
    // 🎃 Enter demo mode
    await page.click('text=Demo Mode');
    await expect(page.locator('[data-testid="haunted-mansion"]')).toBeVisible();
    
    // 🦇 Screenshot each service room type
    const rooms = page.locator('[data-testid="service-room"]');
    const roomCount = await rooms.count();
    
    for (let i = 0; i < roomCount; i++) {
      const room = rooms.nth(i);
      const roomName = await room.getAttribute('data-service-name');
      
      // 👻 Hover to activate effects
      await room.hover();
      await page.waitForTimeout(500);
      
      // 💀 Take screenshot of individual room
      await expect(room).toHaveScreenshot(`room-${roomName}-hover.png`);
    }
  });

  test('cost detail panel visual consistency', async ({ page }) => {
    // 🎃 Enter demo mode and open detail panel
    await page.click('text=Demo Mode');
    await expect(page.locator('[data-testid="haunted-mansion"]')).toBeVisible();
    
    // 🦇 Click on EC2 room
    await page.click('[data-testid="service-room"]:has-text("EC2")');
    await expect(page.locator('[data-testid="cost-detail-panel"]')).toBeVisible();
    
    // 👻 Wait for charts to render
    await page.waitForTimeout(1000);
    
    // 💀 Screenshot the detail panel
    await expect(page.locator('[data-testid="cost-detail-panel"]')).toHaveScreenshot('cost-detail-panel.png');
  });

  test('budget management panel visuals', async ({ page }) => {
    // 🎃 Enter demo mode
    await page.click('text=Demo Mode');
    await expect(page.locator('[data-testid="haunted-mansion"]')).toBeVisible();
    
    // 🦇 Open budget settings
    await page.click('[data-testid="budget-settings-button"]');
    await expect(page.locator('[data-testid="budget-panel"]')).toBeVisible();
    
    // 👻 Screenshot budget panel
    await expect(page.locator('[data-testid="budget-panel"]')).toHaveScreenshot('budget-panel.png');
  });

  test('export panel visual consistency', async ({ page }) => {
    // 🎃 Enter demo mode
    await page.click('text=Demo Mode');
    await expect(page.locator('[data-testid="haunted-mansion"]')).toBeVisible();
    
    // 🦇 Open export panel
    await page.click('[data-testid="export-button"]');
    await expect(page.locator('[data-testid="export-panel"]')).toBeVisible();
    
    // 👻 Screenshot export options
    await expect(page.locator('[data-testid="export-panel"]')).toHaveScreenshot('export-panel.png');
  });

  test('error states visual consistency', async ({ page }) => {
    // 🎃 Mock network failure
    await page.route('**/api/**', route => route.abort());
    
    // 🦇 Try to enter demo mode
    await page.click('text=Demo Mode');
    
    // 👻 Screenshot error fallback
    await expect(page.locator('[data-testid="mansion-error-fallback"]')).toBeVisible();
    await expect(page.locator('[data-testid="mansion-error-fallback"]')).toHaveScreenshot('error-fallback.png');
  });

  test('mobile layout visual consistency', async ({ page }) => {
    // 🎃 Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 🦇 Enter demo mode
    await page.click('text=Demo Mode');
    await expect(page.locator('[data-testid="haunted-mansion"]')).toBeVisible();
    
    // 👻 Screenshot mobile layout
    await expect(page).toHaveScreenshot('mobile-mansion-layout.png');
    
    // 💀 Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // 🕸️ Screenshot mobile menu
    await expect(page).toHaveScreenshot('mobile-menu.png');
  });

  test('dark theme visual consistency', async ({ page }) => {
    // 🎃 Set dark theme preference
    await page.emulateMedia({ colorScheme: 'dark' });
    
    // 🦇 Enter demo mode
    await page.click('text=Demo Mode');
    await expect(page.locator('[data-testid="haunted-mansion"]')).toBeVisible();
    
    // 👻 Screenshot dark theme mansion
    await expect(page.locator('[data-testid="haunted-mansion"]')).toHaveScreenshot('mansion-dark-theme.png');
  });

  test('animation states visual consistency', async ({ page }) => {
    // 🎃 Enter demo mode
    await page.click('text=Demo Mode');
    await expect(page.locator('[data-testid="haunted-mansion"]')).toBeVisible();
    
    // 🦇 Find a room with boss monster (high cost)
    const bossRoom = page.locator('[data-testid="service-room"][data-entity-type="boss_monster"]').first();
    
    if (await bossRoom.count() > 0) {
      // 👻 Hover to trigger intense animation
      await bossRoom.hover();
      await page.waitForTimeout(1000);
      
      // 💀 Screenshot intense animation state
      await expect(bossRoom).toHaveScreenshot('boss-monster-animation.png');
    }
    
    // 🕷️ Test peaceful ghost animation
    const ghostRoom = page.locator('[data-testid="service-room"][data-entity-type="peaceful_ghost"]').first();
    
    if (await ghostRoom.count() > 0) {
      await ghostRoom.hover();
      await page.waitForTimeout(500);
      
      // 🔥 Screenshot peaceful animation
      await expect(ghostRoom).toHaveScreenshot('peaceful-ghost-animation.png');
    }
  });

  test('loading states visual consistency', async ({ page }) => {
    // 🎃 Slow down network to capture loading states
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });
    
    // 🦇 Enter demo mode
    await page.click('text=Demo Mode');
    
    // 👻 Screenshot loading state
    await expect(page.locator('[data-testid="loading-mansion"]')).toHaveScreenshot('loading-state.png');
    
    // 💀 Wait for full load
    await expect(page.locator('[data-testid="haunted-mansion"]')).toBeVisible();
  });

  test('accessibility visual indicators', async ({ page }) => {
    // 🎃 Enable high contrast mode
    await page.emulateMedia({ forcedColors: 'active' });
    
    // 🦇 Enter demo mode
    await page.click('text=Demo Mode');
    await expect(page.locator('[data-testid="haunted-mansion"]')).toBeVisible();
    
    // 👻 Screenshot high contrast mode
    await expect(page.locator('[data-testid="haunted-mansion"]')).toHaveScreenshot('high-contrast-mode.png');
    
    // 💀 Test focus indicators
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // 🕸️ Screenshot focus states
    await expect(page).toHaveScreenshot('focus-indicators.png');
  });
});