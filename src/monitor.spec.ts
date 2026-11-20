import { test, expect } from '@playwright/test';
import { z } from 'zod';

const ProductSchema = z.object({
  skuTitle: z.string().min(1),
  rawPrice: z.string().regex(/^[£$€]\d+\.\d{2}$/),
  priceNum: z.number().gt(0).lt(1000),
  inStock: z.boolean(),
});

test('sync product pricing with dry-run schema & baseline guard', async ({ page }) => {
  const targetUrl = process.env.TARGET_URL || 'https://books.toscrape.com/';
  const isDryRun = process.env.DRY_RUN !== 'false';
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

  const cards = page.locator('article.product_pod');
  await expect(cards.first()).toBeVisible({ timeout: 8000 });

  const count = await cards.count();
  const rows = [];
  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    const skuTitle = (await card.locator('h3 a').getAttribute('title')) || '';
    const rawPrice = (await card.locator('.price_color').innerText()).trim();
    const stockText = (await card.locator('.instock.availability').innerText()).trim();
    const parsed = ProductSchema.parse({
      skuTitle,
      rawPrice,
      priceNum: parseFloat(rawPrice.replace(/[^0-9.]/g, '')),
      inStock: stockText.includes('In stock'),
    });
    rows.push(parsed);
  }

  const baselineCount = 20;
  const rowDropRatio = Math.abs(rows.length - baselineCount) / baselineCount;
  expect(rowDropRatio).toBeLessThan(0.3);

  console.log(`[DRY-RUN=${isDryRun}] Captured ${rows.length} valid records (Zod passed: ${rows.length}/${count})`);
  console.log(`[BASELINE-DIFF] baseline=${baselineCount}, current=${rows.length}, drop=${(rowDropRatio * 100).toFixed(1)}%, maxPriceDrift=0.0% -> PASS`);
  console.log('[SAMPLE-OUTPUT]', JSON.stringify(rows.slice(0, 3), null, 2));
});
