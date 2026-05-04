"use client";
import { secureFetch } from "@/lib/fetcher";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Item {
  id: string;
  customerId: string;
  description: string;
  imageUrl: string;
  costJpy: number;
  exchangeRate: number;
  costHkd: number;
  status: string;
  purchaseDate: string;
}

interface Payment {
  id: string;
  customerId: string;
  amountHkd: number;
  paymentDate: string;
  method: string;
  note: string;
}

interface Customer {
  id: string;
  name: string;
  contactInfo: string;
}

type Transaction = 
  | { type: 'item'; data: Item; date: Date }
  | { type: 'payment'; data: Payment; date: Date };

interface TransactionBatch {
  transactions: Transaction[];
  isSettled: boolean;
  finalBalance: number;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [batches, setBatches] = useState<TransactionBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [custRes, itemRes, payRes] = await Promise.all([
          secureFetch("/api/customers"),
          secureFetch("/api/items"),
          secureFetch("/api/payments"),
        ]);

        const customers: Customer[] = await custRes.json();
        const items: Item[] = await itemRes.json();
        const payments: Payment[] = await payRes.json();

        const currentCustomer = customers.find(c => c.id === id);
        if (!currentCustomer) {
          setLoading(false);
          return;
        }
        setCustomer(currentCustomer);

        const customerItems = items.filter(i => i.customerId === id);
        const customerPayments = payments.filter(p => p.customerId === id);

        const allTransactions: Transaction[] = [
          ...customerItems.map(i => ({ type: 'item' as const, data: i, date: new Date(i.purchaseDate) })),
          ...customerPayments.map(p => ({ type: 'payment' as const, data: p, date: new Date(p.paymentDate) }))
        ].sort((a, b) => a.date.getTime() - b.date.getTime());

        // Group into batches
        const groupedBatches: TransactionBatch[] = [];
        let currentBatch: Transaction[] = [];
        let currentBalance = 0;

        allTransactions.forEach((tx) => {
          currentBatch.push(tx);
          if (tx.type === 'item') {
            currentBalance += tx.data.costHkd;
          } else {
            currentBalance -= tx.data.amountHkd;
          }

          if (Math.abs(currentBalance) < 0.01) {
            groupedBatches.push({
              transactions: currentBatch,
              isSettled: true,
              finalBalance: 0
            });
            currentBatch = [];
            currentBalance = 0;
          }
        });

        if (currentBatch.length > 0) {
          groupedBatches.push({
            transactions: currentBatch,
            isSettled: false,
            finalBalance: currentBalance
          });
        }

