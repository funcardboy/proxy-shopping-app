"use client";

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
          fetch("/api/customers"),
          fetch("/api/items"),
          fetch("/api/payments"),
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

  if (loading) return <div className="p-8 text-center">載入中...</div>;
  if (!customer) return <div className="p-8 text-center text-red-600">找不到客戶</div>;

  const totalBalance = batches.reduce((sum, b) => sum + b.finalBalance, 0);

  return (
    <main className="p-4 max-w-4xl mx-auto">
      <header className="mb-8">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
          ← 返回儀表板
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold">{customer.name}</h1>
            <p className="text-gray-500">{customer.contactInfo}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 uppercase tracking-wider font-semibold">當前結餘</div>
            <div className={`text-3xl font-bold ${totalBalance > 0.01 ? "text-red-600" : "text-green-600"}`}>
              {totalBalance > 0.01 ? `-$${totalBalance.toFixed(2)}` : "已結清"}
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-12">
        {batches.map((batch, bIdx) => (
          <section key={bIdx} className={`relative p-6 rounded-xl border ${batch.isSettled ? "bg-gray-50 border-gray-200" : "bg-white border-blue-200 shadow-sm"}`}>
            <div className="absolute top-0 right-0 -mt-3 mr-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${batch.isSettled ? "bg-gray-200 text-gray-600" : "bg-blue-600 text-white"}`}>
                {batch.isSettled ? "已結清批次" : "進行中批次"}
              </span>
            </div>
            
            <div className="space-y-4">
              {batch.transactions.map((tx, tIdx) => (
                <div key={tIdx} className="flex gap-4 items-start py-2 border-b last:border-0 border-gray-100">
                  <div className="text-sm text-gray-400 w-24 flex-shrink-0 pt-1">
                    {tx.date.toLocaleDateString()}
                  </div>
                  
                  <div className="flex-grow flex gap-4">
                    {tx.type === 'item' ? (
                      <>
                        {tx.data.imageUrl && (
                          <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0 border">
                            <img src={tx.data.imageUrl} alt={tx.data.description} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-grow">
                          <div className="font-medium">{tx.data.description}</div>
                          <div className="text-xs text-gray-500">
                            JPY {tx.data.costJpy} @ {tx.data.exchangeRate}
                          </div>
                        </div>
                        <div className="text-red-600 font-semibold">
                          -${tx.data.costHkd.toFixed(2)}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-16 flex-shrink-0 flex justify-center">
                          <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                            $
                          </div>
                        </div>
                        <div className="flex-grow">
                          <div className="font-medium text-green-700">付款: {tx.data.method}</div>
                          {tx.data.note && <div className="text-sm text-gray-500">{tx.data.note}</div>}
                        </div>
                        <div className="text-green-600 font-bold">
                          +${tx.data.amountHkd.toFixed(2)}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!batch.isSettled && (
              <div className="mt-6 pt-4 border-t border-blue-100 flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-500 uppercase">批次小計</span>
                <span className="text-xl font-bold text-red-600">-${batch.finalBalance.toFixed(2)}</span>
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
