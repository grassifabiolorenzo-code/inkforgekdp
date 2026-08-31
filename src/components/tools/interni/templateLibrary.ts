/**
 * Libreria di template per interni di libri a basso contenuto ("low-content books"):
 * quaderni, planner, activity book. Ogni template è disegnato proceduralmente su canvas
 * (nessuna immagine esterna, nessun costo di generazione, nessun problema di copyright) e si
 * adatta automaticamente alla risoluzione/pagina scelta nel documento.
 *
 * Pensata per crescere: aggiungere un template richiede solo una nuova entry in
 * TEMPLATE_LIBRARY + il relativo case in drawTemplate.
 */

export type TemplateId =
  | "lines-narrow"
  | "lines-wide"
  | "dot-grid"
  | "graph-paper"
  | "blank-title"
  | "checklist"
  | "weekly-planner"
  | "habit-tracker"
  | "mini-calendar"
  | "maze"
  | "connect-dots"
  | "mandala"
  | "tracing-dots"
  | "decorative-frame";

export interface TemplateSpec {
  id: TemplateId;
  label: string;
  category: "Quaderno" | "Organizzazione" | "Attività / basso contenuto";
}

export const TEMPLATE_LIBRARY: TemplateSpec[] = [
  { id: "lines-narrow", label: "Righe strette", category: "Quaderno" },
  { id: "lines-wide", label: "Righe larghe", category: "Quaderno" },
  { id: "dot-grid", label: "Puntinata (dot grid)", category: "Quaderno" },
  { id: "graph-paper", label: "Quadretti", category: "Quaderno" },
  { id: "blank-title", label: "Pagina bianca con titolo", category: "Quaderno" },
  { id: "checklist", label: "Lista cose da fare", category: "Organizzazione" },
  { id: "weekly-planner", label: "Planner settimanale", category: "Organizzazione" },
  { id: "habit-tracker", label: "Tracker abitudini mensile", category: "Organizzazione" },
  { id: "mini-calendar", label: "Calendario mensile", category: "Organizzazione" },
  { id: "maze", label: "Labirinto", category: "Attività / basso contenuto" },
  { id: "connect-dots", label: "Unisci i puntini", category: "Attività / basso contenuto" },
  { id: "mandala", label: "Mandala da colorare", category: "Attività / basso contenuto" },
  { id: "tracing-dots", label: "Tracciato guidato", category: "Attività / basso contenuto" },
  { id: "decorative-frame", label: "Cornice decorativa", category: "Attività / basso contenuto" },
];

export const getTemplateSpec = (id: string): TemplateSpec | undefined =>
  TEMPLATE_LIBRARY.find((t) => t.id === id);

/** Disegna il template scelto su un canvas già dimensionato (w×h in pixel, sfondo bianco). */
export function drawTemplate(ctx: CanvasRenderingContext2D, id: TemplateId, w: number, h: number): void {
  const margin = Math.round(Math.min(w, h) * 0.06);
  switch (id) {
    case "lines-narrow":
      drawRuledLines(ctx, w, h, margin, Math.round(h * 0.028));
      break;
    case "lines-wide":
      drawRuledLines(ctx, w, h, margin, Math.round(h * 0.05));
      break;
    case "dot-grid":
      drawDotGrid(ctx, w, h, margin, Math.round(Math.min(w, h) * 0.035));
      break;
    case "graph-paper":
      drawGraphPaper(ctx, w, h, margin, Math.round(Math.min(w, h) * 0.035));
      break;
    case "blank-title":
      drawBlankWithTitle(ctx, w, h, margin);
      break;
    case "checklist":
      drawChecklist(ctx, w, h, margin);
      break;
    case "weekly-planner":
      drawWeeklyPlanner(ctx, w, h, margin);
      break;
    case "habit-tracker":
      drawHabitTracker(ctx, w, h, margin);
      break;
    case "mini-calendar":
      drawMiniCalendar(ctx, w, h, margin);
      break;
    case "maze":
      drawMaze(ctx, w, h, margin);
      break;
    case "connect-dots":
      drawConnectDots(ctx, w, h, margin);
      break;
    case "mandala":
      drawMandala(ctx, w, h, margin);
      break;
    case "tracing-dots":
      drawTracingDots(ctx, w, h, margin);
      break;
    case "decorative-frame":
      drawDecorativeFrame(ctx, w, h, margin);
      break;
  }
}

