"use client";

import { useState } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  // Connexion avec Google (Le plus simple pour ton Pixel 10 Pro)
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/"); // Redirection vers le tracker après succès
    } catch (err: any) {
      setError("Erreur lors de la connexion Google");
    }
  };

  // Connexion classique Email/Mot de passe
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: any) {
      setError("Identifiants invalides");
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 selection:bg-blue-500/30">
      
      {/* HEADER STYLÉ */}
      <div className="mb-12 text-center space-y-3">
        <h1 className="text-5xl font-black tracking-tighter italic">
          WATCH <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-indigo-600 font-black">TRACKER</span>
        </h1>
        <p className="text-slate-500 text-xs uppercase tracking-[0.3em] font-bold">Accès Espace Membre</p>
      </div>

      {/* CARTE DE CONNEXION (Glassmorphism) */}
      <div className="w-full max-w-md p-8 bg-[#0a0a0a]/80 border border-white/5 rounded-[32px] backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
        <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-[32px] opacity-0 group-hover:opacity-100 transition duration-700 blur-md"></div>
        
        <form onSubmit={handleEmailLogin} className="relative space-y-6">
          {error && <p className="text-red-500 text-xs text-center font-bold uppercase tracking-widest">{error}</p>}
          
          <div className="space-y-4">
            <input 
              type="email" placeholder="Email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 outline-none focus:border-blue-500/50 transition-all text-sm"
              required
            />
            <input 
              type="password" placeholder="Mot de passe" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 outline-none focus:border-blue-500/50 transition-all text-sm"
              required
            />
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20 active:scale-95">
            Se Connecter
          </button>

          {/* SÉPARATEUR */}
          <div className="flex items-center gap-4 py-2">
            <div className="h-[1px] flex-1 bg-white/5"></div>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Ou continuer avec</span>
            <div className="h-[1px] flex-1 bg-white/5"></div>
          </div>

          {/* BOUTON GOOGLE PRÉMIUM */}
          <button 
            type="button" onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-2xl transition-all active:scale-95"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            <span className="text-xs font-bold tracking-widest uppercase">Google</span>
          </button>
        </form>
      </div>

      <footer className="mt-12 opacity-30">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em]">Tracker Cloud v2.0</p>
      </footer>
    </main>
  );
}