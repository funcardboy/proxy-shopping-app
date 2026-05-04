import { NextResponse } from 'next/server';
import vision from '@google-cloud/vision';

export async function POST(request: Request) {
  try {
    const { imageBase64 } = await request.json();
    
    if (!imageBase64) {
      return NextResponse.json({ error: 'No image data' }, { status: 400 });
    }

    const client = new vision.ImageAnnotatorClient({
      projectId: process.env.GOOGLE_PROJECT_ID,
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
    });

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const content = Buffer.from(base64Data, 'base64');

    const [result] = await client.documentTextDetection({
      image: { content },
    });
    
    const fullText = result.fullTextAnnotation?.text || '';
    const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const detectedItems: { name: string; price: number }[] = [];

    // Using context-aware parsing for vertical layouts
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Match price with currency or standard format
      const priceMatch = line.match(/(\d{1,3}(?:,\d{3})+|\d{3,})\s*(?=円|税込|$)/);
      
      if (priceMatch) {
        const price = parseFloat(priceMatch[1].replace(/,/g, ''));
        if (price === 283) continue; // Noise exclusion

        let name = "";
        // Look backwards for product name (avoiding UI labels)
        for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
          const prevLine = lines[j];
          // Heuristic: Names usually have long strings of non-digits
          if (prevLine.match(/[^\d\s\-\,]{3,}/) && !/商品名|価格|備考|品番|數量|削除/.test(prevLine)) {
            name = prevLine;
            // Capture multi-line names
            if (j > 0 && lines[j-1].match(/[^\d\s\-\,]{3,}/) && !/商品名|價格|備考|品番|數量|削除/.test(lines[j-1])) {
              name = lines[j-1] + " " + name;
            }
            break;
          }
        }

        const isExcluded = /合計|小計|送料|消費税|税込|手数料/.test(name);
        if (name && !isExcluded) {
          detectedItems.push({ name, price });
        }
      }
    }

    const uniqueItems = detectedItems.filter((item, index, self) =>
      index === self.findIndex((t) => (
        t.name === item.name && t.price === item.price
      ))
    );

    return NextResponse.json({ items: uniqueItems, rawText: fullText });
  } catch (error: any) {
    console.error('OCR API Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Unknown OCR Error',
      code: error.code
    }, { status: 500 });
  }
}
