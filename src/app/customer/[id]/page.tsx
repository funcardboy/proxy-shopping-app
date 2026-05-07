"use client";
import { secureFetch } from "@/lib/fetcher";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Item {
  id: string;
  description: string;
  costHkd: number;
  purchaseDate: string;
}

interface Payment {
  id: string;
  amountHkd: number;
  paymentDate: string;
  direction: string;
  note: string;
}

export default function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
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
        const customer = customers.find((c: any) => c.id === id);
        setCustomer(customer);

        const allItems = await itemRes.json();
        setItems(allItems.filter((i: any) => i.customerId === id));

        const allPayments = await payRes.json();
        setPayments(allPayments.filter((p: any) => p.customerId === id));
      } catch (error) {
        console.error("Failed to fetch customer data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) return <div className="p-6 text-center">載入中...</div>;
  if (!customer) return <div className="p-6 text-center">找不到客戶</div>;

  const samTotal = items.reduce((sum, i) => sum + i.costHkd, 0) + 
                   payments.filter(p => p.direction === "out").reduce((sum, p) => sum + p.amountHkd, 0);
  const custTotal = payments.filter(p => p.direction === "in").reduce((sum, p) => sum + p.amountHkd, 0);
  const totalBalance = samTotal - custTotal;

  const timeline = [
    ...items.map(i => ({ type: 'item', date: i.purchaseDate, data: i })),
    ...payments.map(p => ({ type: 'payment', date: p.paymentDate, data: p }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <main className="min-h-screen bg-background pb-12">
      <div className="p-6 max-w-lg mx-auto">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <Link href="/" className="inline-flex items-center gap-1 text-xs font-black uppercase text-muted-foreground hover:text-primary mb-4 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              返回收數簿
            </Link>
            <h1 className="text-4xl font-black tracking-tight">{customer.name}</h1>
            <p className="text-muted-foreground text-sm font-medium">{customer.contactInfo || "無聯絡資料"}</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">當前結餘</div>
            <div className={`text-4xl font-black tabular-nums leading-none ${totalBalance > 0.01 ? "text-destructive" : (totalBalance < -0.01 ? "text-success" : "text-muted-foreground")}`}>
              {totalBalance > 0.01 ? `-$${totalBalance.toLocaleString()}` : (totalBalance < -0.01 ? `+$${Math.abs(totalBalance).toLocaleString()}` : "已結清")}
            </div>
            <div className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase ${totalBalance > 0.01 ? "bg-destructive/10 text-destructive" : (totalBalance < -0.01 ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}`}>
              {totalBalance > 0.01 ? "佢欠我" : (totalBalance < -0.01 ? "我欠佢" : "已結清")}
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-card border border-border p-4 rounded-2xl">
            <div className="text-[10px] font-black uppercase tracking-widest text-destructive mb-1">🔴 Sam 貢獻</div>
            <div className="text-xl font-black tabular-nums">${samTotal.toLocaleString()}</div>
            <div className="text-[9px] text-muted-foreground font-bold mt-1">貨品 + 退款/找數</div>
          </div>
          <div className="bg-card border border-border p-4 rounded-2xl">
            <div className="text-[10px] font-black uppercase tracking-widest text-success mb-1">🟢 客戶貢獻</div>
            <div className="text-xl font-black tabular-nums">${custTotal.toLocaleString()}</div>
            <div className="text-[9px] text-muted-foreground font-bold mt-1">付款 + Sam 向客買野</div>
          </div>
        </section>

        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">帳目流水 (最新優先)</h2>
          <div className="space-y-3">
            {timeline.map((tx, idx) => (
              <div key={idx} className="bg-card border border-border rounded-2xl p-4 flex justify-between items-center shadow-sm">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase ${tx.type === 'item' ? "bg-destructive/10 text-destructive" : (tx.data.direction === 'in' ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}`}>
                      {tx.type === 'item' ? "貨品" : (tx.data.direction === 'in' ? "客比錢/貨" : "Sam 比錢/貨")}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">{tx.date}</span>
                  </div>
                  <p className="font-bold text-sm">
                    {tx.type === 'item' ? tx.data.description : tx.data.note}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-black tabular-nums ${ (tx.type === 'item' || tx.data.direction === 'out') ? "text-destructive" : "text-success"}`}>
                    {(tx.type === 'item' || tx.data.direction === 'out') ? `-$${(tx.data.costHkd || tx.data.amountHkd).toLocaleString()}` : `+$${tx.data.amountHkd.toLocaleString()}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
