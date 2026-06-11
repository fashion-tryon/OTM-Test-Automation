import { Page } from '@playwright/test';
import { allure } from 'allure-playwright';

/**
 * Waits for an Oracle JET page to fully load.
 * Waits for network idle and for oj- components to finish initialising.
 */
export async function waitForJETPage(page: Page): Promise<void> {
  await allure.step('Wait for JET page to load', async () => {
    // Wait for network to settle
    await page.waitForLoadState('networkidle', { timeout: 60000 });

    // Wait until at least one oj- component is present in the DOM
    await page.waitForFunction(
      () => document.querySelector('[class*="oj-"]') !== null,
      { timeout: 30000 }
    );

    // Wait until JET component busy context resolves (if oj.Context is available)
    await page.waitForFunction(() => {
      const win = window as any;
      if (win.oj && win.oj.Context && win.oj.Context.getPageContext) {
        const ctx = win.oj.Context.getPageContext().getBusyContext();
        return ctx ? ctx.isReady() : true;
      }
      return true;
    }, { timeout: 30000 }).catch(() => {
      // oj.Context not available on this page — continue anyway
    });
  });
}

/**
 * Waits for a JET element to be visible and clicks it safely.
 */
export async function jetClick(page: Page, selector: string): Promise<void> {
  await allure.step('Click: ' + selector, async () => {
    const locator = page.locator(selector).first();
    await locator.waitFor({ state: 'visible', timeout: 30000 });
    // Small settle delay for JET animations
    await page.waitForTimeout(300);
    await locator.click();
  });
}

/**
 * Clears and fills a JET input field.
 * Handles both native <input> and oj-input wrapper components.
 */
export async function jetFill(page: Page, selector: string, value: string): Promise<void> {
  await allure.step('Fill "' + selector + '" with value', async () => {
    const locator = page.locator(selector).first();
    await locator.waitFor({ state: 'visible', timeout: 30000 });
    await locator.click();
    // Triple-click to select all existing text then overwrite
    await locator.click({ clickCount: 3 });
    await locator.fill(value);
    // Tab away to trigger JET validation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
  });
}

/**
 * Selects a value from an oj-select or oj-select-single dropdown.
 */
export async function jetSelectDropdown(page: Page, selector: string, value: string): Promise<void> {
  await allure.step('Select "' + value + '" from dropdown: ' + selector, async () => {
    const trigger = page.locator(selector).first();
    await trigger.waitFor({ state: 'visible', timeout: 30000 });
    await trigger.click();

    // Wait for the dropdown list to appear
    await page.waitForSelector('.oj-listbox-result, .oj-select-results, [role="option"]', {
      state: 'visible',
      timeout: 10000,
    });

    // Click the option matching the value text
    await page.locator('[role="option"]').filter({ hasText: value }).first().click();
    await page.waitForTimeout(300);
  });
}

/**
 * Waits for an OTM modal popup to become visible.
 */
export async function waitForPopup(page: Page): Promise<void> {
  await allure.step('Wait for OTM popup', async () => {
    await page.waitForSelector(
      '.oj-dialog, .oj-popup, [role="dialog"]',
      { state: 'visible', timeout: 30000 }
    );
    await page.waitForTimeout(500);
  });
}

/**
 * Closes the currently visible OTM modal popup.
 */
export async function closePopup(page: Page): Promise<void> {
  await allure.step('Close OTM popup', async () => {
    // Try the close button first, then the Cancel button, then Escape key
    const closeBtn = page.locator(
      '.oj-dialog-header-close, .oj-popup-close, button[title="Close"], button:has-text("Cancel")'
    ).first();

    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }

    // Wait for popup to disappear
    await page.waitForSelector(
      '.oj-dialog, .oj-popup, [role="dialog"]',
      { state: 'hidden', timeout: 10000 }
    ).catch(() => {});
  });
}

/**
 * Takes a named screenshot and attaches it to the current Allure report step.
 */
export async function takeStepScreenshot(page: Page, stepName: string): Promise<void> {
  await allure.step('Screenshot: ' + stepName, async () => {
    const buffer = await page.screenshot({ fullPage: false });
    await allure.attachment(stepName, buffer, 'image/png');
  });
}
