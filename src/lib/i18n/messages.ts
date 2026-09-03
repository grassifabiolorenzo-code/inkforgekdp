import type { Locale } from "./config";

/**
 * Dizionari dell'interfaccia. Chiavi piatte, `{var}` per le interpolazioni.
 * L'italiano è la lingua di riferimento: ogni chiave presente qui deve esistere
 * anche nelle altre lingue (il tipo lo garantisce).
 */
const it = {
  "nav.home": "Home",
  "nav.pricing": "Prezzi",
  "nav.demo": "Prova gratis",
  "nav.faq": "FAQ",
  "nav.dashboard": "Dashboard",
  "nav.login": "Accedi",
  "nav.signup": "Inizia ora",
  "nav.menu": "Apri menu",
  "nav.register": "Registrati",
  "lang.label": "Lingua",
  "lang.interface": "Lingua dell'interfaccia",

  "hero.eyebrow": "Suite professionale per editori KDP",
  "hero.headline1": "Pubblica su KDP più velocemente",
  "hero.headline2": "con qualità da studio editoriale",
  "hero.sub":
    "InkForgeKdp riunisce copertine, listing, contenuti A+, triage immagini, impaginazione interni, blurb, bio autore e kit promozionali in un'unica piattaforma. Un solo abbonamento, otto strumenti, zero software da installare.",
  "hero.cta1": "Inizia ora",
  "hero.cta2": "Scopri i piani",
  "hero.badge1": "Interfaccia e contenuti in 7 lingue",
  "hero.badge2": "Cancelli quando vuoi",

  "tools.badge": "Gli 8 tool della piattaforma",
  "tools.title1": "Otto strumenti,",
  "tools.title2": "un solo flusso di lavoro",
  "tools.sub":
    "Ogni tool genera contenuti nella lingua che scegli. Cambia soltanto il numero di utilizzi mensili incluso nel piano.",
  "tools.slot": "Tool {n}",
  "tools.cost": "Consumo: 1 credito — {event}.",
  "tools.more": "Scopri di più",

  "footer.tagline":
    "La suite completa per chi pubblica e vende su Amazon: dalla copertina alla promozione, in un unico abbonamento.",
  "footer.product": "Prodotto",
  "footer.account": "Account",
  "footer.legal": "Legale",
  "footer.privacy": "Privacy Policy",
  "footer.terms": "Termini e condizioni",
  "footer.status": "Stato del sistema",
  "footer.rights": "Tutti i diritti riservati.",
  "footer.cookiePrefs": "Preferenze cookie",

  "consent.title": "La tua privacy",
  "consent.description":
    "Usiamo strumenti di analisi opzionali (PostHog, Google Analytics) per capire come viene usato il sito. Restano spenti finché non acconsenti.",
  "consent.accept": "Accetta",
  "consent.reject": "Rifiuta",
  "consent.privacyLink": "Informativa privacy",

  "newsletter.title": "Resta aggiornato",
  "newsletter.subtitle":
    "Novità sui tool, consigli per pubblicare su Amazon KDP e qualche offerta riservata a chi è in lista. Niente spam, puoi disiscriverti quando vuoi.",
  "newsletter.placeholder": "La tua email",
  "newsletter.cta": "Iscrivimi",
  "newsletter.consent":
    "Acconsento a ricevere email promozionali da InkForgeKdp. Posso disiscrivermi in qualsiasi momento.",
  "newsletter.success": "Fatto! Controlla la tua casella di posta.",
  "newsletter.error": "Iscrizione non riuscita. Riprova tra qualche istante.",

  "chat.openLabel": "Apri l'assistente di aiuto",
  "chat.title": "Assistente InkForgeKdp",
  "chat.greeting":
    "Ciao! Sono l'assistente di InkForgeKdp. Chiedimi qualsiasi cosa sui tool, i piani o il tuo account.",
  "chat.placeholder": "Scrivi un messaggio…",
  "chat.send": "Invia",
  "chat.typing": "Sto scrivendo…",
  "chat.disclaimer": "Le risposte sono generate automaticamente e riguardano solo InkForgeKdp.",
  "chat.error": "Non riesco a rispondere proprio adesso. Riprova tra poco.",

  "dash.dashboard": "Dashboard",
  "dash.tools": "Tool",
  "dash.account": "Account",
  "dash.usage": "Utilizzo",
  "dash.subscription": "Il mio abbonamento",
  "dash.referral": "Referral",
  "dash.profile": "Profilo",
  "dash.projects": "Progetti libro",
  "dash.settings": "Impostazioni",
  "dash.logout": "Logout",
  "dash.back": "Torna alla dashboard",
  "dash.unlimited": "Illimitato",
  "dash.credits": "{n} crediti",
  "dash.creditEvent": "1 credito — {event}",

  "output.label": "Lingua dei contenuti generati",
  "output.hint": "I testi e i file prodotti dal tool useranno questa lingua.",
  "output.sameAsUi": "Come l'interfaccia",
  "output.notSupported": "Non disponibile in questa lingua: si usa l'inglese.",

  "tool.copertine.name": "Copertine",
  "tool.copertine.desc":
    "Editor di copertine KDP con guide bleed, dorso e margini di sicurezza, testi e effetti tipografici.",
  "tool.copertine.benefit":
    "Copertine pronte per KDP senza software esterni, con export in alta risoluzione.",
  "tool.copertine.event": "Esportazione immagine completata",

  "tool.pubblicazione.name": "Pubblicazione",
  "tool.pubblicazione.desc":
    "Generatore di listing KDP: titolo, sottotitolo, descrizione, keyword e categorie ottimizzate.",
  "tool.pubblicazione.benefit":
    "Schede prodotto complete e conformi in pochi secondi, pronte da incollare su KDP.",
  "tool.pubblicazione.event": "Ogni generazione completata",

  "tool.aplus.name": "A+ KDPstudio",
  "tool.aplus.desc":
    "Costruttore di contenuti A+ multilingua a partire da copertina, interno e logo del brand.",
  "tool.aplus.benefit": "Contenuti A+ professionali e multilingua senza designer.",
  "tool.aplus.event": "Ogni generazione completata",

  "tool.triage.name": "Triage",
  "tool.triage.desc":
    "Analisi rapida delle immagini per KDP: DPI, dimensioni, qualità e smistamento automatico.",
  "tool.triage.benefit":
    "Scarti le immagini inutilizzabili prima dell'impaginazione e risparmi ore di lavoro.",
  "tool.triage.event": "Download completato delle 3 cartelle",

  "tool.interni.name": "Interni",
  "tool.interni.desc":
    "Impagina le tue immagini in un PDF interno pronto per KDP: formato pagina, margini e bleed corretti, ridimensionamento automatico.",
  "tool.interni.benefit":
    "Un unico PDF interno pronto da caricare su KDP, senza passare da altri programmi di impaginazione.",
  "tool.interni.event": "Ogni PDF interno generato con successo",

  "tool.blurb.name": "Blurb & Sinossi",
  "tool.blurb.desc":
    "Genera quarta di copertina, sinossi ed editorial blurb per narrativa e saggistica, in qualsiasi genere e tono.",
  "tool.blurb.benefit":
    "Testi di vendita pronti per libri di narrativa e saggistica, non solo coloring e activity book.",
  "tool.blurb.event": "Ogni generazione completata",

  "tool.bio.name": "Bio Autore & Kit Stampa",
  "tool.bio.desc":
    "Genera bio autore (breve, media, lunga) per Amazon Author Central e siti, più comunicato stampa di lancio libro.",
  "tool.bio.benefit":
    "Presentati in modo professionale su Amazon, sito e stampa senza scrivere da zero ogni volta.",
  "tool.bio.event": "Ogni generazione completata",

  "tool.promo.name": "Social & Ads Promo Kit",
  "tool.promo.desc":
    "Genera post social multi-piattaforma, headline/bullet per Amazon Ads ed email di lancio per promuovere il libro.",
  "tool.promo.benefit":
    "Materiale di lancio pronto in pochi secondi, coerente su tutti i canali di promozione.",
  "tool.promo.event": "Ogni generazione completata",

  "triage.approved": "Promossa",
  "triage.review": "Rimandata",
  "triage.rejected": "Bocciata",
} as const;

