const screenshot = require('screenshot-desktop');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

const TEMP_DIR = path.join(app.getPath('temp'), 'ai-agent');

// Ensure temp dir exists
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

const OUTPUT_PATH = path.join(TEMP_DIR, 'current.png');
const PROCESSED_PATH = path.join(TEMP_DIR, 'processed.png');

/**
 * Capture the screen.
 * @param {string} mode - 'fullscreen' | 'clipboard'
 * @returns {string} path to captured image
 */
async function captureScreen(mode = 'fullscreen') {
  if (mode === 'clipboard') {
    return captureFromClipboard();
  }
  return captureFullscreen();
}

async function captureFullscreen() {
  const imgBuffer = await screenshot({ format: 'png' });
  fs.writeFileSync(OUTPUT_PATH, imgBuffer);
  await preprocessImage(OUTPUT_PATH, PROCESSED_PATH);
  return PROCESSED_PATH;
}

async function captureFromClipboard() {
  const { clipboard, nativeImage } = require('electron');
  const img = clipboard.readImage();
  if (img.isEmpty()) throw new Error('No image in clipboard');
  const buffer = img.toPNG();
  fs.writeFileSync(OUTPUT_PATH, buffer);
  await preprocessImage(OUTPUT_PATH, PROCESSED_PATH);
  return PROCESSED_PATH;
}

/**
 * Preprocess image for better OCR results:
 * - Resize to max 1920px width (preserving aspect ratio)
 * - Convert to grayscale
 * - Increase contrast
 */
async function preprocessImage(inputPath, outputPath) {
  await sharp(inputPath)
    .resize({ width: 1920, withoutEnlargement: true })
    .grayscale()
    .normalise()
    .png({ quality: 90 })
    .toFile(outputPath);
  return outputPath;
}

module.exports = { captureScreen, preprocessImage };
