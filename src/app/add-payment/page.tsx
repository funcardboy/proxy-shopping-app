"use client";
import { secureFetch } from "@/lib/fetcher";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AddPayment() {
  const router = useRouter();
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    customerId: "",
    amountHkd: "",
    direction: "in", // "in": 客支付 Sam (2, 3), "out": Sam 支付客 (4)
    note: "",
    paymentDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    secureFetch("/api/customers").then(res => res.json()).then(data => setCustomers(data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await secureFetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, amountHkd: Number(formData.amountHkd) }),
      });
      router.push("/");
    } catch (error) {
      alert("提交失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-lg mx-auto">
        <header className="mb-8">
          <Link href="/" className="text-xs font-black uppercase text-muted-foreground mb-4 inline-block">← 返回</Link>
          <h1 className="text-4xl font-black">資金/物資往來</h1>
          <p className="text-muted-foreground">記錄行為模式 2, 3, 4</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-3xl space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-muted-foreground">1. 選擇客戶</label>
              <select className="w-full bg-background border-2 border-border p-4 rounded-2xl font-bold" value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})} required>
                <option value="">-- 選擇客戶 --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-muted-foreground">2. 選擇行為</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setFormData({...formData, direction: 'in'})} className={`p-4 rounded-2xl font-bold border-2 transition-all ${formData.direction === 'in' ? "border-success bg-success/5 text-success" : "border-border"}`}>
                  <div className="text-sm">2. 佢幫我買野</div>
                  <div className="text-sm">3. 客還錢比我</div>
                  <div className="text-[10px] opacity-60 mt-1">結果：我欠客錢增加</div>
                </button>
                <button type="button" onClick={() => setFormData({...formData, direction: 'out'})} className={`p-4 rounded-2xl font-bold border-2 transition-all ${formData.direction === 'out' ? "border-destructive bg-destructive/5 text-destructive" : "border-border"}`}>
                  <div className="text-sm">4. 我還錢比客</div>
                  <div className="text-[10px] opacity-60 mt-1">結果：客欠我錢增加</div>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-muted-foreground">3. 金額 (HKD)</label>
              <input className="w-full bg-background border-2 border-border p-4 rounded-2xl font-bold text-2xl" type="number" value={formData.amountHkd} onChange={e => setFormData({...formData, amountHkd: e.target.value})} required placeholder="0.00" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-muted-foreground">4. 備註</label>
              <input className="w-full bg-background border-2 border-border p-4 rounded-2xl font-bold" type="text" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} required placeholder="例如：幫我買咗 XX" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-primary text-white p-5 rounded-2xl font-black text-lg">
            {loading ? "處理中..." : "確認記錄"}
          </button>
        </form>
      </div>
    </main>
  );
}
