import type { Locale } from "./config";

/**
 * Dizionari dell'interfaccia. Chiavi piatte, `{var}` per le interpolazioni.
 * L'italiano è la lingua di riferimento: ogni chiave presente qui deve esistere
 * anche nelle altre lingue (il tipo lo garantisce).
 */
const it = {
  "nav.home": "Home",
  "nav.pricing": "Prezzi",
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
    "OP+studioKdp riunisce copertine, listing, contenuti A+ e triage immagini in un'unica piattaforma. Un solo abbonamento, quattro strumenti, zero software da installare.",
  "hero.cta1": "Inizia ora",
  "hero.cta2": "Scopri i piani",
  "hero.badge1": "Interfaccia e contenuti in 7 lingue",
  "hero.badge2": "Cancelli quando vuoi",

  "tools.badge": "I 4 tool della piattaforma",
  "tools.title1": "Quattro strumenti,",
  "tools.title2": "un solo flusso di lavoro",
  "tools.sub":
    "Ogni tool genera contenuti nella lingua che scegli. Cambia soltanto il numero di utilizzi mensili incluso nel piano.",
  "tools.slot": "Tool {n}",
  "tools.cost": "Consumo: 1 credito — {event}.",
  "tools.more": "Scopri di più",

  "footer.tagline":
    "La suite di strumenti per chi pubblica su Amazon KDP: copertine, listing, contenuti A+ e triage immagini.",
  "footer.product": "Prodotto",
  "footer.account": "Account",
  "footer.legal": "Legale",
  "footer.privacy": "Privacy Policy",
  "footer.terms": "Termini e condizioni",
  "footer.rights": "Tutti i diritti riservati.",

  "dash.dashboard": "Dashboard",
  "dash.tools": "Tool",
  "dash.account": "Account",
  "dash.usage": "Utilizzo",
  "dash.subscription": "Il mio abbonamento",
  "dash.profile": "Profilo",
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

  "triage.approved": "Promossa",
  "triage.review": "Rimandata",
  "triage.rejected": "Bocciata",
} as const;

export type MessageKey = keyof typeof it;
type Dictionary = Record<MessageKey, string>;

const en: Dictionary = {
  "nav.home": "Home",
  "nav.pricing": "Pricing",
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
    "OP+studioKdp brings covers, listings, A+ content and image triage together in one platform. One subscription, four tools, no software to install.",
  "hero.cta1": "Get started",
  "hero.cta2": "See the plans",
  "hero.badge1": "Interface and content in 7 languages",
  "hero.badge2": "Cancel anytime",

  "tools.badge": "The 4 platform tools",
  "tools.title1": "Four tools,",
  "tools.title2": "one single workflow",
  "tools.sub":
    "Every tool generates content in the language you choose. Only the number of monthly uses changes between plans.",
  "tools.slot": "Tool {n}",
  "tools.cost": "Usage: 1 credit — {event}.",
  "tools.more": "Learn more",

  "footer.tagline":
    "The toolkit for Amazon KDP publishers: covers, listings, A+ content and image triage.",
  "footer.product": "Product",
  "footer.account": "Account",
  "footer.legal": "Legal",
  "footer.privacy": "Privacy Policy",
  "footer.terms": "Terms and conditions",
  "footer.rights": "All rights reserved.",

  "dash.dashboard": "Dashboard",
  "dash.tools": "Tools",
  "dash.account": "Account",
  "dash.usage": "Usage",
  "dash.subscription": "My subscription",
  "dash.profile": "Profile",
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
  "tool.copertine.benefit": "KDP-ready covers without external software, exported in high resolution.",
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

  "triage.approved": "Approved",
  "triage.review": "Review",
  "triage.rejected": "Rejected",
};

