"use client";
import { secureFetch } from "@/lib/fetcher";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DetectedItem {
  name: string;
  price: number;
  selected: boolean;
}

export default function AddItem() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [uploadedUrl, setUploadedUrl] = useState("");

  const [formData, setFormData] = useState({
    customerId: "",
    description: "",
    imageUrl: "",
    currency: "JPY",
    cost: "",
    exchangeRate: "0.052",
    status: "Ordered",
    purchaseDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    // Check if we should auto-mock for testing
    if (typeof window !== 'undefined' && window.location.search.includes('mock=true')) {
      console.log("Mocking OCR data...");
      const mockItems = [
        { name: "THE IDOLM@STER MILLION LIVE! SPECIAL SOLO RECORDS リリース記念グッズ アクリルスタンド 【北沢志保】", price: 1700, selected: true },
        { name: "THE IDOLM@STER M@STERS OF IDOL WORLD 2025 開催記念 公式アイドルアクリルプレート 【星井美希】", price: 900, selected: true },
        { name: "THE IDOLM@STER M@STERS OF IDOL WORLD 2025 開催記念 公式アイドルアクリルプレート 【渋谷 凛】", price: 900, selected: true },
        { name: "THE IDOLM@STER M@STERS OF IDOL WORLD 2025 開催記念 公式アイドルアクリルプレート 【白石 紬】", price: 900, selected: true },
        { name: "THE IDOLM@STER M@STERS OF IDOL WORLD 2025 開催記念 公式アイドルアクリルプレート 【櫻木真乃】", price: 900, selected: true },
        { name: "THE IDOLM@STER M@STERS OF IDOL WORLD 2025 開催記念 公式アイドルアクリルプレート 【福丸小糸】", price: 900, selected: true },
        { name: "THE IDOLM@STER M@STERS OF IDOL WORLD 2025 開催記念 公式アイドルアクリルプレート 【鈴木羽那】", price: 900, selected: true },
        { name: "THE IDOLM@STER M@STERS OF IDOL WORLD 2025 開催記念 公式アイドルアクリルプレート 【藤田ことね】", price: 900, selected: true },
        { name: "THE IDOLM@STER M@STERS OF IDOL WORLD 2025 開催記念 公式アイドルアクリルプレート 【花海佑芽】", price: 900, selected: true },
        { name: "THE IDOLM@STER M@STERS OF IDOL WORLD 2025 開催記念 公式アイドルアクリルプレート 【秦谷美鈴】", price: 900, selected: true },
        { name: "THE IDOLM@STER M@STERS OF IDOL WORLD 2025 開催記念 公式アイドルアクリルプレート用台座 【5人用】", price: 500, selected: true },
        { name: "THE IDOLM@STER M@STERS OF IDOL WORLD 2025 開催記念 公式アイドルアクリルプレート用背景 A", price: 700, selected: true },
        { name: "THE IDOLM@STER M@STERS OF IDOL WORLD 2025 開催記念 公式アイドルアクリルプレート用背景 D", price: 700, selected: true },
        { name: "アイドルマスター シンデレラガールズ アクリルジオラマ/久川凪 STARLIGHT ALLIANCE", price: 1980, selected: true },
        { name: "アイドルマスター シンデレラガールズ アクリルジオラマ/久川颯 STARLIGHT ALLIANCE", price: 1980, selected: true },
        { name: "アイドルマスター シンデレラガールズ ミニタペストリー/渋谷凛 STARLIGHT ALLIANCE", price: 605, selected: true },
        { name: "アイドルマスター シンデレラガールズ ミニタペストリー/久川凪 STARLIGHT ALLIANCE", price: 605, selected: true },
        { name: "アイドルマスター シンデレラガールズ ミニタペストリー/久川颯 STARLIGHT ALLIANCE", price: 605, selected: true }
      ];
      setDetectedItems(mockItems);
    }

    const handleMockData = (event: any) => {
      if (event.detail && event.detail.items) {
        setDetectedItems(event.detail.items.map((i: any) => ({ ...i, selected: true })));
      }
    };
    window.addEventListener('mock-ocr-data', handleMockData);
    return () => window.removeEventListener('mock-ocr-data', handleMockData);
  }, []);

  useEffect(() => {
    secureFetch("/api/customers")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCustomers(data);
        } else {
          console.error("Invalid customer data:", data);
          setCustomers([{ id: "mock-1", name: "Mock Customer (Testing)" }]);
        }
      })
      .catch((err) => {
        console.error("Fetch customers failed:", err);
        setCustomers([{ id: "mock-1", name: "Mock Customer (Testing)" }]);
      });
  }, []);

  // Handle OCR/Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    try {
      // 1. Upload to Drive
      const uploadRes = await secureFetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });
      const uploadData = await uploadRes.json();
      
      let currentImageUrl = "";
      if (uploadData.url) {
        currentImageUrl = uploadData.url;
        setUploadedUrl(uploadData.url);
        setFormData(prev => ({ ...prev, imageUrl: uploadData.url }));
      }

      // 2. Perform OCR
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          const ocrRes = await secureFetch("/api/ocr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64 }),
          });
          
          if (!ocrRes.ok) {
            const errorText = await ocrRes.text();
            console.error(`OCR API Error (${ocrRes.status}):`, errorText);
            alert(`OCR 服務出錯 (${ocrRes.status}): ${errorText.substring(0, 50)}...`);
            setOcrLoading(false);
            return;
          }

          const ocrData = await ocrRes.json();
          
          if (ocrData.items) {
            setDetectedItems(ocrData.items.map((i: any) => ({ ...i, selected: true })));
          } else if (ocrData.error) {
            console.error("OCR Logic Error:", ocrData.error);
            alert(`OCR 識別失敗: ${ocrData.error}`);
          }
        } catch (err) {
          console.error("OCR fetch error", err);
          alert("OCR 請求失敗");
        } finally {
          setOcrLoading(false);
        }
      };
      reader.onerror = () => {
        alert("讀取檔案失敗");
        setOcrLoading(false);
      };
      reader.readAsDataURL(file);

    } catch (error) {
      console.error("Upload failed", error);
      alert("圖片上傳失敗");
      setOcrLoading(false);
    }
  };

  const handleBatchAdd = async () => {
    if (!formData.customerId) {
      alert("請先選擇客戶");
      return;
    }

    const itemsToAdd = detectedItems.filter(i => i.selected);
    if (itemsToAdd.length === 0) {
      alert("請選擇至少一項貨品");
      return;
    }

    setLoading(true);
    try {
      for (const item of itemsToAdd) {
        await secureFetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId: formData.customerId,
            description: item.name,
            imageUrl: uploadedUrl,
            currency: formData.currency,
            costJpy: item.price,
            exchangeRate: formData.currency === "HKD" ? 1 : Number(formData.exchangeRate),
            status: formData.status,
            purchaseDate: formData.purchaseDate,
          }),
        });
      }
      setSubmitted(true);
      setTimeout(() => router.push("/"), 1500);
    } catch (error) {
      console.error("Batch add failed", error);
      alert("批量新增失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await secureFetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          costJpy: Number(formData.cost),
          exchangeRate: formData.currency === "HKD" ? 1 : Number(formData.exchangeRate),
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => router.push("/"), 1500);
      }
    } catch (error) {
      console.error("Failed to add item", error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-success/20 text-success rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h1 className="text-2xl font-black mb-2">新增成功</h1>
        <p className="text-muted-foreground">正在返回儀表板...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      <div className="p-6 max-w-lg mx-auto">
        <header className="mb-8">
          <Link href="/" className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            取消並返回
          </Link>
          <h1 className="text-4xl font-black tracking-tight">新增貨品</h1>
          <p className="text-muted-foreground">可上傳收據自動識別多項貨品</p>
        </header>

        {/* OCR Section */}
        <section className="mb-8">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${ocrLoading ? "bg-muted animate-pulse border-muted-foreground/20" : "bg-card border-border hover:border-primary/50"}`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              capture="environment"
              onChange={handleFileUpload} 
            />
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
            <div className="text-center">
              <span className="font-black text-sm block">點擊上傳或拍攝收據</span>
              <span className="text-xs text-muted-foreground">自動識別多項貨品名稱及金額</span>
            </div>
          </div>

          {detectedItems.length > 0 && (
            <div className="mt-6 space-y-4 animate-in slide-in-from-top duration-500">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">識別結果 ({detectedItems.length})</h3>
                <button 
                  onClick={() => setDetectedItems([])}
                  className="text-[10px] font-bold text-destructive uppercase"
                >清除全部</button>
              </div>
              <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border shadow-sm">
                {detectedItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded-md border-2 border-border text-primary focus:ring-0 transition-all"
                      checked={item.selected}
                      onChange={() => {
                        const newItems = [...detectedItems];
                        newItems[idx].selected = !newItems[idx].selected;
                        setDetectedItems(newItems);
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <input 
                        className="w-full bg-transparent border-none p-0 font-bold text-sm focus:ring-0"
                        value={item.name}
                        onChange={(e) => {
                          const newItems = [...detectedItems];
                          newItems[idx].name = e.target.value;
                          setDetectedItems(newItems);
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-1 font-black tabular-nums text-primary">
                      <span className="text-xs opacity-60">{formData.currency}</span>
                      <input 
                        className="w-16 bg-transparent border-none p-0 text-right font-black focus:ring-0"
                        type="number"
                        value={item.price}
                        onChange={(e) => {
                          const newItems = [...detectedItems];
                          newItems[idx].price = Number(e.target.value);
                          setDetectedItems(newItems);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleBatchAdd}
                disabled={loading || !formData.customerId}
                className="w-full bg-emerald-600 text-white p-4 rounded-2xl font-black shadow-lg shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? "提交中..." : `確認並批量新增 ${detectedItems.filter(i => i.selected).length} 件貨品`}
              </button>
              {!formData.customerId && <p className="text-[10px] text-center text-destructive font-bold uppercase">需先選擇客戶才能批量提交</p>}
            </div>
          )}
        </section>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-4 text-muted-foreground font-black tracking-widest">或手動輸入單件</span></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4 bg-card border border-border p-6 rounded-3xl shadow-sm">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">客戶名稱</label>
              <select
                className="w-full bg-background border-2 border-border focus:border-primary focus:ring-0 p-4 rounded-2xl font-bold transition-all appearance-none"
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                required
              >
                <option value="">請選擇客戶</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">貨品描述</label>
              <input
                className="w-full bg-background border-2 border-border focus:border-primary focus:ring-0 p-4 rounded-2xl font-bold transition-all placeholder:text-muted-foreground/40"
                type="text"
                placeholder="例如：日本藥妝、限量球鞋..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required={detectedItems.length === 0}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">圖片網址 (Google Drive)</label>
              <input
                className="w-full bg-background border-2 border-border focus:border-primary focus:ring-0 p-4 rounded-2xl font-bold transition-all"
                type="url"
                placeholder="https://..."
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">貨幣</label>
                <select
                  className="w-full bg-background border-2 border-border focus:border-primary focus:ring-0 p-4 rounded-2xl font-bold transition-all"
                  value={formData.currency}
                  onChange={(e) => {
                    const newCurrency = e.target.value;
                    setFormData({ 
                      ...formData, 
                      currency: newCurrency,
                      exchangeRate: newCurrency === "HKD" ? "1" : "0.052"
                    });
                  }}
                >
                  <option value="JPY">JPY (日元)</option>
                  <option value="HKD">HKD (港幣)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">成本 ({formData.currency})</label>
                <input
                  className="w-full bg-background border-2 border-border focus:border-primary focus:ring-0 p-4 rounded-2xl font-bold transition-all"
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  required={detectedItems.length === 0}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">匯率</label>
              <input
                className="w-full bg-muted border-2 border-transparent focus:border-primary focus:ring-0 p-4 rounded-2xl font-bold transition-all disabled:opacity-50"
                type="number"
                step="0.0001"
                inputMode="decimal"
                value={formData.exchangeRate}
                onChange={(e) => setFormData({ ...formData, exchangeRate: e.target.value })}
                disabled={formData.currency === "HKD"}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white p-5 rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            disabled={loading || detectedItems.length > 0}
          >
            {loading ? "處理中" : "手動確認並新增"}
          </button>
        </form>
      </div>
    </main>
  );
}
