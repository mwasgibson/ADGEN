import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

const UA = "AdGen/1.0 (multi-format banner studio)";

type Palette = {
  backgroundHex: string;
  surfaceHex: string;
  textPrimaryHex: string;
  textSecondaryHex: string;
  accentHex: string;
  ctaTextHex: string;
};

type TypographyStyle = "swiss" | "editorial" | "technical";
type LayoutMotif =
  | "editorial-grid"
  | "split-architectural"
  | "minimal-plinth"
  | "bold-typographic";

const TONE_PRESETS: Record<
  string,
  {
    categoryKicker: string;
    badgeText: string;
    priceOrOffer: string;
    ctaText: string;
    valueProps: string[];
    palette: Palette;
    typographyStyle: TypographyStyle;
    layoutMotif: LayoutMotif;
    defaultHeadline: string;
    defaultSub: string;
  }
> = {
  "swiss industrial": {
    categoryKicker: "NEW RELEASE · SERIES IV",
    badgeText: "LIMITED EDITION",
    priceOrOffer: "FREE EXPRESS SHIPPING",
    ctaText: "Explore Collection",
    valueProps: [
      "Precision-machined architectural grade materials",
      "Built for continuous studio and field reliability",
      "Direct-to-studio dispatch with warranty",
    ],
    palette: {
      backgroundHex: "#111318",
      surfaceHex: "#1B1F27",
      textPrimaryHex: "#F5F5F3",
      textSecondaryHex: "#A1A8B8",
      accentHex: "#FF4F18",
      ctaTextHex: "#FFFFFF",
    },
    typographyStyle: "swiss",
    layoutMotif: "editorial-grid",
    defaultHeadline: "Engineered for Uncompromising Daily Performance",
    defaultSub: "Precision-crafted materials paired with architectural form.",
  },
  "editorial authority": {
    categoryKicker: "FEATURED · ATELIER",
    badgeText: "EDITOR'S PICK",
    priceOrOffer: "SHIPPING WORLDWIDE",
    ctaText: "View Collection",
    valueProps: [
      "Quiet luxury materials and restrained proportion",
      "Designed for lasting presence, not seasonal noise",
      "Crafted in limited runs with full traceability",
    ],
    palette: {
      backgroundHex: "#F4F1EA",
      surfaceHex: "#E8E2D5",
      textPrimaryHex: "#141311",
      textSecondaryHex: "#57534A",
      accentHex: "#B85D19",
      ctaTextHex: "#FFFFFF",
    },
    typographyStyle: "editorial",
    layoutMotif: "minimal-plinth",
    defaultHeadline: "Quiet Form. Enduring Material.",
    defaultSub: "An editorial object built for daily use and long ownership.",
  },
  technical: {
    categoryKicker: "SPEC SERIES · REV 02",
    badgeText: "FIELD READY",
    priceOrOffer: "IN STOCK · FAST DISPATCH",
    ctaText: "See Specs",
    valueProps: [
      "Measured tolerances and repeatable assembly",
      "Validated under continuous operating loads",
      "Documented service life and spare-part support",
    ],
    palette: {
      backgroundHex: "#0E1318",
      surfaceHex: "#161E26",
      textPrimaryHex: "#ECF0F5",
      textSecondaryHex: "#8C9BAE",
      accentHex: "#F59E0B",
      ctaTextHex: "#0B0D11",
    },
    typographyStyle: "technical",
    layoutMotif: "split-architectural",
    defaultHeadline: "Spec-Grade Performance. Zero Compromise.",
    defaultSub: "Instrument-level build quality for professional workflows.",
  },
  luxury: {
    categoryKicker: "PRIVATE COLLECTION · 01",
    badgeText: "BY APPOINTMENT",
    priceOrOffer: "COMPLIMENTARY CONCIERGE",
    ctaText: "Reserve Yours",
    valueProps: [
      "Rare materials finished by hand",
      "Exclusive allocation for registered clients",
      "Lifetime care and private delivery",
    ],
    palette: {
      backgroundHex: "#0B0D11",
      surfaceHex: "#16141A",
      textPrimaryHex: "#F7F3EA",
      textSecondaryHex: "#A89F90",
      accentHex: "#C9A227",
      ctaTextHex: "#0B0D11",
    },
    typographyStyle: "editorial",
    layoutMotif: "bold-typographic",
    defaultHeadline: "Rarity, Finished Without Excess.",
    defaultSub: "A private object defined by material and restraint.",
  },
};

function resolveTone(tone: string) {
  const key = (tone || "swiss industrial").toLowerCase().trim();
  if (TONE_PRESETS[key]) return TONE_PRESETS[key];
  if (key.includes("editorial")) return TONE_PRESETS["editorial authority"];
  if (key.includes("tech") || key.includes("spec")) return TONE_PRESETS.technical;
  if (key.includes("lux") || key.includes("premium")) return TONE_PRESETS.luxury;
  return TONE_PRESETS["swiss industrial"];
}