const de: Dictionary = {
  "nav.home": "Start",
  "nav.pricing": "Preise",
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
    "OP+studioKdp vereint Cover, Listings, A+ Inhalte und Bild-Triage in einer Plattform. Ein Abo, vier Tools, keine Installation.",
  "hero.cta1": "Jetzt starten",
  "hero.cta2": "Tarife ansehen",
  "hero.badge1": "Oberfläche und Inhalte in 7 Sprachen",
  "hero.badge2": "Jederzeit kündbar",

  "tools.badge": "Die 4 Tools der Plattform",
  "tools.title1": "Vier Werkzeuge,",
  "tools.title2": "ein einziger Workflow",
  "tools.sub":
    "Jedes Tool erzeugt Inhalte in der Sprache deiner Wahl. Zwischen den Tarifen ändert sich nur die Anzahl der monatlichen Nutzungen.",
  "tools.slot": "Tool {n}",
  "tools.cost": "Verbrauch: 1 Guthaben — {event}.",
  "tools.more": "Mehr erfahren",

  "footer.tagline":
    "Das Toolkit für Amazon-KDP-Veröffentlichungen: Cover, Listings, A+ Inhalte und Bild-Triage.",
  "footer.product": "Produkt",
  "footer.account": "Konto",
  "footer.legal": "Rechtliches",
  "footer.privacy": "Datenschutz",
  "footer.terms": "AGB",
  "footer.rights": "Alle Rechte vorbehalten.",

  "dash.dashboard": "Dashboard",
  "dash.tools": "Tools",
  "dash.account": "Konto",
  "dash.usage": "Nutzung",
  "dash.subscription": "Mein Abo",
  "dash.profile": "Profil",
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

  "triage.approved": "Freigegeben",
  "triage.review": "Prüfen",
  "triage.rejected": "Abgelehnt",
};

const fr: Dictionary = {
  "nav.home": "Accueil",
  "nav.pricing": "Tarifs",
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
    "OP+studioKdp réunit couvertures, fiches produit, contenus A+ et triage d'images sur une seule plateforme. Un abonnement, quatre outils, aucun logiciel à installer.",
  "hero.cta1": "Commencer",
  "hero.cta2": "Voir les offres",
  "hero.badge1": "Interface et contenus en 7 langues",
  "hero.badge2": "Annulez quand vous voulez",

  "tools.badge": "Les 4 outils de la plateforme",
  "tools.title1": "Quatre outils,",
  "tools.title2": "un seul flux de travail",
  "tools.sub":
    "Chaque outil génère du contenu dans la langue choisie. Seul le nombre d'utilisations mensuelles change selon l'offre.",
  "tools.slot": "Outil {n}",
  "tools.cost": "Consommation : 1 crédit — {event}.",
  "tools.more": "En savoir plus",

  "footer.tagline":
    "La boîte à outils pour publier sur Amazon KDP : couvertures, fiches produit, contenus A+ et triage d'images.",
  "footer.product": "Produit",
  "footer.account": "Compte",
  "footer.legal": "Mentions légales",
  "footer.privacy": "Politique de confidentialité",
  "footer.terms": "Conditions générales",
  "footer.rights": "Tous droits réservés.",

  "dash.dashboard": "Tableau de bord",
  "dash.tools": "Outils",
  "dash.account": "Compte",
  "dash.usage": "Utilisation",
  "dash.subscription": "Mon abonnement",
  "dash.profile": "Profil",
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

  "triage.approved": "Validée",
  "triage.review": "À revoir",
  "triage.rejected": "Refusée",
};

const es: Dictionary = {
  "nav.home": "Inicio",
  "nav.pricing": "Precios",
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
    "OP+studioKdp reúne portadas, fichas, contenido A+ y triaje de imágenes en una sola plataforma. Una suscripción, cuatro herramientas, sin instalar nada.",
  "hero.cta1": "Empezar ahora",
  "hero.cta2": "Ver los planes",
  "hero.badge1": "Interfaz y contenidos en 7 idiomas",
  "hero.badge2": "Cancela cuando quieras",

  "tools.badge": "Las 4 herramientas de la plataforma",
  "tools.title1": "Cuatro herramientas,",
  "tools.title2": "un único flujo de trabajo",
  "tools.sub":
    "Cada herramienta genera contenido en el idioma que elijas. Entre planes solo cambia el número de usos mensuales.",
  "tools.slot": "Herramienta {n}",
  "tools.cost": "Consumo: 1 crédito — {event}.",
  "tools.more": "Saber más",

  "footer.tagline":
    "El kit de herramientas para publicar en Amazon KDP: portadas, fichas, contenido A+ y triaje de imágenes.",
  "footer.product": "Producto",
  "footer.account": "Cuenta",
  "footer.legal": "Legal",
  "footer.privacy": "Política de privacidad",
  "footer.terms": "Términos y condiciones",
  "footer.rights": "Todos los derechos reservados.",

  "dash.dashboard": "Panel",
  "dash.tools": "Herramientas",
  "dash.account": "Cuenta",
  "dash.usage": "Uso",
  "dash.subscription": "Mi suscripción",
  "dash.profile": "Perfil",
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

  "triage.approved": "Aprobada",
  "triage.review": "Revisar",
  "triage.rejected": "Rechazada",
};

