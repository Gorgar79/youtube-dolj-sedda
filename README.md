# Dölj sedda videor för YouTube

Chrome-tillägg (Manifest V3) som döljer videor du redan sett i YouTubes flöde **Prenumerationer**.

## Funktioner

- Döljer automatiskt videor som är sedda till minst en vald procentsats (standard 95 %).
- Dölj videor manuellt med en **Dölj**-knapp som visas när du håller muspekaren över en video.
- Inställningar i popup-fönstret:
  - Slå på/av automatisk döljning
  - Egen procentsats (1–100 %)
  - Visa/dölj "Dölj"-knappen
  - Gäller även startsidan
  - Visa dolda videor tonade (och ångra manuell döljning med **Visa igen**)
  - Rensa listan med manuellt dolda videor
- Följer webbläsarens språk: engelska (standard), svenska, norska, danska, finska, tyska, franska, spanska, italienska, nederländska, polska, portugisiska (Brasilien) och japanska.

## Installation

1. Ladda ner eller klona repot.
2. Öppna `chrome://extensions` och slå på **Utvecklarläge**.
3. Klicka på **Läs in okomprimerat** och välj mappen.

## Struktur

- `_locales/` – översättningar (lägg till ett språk genom att kopiera `en/messages.json`)
- `icons/` – logga som SVG och PNG
- `store/` – bilder och texter för Chrome Web Store (källfiler i `store/src/`)

## Bra att veta

- Kräver att YouTube-historiken är påslagen, eftersom tillägget läser av den röda "sett hittills"-stapeln på miniatyrerna.
- Om YouTube ändrar sin HTML kan selektorerna i `content.js` (`PROGRESS_SELECTOR`, `ITEM_SELECTOR`) behöva uppdateras.