export type MessageKey = keyof typeof it;
type Dictionary = Record<MessageKey, string>;

const en: Dictionary = {
  "nav.home": "Home",
  "nav.pricing": "Pricing",
  "nav.demo": "Free preview",
  "nav.faq": "FAQ",
  "nav.dashboard": "Dashboard",
  "nav.login": "Sign in",
  "nav.signup": "Get started",
  "nav.menu": "Open menu",
  "nav.register": "Sign up",
  "lang.label": "Language",
  "lang.interface": "Interface language",

  "hero.eyebrow": "Professional suite for KDP publishers",
  "hero.headline1": "Publish on KDP faster",
  "hero.headline2": "with publishing-studio quality",
  "hero.sub":
    "InkForgeKdp brings covers, listings, A+ content, image triage, interior layout, blurbs, author bios and promo kits together in one platform. One subscription, eight tools, no software to install.",
  "hero.cta1": "Get started",
  "hero.cta2": "See the plans",
  "hero.badge1": "Interface and content in 7 languages",
  "hero.badge2": "Cancel anytime",

  "tools.badge": "The 8 platform tools",
  "tools.title1": "Eight tools,",
  "tools.title2": "one single workflow",
  "tools.sub":
    "Every tool generates content in the language you choose. Only the number of monthly uses changes between plans.",
  "tools.slot": "Tool {n}",
  "tools.cost": "Usage: 1 credit — {event}.",
  "tools.more": "Learn more",

  "footer.tagline":
    "The complete toolkit for anyone publishing and selling on Amazon: from cover to promotion, in one subscription.",
  "footer.product": "Product",
  "footer.account": "Account",
  "footer.legal": "Legal",
  "footer.privacy": "Privacy Policy",
  "footer.terms": "Terms and conditions",
  "footer.status": "System status",
  "footer.rights": "All rights reserved.",
  "footer.cookiePrefs": "Cookie preferences",

  "consent.title": "Your privacy",
  "consent.description":
    "We use optional analytics tools (PostHog, Google Analytics) to understand how the site is used. They stay off until you consent.",
  "consent.accept": "Accept",
  "consent.reject": "Reject",
  "consent.privacyLink": "Privacy policy",

  "newsletter.title": "Stay in the loop",
  "newsletter.subtitle":
    "Tool updates, tips for publishing on Amazon KDP, and the occasional offer for our list. No spam, unsubscribe anytime.",
  "newsletter.placeholder": "Your email",
  "newsletter.cta": "Subscribe",
  "newsletter.consent":
    "I agree to receive promotional emails from InkForgeKdp. I can unsubscribe at any time.",
  "newsletter.success": "Done! Check your inbox.",
  "newsletter.error": "Sign-up failed. Please try again shortly.",

  "chat.openLabel": "Open the help assistant",
  "chat.title": "InkForgeKdp Assistant",
  "chat.greeting":
    "Hi! I'm the InkForgeKdp assistant. Ask me anything about the tools, plans, or your account.",
  "chat.placeholder": "Type a message…",
  "chat.send": "Send",
  "chat.typing": "Typing…",
  "chat.disclaimer": "Answers are generated automatically and cover InkForgeKdp only.",
  "chat.error": "I can't answer right now. Please try again shortly.",

  "dash.dashboard": "Dashboard",
  "dash.tools": "Tools",
  "dash.account": "Account",
  "dash.usage": "Usage",
  "dash.subscription": "My subscription",
  "dash.referral": "Referral",
  "dash.profile": "Profile",
  "dash.projects": "Book projects",
  "dash.settings": "Settings",
  "dash.logout": "Log out",
  "dash.back": "Back to dashboard",
  "dash.unlimited": "Unlimited",
  "dash.credits": "{n} credits",
  "dash.creditEvent": "1 credit — {event}",

  "output.label": "Language of generated content",
  "output.hint": "Texts and files produced by the tool will use this language.",
  "output.sameAsUi": "Same as interface",
  "output.notSupported": "Not available in this language: English will be used.",

  "tool.copertine.name": "Covers",
  "tool.copertine.desc":
    "KDP cover editor with bleed, spine and safety-margin guides, text and typographic effects.",
  "tool.copertine.benefit":
    "KDP-ready covers without external software, exported in high resolution.",
  "tool.copertine.event": "Image export completed",

  "tool.pubblicazione.name": "Publishing",
  "tool.pubblicazione.desc":
    "KDP listing generator: title, subtitle, description, keywords and optimized categories.",
  "tool.pubblicazione.benefit":
    "Complete, compliant product pages in seconds, ready to paste into KDP.",
  "tool.pubblicazione.event": "Each completed generation",

  "tool.aplus.name": "A+ KDPstudio",
  "tool.aplus.desc":
    "Multilingual A+ content builder starting from your cover, interior and brand logo.",
  "tool.aplus.benefit": "Professional multilingual A+ content without a designer.",
  "tool.aplus.event": "Each completed generation",

  "tool.triage.name": "Triage",
  "tool.triage.desc":
    "Fast image analysis for KDP: DPI, dimensions, quality and automatic sorting.",
  "tool.triage.benefit": "Discard unusable images before layout and save hours of work.",
  "tool.triage.event": "Download of the 3 folders completed",

  "tool.interni.name": "Interior Builder",
  "tool.interni.desc":
    "Lay out your images into a KDP-ready interior PDF: correct page size, margins and bleed, automatic image resizing.",
  "tool.interni.benefit":
    "One single interior PDF ready to upload to KDP, no other layout software needed.",
  "tool.interni.event": "Each interior PDF successfully generated",

  "tool.blurb.name": "Blurb & Synopsis",
  "tool.blurb.desc":
    "Generate back-cover copy, synopsis and editorial blurb for fiction and non-fiction, in any genre and tone.",
  "tool.blurb.benefit":
    "Ready-to-use sales copy for fiction and non-fiction books, not just coloring and activity books.",
  "tool.blurb.event": "Each completed generation",

  "tool.bio.name": "Author Bio & Press Kit",
  "tool.bio.desc":
    "Generate author bios (short, medium, long) for Amazon Author Central and websites, plus a book launch press release.",
  "tool.bio.benefit":
    "Present yourself professionally on Amazon, your website and the press without starting from scratch every time.",
  "tool.bio.event": "Each completed generation",

  "tool.promo.name": "Social & Ads Promo Kit",
  "tool.promo.desc":
    "Generate multi-platform social posts, Amazon Ads headlines/bullets and a launch email to promote your book.",
  "tool.promo.benefit":
    "Launch material ready in seconds, consistent across every promotion channel.",
  "tool.promo.event": "Each completed generation",

  "triage.approved": "Approved",
  "triage.review": "Review",
  "triage.rejected": "Rejected",
};

