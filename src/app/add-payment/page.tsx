"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AddPayment() {
  const router = useRouter();
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    customerId: "",
    amountHkd: "",
    method: "FPS",
    note: "",
    paymentDate: new Date().toISOString().split("T")[0],
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
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amountHkd: Number(formData.amountHkd),
        }),
      });

      if (res.ok) {
        router.push("/");
      }
    } catch (error) {
      console.error("Failed to add payment", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">記錄付款</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">客戶</label>
          <select
            className="w-full border p-2 rounded"
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
        <div>
          <label className="block text-sm font-medium">金額 (港元 HKD)</label>
          <input
            className="w-full border p-2 rounded"
            type="number"
            value={formData.amountHkd}
            onChange={(e) => setFormData({ ...formData, amountHkd: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">付款方式</label>
          <select
            className="w-full border p-2 rounded"
            value={formData.method}
            onChange={(e) => setFormData({ ...formData, method: e.target.value })}
            required
          >
            <option value="FPS">轉數快 (FPS)</option>
            <option value="PayMe">PayMe</option>
            <option value="Bank Transfer">銀行轉帳</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">備註</label>
          <input
            className="w-full border p-2 rounded"
            type="text"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "處理中..." : "確認記錄"}
        </button>
      </form>
    </main>
  );
}
