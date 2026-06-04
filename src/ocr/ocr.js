const Tesseract = require('tesseract.js');
const path = require('path');
const { app } = require('electron');

// Cache the worker to avoid re-init on each call
let _worker = null;

async function getWorker() {
  if (_worker) return _worker;

  _worker = await Tesseract.createWorker('eng', 1, {
    cachePath: path.join(app.getPath('userData'), 'tesseract-cache'),
    logger: () => {}, // silence progress logs in production
  });

  await _worker.setParameters({
    tessedit_pageseg_mode: Tesseract.PSM.AUTO,
    preserve_interword_spaces: '1',
  });

  return _worker;
}

/**
 * Extract text from an image file.
 * @param {string} imagePath - absolute path to image
 * @returns {string} cleaned OCR text
 */
async function extractText(imagePath) {
  const worker = await getWorker();
  const { data: { text } } = await worker.recognize(imagePath);
  return cleanText(text);
}

/**
 * Clean up common OCR artifacts.
 */
function cleanText(raw) {
  return raw
    .replace(/\f/g, '\n')           // form feed → newline
    .replace(/[ \t]+/g, ' ')        // multiple spaces → single
    .replace(/\n{3,}/g, '\n\n')     // 3+ newlines → 2
    .replace(/[^\x20-\x7E\n]/g, '') // strip non-ASCII (optional: remove for multilang)
    .trim();
}

// Gracefully terminate the worker on exit
process.on('exit', async () => {
  if (_worker) await _worker.terminate().catch(() => {});
});

module.exports = { extractText };
