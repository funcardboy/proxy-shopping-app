import { NextResponse } from 'next/server';
import vision from '@google-cloud/vision';

export async function POST(request: Request) {
  try {
    const { imageBase64 } = await request.json();
    
    if (!imageBase64) {
      return NextResponse.json({ error: 'No image data' }, { status: 400 });
    }

    const client = new vision.ImageAnnotatorClient({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
    });

    // Remove data:image/jpeg;base64, prefix if exists
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const content = Buffer.from(base64Data, 'base64');

    const [result] = await client.documentTextDetection({
      image: { content },
    });
    
    const fullText = result.fullTextAnnotation?.text || '';
    const pages = result.fullTextAnnotation?.pages || [];
    
    const detectedItems: { name: string; price: number }[] = [];

    // 我們可以使用 Google Cloud Vision 的 Block/Paragraph 結構來處理複雜佈局
    // 對於表格類型的收據（如購物車截圖），通常「名稱」和「金額」在同一塊或相鄰塊
    if (pages.length > 0) {
      for (const page of pages) {
        for (const block of page.blocks || []) {
          for (const paragraph of block.paragraphs || []) {
            const lineText = paragraph.words?.map(w => w.symbols?.map(s => s.text).join('')).join(' ') || '';
            
            // 使用改進的正則表達式提取金額
            const priceMatch = lineText.match(/(\d{1,3}(?:,\d{3})+|\d{3,})\s*(?=円|税込|元|\s|$)/);
            
            if (priceMatch) {
              const price = parseFloat(priceMatch[1].replace(/,/g, ''));
              let name = lineText.split(priceMatch[0])[0].trim();
              
              // 清理名稱中的雜訊
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

    // 如果透過結構化 Block 沒抓到足夠資訊，則 fallback 到原始全文行掃描
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

    // 去重處理（防止同一行被 Block 和 Fallback 重複抓取）
    const uniqueItems = detectedItems.filter((item, index, self) =>
      index === self.findIndex((t) => (
        t.name === item.name && t.price === item.price
      ))
    );

    // MOCK DATA for local testing if needed or if Vision API fails
    if (process.env.MOCK_OCR === 'true') {
      return NextResponse.json({
        items: [
          { name: "THE IDOLM@STER MILLION LIVE! SPECIAL SOLO RECORDS リリース記念グッズ アクリルスタンド 【北沢志保】", price: 1700 },
          { name: "THE IDOLM@STER M@STERS OF IDOL WORLD 2025 開催記念 公式アイドルアクリルプレート 【星井美希】", price: 900 },
          { name: "THE IDOLM@STER M@STERS OF IDOL WORLD 2025 開催記念 公式アイドルアクリルプレート 【渋谷 凛】", price: 900 },
          { name: "THE IDOLM@STER M@STERS OF IDOL WORLD 2025 開催記念 公式アイドルアクリルプレート 【白石 紬】", price: 900 },
          { name: "THE IDOLM@STER M@STERS OF IDOL WORLD 2025 開催記念 公式アイドルアクリルプレート 【櫻木真乃】", price: 900 },
          { name: "THE IDOLM@STER M@STERS OF IDOL WORLD 2025 開催記念 公式アイドルアクリルプレート 【福丸小糸】", price: 900 },
          { name: "THE IDOLM@STER M@STERS OF IDOL WORLD 2025 開催記念 公式アイドルアクリルプレート 【鈴木羽那】", price: 900 },
          { name: "THE IDOLM@STER M@STERS OF IDOL WORLD 2025 開催記念 公式アイドルアクリルプレート 【藤田ことね】", price: 900 },
          { name: "THE IDOLM@STER M@STERS OF IDOL WORLD 2025 開催記念 公式アイドルアクリルプレート 【花海佑芽】", price: 900 },
          { name: "THE IDOLM@STER M@STERS OF IDOL WORLD 2025 開催記念 公式アイドルアクリルプレート 【秦谷美鈴】", price: 900 },
          { name: "THE IDOLM@STER M@STERS OF IDOL WORLD 2025 開催記念 公式アイドルアクリルプレート用台座 【5人用】", price: 500 },
          { name: "THE IDOLM@STER M@STERS OF IDOL WORLD 2025 開催記念 公式アイドルアクリルプレート用背景 A", price: 700 },
          { name: "THE IDOLM@STER M@STERS OF IDOL WORLD 2025 開催記念 公式アイドルアクリルプレート用背景 D", price: 700 },
          { name: "アイドルマスター シンデレラガールズ アクリルジオラマ/久川凪 STARLIGHT ALLIANCE", price: 1980 },
          { name: "アイドルマスター シンデレラガールズ アクリルジオラマ/久川颯 STARLIGHT ALLIANCE", price: 1980 },
          { name: "アイドルマスター シンデレラガールズ ミニタペストリー/渋谷凛 STARLIGHT ALLIANCE", price: 605 },
          { name: "アイドルマスター シンデレラガールズ ミニタペストリー/久川凪 STARLIGHT ALLIANCE", price: 605 },
          { name: "アイドルマスター シンデレラガールズ ミニタペストリー/久川颯 STARLIGHT ALLIANCE", price: 605 }
        ],
        rawText: "MOCK_DATA"
      });
    }

    return NextResponse.json({ items: uniqueItems, rawText: fullText });
  } catch (error: any) {
    console.error('OCR error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
