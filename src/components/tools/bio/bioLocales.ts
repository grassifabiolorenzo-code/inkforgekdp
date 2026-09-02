/**
 * Pacchetti linguistici per il motore di riserva di Bio Autore & Kit Stampa.
 * Stesso principio di ../pubblicazione/listingLocales.ts e ../blurb/blurbLocales.ts:
 * il fallback (usato quando l'AI non è disponibile) scrive nella lingua di
 * output scelta, non sempre in italiano.
 */

import type { AiToneId } from "@/components/tools/ai/aiStyle";

export type BioLocale = "it" | "en" | "de" | "fr" | "es" | "nl" | "pt";

export interface BioLocalePack {
  openers: Record<AiToneId, string[]>;
  achievementLines: Record<AiToneId, string[]>;
  personalLines: Record<AiToneId, string[]>;
  closers: Record<AiToneId, string[]>;
  defaults: { name: string; niche: string };
  moreInfoLabel: string;
  pressRelease: {
    header: string;
    immediate: string;
    releaseLabel: string;
    newBookDefault: string;
    authorDefault: string;
    announce: (title: string, author: string) => string;
    availableFormat: (title: string, links: string) => string;
    pressContact: string;
  };
}

export const BIO_LOCALE_PACKS: Record<BioLocale, BioLocalePack> = {
  it: {
    openers: {
      professionale: ["{name} è {niche}.", "{name} si occupa di {niche}."],
      amichevole: [
        "{name} è, semplicemente, {niche} — e adora ogni minuto di questo lavoro.",
        "Ciao, sono {name}: {niche}, per passione prima ancora che per mestiere.",
      ],
      energico: [
        "{name} è {niche}, con un ritmo di lavoro che non si ferma mai.",
        "{name} vive {niche_lower} con energia contagiosa.",
      ],
      caloroso: [
        "{name} è {niche}, con uno sguardo sempre attento a chi legge.",
        "{name} racconta {niche_lower} con calore e vicinanza.",
      ],
      autorevole: [
        "{name} è un/una punto di riferimento in materia di {niche_lower}.",
        "{name} porta anni di esperienza in {niche_lower}.",
      ],
      giocoso: [
        "{name} è {niche}. O almeno, questo è quello che scrive nelle bio ufficiali.",
        "{name} fa {niche} di mestiere, e sopravvive a base di caffè e scadenze.",
      ],
    },
    achievementLines: {
      professionale: [
        "Il suo percorso include {achievements}.",
        "Tra i suoi risultati: {achievements}.",
      ],
      amichevole: [
        "Nel suo percorso c'è spazio anche per {achievements} — con più soddisfazione che vanto.",
        "Ha avuto la fortuna di vivere {achievements}.",
      ],
      energico: [
        "Un percorso fatto di risultati concreti: {achievements}.",
        "Ha già raggiunto traguardi importanti, tra cui {achievements}.",
      ],
      caloroso: [
        "Con impegno e costanza è arrivato/a a {achievements}.",
        "Un cammino fatto anche di {achievements}, vissuto con gratitudine.",
      ],
      autorevole: [
        "Tra i suoi risultati più rilevanti: {achievements}.",
        "Il suo curriculum comprende {achievements}.",
      ],
      giocoso: [
        "Vanta anche {achievements}, anche se preferisce non farne un gran parlare (mentendo un po').",
        "Tra i trofei da esibire: {achievements}.",
      ],
    },
    personalLines: {
      professionale: ["Nel tempo libero, {personal}.", "Fuori dal lavoro, {personal}."],
      amichevole: [
        "Quando non scrive, probabilmente {personal}.",
        "A parte questo, {personal} — e ne va fiero/a.",
      ],
      energico: [
        "Nei ritagli di tempo, {personal}.",
        "Anche fuori dal lavoro non si ferma: {personal}.",
      ],
      caloroso: [
        "Nella vita di tutti i giorni, {personal}.",
        "Tiene molto anche al fatto che {personal}.",
      ],
      autorevole: [
        "Al di fuori dell'attività professionale, {personal}.",
        "Coltiva anche altri interessi: {personal}.",
      ],
      giocoso: [
        "Nel tempo libero (quello che rimane) {personal}.",
        "Confessa candidamente che {personal}.",
      ],
    },
    closers: {
      professionale: [
        "Continua a lavorare con dedizione al proprio percorso professionale.",
        "Porta avanti il proprio lavoro con rigore e costanza.",
      ],
      amichevole: [
        "Ama restare in contatto con chi legge le sue opere.",
        "Non vede l'ora di condividere il prossimo capitolo di questa avventura.",
      ],
      energico: [
        "Non ha intenzione di rallentare: il prossimo progetto è già in cantiere.",
        "Continua a spingere sull'acceleratore, un progetto dopo l'altro.",
      ],
      caloroso: [
        "Crede fermamente che ogni storia meriti di essere raccontata con cura.",
        "Continua il proprio cammino con la convinzione che ogni passo conti.",
      ],
      autorevole: [
        "Continua a portare rigore e competenza in tutto ciò che fa.",
        "Rimane un punto di riferimento affidabile nel proprio ambito.",
      ],
      giocoso: [
        "Promette di continuare finché qualcuno avrà voglia di leggerlo/a.",
        "Nel frattempo, continua a scrivere — ovviamente.",
      ],
    },
    defaults: { name: "L'autore", niche: "scrittore/scrittrice" },
    moreInfoLabel: "Per saperne di più:",
    pressRelease: {
      header: "COMUNICATO STAMPA",
      immediate: "Per pubblicazione immediata",
      releaseLabel: "Uscita",
      newBookDefault: "Nuovo libro",
      authorDefault: "l'autore",
      announce: (title, author) => `"${title}", il nuovo lavoro di ${author}, è ora disponibile.`,
      availableFormat: (title, links) =>
        `"${title}" è disponibile su Amazon in formato cartaceo${links ? ` — maggiori informazioni su ${links}` : ""}.`,
      pressContact:
        "Per richieste stampa, interviste o materiale aggiuntivo, contattare l'autore direttamente.",
    },
  },

  en: {
    openers: {
      professionale: ["{name} is {niche}.", "{name} specializes in {niche}."],
      amichevole: [
        "{name} is, quite simply, {niche} — and loves every minute of it.",
        "Hi, I'm {name}: {niche}, out of passion long before it became a job.",
      ],
      energico: [
        "{name} is {niche}, with a pace that never slows down.",
        "{name} lives {niche_lower} with contagious energy.",
      ],
      caloroso: [
        "{name} is {niche}, always writing with readers in mind.",
        "{name} tells {niche_lower} with warmth and closeness.",
      ],
      autorevole: [
        "{name} is a leading voice in {niche_lower}.",
        "{name} brings years of experience in {niche_lower}.",
      ],
      giocoso: [
        "{name} is {niche}. Or so the official bio says, anyway.",
        "{name} does {niche} for a living, and survives on coffee and deadlines.",
      ],
    },
    achievementLines: {
      professionale: [
        "Their path includes {achievements}.",
        "Among their achievements: {achievements}.",
      ],
      amichevole: [
        "Along the way, there's also room for {achievements} — with more pride than boasting.",
        "They've been lucky enough to experience {achievements}.",
      ],
      energico: [
        "A path built on real results: {achievements}.",
        "Already hit some major milestones, including {achievements}.",
      ],
      caloroso: [
        "With dedication and consistency, they've reached {achievements}.",
        "A journey that also includes {achievements}, lived with gratitude.",
      ],
      autorevole: [
        "Among their most notable achievements: {achievements}.",
        "Their track record includes {achievements}.",
      ],
      giocoso: [
        "Also boasts {achievements}, though they'd rather not make a big deal of it (lying a little).",
        "Among the trophies on display: {achievements}.",
      ],
    },
    personalLines: {
      professionale: ["In their spare time, {personal}.", "Outside of work, {personal}."],
      amichevole: [
        "When not writing, they're probably {personal}.",
        "Besides that, {personal} — and they're proud of it.",
      ],
      energico: [
        "In the spare moments, {personal}.",
        "Even outside of work, they don't slow down: {personal}.",
      ],
      caloroso: ["In everyday life, {personal}.", "They also care deeply that {personal}."],
      autorevole: [
        "Outside their professional work, {personal}.",
        "They also pursue other interests: {personal}.",
      ],
      giocoso: [
        "In their free time (what's left of it), {personal}.",
        "They openly admit that {personal}.",
      ],
    },
    closers: {
      professionale: [
        "Continues to work with dedication on their professional path.",
        "Carries their work forward with rigor and consistency.",
      ],
      amichevole: [
        "Loves staying in touch with readers.",
        "Can't wait to share the next chapter of this journey.",
      ],
      energico: [
        "Has no plans to slow down: the next project is already underway.",
        "Keeps pushing forward, one project after another.",
      ],
      caloroso: [
        "Firmly believes every story deserves to be told with care.",
        "Continues on their path, convinced that every step counts.",
      ],
      autorevole: [
        "Continues to bring rigor and expertise to everything they do.",
        "Remains a reliable point of reference in their field.",
      ],
      giocoso: [
        "Promises to keep going as long as someone still wants to read.",
        "In the meantime, keeps writing — obviously.",
      ],
    },
    defaults: { name: "The author", niche: "a writer" },
    moreInfoLabel: "More information:",
    pressRelease: {
      header: "PRESS RELEASE",
      immediate: "For immediate release",
      releaseLabel: "Release",
      newBookDefault: "New book",
      authorDefault: "the author",
      announce: (title, author) => `"${title}", the new work by ${author}, is now available.`,
      availableFormat: (title, links) =>
        `"${title}" is available on Amazon in paperback${links ? ` — more information at ${links}` : ""}.`,
      pressContact:
        "For press inquiries, interviews, or additional materials, please contact the author directly.",
    },
  },

  de: {
    openers: {
      professionale: ["{name} ist {niche}.", "{name} beschäftigt sich mit {niche}."],
      amichevole: [
        "{name} ist ganz einfach {niche} — und liebt jede Minute davon.",
        "Hallo, ich bin {name}: {niche}, aus Leidenschaft, noch bevor es zum Beruf wurde.",
      ],
      energico: [
        "{name} ist {niche}, mit einem Tempo, das nie stillsteht.",
        "{name} lebt {niche_lower} mit ansteckender Energie.",
      ],
      caloroso: [
        "{name} ist {niche}, immer mit einem offenen Blick für die Leserschaft.",
        "{name} erzählt {niche_lower} mit Wärme und Nähe.",
      ],
      autorevole: [
        "{name} ist eine feste Größe im Bereich {niche_lower}.",
        "{name} bringt jahrelange Erfahrung in {niche_lower} mit.",
      ],
      giocoso: [
        "{name} ist {niche}. Zumindest steht das so in der offiziellen Bio.",
        "{name} macht {niche} beruflich und überlebt dank Kaffee und Deadlines.",
      ],
    },
    achievementLines: {
      professionale: [
        "Der bisherige Werdegang umfasst {achievements}.",
        "Zu den Erfolgen zählen: {achievements}.",
      ],
      amichevole: [
        "Im eigenen Werdegang ist auch Platz für {achievements} — mit mehr Freude als Angeberei.",
        "Hatte das Glück, {achievements} zu erleben.",
      ],
      energico: [
        "Ein Werdegang voller konkreter Ergebnisse: {achievements}.",
        "Bereits wichtige Meilensteine erreicht, darunter {achievements}.",
      ],
      caloroso: [
        "Mit Engagement und Beharrlichkeit zu {achievements} gelangt.",
        "Ein Weg, der auch {achievements} umfasst, mit Dankbarkeit gelebt.",
      ],
      autorevole: [
        "Zu den bedeutendsten Erfolgen zählt: {achievements}.",
        "Der Lebenslauf umfasst {achievements}.",
      ],
      giocoso: [
        "Kann auch mit {achievements} aufwarten, spricht aber lieber nicht groß darüber (ein bisschen gelogen).",
        "Zu den vorzeigbaren Trophäen zählt: {achievements}.",
      ],
    },
    personalLines: {
      professionale: ["In der Freizeit {personal}.", "Außerhalb der Arbeit {personal}."],
      amichevole: [
        "Wenn nicht gerade geschrieben wird, dann wahrscheinlich {personal}.",
        "Abgesehen davon {personal} — und ist stolz darauf.",
      ],
      energico: [
        "In den freien Momenten {personal}.",
        "Auch außerhalb der Arbeit gibt es keinen Stillstand: {personal}.",
      ],
      caloroso: ["Im Alltag {personal}.", "Legt auch großen Wert darauf, dass {personal}."],
      autorevole: [
        "Abseits der beruflichen Tätigkeit {personal}.",
        "Pflegt auch andere Interessen: {personal}.",
      ],
      giocoso: ["In der (verbleibenden) Freizeit {personal}.", "Gibt offen zu, dass {personal}."],
    },
    closers: {
      professionale: [
        "Arbeitet weiterhin mit Hingabe am eigenen beruflichen Weg.",
        "Führt die eigene Arbeit mit Sorgfalt und Beständigkeit fort.",
      ],
      amichevole: [
        "Bleibt gerne mit den Leserinnen und Lesern in Kontakt.",
        "Kann es kaum erwarten, das nächste Kapitel dieses Abenteuers zu teilen.",
      ],
      energico: [
        "Denkt nicht ans Bremsen: Das nächste Projekt ist schon in Arbeit.",
        "Gibt weiterhin Vollgas, ein Projekt nach dem anderen.",
      ],
      caloroso: [
        "Ist fest davon überzeugt, dass jede Geschichte mit Sorgfalt erzählt werden sollte.",
        "Geht den eigenen Weg weiter, überzeugt, dass jeder Schritt zählt.",
      ],
      autorevole: [
        "Bringt weiterhin Präzision und Kompetenz in alles ein, was getan wird.",
        "Bleibt eine verlässliche Bezugsgröße im eigenen Bereich.",
      ],
      giocoso: [
        "Verspricht weiterzumachen, solange jemand Lust hat, es zu lesen.",
        "Schreibt in der Zwischenzeit einfach weiter — natürlich.",
      ],
    },
    defaults: { name: "Der Autor", niche: "Autor/Autorin" },
    moreInfoLabel: "Mehr erfahren:",
    pressRelease: {
      header: "PRESSEMITTEILUNG",
      immediate: "Zur sofortigen Veröffentlichung",
      releaseLabel: "Erscheinung",
      newBookDefault: "Neues Buch",
      authorDefault: "der Autor",
      announce: (title, author) =>
        `„${title}", das neue Werk von ${author}, ist ab sofort erhältlich.`,
      availableFormat: (title, links) =>
        `„${title}" ist als Taschenbuch bei Amazon erhältlich${links ? ` — weitere Informationen unter ${links}` : ""}.`,
      pressContact:
        "Für Presseanfragen, Interviews oder zusätzliches Material wenden Sie sich bitte direkt an den Autor.",
    },
  },

  fr: {
    openers: {
      professionale: ["{name} est {niche}.", "{name} se consacre à {niche}."],
      amichevole: [
        "{name} est, tout simplement, {niche} — et adore chaque minute de ce métier.",
        "Bonjour, je suis {name} : {niche}, par passion avant même d'en faire un métier.",
      ],
      energico: [
        "{name} est {niche}, avec un rythme qui ne s'arrête jamais.",
        "{name} vit {niche_lower} avec une énergie contagieuse.",
      ],
      caloroso: [
        "{name} est {niche}, toujours attentif à ses lecteurs.",
        "{name} raconte {niche_lower} avec chaleur et proximité.",
      ],
      autorevole: [
        "{name} est une référence en matière de {niche_lower}.",
        "{name} apporte des années d'expérience en {niche_lower}.",
      ],
      giocoso: [
        "{name} est {niche}. Enfin, c'est ce qu'indique la bio officielle.",
        "{name} fait {niche} comme métier, et survit au café et aux délais.",
      ],
    },
    achievementLines: {
      professionale: [
        "Son parcours inclut {achievements}.",
        "Parmi ses réalisations : {achievements}.",
      ],
      amichevole: [
        "Dans son parcours, il y a aussi de la place pour {achievements} — avec plus de satisfaction que de fierté affichée.",
        "A eu la chance de vivre {achievements}.",
      ],
      energico: [
        "Un parcours fait de résultats concrets : {achievements}.",
        "A déjà atteint des étapes importantes, dont {achievements}.",
      ],
      caloroso: [
        "Avec engagement et constance, est arrivé à {achievements}.",
        "Un chemin fait aussi de {achievements}, vécu avec gratitude.",
      ],
      autorevole: [
        "Parmi ses réalisations les plus notables : {achievements}.",
        "Son parcours comprend {achievements}.",
      ],
      giocoso: [
        "Peut aussi se vanter de {achievements}, même s'il préfère ne pas trop en parler (en mentant un peu).",
        "Parmi les trophées à exhiber : {achievements}.",
      ],
    },
    personalLines: {
      professionale: ["Pendant son temps libre, {personal}.", "En dehors du travail, {personal}."],
      amichevole: [
        "Quand il n'écrit pas, il est probablement en train de {personal}.",
        "À part ça, {personal} — et en est fier.",
      ],
      energico: [
        "Dans les moments de pause, {personal}.",
        "Même en dehors du travail, ça ne s'arrête pas : {personal}.",
      ],
      caloroso: ["Au quotidien, {personal}.", "Tient aussi beaucoup à ce que {personal}."],
      autorevole: [
        "En dehors de son activité professionnelle, {personal}.",
        "Cultive aussi d'autres intérêts : {personal}.",
      ],
      giocoso: [
        "Pendant son temps libre (ce qu'il en reste), {personal}.",
        "Avoue sans détour que {personal}.",
      ],
    },
    closers: {
      professionale: [
        "Continue à travailler avec dévouement sur son parcours professionnel.",
        "Poursuit son travail avec rigueur et constance.",
      ],
      amichevole: [
        "Aime rester en contact avec ses lecteurs.",
        "A hâte de partager le prochain chapitre de cette aventure.",
      ],
      energico: [
        "N'a pas l'intention de ralentir : le prochain projet est déjà en chantier.",
        "Continue d'avancer à fond, un projet après l'autre.",
      ],
      caloroso: [
        "Croit fermement que chaque histoire mérite d'être racontée avec soin.",
        "Poursuit son chemin avec la conviction que chaque pas compte.",
      ],
      autorevole: [
        "Continue d'apporter rigueur et compétence à tout ce qu'il fait.",
        "Reste une référence fiable dans son domaine.",
      ],
      giocoso: [
        "Promet de continuer tant que quelqu'un aura envie de le lire.",
        "En attendant, continue d'écrire — évidemment.",
      ],
    },
    defaults: { name: "L'auteur", niche: "écrivain" },
    moreInfoLabel: "En savoir plus :",
    pressRelease: {
      header: "COMMUNIQUÉ DE PRESSE",
      immediate: "Pour publication immédiate",
      releaseLabel: "Sortie",
      newBookDefault: "Nouveau livre",
      authorDefault: "l'auteur",
      announce: (title, author) =>
        `« ${title} », le nouvel ouvrage de ${author}, est désormais disponible.`,
      availableFormat: (title, links) =>
        `« ${title} » est disponible sur Amazon en format broché${links ? ` — plus d'informations sur ${links}` : ""}.`,
      pressContact:
        "Pour toute demande presse, interview ou matériel complémentaire, veuillez contacter directement l'auteur.",
    },
  },

  es: {
    openers: {
      professionale: ["{name} es {niche}.", "{name} se dedica a {niche}."],
      amichevole: [
        "{name} es, sencillamente, {niche} — y disfruta cada minuto de ello.",
        "Hola, soy {name}: {niche}, por pasión antes incluso que por oficio.",
      ],
      energico: [
        "{name} es {niche}, con un ritmo que nunca se detiene.",
        "{name} vive {niche_lower} con una energía contagiosa.",
      ],
      caloroso: [
        "{name} es {niche}, siempre atento a quien lee.",
        "{name} cuenta {niche_lower} con calidez y cercanía.",
      ],
      autorevole: [
        "{name} es un referente en {niche_lower}.",
        "{name} aporta años de experiencia en {niche_lower}.",
      ],
      giocoso: [
        "{name} es {niche}. O al menos eso dice la biografía oficial.",
        "{name} se dedica a {niche} y sobrevive a base de café y plazos.",
      ],
    },
    achievementLines: {
      professionale: [
        "Su trayectoria incluye {achievements}.",
        "Entre sus logros: {achievements}.",
      ],
      amichevole: [
        "En su trayectoria también hay espacio para {achievements} — con más satisfacción que alarde.",
        "Ha tenido la suerte de vivir {achievements}.",
      ],
      energico: [
        "Una trayectoria hecha de resultados concretos: {achievements}.",
        "Ya ha alcanzado hitos importantes, entre ellos {achievements}.",
      ],
      caloroso: [
        "Con compromiso y constancia, ha llegado a {achievements}.",
        "Un camino hecho también de {achievements}, vivido con gratitud.",
      ],
      autorevole: [
        "Entre sus logros más relevantes: {achievements}.",
        "Su trayectoria incluye {achievements}.",
      ],
      giocoso: [
        "También presume de {achievements}, aunque prefiere no darle mucha importancia (mintiendo un poco).",
        "Entre los trofeos para presumir: {achievements}.",
      ],
    },
    personalLines: {
      professionale: ["En su tiempo libre, {personal}.", "Fuera del trabajo, {personal}."],
      amichevole: [
        "Cuando no escribe, probablemente {personal}.",
        "Aparte de eso, {personal} — y está orgulloso de ello.",
      ],
      energico: [
        "En los ratos libres, {personal}.",
        "Ni siquiera fuera del trabajo se detiene: {personal}.",
      ],
      caloroso: ["En el día a día, {personal}.", "También le importa mucho que {personal}."],
      autorevole: [
        "Fuera de su actividad profesional, {personal}.",
        "Cultiva también otros intereses: {personal}.",
      ],
      giocoso: [
        "En su tiempo libre (el que le queda), {personal}.",
        "Confiesa sin rodeos que {personal}.",
      ],
    },
    closers: {
      professionale: [
        "Sigue trabajando con dedicación en su trayectoria profesional.",
        "Continúa su trabajo con rigor y constancia.",
      ],
      amichevole: [
        "Le encanta mantenerse en contacto con quienes leen sus obras.",
        "No puede esperar a compartir el próximo capítulo de esta aventura.",
      ],
      energico: [
        "No piensa frenar: el próximo proyecto ya está en marcha.",
        "Sigue a toda máquina, un proyecto tras otro.",
      ],
      caloroso: [
        "Cree firmemente que cada historia merece ser contada con cuidado.",
        "Sigue su camino convencido de que cada paso cuenta.",
      ],
      autorevole: [
        "Sigue aportando rigor y competencia a todo lo que hace.",
        "Sigue siendo un referente fiable en su ámbito.",
      ],
      giocoso: [
        "Promete continuar mientras alguien tenga ganas de leerlo.",
        "Mientras tanto, sigue escribiendo — como es lógico.",
      ],
    },
    defaults: { name: "El autor", niche: "escritor" },
    moreInfoLabel: "Más información:",
    pressRelease: {
      header: "NOTA DE PRENSA",
      immediate: "Para publicación inmediata",
      releaseLabel: "Lanzamiento",
      newBookDefault: "Nuevo libro",
      authorDefault: "el autor",
      announce: (title, author) => `"${title}", la nueva obra de ${author}, ya está disponible.`,
      availableFormat: (title, links) =>
        `"${title}" está disponible en Amazon en formato tapa blanda${links ? ` — más información en ${links}` : ""}.`,
      pressContact:
        "Para consultas de prensa, entrevistas o material adicional, contacte directamente con el autor.",
    },
  },

  nl: {
    openers: {
      professionale: ["{name} is {niche}.", "{name} houdt zich bezig met {niche}."],
      amichevole: [
        "{name} is gewoon {niche} — en geniet van elke minuut ervan.",
        "Hoi, ik ben {name}: {niche}, uit passie nog voordat het een beroep werd.",
      ],
      energico: [
        "{name} is {niche}, met een tempo dat nooit stilstaat.",
        "{name} beleeft {niche_lower} met aanstekelijke energie.",
      ],
      caloroso: [
        "{name} is {niche}, altijd met oog voor de lezer.",
        "{name} vertelt over {niche_lower} met warmte en betrokkenheid.",
      ],
      autorevole: [
        "{name} is een vaste waarde op het gebied van {niche_lower}.",
        "{name} brengt jarenlange ervaring mee in {niche_lower}.",
      ],
      giocoso: [
        "{name} is {niche}. Dat staat in ieder geval in de officiële bio.",
        "{name} doet {niche} voor de kost en overleeft op koffie en deadlines.",
      ],
    },
    achievementLines: {
      professionale: [
        "Het traject omvat onder meer {achievements}.",
        "Tot de resultaten behoren: {achievements}.",
      ],
      amichevole: [
        "In het traject is ook ruimte voor {achievements} — met meer voldoening dan opschepperij.",
        "Had het geluk {achievements} mee te maken.",
      ],
      energico: [
        "Een traject vol concrete resultaten: {achievements}.",
        "Heeft al belangrijke mijlpalen bereikt, waaronder {achievements}.",
      ],
      caloroso: [
        "Met inzet en doorzettingsvermogen tot {achievements} gekomen.",
        "Een pad dat ook {achievements} omvat, met dankbaarheid beleefd.",
      ],
      autorevole: [
        "Tot de belangrijkste resultaten behoort: {achievements}.",
        "Het cv omvat {achievements}.",
      ],
      giocoso: [
        "Kan ook bogen op {achievements}, al wordt daar liever niet te veel over uitgeweid (een beetje liegend).",
        "Tot de te tonen trofeeën behoort: {achievements}.",
      ],
    },
    personalLines: {
      professionale: ["In de vrije tijd, {personal}.", "Buiten het werk om, {personal}."],
      amichevole: [
        "Wie niet aan het schrijven is, is waarschijnlijk {personal}.",
        "Daarnaast {personal} — en is daar trots op.",
      ],
      energico: [
        "In de vrije momenten, {personal}.",
        "Ook buiten het werk staat het niet stil: {personal}.",
      ],
      caloroso: [
        "In het dagelijks leven, {personal}.",
        "Hecht er ook veel waarde aan dat {personal}.",
      ],
      autorevole: [
        "Naast het professionele werk, {personal}.",
        "Heeft ook andere interesses: {personal}.",
      ],
      giocoso: [
        "In de vrije tijd (wat daarvan overblijft), {personal}.",
        "Geeft ronduit toe dat {personal}.",
      ],
    },
    closers: {
      professionale: [
        "Blijft zich toewijden aan het eigen professionele pad.",
        "Zet het werk voort met precisie en consistentie.",
      ],
      amichevole: [
        "Houdt ervan om in contact te blijven met lezers.",
        "Kan niet wachten om het volgende hoofdstuk van dit avontuur te delen.",
      ],
      energico: [
        "Denkt er niet aan om vaart te minderen: het volgende project is al in de maak.",
        "Blijft vol gas vooruit gaan, project na project.",
      ],
      caloroso: [
        "Gelooft er sterk in dat elk verhaal met zorg verteld moet worden.",
        "Zet de eigen weg voort, overtuigd dat elke stap telt.",
      ],
      autorevole: [
        "Blijft precisie en expertise inbrengen in alles wat er gebeurt.",
        "Blijft een betrouwbaar aanspreekpunt binnen het eigen vakgebied.",
      ],
      giocoso: [
        "Belooft door te gaan zolang iemand het wil blijven lezen.",
        "Ondertussen blijft er gewoon geschreven worden — uiteraard.",
      ],
    },
    defaults: { name: "De auteur", niche: "schrijver" },
    moreInfoLabel: "Meer weten:",
    pressRelease: {
      header: "PERSBERICHT",
      immediate: "Voor onmiddellijke publicatie",
      releaseLabel: "Verschijning",
      newBookDefault: "Nieuw boek",
      authorDefault: "de auteur",
      announce: (title, author) => `"${title}", het nieuwe werk van ${author}, is nu verkrijgbaar.`,
      availableFormat: (title, links) =>
        `"${title}" is verkrijgbaar bij Amazon als paperback${links ? ` — meer informatie op ${links}` : ""}.`,
      pressContact:
        "Voor perscontact, interviews of aanvullend materiaal kunt u rechtstreeks contact opnemen met de auteur.",
    },
  },

  pt: {
    openers: {
      professionale: ["{name} é {niche}.", "{name} dedica-se a {niche}."],
      amichevole: [
        "{name} é, simplesmente, {niche} — e adora cada minuto disso.",
        "Olá, sou {name}: {niche}, por paixão ainda antes de ser profissão.",
      ],
      energico: [
        "{name} é {niche}, com um ritmo que nunca para.",
        "{name} vive {niche_lower} com uma energia contagiante.",
      ],
      caloroso: [
        "{name} é {niche}, sempre atento a quem lê.",
        "{name} conta {niche_lower} com calor e proximidade.",
      ],
      autorevole: [
        "{name} é uma referência em {niche_lower}.",
        "{name} traz anos de experiência em {niche_lower}.",
      ],
      giocoso: [
        "{name} é {niche}. Pelo menos é o que diz a bio oficial.",
        "{name} faz {niche} para viver, e sobrevive à base de café e prazos.",
      ],
    },
    achievementLines: {
      professionale: [
        "O seu percurso inclui {achievements}.",
        "Entre os seus resultados: {achievements}.",
      ],
      amichevole: [
        "No seu percurso há também espaço para {achievements} — com mais satisfação do que ostentação.",
        "Teve a sorte de viver {achievements}.",
      ],
      energico: [
        "Um percurso feito de resultados concretos: {achievements}.",
        "Já alcançou marcos importantes, entre eles {achievements}.",
      ],
      caloroso: [
        "Com empenho e constância, chegou a {achievements}.",
        "Um caminho feito também de {achievements}, vivido com gratidão.",
      ],
      autorevole: [
        "Entre os seus resultados mais relevantes: {achievements}.",
        "O seu currículo inclui {achievements}.",
      ],
      giocoso: [
        "Também pode gabar-se de {achievements}, embora prefira não falar muito nisso (mentindo um pouco).",
        "Entre os troféus a exibir: {achievements}.",
      ],
    },
    personalLines: {
      professionale: ["Nos tempos livres, {personal}.", "Fora do trabalho, {personal}."],
      amichevole: [
        "Quando não está a escrever, provavelmente {personal}.",
        "Além disso, {personal} — e tem muito orgulho nisso.",
      ],
      energico: [
        "Nos momentos livres, {personal}.",
        "Mesmo fora do trabalho não abranda: {personal}.",
      ],
      caloroso: [
        "No dia a dia, {personal}.",
        "Também dá muita importância ao facto de {personal}.",
      ],
      autorevole: [
        "Fora da atividade profissional, {personal}.",
        "Cultiva também outros interesses: {personal}.",
      ],
      giocoso: [
        "Nos tempos livres (os que restam), {personal}.",
        "Confessa abertamente que {personal}.",
      ],
    },
    closers: {
      professionale: [
        "Continua a trabalhar com dedicação no seu percurso profissional.",
        "Prossegue o seu trabalho com rigor e constância.",
      ],
      amichevole: [
        "Adora manter-se em contacto com quem lê as suas obras.",
        "Mal pode esperar para partilhar o próximo capítulo desta aventura.",
      ],
      energico: [
        "Não tem intenção de abrandar: o próximo projeto já está em curso.",
        "Continua a acelerar, um projeto atrás do outro.",
      ],
      caloroso: [
        "Acredita firmemente que cada história merece ser contada com cuidado.",
        "Continua o seu caminho com a convicção de que cada passo conta.",
      ],
      autorevole: [
        "Continua a trazer rigor e competência a tudo o que faz.",
        "Continua a ser uma referência de confiança na sua área.",
      ],
      giocoso: [
        "Promete continuar enquanto alguém tiver vontade de o ler.",
        "Entretanto, continua a escrever — obviamente.",
      ],
    },
    defaults: { name: "O autor", niche: "escritor" },
    moreInfoLabel: "Saiba mais:",
    pressRelease: {
      header: "COMUNICADO DE IMPRENSA",
      immediate: "Para publicação imediata",
      releaseLabel: "Lançamento",
      newBookDefault: "Novo livro",
      authorDefault: "o autor",
      announce: (title, author) => `"${title}", o novo trabalho de ${author}, já está disponível.`,
      availableFormat: (title, links) =>
        `"${title}" está disponível na Amazon em formato de capa mole${links ? ` — mais informações em ${links}` : ""}.`,
      pressContact:
        "Para pedidos de imprensa, entrevistas ou material adicional, contacte diretamente o autor.",
    },
  },
};
