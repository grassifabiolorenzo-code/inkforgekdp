/**
 * Pacchetti linguistici per la generazione del listing KDP.
 * L'inglese resta gestito dal motore originale in `listingLogic.ts`;
 * qui vivono le varianti per gli altri mercati Amazon supportati.
 */

import type { Audience, BookType } from "./listingLogic";

export type ListingLocale = "it" | "de" | "fr" | "es" | "nl" | "pt";

interface AudienceCopy {
  /** Sostantivo del pubblico usato nei testi. */
  who: string;
  /** Beneficio principale. */
  benefit: string;
  /** 7 keyword backend long-tail. */
  keywords: string[];
}

export interface LocalePack {
  titles: { coloring: string[]; activity: string[] };
  subtitle: { coloring: string; activity: string };
  /** Sei paragrafi PAS + AIDA con placeholder {subject} {who} {benefit} {age}. */
  description: string[];
  audiences: Record<Audience, AudienceCopy>;
  compliance: { base: string; ok: string; todo: string };
  sales: string;
  exportLabels: {
    title: string;
    subtitle: string;
    description: string;
    keywords: string;
    box: string;
    categories: string;
    compliance: string;
    sales: string;
    pages: string;
  };
}

export const LISTING_PACKS: Record<ListingLocale, LocalePack> = {
  it: {
    titles: {
      coloring: ["{subject} — Libro da Colorare", "Album da Colorare: {subject}", "Mondi Creativi: {subject}"],
      activity: ["{subject} — Libro di Attività", "Quaderno di Attività: {subject}"],
    },
    subtitle: {
      coloring: "Illustrazioni originali di {subject} su pagine singole, pensate per {who} — {benefit}",
      activity: "Esercizi creativi e pagine interattive dedicate a {subject}, pensati per {who}",
    },
    description: [
      "Trovare un'attività offline capace di catturare davvero l'attenzione di {who} è più difficile di quanto sembri.",
      "Molti volumi hanno layout confusi, linee sgranate o carta sottile che lascia trapassare i pennarelli, con un risultato deludente.",
      "Questa edizione dedicata a {subject} è realizzata per {age}: illustrazioni nitide, una per pagina, stampate su fogli singoli.",
      "Vuoi un modo semplice per {benefit}? Ogni tavola è pensata per stimolare curiosità, concentrazione e senso estetico.",
      "Nessun disturbo tra una pagina e l'altra: perfetto con matite colorate, pastelli, fineliner e pennarelli.",
      "Aggiungilo subito al carrello e inizia oggi la tua nuova routine creativa.",
    ],
    audiences: {
      toddlers: {
        who: "bambini",
        benefit: "ridurre il tempo davanti agli schermi",
        keywords: [
          "libro da colorare bambini",
          "attività senza schermi per bambini",
          "album da disegno prescolare",
          "regalo creativo per bambini",
          "sviluppo motricità fine",
          "passatempo educativo casa",
          "disegni grandi facili da colorare",
        ],
      },
      teens: {
        who: "ragazzi e teenager",
        benefit: "esprimere il proprio stile",
        keywords: [
          "libro da colorare ragazzi",
          "disegni moderni da colorare",
          "regalo creativo adolescenti",
          "album artistico teenager",
          "passatempo antistress scuola",
          "illustrazioni aesthetic da colorare",
          "quaderno creativo ragazzi",
        ],
      },
      adults: {
        who: "adulti",
        benefit: "rilassarsi e staccare dallo stress",
        keywords: [
          "libro da colorare adulti",
          "mandala antistress",
          "colorare per rilassarsi",
          "disegni complessi per adulti",
          "mindfulness creativa",
          "regalo antistress originale",
          "album da colorare rilassante",
        ],
      },
    },
    compliance: {
      base: "File strutturati correttamente. ",
      ok: "Copertina e interno verificati: pronti per il caricamento su KDP.",
      todo: "Carica cover e PDF interno per completare l'audit tecnico.",
    },
    sales:
      'Confrontato con i bestseller della nicchia "{subject}", questo listing sfrutta keyword a bassa concorrenza e categorie mirate: ottimo potenziale organico se abbinato a sponsorizzate iniziali.',
    exportLabels: {
      title: "TITOLO",
      subtitle: "SOTTOTITOLO",
      description: "DESCRIZIONE (A+/HTML, PAS+AIDA):",
      keywords: "KEYWORD BACKEND (7 campi):",
      box: "Box",
      categories: "CATEGORIE (BISAC):",
      compliance: "Audit qualità & conformità",
      sales: "Potenziale di vendita",
      pages: "Pagine interno analizzate",
    },
  },

  de: {
    titles: {
      coloring: ["{subject} — Malbuch", "Das große {subject} Malbuch", "Kreative Welten: {subject}"],
      activity: ["{subject} — Aktivitätsbuch", "Übungsheft: {subject}"],
    },
    subtitle: {
      coloring: "Originalillustrationen zu {subject} auf Einzelseiten, gestaltet für {who} — {benefit}",
      activity: "Kreative Übungen und interaktive Seiten rund um {subject}, gestaltet für {who}",
    },
    description: [
      "Eine Offline-Beschäftigung zu finden, die {who} wirklich fesselt, ist schwerer als gedacht.",
      "Viele Bücher haben unruhige Layouts, unscharfe Linien oder dünnes Papier, durch das Stifte durchdrücken.",
      "Diese Ausgabe rund um {subject} wurde für {age} entwickelt: klare Motive, eines pro Seite, einseitig gedruckt.",
      "Suchst du einen einfachen Weg, um {benefit}? Jede Seite fördert Neugier, Konzentration und Gestaltungsfreude.",
      "Kein Durchdrücken zwischen den Seiten: ideal für Buntstifte, Fineliner und Marker.",
      "Lege es jetzt in den Warenkorb und starte noch heute deine kreative Routine.",
    ],
    audiences: {
      toddlers: {
        who: "Kinder",
        benefit: "die Bildschirmzeit zu reduzieren",
        keywords: [
          "malbuch kinder",
          "beschäftigung ohne bildschirm",
          "malblock kindergarten",
          "kreatives geschenk kinder",
          "feinmotorik fördern",
          "lernspiel zuhause",
          "große motive zum ausmalen",
        ],
      },
      teens: {
        who: "Jugendliche",
        benefit: "den eigenen Stil auszudrücken",
        keywords: [
          "malbuch jugendliche",
          "moderne motive ausmalen",
          "kreatives geschenk teenager",
          "aesthetic malbuch",
          "entspannung nach der schule",
          "zeichenbuch jugendliche",
          "kreatives hobby teenager",
        ],
      },
      adults: {
        who: "Erwachsene",
        benefit: "Stress abzubauen",
        keywords: [
          "malbuch erwachsene",
          "mandala antistress",
          "ausmalen zur entspannung",
          "komplexe motive erwachsene",
          "achtsamkeit kreativ",
          "anti stress geschenk",
          "entspannungsmalbuch",
        ],
      },
    },
    compliance: {
      base: "Dateien korrekt strukturiert. ",
      ok: "Cover und Innenteil geprüft: bereit für den KDP-Upload.",
      todo: "Lade Cover und Innen-PDF hoch, um die technische Prüfung abzuschließen.",
    },
    sales:
      'Im Vergleich zu den Bestsellern der Nische "{subject}" nutzt dieses Listing Keywords mit geringem Wettbewerb und gezielte Kategorien: starkes organisches Potenzial mit anfänglichen Anzeigen.',
    exportLabels: {
      title: "TITEL",
      subtitle: "UNTERTITEL",
      description: "BESCHREIBUNG (A+/HTML, PAS+AIDA):",
      keywords: "BACKEND-KEYWORDS (7 Felder):",
      box: "Feld",
      categories: "KATEGORIEN (BISAC):",
      compliance: "Qualitäts- & Konformitätsaudit",
      sales: "Verkaufspotenzial",
      pages: "Analysierte Innenseiten",
    },
  },

  fr: {
    titles: {
      coloring: ["{subject} — Livre de Coloriage", "Le Grand Livre de Coloriage {subject}", "Mondes Créatifs : {subject}"],
      activity: ["{subject} — Livre d'Activités", "Cahier d'Activités : {subject}"],
    },
    subtitle: {
      coloring: "Illustrations originales de {subject} en pleine page, conçues pour {who} — {benefit}",
      activity: "Exercices créatifs et pages interactives autour de {subject}, conçus pour {who}",
    },
    description: [
      "Trouver une activité hors écran capable de captiver {who} est plus difficile qu'il n'y paraît.",
      "Beaucoup de livres proposent des mises en page confuses, des traits pixelisés ou un papier trop fin qui laisse traverser les feutres.",
      "Cette édition dédiée à {subject} est conçue pour {age} : des motifs nets, un par page, imprimés en recto simple.",
      "Vous cherchez un moyen simple de {benefit} ? Chaque planche stimule la curiosité, la concentration et le sens esthétique.",
      "Aucune trace d'une page à l'autre : parfait avec crayons de couleur, feutres fins et marqueurs.",
      "Ajoutez-le au panier et commencez dès aujourd'hui votre nouvelle routine créative.",
    ],
    audiences: {
      toddlers: {
        who: "les enfants",
        benefit: "réduire le temps d'écran",
        keywords: [
          "livre de coloriage enfant",
          "activité sans écran enfant",
          "cahier de dessin maternelle",
          "cadeau créatif enfant",
          "motricité fine enfant",
          "loisir éducatif maison",
          "grands dessins faciles à colorier",
        ],
      },
      teens: {
        who: "les ados",
        benefit: "exprimer son style",
        keywords: [
          "livre de coloriage ado",
          "dessins modernes à colorier",
          "cadeau créatif adolescent",
          "carnet artistique ado",
          "activité anti stress lycée",
          "coloriage aesthetic",
          "cahier créatif adolescent",
        ],
      },
      adults: {
        who: "les adultes",
        benefit: "se détendre et évacuer le stress",
        keywords: [
          "livre de coloriage adulte",
          "mandala anti stress",
          "colorier pour se détendre",
          "dessins complexes adulte",
          "pleine conscience créative",
          "cadeau anti stress original",
          "coloriage relaxant",
        ],
      },
    },
    compliance: {
      base: "Fichiers correctement structurés. ",
      ok: "Couverture et intérieur vérifiés : prêts pour le téléversement KDP.",
      todo: "Chargez la couverture et le PDF intérieur pour terminer l'audit technique.",
    },
    sales:
      'Comparé aux best-sellers de la niche "{subject}", ce listing exploite des mots-clés peu concurrentiels et des catégories ciblées : fort potentiel organique avec quelques campagnes initiales.',
    exportLabels: {
      title: "TITRE",
      subtitle: "SOUS-TITRE",
      description: "DESCRIPTION (A+/HTML, PAS+AIDA) :",
      keywords: "MOTS-CLÉS BACKEND (7 champs) :",
      box: "Champ",
      categories: "CATÉGORIES (BISAC) :",
      compliance: "Audit qualité & conformité",
      sales: "Potentiel de vente",
      pages: "Pages intérieures analysées",
    },
  },

  es: {
    titles: {
      coloring: ["{subject} — Libro para Colorear", "El Gran Libro para Colorear de {subject}", "Mundos Creativos: {subject}"],
      activity: ["{subject} — Libro de Actividades", "Cuaderno de Actividades: {subject}"],
    },
    subtitle: {
      coloring: "Ilustraciones originales de {subject} a página completa, pensadas para {who} — {benefit}",
      activity: "Ejercicios creativos y páginas interactivas sobre {subject}, pensados para {who}",
    },
    description: [
      "Encontrar una actividad sin pantallas que capte de verdad la atención de {who} es más difícil de lo que parece.",
      "Muchos libros tienen diseños confusos, líneas pixeladas o papel fino que deja traspasar los rotuladores.",
      "Esta edición dedicada a {subject} está creada para {age}: dibujos nítidos, uno por página, impresos a una sola cara.",
      "¿Buscas una forma sencilla de {benefit}? Cada lámina estimula la curiosidad, la concentración y el sentido estético.",
      "Sin manchas entre páginas: perfecto con lápices de colores, rotuladores finos y marcadores.",
      "Añádelo al carrito y empieza hoy mismo tu nueva rutina creativa.",
    ],
    audiences: {
      toddlers: {
        who: "los niños",
        benefit: "reducir el tiempo de pantalla",
        keywords: [
          "libro para colorear niños",
          "actividades sin pantallas",
          "cuaderno de dibujo infantil",
          "regalo creativo para niños",
          "motricidad fina infantil",
          "pasatiempo educativo en casa",
          "dibujos grandes fáciles de colorear",
        ],
      },
      teens: {
        who: "los adolescentes",
        benefit: "expresar su estilo",
        keywords: [
          "libro para colorear adolescentes",
          "dibujos modernos para colorear",
          "regalo creativo adolescente",
          "cuaderno artístico teen",
          "actividad antiestrés estudiantes",
          "colorear aesthetic",
          "cuaderno creativo juvenil",
        ],
      },
      adults: {
        who: "los adultos",
        benefit: "relajarse y liberar estrés",
        keywords: [
          "libro para colorear adultos",
          "mandalas antiestrés",
          "colorear para relajarse",
          "dibujos complejos para adultos",
          "mindfulness creativo",
          "regalo antiestrés original",
          "colorear relajante",
        ],
      },
    },
    compliance: {
      base: "Archivos correctamente estructurados. ",
      ok: "Portada e interior verificados: listos para subir a KDP.",
      todo: "Sube la portada y el PDF interior para completar la auditoría técnica.",
    },
    sales:
      'Comparado con los más vendidos del nicho "{subject}", este listado usa palabras clave de baja competencia y categorías precisas: gran potencial orgánico con campañas iniciales.',
    exportLabels: {
      title: "TÍTULO",
      subtitle: "SUBTÍTULO",
      description: "DESCRIPCIÓN (A+/HTML, PAS+AIDA):",
      keywords: "PALABRAS CLAVE BACKEND (7 campos):",
      box: "Campo",
      categories: "CATEGORÍAS (BISAC):",
      compliance: "Auditoría de calidad y conformidad",
      sales: "Potencial de ventas",
      pages: "Páginas interiores analizadas",
    },
  },

  nl: {
    titles: {
      coloring: ["{subject} — Kleurboek", "Het Grote {subject} Kleurboek", "Creatieve Werelden: {subject}"],
      activity: ["{subject} — Activiteitenboek", "Oefenboek: {subject}"],
    },
    subtitle: {
      coloring: "Originele illustraties van {subject} op hele pagina's, gemaakt voor {who} — {benefit}",
      activity: "Creatieve oefeningen en interactieve pagina's rond {subject}, gemaakt voor {who}",
    },
    description: [
      "Een offline activiteit vinden die {who} echt boeit, is lastiger dan het lijkt.",
      "Veel boeken hebben rommelige lay-outs, vage lijnen of dun papier waar stiften doorheen lekken.",
      "Deze editie rond {subject} is gemaakt voor {age}: scherpe tekeningen, één per pagina, enkelzijdig gedrukt.",
      "Zoek je een eenvoudige manier om {benefit}? Elke plaat prikkelt nieuwsgierigheid, focus en gevoel voor stijl.",
      "Geen doordruk tussen pagina's: ideaal met kleurpotloden, fineliners en markers.",
      "Leg het nu in je winkelwagen en begin vandaag met je creatieve routine.",
    ],
    audiences: {
      toddlers: {
        who: "kinderen",
        benefit: "schermtijd te verminderen",
        keywords: [
          "kleurboek kinderen",
          "activiteit zonder scherm",
          "tekenblok peuters",
          "creatief cadeau kind",
          "fijne motoriek oefenen",
          "educatief tijdverdrijf thuis",
          "grote kleurplaten makkelijk",
        ],
      },
      teens: {
        who: "tieners",
        benefit: "je eigen stijl te laten zien",
        keywords: [
          "kleurboek tieners",
          "moderne kleurplaten",
          "creatief cadeau tiener",
          "aesthetic kleurboek",
          "ontspanning na school",
          "tekenboek jongeren",
          "creatieve hobby tiener",
        ],
      },
      adults: {
        who: "volwassenen",
        benefit: "te ontspannen en stress los te laten",
        keywords: [
          "kleurboek volwassenen",
          "mandala antistress",
          "kleuren om te ontspannen",
          "complexe kleurplaten volwassenen",
          "creatieve mindfulness",
          "antistress cadeau",
          "ontspannend kleurboek",
        ],
      },
    },
    compliance: {
      base: "Bestanden correct gestructureerd. ",
      ok: "Cover en binnenwerk gecontroleerd: klaar voor upload naar KDP.",
      todo: "Upload de cover en de binnenwerk-PDF om de technische audit af te ronden.",
    },
    sales:
      'Vergeleken met de bestsellers in de niche "{subject}" gebruikt deze listing zoekwoorden met lage concurrentie en gerichte categorieën: sterk organisch potentieel met een eerste advertentiecampagne.',
    exportLabels: {
      title: "TITEL",
      subtitle: "ONDERTITEL",
      description: "BESCHRIJVING (A+/HTML, PAS+AIDA):",
      keywords: "BACKEND-ZOEKWOORDEN (7 velden):",
      box: "Veld",
      categories: "CATEGORIEËN (BISAC):",
      compliance: "Kwaliteits- & conformiteitsaudit",
      sales: "Verkooppotentieel",
      pages: "Geanalyseerde binnenpagina's",
    },
  },

  pt: {
    titles: {
      coloring: ["{subject} — Livro de Colorir", "O Grande Livro de Colorir de {subject}", "Mundos Criativos: {subject}"],
      activity: ["{subject} — Livro de Atividades", "Caderno de Atividades: {subject}"],
    },
    subtitle: {
      coloring: "Ilustrações originais de {subject} em página inteira, pensadas para {who} — {benefit}",
      activity: "Exercícios criativos e páginas interativas sobre {subject}, pensados para {who}",
    },
    description: [
      "Encontrar uma atividade sem ecrãs que prenda mesmo a atenção de {who} é mais difícil do que parece.",
      "Muitos livros têm layouts confusos, linhas pixelizadas ou papel fino que deixa passar os marcadores.",
      "Esta edição dedicada a {subject} foi criada para {age}: desenhos nítidos, um por página, impressos só de um lado.",
      "Procura uma forma simples de {benefit}? Cada prancha estimula a curiosidade, a concentração e o sentido estético.",
      "Sem marcas entre páginas: perfeito com lápis de cor, canetas finas e marcadores.",
      "Adicione ao carrinho e comece hoje a sua nova rotina criativa.",
    ],
    audiences: {
      toddlers: {
        who: "as crianças",
        benefit: "reduzir o tempo de ecrã",
        keywords: [
          "livro de colorir infantil",
          "atividade sem ecrãs",
          "caderno de desenho pré-escolar",
          "presente criativo criança",
          "motricidade fina infantil",
          "passatempo educativo em casa",
          "desenhos grandes fáceis de colorir",
        ],
      },
      teens: {
        who: "os adolescentes",
        benefit: "expressar o seu estilo",
        keywords: [
          "livro de colorir adolescentes",
          "desenhos modernos para colorir",
          "presente criativo adolescente",
          "caderno artístico teen",
          "atividade antisstress estudantes",
          "colorir aesthetic",
          "caderno criativo juvenil",
        ],
      },
      adults: {
        who: "os adultos",
        benefit: "relaxar e aliviar o stress",
        keywords: [
          "livro de colorir adultos",
          "mandalas antisstress",
          "colorir para relaxar",
          "desenhos complexos para adultos",
          "mindfulness criativo",
          "presente antisstress original",
          "colorir relaxante",
        ],
      },
    },
    compliance: {
      base: "Ficheiros corretamente estruturados. ",
      ok: "Capa e interior verificados: prontos para o carregamento na KDP.",
      todo: "Carregue a capa e o PDF do interior para concluir a auditoria técnica.",
    },
    sales:
      'Comparado com os bestsellers do nicho "{subject}", este anúncio usa palavras-chave de baixa concorrência e categorias precisas: forte potencial orgânico com campanhas iniciais.',
    exportLabels: {
      title: "TÍTULO",
      subtitle: "SUBTÍTULO",
      description: "DESCRIÇÃO (A+/HTML, PAS+AIDA):",
      keywords: "PALAVRAS-CHAVE BACKEND (7 campos):",
      box: "Campo",
      categories: "CATEGORIAS (BISAC):",
      compliance: "Auditoria de qualidade e conformidade",
      sales: "Potencial de vendas",
      pages: "Páginas interiores analisadas",
    },
  },
};

export const EN_EXPORT_LABELS: LocalePack["exportLabels"] = {
  title: "TITLE",
  subtitle: "SUBTITLE",
  description: "DESCRIPTION (A+/HTML, PAS+AIDA):",
  keywords: "BACKEND KEYWORDS (7 fields):",
  box: "Box",
  categories: "CATEGORIES (BISAC):",
  compliance: "Quality & compliance audit",
  sales: "Sales potential",
  pages: "Analyzed interior pages",
};

export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
}

export function pickTitleTemplates(pack: LocalePack, bookType: BookType): string[] {
  return bookType === "coloring" ? pack.titles.coloring : pack.titles.activity;
}