const nl: Dictionary = {
  "nav.home": "Home",
  "nav.pricing": "Prijzen",
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
    "OP+studioKdp bundelt covers, listings, A+ content en beeldtriage in één platform. Eén abonnement, vier tools, geen software te installeren.",
  "hero.cta1": "Nu starten",
  "hero.cta2": "Bekijk de pakketten",
  "hero.badge1": "Interface en content in 7 talen",
  "hero.badge2": "Altijd opzegbaar",

  "tools.badge": "De 4 tools van het platform",
  "tools.title1": "Vier tools,",
  "tools.title2": "één werkstroom",
  "tools.sub":
    "Elke tool genereert content in de taal die je kiest. Tussen pakketten verandert alleen het aantal maandelijkse gebruiken.",
  "tools.slot": "Tool {n}",
  "tools.cost": "Verbruik: 1 credit — {event}.",
  "tools.more": "Meer weten",

  "footer.tagline":
    "De toolkit voor Amazon KDP-uitgevers: covers, listings, A+ content en beeldtriage.",
  "footer.product": "Product",
  "footer.account": "Account",
  "footer.legal": "Juridisch",
  "footer.privacy": "Privacybeleid",
  "footer.terms": "Algemene voorwaarden",
  "footer.rights": "Alle rechten voorbehouden.",

  "dash.dashboard": "Dashboard",
  "dash.tools": "Tools",
  "dash.account": "Account",
  "dash.usage": "Gebruik",
  "dash.subscription": "Mijn abonnement",
  "dash.profile": "Profiel",
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
  "tool.copertine.benefit":
    "KDP-klare covers zonder extra software, met export in hoge resolutie.",
  "tool.copertine.event": "Export van afbeelding voltooid",

  "tool.pubblicazione.name": "Publicatie",
  "tool.pubblicazione.desc":
    "KDP-listinggenerator: titel, ondertitel, beschrijving, zoekwoorden en geoptimaliseerde categorieën.",
  "tool.pubblicazione.benefit":
    "Complete en conforme productpagina's in seconden, klaar om in KDP te plakken.",
  "tool.pubblicazione.event": "Elke voltooide generatie",

  "tool.aplus.name": "A+ KDPstudio",
  "tool.aplus.desc":
    "Meertalige A+ contentbouwer op basis van cover, binnenwerk en merklogo.",
  "tool.aplus.benefit": "Professionele meertalige A+ content zonder ontwerper.",
  "tool.aplus.event": "Elke voltooide generatie",

  "tool.triage.name": "Triage",
  "tool.triage.desc":
    "Snelle beeldanalyse voor KDP: DPI, afmetingen, kwaliteit en automatische sortering.",
  "tool.triage.benefit":
    "Filter onbruikbare beelden voor de opmaak en bespaar uren werk.",
  "tool.triage.event": "Download van de 3 mappen voltooid",

  "triage.approved": "Goedgekeurd",
  "triage.review": "Nakijken",
  "triage.rejected": "Afgekeurd",
};

const pt: Dictionary = {
  "nav.home": "Início",
  "nav.pricing": "Preços",
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
    "O OP+studioKdp reúne capas, listings, conteúdo A+ e triagem de imagens numa só plataforma. Uma subscrição, quatro ferramentas, sem instalar software.",
  "hero.cta1": "Começar agora",
  "hero.cta2": "Ver os planos",
  "hero.badge1": "Interface e conteúdos em 7 idiomas",
  "hero.badge2": "Cancela quando quiser",

  "tools.badge": "As 4 ferramentas da plataforma",
  "tools.title1": "Quatro ferramentas,",
  "tools.title2": "um único fluxo de trabalho",
  "tools.sub":
    "Cada ferramenta gera conteúdo no idioma que escolher. Entre planos muda apenas o número de utilizações mensais.",
  "tools.slot": "Ferramenta {n}",
  "tools.cost": "Consumo: 1 crédito — {event}.",
  "tools.more": "Saber mais",

  "footer.tagline":
    "O conjunto de ferramentas para publicar na Amazon KDP: capas, listings, conteúdo A+ e triagem de imagens.",
  "footer.product": "Produto",
  "footer.account": "Conta",
  "footer.legal": "Legal",
  "footer.privacy": "Política de Privacidade",
  "footer.terms": "Termos e condições",
  "footer.rights": "Todos os direitos reservados.",

  "dash.dashboard": "Painel",
  "dash.tools": "Ferramentas",
  "dash.account": "Conta",
  "dash.usage": "Utilização",
  "dash.subscription": "A minha subscrição",
  "dash.profile": "Perfil",
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

  "triage.approved": "Aprovada",
  "triage.review": "Rever",
  "triage.rejected": "Reprovada",
};

export const MESSAGES: Record<Locale, Dictionary> = { it, en, de, fr, es, nl, pt };
