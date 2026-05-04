
import vision from '@google-cloud/vision';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

async function testOCR() {
  const imagePath = '/Users/samwong33/.openclaw/media/inbound/file_5---19c1b5b2-cef6-4a33-99f3-b396a830c649.jpg';
  
  console.log('--- OCR Local Test ---');
  console.log('Image:', imagePath);
  console.log('Client Email:', process.env.GOOGLE_CLIENT_EMAIL);

  try {
    const client = new vision.ImageAnnotatorClient({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
    });

    const content = fs.readFileSync(imagePath);

    console.log('Calling Google Cloud Vision API...');
    const [result] = await client.documentTextDetection({
      image: { content },
    });

    const fullText = result.fullTextAnnotation?.text || '';
    console.log('Raw Text found:', fullText.substring(0, 100) + '...');

    console.log('\n--- Smart Parsing ---');
    const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const smartItems: { name: string; price: number }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Price pattern: e.g. "1,760円" or "900" (if it looks like a price)
      const priceMatch = line.match(/(\d{1,3}(?:,\d{3})+|\d{3,})\s*(?=円|税込|$)/);
      
      if (priceMatch) {
        const price = parseFloat(priceMatch[1].replace(/,/g, ''));
        if (price === 283) continue; // Noise

        // Look backwards for the name. 
        // We skip lines that are just numbers (Qty) or SKU-like
        let name = "";
        for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
          const prevLine = lines[j];
          if (prevLine.match(/[^\d\s\-\,]{3,}/)) { // Contains at least 3 non-digit characters
            name = prevLine;
            // If the line before that also looks like name, prepend it
            if (j > 0 && lines[j-1].match(/[^\d\s\-\,]{3,}/) && !lines[j-1].includes('商品名') && !lines[j-1].includes('価格')) {
              name = lines[j-1] + " " + name;
            }
            break;
          }
        }

        if (name && !/合計|小計|送料|消費税|税込|手数料/.test(name)) {
          smartItems.push({ name, price });
        }
      }
    }
    console.table(smartItems);

  } catch (error) {
    console.error('FAILED:', error);
  }
}

testOCR();
