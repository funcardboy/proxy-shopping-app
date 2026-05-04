import { NextResponse } from 'next/server';
import vision from '@google-cloud/vision';

export async function POST(request: Request) {
  try {
    const { imageBase64 } = await request.json();
    
    if (!imageBase64) {
      return NextResponse.json({ error: 'No image data' }, { status: 400 });
    }

    console.log('OCR Request: Checking credentials...');
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.error('OCR Error: Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY');
      return NextResponse.json({ 
        error: 'OCR Credentials missing in environment',
        details: 'Ensure GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY are set in Vercel'
      }, { status: 500 });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const content = Buffer.from(base64Data, 'base64');

    console.log('Sending to Vision API via REST, content size:', content.length);
    
    // Fallback to REST API to avoid gRPC issues on Vercel
    const apiKey = process.env.GOOGLE_API_KEY; // You need to add this to Vercel
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is missing for REST fallback');
    }

    const visionRes = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Data },
            features: [{ type: 'TEXT_DETECTION' }]
          }
        ]
      })
    });

    if (!visionRes.ok) {
      const errorData = await visionRes.json();
      throw new Error(`Vision REST API Error: ${JSON.stringify(errorData)}`);
    }

    const data = await visionRes.json();
    const result = data.responses[0];
    
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
