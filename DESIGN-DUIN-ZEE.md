# Duin & Zee · grafische update

Warm strandzand, afdrukken van wandelschoenen langs het strand, natuurlijke schelpen, helmgras en een klein stukje drijfhout. Zeeblauwe navigatie, klassieke koppen en rustige leesvlakken behouden. De inhoud en opslaglogica zijn ongewijzigd.

## Behoud origineel

`minimal` blijft Duin & Zee en krijgt de nieuwe uitstraling. `minimal-classic` is Duin & Zee — origineel, rechtstreeks selecteerbaar en ondersteund in de export. Extra ongewijzigde broncodekopieën staan in `theme-backups/duin-zee-original/`.

## Achtergrond

`assets/images/duin-zee-strand-v2.webp`, 1536 × 1024, ongeveer 165 KiB. Gemaakt met de ingebouwde imagegen-tool en als WebP gecodeerd voor de website.

Definitieve bewerkingsprompt: behoud warm licht strandzand, schelpen, helmgras en drijfhout, met een brede lege centrale en linkerzone. Vervang alle blote voetafdrukken door afdrukken van wandelschoenen met duidelijke hiel en grof zoolprofiel, afwisselend links en rechts, ongeveer 12–16 afdrukken. Laat het spoor vanaf rechtsonder langs de rechterrand lopen en bovenaan links afbuigen over droog zand, parallel aan de kustlijn en met onbetreden zand tussen spoor en water. Alleen een klein zeegedeelte rechtsboven. Geen mensen, tekst of interface.

## Controle

Lokale ontwerpvoorvertoning op 1440 × 1000, 834 × 1112 en 390 × 844; leesvlakken en foto beoordeeld, geen horizontale pagina-overloop. Mobiel menu opent en sluit bij navigatie. Terugschakelen naar het origineel gecontroleerd. Oorspronkelijke CSS-inhoud vergeleken met de back-up: alleen de themaselectors zijn uitgebreid. JavaScript-syntax en diff gecontroleerd.

De lokale preview gebruikt de openbare profielfoto en lokale basisinhoud. Geen productie-inlog-, database-opslag- of export-downloadtest uitgevoerd. Print/export gebruikt rustige kleurvlakken om de tekst helder te houden. Dit ontwerp is nog niet live gepubliceerd.

## Verfijning na ontwerpfeedback

Het introductievlak gebruikt nu `assets/images/duin-zee-hero-v2.webp`: dezelfde strandillustratie, maar zonder voetstappen. Schelpen en drijfhout blijven staan. De voetstappen blijven uitsluitend op de pagina-achtergrond, zodat er geen dubbel spoor ontstaat. De schelpillustratie is vervangen door een fijnere eigen SVG met zachte parelkleuren en dunne ribben, kleiner en iets naar links geplaatst. Het oorspronkelijke thema is ongewijzigd.

Deze aanvullende afbeelding is met de ingebouwde imagegen-tool bewerkt. Prompt: verwijder alle schoenafdrukken en vul hun plaats met natuurlijk onbetreden licht zand; behoud schelpen, drijfhout, helmgras, water, licht en compositie. Geen nieuwe objecten, mensen, tekst of afdrukken.

De twee getekende schelpen zijn teruggebracht. De onderkant heeft nu een korte, brede scharnierrand met zijdelingse schelporen, zonder steeltje. De groep staat op desktop 4 CSS-cm (ongeveer 151 pixels) verder naar links; de kleine schelp is extra gedraaid en valt deels achter de titel. Mobiel is de verschuiving aangepast aan de beschikbare breedte.
