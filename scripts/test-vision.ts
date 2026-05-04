
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

    const detectedItems: { name: string; price: number }[] = [];
    const pages = result.fullTextAnnotation?.pages || [];

    if (pages.length > 0) {
      for (const page of pages) {
        for (const block of page.blocks || []) {
          for (const paragraph of block.paragraphs || []) {
            const lineText = paragraph.words?.map(w => w.symbols?.map(s => s.text).join('')).join(' ') || '';
            const priceMatch = lineText.match(/(\d{1,3}(?:,\d{3})+|\d{3,})\s*(?=円|税込|元|\s|$)/);
            if (priceMatch) {
              const price = parseFloat(priceMatch[1].replace(/,/g, ''));
              let name = lineText.split(priceMatch[0])[0].trim();
              name = name.replace(/^[\s・\-\>]+/, '').trim();
              const isExcluded = /合計|小計|送料|消費税|税込|消費|手数料|ポイント/.test(name);
              if (name && name.length > 2 && !isNaN(price) && !isExcluded) {
                detectedItems.push({ name, price });
              }
            }
          }
        }
      }
    }

    console.log('\n--- Detected Items ---');
    console.table(detectedItems);

  } catch (error) {
    console.error('FAILED:', error);
  }
}

testOCR();
