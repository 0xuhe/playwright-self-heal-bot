import { test, expect } from '@playwright/test';

const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;

async function notifySlackForDevin(taskName: string, error: Error, ariaSnapshot: string) {
  if (!SLACK_WEBHOOK) return;
  await fetch(SLACK_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `[Workflow Broken] Task: ${taskName}\nError: ${error.message}\n@devin-bot please inspect the latest ARIA snapshot and open a selector fix PR.`,
      blocks: [{ type: 'section', text: { type: 'mrkdwn', text: '```' + ariaSnapshot.slice(0, 1500) + '```' } }],
    }),
  });
}

test('sync product pricing and export table', async ({ page }) => {
  const targetUrl = process.env.TARGET_URL || 'https://books.toscrape.com/';
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

  try {
    // Primary semantic / role locator
    const priceItems = page.locator('article.product_pod .price_color');
    await expect(priceItems.first()).toBeVisible({ timeout: 8000 });
  } catch (err: any) {
    // Capture semantic accessibility snapshot for Devin Bot repair
    const ariaSnapshot = await page.locator('body').ariaSnapshot();
    await notifySlackForDevin('pricing-sync', err, ariaSnapshot);
    throw err;
  }
});
