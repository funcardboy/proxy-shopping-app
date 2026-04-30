"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddCustomer() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    contact: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push("/");
      }
    } catch (error) {
      console.error("Failed to add customer", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">新增客戶</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">客戶名稱</label>
          <input
            className="w-full border p-2 rounded"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="例如: 陳大文"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">聯絡資料</label>
          <input
            className="w-full border p-2 rounded"
            type="text"
            value={formData.contact}
            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
            required
            placeholder="例如: WhatsApp / Signal 號碼"
          />
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
