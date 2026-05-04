import { NextResponse } from 'next/server';
import vision from '@google-cloud/vision';

export async function POST(request: Request) {
  try {
    const { imageBase64 } = await request.json();
    
    if (!imageBase64) {
      return NextResponse.json({ error: 'No image data' }, { status: 400 });
    }

    console.log('Client Email:', process.env.GOOGLE_CLIENT_EMAIL);
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    console.log('Private Key length:', privateKey?.length || 0);

    const client = new vision.ImageAnnotatorClient({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey?.replace(/\\n/g, '\n'),
      },
    });

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const content = Buffer.from(base64Data, 'base64');

    const [result] = await client.documentTextDetection({
      image: { content },
    }).catch(err => {
      console.error('Vision API Error:', err);
      throw err;
    });
    
    const fullText = result.fullTextAnnotation?.text || '';
    const pages = result.fullTextAnnotation?.pages || [];
    
    const detectedItems: { name: string; price: number }[] = [];

    if (pages.length > 0) {
      for (const page of pages) {
        for (const block of page.blocks || []) {
          for (const paragraph of block.paragraphs || []) {
            const lineText = paragraph.words?.map(w => w.symbols?.map(s => s.text).join('')).join(' ') || '';
            
            // Look for price pattern: Number + 円/税込 OR number with comma
            const priceMatch = lineText.match(/(\d{1,3}(?:,\d{3})+|\d{3,})\s*(?=円|税込)/) || 
                              lineText.match(/(\d{1,3}(?:,\d{3})+)\s*(?=\s|$)/);
            
            if (priceMatch) {
              const price = parseFloat(priceMatch[1].replace(/,/g, ''));
              let name = lineText.split(priceMatch[0])[0].trim();
              
              if (price === 283) continue; // Skip production number noise

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
        const priceMatch = line.match(/(\d{1,3}(?:,\d{3})+|\d{3,})\s*(?=円|税込)/);
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

    return NextResponse.json({ items: uniqueItems, rawText: fullText });
  } catch (error: any) {
    console.error('OCR API Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Unknown OCR Error',
      details: error.code || 'NO_CODE'
    }, { status: 500 });
  }
}
