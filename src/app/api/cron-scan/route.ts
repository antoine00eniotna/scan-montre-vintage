import { NextResponse } from 'next/server';
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export async function GET(req: Request) {
  // Sécurité pour vérifier que c'est bien Vercel qui appelle
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const querySnapshot = await getDocs(collection(db, "watches"));
    
    // On lance les scans pour chaque montre enregistrée
    for (const watchDoc of querySnapshot.docs) {
      const watch = watchDoc.data();
      
      // On appelle notre propre API de scan (en interne)
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/check-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: watch.url,
          watchName: watch.name,
          watchId: watchDoc.id
        })
      });
    }

    return NextResponse.json({ success: true, message: "Scan horaire terminé" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erreur cron" }, { status: 500 });
  }
}