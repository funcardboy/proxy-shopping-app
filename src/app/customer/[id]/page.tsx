"use client";
import { secureFetch } from "@/lib/fetcher";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [custRes, itemRes, payRes] = await Promise.all([
          secureFetch(`/api/customers`),
          secureFetch(`/api/items`),
          secureFetch(`/api/payments`),
        ]);

        const customers = await custRes.json();
        setCustomer(customers.find((c: any) => c.id === id));
        const allItems = await itemRes.json();
        setItems(allItems.filter((i: any) => i.customerId === id));
        const allPayments = await payRes.json();
        setPayments(allPayments.filter((p: any) => p.customerId === id));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) return <div className="p-10 text-center font-bold">載入中...</div>;

  const samBuyForCust = items.reduce((sum, i) => sum + i.costHkd, 0);
  const samPayToCust = payments.filter(p => p.direction === "out").reduce((sum, p) => sum + p.amountHkd, 0);
  const custToSam = payments.filter(p => p.direction === "in").reduce((sum, p) => sum + p.amountHkd, 0);

  const totalOwedByCust = samBuyForCust + samPayToCust;
  const totalOwedBySam = custToSam;
  const balance = totalOwedByCust - totalOwedBySam;

  const timeline = [
    ...items.map(i => ({ type: '1', label: '我幫客買野', date: i.purchaseDate, note: i.description, amount: i.costHkd, side: 'sam' })),
    ...payments.filter(p => p.direction === 'out').map(p => ({ type: '4', label: '我還錢比客', date: p.paymentDate, note: p.note, amount: p.amountHkd, side: 'sam' })),
    ...payments.filter(p => p.direction === 'in').map(p => ({ type: '2,3', label: '客比錢/物我', date: p.paymentDate, note: p.note, amount: p.amountHkd, side: 'cust' })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-lg mx-auto">
        <Link href="/" className="text-xs font-black uppercase text-muted-foreground mb-4 inline-block">← 返回收數簿</Link>
        
        <header className="mb-8">
          <h1 className="text-4xl font-black">{customer?.name}</h1>
          <div className={`mt-4 p-6 rounded-3xl border-2 ${balance > 0.01 ? "border-destructive bg-destructive/5 text-destructive" : (balance < -0.01 ? "border-success bg-success/5 text-success" : "border-border bg-card")}`}>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">最終對帳結餘</div>
            <div className="text-4xl font-black">
              {balance > 0.01 ? `佢欠我 $${balance.toLocaleString()}` : (balance < -0.01 ? `我欠佢 $${Math.abs(balance).toLocaleString()}` : "已結清")}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="p-4 bg-card border border-border rounded-2xl">
            <div className="text-[10px] font-black uppercase text-muted-foreground mb-1">客欠我 (總額)</div>
            <div className="text-xl font-black">${totalOwedByCust.toLocaleString()}</div>
          </div>
          <div className="p-4 bg-card border border-border rounded-2xl">
            <div className="text-[10px] font-black uppercase text-muted-foreground mb-1">我欠客 (總額)</div>
            <div className="text-xl font-black">${totalOwedBySam.toLocaleString()}</div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">流水對帳表</h2>
          {timeline.map((tx, idx) => (
            <div key={idx} className="bg-card border border-border rounded-2xl p-4 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${tx.side === 'sam' ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                    {tx.label}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground">{tx.date}</span>
                </div>
                <div className="font-bold text-sm">{tx.note}</div>
              </div>
              <div className={`text-lg font-black ${tx.side === 'sam' ? "text-destructive" : "text-success"}`}>
                {tx.side === 'sam' ? `-$${tx.amount.toLocaleString()}` : `+$${tx.amount.toLocaleString()}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
