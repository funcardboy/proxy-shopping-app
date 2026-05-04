import vision from '@google-cloud/vision';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testOCR() {
  const imagePath = '/Users/samwong33/.openclaw/media/inbound/image-45---26d11ca3-0d93-4e30-9542-af495361385d.png';
  
  const client = new vision.ImageAnnotatorClient({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
  });

  const content = fs.readFileSync(imagePath);

  console.log('Sending request to Google Cloud Vision API...');
  const [result] = await client.documentTextDetection({
    image: { content },
  });
  
  const fullText = result.fullTextAnnotation?.text || '';
  const pages = result.fullTextAnnotation?.pages || [];
  
  const detectedItems: { name: string; price: number }[] = [];

  if (pages.length > 0) {
    for (const page of pages) {
      for (const block of page.blocks || []) {
        for (const paragraph of block.paragraphs || []) {
          const lineText = paragraph.words?.map(w => w.symbols?.map(s => s.text).join('')).join(' ') || '';
          
          // Use the same regex as in the route.ts
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

  if (detectedItems.length === 0) {
    const lines = fullText.split('\n');
    for (const line of lines) {
      const priceMatch = line.match(/(\d{1,3}(?:,\d{3})+|\d{3,})\s*(?=円|税込|元|\s|$)/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1].replace(/,/g, ''));
        let name = line.split(priceMatch[0])[0].trim();
        name = name.replace(/^[\s・\-\>]+/, '').trim();
        const isExcluded = /合計|小計|送料|消費税|税込|消費|手数料|ポイント/.test(name);
        if (name && name.length > 2 && !isNaN(price) && !isExcluded) {
          detectedItems.push({ name, price });
        }
      }
    }
  }

  const uniqueItems = detectedItems.filter((item, index, self) =>
    index === self.findIndex((t) => (
      t.name === item.name && t.price === item.price
    ))
  );

  console.log(`Detected ${uniqueItems.length} items:`);
  uniqueItems.forEach((item, i) => {
    console.log(`${i + 1}. ${item.name} - ${item.price}円`);
  });

  if (uniqueItems.length === 18) {
    console.log('SUCCESS: All 18 items detected!');
  } else {
    console.log(`WARNING: Detected ${uniqueItems.length}/18 items.`);
  }
}

testOCR().catch(console.error);