const de: Dictionary = {
  "nav.home": "Start",
  "nav.pricing": "Preise",
  "nav.demo": "Kostenlos testen",
  "nav.faq": "FAQ",
  "nav.dashboard": "Dashboard",
  "nav.login": "Anmelden",
  "nav.signup": "Jetzt starten",
  "nav.menu": "Menü öffnen",
  "nav.register": "Registrieren",
  "lang.label": "Sprache",
  "lang.interface": "Sprache der Oberfläche",

  "hero.eyebrow": "Professionelle Suite für KDP-Verlage",
  "hero.headline1": "Schneller auf KDP veröffentlichen",
  "hero.headline2": "mit Qualität wie im Verlagsstudio",
  "hero.sub":
    "InkForgeKdp vereint Cover, Listings, A+ Inhalte, Bild-Triage, Amazon-Marketplace-Listings, Klappentexte, Autoren-Bios und Promo-Kits in einer Plattform. Ein Abo, acht Tools, keine Installation.",
  "hero.cta1": "Jetzt starten",
  "hero.cta2": "Tarife ansehen",
  "hero.badge1": "Oberfläche und Inhalte in 7 Sprachen",
  "hero.badge2": "Jederzeit kündbar",

  "tools.badge": "Die 8 Tools der Plattform",
  "tools.title1": "Acht Werkzeuge,",
  "tools.title2": "ein einziger Workflow",
  "tools.sub":
    "Jedes Tool erzeugt Inhalte in der Sprache deiner Wahl. Zwischen den Tarifen ändert sich nur die Anzahl der monatlichen Nutzungen.",
  "tools.slot": "Tool {n}",
  "tools.cost": "Verbrauch: 1 Guthaben — {event}.",
  "tools.more": "Mehr erfahren",

  "footer.tagline":
    "Das komplette Toolkit für alle, die auf Amazon veröffentlichen und verkaufen: vom Cover bis zur Promotion, in einem Abo.",
  "footer.product": "Produkt",
  "footer.account": "Konto",
  "footer.legal": "Rechtliches",
  "footer.privacy": "Datenschutz",
  "footer.terms": "AGB",
  "footer.status": "Systemstatus",
  "footer.rights": "Alle Rechte vorbehalten.",
  "footer.cookiePrefs": "Cookie-Einstellungen",

  "consent.title": "Deine Privatsphäre",
  "consent.description":
    "Wir verwenden optionale Analysetools (PostHog, Google Analytics), um zu verstehen, wie die Website genutzt wird. Sie bleiben deaktiviert, bis du zustimmst.",
  "consent.accept": "Akzeptieren",
  "consent.reject": "Ablehnen",
  "consent.privacyLink": "Datenschutzerklärung",

  "newsletter.title": "Bleib auf dem Laufenden",
  "newsletter.subtitle":
    "Neuigkeiten zu den Tools, Tipps zur Veröffentlichung auf Amazon KDP und gelegentliche Angebote für unsere Liste. Kein Spam, jederzeit abbestellbar.",
  "newsletter.placeholder": "Deine E-Mail",
  "newsletter.cta": "Anmelden",
  "newsletter.consent":
    "Ich bin einverstanden, Werbe-E-Mails von InkForgeKdp zu erhalten. Ich kann mich jederzeit abmelden.",
  "newsletter.success": "Erledigt! Schau in dein Postfach.",
  "newsletter.error": "Anmeldung fehlgeschlagen. Bitte versuche es in Kürze erneut.",

  "chat.openLabel": "Hilfeassistenten öffnen",
  "chat.title": "InkForgeKdp-Assistent",
  "chat.greeting":
    "Hallo! Ich bin der InkForgeKdp-Assistent. Frag mich alles zu den Tools, den Plänen oder deinem Konto.",
  "chat.placeholder": "Nachricht schreiben…",
  "chat.send": "Senden",
  "chat.typing": "Schreibt…",
  "chat.disclaimer":
    "Antworten werden automatisch generiert und betreffen ausschließlich InkForgeKdp.",
  "chat.error": "Ich kann gerade nicht antworten. Bitte versuche es in Kürze erneut.",

  "dash.dashboard": "Dashboard",
  "dash.tools": "Tools",
  "dash.account": "Konto",
  "dash.usage": "Nutzung",
  "dash.subscription": "Mein Abo",
  "dash.referral": "Referral",
  "dash.profile": "Profil",
  "dash.projects": "Buchprojekte",
  "dash.settings": "Einstellungen",
  "dash.logout": "Abmelden",
  "dash.back": "Zurück zum Dashboard",
  "dash.unlimited": "Unbegrenzt",
  "dash.credits": "{n} Guthaben",
  "dash.creditEvent": "1 Guthaben — {event}",

  "output.label": "Sprache der generierten Inhalte",
  "output.hint": "Texte und Dateien des Tools werden in dieser Sprache erstellt.",
  "output.sameAsUi": "Wie die Oberfläche",
  "output.notSupported": "In dieser Sprache nicht verfügbar: Englisch wird verwendet.",

  "tool.copertine.name": "Cover",
  "tool.copertine.desc":
    "KDP-Cover-Editor mit Beschnitt-, Rücken- und Sicherheitsrand-Hilfslinien, Text und Typo-Effekten.",
  "tool.copertine.benefit": "KDP-fertige Cover ohne Zusatzsoftware, Export in hoher Auflösung.",
  "tool.copertine.event": "Bildexport abgeschlossen",

  "tool.pubblicazione.name": "Veröffentlichung",
  "tool.pubblicazione.desc":
    "KDP-Listing-Generator: Titel, Untertitel, Beschreibung, Keywords und optimierte Kategorien.",
  "tool.pubblicazione.benefit":
    "Vollständige, konforme Produktseiten in Sekunden, fertig zum Einfügen in KDP.",
  "tool.pubblicazione.event": "Jede abgeschlossene Generierung",

  "tool.aplus.name": "A+ KDPstudio",
  "tool.aplus.desc":
    "Mehrsprachiger A+ Content-Builder auf Basis von Cover, Innenteil und Marken-Logo.",
  "tool.aplus.benefit": "Professionelle mehrsprachige A+ Inhalte ohne Designer.",
  "tool.aplus.event": "Jede abgeschlossene Generierung",

  "tool.triage.name": "Triage",
  "tool.triage.desc":
    "Schnelle Bildanalyse für KDP: DPI, Abmessungen, Qualität und automatische Sortierung.",
  "tool.triage.benefit": "Unbrauchbare Bilder vor dem Layout ausschließen und Stunden sparen.",
  "tool.triage.event": "Download der 3 Ordner abgeschlossen",

  "tool.interni.name": "Innenseiten",
  "tool.interni.desc":
    "Layoutet deine Bilder zu einer KDP-tauglichen Innenseiten-PDF: korrektes Seitenformat, Ränder und Anschnitt, automatische Größenanpassung.",
  "tool.interni.benefit":
    "Eine einzige Innenseiten-PDF, bereit für den Upload zu KDP, ohne weitere Layout-Software.",
  "tool.interni.event": "Jede erfolgreich erstellte Innenseiten-PDF",

  "tool.blurb.name": "Klappentext & Synopse",
  "tool.blurb.desc":
    "Erstellt Klappentext, Synopse und redaktionellen Blurb für Belletristik und Sachbücher, in jedem Genre und Ton.",
  "tool.blurb.benefit":
    "Verkaufstexte für Belletristik und Sachbücher, nicht nur für Malbücher und Activity Books.",
  "tool.blurb.event": "Jede abgeschlossene Generierung",

  "tool.bio.name": "Autoren-Bio & Presse-Kit",
  "tool.bio.desc":
    "Erstellt Autoren-Bios (kurz, mittel, lang) für Amazon Author Central und Websites sowie eine Pressemitteilung zum Buchstart.",
  "tool.bio.benefit":
    "Präsentiere dich professionell auf Amazon, deiner Website und in der Presse, ohne jedes Mal neu zu schreiben.",
  "tool.bio.event": "Jede abgeschlossene Generierung",

  "tool.promo.name": "Social & Ads Promo-Kit",
  "tool.promo.desc":
    "Erstellt Social-Media-Posts für mehrere Plattformen, Amazon-Ads-Überschriften/Bullets und eine Launch-E-Mail für dein Buch.",
  "tool.promo.benefit": "Launch-Material in Sekunden, einheitlich über alle Promotion-Kanäle.",
  "tool.promo.event": "Jede abgeschlossene Generierung",

  "triage.approved": "Freigegeben",
  "triage.review": "Prüfen",
  "triage.rejected": "Abgelehnt",
};

