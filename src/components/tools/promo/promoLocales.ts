/**
 * Pacchetti linguistici per il motore di riserva di Social & Ads Promo Kit.
 * Stesso principio di ../pubblicazione/listingLocales.ts, ../blurb/blurbLocales.ts
 * e ../bio/bioLocales.ts: il fallback (usato quando l'AI non è disponibile)
 * scrive nella lingua di output scelta, non sempre in italiano.
 */

import type { PromoPlatform } from "./promoLogic";

export type PromoLocale = "it" | "en" | "de" | "fr" | "es" | "nl" | "pt";

export interface PromoLocalePack {
  postTemplates: Record<PromoPlatform, string[]>;
  adHeadlineTemplates: string[];
  adBulletTemplates: string[];
  hashtagMany: string;
  defaults: {
    title: string;
    usp: string;
    uspShort: string;
    audience: string;
    cta: string;
    genreFallback: string;
  };
  email: {
    subjectPrefix: string;
    subjectAvailable: string;
    greeting: string;
    announce: (title: string) => string;
    audienceLine: (audienceLower: string) => string;
    defaultCta: string;
    closing: string;
  };
}

export const PROMO_LOCALE_PACKS: Record<PromoLocale, PromoLocalePack> = {
  it: {
    postTemplates: {
      instagram: [
        '📖 "{title}" è finalmente disponibile.\n\n{usp}\n\nPensato per {audience}. {cta} 👇',
        'Ci ho messo il cuore in "{title}" — {usp}\n\nSe ti riconosci in {audience}, questo libro fa per te.\n{cta}',
      ],
      facebook: [
        'Novità in libreria (digitale e cartacea): "{title}".\n\n{usp}\n\nConsigliato a {audience}. {cta}',
        '"{title}" è online. {usp} Se ti interessa {audience_lower}, dagli un\'occhiata: {cta}',
      ],
      tiktok: [
        'POV: hai appena scoperto "{title}" 📚✨ {usp} #booktok',
        'Se sei {audience_lower}, devi assolutamente leggere "{title}". {usp} {cta}',
      ],
      twitter: [
        '"{title}" è uscito. {usp} {cta}',
        'Nuovo libro: "{title}". Pensato per {audience_lower}. {cta}',
      ],
    },
    adHeadlineTemplates: [
      "{title}: {usp_short}",
      "Scopri {title} — {usp_short}",
      "{usp_short}. Leggi {title} oggi stesso",
    ],
    adBulletTemplates: [
      "Perfetto per {audience_lower}",
      "{usp_short}",
      "Disponibile in formato cartaceo ed eBook",
      "Il libro di cui {audience_lower} sta parlando",
    ],
    hashtagMany: "#bookstagram #leggere",
    defaults: {
      title: "il libro",
      usp: "una storia che non dimenticherai",
      uspShort: "una lettura da non perdere",
      audience: "chi ama leggere",
      cta: "Disponibile ora su Amazon.",
      genreFallback: "libri",
    },
    email: {
      subjectPrefix: "Oggetto:",
      subjectAvailable: "è disponibile da oggi",
      greeting: "Ciao,",
      announce: (title) => `sono felice di annunciare che "${title}" è finalmente disponibile.`,
      audienceLine: (audienceLower) =>
        `Se sei ${audienceLower}, penso che questo libro possa fare al caso tuo.`,
      defaultCta: "Puoi trovarlo su Amazon, in formato cartaceo ed eBook.",
      closing: "Grazie per il supporto, come sempre.",
    },
  },

  en: {
    postTemplates: {
      instagram: [
        '📖 "{title}" is finally here.\n\n{usp}\n\nMade for {audience}. {cta} 👇',
        'I poured my heart into "{title}" — {usp}\n\nIf that sounds like {audience}, this book is for you.\n{cta}',
      ],
      facebook: [
        'New release (ebook and paperback): "{title}".\n\n{usp}\n\nRecommended for {audience}. {cta}',
        '"{title}" is now live. {usp} If you\'re into {audience_lower}, check it out: {cta}',
      ],
      tiktok: [
        'POV: you just found "{title}" 📚✨ {usp} #booktok',
        'If you\'re {audience_lower}, you need to read "{title}". {usp} {cta}',
      ],
      twitter: [
        '"{title}" is out now. {usp} {cta}',
        'New book: "{title}". Made for {audience_lower}. {cta}',
      ],
    },
    adHeadlineTemplates: [
      "{title}: {usp_short}",
      "Discover {title} — {usp_short}",
      "{usp_short}. Read {title} today",
    ],
    adBulletTemplates: [
      "Perfect for {audience_lower}",
      "{usp_short}",
      "Available in paperback and eBook",
      "The book {audience_lower} are talking about",
    ],
    hashtagMany: "#bookstagram #booklover",
    defaults: {
      title: "the book",
      usp: "a story you won't forget",
      uspShort: "a must-read",
      audience: "anyone who loves reading",
      cta: "Available now on Amazon.",
      genreFallback: "books",
    },
    email: {
      subjectPrefix: "Subject:",
      subjectAvailable: "is available today",
      greeting: "Hi,",
      announce: (title) => `I'm thrilled to announce that "${title}" is finally available.`,
      audienceLine: (audienceLower) => `If you're ${audienceLower}, I think this book is for you.`,
      defaultCta: "You can find it on Amazon, in paperback and eBook.",
      closing: "Thanks for your support, as always.",
    },
  },

  de: {
    postTemplates: {
      instagram: [
        '📖 „{title}" ist endlich da.\n\n{usp}\n\nGemacht für {audience}. {cta} 👇',
        'Ich habe mein Herz in „{title}" gesteckt — {usp}\n\nWenn dich das an {audience} erinnert, ist dieses Buch genau richtig.\n{cta}',
      ],
      facebook: [
        'Neuerscheinung (E-Book und Taschenbuch): „{title}".\n\n{usp}\n\nEmpfohlen für {audience}. {cta}',
        '„{title}" ist jetzt online. {usp} Wenn dich {audience_lower} interessiert, wirf einen Blick darauf: {cta}',
      ],
      tiktok: [
        'POV: du hast gerade „{title}" entdeckt 📚✨ {usp} #booktok',
        'Wenn du {audience_lower} bist, musst du unbedingt „{title}" lesen. {usp} {cta}',
      ],
      twitter: [
        '„{title}" ist jetzt erhältlich. {usp} {cta}',
        'Neues Buch: „{title}". Gemacht für {audience_lower}. {cta}',
      ],
    },
    adHeadlineTemplates: [
      "{title}: {usp_short}",
      "Entdecke {title} — {usp_short}",
      "{usp_short}. Lies {title} noch heute",
    ],
    adBulletTemplates: [
      "Perfekt für {audience_lower}",
      "{usp_short}",
      "Erhältlich als Taschenbuch und E-Book",
      "Das Buch, über das {audience_lower} spricht",
    ],
    hashtagMany: "#buchtipp #lesen",
    defaults: {
      title: "das Buch",
      usp: "eine Geschichte, die du nicht vergisst",
      uspShort: "eine Lektüre, die man nicht verpassen sollte",
      audience: "alle, die gerne lesen",
      cta: "Jetzt bei Amazon erhältlich.",
      genreFallback: "Bücher",
    },
    email: {
      subjectPrefix: "Betreff:",
      subjectAvailable: "ist ab heute erhältlich",
      greeting: "Hallo,",
      announce: (title) =>
        `ich freue mich, bekannt zu geben, dass „${title}" endlich erhältlich ist.`,
      audienceLine: (audienceLower) =>
        `Wenn du ${audienceLower} bist, könnte dieses Buch genau das Richtige für dich sein.`,
      defaultCta: "Du findest es bei Amazon, als Taschenbuch und E-Book.",
      closing: "Danke für deine Unterstützung, wie immer.",
    },
  },

  fr: {
    postTemplates: {
      instagram: [
        "📖 « {title} » est enfin disponible.\n\n{usp}\n\nPensé pour {audience}. {cta} 👇",
        "J'ai mis tout mon cœur dans « {title} » — {usp}\n\nSi vous vous reconnaissez dans {audience}, ce livre est pour vous.\n{cta}",
      ],
      facebook: [
        "Nouveauté (numérique et broché) : « {title} ».\n\n{usp}\n\nRecommandé pour {audience}. {cta}",
        "« {title} » est en ligne. {usp} Si {audience_lower} vous intéresse, jetez-y un œil : {cta}",
      ],
      tiktok: [
        "POV : vous venez de découvrir « {title} » 📚✨ {usp} #booktok",
        "Si vous êtes {audience_lower}, vous devez absolument lire « {title} ». {usp} {cta}",
      ],
      twitter: [
        "« {title} » est sorti. {usp} {cta}",
        "Nouveau livre : « {title} ». Pensé pour {audience_lower}. {cta}",
      ],
    },
    adHeadlineTemplates: [
      "{title} : {usp_short}",
      "Découvrez {title} — {usp_short}",
      "{usp_short}. Lisez {title} dès aujourd'hui",
    ],
    adBulletTemplates: [
      "Parfait pour {audience_lower}",
      "{usp_short}",
      "Disponible en broché et en eBook",
      "Le livre dont {audience_lower} parle",
    ],
    hashtagMany: "#bookstagram #lecture",
    defaults: {
      title: "le livre",
      usp: "une histoire que vous n'oublierez pas",
      uspShort: "une lecture à ne pas manquer",
      audience: "les amoureux de la lecture",
      cta: "Disponible dès maintenant sur Amazon.",
      genreFallback: "livres",
    },
    email: {
      subjectPrefix: "Objet :",
      subjectAvailable: "est disponible dès aujourd'hui",
      greeting: "Bonjour,",
      announce: (title) => `je suis heureux d'annoncer que « ${title} » est enfin disponible.`,
      audienceLine: (audienceLower) =>
        `Si vous êtes ${audienceLower}, je pense que ce livre est fait pour vous.`,
      defaultCta: "Vous le trouverez sur Amazon, en broché et en eBook.",
      closing: "Merci pour votre soutien, comme toujours.",
    },
  },

  es: {
    postTemplates: {
      instagram: [
        '📖 "{title}" ya está disponible.\n\n{usp}\n\nPensado para {audience}. {cta} 👇',
        'Le puse el corazón a "{title}" — {usp}\n\nSi te identificas con {audience}, este libro es para ti.\n{cta}',
      ],
      facebook: [
        'Novedad en librerías (digital y en papel): "{title}".\n\n{usp}\n\nRecomendado para {audience}. {cta}',
        '"{title}" ya está online. {usp} Si te interesa {audience_lower}, échale un vistazo: {cta}',
      ],
      tiktok: [
        'POV: acabas de descubrir "{title}" 📚✨ {usp} #booktok',
        'Si eres {audience_lower}, tienes que leer "{title}". {usp} {cta}',
      ],
      twitter: [
        '"{title}" ya está disponible. {usp} {cta}',
        'Nuevo libro: "{title}". Pensado para {audience_lower}. {cta}',
      ],
    },
    adHeadlineTemplates: [
      "{title}: {usp_short}",
      "Descubre {title} — {usp_short}",
      "{usp_short}. Lee {title} hoy mismo",
    ],
    adBulletTemplates: [
      "Perfecto para {audience_lower}",
      "{usp_short}",
      "Disponible en tapa blanda y eBook",
      "El libro del que habla {audience_lower}",
    ],
    hashtagMany: "#bookstagram #leer",
    defaults: {
      title: "el libro",
      usp: "una historia que no olvidarás",
      uspShort: "una lectura que no te puedes perder",
      audience: "quienes aman leer",
      cta: "Disponible ya en Amazon.",
      genreFallback: "libros",
    },
    email: {
      subjectPrefix: "Asunto:",
      subjectAvailable: "ya está disponible",
      greeting: "Hola,",
      announce: (title) => `me alegra anunciar que "${title}" ya está disponible.`,
      audienceLine: (audienceLower) =>
        `Si eres ${audienceLower}, creo que este libro te puede interesar.`,
      defaultCta: "Puedes encontrarlo en Amazon, en tapa blanda y eBook.",
      closing: "Gracias por tu apoyo, como siempre.",
    },
  },

  nl: {
    postTemplates: {
      instagram: [
        '📖 "{title}" is eindelijk verkrijgbaar.\n\n{usp}\n\nGemaakt voor {audience}. {cta} 👇',
        'Ik heb mijn hart gestoken in "{title}" — {usp}\n\nAls dit bij {audience} past, is dit boek iets voor jou.\n{cta}',
      ],
      facebook: [
        'Nieuw (e-book en paperback): "{title}".\n\n{usp}\n\nAanbevolen voor {audience}. {cta}',
        '"{title}" staat nu online. {usp} Als {audience_lower} je aanspreekt, kijk dan even: {cta}',
      ],
      tiktok: [
        'POV: je hebt net "{title}" ontdekt 📚✨ {usp} #booktok',
        'Als je {audience_lower} bent, moet je "{title}" lezen. {usp} {cta}',
      ],
      twitter: [
        '"{title}" is uit. {usp} {cta}',
        'Nieuw boek: "{title}". Gemaakt voor {audience_lower}. {cta}',
      ],
    },
    adHeadlineTemplates: [
      "{title}: {usp_short}",
      "Ontdek {title} — {usp_short}",
      "{usp_short}. Lees {title} vandaag nog",
    ],
    adBulletTemplates: [
      "Perfect voor {audience_lower}",
      "{usp_short}",
      "Verkrijgbaar als paperback en e-book",
      "Het boek waar {audience_lower} over praat",
    ],
    hashtagMany: "#boekentip #lezen",
    defaults: {
      title: "het boek",
      usp: "een verhaal dat je niet vergeet",
      uspShort: "een must-read",
      audience: "iedereen die van lezen houdt",
      cta: "Nu verkrijgbaar op Amazon.",
      genreFallback: "boeken",
    },
    email: {
      subjectPrefix: "Onderwerp:",
      subjectAvailable: "is vanaf vandaag verkrijgbaar",
      greeting: "Hoi,",
      announce: (title) =>
        `ik ben blij te kunnen aankondigen dat "${title}" eindelijk verkrijgbaar is.`,
      audienceLine: (audienceLower) =>
        `Als je ${audienceLower} bent, denk ik dat dit boek iets voor je is.`,
      defaultCta: "Je vindt het op Amazon, als paperback en e-book.",
      closing: "Bedankt voor je steun, zoals altijd.",
    },
  },

  pt: {
    postTemplates: {
      instagram: [
        '📖 "{title}" já está disponível.\n\n{usp}\n\nPensado para {audience}. {cta} 👇',
        'Coloquei o coração em "{title}" — {usp}\n\nSe se identifica com {audience}, este livro é para si.\n{cta}',
      ],
      facebook: [
        'Novidade (digital e capa mole): "{title}".\n\n{usp}\n\nRecomendado para {audience}. {cta}',
        '"{title}" já está online. {usp} Se se interessa por {audience_lower}, dê uma vista de olhos: {cta}',
      ],
      tiktok: [
        'POV: acabou de descobrir "{title}" 📚✨ {usp} #booktok',
        'Se é {audience_lower}, tem de ler "{title}". {usp} {cta}',
      ],
      twitter: [
        '"{title}" já saiu. {usp} {cta}',
        'Novo livro: "{title}". Pensado para {audience_lower}. {cta}',
      ],
    },
    adHeadlineTemplates: [
      "{title}: {usp_short}",
      "Descubra {title} — {usp_short}",
      "{usp_short}. Leia {title} hoje mesmo",
    ],
    adBulletTemplates: [
      "Perfeito para {audience_lower}",
      "{usp_short}",
      "Disponível em capa mole e eBook",
      "O livro de que {audience_lower} está a falar",
    ],
    hashtagMany: "#bookstagram #ler",
    defaults: {
      title: "o livro",
      usp: "uma história que não vai esquecer",
      uspShort: "uma leitura imperdível",
      audience: "quem gosta de ler",
      cta: "Disponível já na Amazon.",
      genreFallback: "livros",
    },
    email: {
      subjectPrefix: "Assunto:",
      subjectAvailable: "já está disponível",
      greeting: "Olá,",
      announce: (title) => `tenho o prazer de anunciar que "${title}" já está disponível.`,
      audienceLine: (audienceLower) =>
        `Se é ${audienceLower}, acho que este livro pode ser para si.`,
      defaultCta: "Pode encontrá-lo na Amazon, em capa mole e eBook.",
      closing: "Obrigado pelo apoio, como sempre.",
    },
  },
};
