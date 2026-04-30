"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AddItem() {
  const router = useRouter();
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    customerId: "",
    description: "",
    imageUrl: "",
    costJpy: "",
    exchangeRate: "0.052", // Default rate
    status: "Ordered",
    purchaseDate: new Date().toISOString().split("T")[0],
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
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          costJpy: Number(formData.costJpy),
          exchangeRate: Number(formData.exchangeRate),
        }),
      });

      if (res.ok) {
        router.push("/");
      }
    } catch (error) {
      console.error("Failed to add item", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">新增貨品</h1>
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
          <label className="block text-sm font-medium">貨品描述</label>
          <input
            className="w-full border p-2 rounded"
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">圖片網址</label>
          <input
            className="w-full border p-2 rounded"
            type="text"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">成本 (日元 JPY)</label>
            <input
              className="w-full border p-2 rounded"
              type="number"
              value={formData.costJpy}
              onChange={(e) => setFormData({ ...formData, costJpy: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">匯率</label>
            <input
              className="w-full border p-2 rounded"
              type="number"
              step="0.0001"
              value={formData.exchangeRate}
              onChange={(e) => setFormData({ ...formData, exchangeRate: e.target.value })}
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "處理中..." : "確認新增"}
        </button>
      </form>
    </main>
  );
}