const fr: Dictionary = {
  "nav.home": "Accueil",
  "nav.pricing": "Tarifs",
  "nav.demo": "Essai gratuit",
  "nav.faq": "FAQ",
  "nav.dashboard": "Tableau de bord",
  "nav.login": "Se connecter",
  "nav.signup": "Commencer",
  "nav.menu": "Ouvrir le menu",
  "nav.register": "S'inscrire",
  "lang.label": "Langue",
  "lang.interface": "Langue de l'interface",

  "hero.eyebrow": "Suite professionnelle pour éditeurs KDP",
  "hero.headline1": "Publiez sur KDP plus vite",
  "hero.headline2": "avec une qualité de studio éditorial",
  "hero.sub":
    "InkForgeKdp réunit couvertures, fiches produit, contenus A+, triage d'images, mise en page intérieure, quatrièmes de couverture, bios d'auteur et kits promo sur une seule plateforme. Un abonnement, huit outils, aucun logiciel à installer.",
  "hero.cta1": "Commencer",
  "hero.cta2": "Voir les offres",
  "hero.badge1": "Interface et contenus en 7 langues",
  "hero.badge2": "Annulez quand vous voulez",

  "tools.badge": "Les 8 outils de la plateforme",
  "tools.title1": "Huit outils,",
  "tools.title2": "un seul flux de travail",
  "tools.sub":
    "Chaque outil génère du contenu dans la langue choisie. Seul le nombre d'utilisations mensuelles change selon l'offre.",
  "tools.slot": "Outil {n}",
  "tools.cost": "Consommation : 1 crédit — {event}.",
  "tools.more": "En savoir plus",

  "footer.tagline":
    "La boîte à outils complète pour publier et vendre sur Amazon : de la couverture à la promotion, en un seul abonnement.",
  "footer.product": "Produit",
  "footer.account": "Compte",
  "footer.legal": "Mentions légales",
  "footer.privacy": "Politique de confidentialité",
  "footer.terms": "Conditions générales",
  "footer.status": "État du système",
  "footer.rights": "Tous droits réservés.",
  "footer.cookiePrefs": "Préférences des cookies",

  "consent.title": "Votre vie privée",
  "consent.description":
    "Nous utilisons des outils d'analyse optionnels (PostHog, Google Analytics) pour comprendre l'utilisation du site. Ils restent désactivés tant que vous n'avez pas donné votre consentement.",
  "consent.accept": "Accepter",
  "consent.reject": "Refuser",
  "consent.privacyLink": "Politique de confidentialité",

  "newsletter.title": "Restez informé",
  "newsletter.subtitle":
    "Actualités sur les outils, conseils pour publier sur Amazon KDP et quelques offres réservées à notre liste. Pas de spam, désinscription à tout moment.",
  "newsletter.placeholder": "Votre email",
  "newsletter.cta": "M'inscrire",
  "newsletter.consent":
    "J'accepte de recevoir des emails promotionnels d'InkForgeKdp. Je peux me désinscrire à tout moment.",
  "newsletter.success": "C'est fait ! Vérifiez votre boîte mail.",
  "newsletter.error": "Inscription impossible. Réessayez dans un instant.",

  "chat.openLabel": "Ouvrir l'assistant d'aide",
  "chat.title": "Assistant InkForgeKdp",
  "chat.greeting":
    "Bonjour ! Je suis l'assistant InkForgeKdp. Posez-moi vos questions sur les outils, les formules ou votre compte.",
  "chat.placeholder": "Écrivez un message…",
  "chat.send": "Envoyer",
  "chat.typing": "En train d'écrire…",
  "chat.disclaimer": "Les réponses sont générées automatiquement et ne concernent qu'InkForgeKdp.",
  "chat.error": "Je ne peux pas répondre pour le moment. Réessayez dans un instant.",

  "dash.dashboard": "Tableau de bord",
  "dash.tools": "Outils",
  "dash.account": "Compte",
  "dash.usage": "Utilisation",
  "dash.subscription": "Mon abonnement",
  "dash.referral": "Parrainage",
  "dash.profile": "Profil",
  "dash.projects": "Projets de livre",
  "dash.settings": "Paramètres",
  "dash.logout": "Déconnexion",
  "dash.back": "Retour au tableau de bord",
  "dash.unlimited": "Illimité",
  "dash.credits": "{n} crédits",
  "dash.creditEvent": "1 crédit — {event}",

  "output.label": "Langue des contenus générés",
  "output.hint": "Les textes et fichiers produits par l'outil utiliseront cette langue.",
  "output.sameAsUi": "Comme l'interface",
  "output.notSupported": "Indisponible dans cette langue : l'anglais sera utilisé.",

  "tool.copertine.name": "Couvertures",
  "tool.copertine.desc":
    "Éditeur de couvertures KDP avec repères de fond perdu, dos et marges de sécurité, textes et effets typographiques.",
  "tool.copertine.benefit":
    "Des couvertures prêtes pour KDP sans logiciel externe, export haute résolution.",
  "tool.copertine.event": "Export d'image terminé",

  "tool.pubblicazione.name": "Publication",
  "tool.pubblicazione.desc":
    "Générateur de fiches KDP : titre, sous-titre, description, mots-clés et catégories optimisées.",
  "tool.pubblicazione.benefit":
    "Des fiches produit complètes et conformes en quelques secondes, prêtes à coller dans KDP.",
  "tool.pubblicazione.event": "Chaque génération terminée",

  "tool.aplus.name": "A+ KDPstudio",
  "tool.aplus.desc":
    "Générateur de contenus A+ multilingues à partir de la couverture, de l'intérieur et du logo.",
  "tool.aplus.benefit": "Des contenus A+ professionnels et multilingues sans designer.",
  "tool.aplus.event": "Chaque génération terminée",

  "tool.triage.name": "Triage",
  "tool.triage.desc":
    "Analyse rapide des images pour KDP : DPI, dimensions, qualité et tri automatique.",
  "tool.triage.benefit":
    "Écartez les images inutilisables avant la mise en page et gagnez des heures.",
  "tool.triage.event": "Téléchargement des 3 dossiers terminé",

  "tool.interni.name": "Intérieur",
  "tool.interni.desc":
    "Mettez en page vos images dans un PDF intérieur prêt pour KDP : format de page, marges et fond perdu corrects, redimensionnement automatique.",
  "tool.interni.benefit":
    "Un seul PDF intérieur prêt à être téléversé sur KDP, sans autre logiciel de mise en page.",
  "tool.interni.event": "Chaque PDF intérieur généré avec succès",

  "tool.blurb.name": "Quatrième de couverture & Synopsis",
  "tool.blurb.desc":
    "Génère la quatrième de couverture, le synopsis et un blurb éditorial pour la fiction et le documentaire, tout genre et ton.",
  "tool.blurb.benefit":
    "Des textes de vente prêts pour les romans et essais, pas seulement pour les coloriages et activity books.",
  "tool.blurb.event": "Chaque génération terminée",

  "tool.bio.name": "Bio Auteur & Kit Presse",
  "tool.bio.desc":
    "Génère des bios auteur (courte, moyenne, longue) pour Amazon Author Central et les sites web, plus un communiqué de presse de lancement.",
  "tool.bio.benefit":
    "Présentez-vous professionnellement sur Amazon, votre site et la presse sans repartir de zéro à chaque fois.",
  "tool.bio.event": "Chaque génération terminée",

  "tool.promo.name": "Kit Promo Réseaux & Ads",
  "tool.promo.desc":
    "Génère des posts multi-plateformes, des titres/puces Amazon Ads et un email de lancement pour promouvoir le livre.",
  "tool.promo.benefit":
    "Du matériel de lancement prêt en quelques secondes, cohérent sur tous les canaux de promotion.",
  "tool.promo.event": "Chaque génération terminée",

  "triage.approved": "Validée",
  "triage.review": "À revoir",
  "triage.rejected": "Refusée",
};