/* ------------------------------------------------------------------------ */
/* Quaderno                                                                  */
/* ------------------------------------------------------------------------ */

function drawRuledLines(ctx: CanvasRenderingContext2D, w: number, h: number, margin: number, gap: number) {
  ctx.strokeStyle = "#c7d2e0";
  ctx.lineWidth = Math.max(1, w * 0.0015);
  for (let y = margin * 1.4; y <= h - margin; y += gap) {
    ctx.beginPath();
    ctx.moveTo(margin, y);
    ctx.lineTo(w - margin, y);
    ctx.stroke();
  }
  // Margine verticale sinistro (stile quaderno).
  ctx.strokeStyle = "#e59a9a";
  ctx.beginPath();
  ctx.moveTo(margin * 1.7, margin * 1.4);
  ctx.lineTo(margin * 1.7, h - margin);
  ctx.stroke();
}

function drawDotGrid(ctx: CanvasRenderingContext2D, w: number, h: number, margin: number, gap: number) {
  ctx.fillStyle = "#a9b6c9";
  const r = Math.max(1, w * 0.0016);
  for (let y = margin; y <= h - margin; y += gap) {
    for (let x = margin; x <= w - margin; x += gap) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawGraphPaper(ctx: CanvasRenderingContext2D, w: number, h: number, margin: number, gap: number) {
  ctx.strokeStyle = "#d7e0ec";
  ctx.lineWidth = Math.max(1, w * 0.0012);
  for (let x = margin; x <= w - margin; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, margin);
    ctx.lineTo(x, h - margin);
    ctx.stroke();
  }
  for (let y = margin; y <= h - margin; y += gap) {
    ctx.beginPath();
    ctx.moveTo(margin, y);
    ctx.lineTo(w - margin, y);
    ctx.stroke();
  }
}

function drawBlankWithTitle(ctx: CanvasRenderingContext2D, w: number, h: number, margin: number) {
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = Math.max(2, w * 0.002);
  ctx.beginPath();
  ctx.moveTo(margin, margin * 1.6);
  ctx.lineTo(w - margin, margin * 1.6);
  ctx.stroke();
  ctx.strokeStyle = "#e2e8f0";
  ctx.setLineDash([w * 0.01, w * 0.01]);
  ctx.beginPath();
  ctx.moveTo(margin, margin);
  ctx.lineTo(w - margin, margin);
  ctx.stroke();
  ctx.setLineDash([]);
}

/* ------------------------------------------------------------------------ */
/* Organizzazione                                                            */
/* ------------------------------------------------------------------------ */

function drawChecklist(ctx: CanvasRenderingContext2D, w: number, h: number, margin: number) {
  const rowGap = Math.round(h * 0.075);
  const boxSize = Math.round(rowGap * 0.5);
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = Math.max(1.5, w * 0.0018);
  let y = margin * 1.6;
  while (y < h - margin) {
    ctx.strokeRect(margin, y, boxSize, boxSize);
    ctx.strokeStyle = "#d7e0ec";
    ctx.beginPath();
    ctx.moveTo(margin + boxSize * 1.6, y + boxSize / 2);
    ctx.lineTo(w - margin, y + boxSize / 2);
    ctx.stroke();
    ctx.strokeStyle = "#94a3b8";
    y += rowGap;
  }
}

function drawWeeklyPlanner(ctx: CanvasRenderingContext2D, w: number, h: number, margin: number) {
  const days = ["LUN", "MAR", "MER", "GIO", "VEN", "SAB", "DOM"];
  const cols = 1;
  const colW = w - margin * 2;
  const rowH = (h - margin * 2) / days.length;
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = Math.max(1.5, w * 0.0018);
  ctx.font = `${Math.round(rowH * 0.28)}px sans-serif`;
  ctx.fillStyle = "#475569";
  days.forEach((d, i) => {
    const y = margin + i * rowH;
    ctx.strokeRect(margin, y, colW, rowH);
    ctx.fillText(d, margin + colW * 0.02, y + rowH * 0.22);
    ctx.strokeStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.moveTo(margin, y + rowH * 0.32);
    ctx.lineTo(margin + colW, y + rowH * 0.32);
    ctx.stroke();
    ctx.strokeStyle = "#94a3b8";
  });
  void cols;
}

function drawHabitTracker(ctx: CanvasRenderingContext2D, w: number, h: number, margin: number) {
  const days = 31;
  const habitRows = 8;
  const gridW = w - margin * 2;
  const gridH = h - margin * 2.4;
  const cellW = gridW / (days + 1);
  const cellH = gridH / (habitRows + 1);
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = Math.max(1, w * 0.0012);
  ctx.font = `${Math.round(cellH * 0.4)}px sans-serif`;
  ctx.fillStyle = "#64748b";
  ctx.fillText("ABITUDINE", margin, margin * 1.2);
  for (let d = 0; d <= days; d++) {
    const x = margin + cellW * (d + 1);
    ctx.beginPath();
    ctx.moveTo(x, margin * 1.6);
    ctx.lineTo(x, margin * 1.6 + gridH);
    ctx.stroke();
    if (d > 0 && (d === 1 || d % 5 === 0)) ctx.fillText(String(d), x - cellW * 0.3, margin * 1.5);
  }
  for (let r = 0; r <= habitRows; r++) {
    const y = margin * 1.6 + cellH * r;
    ctx.beginPath();
    ctx.moveTo(margin, y);
    ctx.lineTo(margin + gridW, y);
    ctx.stroke();
  }
}

function drawMiniCalendar(ctx: CanvasRenderingContext2D, w: number, h: number, margin: number) {
  const cols = 7;
  const rows = 6;
  const gridW = w - margin * 2;
  const gridH = h * 0.6;
  const cellW = gridW / cols;
  const cellH = gridH / rows;
  const top = margin * 1.6;
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = Math.max(1, w * 0.0012);
  for (let c = 0; c <= cols; c++) {
    ctx.beginPath();
    ctx.moveTo(margin + cellW * c, top);
    ctx.lineTo(margin + cellW * c, top + gridH);
    ctx.stroke();
  }
  for (let r = 0; r <= rows; r++) {
    ctx.beginPath();
    ctx.moveTo(margin, top + cellH * r);
    ctx.lineTo(margin + gridW, top + cellH * r);
    ctx.stroke();
  }
  const notesTop = top + gridH + margin * 0.6;
  ctx.strokeStyle = "#e2e8f0";
  for (let y = notesTop; y < h - margin; y += cellH * 0.4) {
    ctx.beginPath();
    ctx.moveTo(margin, y);
    ctx.lineTo(w - margin, y);
    ctx.stroke();
  }
}

/* ------------------------------------------------------------------------ */
/* Attività / basso contenuto                                                */
/* ------------------------------------------------------------------------ */

/** Labirinto generato con un semplice backtracking su griglia. */
function drawMaze(ctx: CanvasRenderingContext2D, w: number, h: number, margin: number) {
  const cols = 16;
  const rows = 20;
  const size = Math.min((w - margin * 2) / cols, (h - margin * 2) / rows);
  const ox = margin + ((w - margin * 2) - size * cols) / 2;
  const oy = margin + ((h - margin * 2) - size * rows) / 2;

  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const wallsV = Array.from({ length: rows }, () => Array(cols + 1).fill(true)); // muri verticali (tra colonne)
  const wallsH = Array.from({ length: rows + 1 }, () => Array(cols).fill(true)); // muri orizzontali (tra righe)

  // Backtracking iterativo (evita ricorsione profonda su griglie grandi).
  const stack: [number, number][] = [[0, 0]];
  visited[0]![0] = true;
  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1]!;
    const neighbors: [number, number, "N" | "S" | "E" | "W"][] = [];
    if (r > 0 && !visited[r - 1]![c]) neighbors.push([r - 1, c, "N"]);
    if (r < rows - 1 && !visited[r + 1]![c]) neighbors.push([r + 1, c, "S"]);
    if (c > 0 && !visited[r]![c - 1]) neighbors.push([r, c - 1, "W"]);
    if (c < cols - 1 && !visited[r]![c + 1]) neighbors.push([r, c + 1, "E"]);

    if (neighbors.length === 0) {
      stack.pop();
      continue;
    }
    const [nr, nc, dir] = neighbors[Math.floor(Math.random() * neighbors.length)]!;
    if (dir === "N") wallsH[r]![c] = false;
    if (dir === "S") wallsH[r + 1]![c] = false;
    if (dir === "W") wallsV[r]![c] = false;
    if (dir === "E") wallsV[r]![c + 1] = false;
    visited[nr]![nc] = true;
    stack.push([nr, nc]);
  }

  ctx.strokeStyle = "#334155";
  ctx.lineWidth = Math.max(2, size * 0.06);
  ctx.lineCap = "square";
  ctx.strokeRect(ox, oy, size * cols, size * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = ox + c * size;
      const y = oy + r * size;
      if (wallsH[r]![c] && r > 0) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + size, y);
        ctx.stroke();
      }
      if (wallsV[r]![c] && c > 0) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + size);
        ctx.stroke();
      }
    }
  }
  // Entrata/uscita.
  ctx.strokeStyle = "#16a34a";
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox, oy + size);
  ctx.stroke();
  ctx.strokeStyle = "#dc2626";
  ctx.beginPath();
  ctx.moveTo(ox + size * cols, oy + size * (rows - 1));
  ctx.lineTo(ox + size * cols, oy + size * rows);
  ctx.stroke();
}

