export type AdFormatCategory = "all" | "display-rect" | "horizontal" | "vertical" | "social";

export type TypographyStyle = "swiss" | "editorial" | "technical";
export type LayoutMotif = "editorial-grid" | "split-architectural" | "minimal-plinth" | "bold-typographic";

export interface BannerSpec {
  id: string;
  name: string;
  code: string;
  width: number;
  height: number;
  aspectRatioLabel: string;
  category: Exclude<AdFormatCategory, "all">;
  placementNote: string;
  headlineKey: "short" | "medium" | "long";
}

export interface CampaignPalette {
  backgroundHex: string;
  surfaceHex: string;
  textPrimaryHex: string;
  textSecondaryHex: string;
  accentHex: string;
  ctaTextHex: string;
}

export interface CampaignData {
  id: string;
  productName?: string;
  productUrl: string;
  productDescription: string;
  brandName: string;
  displayUrl: string;
  categoryKicker: string;
  badgeText: string;
  priceOrOffer: string;
  ctaText: string;
  headlines: {
    short: string;
    medium: string;
    long: string;
  };
  subheadline: string;
  valueProps: string[];
  palette: CampaignPalette;
  typographyStyle: TypographyStyle;
  layoutMotif: LayoutMotif;
  productImageUrl: string;
  imageScale: number;
  imageOffsetX: number;
  imageOffsetY: number;
  showGridLines: boolean;
  showBorderFrame: boolean;
  createdAt?: number;
}

export interface PresetBrief {
  id: string;
  label: string;
  productUrl: string;
  productDescription: string;
  campaign: CampaignData;
}
