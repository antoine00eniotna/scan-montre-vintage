"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  deleteDoc, 
  doc, 
  updateDoc 
} from "firebase/firestore";

interface Watch {
  id?: string;
  name: string;
  url: string;
  status: string;
  results?: string[];
}

export default function Home() {
  const [watchName, setWatchName] = useState("");
  const [watchUrl, setWatchUrl] = useState("");
  const [watches, setWatches] = useState<Watch[]>([]);

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

  const addWatch = async () => {
    if (!watchName || !watchUrl) return;
    try {
      await addDoc(collection(db, "watches"), {
        name: watchName,
        url: watchUrl,
        status: "Prêt pour le scan 🔄",
        results: []
      });
      setWatchName("");
      setWatchUrl("");
    } catch (error) {
      console.error("Erreur d'ajout:", error);
    }
  };

  const scanWatch = async (watch: Watch) => {
    if (!watch.id) return;

    setWatches(prev => prev.map(w => w.id === watch.id ? { ...w, status: "Analyse en cours... 🔄" } : w));

    try {
      const response = await fetch("/api/check-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url: watch.url, 
          watchName: watch.name,
          watchId: watch.id // <--- CRUCIAL : On envoie l'identifiant pour la comparaison
        }),
      });

      const data = await response.json();
      // Le scan met déjà Firestore à jour, onSnapshot fera le reste pour l'écran.

    } catch (error) {
      console.error("Erreur scan:", error);
      setWatches(prev => prev.map(w => w.id === watch.id ? { ...w, status: "Erreur technique ⚠️" } : w));
    }
  };

  const deleteWatch = async (id: string) => {
    await deleteDoc(doc(db, "watches", id));
  };

  return (
    <main className="p-8 max-w-4xl mx-auto min-h-screen bg-black text-white">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent italic">
          ⌚ Watch Tracker Cloud
        </h1>
        <p className="text-gray-400 mt-2 text-sm italic">Surveillance intelligente activée.</p>
      </header>
      
      <section className="bg-gray-900 p-6 rounded-2xl border border-gray-800 mb-12 shadow-2xl">
        <div className="flex flex-col md:flex-row gap-4">
          <input 
            type="text" placeholder="Nom (ex: Constellation)" value={watchName}
            onChange={(e) => setWatchName(e.target.value)}
            className="flex-1 p-3 rounded-xl bg-black border border-gray-700 outline-none focus:border-blue-500 transition-all"
          />
          <input 
            type="text" placeholder="URL de recherche" value={watchUrl}
            onChange={(e) => setWatchUrl(e.target.value)}
            className="flex-1 p-3 rounded-xl bg-black border border-gray-700 outline-none focus:border-blue-500 transition-all"
          />
          <button onClick={addWatch} className="bg-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-900/20">
            Enregistrer
          </button>
        </div>
      </section>

      <div className="grid gap-6">
        {watches.map((watch) => (
          <div key={watch.id} className="p-6 bg-gray-900/40 rounded-2xl border border-gray-800 backdrop-blur-md">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-1">{watch.name}</h3>
                <a href={watch.url} target="_blank" className="text-[10px] text-blue-400 italic block hover:underline truncate max-w-md">
                  {watch.url}
                </a>
                
                {watch.results && watch.results.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {watch.results.map((res, i) => (
                      <span key={i} className="text-[10px] bg-blue-900/30 text-blue-300 px-3 py-1.5 rounded-lg border border-blue-800">
                        {res}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                  watch.status.includes('🔥') || watch.status.includes('✅')
                    ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}>
                  {watch.status}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => scanWatch(watch)} className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-5 py-2 rounded-xl text-xs font-bold hover:bg-blue-600/40">
                    Scanner
                  </button>
                  <button onClick={() => deleteWatch(watch.id!)} className="bg-red-600/10 text-red-500 border border-red-500/20 px-5 py-2 rounded-xl text-xs hover:bg-red-600/20">
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}