const es: Dictionary = {
  "nav.home": "Inicio",
  "nav.pricing": "Precios",
  "nav.demo": "Prueba gratis",
  "nav.faq": "FAQ",
  "nav.dashboard": "Panel",
  "nav.login": "Iniciar sesión",
  "nav.signup": "Empezar ahora",
  "nav.menu": "Abrir menú",
  "nav.register": "Registrarse",
  "lang.label": "Idioma",
  "lang.interface": "Idioma de la interfaz",

  "hero.eyebrow": "Suite profesional para editores KDP",
  "hero.headline1": "Publica en KDP más rápido",
  "hero.headline2": "con calidad de estudio editorial",
  "hero.sub":
    "InkForgeKdp reúne portadas, fichas, contenido A+, triaje de imágenes, maquetación del interior, sinopsis, biografías de autor y kits promocionales en una sola plataforma. Una suscripción, ocho herramientas, sin instalar nada.",
  "hero.cta1": "Empezar ahora",
  "hero.cta2": "Ver los planes",
  "hero.badge1": "Interfaz y contenidos en 7 idiomas",
  "hero.badge2": "Cancela cuando quieras",

  "tools.badge": "Las 8 herramientas de la plataforma",
  "tools.title1": "Ocho herramientas,",
  "tools.title2": "un único flujo de trabajo",
  "tools.sub":
    "Cada herramienta genera contenido en el idioma que elijas. Entre planes solo cambia el número de usos mensuales.",
  "tools.slot": "Herramienta {n}",
  "tools.cost": "Consumo: 1 crédito — {event}.",
  "tools.more": "Saber más",

  "footer.tagline":
    "El kit de herramientas completo para publicar y vender en Amazon: desde la portada hasta la promoción, en una sola suscripción.",
  "footer.product": "Producto",
  "footer.account": "Cuenta",
  "footer.legal": "Legal",
  "footer.privacy": "Política de privacidad",
  "footer.terms": "Términos y condiciones",
  "footer.status": "Estado del sistema",
  "footer.rights": "Todos los derechos reservados.",
  "footer.cookiePrefs": "Preferencias de cookies",

  "consent.title": "Tu privacidad",
  "consent.description":
    "Usamos herramientas de análisis opcionales (PostHog, Google Analytics) para entender cómo se usa el sitio. Permanecen desactivadas hasta que des tu consentimiento.",
  "consent.accept": "Aceptar",
  "consent.reject": "Rechazar",
  "consent.privacyLink": "Política de privacidad",

  "newsletter.title": "Mantente al día",
  "newsletter.subtitle":
    "Novedades sobre las herramientas, consejos para publicar en Amazon KDP y alguna oferta reservada a nuestra lista. Sin spam, puedes darte de baja cuando quieras.",
  "newsletter.placeholder": "Tu email",
  "newsletter.cta": "Suscribirme",
  "newsletter.consent":
    "Acepto recibir emails promocionales de InkForgeKdp. Puedo darme de baja en cualquier momento.",
  "newsletter.success": "¡Listo! Revisa tu bandeja de entrada.",
  "newsletter.error": "No se pudo completar la suscripción. Inténtalo de nuevo en un momento.",

  "chat.openLabel": "Abrir el asistente de ayuda",
  "chat.title": "Asistente InkForgeKdp",
  "chat.greeting":
    "¡Hola! Soy el asistente de InkForgeKdp. Pregúntame lo que quieras sobre las herramientas, los planes o tu cuenta.",
  "chat.placeholder": "Escribe un mensaje…",
  "chat.send": "Enviar",
  "chat.typing": "Escribiendo…",
  "chat.disclaimer": "Las respuestas se generan automáticamente y tratan solo sobre InkForgeKdp.",
  "chat.error": "No puedo responder ahora mismo. Inténtalo de nuevo en un momento.",

  "dash.dashboard": "Panel",
  "dash.tools": "Herramientas",
  "dash.account": "Cuenta",
  "dash.usage": "Uso",
  "dash.subscription": "Mi suscripción",
  "dash.referral": "Referidos",
  "dash.profile": "Perfil",
  "dash.projects": "Proyectos de libro",
  "dash.settings": "Ajustes",
  "dash.logout": "Cerrar sesión",
  "dash.back": "Volver al panel",
  "dash.unlimited": "Ilimitado",
  "dash.credits": "{n} créditos",
  "dash.creditEvent": "1 crédito — {event}",

  "output.label": "Idioma del contenido generado",
  "output.hint": "Los textos y archivos que produce la herramienta usarán este idioma.",
  "output.sameAsUi": "Igual que la interfaz",
  "output.notSupported": "No disponible en este idioma: se usará el inglés.",

  "tool.copertine.name": "Portadas",
  "tool.copertine.desc":
    "Editor de portadas KDP con guías de sangrado, lomo y márgenes de seguridad, textos y efectos tipográficos.",
  "tool.copertine.benefit":
    "Portadas listas para KDP sin software externo, con exportación en alta resolución.",
  "tool.copertine.event": "Exportación de imagen completada",

  "tool.pubblicazione.name": "Publicación",
  "tool.pubblicazione.desc":
    "Generador de fichas KDP: título, subtítulo, descripción, palabras clave y categorías optimizadas.",
  "tool.pubblicazione.benefit":
    "Fichas completas y conformes en segundos, listas para pegar en KDP.",
  "tool.pubblicazione.event": "Cada generación completada",

  "tool.aplus.name": "A+ KDPstudio",
  "tool.aplus.desc":
    "Constructor de contenido A+ multilingüe a partir de portada, interior y logotipo de marca.",
  "tool.aplus.benefit": "Contenido A+ profesional y multilingüe sin diseñador.",
  "tool.aplus.event": "Cada generación completada",

  "tool.triage.name": "Triaje",
  "tool.triage.desc":
    "Análisis rápido de imágenes para KDP: DPI, dimensiones, calidad y clasificación automática.",
  "tool.triage.benefit":
    "Descarta las imágenes inservibles antes de maquetar y ahorra horas de trabajo.",
  "tool.triage.event": "Descarga de las 3 carpetas completada",

  "tool.interni.name": "Interior",
  "tool.interni.desc":
    "Maqueta tus imágenes en un PDF interior listo para KDP: tamaño de página, márgenes y sangrado correctos, redimensionado automático.",
  "tool.interni.benefit":
    "Un único PDF interior listo para subir a KDP, sin necesidad de otro programa de maquetación.",
  "tool.interni.event": "Cada PDF interior generado con éxito",

  "tool.blurb.name": "Sinopsis & Contraportada",
  "tool.blurb.desc":
    "Genera contraportada, sinopsis y blurb editorial para narrativa y no ficción, en cualquier género y tono.",
  "tool.blurb.benefit":
    "Textos de venta listos para novelas y ensayos, no solo para libros de colorear y actividades.",
  "tool.blurb.event": "Cada generación completada",

  "tool.bio.name": "Bio de Autor & Kit de Prensa",
  "tool.bio.desc":
    "Genera biografías de autor (corta, media, larga) para Amazon Author Central y webs, además de una nota de prensa de lanzamiento.",
  "tool.bio.benefit":
    "Preséntate de forma profesional en Amazon, tu web y la prensa sin empezar de cero cada vez.",
  "tool.bio.event": "Cada generación completada",

  "tool.promo.name": "Kit Promo Social & Ads",
  "tool.promo.desc":
    "Genera publicaciones multiplataforma, títulos/puntos para Amazon Ads y un email de lanzamiento para promocionar el libro.",
  "tool.promo.benefit":
    "Material de lanzamiento listo en segundos, coherente en todos los canales de promoción.",
  "tool.promo.event": "Cada generación completada",

  "triage.approved": "Aprobada",
  "triage.review": "Revisar",
  "triage.rejected": "Rechazada",
};

