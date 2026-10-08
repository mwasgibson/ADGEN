import React, { useState } from "react";
import { BannerSpec, CampaignData } from "../types/banner";
import { ArrowUpRight } from "lucide-react";

interface BannerCanvasRendererProps {
  spec: BannerSpec;
  campaign: CampaignData;
  displayScale?: number;
}

export const BannerCanvasRenderer: React.FC<BannerCanvasRendererProps> = ({
  spec,
  campaign,
  displayScale = 1,
}) => {
  const [imgError, setImgError] = useState(false);
  const { palette } = campaign;
  const { width: w, height: h } = spec;

  const headlineFontClass =
    campaign.typographyStyle === "editorial"
      ? "font-serif-editorial tracking-normal font-normal"
      : campaign.typographyStyle === "technical"
      ? "font-mono-tabular tracking-tight font-semibold"
      : "font-display tracking-tight font-bold";

  const headlineText = campaign.headlines[spec.headlineKey] || campaign.headlines.medium;
  const displayBrand = campaign.productName || campaign.brandName;

  const renderProductVisual = (className: string) => {
    const hasValidImage = Boolean(campaign.productImageUrl) && !imgError;

    return (
      <div
        className={`relative overflow-hidden select-none ${className}`}
        style={{ backgroundColor: palette.surfaceHex }}
      >
        {hasValidImage ? (
          <img
            src={campaign.productImageUrl}
            alt={displayBrand}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-150"
            style={{
              transform: `scale(${campaign.imageScale}) translate(${campaign.imageOffsetX}%, ${campaign.imageOffsetY}%)`,
            }}
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-3 relative"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${palette.accentHex}28, ${palette.surfaceHex} 75%)`,
            }}
          >
            <div
              className="w-10 h-10 border flex items-center justify-center font-mono-tabular text-[10px] font-semibold tracking-widest"
              style={{
                borderColor: `${palette.textPrimaryHex}30`,
                color: palette.textPrimaryHex,
              }}
            >
              {displayBrand.slice(0, 2).toUpperCase()}
            </div>
          </div>
        )}

        {campaign.showGridLines && (
          <div
            className="absolute inset-0 pointer-events-none opacity-15"
            style={{
              backgroundImage: `linear-gradient(to right, ${palette.textPrimaryHex}20 1px, transparent 1px), linear-gradient(to bottom, ${palette.textPrimaryHex}20 1px, transparent 1px)`,
              backgroundSize: "32px 32px",
            }}
          />
        )}
      </div>
    );
  };

  const renderInteriorLayout = () => {
    if (h <= 60) {
      return (
        <div className="w-full h-full flex items-center justify-between overflow-hidden">
          {renderProductVisual("w-[68px] h-full shrink-0 border-r border-white/10")}
          <div className="flex-1 min-w-0 px-2.5 flex flex-col justify-center">
            <div
              className="font-mono-tabular text-[8px] uppercase tracking-wider truncate"
              style={{ color: palette.accentHex }}
            >
              {displayBrand}
            </div>
            <div
              className={`${headlineFontClass} text-[12px] leading-tight truncate`}
              style={{ color: palette.textPrimaryHex }}
            >
              {headlineText}
            </div>
          </div>
          <div className="pr-2 shrink-0">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] text-[9px] font-semibold whitespace-nowrap"
              style={{
                backgroundColor: palette.accentHex,
                color: palette.ctaTextHex,
              }}
            >
              {campaign.ctaText}
            </span>
          </div>
        </div>
      );
    }

    if (w === 320 && h === 100) {
      return (
        <div className="w-full h-full flex items-stretch overflow-hidden">
          {renderProductVisual("w-[108px] h-full shrink-0 border-r border-white/10")}
          <div className="flex-1 min-w-0 p-2.5 flex flex-col justify-between">
            <div>
              <div
                className="font-mono-tabular text-[8px] uppercase tracking-wider truncate"
                style={{ color: palette.textSecondaryHex }}
              >
                {displayBrand} · {campaign.badgeText}
              </div>
              <div
                className={`${headlineFontClass} text-[13px] leading-[1.15] line-clamp-2 mt-0.5`}
                style={{ color: palette.textPrimaryHex }}
              >
                {headlineText}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] text-[9px] font-semibold whitespace-nowrap"
                style={{
                  backgroundColor: palette.accentHex,
                  color: palette.ctaTextHex,
                }}
              >
                {campaign.ctaText}
                <ArrowUpRight className="w-2.5 h-2.5" />
              </span>
              <span
                className="font-mono-tabular text-[8px] truncate"
                style={{ color: palette.textSecondaryHex }}
              >
                {campaign.displayUrl}
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (w === 728 && h === 90) {
      return (
        <div className="w-full h-full flex items-stretch justify-between overflow-hidden">
          {renderProductVisual("w-[192px] h-full shrink-0 border-r border-white/10")}
          <div className="flex-1 min-w-0 px-5 py-2.5 flex flex-col justify-center">
            <div
              className="font-mono-tabular text-[9px] uppercase tracking-wider truncate"
              style={{ color: palette.textSecondaryHex }}
            >
              {displayBrand} · {campaign.categoryKicker}
            </div>
            <div
              className={`${headlineFontClass} text-[19px] leading-tight truncate mt-0.5`}
              style={{ color: palette.textPrimaryHex }}
            >
              {headlineText}
            </div>
            <div
              className="font-mono-tabular text-[10px] truncate mt-1"
              style={{ color: palette.textSecondaryHex }}
            >
              {campaign.priceOrOffer} · {campaign.displayUrl}
            </div>
          </div>
          <div className="px-5 flex items-center shrink-0 border-l border-white/10">
            <span
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[4px] text-[11px] font-semibold whitespace-nowrap"
              style={{
                backgroundColor: palette.accentHex,
                color: palette.ctaTextHex,
              }}
            >
              {campaign.ctaText}
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      );
    }

    if (w === 970 && h === 250) {
      return (
        <div className="w-full h-full flex items-stretch overflow-hidden">
          <div className="flex-1 p-7 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center gap-2 font-mono-tabular text-[10px] uppercase tracking-wider">
                <span style={{ color: palette.textPrimaryHex }} className="font-semibold">
                  {displayBrand}
                </span>
                <span style={{ color: palette.textSecondaryHex }}>·</span>
                <span style={{ color: palette.accentHex }}>{campaign.badgeText}</span>
                <span style={{ color: palette.textSecondaryHex }}>·</span>
                <span style={{ color: palette.textSecondaryHex }}>{campaign.categoryKicker}</span>
              </div>
              <h2
                className={`${headlineFontClass} text-[28px] leading-[1.12] mt-2.5 max-w-[500px]`}
                style={{ color: palette.textPrimaryHex, textWrap: "balance" }}
              >
                {headlineText}
              </h2>
              <p
                className="text-[12px] leading-relaxed mt-2 max-w-[480px] line-clamp-2"
                style={{ color: palette.textSecondaryHex }}
              >
                {campaign.subheadline}
              </p>
            </div>
            <div className="flex items-center gap-5 pt-2">
              <span
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[4px] text-[12px] font-semibold whitespace-nowrap"
                style={{
                  backgroundColor: palette.accentHex,
                  color: palette.ctaTextHex,
                }}
              >
                {campaign.ctaText}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
              <div
                className="font-mono-tabular text-[10px] uppercase tracking-wider"
                style={{ color: palette.textSecondaryHex }}
              >
                {campaign.priceOrOffer} · {campaign.displayUrl}
              </div>
            </div>
          </div>
          {renderProductVisual("w-[400px] h-full shrink-0 border-l border-white/10")}
        </div>
      );
    }

    if (w === 160 && h === 600) {
      return (
        <div className="w-full h-full flex flex-col justify-between overflow-hidden">
          <div className="p-3.5">
            <div
              className="font-mono-tabular text-[9px] font-semibold uppercase tracking-wider truncate"
              style={{ color: palette.accentHex }}
            >
              {displayBrand}
            </div>
            <div
              className="font-mono-tabular text-[8px] uppercase tracking-wider mt-0.5 truncate"
              style={{ color: palette.textSecondaryHex }}
            >
              {campaign.badgeText}
            </div>
            <h3
              className={`${headlineFontClass} text-[17px] leading-[1.18] mt-3`}
              style={{ color: palette.textPrimaryHex }}
            >
              {headlineText}
            </h3>
          </div>

          {renderProductVisual("w-full h-[215px] shrink-0 border-y border-white/10")}

          <div className="p-3.5 flex-1 flex flex-col justify-between">
            <p
              className="text-[11px] leading-[1.45] line-clamp-5"
              style={{ color: palette.textSecondaryHex }}
            >
              {campaign.subheadline}
            </p>
            <div className="space-y-2.5 pt-2">
              <div
                className="font-mono-tabular text-[9px] uppercase tracking-wider leading-tight"
                style={{ color: palette.textPrimaryHex }}
              >
                {campaign.priceOrOffer}
              </div>
              <span
                className="w-full inline-flex items-center justify-center gap-1 py-2.5 px-2 rounded-[4px] text-[10px] font-semibold whitespace-nowrap"
                style={{
                  backgroundColor: palette.accentHex,
                  color: palette.ctaTextHex,
                }}
              >
                {campaign.ctaText}
              </span>
              <div
                className="font-mono-tabular text-[8px] text-center truncate"
                style={{ color: palette.textSecondaryHex }}
              >
                {campaign.displayUrl}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (w === 300 && h === 600) {
      return (
        <div className="w-full h-full flex flex-col justify-between overflow-hidden">
          <div className="px-5 py-3.5 flex items-center justify-between border-b border-white/10">
            <span
              className="font-mono-tabular text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: palette.textPrimaryHex }}
            >
              {displayBrand}
            </span>
            <span
              className="font-mono-tabular text-[9px] uppercase tracking-wider"
              style={{ color: palette.accentHex }}
            >
              {campaign.badgeText}
            </span>
          </div>

          {renderProductVisual("w-full h-[250px] shrink-0 border-b border-white/10")}

          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              <div
                className="font-mono-tabular text-[9px] uppercase tracking-wider"
                style={{ color: palette.textSecondaryHex }}
              >
                {campaign.categoryKicker}
              </div>
              <h2
                className={`${headlineFontClass} text-[22px] leading-[1.15] mt-2`}
                style={{ color: palette.textPrimaryHex, textWrap: "balance" }}
              >
                {headlineText}
              </h2>
              <p
                className="text-[12px] leading-[1.5] mt-2.5 line-clamp-3"
                style={{ color: palette.textSecondaryHex }}
              >
                {campaign.subheadline}
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between font-mono-tabular text-[9px]">
                <span style={{ color: palette.textPrimaryHex }}>{campaign.priceOrOffer}</span>
                <span style={{ color: palette.textSecondaryHex }}>{campaign.displayUrl}</span>
              </div>
              <span
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-[4px] text-[12px] font-semibold whitespace-nowrap"
                style={{
                  backgroundColor: palette.accentHex,
                  color: palette.ctaTextHex,
                }}
              >
                {campaign.ctaText}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (w === 1200 && h === 628) {
      return (
        <div className="w-full h-full flex items-stretch overflow-hidden">
          <div className="flex-1 p-14 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center gap-3 font-mono-tabular text-[15px] uppercase tracking-wider">
                <span style={{ color: palette.textPrimaryHex }} className="font-semibold">
                  {displayBrand}
                </span>
                <span style={{ color: palette.textSecondaryHex }}>·</span>
                <span style={{ color: palette.accentHex }}>{campaign.badgeText}</span>
              </div>
              <h1
                className={`${headlineFontClass} text-[48px] leading-[1.1] mt-6`}
                style={{ color: palette.textPrimaryHex, textWrap: "balance" }}
              >
                {headlineText}
              </h1>
              <p
                className="text-[21px] leading-[1.5] mt-5 line-clamp-3"
                style={{ color: palette.textSecondaryHex }}
              >
                {campaign.subheadline}
              </p>
            </div>

            <div className="space-y-6 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-[6px] text-[20px] font-semibold whitespace-nowrap"
                  style={{
                    backgroundColor: palette.accentHex,
                    color: palette.ctaTextHex,
                  }}
                >
                  {campaign.ctaText}
                  <ArrowUpRight className="w-5 h-5" />
                </span>
                <div className="text-right font-mono-tabular">
                  <div className="text-[16px] font-medium" style={{ color: palette.textPrimaryHex }}>
                    {campaign.priceOrOffer}
                  </div>
                  <div className="text-[14px] mt-0.5" style={{ color: palette.textSecondaryHex }}>
                    {campaign.displayUrl}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {renderProductVisual("w-[520px] h-full shrink-0 border-l border-white/10")}
        </div>
      );
    }

    if (w === 1080 && h === 1080) {
      return (
        <div className="w-full h-full flex flex-col justify-between overflow-hidden">
          <div className="px-12 py-7 flex items-center justify-between border-b border-white/10">
            <span
              className="font-mono-tabular text-[18px] font-semibold uppercase tracking-widest"
              style={{ color: palette.textPrimaryHex }}
            >
              {displayBrand}
            </span>
            <span
              className="font-mono-tabular text-[16px] uppercase tracking-wider"
              style={{ color: palette.accentHex }}
            >
              {campaign.categoryKicker}
            </span>
          </div>

          {renderProductVisual("w-full h-[540px] shrink-0 border-b border-white/10")}

          <div className="p-12 flex-1 flex flex-col justify-between">
            <div>
              <h1
                className={`${headlineFontClass} text-[48px] leading-[1.12]`}
                style={{ color: palette.textPrimaryHex, textWrap: "balance" }}
              >
                {headlineText}
              </h1>
              <p
                className="text-[22px] leading-[1.45] mt-4 line-clamp-2"
                style={{ color: palette.textSecondaryHex }}
              >
                {campaign.subheadline}
              </p>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <div className="font-mono-tabular">
                <div className="text-[18px] font-semibold" style={{ color: palette.textPrimaryHex }}>
                  {campaign.priceOrOffer}
                </div>
                <div className="text-[16px] mt-1" style={{ color: palette.textSecondaryHex }}>
                  {campaign.displayUrl}
                </div>
              </div>
              <span
                className="inline-flex items-center gap-3 px-9 py-5 rounded-[6px] text-[22px] font-semibold whitespace-nowrap"
                style={{
                  backgroundColor: palette.accentHex,
                  color: palette.ctaTextHex,
                }}
              >
                {campaign.ctaText}
                <ArrowUpRight className="w-6 h-6" />
              </span>
            </div>
          </div>
        </div>
      );
    }

    const isLargeRect = w > 310;
    return (
      <div className="w-full h-full flex flex-col justify-between overflow-hidden">
        <div className="px-3.5 py-2 flex items-center justify-between border-b border-white/10">
          <span
            className="font-mono-tabular text-[9px] font-semibold uppercase tracking-wider truncate"
            style={{ color: palette.textPrimaryHex }}
          >
            {displayBrand}
          </span>
          <span
            className="font-mono-tabular text-[8px] uppercase tracking-wider shrink-0"
            style={{ color: palette.accentHex }}
          >
            {campaign.badgeText}
          </span>
        </div>

        {renderProductVisual(
          `w-full ${isLargeRect ? "h-[122px]" : "h-[106px]"} shrink-0 border-b border-white/10`
        )}

        <div className="px-3.5 py-2.5 flex-1 flex flex-col justify-between">
          <div>
            <h3
              className={`${headlineFontClass} ${
                isLargeRect ? "text-[17px]" : "text-[15px]"
              } leading-[1.16] line-clamp-2`}
              style={{ color: palette.textPrimaryHex }}
            >
              {headlineText}
            </h3>
            <p
              className="text-[10.5px] leading-[1.35] mt-1 line-clamp-2"
              style={{ color: palette.textSecondaryHex }}
            >
              {campaign.subheadline}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1.5">
            <span
              className="font-mono-tabular text-[8.5px] truncate"
              style={{ color: palette.textSecondaryHex }}
            >
              {campaign.displayUrl}
            </span>
            <span
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[3px] text-[10px] font-semibold whitespace-nowrap shrink-0"
              style={{
                backgroundColor: palette.accentHex,
                color: palette.ctaTextHex,
              }}
            >
              {campaign.ctaText}
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    );
  };

  const scaledWidth = Math.round(w * displayScale);
  const scaledHeight = Math.round(h * displayScale);

  return (
    <div
      style={{
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
      }}
      className="relative select-none overflow-hidden transition-all duration-150"
    >
      <div
        style={{
          width: `${w}px`,
          height: `${h}px`,
          transform: `scale(${displayScale})`,
          transformOrigin: "top left",
          backgroundColor: palette.backgroundHex,
          boxShadow: campaign.showBorderFrame ? "inset 0 0 0 1px rgba(255,255,255,0.14)" : "none",
        }}
      >
        {renderInteriorLayout()}
      </div>
    </div>
  );
};
