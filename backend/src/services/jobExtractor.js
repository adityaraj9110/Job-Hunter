const fs = require('fs');
const path = require('path');
const { parseJobWithAI, parseJobFromImage } = require('./aiService');

/**
 * Extract job info from a URL using Playwright headless browser
 */
async function extractJobFromURL(url) {
  let browser;
  try {
    const { chromium } = require('playwright');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000); // Let dynamic content load

    // Extract text content from the page
    const content = await page.evaluate(() => {
      // Remove script, style, nav, footer elements
      const elementsToRemove = document.querySelectorAll('script, style, nav, footer, header, iframe');
      elementsToRemove.forEach(el => el.remove());

      // Get main content area or body
      const main = document.querySelector('main, article, [role="main"], .job-description, .job-details, .description')
        || document.body;

      return main.innerText.substring(0, 8000); // Limit to 8K chars
    });

    await browser.close();

    // Parse with AI
    return await parseJobWithAI(content);
  } catch (err) {
    if (browser) await browser.close();
    throw new Error(`Failed to extract job from URL: ${err.message}`);
  }
}

/**
 * Extract job info from a screenshot image (Gemini Vision)
 */
async function extractJobFromScreenshot(imagePath) {
  try {
    return await parseJobFromImage(imagePath);
  } catch (err) {
    throw new Error(`Failed to extract job from screenshot: ${err.message}`);
  }
}

module.exports = { extractJobFromURL, extractJobFromScreenshot };