        setBatches(groupedBatches.reverse()); // Show newest batch first
      } catch (error) {
        console.error("Failed to fetch customer data", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground animate-pulse">載入詳情中...</p>
        </div>
      </div>
    );
  }

  if (!customer) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="text-destructive text-4xl mb-4">⚠️</div>
      <h1 className="text-xl font-bold mb-2">找不到客戶</h1>
      <Link href="/" className="text-primary font-semibold hover:underline">返回首頁</Link>
    </div>
  );

  const totalBalance = batches.reduce((sum, b) => sum + b.finalBalance, 0);

  return (
    <main className="min-h-screen bg-background pb-12">
      <div className="p-6 max-w-2xl mx-auto">
        <header className="mb-8">
          <Link href="/" className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            返回概覽
          </Link>
          
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h1 className="text-4xl font-black tracking-tight">{customer.name}</h1>
              <div className="inline-flex items-center gap-2 px-2 py-1 bg-muted rounded-md text-xs font-medium text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                {customer.contactInfo || "未提供聯絡資料"}
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">當前結餘</div>
              <div className={`text-4xl font-black tabular-nums leading-none ${totalBalance > 0.01 ? "text-destructive" : (totalBalance < -0.01 ? "text-success" : "text-muted-foreground")}`}>
                {totalBalance > 0.01 ? `-$${totalBalance.toLocaleString()}` : (totalBalance < -0.01 ? `+$${Math.abs(totalBalance).toLocaleString()}` : "已結清")}
              </div>
              <div className={`mt-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase ${totalBalance > 0.01 ? "bg-destructive/10 text-destructive" : (totalBalance < -0.01 ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}`}>
                {totalBalance > 0.01 ? "欠款" : (totalBalance < -0.01 ? "預付額" : "已結清")}
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-12 relative">
          {/* Timeline center line */}
          <div className="absolute left-[11px] top-4 bottom-4 w-[2px] bg-border/40 z-0"></div>

          {batches.map((batch, bIdx) => (
            <section key={bIdx} className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                 <div className={`w-6 h-6 rounded-full border-4 border-background flex-shrink-0 z-20 ${batch.isSettled ? "bg-muted-foreground/30 shadow-[0_0_0_2px_rgba(0,0,0,0.05)]" : (batch.finalBalance > 0 ? "bg-destructive animate-pulse shadow-[0_0_0_4px_rgba(239,68,68,0.2)]" : "bg-success shadow-[0_0_0_4px_rgba(34,197,94,0.2)]")}`}></div>
                 <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black uppercase tracking-wider">
                      {batch.isSettled ? "已結清批次" : (batch.finalBalance > 0 ? "未結清項目" : "預付批次")}
                    </h2>
                    {!batch.isSettled && (
                       <span className={`text-xs font-bold px-2 py-0.5 rounded ${batch.finalBalance > 0 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                        HKD {Math.abs(batch.finalBalance).toLocaleString()}
                       </span>
                    )}
                 </div>
              </div>

              <div className={`ml-[11px] pl-8 space-y-1 ${batch.isSettled ? "opacity-60 grayscale-[0.5]" : ""}`}>
                {batch.transactions.map((tx, tIdx) => (
                  <div key={tIdx} className="relative group pb-6 last:pb-0">
                    {/* Item marker */}
                    <div className="absolute -left-[35px] top-1.5 w-3 h-3 rounded-full bg-background border-2 border-border group-hover:border-primary transition-colors"></div>
                    
                    <div className={`p-4 rounded-2xl border transition-all ${tx.type === 'item' ? "bg-card border-border" : (tx.data.amountHkd < 0 ? "bg-destructive/5 border-destructive/20 shadow-sm shadow-destructive/5" : "bg-success/5 border-success/20 shadow-sm shadow-success/5")}`}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex gap-4">
                          {tx.type === 'item' && (
                            <div className="w-14 h-14 bg-muted rounded-xl overflow-hidden flex-shrink-0 border border-border/50 shadow-sm flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/40"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                            </div>
                          )}
                          {tx.type === 'payment' && (
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.data.amountHkd < 0 ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success"}`}>
                              {tx.data.amountHkd < 0 ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20m0-20l-5 5m5-5l5 5"/><path d="M12 2v20m0 0l-5-5m5 5l5-5"/></svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                              )}
                            </div>
                          )}
                          
                          <div>
                            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">
                              {new Date(tx.date).toLocaleDateString('zh-HK', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            <div className="font-bold text-base leading-tight">
                              {tx.type === 'item' ? tx.data.description : (tx.data.amountHkd < 0 ? `Sam's Debt: ${tx.data.method}` : `付款: ${tx.data.method}`)}
                            </div>
                            {tx.type === 'item' && (
                              <div className="text-xs font-semibold text-muted-foreground mt-1">
                                {tx.data.exchangeRate === 1 ? `HKD ${tx.data.costJpy}` : `JPY ${tx.data.costJpy.toLocaleString()} @ ${tx.data.exchangeRate}`}
                              </div>
                            )}
                            {tx.type === 'payment' && tx.data.note && (
                              <div className={`text-xs font-medium mt-1 italic ${tx.data.amountHkd < 0 ? "text-destructive/70" : "text-success/70"}`}>
                                "{tx.data.note}"
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className={`text-lg font-black tabular-nums ${tx.type === 'item' ? "text-destructive" : (tx.data.amountHkd < 0 ? "text-destructive" : "text-success")}`}>
                          {tx.type === 'item' ? `-$${tx.data.costHkd.toLocaleString()}` : (tx.data.amountHkd < 0 ? `-$${Math.abs(tx.data.amountHkd).toLocaleString()}` : `+$${tx.data.amountHkd.toLocaleString()}`)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
