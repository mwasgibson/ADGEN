import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
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
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function buildDeterministicCampaign(
  url: string,
  description: string,
  productName: string,
  scraped: { title: string; description: string; siteName: string; domain: string }
) {
  const cleanDomain = scraped.domain || url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] || "brand.com";
  const rawBrand = productName.trim() || scraped.siteName || cleanDomain.split(".")[0];
  const brandName = rawBrand.charAt(0).toUpperCase() + rawBrand.slice(1);

  const combinedText = `${productName} ${scraped.title} ${description} ${scraped.description}`.trim();
  const words = combinedText.split(/\s+/).filter(Boolean);

  const firstSentence = combinedText.split(/[.!?]/)[0]?.trim() || "Engineered for Uncompromising Daily Performance";
  const shortHeadline = words.slice(0, 4).join(" ") || `${brandName} Series`;
  const mediumHeadline = firstSentence.length <= 44 ? firstSentence : words.slice(0, 6).join(" ") + ".";
  const longHeadline = firstSentence.length <= 68 ? firstSentence : words.slice(0, 9).join(" ") + ".";

  const secondSentence = combinedText.split(/[.!?]/)[1]?.trim() || "Precision-crafted materials paired with architectural form.";

  return {
    brandName: brandName.toUpperCase(),
    productName: productName.trim() || brandName,
    displayUrl: cleanDomain.toLowerCase(),
    categoryKicker: "NEW RELEASE · SERIES IV",
    badgeText: "LIMITED EDITION",
    priceOrOffer: "FREE EXPRESS SHIPPING",
    ctaText: "Explore Collection",
    headlines: {
      short: shortHeadline,
      medium: mediumHeadline,
      long: longHeadline,
    },
    subheadline: secondSentence.endsWith(".") ? secondSentence : `${secondSentence}.`,
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
    typographyStyle: "swiss" as const,
    layoutMotif: "editorial-grid" as const,
  };
}

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
  const { url = "", description = "", productName = "", tone = "Editorial Authority" } = req.body;

  if (!description && !url && !productName) {
    return res.status(400).json({ error: "Provide a product description or name to synthesize ad units." });
  }

  const scraped = url ? await scrapeUrlMetadata(url) : { title: "", description: "", siteName: "", ogImage: "", domain: "brand.com" };

  const ai = getGenAIClient();
  if (!ai) {
    return res.json({
      campaign: buildDeterministicCampaign(url, description, productName, scraped),
      scraped,
    });
  }

  try {
    const prompt = `You are an executive creative director at a top-tier design & advertising agency.
Given the following product name, product URL, scraped page metadata, and product description, craft a cohesive, high-converting multi-format banner ad campaign specification.

Product Name: ${productName || "Extract or deduce from context"}
Product URL: ${url || "Not provided"}
Scraped Domain: ${scraped.domain}
Scraped Title: ${scraped.title || "N/A"}
Scraped Meta Description: ${scraped.description || "N/A"}
User Product Description: ${description}
Requested Creative Direction / Tone: ${tone}

Strict Creative Rules:
- Write razor-sharp, human-crafted advertising copy. Avoid generic buzzwords, clichés, or robotic phrasing.
- Provide 3 headline lengths tailored to different IAB ad geometries:
  - short (max 22 chars, punchy for 320x50 mobile banners & 160x600 narrow skyscrapers)
  - medium (max 42 chars, ideal for 300x250 medium rectangles & 728x90 leaderboards)
  - long (max 68 chars, statement headline for 300x600 half-page, 970x250 billboard & 1080x1080 social square)
- Choose an intentional, high-contrast color palette that fits the brand's industrial/luxury/editorial positioning and meets WCAG AA contrast standards.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brandName: {
              type: Type.STRING,
              description: "Concise brand or product mark (e.g. 'KRONOS', 'ATELIER VERA', 'SONIC LABS')",
            },
            displayUrl: {
              type: Type.STRING,
              description: "Clean root domain or path for display on ads (e.g. 'kronos-audio.com')",
            },
            categoryKicker: {
              type: Type.STRING,
              description: "Short editorial kicker separated by middle dot, e.g. 'ACOUSTIC ARCHITECTURE · SERIES 02'",
            },
            badgeText: {
              type: Type.STRING,
              description: "Short callout tag e.g. 'NEW RELEASE' or 'SWISS ENGINEERED'",
            },
            priceOrOffer: {
              type: Type.STRING,
              description: "Concrete price point or offer e.g. '$480 · IN STOCK' or 'COMPLIMENTARY TRIAL'",
            },
            ctaText: {
              type: Type.STRING,
              description: "Action-oriented button label, 2-3 words max (e.g. 'Shop Series 02', 'Reserve Yours', 'Explore Specs')",
            },
            headlines: {
              type: Type.OBJECT,
              properties: {
                short: { type: Type.STRING },
                medium: { type: Type.STRING },
                long: { type: Type.STRING },
              },
              required: ["short", "medium", "long"],
            },
            subheadline: {
              type: Type.STRING,
              description: "Supporting body sentence (60-110 chars) explaining the core product mechanism or benefit.",
            },
            valueProps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 concise proof points or technical specifications.",
            },
            palette: {
              type: Type.OBJECT,
              properties: {
                backgroundHex: { type: Type.STRING, description: "Primary banner background hex color" },
                surfaceHex: { type: Type.STRING, description: "Secondary card/panel hex color" },
                textPrimaryHex: { type: Type.STRING, description: "High-contrast headline hex color" },
                textSecondaryHex: { type: Type.STRING, description: "Muted subheadline hex color" },
                accentHex: { type: Type.STRING, description: "Primary CTA button and focal accent hex color" },
                ctaTextHex: { type: Type.STRING, description: "Text color inside the CTA button (#FFFFFF or #0B0D11)" },
              },
              required: [
                "backgroundHex",
                "surfaceHex",
                "textPrimaryHex",
                "textSecondaryHex",
                "accentHex",
                "ctaTextHex",
              ],
            },
            typographyStyle: {
              type: Type.STRING,
              description: "One of: 'swiss', 'editorial', 'technical'",
            },
            layoutMotif: {
              type: Type.STRING,
              description: "One of: 'editorial-grid', 'split-architectural', 'minimal-plinth', 'bold-typographic'",
            },
          },
          required: [
            "brandName",
            "displayUrl",
            "categoryKicker",
            "badgeText",
            "priceOrOffer",
            "ctaText",
            "headlines",
            "subheadline",
            "valueProps",
            "palette",
            "typographyStyle",
            "layoutMotif",
          ],
        },
      },
    });

    const rawText = response.text?.trim();
    if (!rawText) {
      throw new Error("Empty synthesis response");
    }
    const parsedCampaign = JSON.parse(rawText);
    if (productName.trim()) {
      parsedCampaign.productName = productName.trim();
      parsedCampaign.brandName = productName.trim().toUpperCase();
    }
    return res.json({
      campaign: parsedCampaign,
      scraped,
    });
  } catch (error: any) {
    console.warn("Synthesize fallback triggered:", error?.message);
    return res.json({
      campaign: buildDeterministicCampaign(url, description, productName, scraped),
      scraped,
    });
  }
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
