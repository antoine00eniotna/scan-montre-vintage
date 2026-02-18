"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  deleteDoc, 
  doc 
} from "firebase/firestore";

interface Watch {
  id?: string;
  name: string;
  url: string;
  site: string;
  status: string;
  results?: string[];
}

export default function Home() {
  const [watchName, setWatchName] = useState("");
  const [watchUrl, setWatchUrl] = useState("");
  const [site, setSite] = useState("");
  const [watches, setWatches] = useState<Watch[]>([]);

  // 1. Écoute en temps réel de la base Firestore
  useEffect(() => {
    const q = query(collection(db, "watches"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const watchesArray: Watch[] = [];
      querySnapshot.forEach((doc) => {
        watchesArray.push({ ...doc.data(), id: doc.id } as Watch);
      });
      setWatches(watchesArray);
    });
    return () => unsubscribe();
  }, []);

  // 2. Ajouter une nouvelle montre
  const addWatch = async () => {
    if (!watchName || !watchUrl || !site) return;
    try {
      await addDoc(collection(db, "watches"), {
        name: watchName,
        url: watchUrl,
        site: site,
        status: "Prêt pour le scan 🔄",
        results: []
      });
      setWatchName("");
      setWatchUrl("");
      setSite("");
    } catch (error) {
      console.error("Erreur d'ajout:", error);
    }
  };

  // 3. Lancer un scan manuel
  const scanWatch = async (watch: Watch) => {
    if (!watch.id) return;

    // Feedback visuel immédiat sur l'écran
    setWatches(prev => prev.map(w => 
      w.id === watch.id ? { ...w, status: "Analyse en cours... 🔄" } : w
    ));

    try {
      const response = await fetch("/api/cron-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url: watch.url, 
          watchName: watch.name,
          watchId: watch.id 
        }),
      });

      if (!response.ok) throw new Error("Erreur serveur");
    } catch (error) {
      console.error("Erreur scan:", error);
      setWatches(prev => prev.map(w => 
        w.id === watch.id ? { ...w, status: "Erreur technique ⚠️" } : w
      ));
    }
  };

  // 4. Supprimer une montre
  const deleteWatch = async (id: string) => {
    await deleteDoc(doc(db, "watches", id));
  };

  return (
    <main className="p-4 md:p-12 max-w-6xl mx-auto min-h-screen bg-[#050505] text-slate-200 selection:bg-blue-500/30 font-sans">
      
      {/* HEADER SECTION - Look Futuriste */}
      <header className="mb-16 text-center space-y-4">
        <div className="inline-block px-4 py-1.5 mb-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold tracking-[0.3em] uppercase animate-pulse">
          Network Scanning Active
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white italic">
          WATCH <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-indigo-600">TRACKER</span>
        </h1>
        <p className="text-slate-500 font-medium tracking-widest text-xs uppercase italic">Surveillance intelligente activée.</p>
      </header>
      
      {/* FORMULAIRE PREMIUM - Glassmorphism */}
      <section className="relative group mb-24">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-10 group-hover:opacity-25 transition duration-1000"></div>
        <div className="relative flex flex-col md:flex-row gap-4 p-3 bg-[#0a0a0a]/80 border border-white/5 rounded-2xl backdrop-blur-2xl shadow-2xl">
          <input 
            type="text" placeholder="Modèle (ex: Constellation)" value={watchName}
            onChange={(e) => setWatchName(e.target.value)}
            className="flex-1 p-4 rounded-xl bg-white/5 border border-white/5 outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all placeholder:text-slate-600 text-sm"
          />
          <input 
            type="text" placeholder="Site (ex: Victor)" value={site}
            onChange={(e) => setSite(e.target.value)}
            className="w-full md:w-36 p-4 rounded-xl bg-white/5 border border-white/5 outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all placeholder:text-slate-600 uppercase text-xs font-bold tracking-widest text-center"
          />
          <input 
            type="text" placeholder="URL de recherche" value={watchUrl}
            onChange={(e) => setWatchUrl(e.target.value)}
            className="flex-[2] p-4 rounded-xl bg-white/5 border border-white/5 outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all placeholder:text-slate-600 text-sm"
          />
          <button onClick={addWatch} className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] active:scale-95">
            Enregistrer
          </button>
        </div>
      </section>

      {/* GRILLE DE RÉSULTATS - Style OLED */}
      <div className="grid grid-cols-1 gap-10">
        {watches.map((watch) => (
          <div key={watch.id} className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-[32px] opacity-0 group-hover:opacity-100 transition duration-500 blur-md"></div>
            
            <div className="relative p-8 bg-[#0c0c0c] border border-white/5 rounded-[30px] shadow-2xl transition-all duration-500 group-hover:bg-[#0e0e0e] group-hover:border-white/10">
              
              <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-3xl font-bold text-white tracking-tight">{watch.name}</h3>
                    <span className="px-3 py-1 bg-blue-500/5 border border-blue-500/20 rounded-lg text-[10px] font-black text-blue-400 tracking-[0.15em] uppercase">
                      {watch.site}
                    </span>
                  </div>
                  
                  <a href={watch.url} target="_blank" className="inline-flex items-center text-[11px] font-medium text-slate-500 hover:text-blue-400 transition-colors gap-2">
                    <span className="truncate max-w-[250px] md:max-w-md italic">{watch.url}</span>
                    <span className="text-[8px] opacity-40">↗</span>
                  </a>

                  {watch.results && watch.results.length > 0 && (
                    <div className="mt-8 flex flex-wrap gap-2.5">
                      {watch.results.map((res, i) => (
                        <span key={i} className="text-[10px] font-medium bg-blue-500/5 text-blue-300/90 px-4 py-2 rounded-xl border border-blue-500/10 hover:border-blue-500/40 hover:bg-blue-500/10 transition-all cursor-default shadow-sm">
                          {res}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-5 w-full md:w-auto pt-6 md:pt-0 border-t border-white/5 md:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      watch.status.includes('Trouvé') || watch.status.includes('🔥') 
                      ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]' 
                      : 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]'
                    }`} />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                      {watch.status}
                    </span>
                  </div>
                  
                  <div className="flex gap-3">
                    <button onClick={() => scanWatch(watch)} className="px-7 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95">
                      Scanner
                    </button>
                    <button onClick={() => deleteWatch(watch.id!)} className="px-7 py-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-500/60 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all">
                      Retirer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}