const nl: Dictionary = {
  "nav.home": "Home",
  "nav.pricing": "Prijzen",
  "nav.demo": "Gratis proberen",
  "nav.faq": "FAQ",
  "nav.dashboard": "Dashboard",
  "nav.login": "Inloggen",
  "nav.signup": "Nu starten",
  "nav.menu": "Menu openen",
  "nav.register": "Registreren",
  "lang.label": "Taal",
  "lang.interface": "Taal van de interface",

  "hero.eyebrow": "Professionele suite voor KDP-uitgevers",
  "hero.headline1": "Publiceer sneller op KDP",
  "hero.headline2": "met kwaliteit van een uitgeversstudio",
  "hero.sub":
    "InkForgeKdp bundelt covers, listings, A+ content, beeldtriage, binnenwerk-opmaak, blurbs, auteursbio's en promo-kits in één platform. Eén abonnement, acht tools, geen software te installeren.",
  "hero.cta1": "Nu starten",
  "hero.cta2": "Bekijk de pakketten",
  "hero.badge1": "Interface en content in 7 talen",
  "hero.badge2": "Altijd opzegbaar",

  "tools.badge": "De 8 tools van het platform",
  "tools.title1": "Acht tools,",
  "tools.title2": "één werkstroom",
  "tools.sub":
    "Elke tool genereert content in de taal die je kiest. Tussen pakketten verandert alleen het aantal maandelijkse gebruiken.",
  "tools.slot": "Tool {n}",
  "tools.cost": "Verbruik: 1 credit — {event}.",
  "tools.more": "Meer weten",

  "footer.tagline":
    "De complete toolkit voor iedereen die op Amazon publiceert en verkoopt: van cover tot promotie, in één abonnement.",
  "footer.product": "Product",
  "footer.account": "Account",
  "footer.legal": "Juridisch",
  "footer.privacy": "Privacybeleid",
  "footer.terms": "Algemene voorwaarden",
  "footer.status": "Systeemstatus",
  "footer.rights": "Alle rechten voorbehouden.",
  "footer.cookiePrefs": "Cookievoorkeuren",

  "consent.title": "Jouw privacy",
  "consent.description":
    "We gebruiken optionele analysetools (PostHog, Google Analytics) om te begrijpen hoe de site wordt gebruikt. Ze blijven uit totdat je toestemming geeft.",
  "consent.accept": "Accepteren",
  "consent.reject": "Weigeren",
  "consent.privacyLink": "Privacybeleid",

  "newsletter.title": "Blijf op de hoogte",
  "newsletter.subtitle":
    "Nieuws over de tools, tips voor publiceren op Amazon KDP en af en toe een aanbieding voor onze lijst. Geen spam, je kunt je altijd afmelden.",
  "newsletter.placeholder": "Jouw e-mailadres",
  "newsletter.cta": "Aanmelden",
  "newsletter.consent":
    "Ik ga akkoord met het ontvangen van promotionele e-mails van InkForgeKdp. Ik kan me op elk moment afmelden.",
  "newsletter.success": "Gelukt! Check je inbox.",
  "newsletter.error": "Aanmelden is niet gelukt. Probeer het straks opnieuw.",

  "chat.openLabel": "Hulpassistent openen",
  "chat.title": "InkForgeKdp-assistent",
  "chat.greeting":
    "Hoi! Ik ben de InkForgeKdp-assistent. Vraag me gerust iets over de tools, de abonnementen of je account.",
  "chat.placeholder": "Typ een bericht…",
  "chat.send": "Versturen",
  "chat.typing": "Aan het typen…",
  "chat.disclaimer": "Antwoorden worden automatisch gegenereerd en gaan alleen over InkForgeKdp.",
  "chat.error": "Ik kan nu even niet antwoorden. Probeer het straks opnieuw.",

  "dash.dashboard": "Dashboard",
  "dash.tools": "Tools",
  "dash.account": "Account",
  "dash.usage": "Gebruik",
  "dash.subscription": "Mijn abonnement",
  "dash.referral": "Referral",
  "dash.profile": "Profiel",
  "dash.projects": "Boekprojecten",
  "dash.settings": "Instellingen",
  "dash.logout": "Uitloggen",
  "dash.back": "Terug naar dashboard",
  "dash.unlimited": "Onbeperkt",
  "dash.credits": "{n} credits",
  "dash.creditEvent": "1 credit — {event}",

  "output.label": "Taal van gegenereerde content",
  "output.hint": "Teksten en bestanden van de tool gebruiken deze taal.",
  "output.sameAsUi": "Zoals de interface",
  "output.notSupported": "Niet beschikbaar in deze taal: Engels wordt gebruikt.",

  "tool.copertine.name": "Covers",
  "tool.copertine.desc":
    "KDP-covereditor met hulplijnen voor afloop, rug en veilige marges, teksten en typografische effecten.",
  "tool.copertine.benefit": "KDP-klare covers zonder extra software, met export in hoge resolutie.",
  "tool.copertine.event": "Export van afbeelding voltooid",

  "tool.pubblicazione.name": "Publicatie",
  "tool.pubblicazione.desc":
    "KDP-listinggenerator: titel, ondertitel, beschrijving, zoekwoorden en geoptimaliseerde categorieën.",
  "tool.pubblicazione.benefit":
    "Complete en conforme productpagina's in seconden, klaar om in KDP te plakken.",
  "tool.pubblicazione.event": "Elke voltooide generatie",

  "tool.aplus.name": "A+ KDPstudio",
  "tool.aplus.desc": "Meertalige A+ contentbouwer op basis van cover, binnenwerk en merklogo.",
  "tool.aplus.benefit": "Professionele meertalige A+ content zonder ontwerper.",
  "tool.aplus.event": "Elke voltooide generatie",

  "tool.triage.name": "Triage",
  "tool.triage.desc":
    "Snelle beeldanalyse voor KDP: DPI, afmetingen, kwaliteit en automatische sortering.",
  "tool.triage.benefit": "Filter onbruikbare beelden voor de opmaak en bespaar uren werk.",
  "tool.triage.event": "Download van de 3 mappen voltooid",

  "tool.interni.name": "Binnenwerk",
  "tool.interni.desc":
    "Maak van je afbeeldingen een KDP-klare binnenwerk-PDF: correct paginaformaat, marges en afloop, automatisch formaat aanpassen.",
  "tool.interni.benefit":
    "Eén enkele binnenwerk-PDF, klaar om te uploaden naar KDP, zonder ander opmaakprogramma.",
  "tool.interni.event": "Elke succesvol gegenereerde binnenwerk-PDF",

  "tool.blurb.name": "Blurb & Synopsis",
  "tool.blurb.desc":
    "Genereert flaptekst, synopsis en redactionele blurb voor fictie en non-fictie, in elk genre en elke toon.",
  "tool.blurb.benefit":
    "Verkoopteksten voor romans en non-fictie, niet alleen voor kleur- en activiteitenboeken.",
  "tool.blurb.event": "Elke voltooide generatie",

  "tool.bio.name": "Auteursbio & Perskit",
  "tool.bio.desc":
    "Genereert auteursbio's (kort, gemiddeld, lang) voor Amazon Author Central en websites, plus een perbericht voor de boeklancering.",
  "tool.bio.benefit":
    "Presenteer jezelf professioneel op Amazon, je website en de pers zonder telkens opnieuw te beginnen.",
  "tool.bio.event": "Elke voltooide generatie",

  "tool.promo.name": "Social & Ads Promo-kit",
  "tool.promo.desc":
    "Genereert social posts voor meerdere platformen, Amazon Ads-koppen/bullets en een lanceringsmail om je boek te promoten.",
  "tool.promo.benefit": "Lanceringsmateriaal in seconden klaar, consistent op elk promotiekanaal.",
  "tool.promo.event": "Elke voltooide generatie",

  "triage.approved": "Goedgekeurd",
  "triage.review": "Nakijken",
  "triage.rejected": "Afgekeurd",
};

