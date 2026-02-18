import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { resend } from '@/lib/resend';
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const { url, watchName, watchId } = await req.json();
    
    // 1. Étape B : On récupère les anciens résultats dans Firestore pour comparer
    let oldResults: string[] = [];
    if (watchId) {
      const watchRef = doc(db, "watches", watchId);
      const watchSnap = await getDoc(watchRef);
      if (watchSnap.exists()) {
        oldResults = watchSnap.data().results || [];
      }
    }

    let allMatches: string[] = [];
    const MAX_PAGES = 3; 
    let actualPagesScanned = 0;

    // 2. Étape A : Le robot scanne le site
    for (let p = 1; p <= MAX_PAGES; p++) {
      actualPagesScanned = p;
      const urlObj = new URL(url);
      urlObj.searchParams.set('page', p.toString());
      
      const response = await fetch(urlObj.toString(), { 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36' }
      });
      
      if (!response.ok) break;
      const html = await response.text();
      const $ = cheerio.load(html);
      
      let foundOnThisPage = 0;
      $('h1, h2, h3, p, span, a').each((_, el) => {
        const text = $(el).text().trim();
        if (
          text.toLowerCase().includes(watchName.toLowerCase()) && 
          text.length >= watchName.length && 
          text.length < 150
        ) {
          allMatches.push(text);
          foundOnThisPage++;
        }
      });

      if (foundOnThisPage === 0 && p === 1) break;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const currentResults = Array.from(new Set(allMatches));

    // 3. Étape C : On calcule la différence (uniquement les nouveaux titres)
    const newItems = currentResults.filter(item => !oldResults.includes(item));

    // 4. On met à jour Firestore systématiquement avec la nouvelle liste complète
    if (watchId) {
      const watchRef = doc(db, "watches", watchId);
      await updateDoc(watchRef, {
        status: currentResults.length > 0 ? `Trouvé ! (${currentResults.length})` : 'Rien trouvé ❌',
        results: currentResults,
        lastScan: new Date().toISOString()
      });
    }

    // 5. Étape D : On envoie un mail UNIQUEMENT s'il y a des nouveautés
    if (newItems.length > 0) {
      try {
        await resend.emails.send({
          from: 'WatchTracker <onboarding@resend.dev>',
          to: 'antoineaviles@gmail.com',
          subject: `🚨 NOUVEAUTÉ : ${watchName}`,
          html: `
            <h3>Nouvelles annonces détectées pour "${watchName}" :</h3>
            <ul>${newItems.map(m => `<li style="color: blue; font-weight: bold;">${m} (NOUVEAU)</li>`).join('')}</ul>
            <hr />
            <p>Anciennes annonces toujours en ligne :</p>
            <ul>${oldResults.map(m => `<li style="color: gray;">${m}</li>`).join('')}</ul>
            <p><a href="${url}">Voir sur le site</a></p>
          `
        });
      } catch (err) {
        console.error("Erreur email:", err);
      }
    }

    return NextResponse.json({ 
      status: newItems.length > 0 ? `🔥 ${newItems.length} nouveautés !` : 'Rien de neuf 😴',
      pagesCount: actualPagesScanned,
      results: currentResults,
      newItemsCount: newItems.length
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ status: 'Erreur technique ⚠️', results: [] }, { status: 500 });
  }
}