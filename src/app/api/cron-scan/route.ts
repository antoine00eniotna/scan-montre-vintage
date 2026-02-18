import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { resend } from '@/lib/resend';
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from "firebase/firestore";

async function performScan(watchId: string, watchName: string, url: string) {
  console.log(`Scan lancé pour: ${watchName} (${watchId})`);
  try {
    let oldResults: string[] = [];
    const watchRef = doc(db, "watches", watchId);
    const watchSnap = await getDoc(watchRef);
    if (watchSnap.exists()) {
      oldResults = watchSnap.data().results || [];
    }

    const response = await fetch(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' },
      next: { revalidate: 0 } 
    });

    if (!response.ok) throw new Error(`Site injoignable: ${response.status}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    let allMatches: string[] = [];

    $('h1, h2, h3, p, span, a').each((_, el) => {
      const text = $(el).text().trim();
      if (text.toLowerCase().includes(watchName.toLowerCase()) && text.length > 2 && text.length < 150) {
        allMatches.push(text);
      }
    });

    const currentResults = Array.from(new Set(allMatches));
    const newItems = currentResults.filter(item => !oldResults.includes(item));

    await updateDoc(watchRef, {
      status: currentResults.length > 0 ? `Trouvé ! (${currentResults.length})` : 'Rien trouvé ❌',
      results: currentResults,
      lastScan: new Date().toISOString()
    });

    if (newItems.length > 0) {
      await resend.emails.send({
        from: 'WatchTracker <onboarding@resend.dev>',
        to: 'antoineaviles@gmail.com',
        subject: `🚨 NOUVEAUTÉ : ${watchName}`,
        html: `<h3>${newItems.length} nouveautés pour "${watchName}"</h3><ul>${newItems.map(m => `<li>${m}</li>`).join('')}</ul>`
      });
    }
    return true;
  } catch (err) {
    console.error("Erreur performScan:", err);
    return false;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const siteParam = searchParams.get('site');
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const q = query(collection(db, "watches"), where("site", "==", siteParam));
  const querySnapshot = await getDocs(q);
  for (const document of querySnapshot.docs) {
    const data = document.data();
    await performScan(document.id, data.name, data.url);
  }
  return NextResponse.json({ success: true });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("POST reçu:", body);
    const success = await performScan(body.watchId, body.watchName, body.url);
    return NextResponse.json({ success });
  } catch (error) {
    console.error("Erreur POST:", error);
    return NextResponse.json({ error: "Fail" }, { status: 500 });
  }
}