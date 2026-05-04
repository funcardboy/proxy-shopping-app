import React from "react";

export default function TestOCR() {
  const detectedItems = [
    { name: "「ラウンドワン×アイドルマスター」アクリルスタンド 市川雛菜", price: 1760, selected: true },
    { name: "シャニマス大感謝祭！ 公式ミニアクリルスタンド 【市川雛菜】", price: 900, selected: true },
    { name: "シャニマス大感謝祭！ 公式ミニアクリルスタンド 【郁田はるき】", price: 900, selected: true },
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-6 font-sans">
      <div className="max-w-lg mx-auto">
        <header className="mb-8">
          <div className="inline-flex items-center gap-1 text-sm font-bold text-zinc-500 mb-4">
            <span className="w-4 h-4 border-l-2 border-b-2 border-zinc-500 -rotate-45 mb-0.5 ml-1"></span>
            取消並返回
          </div>
          <h1 className="text-4xl font-black tracking-tight">新增貨品</h1>
          <p className="text-zinc-400">可上傳收據自動識別多項貨品</p>
        </header>

        <section className="mb-8">
          <div className="border-2 border-dashed border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 bg-zinc-900/50">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
            <div className="text-center">
              <span className="font-black text-sm block text-zinc-200">點擊上傳或拍攝收據</span>
              <span className="text-xs text-zinc-500">自動識別多項貨品名稱及金額</span>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">識別結果 ({detectedItems.length})</h3>
              <button className="text-[10px] font-bold text-red-500 uppercase">清除全部</button>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800 shadow-sm">
              {detectedItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4">
                  <div className="w-5 h-5 rounded-md border-2 border-blue-500 bg-blue-500 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="w-full bg-transparent border-none p-0 font-bold text-sm text-zinc-100 truncate">
                      {item.name}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 font-black tabular-nums text-blue-400">
                    <span className="text-xs opacity-60">JPY</span>
                    <div className="text-right font-black">
                      {item.price}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full bg-emerald-600 text-white p-4 rounded-2xl font-black shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2">
              確認並批量新增 {detectedItems.length} 件貨品
            </button>
          </div>
        </section>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-800"></span></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0a0a0a] px-4 text-zinc-500 font-black tracking-widest">或手動輸入單件</span></div>
        </div>
      </div>
    </main>
  );
}