async function scrapeUrlMetadata(targetUrl: string): Promise<{
  title: string;
  description: string;
  siteName: string;
  ogImage: string;
  domain: string;
}> {
  let formattedUrl = targetUrl.trim();
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = "https://" + formattedUrl;
  }

  let domain = "brand.com";
  try {
    const parsed = new URL(formattedUrl);
    domain = parsed.hostname.replace(/^www\./, "");
  } catch {
    domain = targetUrl.replace(/^https?:\/\//, "").split("/")[0] || "brand.com";
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const response = await fetch(formattedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return { title: "", description: "", siteName: "", ogImage: "", domain };
    }

    const html = await response.text();

    const getMetaContent = (regex: RegExp) => {
      const match = html.match(regex);
      return match ? match[1].trim() : "";
    };

    const title =
      getMetaContent(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
      getMetaContent(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i) ||
      getMetaContent(/<title[^>]*>([^<]+)<\/title>/i);

    const description =
      getMetaContent(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
      getMetaContent(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i) ||
      getMetaContent(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
      getMetaContent(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);

    const siteName =
      getMetaContent(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i) ||
      domain.split(".")[0].toUpperCase();

    const ogImage =
      getMetaContent(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      getMetaContent(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

    return {
      title: decodeHtmlEntities(title),
      description: decodeHtmlEntities(description),
      siteName: decodeHtmlEntities(siteName),
      ogImage,
      domain,
    };
  } catch {
    return { title: "", description: "", siteName: "", ogImage: "", domain };
  }
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&/g, "&")
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/</g, "<")
    .replace(/>/g, ">");
}

function buildCampaign(
  url: string,
  description: string,
  productName: string,
  tone: string,
  scraped: { title: string; description: string; siteName: string; domain: string }
) {
  const preset = resolveTone(tone);
  const cleanDomain =
    scraped.domain ||
    url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] ||
    "brand.com";
  const rawBrand = productName.trim() || scraped.siteName || cleanDomain.split(".")[0];
  const brandName = rawBrand.charAt(0).toUpperCase() + rawBrand.slice(1);

  const combinedText = `${productName} ${scraped.title} ${description} ${scraped.description}`.trim();
  const words = combinedText.split(/\s+/).filter(Boolean);

  const firstSentence =
    combinedText.split(/[.!?]/)[0]?.trim() || preset.defaultHeadline;
  const shortHeadline = (words.slice(0, 4).join(" ") || `${brandName} Series`).slice(0, 22);
  const mediumHeadline = (
    firstSentence.length <= 42 ? firstSentence : words.slice(0, 6).join(" ") + "."
  ).slice(0, 42);
  const longHeadline = (
    firstSentence.length <= 68 ? firstSentence : words.slice(0, 9).join(" ") + "."
  ).slice(0, 68);

  const secondSentence =
    combinedText.split(/[.!?]/)[1]?.trim() || preset.defaultSub;

  return {
    brandName: brandName.toUpperCase(),
    productName: productName.trim() || brandName,
    displayUrl: cleanDomain.toLowerCase(),
    categoryKicker: preset.categoryKicker,
    badgeText: preset.badgeText,
    priceOrOffer: preset.priceOrOffer,
    ctaText: preset.ctaText,
    headlines: {
      short: shortHeadline,
      medium: mediumHeadline,
      long: longHeadline,
    },
    subheadline: secondSentence.endsWith(".") ? secondSentence : `${secondSentence}.`,
    valueProps: preset.valueProps,
    palette: preset.palette,
    typographyStyle: preset.typographyStyle,
    layoutMotif: preset.layoutMotif,
  };
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "adgen",
    mode: "deterministic",
  });
});

app.post("/api/inspect-url", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "A valid product URL is required." });
    }
    const metadata = await scrapeUrlMetadata(url);
    return res.json(metadata);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "Failed to inspect URL." });
  }
});

app.post("/api/synthesize-campaign", async (req, res) => {
  const {
    url = "",
    description = "",
    productName = "",
    tone = "Swiss Industrial",
  } = req.body;

  if (!description && !url && !productName) {
    return res
      .status(400)
      .json({ error: "Provide a product description or name to synthesize ad units." });
  }

  const scraped = url
    ? await scrapeUrlMetadata(url)
    : { title: "", description: "", siteName: "", ogImage: "", domain: "brand.com" };

  const campaign = buildCampaign(url, description, productName, tone, scraped);

  return res.json({
    campaign,
    scraped,
    mode: "deterministic",
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AdGen server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
