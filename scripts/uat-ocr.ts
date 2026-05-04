
import vision from '@google-cloud/vision';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

async function testOCR() {
  const imagePath = '/Users/samwong33/.openclaw/media/inbound/file_8---8880b44d-89fa-4632-b23f-91a0ebf98d55.jpg';
  
  console.log('--- OCR Local UAT ---');
  console.log('Image:', imagePath);

  try {
    const client = new vision.ImageAnnotatorClient({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
    });

    const content = fs.readFileSync(imagePath);
    const [result] = await client.documentTextDetection({ image: { content } });
    const fullText = result.fullTextAnnotation?.text || '';
    const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    const items: { name: string; price: number }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const priceMatch = line.match(/(\d{1,3}(?:,\d{3})+|\d{3,})\s*(?=円|税込|$)/);
      
      if (priceMatch) {
        const price = parseFloat(priceMatch[1].replace(/,/g, ''));
        if (price === 283) continue;

        let name = "";
        for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
          const prevLine = lines[j];
          if (prevLine.match(/[^\d\s\-\,]{3,}/) && !/商品名|価格|備考|品番|數量|削除/.test(prevLine)) {
            name = prevLine;
            if (j > 0 && lines[j-1].match(/[^\d\s\-\,]{3,}/) && !/商品名|價格|備考|品番|數量|削除/.test(lines[j-1])) {
              name = lines[j-1] + " " + name;
            }
            break;
          }
        }

        if (name && !/合計|小計|送料|消費税|税込|手数料/.test(name)) {
          items.push({ name, price });
        }
      }
    }

    console.log('\n--- UAT Result (Detected Items) ---');
    console.table(items);
    console.log('\nTotal Items:', items.length);
    console.log('Total Amount:', items.reduce((s, i) => s + i.price, 0), '円');

  } catch (error) {
    console.error('FAILED:', error);
  }
}

testOCR();