/** Punti numerati disposti su un cerchio: uniti in ordine formano una figura semplice. */
function drawConnectDots(ctx: CanvasRenderingContext2D, w: number, h: number, margin: number) {
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) / 2 - margin * 1.5;
  const points = 18;
  ctx.fillStyle = "#334155";
  ctx.font = `${Math.round(radius * 0.09)}px sans-serif`;
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(2, radius * 0.02), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(String(i + 1), x + radius * 0.03, y - radius * 0.03);
  }
}

/** Pattern radiale semplice (cerchi + petali concentrici) pensato per essere colorato. */
function drawMandala(ctx: CanvasRenderingContext2D, w: number, h: number, margin: number) {
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.min(w, h) / 2 - margin;
  ctx.strokeStyle = "#1f2937";
  ctx.lineWidth = Math.max(2, w * 0.0025);

  const rings = 4;
  for (let ring = 1; ring <= rings; ring++) {
    const r = (maxR / rings) * ring;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    const petals = 6 + ring * 4;
    const petalR = (maxR / rings) * 0.42;
    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * Math.PI * 2;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      ctx.beginPath();
      ctx.arc(px, py, petalR, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

/** Righe ondulate/tratteggiate su cui ricalcare, utile per attività pre-scrittura. */
function drawTracingDots(ctx: CanvasRenderingContext2D, w: number, h: number, margin: number) {
  const rows = 6;
  const rowGap = (h - margin * 2) / rows;
  ctx.setLineDash([w * 0.012, w * 0.012]);
  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = Math.max(2, w * 0.002);
  for (let i = 0; i < rows; i++) {
    const y = margin + rowGap * (i + 0.5);
    ctx.beginPath();
    const amplitude = rowGap * 0.22;
    const steps = 60;
    for (let s = 0; s <= steps; s++) {
      const x = margin + ((w - margin * 2) * s) / steps;
      const yy = y + Math.sin((s / steps) * Math.PI * 4) * amplitude;
      if (s === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawDecorativeFrame(ctx: CanvasRenderingContext2D, w: number, h: number, margin: number) {
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = Math.max(2, w * 0.003);
  ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2);
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = Math.max(1, w * 0.0012);
  ctx.strokeRect(margin * 1.25, margin * 1.25, w - margin * 2.5, h - margin * 2.5);

  const cornerSize = margin * 0.9;
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = Math.max(2, w * 0.0025);
  const corners: [number, number][] = [
    [margin, margin],
    [w - margin, margin],
    [margin, h - margin],
    [w - margin, h - margin],
  ];
  corners.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, cornerSize * 0.35, 0, Math.PI * 2);
    ctx.stroke();
  });
}
