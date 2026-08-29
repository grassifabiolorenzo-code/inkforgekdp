/** Rendering canvas per i moduli A+ (browser-only). Porta 1:1 la logica dell'app HTML originale. */

export function renderMockup(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource & { width: number; height: number },
  x: number,
  y: number,
  maxW: number,
  maxH: number,
  deg: number,
) {
  const ratio = Math.min(maxW / img.width, maxH / img.height);
  const w = img.width * ratio;
  const h = img.height * ratio;

  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((deg * Math.PI) / 180);

  ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 12;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6);

  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

export function formatWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let cursorY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = `${line}${words[n]} `;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, cursorY);
      line = `${words[n]} `;
      cursorY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, cursorY);
}

type ImgSource = HTMLCanvasElement | HTMLImageElement;

export function drawHero(
  canvas: HTMLCanvasElement,
  frontCover: ImgSource,
  backCover: ImgSource,
  bg: string,
  logoImg: HTMLCanvasElement | null,
  logoScale = 1,
) {
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 970, 300);

  renderMockup(ctx, frontCover, 50, 35, 210, 230, -2);
  renderMockup(ctx, backCover, 710, 35, 210, 230, 2);

  if (logoImg) {
    const maxH = 160 * logoScale;
    const maxW = 240 * logoScale;
    let w = logoImg.width;
    let h = logoImg.height;
    const ratio = w / h;

    if (w > maxW) { w = maxW; h = w / ratio; }
    if (h > maxH) { h = maxH; w = h * ratio; }

    const centerX = 485 - w / 2;
    const centerY = 150 - h / 2;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.18)";
    ctx.shadowBlur = 18;
    ctx.drawImage(logoImg, centerX, centerY, w, h);
    ctx.restore();
  }
}

export function drawProof(canvas: HTMLCanvasElement, int1: ImgSource, int2: ImgSource, bg: string) {
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 970, 300);

  renderMockup(ctx, int1, 180, 25, 260, 250, -2);
  renderMockup(ctx, int2, 530, 25, 260, 250, 2);
}

export function drawValueModule(
  canvas: HTMLCanvasElement,
  bg: string,
  accent: string,
  valueCopy: { title: string; text1: string; text2: string; text3: string },
) {
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 970, 300);

  ctx.fillStyle = accent;
  ctx.font = '900 21px "Montserrat", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText(valueCopy.title.toUpperCase(), 485, 65);

  const items = [valueCopy.text1, valueCopy.text2, valueCopy.text3];
  const positions = [182, 485, 788];

  items.forEach((item, index) => {
    const x = positions[index]!;
    const circleY = 145;

    ctx.beginPath();
    ctx.arc(x, circleY, 26, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = '900 18px "Montserrat", sans-serif';
    ctx.fillText("✓", x, circleY + 6);

    ctx.fillStyle = accent;
    ctx.font = '700 13px "Montserrat", sans-serif';
    formatWrappedText(ctx, item.toUpperCase(), x, circleY + 55, 230, 18);
  });
  ctx.textAlign = "left";
}

export function drawGridSquare(canvas: HTMLCanvasElement, img: ImgSource, bg: string) {
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 300, 300);
  renderMockup(ctx, img, 30, 20, 240, 240, 0);
}

export function drawCompareHeader(canvas: HTMLCanvasElement, img: ImgSource, bg: string) {
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 150, 300);
  renderMockup(ctx, img, 15, 20, 120, 240, 0);
}
