"use client";
import { secureFetch } from "@/lib/fetcher";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AddPayment() {
  const router = useRouter();
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    customerId: "",
    amountHkd: "",
    method: "FPS",
    note: "",
    direction: "in", // "in": Customer gives value to Sam (Paid), "out": Sam gives value to Customer (Refund/Payment)
    paymentDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    secureFetch("/api/customers")
      .then((res) => res.json())
      .then((data) => setCustomers(data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const amount = Math.abs(Number(formData.amountHkd));
    // ALWAYS STORE AS POSITIVE IN DB. 
    // We will use the 'direction' field to decide if it's "Customer pays Sam" or "Sam pays Customer"
    
    try {
      const res = await secureFetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amountHkd: amount, 
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => router.push("/"), 1500);
      }
    } catch (error) {
      console.error("Failed to add payment", error);
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
        <h1 className="text-2xl font-black mb-2">記錄成功</h1>
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
          <h1 className="text-4xl font-black tracking-tight">記錄資金/物資往來</h1>
          <p className="text-muted-foreground">記錄誰給了誰錢或貨物</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6 bg-card border border-border p-6 rounded-3xl shadow-sm">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">客戶</label>
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

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">交易類型</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, direction: "in" })}
                  className={`p-4 rounded-2xl font-bold border-2 transition-all flex flex-col items-center gap-1 ${formData.direction === "in" ? "border-success bg-success/10 text-success" : "border-border hover:border-muted-foreground/30"}`}
                >
                  <span className="text-lg">💰</span>
                  <span className="text-sm">客比錢我 /<br/>我欠客錢</span>
                  <span className="text-[10px] opacity-60">(客對 Sam 的貢獻)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, direction: "out" })}
                  className={`p-4 rounded-2xl font-bold border-2 transition-all flex flex-col items-center gap-1 ${formData.direction === "out" ? "border-destructive bg-destructive/10 text-destructive" : "border-border hover:border-muted-foreground/30"}`}
                >
                  <span className="text-lg">💸</span>
                  <span className="text-sm">我找錢比客 /<br/>我比貨客</span>
                  <span className="text-[10px] opacity-60">(Sam 對客的貢獻)</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">金額 (港元 HKD)</label>
              <input
                className="w-full bg-background border-2 border-border focus:border-primary focus:ring-0 p-4 rounded-2xl font-bold transition-all placeholder:text-muted-foreground/40 text-2xl tabular-nums"
                type="number"
                inputMode="decimal"
                value={formData.amountHkd}
                onChange={(e) => setFormData({ ...formData, amountHkd: e.target.value })}
                required
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">備註 (例如: Sam 買野、找尾數)</label>
              <input
                className="w-full bg-background border-2 border-border focus:border-primary focus:ring-0 p-4 rounded-2xl font-bold transition-all placeholder:text-muted-foreground/40"
                type="text"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="必填以資識別"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className={`w-full text-white p-5 rounded-2xl font-black text-lg shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${formData.direction === "out" ? "bg-destructive shadow-destructive/20" : "bg-success shadow-success/20"}`}
            disabled={loading}
          >
            確認記錄
          </button>
        </form>
      </div>
    </main>
  );
}
