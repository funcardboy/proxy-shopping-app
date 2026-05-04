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
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

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
    secureFetch("/api/customers")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCustomers(data);
      })
      .catch((err) => console.error("Fetch customers failed:", err));
  }, []);

  // 1. Handle OCR only (no Drive upload yet)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setOcrLoading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          const ocrRes = await secureFetch("/api/ocr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64 }),
          });
          
          if (ocrRes.ok) {
            const ocrData = await ocrRes.json();
            if (ocrData.items) {
              setDetectedItems(ocrData.items.map((i: any) => ({ ...i, selected: true })));
            }
          }
        } finally {
          setOcrLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("OCR preview failed", error);
      setOcrLoading(false);
    }
  };

  // Helper to upload file to Drive and return URL
  const uploadToDrive = async (file: File) => {
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    const res = await secureFetch("/api/upload", {
      method: "POST",
      body: uploadFormData,
    });
    const data = await res.json();
    return data.url || "";
  };

  // Final Submission (The only time Drive upload happens)
  const executeSubmission = async (items: { name: string; price: number }[]) => {
    setLoading(true);
    try {
      let finalImageUrl = formData.imageUrl;
      
      // Upload to Drive ONLY if a new file was picked
      if (pendingFile) {
        finalImageUrl = await uploadToDrive(pendingFile);
      }

      for (const item of items) {
        await secureFetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId: formData.customerId,
            description: item.name,
            imageUrl: finalImageUrl,
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
      alert("提交失敗，請檢查網路連線");
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
        <p className="text-muted-foreground">正在返回 fun card 收數簿...</p>
      </div>
    );
  }

  const selectedCount = detectedItems.filter(i => i.selected).length;

  return (
    <main className="min-h-screen bg-background pb-32">
      <div className="p-6 max-w-lg mx-auto">
        <header className="mb-8">
          <Link href="/" className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            返回首頁
          </Link>
          <h1 className="text-4xl font-black tracking-tight">新增貨品</h1>
          <p className="text-muted-foreground">fun card 收數簿系統</p>
        </header>

        {/* SECTION 1: Context (Customer & Rate) */}
        <section className="space-y-4 bg-card border-2 border-border p-6 rounded-3xl shadow-sm mb-6">
           <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-primary px-1">1. 選擇客戶 *</label>
              <select
                className="w-full bg-background border-2 border-border focus:border-primary focus:ring-0 p-4 rounded-2xl font-bold transition-all appearance-none"
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                required
              >
                <option value="">-- 點擊選擇客戶 --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
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
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">匯率 *</label>
                <input
                  className="w-full bg-background border-2 border-border focus:border-primary focus:ring-0 p-4 rounded-2xl font-bold transition-all"
                  type="number"
                  step="0.0001"
                  value={formData.exchangeRate}
                  onChange={(e) => setFormData({ ...formData, exchangeRate: e.target.value })}
                  disabled={formData.currency === "HKD"}
                />
              </div>
            </div>
        </section>

        {/* SECTION 2: OCR Upload */}
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
              onChange={handleFileUpload} 
            />
            {previewUrl ? (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-primary/20">
                <img src={previewUrl} className="w-full h-full object-cover" />
                {ocrLoading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[10px] font-bold">OCR...</div>}
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
            )}
            <div className="text-center">
              <span className="font-black text-sm block">{previewUrl ? "重新拍攝/選取收據" : "拍照自動識別"}</span>
              <span className="text-xs text-muted-foreground">識別後可一次過新增多項貨品</span>
            </div>
          </div>

          {detectedItems.length > 0 && (
            <div className="mt-6 space-y-4 animate-in slide-in-from-top duration-500">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">識別清單 ({detectedItems.length})</h3>
                <button onClick={() => setDetectedItems([])} className="text-[10px] font-bold text-destructive uppercase">清除全部</button>
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
                      <span className="text-[10px] opacity-40">{formData.currency}</span>
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
            </div>
          )}
        </section>

        {/* SECTION 3: Manual Entry (Alternative) */}
        {!previewUrl && (
          <div className="bg-muted/40 p-6 rounded-3xl border border-dashed border-border mb-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 text-center">或手動新增單件</h3>
            <div className="space-y-4">
               <input
                className="w-full bg-background border-2 border-border focus:border-primary focus:ring-0 p-4 rounded-2xl font-bold transition-all placeholder:text-muted-foreground/40 text-sm"
                type="text"
                placeholder="貨品描述 (例如: 日本藥妝)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <input
                className="w-full bg-background border-2 border-border focus:border-primary focus:ring-0 p-4 rounded-2xl font-bold transition-all text-sm"
                type="number"
                inputMode="decimal"
                placeholder={`成本金額 (${formData.currency})`}
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* FIXED FOOTER ACTION */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-lg border-t border-border z-50">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => {
                if (selectedCount > 0) {
                  executeSubmission(detectedItems.filter(i => i.selected));
                } else {
                  executeSubmission([{ name: formData.description, price: Number(formData.cost) }]);
                }
              }}
              disabled={loading || !formData.customerId || (selectedCount === 0 && (!formData.description || !formData.cost))}
              className="w-full bg-primary text-white p-5 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  正在上傳與儲存...
                </>
              ) : (
                selectedCount > 0 ? `確認批量新增 ${selectedCount} 件貨品` : "確認手動新增"
              )}
            </button>
            {!formData.customerId && <p className="text-[10px] text-center text-destructive font-bold uppercase mt-2">請先於上方選擇客戶</p>}
          </div>
        </div>
      </div>
    </main>
  );
}
