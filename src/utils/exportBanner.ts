import { BannerSpec, CampaignData } from "../types/banner";

async function loadCanvasImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function getFontFamily(style: CampaignData["typographyStyle"], isHeadline: boolean): string {
  if (style === "editorial") {
    return isHeadline ? "'Instrument Serif', Georgia, serif" : "'Plus Jakarta Sans', sans-serif";
  }
  if (style === "technical") {
    return isHeadline ? "'JetBrains Mono', monospace" : "'Plus Jakarta Sans', sans-serif";
  }
  return isHeadline ? "'Syne', sans-serif" : "'Plus Jakarta Sans', sans-serif";
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  scale = 1,
  offsetX = 0,
  offsetY = 0
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let drawW = w;
  let drawH = h;

  if (imgRatio > boxRatio) {
    drawH = h * scale;
    drawW = drawH * imgRatio;
  } else {
    drawW = w * scale;
    drawH = drawW / imgRatio;
  }

  const drawX = x + (w - drawW) / 2 + (offsetX / 100) * w;
  const drawY = y + (h - drawH) / 2 + (offsetY / 100) * h;

  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
): number {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lineCount++;
      if (lineCount >= maxLines) {
        ctx.fillText(line.trim() + "…", x, currentY);
        return currentY + lineHeight;
      }
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line.trim()) {
    ctx.fillText(line.trim(), x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function renderBannerToDataUrl(
  spec: BannerSpec,
  campaign: CampaignData,
  format: "png" | "jpeg" = "png",
  pixelRatio = 2
): Promise<string> {
  const canvas = document.createElement("canvas");
  const w = spec.width;
  const h = spec.height;
  canvas.width = w * pixelRatio;
  canvas.height = h * pixelRatio;

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.scale(pixelRatio, pixelRatio);

  const { palette } = campaign;
  const img = await loadCanvasImage(campaign.productImageUrl);

  ctx.fillStyle = palette.backgroundHex;
  ctx.fillRect(0, 0, w, h);

  const headlineFont = getFontFamily(campaign.typographyStyle, true);
  const bodyFont = getFontFamily(campaign.typographyStyle, false);
  const monoFont = "'JetBrains Mono', monospace";
  const headlineText = campaign.headlines[spec.headlineKey] || campaign.headlines.medium;
  const displayBrand = campaign.productName || campaign.brandName;

  if (h <= 60) {
    const imgW = 68;
    if (img) {
      drawCoverImage(ctx, img, 0, 0, imgW, h, campaign.imageScale, campaign.imageOffsetX, campaign.imageOffsetY);
    } else {
      ctx.fillStyle = palette.surfaceHex;
      ctx.fillRect(0, 0, imgW, h);
    }

    ctx.fillStyle = palette.accentHex;
    ctx.font = `600 8px ${monoFont}`;
    ctx.fillText(displayBrand, imgW + 10, 17);

    ctx.fillStyle = palette.textPrimaryHex;
    ctx.font = `700 12px ${headlineFont}`;
    ctx.fillText(headlineText.slice(0, 24), imgW + 10, 34);

    const ctaW = 78;
    const ctaH = 26;
    const ctaX = w - ctaW - 8;
    const ctaY = (h - ctaH) / 2;
    ctx.fillStyle = palette.accentHex;
    drawRoundedRect(ctx, ctaX, ctaY, ctaW, ctaH, 3);
    ctx.fill();

    ctx.fillStyle = palette.ctaTextHex;
    ctx.font = `600 9px ${bodyFont}`;
    ctx.textAlign = "center";
    ctx.fillText(campaign.ctaText.slice(0, 14), ctaX + ctaW / 2, ctaY + 16);
    ctx.textAlign = "left";
  } else if (w >= 700 && h <= 110) {
    const imgW = 195;
    if (img) {
      drawCoverImage(ctx, img, 0, 0, imgW, h, campaign.imageScale, campaign.imageOffsetX, campaign.imageOffsetY);
    } else {
      ctx.fillStyle = palette.surfaceHex;
      ctx.fillRect(0, 0, imgW, h);
    }

    ctx.fillStyle = palette.textSecondaryHex;
    ctx.font = `500 9px ${monoFont}`;
    ctx.fillText(`${displayBrand}  ·  ${campaign.categoryKicker}`, imgW + 20, 26);

    ctx.fillStyle = palette.textPrimaryHex;
    ctx.font = `700 20px ${headlineFont}`;
    ctx.fillText(headlineText, imgW + 20, 52);

    ctx.fillStyle = palette.textSecondaryHex;
    ctx.font = `400 11px ${bodyFont}`;
    ctx.fillText(`${campaign.priceOrOffer}  ·  ${campaign.displayUrl}`, imgW + 20, 72);

    const ctaW = 148;
    const ctaH = 40;
    const ctaX = w - ctaW - 20;
    const ctaY = (h - ctaH) / 2;
    ctx.fillStyle = palette.accentHex;
    drawRoundedRect(ctx, ctaX, ctaY, ctaW, ctaH, 4);
    ctx.fill();

    ctx.fillStyle = palette.ctaTextHex;
    ctx.font = `600 12px ${bodyFont}`;
    ctx.textAlign = "center";
    ctx.fillText(campaign.ctaText, ctaX + ctaW / 2, ctaY + 24);
    ctx.textAlign = "left";
  } else if (w === 320 && h === 100) {
    const imgW = 110;
    if (img) {
      drawCoverImage(ctx, img, 0, 0, imgW, h, campaign.imageScale, campaign.imageOffsetX, campaign.imageOffsetY);
    }

    ctx.fillStyle = palette.textSecondaryHex;
    ctx.font = `500 8px ${monoFont}`;
    ctx.fillText(displayBrand, imgW + 12, 20);

    ctx.fillStyle = palette.textPrimaryHex;
    ctx.font = `700 14px ${headlineFont}`;
    wrapText(ctx, headlineText, imgW + 12, 38, w - imgW - 24, 16, 2);

    const ctaW = 112;
    const ctaH = 26;
    const ctaX = imgW + 12;
    const ctaY = h - 34;
    ctx.fillStyle = palette.accentHex;
    drawRoundedRect(ctx, ctaX, ctaY, ctaW, ctaH, 3);
    ctx.fill();

    ctx.fillStyle = palette.ctaTextHex;
    ctx.font = `600 10px ${bodyFont}`;
    ctx.textAlign = "center";
    ctx.fillText(campaign.ctaText, ctaX + ctaW / 2, ctaY + 16);
    ctx.textAlign = "left";
  } else if (w <= 180 && h >= 500) {
    const imgH = 220;
    if (img) {
      drawCoverImage(ctx, img, 0, 140, w, imgH, campaign.imageScale, campaign.imageOffsetX, campaign.imageOffsetY);
    }

    ctx.fillStyle = palette.accentHex;
    ctx.font = `600 9px ${monoFont}`;
    ctx.fillText(displayBrand, 14, 28);

    ctx.fillStyle = palette.textSecondaryHex;
    ctx.font = `400 8px ${monoFont}`;
    ctx.fillText(campaign.badgeText, 14, 44);

    ctx.fillStyle = palette.textPrimaryHex;
    ctx.font = `700 18px ${headlineFont}`;
    wrapText(ctx, headlineText, 14, 76, w - 28, 22, 3);

    ctx.fillStyle = palette.textSecondaryHex;
    ctx.font = `400 11px ${bodyFont}`;
    wrapText(ctx, campaign.subheadline, 14, imgH + 168, w - 28, 16, 5);

    ctx.fillStyle = palette.textPrimaryHex;
    ctx.font = `500 9px ${monoFont}`;
    ctx.fillText(campaign.priceOrOffer.split("·")[0].trim(), 14, h - 82);

    const ctaX = 14;
    const ctaY = h - 64;
    const ctaW = w - 28;
    const ctaH = 36;
    ctx.fillStyle = palette.accentHex;
    drawRoundedRect(ctx, ctaX, ctaY, ctaW, ctaH, 4);
    ctx.fill();

    ctx.fillStyle = palette.ctaTextHex;
    ctx.font = `600 11px ${bodyFont}`;
    ctx.textAlign = "center";
    ctx.fillText(campaign.ctaText, ctaX + ctaW / 2, ctaY + 22);
    ctx.textAlign = "left";

    ctx.fillStyle = palette.textSecondaryHex;
    ctx.font = `400 8px ${monoFont}`;
    ctx.fillText(campaign.displayUrl, 14, h - 12);
  } else if (w === 300 && h === 600) {
    const imgH = 260;
    if (img) {
      drawCoverImage(ctx, img, 0, 56, w, imgH, campaign.imageScale, campaign.imageOffsetX, campaign.imageOffsetY);
    }

    ctx.fillStyle = palette.textPrimaryHex;
    ctx.font = `600 10px ${monoFont}`;
    ctx.fillText(displayBrand, 20, 32);

    ctx.fillStyle = palette.accentHex;
    ctx.font = `500 9px ${monoFont}`;
    ctx.textAlign = "right";
    ctx.fillText(campaign.badgeText, w - 20, 32);
    ctx.textAlign = "left";

    ctx.fillStyle = palette.textSecondaryHex;
    ctx.font = `500 9px ${monoFont}`;
    ctx.fillText(campaign.categoryKicker, 20, imgH + 84);

    ctx.fillStyle = palette.textPrimaryHex;
    ctx.font = `700 24px ${headlineFont}`;
    const nextY = wrapText(ctx, headlineText, 20, imgH + 114, w - 40, 28, 3);

    ctx.fillStyle = palette.textSecondaryHex;
    ctx.font = `400 12px ${bodyFont}`;
    wrapText(ctx, campaign.subheadline, 20, nextY + 8, w - 40, 18, 3);

    ctx.fillStyle = palette.textPrimaryHex;
    ctx.font = `500 10px ${monoFont}`;
    ctx.fillText(campaign.priceOrOffer, 20, h - 82);

    const ctaX = 20;
    const ctaY = h - 64;
    const ctaW = w - 40;
    const ctaH = 42;
    ctx.fillStyle = palette.accentHex;
    drawRoundedRect(ctx, ctaX, ctaY, ctaW, ctaH, 4);
    ctx.fill();

    ctx.fillStyle = palette.ctaTextHex;
    ctx.font = `600 13px ${bodyFont}`;
    ctx.textAlign = "center";
    ctx.fillText(campaign.ctaText, ctaX + ctaW / 2, ctaY + 26);
    ctx.textAlign = "left";
  } else if (w === 970 && h === 250) {
    const imgW = 410;
    if (img) {
      drawCoverImage(ctx, img, w - imgW, 0, imgW, h, campaign.imageScale, campaign.imageOffsetX, campaign.imageOffsetY);
    }

    ctx.fillStyle = palette.textSecondaryHex;
    ctx.font = `500 10px ${monoFont}`;
    ctx.fillText(`${displayBrand}  ·  ${campaign.categoryKicker}`, 32, 38);

    ctx.fillStyle = palette.textPrimaryHex;
    ctx.font = `700 30px ${headlineFont}`;
    const afterH = wrapText(ctx, headlineText, 32, 78, w - imgW - 64, 34, 2);

    ctx.fillStyle = palette.textSecondaryHex;
    ctx.font = `400 13px ${bodyFont}`;
    wrapText(ctx, campaign.subheadline, 32, afterH + 6, w - imgW - 64, 19, 2);

    const ctaX = 32;
    const ctaY = h - 62;
    const ctaW = 176;
    const ctaH = 40;
    ctx.fillStyle = palette.accentHex;
    drawRoundedRect(ctx, ctaX, ctaY, ctaW, ctaH, 4);
    ctx.fill();

    ctx.fillStyle = palette.ctaTextHex;
    ctx.font = `600 12px ${bodyFont}`;
    ctx.textAlign = "center";
    ctx.fillText(campaign.ctaText, ctaX + ctaW / 2, ctaY + 25);
    ctx.textAlign = "left";

    ctx.fillStyle = palette.textSecondaryHex;
    ctx.font = `500 11px ${monoFont}`;
    ctx.fillText(campaign.priceOrOffer, ctaX + ctaW + 20, ctaY + 24);
  } else if (w >= 1000) {
    const isSquare = w === h;
    if (isSquare) {
      const imgH = Math.round(h * 0.54);
      if (img) {
        drawCoverImage(ctx, img, 0, 84, w, imgH, campaign.imageScale, campaign.imageOffsetX, campaign.imageOffsetY);
      }

      ctx.fillStyle = palette.textPrimaryHex;
      ctx.font = `600 20px ${monoFont}`;
      ctx.fillText(displayBrand, 48, 52);

      ctx.fillStyle = palette.accentHex;
      ctx.font = `500 18px ${monoFont}`;
      ctx.textAlign = "right";
      ctx.fillText(campaign.badgeText, w - 48, 52);
      ctx.textAlign = "left";

      const contentTop = imgH + 140;
      ctx.fillStyle = palette.textSecondaryHex;
      ctx.font = `500 18px ${monoFont}`;
      ctx.fillText(campaign.categoryKicker, 48, contentTop);

      ctx.fillStyle = palette.textPrimaryHex;
      ctx.font = `700 52px ${headlineFont}`;
      const afterH = wrapText(ctx, headlineText, 48, contentTop + 62, w - 96, 58, 2);

      ctx.fillStyle = palette.textSecondaryHex;
      ctx.font = `400 24px ${bodyFont}`;
      wrapText(ctx, campaign.subheadline, 48, afterH + 14, w - 96, 34, 2);

      const ctaW = 300;
      const ctaH = 74;
      const ctaX = w - ctaW - 48;
      const ctaY = h - ctaH - 44;
      ctx.fillStyle = palette.accentHex;
      drawRoundedRect(ctx, ctaX, ctaY, ctaW, ctaH, 6);
      ctx.fill();

      ctx.fillStyle = palette.ctaTextHex;
      ctx.font = `600 24px ${bodyFont}`;
      ctx.textAlign = "center";
      ctx.fillText(campaign.ctaText, ctaX + ctaW / 2, ctaY + 45);
      ctx.textAlign = "left";

      ctx.fillStyle = palette.textPrimaryHex;
      ctx.font = `500 20px ${monoFont}`;
      ctx.fillText(campaign.priceOrOffer, 48, h - 82);
      ctx.fillStyle = palette.textSecondaryHex;
      ctx.font = `400 18px ${monoFont}`;
      ctx.fillText(campaign.displayUrl, 48, h - 52);
    } else {
      const imgW = 540;
      if (img) {
        drawCoverImage(ctx, img, w - imgW, 0, imgW, h, campaign.imageScale, campaign.imageOffsetX, campaign.imageOffsetY);
      }

      ctx.fillStyle = palette.textSecondaryHex;
      ctx.font = `500 18px ${monoFont}`;
      ctx.fillText(`${displayBrand}  ·  ${campaign.categoryKicker}`, 56, 68);

      ctx.fillStyle = palette.textPrimaryHex;
      ctx.font = `700 54px ${headlineFont}`;
      const afterH = wrapText(ctx, headlineText, 56, 152, w - imgW - 112, 62, 3);

      ctx.fillStyle = palette.textSecondaryHex;
      ctx.font = `400 23px ${bodyFont}`;
      wrapText(ctx, campaign.subheadline, 56, afterH + 22, w - imgW - 112, 34, 3);

      const ctaX = 56;
      const ctaY = h - 128;
      const ctaW = 280;
      const ctaH = 68;
      ctx.fillStyle = palette.accentHex;
      drawRoundedRect(ctx, ctaX, ctaY, ctaW, ctaH, 6);
      ctx.fill();

      ctx.fillStyle = palette.ctaTextHex;
      ctx.font = `600 22px ${bodyFont}`;
      ctx.textAlign = "center";
      ctx.fillText(campaign.ctaText, ctaX + ctaW / 2, ctaY + 42);
      ctx.textAlign = "left";

      ctx.fillStyle = palette.textSecondaryHex;
      ctx.font = `500 18px ${monoFont}`;
      ctx.fillText(`${campaign.priceOrOffer}  ·  ${campaign.displayUrl}`, 56, h - 30);
    }
  } else {
    const imgH = Math.round(h * 0.44);
    if (img) {
      drawCoverImage(ctx, img, 0, 28, w, imgH, campaign.imageScale, campaign.imageOffsetX, campaign.imageOffsetY);
    }

    ctx.fillStyle = palette.textPrimaryHex;
    ctx.font = `600 9px ${monoFont}`;
    ctx.fillText(displayBrand, 14, 18);

    ctx.fillStyle = palette.accentHex;
    ctx.font = `500 8px ${monoFont}`;
    ctx.textAlign = "right";
    ctx.fillText(campaign.badgeText, w - 14, 18);
    ctx.textAlign = "left";

    const textTop = imgH + 48;
    ctx.fillStyle = palette.textPrimaryHex;
    ctx.font = `700 ${w > 310 ? 19 : 17}px ${headlineFont}`;
    const afterH = wrapText(ctx, headlineText, 14, textTop, w - 28, w > 310 ? 22 : 20, 2);

    ctx.fillStyle = palette.textSecondaryHex;
    ctx.font = `400 11px ${bodyFont}`;
    wrapText(ctx, campaign.subheadline, 14, afterH + 4, w - 28, 15, 2);

    const ctaW = 118;
    const ctaH = 30;
    const ctaX = w - ctaW - 14;
    const ctaY = h - ctaH - 12;
    ctx.fillStyle = palette.accentHex;
    drawRoundedRect(ctx, ctaX, ctaY, ctaW, ctaH, 4);
    ctx.fill();

    ctx.fillStyle = palette.ctaTextHex;
    ctx.font = `600 10px ${bodyFont}`;
    ctx.textAlign = "center";
    ctx.fillText(campaign.ctaText, ctaX + ctaW / 2, ctaY + 19);
    ctx.textAlign = "left";

    ctx.fillStyle = palette.textSecondaryHex;
    ctx.font = `500 9px ${monoFont}`;
    ctx.fillText(campaign.displayUrl, 14, h - 23);
  }

  if (campaign.showBorderFrame) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  }

  const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
  return canvas.toDataURL(mimeType, format === "jpeg" ? 0.92 : undefined);
}

export async function renderBannerToPngDataUrl(
  spec: BannerSpec,
  campaign: CampaignData,
  pixelRatio = 2
): Promise<string> {
  return renderBannerToDataUrl(spec, campaign, "png", pixelRatio);
}

export function generateIabHtml5Bundle(spec: BannerSpec, campaign: CampaignData): string {
  const headline = campaign.headlines[spec.headlineKey] || campaign.headlines.medium;
  const { palette } = campaign;
  const displayBrand = campaign.productName || campaign.brandName;
  const fontHeading =
    campaign.typographyStyle === "editorial"
      ? "'Instrument Serif', serif"
      : campaign.typographyStyle === "technical"
      ? "'JetBrains Mono', monospace"
      : "'Syne', sans-serif";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="ad.size" content="width=${spec.width},height=${spec.height}" />
  <title>${displayBrand} — ${spec.name} (${spec.width}x${spec.height})</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=JetBrains+Mono:wght@500;600&family=Plus+Jakarta+Sans:wght@400;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet">
  <script type="text/javascript">
    var clickTag = "${campaign.productUrl || "https://" + campaign.displayUrl}";
  </script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body, html { width: ${spec.width}px; height: ${spec.height}px; overflow: hidden; background: ${palette.backgroundHex}; }
    .ad-container {
      position: relative;
      display: flex;
      flex-direction: ${spec.width > spec.height * 2.2 ? "row" : "column"};
      justify-content: space-between;
      width: ${spec.width}px;
      height: ${spec.height}px;
      background-color: ${palette.backgroundHex};
      color: ${palette.textPrimaryHex};
      font-family: 'Plus Jakarta Sans', sans-serif;
      border: 1px solid rgba(150, 150, 150, 0.22);
      text-decoration: none;
      cursor: pointer;
      overflow: hidden;
    }
    .copy-zone {
      padding: ${spec.height <= 60 ? "6px 10px" : "16px"};
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      z-index: 2;
      flex: 1;
    }
    .kicker {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: ${palette.textSecondaryHex};
    }
    .headline {
      font-family: ${fontHeading};
      font-weight: 700;
      font-size: ${spec.height <= 60 ? "12px" : spec.width >= 900 ? "28px" : "18px"};
      line-height: 1.12;
      color: ${palette.textPrimaryHex};
      margin: 4px 0;
    }
    .cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background-color: ${palette.accentHex};
      color: ${palette.ctaTextHex};
      font-weight: 600;
      font-size: ${spec.height <= 60 ? "10px" : "11px"};
      padding: ${spec.height <= 60 ? "5px 10px" : "8px 14px"};
      border-radius: 3px;
      white-space: nowrap;
      width: fit-content;
    }
  </style>
</head>
<body>
  <a href="javascript:window.open(window.clickTag)" class="ad-container">
    <div class="copy-zone">
      <div class="kicker">${displayBrand} · ${campaign.badgeText}</div>
      <h1 class="headline">${headline}</h1>
      <span class="cta">${campaign.ctaText}</span>
    </div>
  </a>
</body>
</html>`;
}