const pt: Dictionary = {
  "nav.home": "Início",
  "nav.pricing": "Preços",
  "nav.demo": "Teste grátis",
  "nav.faq": "FAQ",
  "nav.dashboard": "Painel",
  "nav.login": "Entrar",
  "nav.signup": "Começar agora",
  "nav.menu": "Abrir menu",
  "nav.register": "Criar conta",
  "lang.label": "Idioma",
  "lang.interface": "Idioma da interface",

  "hero.eyebrow": "Suite profissional para editores KDP",
  "hero.headline1": "Publique na KDP mais rápido",
  "hero.headline2": "com qualidade de estúdio editorial",
  "hero.sub":
    "O InkForgeKdp reúne capas, listings, conteúdo A+, triagem de imagens, diagramação do miolo, sinopses, biografias de autor e kits promocionais numa só plataforma. Uma subscrição, oito ferramentas, sem instalar software.",
  "hero.cta1": "Começar agora",
  "hero.cta2": "Ver os planos",
  "hero.badge1": "Interface e conteúdos em 7 idiomas",
  "hero.badge2": "Cancela quando quiser",

  "tools.badge": "As 8 ferramentas da plataforma",
  "tools.title1": "Oito ferramentas,",
  "tools.title2": "um único fluxo de trabalho",
  "tools.sub":
    "Cada ferramenta gera conteúdo no idioma que escolher. Entre planos muda apenas o número de utilizações mensais.",
  "tools.slot": "Ferramenta {n}",
  "tools.cost": "Consumo: 1 crédito — {event}.",
  "tools.more": "Saber mais",

  "footer.tagline":
    "O conjunto completo de ferramentas para quem publica e vende na Amazon: da capa à promoção, numa só subscrição.",
  "footer.product": "Produto",
  "footer.account": "Conta",
  "footer.legal": "Legal",
  "footer.privacy": "Política de Privacidade",
  "footer.terms": "Termos e condições",
  "footer.status": "Status do sistema",
  "footer.rights": "Todos os direitos reservados.",
  "footer.cookiePrefs": "Preferências de cookies",

  "consent.title": "A sua privacidade",
  "consent.description":
    "Utilizamos ferramentas de análise opcionais (PostHog, Google Analytics) para perceber como o site é utilizado. Permanecem desativadas até dar o seu consentimento.",
  "consent.accept": "Aceitar",
  "consent.reject": "Recusar",
  "consent.privacyLink": "Política de privacidade",

  "newsletter.title": "Fique por dentro",
  "newsletter.subtitle":
    "Novidades sobre as ferramentas, dicas para publicar na Amazon KDP e alguma oferta reservada à nossa lista. Sem spam, podes cancelar quando quiseres.",
  "newsletter.placeholder": "O teu email",
  "newsletter.cta": "Inscrever-me",
  "newsletter.consent":
    "Aceito receber emails promocionais da InkForgeKdp. Posso cancelar a subscrição a qualquer momento.",
  "newsletter.success": "Feito! Verifica a tua caixa de entrada.",
  "newsletter.error": "Não foi possível concluir a inscrição. Tenta novamente daqui a pouco.",

  "chat.openLabel": "Abrir o assistente de ajuda",
  "chat.title": "Assistente InkForgeKdp",
  "chat.greeting":
    "Olá! Sou o assistente da InkForgeKdp. Pergunta-me o que quiseres sobre as ferramentas, os planos ou a tua conta.",
  "chat.placeholder": "Escreve uma mensagem…",
  "chat.send": "Enviar",
  "chat.typing": "A escrever…",
  "chat.disclaimer": "As respostas são geradas automaticamente e tratam apenas de InkForgeKdp.",
  "chat.error": "Não consigo responder agora. Tenta novamente daqui a pouco.",

  "dash.dashboard": "Painel",
  "dash.tools": "Ferramentas",
  "dash.account": "Conta",
  "dash.usage": "Utilização",
  "dash.subscription": "A minha subscrição",
  "dash.referral": "Indicações",
  "dash.profile": "Perfil",
  "dash.projects": "Projetos de livro",
  "dash.settings": "Definições",
  "dash.logout": "Sair",
  "dash.back": "Voltar ao painel",
  "dash.unlimited": "Ilimitado",
  "dash.credits": "{n} créditos",
  "dash.creditEvent": "1 crédito — {event}",

  "output.label": "Idioma dos conteúdos gerados",
  "output.hint": "Os textos e ficheiros produzidos pela ferramenta usarão este idioma.",
  "output.sameAsUi": "Igual à interface",
  "output.notSupported": "Indisponível neste idioma: será usado o inglês.",

  "tool.copertine.name": "Capas",
  "tool.copertine.desc":
    "Editor de capas KDP com guias de sangria, lombada e margens de segurança, textos e efeitos tipográficos.",
  "tool.copertine.benefit":
    "Capas prontas para a KDP sem software externo, com exportação em alta resolução.",
  "tool.copertine.event": "Exportação de imagem concluída",

  "tool.pubblicazione.name": "Publicação",
  "tool.pubblicazione.desc":
    "Gerador de listings KDP: título, subtítulo, descrição, palavras-chave e categorias otimizadas.",
  "tool.pubblicazione.benefit":
    "Páginas de produto completas e conformes em segundos, prontas a colar na KDP.",
  "tool.pubblicazione.event": "Cada geração concluída",

  "tool.aplus.name": "A+ KDPstudio",
  "tool.aplus.desc":
    "Construtor de conteúdo A+ multilingue a partir da capa, do interior e do logótipo da marca.",
  "tool.aplus.benefit": "Conteúdo A+ profissional e multilingue sem designer.",
  "tool.aplus.event": "Cada geração concluída",

  "tool.triage.name": "Triagem",
  "tool.triage.desc":
    "Análise rápida de imagens para KDP: DPI, dimensões, qualidade e separação automática.",
  "tool.triage.benefit":
    "Elimine as imagens inutilizáveis antes da paginação e poupe horas de trabalho.",
  "tool.triage.event": "Download das 3 pastas concluído",

  "tool.interni.name": "Miolo",
  "tool.interni.desc":
    "Diagrame suas imagens em um PDF de miolo pronto para a KDP: tamanho de página, margens e sangria corretos, redimensionamento automático.",
  "tool.interni.benefit":
    "Um único PDF de miolo pronto para enviar à KDP, sem precisar de outro programa de diagramação.",
  "tool.interni.event": "Cada PDF de miolo gerado com sucesso",

  "tool.blurb.name": "Sinopse & Contracapa",
  "tool.blurb.desc":
    "Gera contracapa, sinopse e blurb editorial para ficção e não-ficção, em qualquer género e tom.",
  "tool.blurb.benefit":
    "Textos de venda prontos para romances e ensaios, não só para livros de colorir e atividades.",
  "tool.blurb.event": "Cada geração concluída",

  "tool.bio.name": "Bio de Autor & Kit de Imprensa",
  "tool.bio.desc":
    "Gera biografias de autor (curta, média, longa) para Amazon Author Central e sites, mais um comunicado de imprensa de lançamento.",
  "tool.bio.benefit":
    "Apresenta-te de forma profissional na Amazon, no teu site e na imprensa sem começar do zero de cada vez.",
  "tool.bio.event": "Cada geração concluída",

  "tool.promo.name": "Kit Promo Social & Ads",
  "tool.promo.desc":
    "Gera publicações multiplataforma, títulos/bullets para Amazon Ads e um email de lançamento para promover o livro.",
  "tool.promo.benefit":
    "Material de lançamento pronto em segundos, consistente em todos os canais de promoção.",
  "tool.promo.event": "Cada geração concluída",

  "triage.approved": "Aprovada",
  "triage.review": "Rever",
  "triage.rejected": "Reprovada",
};

export const MESSAGES: Record<Locale, Dictionary> = { it, en, de, fr, es, nl, pt };
