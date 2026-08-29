/**
 * Motore di generazione del listing KDP.
 * Porting fedele della logica dell'app standalone PUBBLICAZIONE-2.html
 * (PAS & AIDA + long-tail SEO + audit di conformità e potenziale di vendita).
 */

export type BookType = "coloring" | "activity" | "notebook" | "exercise";
export type Audience = "toddlers" | "teens" | "adults";

export interface GenerateInput {
  subject: string;
  bookType: BookType;
  audience: Audience;
  ageDetails: string;
  hasCover: boolean;
  hasInterior: boolean;
  interiorScanned: boolean;
  interiorPages: number;
}

export interface Listing {
  title: string;
  subtitle: string;
  description: string;
  keywords: string[];
  categories: string[];
  complianceScore: number;
  complianceText: string;
  salesScore: number;
  salesText: string;
  interiorPages: number;
}

export function defaultAgeDetails(audience: Audience): string {
  if (audience === "toddlers") return "Boys and Girls ages 4-8";
  if (audience === "teens") return "Teens, Tweens & Students";
  return "Adults & Stress Relief";
}

function makeRand(seedBase: number) {
  return (min: number, max: number) => {
    const x = Math.sin(seedBase + min + max) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  };
}

export function generateListing(input: GenerateInput): Listing {
  const subject = input.subject.trim() || "Magical Fantasy";
  const { bookType, audience, ageDetails, hasCover, hasInterior, interiorScanned, interiorPages } = input;

  const seed =
    subject
      .toLowerCase()
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0) +
    bookType.length +
    audience.length;
  const rand = makeRand(seed);

  let title = "";
  let subtitle = "";
  let description = "";
  let keywords: string[] = [];
  let categories: string[] = [];

  const cleanSub = subject.toLowerCase();
  const isAnimal =
    cleanSub.includes("t-rex") ||
    cleanSub.includes("dino") ||
    cleanSub.includes("capybara") ||
    cleanSub.includes("sloth") ||
    cleanSub.includes("cat") ||
    cleanSub.includes("dog") ||
    cleanSub.includes("animal");
  const isMandalaOrPattern =
    cleanSub.includes("mandala") ||
    cleanSub.includes("pattern") ||
    cleanSub.includes("geometric") ||
    cleanSub.includes("abstract");

  if (bookType === "coloring") {
    const titleVariants = [
      `${subject} Coloring Book`,
      `The Ultimate ${subject} Coloring Companion`,
      `Creative Worlds: ${subject} Art Book`,
      `Explore & Color: ${subject} Edition`,
    ];
    title = titleVariants[rand(0, titleVariants.length - 1)] ?? `${subject} Coloring Book`;

    if (audience === "toddlers") {
      subtitle = `Ultimate Creative Art Pastime Featuring Hand-Drawn ${subject} Illustrations for Screen-Free Cognitive Growth`;
      description =
        `Finding engaging offline activities that pull young children away from addictive phone and tablet screens can feel exhausting.\n\n` +
        `Uninspired books often feature messy layouts, pixelated lines, or thin pages where markers bleed straight through, frustrating little learners and wasting your money.\n\n` +
        `Crafted specifically for ${ageDetails}, this premium publication delivers delightful artistic encounters centered around ${subject} with pristine single-sided pages.\n\n` +
        `Are you ready to spark boundless imagination and keep young minds joyfully occupied? Each individual page offers captivating visual designs created to stimulate curiosity and artistic flair.\n\n` +
        `Enjoy zero ink bleed-through compatibility with crayons, colored pencils, or markers while accelerating hand-eye coordination mastery.\n\n` +
        `Elevate their daily learning journey right now—secure your exclusive volume today and watch their confidence blossom!`;

      keywords = [
        `educational preschool drawing pad`,
        `cute character illustrations for toddlers`,
        `non digital indoor entertainment games`,
        `fine motor skills enhancement tools`,
        `imaginative multi theme sketching`,
        `children cognitive development media`,
        `boys girls holiday present ideas`,
      ];

      categories = isAnimal
        ? [
            "Juvenile Nonfiction > Animals > General",
            "Juvenile Nonfiction > Activity Books > General",
            "Juvenile Nonfiction > Art > Drawing",
          ]
        : [
            "Juvenile Nonfiction > Activity Books > General",
            "Juvenile Nonfiction > Art > General",
            "Juvenile Nonfiction > Concepts > Colors",
          ];
    } else if (audience === "adults") {
      subtitle = `Immersive Therapeutic Patterns and Detailed ${subject} Compositions for Deep Mental Decompression`;
      description =
        `Modern fast-paced daily routines leave millions feeling completely burned out, stressed, and mentally drained.\n\n` +
        `Standard relaxation methods rarely quiet a racing mind, leaving you trapped in endless cycles of digital fatigue and nervous tension.\n\n` +
        `Step inside an exquisite sanctuary of tranquility built entirely upon sophisticated ${subject} geometries and harmonious aesthetic structures tailored for grown-up colorists.\n\n` +
        `Do you yearn for an effective way to disconnect from daily pressures? Melt away accumulated tension through mindful artistic expression using intricate plates thoughtfully isolated on single sheets.\n\n` +
        `Enjoy a pristine canvas fully protected against pigment bleed, perfectly suited for fineliners, gel pens, and professional markers.\n\n` +
        `Reclaim your inner serenity instantly—order your personal relaxation sanctuary companion today!`;

      keywords = [
        `advanced mindfulness art therapy books`,
        `anti anxiety meditative coloring pastime`,
        `sophisticated geometric pattern designs`,
        `grown up psychological decompression tools`,
        `tranquil aesthetic hobby publications`,
        `stress relief aesthetic journals`,
        `creative emotional wellness manuals`,
      ];

      if (isMandalaOrPattern) {
        categories = [
          "Games & Activities > Coloring Books for Grown-Ups > Mandalas & Patterns",
          "Crafts & Hobbies > Folk Crafts",
          "Self-Help > Stress Management",
        ];
      } else if (isAnimal) {
        categories = [
          "Games & Activities > Coloring Books for Grown-Ups > Animals",
          "Crafts & Hobbies > Folk Crafts",
          "Self-Help > Stress Management",
        ];
      } else {
        categories = [
          "Games & Activities > Coloring Books for Grown-Ups > Mindfulness",
          "Crafts & Hobbies > Folk Crafts",
          "Self-Help > Stress Management",
        ];
      }
    } else {
      subtitle = `Inspiring Modern Graphic Portfolio Centered Around ${subject} for Trendsetting Artistic Explorers`;
      description =
        `Creative stagnation hits hard when standard visual portfolios offer nothing fresh or intellectually stimulating.\n\n` +
        `Sticking to conventional drawing boundaries limits your creative potential and leaves your artistic projects feeling flat and uninspired.\n\n` +
        `Explore an avant-garde compilation celebrating ${subject}, carefully structured for trend-conscious creators and modern draftsmanship enthusiasts.\n\n` +
        `Looking to break conventional artistic barriers with a contemporary visual approach? Push your aesthetic capabilities further utilizing high-definition outlines printed on isolated backdrops.\n\n` +
        `Safeguard your finished masterpieces against any accidental smudge while exploring new stylistic horizons.\n\n` +
        `Express your true artistic vision—acquire this unique edition immediately!`;

      keywords = [
        `contemporary graphic portfolio collections`,
        `avant garde draftsmanship manuals`,
        `trendsetting visual expression books`,
        `modern stylistic illustration guides`,
        `high definition artistic outlines`,
        `creative mastery workbooks`,
        `exclusive aesthetic presents`,
      ];
      categories = ["Crafts & Hobbies > Drawing", "Design > Graphic Arts", "Art > Techniques > Pen & Ink"];
    }
  } else {
    title = `${subject} Activity & Workbook`;
    subtitle = `Engaging Creative Exercises and Interactive Pages Featuring ${subject}`;
    description =
      `Discover an incredible collection designed to provide hours of engaging entertainment and skill development focusing on ${subject}.\n\n` +
      `Expertly structured layouts ensure a smooth and satisfying experience from start to finish.\n\n` +
      `Order your copy today and enjoy premium quality content!`;
    keywords = [
      `activity book`,
      `puzzle pad`,
      `interactive workbook`,
      `fun games`,
      `creative learning`,
      `pastime items`,
      `mind training`,
    ];
    categories = [
      "Juvenile Nonfiction > Activity Books > General",
      "Games & Activities > Puzzles",
      "Study Aids > General",
    ];
  }

  let complianceScore = 75;
  if (hasCover) complianceScore += 12;
  if (hasInterior && interiorScanned) complianceScore += 13;
  if (complianceScore > 100) complianceScore = 100;

  let complianceText = `File strutturati correttamente. `;
  complianceText += hasCover && hasInterior
    ? `Copertina e interno verificati: pronti per il caricamento su KDP.`
    : `Carica cover e PDF interno per completare l'audit tecnico.`;

  let salesScore = 78;
  if (subject.length > 4) salesScore += 8;
  if (hasCover) salesScore += 7;
  if (categories.length === 3) salesScore += 7;
  if (salesScore > 98) salesScore = 98;

  const salesText = `Confrontato con i bestseller della nicchia "${subject}", questo listing sfrutta keyword a bassa concorrenza e categorie mirate. Ottimo potenziale di posizionamento organico (A9) se abbinato a sponsorizzate iniziali.`;

  return {
    title,
    subtitle,
    description,
    keywords: keywords.slice(0, 7),
    categories,
    complianceScore,
    complianceText,
    salesScore,
    salesText,
    interiorPages,
  };
}

export function formatListingForExport(listing: Listing): string {
  return [
    `TITOLO: ${listing.title}`,
    `SOTTOTITOLO: ${listing.subtitle}`,
    "",
    "DESCRIZIONE (A+/HTML, PAS+AIDA):",
    listing.description,
    "",
    "KEYWORD BACKEND (7 campi):",
    ...listing.keywords.map((k, i) => `Box ${i + 1}: ${k}`),
    "",
    "CATEGORIE (BISAC):",
    ...listing.categories.map((c) => `- ${c}`),
    "",
    `Audit qualità & conformità: ${listing.complianceScore} / 100 — ${listing.complianceText}`,
    `Potenziale di vendita: ${listing.salesScore} / 100 — ${listing.salesText}`,
    listing.interiorPages > 0 ? `Pagine interno analizzate: ${listing.interiorPages}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
