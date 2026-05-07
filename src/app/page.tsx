"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { secureFetch } from "@/lib/fetcher";

interface CustomerSummary {
  id: string;
  name: string;
  totalOwed: number;
  totalPaid: number;
  balance: number;
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
          const owed = items
            .filter((i: any) => i.customerId === c.id)
            .reduce((sum: number, i: any) => sum + i.costHkd, 0);
          
          // Payments to Sam are positive, Sam's debt to customer is negative in the DB.
          // But for "totalPaid", we want to show how much the customer has contributed.
          const paid = payments
            .filter((p: any) => p.customerId === c.id)
            .reduce((sum: number, p: any) => sum + p.amountHkd, 0);
            
          return {
            id: c.id,
            name: c.name,
            totalOwed: owed,
            totalPaid: paid,
            balance: owed - paid,
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
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground animate-pulse">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      <div className="p-6 max-w-2xl mx-auto">
        <header className="flex flex-col gap-1 mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">fun card 收數簿</h1>
          <p className="text-muted-foreground">概覽客戶帳目與進度</p>
        </header>

        <section className="grid grid-cols-3 gap-3 mb-8">
          <Link href="/add-customer" className="flex flex-col items-center justify-center gap-2 p-4 bg-card border border-border rounded-xl shadow-sm active:scale-95 transition-transform">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            </div>
            <span className="text-xs font-semibold">客戶</span>
          </Link>
          <Link href="/add-item" className="flex flex-col items-center justify-center gap-2 p-4 bg-card border border-border rounded-xl shadow-sm active:scale-95 transition-transform">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.27 6.96 8.73 5.04 8.73-5.04"/><path d="M12 22.08V12"/></svg>
            </div>
            <span className="text-xs font-semibold">貨品</span>
          </Link>
          <Link href="/add-payment" className="flex flex-col items-center justify-center gap-2 p-4 bg-card border border-border rounded-xl shadow-sm active:scale-95 transition-transform">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </div>
            <span className="text-xs font-semibold">付款</span>
          </Link>
        </section>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">所有客戶 ({summaries.length})</h2>
          </div>
          
          <div className="grid gap-3">
            {summaries.map((s) => (
              <Link 
                href={`/customer/${s.id}`} 
                key={s.id} 
                className="group relative bg-card border border-border p-4 rounded-2xl shadow-sm active:scale-[0.98] transition-all hover:border-primary/30"
              >
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{s.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>應付 HKD {s.totalOwed.toLocaleString()}</span>
                      <span className="w-1 h-1 rounded-full bg-border"></span>
                      <span>已付 HKD {s.totalPaid.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-xl font-black tabular-nums ${s.balance > 0.01 ? "text-destructive" : (s.balance < -0.01 ? "text-success" : "text-muted-foreground")}`}>
                      {s.balance > 0.01 ? `-$${s.balance.toLocaleString()}` : (s.balance < -0.01 ? `+$${Math.abs(s.balance).toLocaleString()}` : "已結清")}
                    </div>
                    <div className="text-[10px] font-bold uppercase opacity-60">
                      {s.balance > 0.01 ? "佢欠我" : (s.balance < -0.01 ? "我欠佢" : "已清數")}
                    </div>
                  </div>
                </div>
                
                {/* Visual indicator bar */}
                <div className="mt-3 w-full h-1 bg-muted rounded-full overflow-hidden">
                   <div 
                    className={`h-full transition-all duration-500 ${s.balance > 0.01 ? "bg-destructive/40" : (s.balance < -0.01 ? "bg-success/40" : "bg-muted-foreground/20")}`}
                    style={{ width: s.totalOwed > 0 ? `${Math.min(100, (s.totalPaid / s.totalOwed) * 100)}%` : "0%" }}
                   ></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
