"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AddCustomer() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
        setSubmitted(true);
        setTimeout(() => router.push("/"), 1500);
      }
    } catch (error) {
      console.error("Failed to add customer", error);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-success/20 text-success rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h1 className="text-2xl font-black mb-2">客戶新增成功</h1>
        <p className="text-muted-foreground">正在返回儀表板...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-12">
      <div className="p-6 max-w-lg mx-auto">
        <header className="mb-8">
          <Link href="/" className="inline-flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            取消並返回
          </Link>
          <h1 className="text-4xl font-black tracking-tight">新增客戶</h1>
          <p className="text-muted-foreground">建立新客戶檔案以管理其帳目</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6 bg-card border border-border p-6 rounded-3xl shadow-sm">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">客戶名稱</label>
              <input
                className="w-full bg-background border-2 border-border focus:border-primary focus:ring-0 p-4 rounded-2xl font-bold transition-all placeholder:text-muted-foreground/40"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="例如: 陳大文"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">聯絡資料</label>
              <input
                className="w-full bg-background border-2 border-border focus:border-primary focus:ring-0 p-4 rounded-2xl font-bold transition-all placeholder:text-muted-foreground/40"
                type="text"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                required
                placeholder="例如: WhatsApp / Signal"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white p-5 rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                處理中
              </>
            ) : "確認並建立客戶"}
          </button>
        </form>
      </div>
    </main>
  );
}
