/**
 * Applica una filigrana ripetuta e diagonale su un canvas, per rendere l'anteprima gratuita
 * dei tool visivamente riconoscibile e inutilizzabile come asset finale (nessuna esportazione
 * pulita è possibile senza un abbonamento attivo).
 */
export function applyPreviewWatermark(canvas: HTMLCanvasElement, label = "ANTEPRIMA — INKFORGEKDP.COM"): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Velo semi-trasparente su tutta la superficie, per abbassare il contrasto dell'anteprima.
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  const fontSize = Math.max(14, Math.round(canvas.width * 0.032));
  ctx.save();
  ctx.font = `800 ${fontSize}px sans-serif`;
  ctx.fillStyle = "rgba(220, 38, 38, 0.32)";
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = Math.max(1, fontSize * 0.04);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-Math.PI / 8);

  const textWidth = ctx.measureText(label).width + fontSize * 3;
  const stepX = textWidth;
  const stepY = fontSize * 3.2;
  const spanX = canvas.width * 1.6;
  const spanY = canvas.height * 1.6;

  for (let y = -spanY / 2; y <= spanY / 2; y += stepY) {
    for (let x = -spanX / 2; x <= spanX / 2; x += stepX) {
      ctx.strokeText(label, x, y);
      ctx.fillText(label, x, y);
    }
  }
  ctx.restore();

  // Banda centrale con call-to-action, ben leggibile sopra la filigrana ripetuta.
  const bandHeight = Math.max(28, canvas.height * 0.07);
  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  ctx.fillRect(0, canvas.height / 2 - bandHeight / 2, canvas.width, bandHeight);
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 ${Math.round(bandHeight * 0.42)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ABBONATI PER SCARICARE SENZA FILIGRANA", canvas.width / 2, canvas.height / 2);
  ctx.restore();
}
