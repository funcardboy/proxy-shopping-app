"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { secureFetch } from "@/lib/fetcher";

interface CustomerSummary {
  id: string;
  name: string;
  totalOwedByCust: number; // 客欠我總額 (我買野比客 + 我找錢比客)
  totalOwedBySam: number;  // 我欠客總額 (客買野比我 + 客比錢我)
  balance: number;         // totalOwedByCust - totalOwedBySam
}

export default function Dashboard() {
  const [summaries, setSummaries] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [custRes, itemRes, payRes] = await Promise.all([
          secureFetch("/api/customers"),
          secureFetch("/api/items"),
          secureFetch("/api/payments"),
        ]);

        const customers = await custRes.json();
        const items = await itemRes.json();
        const payments = await payRes.json();

        const data: CustomerSummary[] = customers.map((c: any) => {
          // 1. 客欠我 (Sam 支出): 我幫佢買野
          const samBuyForCust = items
            .filter((i: any) => i.customerId === c.id)
            .reduce((sum: number, i: any) => sum + i.costHkd, 0);
          
          // 4. 客欠我 (Sam 支出): 我還錢比客
          const samPayToCust = payments
            .filter((p: any) => p.customerId === c.id && p.direction === "out")
            .reduce((sum: number, p: any) => sum + p.amountHkd, 0);

          // 2. 我欠客 (客支出): 佢幫我買野 -> 記錄在資金往來的 'in'，備註會寫「客幫我買」
          // 3. 我欠客 (客支出): 客還錢比我 -> 記錄在資金往來的 'in'
          const custExpenditure = payments
            .filter((p: any) => p.customerId === c.id && p.direction === "in")
            .reduce((sum: number, p: any) => sum + p.amountHkd, 0);

          const totalOwedByCust = samBuyForCust + samPayToCust;
          const totalOwedBySam = custExpenditure;

          return {
            id: c.id,
            name: c.name,
            totalOwedByCust,
            totalOwedBySam,
            balance: totalOwedByCust - totalOwedBySam,
          };
        });

        setSummaries(data);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      <div className="p-6 max-w-2xl mx-auto">
        <header className="flex flex-col gap-1 mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">fun card 收數簿</h1>
          <p className="text-muted-foreground">對帳、清數、一目了然</p>
        </header>

        <section className="grid grid-cols-3 gap-3 mb-8">
          <Link href="/add-customer" className="flex flex-col items-center justify-center gap-2 p-4 bg-card border border-border rounded-xl shadow-sm active:scale-95 transition-transform">
             <span className="text-lg">👤</span>
            <span className="text-xs font-bold">新客戶</span>
          </Link>
          <Link href="/add-item" className="flex flex-col items-center justify-center gap-2 p-4 bg-card border border-border rounded-xl shadow-sm active:scale-95 transition-transform">
            <span className="text-lg">🛍️</span>
            <span className="text-xs font-bold text-center">1.我幫客買野<br/>(客欠我)</span>
          </Link>
          <Link href="/add-payment" className="flex flex-col items-center justify-center gap-2 p-4 bg-card border border-border rounded-xl shadow-sm active:scale-95 transition-transform">
            <span className="text-lg">🔄</span>
            <span className="text-xs font-bold text-center">2,3,4 資金/物資<br/>往來</span>
          </Link>
        </section>

        <div className="space-y-4">
          <h2 className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">結餘總覽</h2>
          <div className="grid gap-3">
            {summaries.map((s) => (
              <Link 
                href={`/customer/${s.id}`} 
                key={s.id} 
                className="bg-card border border-border p-4 rounded-2xl shadow-sm active:scale-[0.98] transition-all"
              >
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-bold">{s.name}</h3>
                    <div className="text-[10px] font-black uppercase text-muted-foreground">
                      <span>客欠我: ${s.totalOwedByCust.toLocaleString()}</span>
                      <span className="mx-2">/</span>
                      <span>我欠客: ${s.totalOwedBySam.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-xl font-black tabular-nums ${s.balance > 0.01 ? "text-destructive" : (s.balance < -0.01 ? "text-success" : "text-muted-foreground")}`}>
                      {s.balance > 0.01 ? `佢欠我 $${s.balance.toLocaleString()}` : (s.balance < -0.01 ? `我欠佢 $${Math.abs(s.balance).toLocaleString()}` : "已清數")}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
