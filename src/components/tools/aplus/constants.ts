import rawDatabase from "./aplusDatabase.json";
import type { LangId, MultiLangDatabase, NicheId } from "./types";

export const MULTI_LANG_DATABASE = rawDatabase as unknown as MultiLangDatabase;

export const LANGUAGES: { id: LangId; label: string }[] = [
  { id: "it", label: "Italiano" },
  { id: "en", label: "Inglese (US/UK)" },
  { id: "de", label: "Tedesco" },
  { id: "fr", label: "Francese" },
  { id: "es", label: "Spagnolo" },
];

export const NICHES: { id: NicheId; label: string }[] = [
  { id: "music", label: "Spartito / Music" },
  { id: "planner", label: "Planner / Agenda" },
  { id: "coloring", label: "Coloring Book" },
  { id: "generic", label: "Saggistica / Low-Content" },
];

export const AGES = [
  { id: "2-4", label: "2-4 anni" },
  { id: "4-6", label: "4-6 anni" },
  { id: "6-8", label: "6-8 anni" },
  { id: "8-10", label: "8-10 anni" },
  { id: "kids", label: "Categoria Ragazzi" },
  { id: "adults", label: "Categoria Adulti" },
] as const;

interface CopyVariation {
  heroLead: string;
  proofLead: string;
  bodyTail: string;
  gridLead: string;
  altTail: string;
}

