"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AddItem() {
  const router = useRouter();
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
    fetch("/api/customers")
      .then((res) => res.json())
      .then((data) => setCustomers(data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/items", {
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
    <main className="min-h-screen bg-background pb-12">
      <div className="p-6 max-w-lg mx-auto">
        <header className="mb-8">
          <Link href="/" className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            取消並返回
          </Link>
          <h1 className="text-4xl font-black tracking-tight">新增貨品</h1>
          <p className="text-muted-foreground">記錄為客戶代購的新商品</p>
        </header>

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
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">圖片網址 (可選)</label>
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
                  required
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
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                處理中
              </>
            ) : "確認並新增貨品"}
          </button>
        </form>
      </div>
    </main>
  );
}
