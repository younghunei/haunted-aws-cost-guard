import { test, expect } from '@playwright/test';

/**
 * 🏚️ Haunted Mansion E2E Tests
 * Testing the spooky user workflows in our supernatural cost dashboard
 */

test.describe('Haunted Mansion Dashboard 👻', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display mode selection on initial load', async ({ page }) => {
    // 🎃 Check that the mode selection appears
    await expect(page.getByText('Choose Your Haunting Experience')).toBeVisible();
    await expect(page.getByText('Demo Mode')).toBeVisible();
    await expect(page.getByText('AWS Account')).toBeVisible();
  });

  test('should enter demo mode and display haunted mansion', async ({ page }) => {
    // 🦇 Select demo mode
    await page.click('text=Demo Mode');
    
    // 👻 Wait for mansion to load
    await expect(page.locator('[data-testid="haunted-mansion"]')).toBeVisible();
    
    // 🕷️ Check that service rooms are displayed
    await expect(page.locator('[data-testid="service-room"]')).toHaveCount(5); // EC2, S3, RDS, Lambda, Others
    
    // 💀 Verify room labels are visible
    await expect(page.getByText('EC2 Crypt')).toBeVisible();
    await expect(page.getByText('S3 Storage Cellar')).toBeVisible();
    await expect(page.getByText('RDS Database Dungeon')).toBeVisible();
    await expect(page.getByText('Lambda Spirit Chamber')).toBeVisible();
    await expect(page.getByText('Other Services Attic')).toBeVisible();
  });

  test('should open cost detail panel when clicking on a room', async ({ page }) => {
    // 🎃 Enter demo mode
    await page.click('text=Demo Mode');
    await expect(page.locator('[data-testid="haunted-mansion"]')).toBeVisible();
    
    // 🦇 Click on EC2 room
    await page.click('[data-testid="service-room"]:has-text("EC2")');
    
    // 👻 Verify detail panel opens
    await expect(page.locator('[data-testid="cost-detail-panel"]')).toBeVisible();
    await expect(page.getByText('EC2 Crypt Details')).toBeVisible();
    
    // 🕸️ Check cost breakdown elements
    await expect(page.locator('[data-testid="cost-chart"]')).toBeVisible();
    await expect(page.getByText('Regional Breakdown')).toBeVisible();
    await expect(page.getByText('Tag Analysis')).toBeVisible();
  });

  test('should display supernatural entities based on cost levels', async ({ page }) => {
    // 🎃 Enter demo mode
    await page.click('text=Demo Mode');
    await expect(page.locator('[data-testid="haunted-mansion"]')).toBeVisible();
    
    // 👻 Check for different entity types based on cost levels
    const rooms = page.locator('[data-testid="service-room"]');
    
    // 🦇 Verify at least one room has peaceful ghosts (low cost)
    await expect(rooms.locator('[data-entity-type="peaceful_ghost"]')).toHaveCount({ min: 1 });
    
    // 💀 Verify at least one room has agitated spirits (medium cost)
    await expect(rooms.locator('[data-entity-type="agitated_spirit"]')).toHaveCount({ min: 1 });
    
    // 🔥 Check for boss monsters if budget is exceeded
    const bossMonsters = rooms.locator('[data-entity-type="boss_monster"]');
    if (await bossMonsters.count() > 0) {
      await expect(bossMonsters.first()).toBeVisible();
    }
  });

  test('should handle budget management workflow', async ({ page }) => {
    // 🎃 Enter demo mode
    await page.click('text=Demo Mode');
    await expect(page.locator('[data-testid="haunted-mansion"]')).toBeVisible();
    
    // 🦇 Open budget settings
    await page.click('[data-testid="budget-settings-button"]');
    await expect(page.locator('[data-testid="budget-panel"]')).toBeVisible();
    
    // 👻 Modify a budget
    const budgetInput = page.locator('[data-testid="budget-input-ec2"]');
    await budgetInput.fill('1000');
    
    // 💀 Save budget changes
    await page.click('[data-testid="save-budget-button"]');
    
    // 🕷️ Verify budget was saved (check for success message)
    await expect(page.getByText('Budget saved successfully')).toBeVisible();
    
    // 🔥 Close budget panel
    await page.click('[data-testid="close-budget-panel"]');
    await expect(page.locator('[data-testid="budget-panel"]')).not.toBeVisible();
  });

  test('should export mansion state and cost data', async ({ page }) => {
    // 🎃 Enter demo mode
    await page.click('text=Demo Mode');
    await expect(page.locator('[data-testid="haunted-mansion"]')).toBeVisible();
    
    // 🦇 Open export panel
    await page.click('[data-testid="export-button"]');
    await expect(page.locator('[data-testid="export-panel"]')).toBeVisible();
    
    // 👻 Test PDF export
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-pdf-button"]');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('haunted-mansion');
    expect(download.suggestedFilename()).toContain('.pdf');
    
    // 💀 Test JSON export
    const jsonDownloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-json-button"]');
    const jsonDownload = await jsonDownloadPromise;
    expect(jsonDownload.suggestedFilename()).toContain('cost-data');
    expect(jsonDownload.suggestedFilename()).toContain('.json');
  });

  test('should handle AWS mode credential flow', async ({ page }) => {
    // 🎃 Select AWS Account mode
    await page.click('text=AWS Account');
    
    // 🦇 Check credential input form appears
    await expect(page.locator('[data-testid="aws-credentials-form"]')).toBeVisible();
    await expect(page.getByText('AWS Access Key ID')).toBeVisible();
    await expect(page.getByText('AWS Secret Access Key')).toBeVisible();
    await expect(page.getByText('AWS Region')).toBeVisible();
    
    // 👻 Test invalid credentials handling
    await page.fill('[data-testid="access-key-input"]', 'invalid-key');
    await page.fill('[data-testid="secret-key-input"]', 'invalid-secret');
    await page.selectOption('[data-testid="region-select"]', 'us-east-1');
    
    await page.click('[data-testid="validate-credentials-button"]');
    
    // 💀 Verify error message appears
    await expect(page.getByText('Invalid AWS credentials')).toBeVisible();
    
    // 🕷️ Test CSV upload option
    await page.click('[data-testid="csv-upload-tab"]');
    await expect(page.locator('[data-testid="csv-upload-area"]')).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // 🎃 Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 🦇 Enter demo mode
    await page.click('text=Demo Mode');
    await expect(page.locator('[data-testid="haunted-mansion"]')).toBeVisible();
    
    // 👻 Verify mansion adapts to mobile layout
    const mansion = page.locator('[data-testid="haunted-mansion"]');
    await expect(mansion).toHaveCSS('flex-direction', 'column');
    
    // 💀 Test mobile navigation
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // 🕸️ Test room interaction on mobile
    await page.tap('[data-testid="service-room"]:first-child');
    await expect(page.locator('[data-testid="cost-detail-panel"]')).toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // 🎃 Mock network failure
    await page.route('**/api/**', route => route.abort());
    
    // 🦇 Try to enter demo mode
    await page.click('text=Demo Mode');
    
    // 👻 Verify error fallback appears
    await expect(page.locator('[data-testid="mansion-error-fallback"]')).toBeVisible();
    await expect(page.getByText('The mansion spirits are resting')).toBeVisible();
    
    // 💀 Test retry functionality
    await page.unroute('**/api/**');
    await page.click('[data-testid="retry-button"]');
    
    // 🕷️ Verify mansion loads after retry
    await expect(page.locator('[data-testid="haunted-mansion"]')).toBeVisible();
  });

  test('should maintain performance with large datasets', async ({ page }) => {
    // 🎃 Enter demo mode with large dataset
    await page.click('text=Demo Mode');
    await page.selectOption('[data-testid="demo-scenario-select"]', 'large-enterprise');
    
    // 🦇 Measure initial load time
    const startTime = Date.now();
    await expect(page.locator('[data-testid="haunted-mansion"]')).toBeVisible();
    const loadTime = Date.now() - startTime;
    
    // 👻 Verify reasonable load time (under 3 seconds)
    expect(loadTime).toBeLessThan(3000);
    
    // 💀 Test smooth animations
    const room = page.locator('[data-testid="service-room"]').first();
    await room.hover();
    
    // 🕸️ Verify no frame drops during animation
    const animationFrames = await page.evaluate(() => {
      return new Promise(resolve => {
        let frames = 0;
        const startTime = performance.now();
        
        function countFrames() {
          frames++;
          if (performance.now() - startTime < 1000) {
            requestAnimationFrame(countFrames);
          } else {
            resolve(frames);
          }
        }
        requestAnimationFrame(countFrames);
      });
    });
    
    // 🔥 Expect at least 30 FPS
    expect(animationFrames).toBeGreaterThan(30);
  });
});