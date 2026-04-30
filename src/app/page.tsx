"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
          fetch("/api/customers"),
          fetch("/api/items"),
          fetch("/api/payments"),
        ]);

        const customers = await custRes.json();
        const items = await itemRes.json();
        const payments = await payRes.json();

        const data: CustomerSummary[] = customers.map((c: any) => {
          const owed = items
            .filter((i: any) => i.customerId === c.id)
            .reduce((sum: number, i: any) => sum + i.costHkd, 0);
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

  if (loading) return <div className="p-8">載入中...</div>;

  return (
    <main className="p-4 max-w-4xl mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold">代購管理儀表板</h1>
        <div className="flex w-full sm:w-auto gap-2">
          <Link href="/add-item" className="flex-1 sm:flex-none text-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            + 貨品
          </Link>
          <Link href="/add-payment" className="flex-1 sm:flex-none text-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
            + 付款
          </Link>
        </div>
      </header>

      <div className="grid gap-4">
        {summaries.map((s) => (
          <div key={s.id} className="border p-4 rounded-lg shadow-sm flex justify-between items-center bg-white">
            <div>
              <h2 className="text-lg font-semibold">{s.name}</h2>
              <div className="text-sm text-gray-500">
                待找數: ${s.totalOwed.toFixed(2)} | 已付: ${s.totalPaid.toFixed(2)}
              </div>
            </div>
            <div className={`text-xl font-bold ${s.balance > 0 ? "text-red-600" : "text-green-600"}`}>
              {s.balance > 0 ? `-$${s.balance.toFixed(2)}` : "已結清"}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