export const COPY_VARIATION_BANK: Record<LangId, CopyVariation[]> = {
  it: [
    { heroLead: "SCOPRI UN PROGETTO PENSATO PER TE", proofLead: "GUARDA DA VICINO CIÒ CHE STAI PER SCEGLIERE", bodyTail: " Una presentazione chiara aiuta a capire il progetto prima dell'acquisto.", gridLead: "PENSATO PER L'ESPERIENZA", altTail: " — anteprima editoriale." },
    { heroLead: "PORTA L'ATTENZIONE SUL CONTENUTO", proofLead: "GLI INTERNI RACCONTANO PIÙ DELLA COPERTINA", bodyTail: " L'obiettivo è rendere visibili le caratteristiche che contano davvero nella scelta.", gridLead: "CHIARO AL PRIMO SGUARDO", altTail: " — dettaglio del prodotto." },
    { heroLead: "UN'ESPERIENZA DA SCOPRIRE PAGINA DOPO PAGINA", proofLead: "OSSERVA STILE, STRUTTURA E DETTAGLI", bodyTail: " Così puoi farti un'idea concreta del volume e capire se risponde alle tue aspettative.", gridLead: "DETTAGLI CHE CONTANO", altTail: " — presentazione del volume." },
    { heroLead: "SCEGLI CON PIÙ CONSAPEVOLEZZA", proofLead: "PRIMA DI SCEGLIERE, GUARDA GLI INTERNI", bodyTail: " La trasparenza sulle pagine aiuta a valutare meglio formato, stile e organizzazione.", gridLead: "UNA SCELTA PIÙ INFORMATA", altTail: " — visualizzazione del contenuto." },
    { heroLead: "TRASFORMA LA PRIMA IMPRESSIONE IN CURIOSITÀ", proofLead: "IL DETTAGLIO FA LA DIFFERENZA", bodyTail: " Un invito a esplorare il libro e immaginare come potrebbe entrare nella tua routine.", gridLead: "VALORE VISIBILE", altTail: " — anteprima per l'acquisto." },
  ],
  en: [
    { heroLead: "DISCOVER A PROJECT DESIGNED FOR YOU", proofLead: "SEE MORE OF WHAT YOU ARE CHOOSING", bodyTail: " A clear presentation helps you understand the project before buying.", gridLead: "DESIGNED FOR THE EXPERIENCE", altTail: " — editorial preview." },
    { heroLead: "PUT THE CONTENT IN FOCUS", proofLead: "THE INTERIORS TELL MORE THAN THE COVER", bodyTail: " The goal is to make the details that matter easier to evaluate.", gridLead: "CLEAR AT A GLANCE", altTail: " — product detail." },
    { heroLead: "AN EXPERIENCE TO DISCOVER, PAGE BY PAGE", proofLead: "EXPLORE STYLE, STRUCTURE AND DETAILS", bodyTail: " This gives you a more concrete sense of the book before you decide.", gridLead: "DETAILS THAT MATTER", altTail: " — volume presentation." },
    { heroLead: "CHOOSE WITH MORE CONFIDENCE", proofLead: "BEFORE YOU CHOOSE, TAKE A LOOK INSIDE", bodyTail: " Showing the pages helps you evaluate format, style and organization.", gridLead: "A MORE INFORMED CHOICE", altTail: " — content preview." },
    { heroLead: "TURN FIRST IMPRESSIONS INTO CURIOSITY", proofLead: "DETAILS CAN MAKE THE DIFFERENCE", bodyTail: " Explore the book and imagine how it could fit into your routine.", gridLead: "VALUE YOU CAN SEE", altTail: " — purchase preview." },
  ],
  de: [
    { heroLead: "ENTDECKE EIN PROJEKT, DAS ZU DIR PASST", proofLead: "SIEH DIR GENAU AN, WAS DU AUSWÄHLST", bodyTail: " Eine klare Präsentation hilft dabei, das Projekt vor dem Kauf besser einzuschätzen.", gridLead: "FÜR DAS ERLEBNIS ENTWICKELT", altTail: " — redaktionelle Vorschau." },
    { heroLead: "DAS INHALTLICHE IN DEN MITTELPUNKT STELLEN", proofLead: "DIE INNENSEITEN ZEIGEN MEHR ALS DAS COVER", bodyTail: " So lassen sich die wichtigen Eigenschaften leichter beurteilen.", gridLead: "AUF EINEN BLICK KLAR", altTail: " — Produktdetail." },
    { heroLead: "SEITE FÜR SEITE ENTDECKEN", proofLead: "STIL, AUFBAU UND DETAILS ANSEHEN", bodyTail: " Dadurch entsteht ein konkreterer Eindruck vom Buch, bevor du dich entscheidest.", gridLead: "DETAILS, DIE ZÄHLEN", altTail: " — Präsentation des Buches." },
    { heroLead: "BEWUSSTER ENTSCHEIDEN", proofLead: "VOR DER AUSWAHL EINEN BLICK IN DIE INNENSEITEN WERFEN", bodyTail: " Die Seiten helfen dabei, Format, Stil und Aufbau besser einzuschätzen.", gridLead: "EINE INFORMIERTERE WAHL", altTail: " — Inhaltsvorschau." },
    { heroLead: "DER ERSTE EINDRUCK MACHT NEUGIERIG", proofLead: "AUCH KLEINE DETAILS SIND WICHTIG", bodyTail: " Entdecke das Buch und stelle dir vor, wie es in deinen Alltag passen könnte.", gridLead: "SICHTBARER MEHRWERT", altTail: " — Vorschau für die Kaufentscheidung." },
  ],
  fr: [
    { heroLead: "DÉCOUVREZ UN PROJET PENSÉ POUR VOUS", proofLead: "REGARDEZ DE PLUS PRÈS CE QUE VOUS CHOISISSEZ", bodyTail: " Une présentation claire aide à comprendre le projet avant l'achat.", gridLead: "PENSÉ POUR L'EXPÉRIENCE", altTail: " — aperçu éditorial." },
    { heroLead: "METTEZ LE CONTENU AU PREMIER PLAN", proofLead: "LES PAGES INTÉRIEURES EN DISENT PLUS QUE LA COUVERTURE", bodyTail: " L'objectif est de rendre les éléments importants plus faciles à évaluer.", gridLead: "CLAIR AU PREMIER REGARD", altTail: " — détail du produit." },
    { heroLead: "UNE EXPÉRIENCE À DÉCOUVRIR PAGE APRÈS PAGE", proofLead: "EXPLOREZ LE STYLE, LA STRUCTURE ET LES DÉTAILS", bodyTail: " Vous pouvez ainsi mieux vous faire une idée du livre avant de choisir.", gridLead: "DES DÉTAILS QUI COMPTENT", altTail: " — présentation du volume." },
    { heroLead: "CHOISISSEZ EN TOUTE CONSCIENCE", proofLead: "AVANT DE CHOISIR, REGARDEZ LES PAGES INTÉRIEURES", bodyTail: " Les pages permettent d'évaluer plus concrètement le format, le style et l'organisation.", gridLead: "UN CHOIX PLUS ÉCLAIRÉ", altTail: " — aperçu du contenu." },
    { heroLead: "TRANSFORMEZ LA PREMIÈRE IMPRESSION EN CURIOSITÉ", proofLead: "LES DÉTAILS PEUVENT FAIRE LA DIFFÉRENCE", bodyTail: " Explorez le livre et imaginez comment il pourrait trouver sa place dans votre quotidien.", gridLead: "UNE VALEUR VISIBLE", altTail: " — aperçu avant achat." },
  ],
  es: [
    { heroLead: "DESCUBRE UN PROYECTO PENSADO PARA TI", proofLead: "MIRA DE CERCA LO QUE ESTÁS ELIGIENDO", bodyTail: " Una presentación clara ayuda a comprender el proyecto antes de comprar.", gridLead: "PENSADO PARA LA EXPERIENCIA", altTail: " — vista previa editorial." },
    { heroLead: "PON EL CONTENIDO EN PRIMER PLANO", proofLead: "LAS PÁGINAS INTERIORES CUENTAN MÁS QUE LA PORTADA", bodyTail: " El objetivo es mostrar con claridad los detalles que realmente importan al elegir.", gridLead: "CLARO A PRIMERA VISTA", altTail: " — detalle del producto." },
    { heroLead: "UNA EXPERIENCIA PARA DESCUBRIR, PÁGINA A PÁGINA", proofLead: "EXPLORA ESTILO, ESTRUCTURA Y DETALLES", bodyTail: " Así puedes hacerte una idea más concreta del libro antes de decidir.", gridLead: "DETALLES QUE IMPORTAN", altTail: " — presentación del volumen." },
    { heroLead: "ELIGE CON MAYOR CONFIANZA", proofLead: "ANTES DE ELEGIR, MIRA EL INTERIOR", bodyTail: " Ver las páginas ayuda a valorar mejor el formato, el estilo y la organización.", gridLead: "UNA ELECCIÓN MÁS INFORMADA", altTail: " — vista previa del contenido." },
    { heroLead: "CONVIERTE LA PRIMERA IMPRESIÓN EN CURIOSIDAD", proofLead: "LOS DETALLES PUEDEN MARCAR LA DIFERENCIA", bodyTail: " Explora el libro e imagina cómo podría encajar en tu rutina.", gridLead: "VALOR QUE PUEDES VER", altTail: " — vista previa para la compra." },
  ],
};
