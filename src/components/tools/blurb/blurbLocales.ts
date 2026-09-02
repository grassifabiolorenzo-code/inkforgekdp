/**
 * Pacchetti linguistici per il motore di riserva di Blurb & Sinossi.
 * Stesso principio di ../pubblicazione/listingLocales.ts: qui vive il testo
 * per ogni lingua di output supportata, così il fallback (usato quando l'AI
 * non è disponibile) scrive davvero nella lingua scelta invece di ripiegare
 * sempre sull'italiano indipendentemente dalla lingua richiesta.
 */

import type { AiToneId } from "@/components/tools/ai/aiStyle";
import type { BookGenre } from "./blurbLogic";

export type BlurbLocale = "it" | "en" | "de" | "fr" | "es" | "nl" | "pt";

export interface BlurbLocalePack {
  hookOpeners: Record<BookGenre, string[]>;
  conflictConnectors: Record<AiToneId, string[]>;
  stakesLines: Record<AiToneId, string[]>;
  closingLines: Record<AiToneId, string[]>;
  editorialTemplates: string[];
  defaults: {
    protagonist: string;
    setting: string;
    conflict: string;
    stakes: string;
    title: string;
  };
}

export const BLURB_LOCALE_PACKS: Record<BlurbLocale, BlurbLocalePack> = {
  it: {
    hookOpeners: {
      narrativa: [
        "C'è un momento, nella vita di {protagonist}, in cui tutto cambia.",
        "{protagonist} non lo sa ancora, ma la sua vita sta per essere riscritta.",
      ],
      thriller: [
        "Nessuno avrebbe scommesso su {protagonist}. Ed è proprio per questo che nessuno lo vede arrivare.",
        "Un errore. Una sola scelta sbagliata. Ed ecco che {protagonist} si ritrova senza via d'uscita.",
      ],
      fantasy: [
        "In un mondo dove {setting_or_default}, {protagonist} sta per scoprire chi è davvero.",
        "La leggenda dice che solo uno riuscirà a fermarlo. Nessuno immaginava che sarebbe stato {protagonist}.",
      ],
      romance: [
        "{protagonist} non stava cercando l'amore. È l'amore che l'ha trovata.",
        "Alcune storie iniziano con un incontro. Questa inizia con uno sbaglio.",
      ],
      saggistica: [
        "Cosa succederebbe se tutto quello che pensi di sapere su questo tema fosse sbagliato?",
        "{protagonist} affronta una domanda che in pochi hanno il coraggio di porsi.",
      ],
      memoir: [
        "Questa non è solo la storia di {protagonist}. È la storia di chi ha deciso di ricominciare.",
        "Ci sono verità che si scoprono solo guardando indietro. Questa è una di quelle.",
      ],
      business: [
        "La maggior parte delle persone fallisce per lo stesso, prevedibile motivo. {protagonist} lo sapeva, e ha scelto di fare diversamente.",
        "Non è un altro libro di teoria. È un metodo, testato sul campo da {protagonist}.",
      ],
    },
    conflictConnectors: {
      professionale: [
        "Il nodo centrale emerge quando {conflict}.",
        "La sfida diventa concreta nel momento in cui {conflict}.",
      ],
      amichevole: [
        "Ma quando {conflict}, ogni certezza vacilla.",
        "Tutto cambia quando {conflict}.",
      ],
      energico: [
        "E poi, all'improvviso, {conflict}. Non c'è tempo per pensare, solo per agire.",
        "Il ritmo si spezza in un istante: {conflict}.",
      ],
      caloroso: [
        "Poi, con dolcezza ma senza sconti, arriva il momento in cui {conflict}.",
        "È da {conflict} che nasce la parte più vera di questa storia.",
      ],
      autorevole: [
        "Il punto di svolta è netto: {conflict}.",
        "Non c'è ambiguità quando {conflict}.",
      ],
      giocoso: [
        "Ovviamente, come da copione, {conflict} — perché la vita non perde mai occasione.",
        "E naturalmente, proprio ora, {conflict}.",
      ],
    },
    stakesLines: {
      professionale: ["La posta in gioco è chiara: {stakes}.", "Ne va di {stakes}."],
      amichevole: [
        "In gioco c'è {stakes}, e non c'è modo di tirarsi indietro.",
        "Se fallisce, {stakes}. Non può permetterselo.",
      ],
      energico: [
        "In palio: {stakes}. Tutto o niente.",
        "Non c'è margine di errore: in gioco c'è {stakes}.",
      ],
      caloroso: [
        "Ma proprio in gioco c'è {stakes} — ed è questo a dare senso ad ogni passo.",
        "Vale la pena rischiare, quando in gioco c'è {stakes}.",
      ],
      autorevole: [
        "Il rischio concreto è {stakes}.",
        "L'esito, se le cose andassero male, sarebbe {stakes}.",
      ],
      giocoso: [
        "Poca roba, eh: solo {stakes}.",
        "Nel peggiore dei casi si perde solo {stakes}. Nessuna pressione.",
      ],
    },
    closingLines: {
      professionale: [
        "Un testo di riferimento per chi vuole affrontare il tema con metodo.",
        "Chiaro, concreto, costruito per restare.",
      ],
      amichevole: [
        "Un libro che non si lascia più, dalla prima all'ultima pagina.",
        "Preparati a non staccare gli occhi dalle pagine.",
      ],
      energico: [
        "Un ritmo che non lascia respiro, fino all'ultima riga.",
        "Serrato, imprevedibile, da leggere tutto d'un fiato.",
      ],
      caloroso: [
        "Una lettura che resta, molto dopo l'ultima pagina.",
        "Una storia che si prende cura di chi legge.",
      ],
      autorevole: [
        "Un lavoro solido, costruito con precisione e rigore.",
        "Un riferimento per chi cerca sostanza, non promesse vuote.",
      ],
      giocoso: [
        "Con una buona dose di ironia, perché prendersi troppo sul serio non serve a nessuno.",
        "Un mix di leggerezza e sostanza che non ti aspetti.",
      ],
    },
    editorialTemplates: [
      "«{title} è la lettura che non sapevi di aspettare.»",
      "«{title} colpisce dritto al cuore, scritto con mano sicura.»",
      "«{title} si legge d'un fiato — e si ricorda a lungo.»",
      "«Con {title}, {protagonist} conquista il lettore fin dalle prime righe.»",
    ],
    defaults: {
      protagonist: "il protagonista",
      setting: "nulla è come sembra",
      conflict: "tutto cambia improvvisamente",
      stakes: "molto più di quanto immagini",
      title: "questo libro",
    },
  },

  en: {
    hookOpeners: {
      narrativa: [
        "There's a moment in {protagonist}'s life when everything changes.",
        "{protagonist} doesn't know it yet, but life is about to be rewritten.",
      ],
      thriller: [
        "No one would have bet on {protagonist}. That's exactly why no one sees it coming.",
        "One mistake. One wrong choice. And {protagonist} is suddenly out of options.",
      ],
      fantasy: [
        "In a world where {setting_or_default}, {protagonist} is about to discover who they really are.",
        "Legend says only one will be able to stop it. No one imagined it would be {protagonist}.",
      ],
      romance: [
        "{protagonist} wasn't looking for love. It found them anyway.",
        "Some stories start with a meeting. This one starts with a mistake.",
      ],
      saggistica: [
        "What if everything you think you know about this topic were wrong?",
        "{protagonist} tackles a question few dare to ask.",
      ],
      memoir: [
        "This isn't just {protagonist}'s story. It's the story of someone who chose to start over.",
        "Some truths only reveal themselves in hindsight. This is one of them.",
      ],
      business: [
        "Most people fail for the same, predictable reason. {protagonist} knew it — and chose to do things differently.",
        "This isn't another theory book. It's a method, field-tested by {protagonist}.",
      ],
    },
    conflictConnectors: {
      professionale: [
        "The turning point comes when {conflict}.",
        "The challenge becomes real the moment {conflict}.",
      ],
      amichevole: [
        "But when {conflict}, every certainty crumbles.",
        "Everything changes when {conflict}.",
      ],
      energico: [
        "And then, suddenly, {conflict}. No time to think — only to act.",
        "The rhythm breaks in an instant: {conflict}.",
      ],
      caloroso: [
        "Then, gently but without holding back, comes the moment when {conflict}.",
        "It's from {conflict} that the truest part of this story is born.",
      ],
      autorevole: [
        "The turning point is unmistakable: {conflict}.",
        "There's no ambiguity when {conflict}.",
      ],
      giocoso: [
        "Naturally, right on cue, {conflict} — because life never misses a chance.",
        "And of course, right now, {conflict}.",
      ],
    },
    stakesLines: {
      professionale: ["The stakes are clear: {stakes}.", "At stake is {stakes}."],
      amichevole: [
        "At stake is {stakes}, and there's no turning back.",
        "If it fails, {stakes}. That's not an option.",
      ],
      energico: [
        "On the line: {stakes}. All or nothing.",
        "No margin for error: {stakes} is at stake.",
      ],
      caloroso: [
        "What's really at stake is {stakes} — and that's what gives every step meaning.",
        "It's worth the risk, when {stakes} is on the line.",
      ],
      autorevole: [
        "The real risk is {stakes}.",
        "If things went wrong, the outcome would be {stakes}.",
      ],
      giocoso: [
        "No big deal, really: just {stakes}.",
        "Worst case, you only lose {stakes}. No pressure.",
      ],
    },
    closingLines: {
      professionale: [
        "A reference text for anyone who wants to tackle the subject with method.",
        "Clear, concrete, built to last.",
      ],
      amichevole: [
        "A book you won't put down, from the first page to the last.",
        "Get ready to keep your eyes on the page.",
      ],
      energico: [
        "A pace that doesn't let up, right to the last line.",
        "Tight, unpredictable, a one-sitting read.",
      ],
      caloroso: [
        "A read that stays with you, long after the last page.",
        "A story that takes care of its reader.",
      ],
      autorevole: [
        "A solid work, built with precision and rigor.",
        "A reference for anyone looking for substance, not empty promises.",
      ],
      giocoso: [
        "With a healthy dose of irony, because taking yourself too seriously never helps.",
        "A mix of lightness and substance you won't see coming.",
      ],
    },
    editorialTemplates: [
      '"{title} is the read you didn\'t know you were waiting for."',
      '"Written with a steady hand: {title} hits straight at the heart."',
      '"{title} is a one-sitting read — and one that stays with you."',
      '"With {title}, {protagonist} wins readers over from the very first lines."',
    ],
    defaults: {
      protagonist: "the protagonist",
      setting: "nothing is as it seems",
      conflict: "everything changes suddenly",
      stakes: "far more than you'd imagine",
      title: "this book",
    },
  },

  de: {
    hookOpeners: {
      narrativa: [
        "Es gibt einen Moment im Leben von {protagonist}, in dem sich alles ändert.",
        "{protagonist} weiß es noch nicht, aber das Leben steht kurz davor, neu geschrieben zu werden.",
      ],
      thriller: [
        "Niemand hätte auf {protagonist} gewettet. Genau deshalb sieht es niemand kommen.",
        "Ein Fehler. Eine einzige falsche Entscheidung. Und schon steckt {protagonist} in der Falle.",
      ],
      fantasy: [
        "In einer Welt, in der {setting_or_default}, entdeckt {protagonist} gleich, wer er wirklich ist.",
        "Die Legende sagt, nur einer kann es aufhalten. Niemand hätte gedacht, dass es {protagonist} sein würde.",
      ],
      romance: [
        "{protagonist} hat nicht nach der Liebe gesucht. Die Liebe hat trotzdem gefunden.",
        "Manche Geschichten beginnen mit einer Begegnung. Diese beginnt mit einem Fehler.",
      ],
      saggistica: [
        "Was, wenn alles, was du über dieses Thema zu wissen glaubst, falsch wäre?",
        "{protagonist} stellt sich einer Frage, die sich nur wenige zu stellen trauen.",
      ],
      memoir: [
        "Das ist nicht nur die Geschichte von {protagonist}. Es ist die Geschichte von jemandem, der beschlossen hat, neu anzufangen.",
        "Manche Wahrheiten erkennt man erst im Rückblick. Dies ist eine davon.",
      ],
      business: [
        "Die meisten Menschen scheitern aus demselben, vorhersehbaren Grund. {protagonist} wusste das — und hat sich entschieden, es anders zu machen.",
        "Das ist kein weiteres Theoriebuch. Es ist eine Methode, in der Praxis erprobt von {protagonist}.",
      ],
    },
    conflictConnectors: {
      professionale: [
        "Der zentrale Wendepunkt kommt, als {conflict}.",
        "Die Herausforderung wird greifbar, sobald {conflict}.",
      ],
      amichevole: [
        "Doch als {conflict}, gerät jede Gewissheit ins Wanken.",
        "Alles ändert sich, als {conflict}.",
      ],
      energico: [
        "Und dann, plötzlich, {conflict}. Keine Zeit zum Nachdenken, nur zum Handeln.",
        "Der Rhythmus bricht in einem Moment: {conflict}.",
      ],
      caloroso: [
        "Dann, sanft aber unausweichlich, kommt der Moment, in dem {conflict}.",
        "Aus {conflict} entsteht der wahrste Teil dieser Geschichte.",
      ],
      autorevole: [
        "Der Wendepunkt ist eindeutig: {conflict}.",
        "Es gibt keinen Zweifel, wenn {conflict}.",
      ],
      giocoso: [
        "Natürlich, wie es sich gehört, passiert {conflict} — das Leben lässt sich schließlich keine Gelegenheit entgehen.",
        "Und klar, ausgerechnet jetzt, {conflict}.",
      ],
    },
    stakesLines: {
      professionale: ["Der Einsatz ist klar: {stakes}.", "Auf dem Spiel steht {stakes}."],
      amichevole: [
        "Auf dem Spiel steht {stakes}, und es gibt kein Zurück.",
        "Wenn es scheitert, {stakes}. Das ist keine Option.",
      ],
      energico: [
        "Auf dem Spiel: {stakes}. Alles oder nichts.",
        "Kein Raum für Fehler: Es geht um {stakes}.",
      ],
      caloroso: [
        "Doch genau {stakes} steht auf dem Spiel — und das gibt jedem Schritt einen Sinn.",
        "Es lohnt sich, das Risiko einzugehen, wenn {stakes} auf dem Spiel steht.",
      ],
      autorevole: [
        "Das konkrete Risiko ist {stakes}.",
        "Sollte es schiefgehen, wäre das Ergebnis {stakes}.",
      ],
      giocoso: [
        "Nicht der Rede wert: nur {stakes}.",
        "Im schlimmsten Fall verliert man nur {stakes}. Kein Druck.",
      ],
    },
    closingLines: {
      professionale: [
        "Ein Referenzwerk für alle, die das Thema methodisch angehen wollen.",
        "Klar, konkret, gebaut, um zu bleiben.",
      ],
      amichevole: [
        "Ein Buch, das man von der ersten bis zur letzten Seite nicht mehr aus der Hand legt.",
        "Mach dich bereit, den Blick nicht mehr von den Seiten zu lösen.",
      ],
      energico: [
        "Ein Tempo, das bis zur letzten Zeile keine Atempause lässt.",
        "Straff, unvorhersehbar, in einem Rutsch gelesen.",
      ],
      caloroso: [
        "Eine Lektüre, die noch lange nach der letzten Seite bleibt.",
        "Eine Geschichte, die sich um ihre Leser kümmert.",
      ],
      autorevole: [
        "Ein solides Werk, präzise und mit Sorgfalt gebaut.",
        "Ein Referenzpunkt für alle, die Substanz statt leerer Versprechen suchen.",
      ],
      giocoso: [
        "Mit einer guten Portion Ironie, denn sich selbst zu ernst zu nehmen bringt niemandem etwas.",
        "Eine Mischung aus Leichtigkeit und Substanz, die man nicht erwartet.",
      ],
    },
    editorialTemplates: [
      "„{title} ist die Lektüre, von der du nicht wusstest, dass du auf sie gewartet hast.“",
      "„Mit sicherer Hand geschrieben: {title} trifft mitten ins Herz.“",
      "„{title} liest sich in einem Rutsch — und bleibt lange im Gedächtnis.“",
      "„Mit {title} gewinnt {protagonist} die Leser schon in den ersten Zeilen.“",
    ],
    defaults: {
      protagonist: "die Hauptfigur",
      setting: "nichts ist, wie es scheint",
      conflict: "sich plötzlich alles ändert",
      stakes: "weit mehr, als man denkt",
      title: "dieses Buch",
    },
  },

  fr: {
    hookOpeners: {
      narrativa: [
        "Il y a un moment, dans la vie de {protagonist}, où tout change.",
        "{protagonist} ne le sait pas encore, mais sa vie est sur le point d'être réécrite.",
      ],
      thriller: [
        "Personne n'aurait parié sur {protagonist}. C'est justement pour ça que personne ne le voit venir.",
        "Une erreur. Un seul mauvais choix. Et {protagonist} se retrouve sans issue.",
      ],
      fantasy: [
        "Dans un monde où {setting_or_default}, {protagonist} est sur le point de découvrir qui il est vraiment.",
        "La légende dit qu'un seul pourra l'arrêter. Personne n'imaginait que ce serait {protagonist}.",
      ],
      romance: [
        "{protagonist} ne cherchait pas l'amour. C'est l'amour qui l'a trouvé.",
        "Certaines histoires commencent par une rencontre. Celle-ci commence par une erreur.",
      ],
      saggistica: [
        "Et si tout ce que vous pensez savoir sur ce sujet était faux ?",
        "{protagonist} affronte une question que peu osent se poser.",
      ],
      memoir: [
        "Ce n'est pas seulement l'histoire de {protagonist}. C'est l'histoire de quelqu'un qui a décidé de repartir à zéro.",
        "Certaines vérités ne se révèlent qu'en regardant en arrière. En voici une.",
      ],
      business: [
        "La plupart des gens échouent pour la même raison, prévisible. {protagonist} le savait, et a choisi de faire autrement.",
        "Ce n'est pas un énième livre de théorie. C'est une méthode, testée sur le terrain par {protagonist}.",
      ],
    },
    conflictConnectors: {
      professionale: [
        "Le nœud central apparaît quand {conflict}.",
        "Le défi devient concret au moment où {conflict}.",
      ],
      amichevole: [
        "Mais quand {conflict}, toutes les certitudes vacillent.",
        "Tout change quand {conflict}.",
      ],
      energico: [
        "Et puis, soudain, {conflict}. Plus le temps de réfléchir, seulement d'agir.",
        "Le rythme se brise en un instant : {conflict}.",
      ],
      caloroso: [
        "Puis, avec douceur mais sans détour, vient le moment où {conflict}.",
        "C'est de {conflict} que naît la part la plus vraie de cette histoire.",
      ],
      autorevole: ["Le tournant est net : {conflict}.", "Aucune ambiguïté quand {conflict}."],
      giocoso: [
        "Évidemment, comme prévu, {conflict} — parce que la vie ne rate jamais une occasion.",
        "Et bien sûr, juste maintenant, {conflict}.",
      ],
    },
    stakesLines: {
      professionale: ["L'enjeu est clair : {stakes}.", "Ce qui est en jeu, c'est {stakes}."],
      amichevole: [
        "Ce qui est en jeu, c'est {stakes}, et il n'y a pas moyen de reculer.",
        "En cas d'échec, {stakes}. Impossible de se le permettre.",
      ],
      energico: [
        "En jeu : {stakes}. Tout ou rien.",
        "Aucune marge d'erreur : {stakes} est en jeu.",
      ],
      caloroso: [
        "Mais ce qui est vraiment en jeu, c'est {stakes} — et c'est ce qui donne un sens à chaque pas.",
        "Ça vaut le risque, quand {stakes} est en jeu.",
      ],
      autorevole: [
        "Le risque concret, c'est {stakes}.",
        "Si les choses tournaient mal, le résultat serait {stakes}.",
      ],
      giocoso: [
        "Pas grand-chose, hein : juste {stakes}.",
        "Au pire, on ne perd que {stakes}. Aucune pression.",
      ],
    },
    closingLines: {
      professionale: [
        "Un ouvrage de référence pour qui veut aborder le sujet avec méthode.",
        "Clair, concret, construit pour durer.",
      ],
      amichevole: [
        "Un livre qu'on ne lâche plus, de la première à la dernière page.",
        "Préparez-vous à ne plus décrocher les yeux des pages.",
      ],
      energico: [
        "Un rythme qui ne laisse aucun répit, jusqu'à la dernière ligne.",
        "Serré, imprévisible, à lire d'une traite.",
      ],
      caloroso: [
        "Une lecture qui reste, longtemps après la dernière page.",
        "Une histoire qui prend soin de son lecteur.",
      ],
      autorevole: [
        "Un travail solide, construit avec précision et rigueur.",
        "Une référence pour qui cherche du fond, pas des promesses vides.",
      ],
      giocoso: [
        "Avec une bonne dose d'ironie, parce que se prendre trop au sérieux ne sert à personne.",
        "Un mélange de légèreté et de fond qu'on n'attend pas.",
      ],
    },
    editorialTemplates: [
      "« {title} est la lecture que vous ne saviez pas attendre. »",
      "« Écrit d'une main sûre : {title} touche droit au cœur. »",
      "« {title} se lit d'une traite — et reste en mémoire longtemps. »",
      "« Avec {title}, {protagonist} conquiert le lecteur dès les premières lignes. »",
    ],
    defaults: {
      protagonist: "le protagoniste",
      setting: "rien n'est comme il paraît",
      conflict: "tout change soudainement",
      stakes: "bien plus que ce qu'on imagine",
      title: "ce livre",
    },
  },

  es: {
    hookOpeners: {
      narrativa: [
        "Hay un momento, en la vida de {protagonist}, en que todo cambia.",
        "{protagonist} todavía no lo sabe, pero su vida está a punto de reescribirse.",
      ],
      thriller: [
        "Nadie habría apostado por {protagonist}. Precisamente por eso nadie lo ve venir.",
        "Un error. Una sola decisión equivocada. Y {protagonist} se queda sin salida.",
      ],
      fantasy: [
        "En un mundo donde {setting_or_default}, {protagonist} está a punto de descubrir quién es realmente.",
        "La leyenda dice que solo uno podrá detenerlo. Nadie imaginaba que sería {protagonist}.",
      ],
      romance: [
        "{protagonist} no buscaba el amor. Fue el amor quien lo encontró.",
        "Algunas historias empiezan con un encuentro. Esta empieza con un error.",
      ],
      saggistica: [
        "¿Y si todo lo que crees saber sobre este tema estuviera equivocado?",
        "{protagonist} se enfrenta a una pregunta que pocos se atreven a hacerse.",
      ],
      memoir: [
        "Esta no es solo la historia de {protagonist}. Es la historia de quien decidió empezar de nuevo.",
        "Hay verdades que solo se descubren mirando atrás. Esta es una de ellas.",
      ],
      business: [
        "La mayoría fracasa por el mismo motivo, previsible. {protagonist} lo sabía, y eligió hacerlo diferente.",
        "Este no es otro libro de teoría. Es un método, probado sobre el terreno por {protagonist}.",
      ],
    },
    conflictConnectors: {
      professionale: [
        "El nudo central aparece cuando {conflict}.",
        "El desafío se vuelve concreto en el momento en que {conflict}.",
      ],
      amichevole: [
        "Pero cuando {conflict}, todas las certezas se tambalean.",
        "Todo cambia cuando {conflict}.",
      ],
      energico: [
        "Y entonces, de repente, {conflict}. No hay tiempo para pensar, solo para actuar.",
        "El ritmo se rompe en un instante: {conflict}.",
      ],
      caloroso: [
        "Luego, con delicadeza pero sin concesiones, llega el momento en que {conflict}.",
        "Es de {conflict} de donde nace la parte más verdadera de esta historia.",
      ],
      autorevole: [
        "El punto de inflexión es claro: {conflict}.",
        "No hay ambigüedad cuando {conflict}.",
      ],
      giocoso: [
        "Como era de esperar, {conflict} — porque la vida nunca pierde ocasión.",
        "Y, por supuesto, justo ahora, {conflict}.",
      ],
    },
    stakesLines: {
      professionale: ["Lo que está en juego es claro: {stakes}.", "Está en juego {stakes}."],
      amichevole: [
        "Está en juego {stakes}, y no hay manera de echarse atrás.",
        "Si falla, {stakes}. No puede permitírselo.",
      ],
      energico: [
        "En juego: {stakes}. Todo o nada.",
        "Sin margen de error: está en juego {stakes}.",
      ],
      caloroso: [
        "Pero lo que realmente está en juego es {stakes} — y eso da sentido a cada paso.",
        "Vale la pena arriesgarse, cuando está en juego {stakes}.",
      ],
      autorevole: [
        "El riesgo real es {stakes}.",
        "Si las cosas salieran mal, el resultado sería {stakes}.",
      ],
      giocoso: [
        "Poca cosa, ¿eh?: solo {stakes}.",
        "En el peor de los casos, solo se pierde {stakes}. Sin presión.",
      ],
    },
    closingLines: {
      professionale: [
        "Un texto de referencia para quien quiera abordar el tema con método.",
        "Claro, concreto, construido para perdurar.",
      ],
      amichevole: [
        "Un libro que no se suelta, de la primera a la última página.",
        "Prepárate para no despegar los ojos de las páginas.",
      ],
      energico: [
        "Un ritmo que no da tregua, hasta la última línea.",
        "Intenso, imprevisible, para leer de un tirón.",
      ],
      caloroso: [
        "Una lectura que se queda, mucho después de la última página.",
        "Una historia que cuida a quien la lee.",
      ],
      autorevole: [
        "Un trabajo sólido, construido con precisión y rigor.",
        "Una referencia para quien busca sustancia, no promesas vacías.",
      ],
      giocoso: [
        "Con una buena dosis de ironía, porque tomarse demasiado en serio no le sirve a nadie.",
        "Una mezcla de ligereza y sustancia que no te esperas.",
      ],
    },
    editorialTemplates: [
      "«{title} es la lectura que no sabías que estabas esperando.»",
      "«Escrito con mano firme: {title} llega directo al corazón.»",
      "«{title} se lee de un tirón — y se recuerda durante mucho tiempo.»",
      "«Con {title}, {protagonist} conquista al lector desde las primeras líneas.»",
    ],
    defaults: {
      protagonist: "el protagonista",
      setting: "nada es lo que parece",
      conflict: "todo cambia de repente",
      stakes: "mucho más de lo que imaginas",
      title: "este libro",
    },
  },

  nl: {
    hookOpeners: {
      narrativa: [
        "Er is een moment in het leven van {protagonist} waarop alles verandert.",
        "{protagonist} weet het nog niet, maar het leven staat op het punt herschreven te worden.",
      ],
      thriller: [
        "Niemand had op {protagonist} gewed. Precies daarom ziet niemand het aankomen.",
        "Eén fout. Eén verkeerde keuze. En {protagonist} zit plotseling zonder uitweg.",
      ],
      fantasy: [
        "In een wereld waar {setting_or_default}, ontdekt {protagonist} zo wie hij werkelijk is.",
        "De legende zegt dat slechts één het kan stoppen. Niemand had gedacht dat het {protagonist} zou zijn.",
      ],
      romance: [
        "{protagonist} was niet op zoek naar liefde. De liefde vond hem toch.",
        "Sommige verhalen beginnen met een ontmoeting. Dit verhaal begint met een vergissing.",
      ],
      saggistica: [
        "Wat als alles wat je denkt te weten over dit onderwerp verkeerd is?",
        "{protagonist} stelt een vraag die maar weinigen durven stellen.",
      ],
      memoir: [
        "Dit is niet alleen het verhaal van {protagonist}. Het is het verhaal van iemand die besloot opnieuw te beginnen.",
        "Sommige waarheden ontdek je pas achteraf. Dit is er één van.",
      ],
      business: [
        "De meeste mensen falen om dezelfde, voorspelbare reden. {protagonist} wist dat — en koos ervoor het anders te doen.",
        "Dit is geen zoveelste theorieboek. Het is een methode, in de praktijk getest door {protagonist}.",
      ],
    },
    conflictConnectors: {
      professionale: [
        "Het centrale keerpunt komt wanneer {conflict}.",
        "De uitdaging wordt concreet op het moment dat {conflict}.",
      ],
      amichevole: [
        "Maar wanneer {conflict}, wankelt elke zekerheid.",
        "Alles verandert wanneer {conflict}.",
      ],
      energico: [
        "En dan, plotseling, {conflict}. Geen tijd om na te denken, alleen om te handelen.",
        "Het ritme breekt in een oogwenk: {conflict}.",
      ],
      caloroso: [
        "Dan, zacht maar onontkoombaar, komt het moment waarop {conflict}.",
        "Juist uit {conflict} ontstaat het meest waarachtige deel van dit verhaal.",
      ],
      autorevole: [
        "Het keerpunt is duidelijk: {conflict}.",
        "Er is geen twijfel mogelijk wanneer {conflict}.",
      ],
      giocoso: [
        "Natuurlijk, precies zoals verwacht, {conflict} — want het leven laat nooit een kans lopen.",
        "En natuurlijk, net nu, {conflict}.",
      ],
    },
    stakesLines: {
      professionale: ["De inzet is duidelijk: {stakes}.", "Op het spel staat {stakes}."],
      amichevole: [
        "Op het spel staat {stakes}, en er is geen weg terug.",
        "Als het mislukt, {stakes}. Dat kan hij zich niet veroorloven.",
      ],
      energico: [
        "Op het spel: {stakes}. Alles of niets.",
        "Geen ruimte voor fouten: op het spel staat {stakes}.",
      ],
      caloroso: [
        "Maar wat werkelijk op het spel staat is {stakes} — en dat geeft elke stap betekenis.",
        "Het risico is het waard, wanneer {stakes} op het spel staat.",
      ],
      autorevole: [
        "Het concrete risico is {stakes}.",
        "Als het misging, zou de uitkomst {stakes} zijn.",
      ],
      giocoso: [
        "Niet veel bijzonders, hoor: alleen {stakes}.",
        "In het ergste geval verlies je alleen {stakes}. Geen druk.",
      ],
    },
    closingLines: {
      professionale: [
        "Een referentiewerk voor wie het onderwerp methodisch wil aanpakken.",
        "Helder, concreet, gebouwd om te blijven.",
      ],
      amichevole: [
        "Een boek dat je niet meer weglegt, van de eerste tot de laatste pagina.",
        "Bereid je voor om je ogen niet meer van de pagina's te kunnen halen.",
      ],
      energico: [
        "Een tempo dat tot de laatste regel geen adempauze gunt.",
        "Strak, onvoorspelbaar, in één ruk uitgelezen.",
      ],
      caloroso: [
        "Een verhaal dat blijft hangen, lang na de laatste pagina.",
        "Een verhaal dat zorg draagt voor zijn lezer.",
      ],
      autorevole: [
        "Een solide werk, met precisie en nauwgezetheid gebouwd.",
        "Een referentie voor wie inhoud zoekt, geen loze beloftes.",
      ],
      giocoso: [
        "Met een gezonde dosis ironie, want jezelf te serieus nemen helpt niemand.",
        "Een mix van luchtigheid en inhoud die je niet ziet aankomen.",
      ],
    },
    editorialTemplates: [
      "„{title} is de lectuur waarvan je niet wist dat je erop wachtte.”",
      "„Met vaste hand geschreven: {title} raakt recht in het hart.”",
      "„{title} lees je in één ruk uit — en blijft je nog lang bij.”",
      "„Met {title} wint {protagonist} de lezer al vanaf de eerste regels voor zich.”",
    ],
    defaults: {
      protagonist: "de hoofdpersoon",
      setting: "niets is wat het lijkt",
      conflict: "plotseling alles verandert",
      stakes: "veel meer dan je zou denken",
      title: "dit boek",
    },
  },

  pt: {
    hookOpeners: {
      narrativa: [
        "Há um momento, na vida de {protagonist}, em que tudo muda.",
        "{protagonist} ainda não sabe, mas a sua vida está prestes a ser reescrita.",
      ],
      thriller: [
        "Ninguém teria apostado em {protagonist}. É exatamente por isso que ninguém o vê chegar.",
        "Um erro. Uma única escolha errada. E {protagonist} fica sem saída.",
      ],
      fantasy: [
        "Num mundo onde {setting_or_default}, {protagonist} está prestes a descobrir quem realmente é.",
        "A lenda diz que só um conseguirá impedi-lo. Ninguém imaginava que seria {protagonist}.",
      ],
      romance: [
        "{protagonist} não andava à procura do amor. Foi o amor que o encontrou.",
        "Algumas histórias começam com um encontro. Esta começa com um erro.",
      ],
      saggistica: [
        "E se tudo o que pensa saber sobre este tema estivesse errado?",
        "{protagonist} enfrenta uma pergunta que poucos têm coragem de fazer.",
      ],
      memoir: [
        "Esta não é só a história de {protagonist}. É a história de alguém que decidiu recomeçar.",
        "Há verdades que só se descobrem olhando para trás. Esta é uma delas.",
      ],
      business: [
        "A maioria falha pelo mesmo motivo previsível. {protagonist} sabia disso — e escolheu fazer diferente.",
        "Este não é mais um livro de teoria. É um método, testado na prática por {protagonist}.",
      ],
    },
    conflictConnectors: {
      professionale: [
        "O nó central surge quando {conflict}.",
        "O desafio torna-se concreto no momento em que {conflict}.",
      ],
      amichevole: [
        "Mas quando {conflict}, todas as certezas vacilam.",
        "Tudo muda quando {conflict}.",
      ],
      energico: [
        "E depois, de repente, {conflict}. Não há tempo para pensar, só para agir.",
        "O ritmo quebra num instante: {conflict}.",
      ],
      caloroso: [
        "Depois, com delicadeza mas sem hesitar, chega o momento em que {conflict}.",
        "É de {conflict} que nasce a parte mais verdadeira desta história.",
      ],
      autorevole: [
        "O ponto de viragem é claro: {conflict}.",
        "Não há ambiguidade quando {conflict}.",
      ],
      giocoso: [
        "Como seria de esperar, {conflict} — porque a vida nunca perde uma oportunidade.",
        "E claro, mesmo agora, {conflict}.",
      ],
    },
    stakesLines: {
      professionale: ["O que está em jogo é claro: {stakes}.", "Está em jogo {stakes}."],
      amichevole: [
        "Está em jogo {stakes}, e não há como voltar atrás.",
        "Se falhar, {stakes}. Isso não é uma opção.",
      ],
      energico: [
        "Em jogo: {stakes}. Tudo ou nada.",
        "Sem margem para erro: está em jogo {stakes}.",
      ],
      caloroso: [
        "Mas o que realmente está em jogo é {stakes} — e é isso que dá sentido a cada passo.",
        "Vale a pena arriscar, quando está em jogo {stakes}.",
      ],
      autorevole: [
        "O risco real é {stakes}.",
        "Se as coisas corressem mal, o resultado seria {stakes}.",
      ],
      giocoso: [
        "Nada de especial, sabe: só {stakes}.",
        "No pior dos casos, só se perde {stakes}. Sem pressão.",
      ],
    },
    closingLines: {
      professionale: [
        "Um texto de referência para quem quer abordar o tema com método.",
        "Claro, concreto, construído para durar.",
      ],
      amichevole: [
        "Um livro que não se larga, da primeira à última página.",
        "Prepare-se para não desviar os olhos das páginas.",
      ],
      energico: [
        "Um ritmo que não dá tréguas até à última linha.",
        "Intenso, imprevisível, para ler de uma só vez.",
      ],
      caloroso: [
        "Uma leitura que fica, muito depois da última página.",
        "Uma história que cuida de quem a lê.",
      ],
      autorevole: [
        "Um trabalho sólido, construído com precisão e rigor.",
        "Uma referência para quem procura substância, não promessas vazias.",
      ],
      giocoso: [
        "Com uma boa dose de ironia, porque levar-se demasiado a sério não ajuda ninguém.",
        "Uma mistura de leveza e substância que não vai esperar.",
      ],
    },
    editorialTemplates: [
      "«{title} é a leitura que não sabia que estava à espera.»",
      "«Escrito com mão firme: {title} atinge em cheio o coração.»",
      "«{title} lê-se de uma só vez — e fica na memória por muito tempo.»",
      "«Com {title}, {protagonist} conquista o leitor desde as primeiras linhas.»",
    ],
    defaults: {
      protagonist: "o protagonista",
      setting: "nada é o que parece",
      conflict: "tudo muda de repente",
      stakes: "muito mais do que imagina",
      title: "este livro",
    },
  },
};
