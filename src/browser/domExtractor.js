const { chromium, firefox, webkit } = require('playwright');
const { execSync } = require('child_process');

let _browser = null;
let _context = null;

/**
 * Try to find and connect to an already-running Chrome/Edge/Brave instance.
 */
async function connectToExistingBrowser() {
  const ports = [9222, 9223, 9224]; // Common CDP ports
  const browsers = ['chrome', 'msedge', 'brave'];

  for (const port of ports) {
    try {
      console.log(`Trying to connect to browser on port ${port}...`);
      const wsEndpoint = await chromium.connectOverCDP(`http://localhost:${port}`);
      console.log(`✓ Connected to browser on port ${port}`);
      return wsEndpoint;
    } catch (e) {
      // Port not available, try next
    }
  }

  return null;
}

/**
 * Connect to existing Chromium browser instance.
 * Tries to connect to an already-running browser (e.g., Chrome, Edge, Brave).
 * If no browser is running, falls back to using Playwright's built-in browser.
 */
async function getBrowser() {
  if (_browser) return _browser;

  // Try to connect to existing browser first
  const existingBrowser = await connectToExistingBrowser();
  if (existingBrowser) {
    _browser = existingBrowser;
    return _browser;
  }

  // Fallback: use Playwright's bundled Chromium
  console.log('No existing browser found. Using Playwright browser for extraction.');
  _browser = await chromium.launch({ headless: true });
  return _browser;
}

/**
 * Get the default context (all tabs/pages).
 */
async function getContext() {
  const browser = await getBrowser();
  if (_context) return _context;
  
  // If connected via CDP to real browser, get its contexts
  if (browser.contexts && typeof browser.contexts === 'function') {
    try {
      const contexts = await browser.contexts();
      _context = contexts[0] || (await browser.createContext());
    } catch (e) {
      // If contexts() fails, create a new one
      _context = await browser.createContext();
    }
  } else {
    // For launched browsers, create context
    _context = await browser.createContext();
  }
  
  return _context;
}

/**
 * Get the currently active browser page/tab.
 * Returns the most recently accessed page.
 */
async function getActivePage() {
  const context = await getContext();
  const pages = context.pages();
  
  if (pages.length === 0) {
    // No pages found - try navigating to a default page
    console.log('No pages found, creating new page...');
    const page = await context.newPage();
    await page.goto('about:blank');
    return page;
  }

  // Return the last accessed page (most likely the active one)
  return pages[pages.length - 1] || pages[0];
}

/**
 * Extract text and relevant DOM structure from active browser tab.
 * Focuses on main content (removes scripts, styles, etc).
 * @returns {Object} { url, title, text, html }
 */
async function extractFromActiveBrowser() {
  try {
    const page = await getActivePage();
    
    // Wait a moment for page to stabilize
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    
    const url = page.url();
    const title = await page.title();

    // Extract text content and clean structure
    const { text, html } = await page.evaluate(() => {
      // Remove script, style, meta tags
      const unwantedSelectors = 'script, style, meta, link, noscript, svg';
      document.querySelectorAll(unwantedSelectors).forEach(el => {
        try { el.remove(); } catch (e) {}
      });

      // Get main content area (common patterns)
      let content = null;
      const mainSelectors = [
        'main', 
        '[role="main"]', 
        'article', 
        '.content', 
        '#content',
        '.container',
        '.page-content'
      ];
      
      for (const selector of mainSelectors) {
        try {
          content = document.querySelector(selector);
          if (content) break;
        } catch (e) {}
      }

      // Fallback to body
      if (!content) content = document.body;

      // Extract plain text with proper spacing
      const text = (content.innerText || content.textContent || '')
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();

      // Extract HTML for code blocks, etc
      const html = content.innerHTML || '';

      return { text, html };
    }).catch(e => {
      console.warn('Page evaluation error:', e.message);
      return { text: 'Could not extract page content', html: '' };
    });

    const result = {
      url,
      title,
      text: text.slice(0, 8000), // Limit to 8000 chars
      html: html.slice(0, 2000), // Some HTML structure
    };

    console.log(`✓ Extracted from: ${title} (${text.length} chars)`);
    return result;
  } catch (e) {
    throw new Error(`Failed to extract browser content: ${e.message}`);
  }
}

/**
 * Extract only readable text from active browser (best for LLM).
 */
async function extractTextOnly() {
  const data = await extractFromActiveBrowser();
  return `Page: ${data.title}\nURL: ${data.url}\n\n${data.text}`;
}

/**
 * Close browser connection gracefully.
 */
async function cleanup() {
  if (_browser) {
    try {
      if (_browser.close) await _browser.close();
    } catch (e) {
      console.log('Browser already closed:', e.message);
    }
    _browser = null;
    _context = null;
  }
}

process.on('exit', cleanup);

module.exports = {
  extractFromActiveBrowser,
  extractTextOnly,
  getActivePage,
  cleanup,
};
