/**
 * Font setup script for deployment
 * Downloads and validates Hebrew fonts for PDF generation
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, '..', 'src', 'fonts');
const distFontsDir = path.join(__dirname, '..', 'dist', 'fonts');

// Google Fonts API - Heebo font (open source, supports Hebrew)
const HEEBO_REGULAR_URL = 'https://fonts.gstatic.com/s/heebo/v26/NGSpv5_NC0k9P_v6ZUCbLRAHxK1EiS2cckOnz02SXQ.ttf';
const HEEBO_BOLD_URL = 'https://fonts.gstatic.com/s/heebo/v26/NGSpv5_NC0k9P_v6ZUCbLRAHxK1E1yqcckOnz02SXQ.ttf';

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${path.basename(dest)}...`);
    const file = fs.createWriteStream(dest);

    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        reject(new Error(`HTTP ${response.statusCode} for ${url}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(dest);
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
  });
}

function validateTTF(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 4) return false;
  const header = buffer.slice(0, 4);
  // Valid TTF signatures: 0x00010000 or 'OTTO' for OpenType
  return (header[0] === 0x00 && header[1] === 0x01 && header[2] === 0x00 && header[3] === 0x00) ||
         header.toString() === 'OTTO' ||
         header.toString() === 'true';
}

async function main() {
  console.log('=== Font Setup Script ===\n');

  // Ensure directories exist
  if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
  }
  if (!fs.existsSync(distFontsDir)) {
    fs.mkdirSync(distFontsDir, { recursive: true });
  }

  const regularPath = path.join(fontsDir, 'Arial-Hebrew.ttf');
  const boldPath = path.join(fontsDir, 'Arial-Hebrew-Bold.ttf');

  // Check if we already have valid fonts
  const hasValidRegular = validateTTF(regularPath);
  const hasValidBold = validateTTF(boldPath);

  if (hasValidRegular && hasValidBold) {
    console.log('Valid Hebrew fonts already exist in src/fonts');
  } else {
    console.log('Downloading Heebo fonts from Google Fonts...');

    // Download Heebo fonts and save as Arial-Hebrew (so we don't need to change pdf.ts)
    try {
      await downloadFile(HEEBO_REGULAR_URL, regularPath);
      console.log(`Downloaded Heebo Regular -> ${regularPath}`);

      await downloadFile(HEEBO_BOLD_URL, boldPath);
      console.log(`Downloaded Heebo Bold -> ${boldPath}`);

      // Validate
      if (!validateTTF(regularPath)) {
        console.error('ERROR: Downloaded regular font is invalid');
        process.exit(1);
      }
      if (!validateTTF(boldPath)) {
        console.error('ERROR: Downloaded bold font is invalid');
        process.exit(1);
      }
      console.log('Fonts validated successfully');
    } catch (err) {
      console.error('Failed to download fonts:', err.message);
      process.exit(1);
    }
  }

  // Copy to dist/fonts
  console.log('\nCopying fonts to dist/fonts...');
  const srcFonts = fs.readdirSync(fontsDir).filter(f => f.endsWith('.ttf'));
  for (const font of srcFonts) {
    const srcPath = path.join(fontsDir, font);
    const destPath = path.join(distFontsDir, font);
    if (validateTTF(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${font}`);
    } else {
      console.log(`Skipped invalid font: ${font}`);
    }
  }

  console.log('\n=== Font Setup Complete ===');
}

main().catch(err => {
  console.error('Font setup failed:', err);
  process.exit(1);
});
