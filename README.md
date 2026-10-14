# Dyrenes Madmission 🐰🐿️🐻🦊🦔

Et browserbaseret læringsspil på dansk for børn på 4–5 år. Barnet hjælper skovens dyr med at finde mad – og lærer tal, mængder, sammenligning, plus og minus undervejs.

## Kom i gang

```bash
npm install
npm run dev        # udviklingsserver
npm run build      # produktionsbuild i dist/ (kan lægges på enhver statisk webserver)
npm test           # enhedstests af opgavelogik, vurdering og fremdrift
npm run build:single  # hele spillet som én fil: dist/dyrenes-madmission.html
```

`build:single` samler spillet i én HTML-fil, der kan åbnes direkte i en browser (dobbeltklik) eller lægges op hvor som helst – uden server.

## Dyrene

| Dyr | Mad | Læringsområde | Vågner |
| --- | --- | --- | --- |
| Kaninen Kalle | Gulerødder (+ salat) | Tal 1–5 | Fra start |
| Egernet Ella | Nødder (+ agern) | Tal 1–10 | Fra start |
| Bjørnen Basse | Bær | Flest / færrest / lige mange | Efter 4 opgaver |
| Ræven Rasmus | Æbler | Plus inden for 10 | Efter 8 opgaver |
| Pindsvinet Palle | Svampe | Minus inden for 10 | Efter 12 opgaver |

Låste dyr *sover* (ingen hængelåse). Vælges et fast niveau i forældreområdet, vågner dyrene for det niveau med det samme.

## Pædagogisk design

- **Én opgave ad gangen**, læst op på dansk og vist med store tal, madikoner og (på trin 1) terningeprikker – barnet behøver ikke kunne læse.
- **Tryk eller træk**: Alt kan løses med tryk alene. Tryk på en genstand på tallerkenen for at lægge den tilbage.
- **Tælle-stemme**: "En … to … tre!" for hver genstand. Ved plus tælles der videre fra det, dyret allerede har.
- **Ingen straf**: Ingen tidspres, ingen negative lyde. Ved fejl siger dyret venligt "Skal vi tælle sammen?" og tæller genstandene med fremhævning. Efter anden fejl vises stiplede pladser som konkret hint.
- **Adaptivt**: 3 selvstændige succeser i træk → lidt sværere trin. 2 svære opgaver i træk → mere støtte. Fremskridt mistes aldrig.

## Arkitektur

```
src/
  game/        Ren logik (ingen React) – testet i game.test.ts
    types.ts       Opgavemodel (GiveTask / ChooseTask)
    animals.ts     Dyrenes data: mad, stemme, replikker, oplåsning
    generator.ts   Opgaveskabeloner pr. dyr og trin
    evaluate.ts    Vurdering af tallerkenen
    progress.ts    Fremdrift, adaptiv sværhedsgrad, localStorage
    danish.ts      Talord og bøjning ("én gulerod", "ét æble")
  audio/
    speech.ts      Dansk tale: indspillede filer → SpeechSynthesis → tekst-fallback
    sfx.ts         Bløde lydeffekter og musikdåse-musik (Web Audio, ingen filer)
  components/  Dyr, mad, kurv/tallerken (GiveBoard), skåle (ChooseBoard) m.m. – alt tegnet som SVG
  screens/     Velkomst, skovkort, spil, forældreområde
```

**Nyt dyr**: tilføj det i `animals.ts`, en generator-funktion i `generator.ts`, et udseende i `components/Animal.tsx` og et hjem i `components/Scenery.tsx`.

**Indspillede stemmer**: læg lydfiler i `public/audio/` og registrér dem med `registerClips({ 'Kan du give mig tre gulerødder?': 'audio/kalle-3.mp3' })` fra `audio/speech.ts`. Registrerede sætninger afspilles i stedet for talesyntesen.

## Dansk stemme

Spillet bruger browserens talesyntese, hvis der findes en dansk stemme. Uden dansk stemme fortsætter spillet uden tale – instruktionerne vises i taleboblen med tal og billeder. Forældreområdet viser, om en stemme er fundet, og har en "Test tale"-knap.

- iPad/iPhone: Indstillinger → Tilgængelighed → Oplæst indhold → Stemmer → Dansk
- Windows: Indstillinger → Tid og sprog → Tale → Tilføj stemmer → Dansk

## Forældreområde

Låsikonet øverst. Beskyttet af et gangestykke. Viser øvede tal (1–10) med andel løst i første forsøg, opgavetyper og dyrenes trin. Her kan man vælge sværhedsgrad (automatisk eller fast niveau 1–3), slå tale/lydeffekter/musik til og fra og nulstille fremdrift.
