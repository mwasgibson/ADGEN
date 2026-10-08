import React, { useState, useRef, useEffect } from "react";
import { CampaignData } from "../types/banner";
import { CURATED_PALETTES, STANDARD_BANNER_SPECS } from "../data/bannerSpecs";
import {
  Globe,
  RefreshCw,
  Upload,
  Sliders,
  Type as TypeIcon,
  Palette,
  Download,
  Code,
  Eye,
  Sparkles,
  History,
  FileImage,
} from "lucide-react";
import { BannerCanvasRenderer } from "./BannerCanvasRenderer";
import { SizeSelector } from "./SizeSelector";
import {
  renderBannerToDataUrl,
  generateIabHtml5Bundle,
} from "../utils/exportBanner";
import {
  HistorySidebar,
  saveCampaignToHistory,
  loadCampaignHistory,
} from "./HistorySidebar";

type ActiveTab = "canvas" | "specs" | "export";
type ExportFormat = "png" | "jpeg";

export function MainStudio() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("canvas");

  // null initially so canvas is clean and empty until the user generates
  const [campaign, setCampaign] = useState<CampaignData | null>(null);

  // Selected banner sizes for generation (all 10 selected by default)
  const [selectedSizeIds, setSelectedSizeIds] = useState<string[]>(
    STANDARD_BANNER_SPECS.map((s) => s.id)
  );

  // Inputs: Product Name, Product Description, and Product Destination URL
  const [productNameInput, setProductNameInput] = useState<string>("");
  const [urlInput, setUrlInput] = useState<string>("");
  const [descInput, setDescInput] = useState<string>("");
  const [creativeTone, setCreativeTone] = useState<string>("Swiss Industrial");

  // Export format preference: PNG or JPG
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");

  // History Sidebar state
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [historyRefreshKey, setHistoryRefreshKey] = useState<number>(0);

  // Synthesis & URL Inspection state
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [isInspectingUrl, setIsInspectingUrl] = useState<boolean>(false);
  const [statusNote, setStatusNote] = useState<string>("");

  // Canvas Controls
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [focusedSpecId, setFocusedSpecId] = useState<string | null>(null);
  const [exportingSpecId, setExportingSpecId] = useState<string | null>(null);
  const [copiedHtmlSpecId, setCopiedHtmlSpecId] = useState<string | null>(null);
  const [isBatchExporting, setIsBatchExporting] = useState<boolean>(false);

  // Sidebar Inspector Sub-tab
  const [inspectorSection, setInspectorSection] = useState<"brief" | "copy" | "system">("brief");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load history count on mount
  useEffect(() => {
    const list = loadCampaignHistory();
    setHistoryCount(list.length);
  }, [historyRefreshKey]);

  const handleInspectUrl = async () => {
    if (!urlInput.trim()) return;
    setIsInspectingUrl(true);
    setStatusNote("Inspecting URL metadata...");
    try {
      const response = await fetch("/api/inspect-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const data = await response.json();
      if (data.domain) {
        const updatedDesc = data.description
          ? `${data.title ? data.title + " — " : ""}${data.description}`
          : descInput;
        if (data.description && !descInput.trim()) {
          setDescInput(updatedDesc);
        }
        if (data.siteName && !productNameInput.trim()) {
          setProductNameInput(data.siteName);
        }
        if (campaign) {
          setCampaign((prev) =>
            prev
              ? {
                  ...prev,
                  productUrl: urlInput.trim(),
                  displayUrl: data.domain,
                  brandName: (data.siteName || data.domain.split(".")[0]).toUpperCase(),
                  productName: productNameInput.trim() || data.siteName || prev.productName,
                  productImageUrl: data.ogImage || prev.productImageUrl,
                }
              : null
          );
        }
        setStatusNote(`Extracted metadata from ${data.domain}`);
      } else {
        setStatusNote("Extracted domain from URL.");
      }
    } catch {
      setStatusNote("Resolved domain locally.");
    } finally {
      setIsInspectingUrl(false);
    }
  };

  const handleSynthesizeCampaign = async () => {
    if (!descInput.trim() && !urlInput.trim() && !productNameInput.trim()) {
      setStatusNote("Please enter a product name or description first.");
      return;
    }
    if (selectedSizeIds.length === 0) {
      setStatusNote("Please select at least one banner size.");
      return;
    }
    setIsSynthesizing(true);
    setStatusNote(`Synthesizing banner ads for ${selectedSizeIds.length} sizes...`);
    try {
      const response = await fetch("/api/synthesize-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: urlInput.trim(),
          description: descInput.trim(),
          productName: productNameInput.trim(),
          tone: creativeTone,
        }),
      });
      const data = await response.json();
      if (data.campaign) {
        const newCampaign: CampaignData = {
          id: `campaign-${Date.now()}`,
          productName: productNameInput.trim() || data.campaign.brandName || "Product",
          productUrl: urlInput.trim(),
          productDescription: descInput.trim(),
          brandName: (productNameInput.trim() || data.campaign.brandName || "STUDIO").toUpperCase(),
          displayUrl: data.campaign.displayUrl || "brand.com",
          categoryKicker: data.campaign.categoryKicker || "NEW RELEASE · SERIES I",
          badgeText: data.campaign.badgeText || "PREMIUM",
          priceOrOffer: data.campaign.priceOrOffer || "FREE SHIPPING",
          ctaText: data.campaign.ctaText || "Shop Now",
          headlines: data.campaign.headlines || {
            short: "Engineered For Speed.",
            medium: "Precision Built. Uncompromising Quality.",
            long: "Experience Uncompromising Performance Designed For Everyday Excellence.",
          },
          subheadline:
            data.campaign.subheadline ||
            "Crafted with architectural grade materials and backed by our guarantee.",
          valueProps: data.campaign.valueProps || [
            "Precision-engineered materials",
            "Built for daily performance",
            "Worldwide express dispatch",
          ],
          palette: data.campaign.palette || CURATED_PALETTES[0].palette,
          typographyStyle:
            data.campaign.typographyStyle === "editorial" ||
            data.campaign.typographyStyle === "technical" ||
            data.campaign.typographyStyle === "swiss"
              ? data.campaign.typographyStyle
              : "swiss",
          layoutMotif: data.campaign.layoutMotif || "editorial-grid",
          productImageUrl: data.scraped?.ogImage || "",
          imageScale: 1.0,
          imageOffsetX: 0,
          imageOffsetY: 0,
          showGridLines: true,
          showBorderFrame: true,
          createdAt: Date.now(),
        };

        setCampaign(newCampaign);

        // Store in history
        saveCampaignToHistory(newCampaign);
        setHistoryRefreshKey((k) => k + 1);

        setStatusNote(`Generated and saved ad units across ${selectedSizeIds.length} banner sizes.`);
      }
    } catch {
      setStatusNote("Failed to synthesize ads. Please try again.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleSelectFromHistory = (historicCampaign: CampaignData) => {
    setCampaign({ ...historicCampaign });
    if (historicCampaign.productName) {
      setProductNameInput(historicCampaign.productName);
    }
    if (historicCampaign.productDescription) {
      setDescInput(historicCampaign.productDescription);
    }
    if (historicCampaign.productUrl) {
      setUrlInput(historicCampaign.productUrl);
    }
    setStatusNote(`Restored design for "${historicCampaign.productName || historicCampaign.brandName}".`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCampaign((prev) =>
          prev
            ? {
                ...prev,
                productImageUrl: reader.result as string,
              }
            : null
        );
        setStatusNote("Updated product key visual across selected formats.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadImage = async (specId: string, format: ExportFormat = exportFormat) => {
    if (!campaign) return;
    const spec = STANDARD_BANNER_SPECS.find((s) => s.id === specId);
    if (!spec) return;
    setExportingSpecId(specId);
    try {
      const dataUrl = await renderBannerToDataUrl(spec, campaign, format, 2);
      const link = document.createElement("a");
      const cleanBrand = (campaign.productName || campaign.brandName)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-");
      const ext = format === "jpeg" ? "jpg" : "png";
      link.download = `${cleanBrand}-${spec.width}x${spec.height}@2x.${ext}`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setStatusNote(`Exported ${spec.width}×${spec.height} as ${format.toUpperCase()}.`);
    } finally {
      setExportingSpecId(null);
    }
  };

  const handleCopyHtml5 = (specId: string) => {
    if (!campaign) return;
    const spec = STANDARD_BANNER_SPECS.find((s) => s.id === specId);
    if (!spec) return;
    const htmlCode = generateIabHtml5Bundle(spec, campaign);
    navigator.clipboard.writeText(htmlCode);
    setCopiedHtmlSpecId(specId);
    setStatusNote(`Copied IAB HTML5 bundle for ${spec.width}×${spec.height}.`);
    setTimeout(() => setCopiedHtmlSpecId(null), 2000);
  };

  const handleDownloadHtmlFile = (specId: string) => {
    if (!campaign) return;
    const spec = STANDARD_BANNER_SPECS.find((s) => s.id === specId);
    if (!spec) return;
    const htmlCode = generateIabHtml5Bundle(spec, campaign);
    const blob = new Blob([htmlCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const cleanBrand = (campaign.productName || campaign.brandName)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-");
    link.download = `${cleanBrand}-${spec.width}x${spec.height}-iab.html`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatusNote(`Downloaded ${spec.width}×${spec.height} HTML5 ad unit.`);
  };

  const handleBatchExportAll = async (format: ExportFormat = exportFormat) => {
    if (!campaign || filteredSpecs.length === 0) return;
    setIsBatchExporting(true);
    setStatusNote(`Rendering high-density @2x ${format.toUpperCase()} suite...`);
    try {
      for (const spec of filteredSpecs) {
        const dataUrl = await renderBannerToDataUrl(spec, campaign, format, 2);
        const link = document.createElement("a");
        const cleanBrand = (campaign.productName || campaign.brandName)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-");
        const ext = format === "jpeg" ? "jpg" : "png";
        link.download = `${cleanBrand}-${spec.width}x${spec.height}@2x.${ext}`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        await new Promise((r) => setTimeout(r, 180));
      }
      setStatusNote(`Exported ${filteredSpecs.length} production banner units as ${format.toUpperCase()}.`);
    } finally {
      setIsBatchExporting(false);
    }
  };

  const activeSelectedSpecs = STANDARD_BANNER_SPECS.filter((spec) =>
    selectedSizeIds.includes(spec.id)
  );

  const filteredSpecs = activeSelectedSpecs.filter((spec) => {
    const matchesCategory = selectedCategory === "all" || spec.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      spec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spec.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spec.placementNote.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getDisplayScale = (width: number) => {
    if (width >= 1000) return 0.42 * zoomScale;
    if (width >= 900) return 0.72 * zoomScale;
    return zoomScale;
  };

  return (
    <div className="h-screen flex flex-col bg-[#0B0D11] text-[#F3F4F6] overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-14 px-6 border-b border-[#222630] bg-[#0B0D11] flex items-center justify-between shrink-0 z-30">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab("canvas");
          }}
          className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap"
        >
          AdGen
        </a>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <button
            onClick={() => setActiveTab("canvas")}
            className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === "canvas"
                ? "text-white border-b-2 border-[#FF4F18]"
                : "text-[#9CA3AF] hover:text-white"
            }`}
          >
            Ad Canvas
          </button>
          <button
            onClick={() => setActiveTab("specs")}
            className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === "specs"
                ? "text-white border-b-2 border-[#FF4F18]"
                : "text-[#9CA3AF] hover:text-white"
            }`}
          >
            IAB Specification Matrix
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === "export"
                ? "text-white border-b-2 border-[#FF4F18]"
                : "text-[#9CA3AF] hover:text-white"
            }`}
          >
            HTML5 & Code Bundles
          </button>
        </nav>

        <div className="flex items-center gap-3">
          {/* History Sidebar Button */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="px-3 py-1.5 text-xs font-medium text-[#E5E7EB] bg-[#1A1E27] hover:bg-[#252A36] border border-[#2D3342] rounded-[4px] transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <History className="w-3.5 h-3.5 text-[#FF4F18]" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="font-mono-tabular text-[10px] bg-[#2D3342] text-white px-1.5 py-0.2 rounded-full">
                {historyCount}
              </span>
            )}
          </button>

          {/* Export Format Selector */}
          <div className="flex items-center bg-[#1A1E27] border border-[#2D3342] rounded-[4px] p-0.5 text-xs font-mono-tabular">
            <button
              onClick={() => setExportFormat("png")}
              className={`px-2 py-1 rounded-[3px] transition-colors cursor-pointer ${
                exportFormat === "png"
                  ? "bg-[#FF4F18] text-white font-semibold"
                  : "text-[#9CA3AF] hover:text-white"
              }`}
            >
              PNG
            </button>
            <button
              onClick={() => setExportFormat("jpeg")}
              className={`px-2 py-1 rounded-[3px] transition-colors cursor-pointer ${
                exportFormat === "jpeg"
                  ? "bg-[#FF4F18] text-white font-semibold"
                  : "text-[#9CA3AF] hover:text-white"
              }`}
            >
              JPG
            </button>
          </div>

          {/* Batch Download Button */}
          <button
            onClick={() => handleBatchExportAll(exportFormat)}
            disabled={isBatchExporting || !campaign || filteredSpecs.length === 0}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#FF4F18] rounded-[4px] hover:bg-[#E03E0B] transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            {isBatchExporting
              ? "Exporting..."
              : `Export All ${exportFormat.toUpperCase()} (${campaign ? filteredSpecs.length : 0})`}
          </button>
        </div>
      </header>

      {/* Main Studio Body: Fixed full height, sidebar independent from scrollable canvas */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Fixed Left Sidebar */}
        <aside className="w-full lg:w-[360px] xl:w-[390px] h-[45vh] lg:h-full border-b lg:border-b-0 lg:border-r border-[#222630] bg-[#111319] flex flex-col shrink-0 overflow-hidden">
          <div className="p-4 border-b border-[#222630] shrink-0">
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#0B0D11] rounded-[5px] border border-[#222630]">
              <button
                onClick={() => setInspectorSection("brief")}
                className={`py-1.5 px-2 text-xs font-medium rounded-[3px] transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 ${
                  inspectorSection === "brief"
                    ? "bg-[#1E222B] text-white"
                    : "text-[#9CA3AF] hover:text-white"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Input & Sizes
              </button>
              <button
                onClick={() => setInspectorSection("copy")}
                className={`py-1.5 px-2 text-xs font-medium rounded-[3px] transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 ${
                  inspectorSection === "copy"
                    ? "bg-[#1E222B] text-white"
                    : "text-[#9CA3AF] hover:text-white"
                }`}
              >
                <TypeIcon className="w-3.5 h-3.5" />
                Copy Deck
              </button>
              <button
                onClick={() => setInspectorSection("system")}
                className={`py-1.5 px-2 text-xs font-medium rounded-[3px] transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 ${
                  inspectorSection === "system"
                    ? "bg-[#1E222B] text-white"
                    : "text-[#9CA3AF] hover:text-white"
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                Visual System
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {inspectorSection === "brief" && (
              <>
                {/* 01. Size Selector */}
                <div>
                  <SizeSelector
                    selectedSizeIds={selectedSizeIds}
                    onChange={setSelectedSizeIds}
                  />
                </div>

                {/* 02. Product Name Input Field */}
                <div className="pt-4 border-t border-[#222630]">
                  <label className="block text-xs font-semibold text-[#E5E7EB] mb-2">
                    Product / Brand Name
                  </label>
                  <input
                    type="text"
                    value={productNameInput}
                    onChange={(e) => setProductNameInput(e.target.value)}
                    placeholder="e.g. Vektor Espresso, Nova Headset, Lumina"
                    className="w-full px-3 py-2 bg-[#0B0D11] border border-[#222630] rounded-[4px] text-xs font-medium text-white placeholder-[#6B7280] focus:outline-none focus:border-[#FF4F18]"
                  />
                </div>

                {/* 03. Product Description & Offer */}
                <div className="pt-4 border-t border-[#222630]">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-[#E5E7EB]">
                      Product Description
                    </label>
                    <span className="font-mono-tabular text-[11px] text-[#9CA3AF]">
                      {descInput.length} chars
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                    placeholder="Enter what you are promoting: key features, benefits, materials, pricing, and special offers (e.g. 'Handcrafted full-grain leather backpack. Water-resistant, padded 16-inch laptop pocket, antique brass hardware. 20% off with code LAUNCH20')..."
                    className="w-full p-3 bg-[#0B0D11] border border-[#222630] rounded-[4px] text-xs leading-relaxed text-white placeholder-[#6B7280] focus:outline-none focus:border-[#FF4F18] resize-y"
                  />
                </div>

                {/* 04. Product Destination URL (Optional) */}
                <div className="pt-4 border-t border-[#222630]">
                  <label className="block text-xs font-semibold text-[#E5E7EB] mb-2">
                    Product Destination URL <span className="text-[11px] font-normal text-[#9CA3AF]">(Optional)</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Globe className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://yourbrand.com/product"
                        className="w-full pl-8 pr-3 py-2 bg-[#0B0D11] border border-[#222630] rounded-[4px] text-xs font-mono-tabular text-white placeholder-[#6B7280] focus:outline-none focus:border-[#FF4F18]"
                      />
                    </div>
                    <button
                      onClick={handleInspectUrl}
                      disabled={isInspectingUrl || !urlInput.trim()}
                      className="px-3 py-2 bg-[#1A1E27] hover:bg-[#252A36] border border-[#2D3342] rounded-[4px] text-xs font-medium text-white whitespace-nowrap cursor-pointer transition-colors disabled:opacity-40"
                    >
                      {isInspectingUrl ? "Fetching..." : "Fetch Info"}
                    </button>
                  </div>
                </div>

                {/* 05. Creative Direction */}
                <div>
                  <label className="block text-xs font-semibold text-[#E5E7EB] mb-2">
                    Creative Direction
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {["Swiss Industrial", "Editorial Luxury", "Direct Response"].map((tone) => (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => setCreativeTone(tone)}
                        className={`py-2 px-2.5 text-[11px] font-medium rounded-[4px] border transition-colors whitespace-nowrap truncate cursor-pointer ${
                          creativeTone === tone
                            ? "bg-[#1A1E27] border-[#FF4F18] text-white"
                            : "bg-[#0B0D11] border-[#222630] text-[#9CA3AF] hover:text-white"
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSynthesizeCampaign}
                    disabled={isSynthesizing || selectedSizeIds.length === 0}
                    className="w-full py-2.5 px-4 bg-[#FF4F18] hover:bg-[#E03E0B] text-white font-semibold text-xs rounded-[4px] transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSynthesizing ? "animate-spin" : ""}`} />
                    {isSynthesizing
                      ? `Generating Ads for ${selectedSizeIds.length} Sizes...`
                      : `Generate Banner Ads (${selectedSizeIds.length} Selected)`}
                  </button>
                </div>
              </>
            )}

            {inspectorSection === "copy" && (
              <div className="space-y-4">
                {!campaign ? (
                  <div className="py-8 text-center text-xs text-[#9CA3AF]">
                    Generate your banner ads first to edit the copy deck.
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-[#E5E7EB] mb-1.5">
                        Product / Brand Display Name
                      </label>
                      <input
                        type="text"
                        value={campaign.productName || campaign.brandName}
                        onChange={(e) =>
                          setCampaign((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  productName: e.target.value,
                                  brandName: e.target.value.toUpperCase(),
                                }
                              : null
                          )
                        }
                        className="w-full px-3 py-2 bg-[#0B0D11] border border-[#222630] rounded-[4px] text-xs font-medium text-white focus:outline-none focus:border-[#FF4F18]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#E5E7EB] mb-1.5">
                          Callout Tag
                        </label>
                        <input
                          type="text"
                          value={campaign.badgeText}
                          onChange={(e) =>
                            setCampaign((prev) => (prev ? { ...prev, badgeText: e.target.value } : null))
                          }
                          className="w-full px-3 py-2 bg-[#0B0D11] border border-[#222630] rounded-[4px] text-xs font-mono-tabular text-white focus:outline-none focus:border-[#FF4F18]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#E5E7EB] mb-1.5">
                          Display Domain
                        </label>
                        <input
                          type="text"
                          value={campaign.displayUrl}
                          onChange={(e) =>
                            setCampaign((prev) => (prev ? { ...prev, displayUrl: e.target.value } : null))
                          }
                          className="w-full px-3 py-2 bg-[#0B0D11] border border-[#222630] rounded-[4px] text-xs font-mono-tabular text-white focus:outline-none focus:border-[#FF4F18]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#E5E7EB] mb-1.5">
                        Compact Headline (320×50, 160×600)
                      </label>
                      <input
                        type="text"
                        value={campaign.headlines.short}
                        onChange={(e) =>
                          setCampaign((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  headlines: { ...prev.headlines, short: e.target.value },
                                }
                              : null
                          )
                        }
                        className="w-full px-3 py-2 bg-[#0B0D11] border border-[#222630] rounded-[4px] text-xs text-white focus:outline-none focus:border-[#FF4F18]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#E5E7EB] mb-1.5">
                        Standard Headline (300×250, 728×90, 336×280)
                      </label>
                      <input
                        type="text"
                        value={campaign.headlines.medium}
                        onChange={(e) =>
                          setCampaign((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  headlines: { ...prev.headlines, medium: e.target.value },
                                }
                              : null
                          )
                        }
                        className="w-full px-3 py-2 bg-[#0B0D11] border border-[#222630] rounded-[4px] text-xs text-white focus:outline-none focus:border-[#FF4F18]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#E5E7EB] mb-1.5">
                        Flagship Headline (300×600, 970×250, Social)
                      </label>
                      <textarea
                        rows={2}
                        value={campaign.headlines.long}
                        onChange={(e) =>
                          setCampaign((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  headlines: { ...prev.headlines, long: e.target.value },
                                }
                              : null
                          )
                        }
                        className="w-full px-3 py-2 bg-[#0B0D11] border border-[#222630] rounded-[4px] text-xs text-white focus:outline-none focus:border-[#FF4F18]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#E5E7EB] mb-1.5">
                        Supporting Subheadline
                      </label>
                      <textarea
                        rows={2}
                        value={campaign.subheadline}
                        onChange={(e) =>
                          setCampaign((prev) =>
                            prev ? { ...prev, subheadline: e.target.value } : null
                          )
                        }
                        className="w-full px-3 py-2 bg-[#0B0D11] border border-[#222630] rounded-[4px] text-xs text-white focus:outline-none focus:border-[#FF4F18]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#E5E7EB] mb-1.5">
                          Primary CTA Label
                        </label>
                        <input
                          type="text"
                          value={campaign.ctaText}
                          onChange={(e) =>
                            setCampaign((prev) => (prev ? { ...prev, ctaText: e.target.value } : null))
                          }
                          className="w-full px-3 py-2 bg-[#0B0D11] border border-[#222630] rounded-[4px] text-xs text-white focus:outline-none focus:border-[#FF4F18]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#E5E7EB] mb-1.5">
                          Price / Offer Line
                        </label>
                        <input
                          type="text"
                          value={campaign.priceOrOffer}
                          onChange={(e) =>
                            setCampaign((prev) =>
                              prev ? { ...prev, priceOrOffer: e.target.value } : null
                            )
                          }
                          className="w-full px-3 py-2 bg-[#0B0D11] border border-[#222630] rounded-[4px] text-xs font-mono-tabular text-white focus:outline-none focus:border-[#FF4F18]"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {inspectorSection === "system" && (
              <div className="space-y-5">
                {!campaign ? (
                  <div className="py-8 text-center text-xs text-[#9CA3AF]">
                    Generate your banner ads first to configure visual styling.
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-[#E5E7EB] mb-2">
                        Typographic Voice
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(
                          [
                            { id: "swiss", label: "Syne Display" },
                            { id: "editorial", label: "Instrument Serif" },
                            { id: "technical", label: "JetBrains Mono" },
                          ] as const
                        ).map((font) => (
                          <button
                            key={font.id}
                            onClick={() =>
                              setCampaign((prev) =>
                                prev ? { ...prev, typographyStyle: font.id } : null
                              )
                            }
                            className={`py-2 px-2 text-xs font-medium rounded-[4px] border transition-colors whitespace-nowrap cursor-pointer ${
                              campaign.typographyStyle === font.id
                                ? "bg-[#1A1E27] border-[#FF4F18] text-white"
                                : "bg-[#0B0D11] border-[#222630] text-[#9CA3AF] hover:text-white"
                            }`}
                          >
                            {font.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#222630]">
                      <label className="block text-xs font-semibold text-[#E5E7EB] mb-2">
                        Curated Studio Palettes
                      </label>
                      <div className="space-y-1.5">
                        {CURATED_PALETTES.map((item) => (
                          <button
                            key={item.name}
                            onClick={() =>
                              setCampaign((prev) =>
                                prev ? { ...prev, palette: { ...item.palette } } : null
                              )
                            }
                            className="w-full px-3 py-2 bg-[#0B0D11] hover:bg-[#161922] border border-[#222630] rounded-[4px] flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <span className="text-xs text-[#E5E7EB]">{item.name}</span>
                            <div className="flex items-center gap-1">
                              <span
                                className="w-4 h-4 rounded-sm border border-white/20"
                                style={{ backgroundColor: item.palette.backgroundHex }}
                              />
                              <span
                                className="w-4 h-4 rounded-sm border border-white/20"
                                style={{ backgroundColor: item.palette.textPrimaryHex }}
                              />
                              <span
                                className="w-4 h-4 rounded-sm border border-white/20"
                                style={{ backgroundColor: item.palette.accentHex }}
                              />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#222630] grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-[#9CA3AF] mb-1">Canvas</label>
                        <div className="flex items-center gap-1.5 bg-[#0B0D11] border border-[#222630] rounded-[4px] px-2 py-1.5">
                          <input
                            type="color"
                            value={campaign.palette.backgroundHex}
                            onChange={(e) =>
                              setCampaign((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      palette: { ...prev.palette, backgroundHex: e.target.value },
                                    }
                                  : null
                              )
                            }
                            className="w-4 h-4 bg-transparent border-0 cursor-pointer"
                          />
                          <span className="font-mono-tabular text-[10px]">
                            {campaign.palette.backgroundHex}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#9CA3AF] mb-1">Headline</label>
                        <div className="flex items-center gap-1.5 bg-[#0B0D11] border border-[#222630] rounded-[4px] px-2 py-1.5">
                          <input
                            type="color"
                            value={campaign.palette.textPrimaryHex}
                            onChange={(e) =>
                              setCampaign((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      palette: { ...prev.palette, textPrimaryHex: e.target.value },
                                    }
                                  : null
                              )
                            }
                            className="w-4 h-4 bg-transparent border-0 cursor-pointer"
                          />
                          <span className="font-mono-tabular text-[10px]">
                            {campaign.palette.textPrimaryHex}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#9CA3AF] mb-1">Accent CTA</label>
                        <div className="flex items-center gap-1.5 bg-[#0B0D11] border border-[#222630] rounded-[4px] px-2 py-1.5">
                          <input
                            type="color"
                            value={campaign.palette.accentHex}
                            onChange={(e) =>
                              setCampaign((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      palette: { ...prev.palette, accentHex: e.target.value },
                                    }
                                  : null
                              )
                            }
                            className="w-4 h-4 bg-transparent border-0 cursor-pointer"
                          />
                          <span className="font-mono-tabular text-[10px]">
                            {campaign.palette.accentHex}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#222630] space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[#E5E7EB]">
                          Product Key Visual
                        </label>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs font-medium text-[#FF4F18] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          Upload Image
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-[#9CA3AF] mb-1">
                          <span>Image Scale</span>
                          <span className="font-mono-tabular">
                            {Math.round(campaign.imageScale * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.9"
                          max="1.5"
                          step="0.02"
                          value={campaign.imageScale}
                          onChange={(e) =>
                            setCampaign((prev) =>
                              prev ? { ...prev, imageScale: parseFloat(e.target.value) } : null
                            )
                          }
                          className="w-full accent-[#FF4F18]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex justify-between text-[11px] text-[#9CA3AF] mb-1">
                            <span>Focal Pan X</span>
                            <span className="font-mono-tabular">{campaign.imageOffsetX}%</span>
                          </div>
                          <input
                            type="range"
                            min="-25"
                            max="25"
                            step="1"
                            value={campaign.imageOffsetX}
                            onChange={(e) =>
                              setCampaign((prev) =>
                                prev
                                  ? { ...prev, imageOffsetX: parseInt(e.target.value, 10) }
                                  : null
                              )
                            }
                            className="w-full accent-[#FF4F18]"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] text-[#9CA3AF] mb-1">
                            <span>Focal Pan Y</span>
                            <span className="font-mono-tabular">{campaign.imageOffsetY}%</span>
                          </div>
                          <input
                            type="range"
                            min="-25"
                            max="25"
                            step="1"
                            value={campaign.imageOffsetY}
                            onChange={(e) =>
                              setCampaign((prev) =>
                                prev
                                  ? { ...prev, imageOffsetY: parseInt(e.target.value, 10) }
                                  : null
                              )
                            }
                            className="w-full accent-[#FF4F18]"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {statusNote && (
            <div className="px-5 py-2.5 border-t border-[#222630] bg-[#0B0D11] text-[11px] text-[#9CA3AF] flex items-center justify-between shrink-0">
              <span className="truncate">{statusNote}</span>
              <button
                onClick={() => setStatusNote("")}
                className="text-[10px] text-[#6B7280] hover:text-white ml-2 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}
        </aside>

        {/* Scrollable Main Viewport (Canvas scrolls independently) */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0B0D11] h-full overflow-hidden">
          <div className="px-6 py-3.5 border-b border-[#222630] bg-[#111319]/60 flex flex-wrap items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-1 p-1 bg-[#0B0D11] rounded-[5px] border border-[#222630] overflow-x-auto">
              {[
                { id: "all", label: `All Active (${activeSelectedSpecs.length})` },
                { id: "display-rect", label: "Rectangles" },
                { id: "horizontal", label: "Leaderboards & Mobile" },
                { id: "vertical", label: "Skyscrapers" },
                { id: "social", label: "Social Feed" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-[3px] transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-[#1E222B] text-white"
                      : "text-[#9CA3AF] hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter size (e.g. 300x250)..."
                className="px-3 py-1.5 bg-[#0B0D11] border border-[#222630] rounded-[4px] text-xs font-mono-tabular text-white placeholder-[#6B7280] focus:outline-none focus:border-[#FF4F18] w-44"
              />
              {activeTab === "canvas" && (
                <div className="hidden sm:flex items-center gap-1 bg-[#0B0D11] border border-[#222630] rounded-[4px] p-1">
                  {[0.75, 1].map((scaleVal) => (
                    <button
                      key={scaleVal}
                      onClick={() => setZoomScale(scaleVal)}
                      className={`px-2 py-1 text-[11px] font-mono-tabular rounded-[3px] cursor-pointer ${
                        zoomScale === scaleVal
                          ? "bg-[#1E222B] text-white"
                          : "text-[#9CA3AF] hover:text-white"
                      }`}
                    >
                      {Math.round(scaleVal * 100)}%
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tab 1: Multi-Format Ad Canvas */}
          {activeTab === "canvas" && (
            <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
              {!campaign ? (
                /* Empty Canvas State */
                <div className="h-full flex flex-col items-center justify-center py-20 px-6 border border-dashed border-[#222630] rounded-[6px] bg-[#111319]/40 text-center">
                  <div className="w-12 h-12 rounded-full bg-[#1A1E27] border border-[#2D3342] flex items-center justify-center text-[#FF4F18] mb-4">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-white tracking-tight">
                    Ad Canvas Ready
                  </h2>
                  <p className="text-xs text-[#9CA3AF] max-w-md mt-2 leading-relaxed">
                    Enter your product details in the sidebar and choose your target banner sizes. Click <strong>Generate Banner Ads</strong> to synthesize your customized banner ad suite.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono-tabular text-[#6B7280]">
                    <span>{selectedSizeIds.length} sizes selected</span>
                    <span>·</span>
                    <span>Export PNG & JPG</span>
                    <span>·</span>
                    <span>History saved</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-8 pb-5 border-b border-[#222630] flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                      <div className="text-xs text-[#9CA3AF] font-mono-tabular">
                        <span className="text-white font-semibold">{campaign.productName || campaign.brandName}</span>
                        <span className="mx-2">·</span>
                        <span>{campaign.displayUrl}</span>
                        <span className="mx-2">·</span>
                        <span>{filteredSpecs.length} of {STANDARD_BANNER_SPECS.length} Sizes Enabled</span>
                      </div>
                      <h1 className="font-display text-2xl font-bold text-white mt-1 tracking-tight">
                        {campaign.headlines.long}
                      </h1>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#9CA3AF] font-mono-tabular">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={campaign.showGridLines}
                          onChange={(e) =>
                            setCampaign((prev) =>
                              prev ? { ...prev, showGridLines: e.target.checked } : null
                            )
                          }
                          className="accent-[#FF4F18]"
                        />
                        Architectural Grid
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={campaign.showBorderFrame}
                          onChange={(e) =>
                            setCampaign((prev) =>
                              prev ? { ...prev, showBorderFrame: e.target.checked } : null
                            )
                          }
                          className="accent-[#FF4F18]"
                        />
                        1px IAB Keyline
                      </label>
                    </div>
                  </div>

                  {selectedSizeIds.length === 0 ? (
                    <div className="py-16 text-center border border-[#222630] rounded-[6px] bg-[#111319]">
                      <p className="text-sm text-[#E5E7EB] font-medium">
                        No banner sizes selected.
                      </p>
                      <p className="text-xs text-[#9CA3AF] mt-1">
                        Select one or more banner sizes in the left sidebar to generate ads.
                      </p>
                      <button
                        onClick={() => setSelectedSizeIds(STANDARD_BANNER_SPECS.map((s) => s.id))}
                        className="mt-4 px-4 py-2 text-xs font-semibold bg-[#FF4F18] text-white rounded-[4px] hover:bg-[#E03E0B] cursor-pointer"
                      >
                        Select All 10 Standard Sizes
                      </button>
                    </div>
                  ) : filteredSpecs.length === 0 ? (
                    <div className="py-16 text-center border border-[#222630] rounded-[6px] bg-[#111319]">
                      <p className="text-sm text-[#9CA3AF]">
                        No selected sizes match your filter or search query.
                      </p>
                      <button
                        onClick={() => {
                          setSelectedCategory("all");
                          setSearchQuery("");
                        }}
                        className="mt-3 px-4 py-2 text-xs font-semibold bg-[#1E222B] text-white rounded-[4px] hover:bg-[#2A303C] cursor-pointer"
                      >
                        Reset Category Filter
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-start gap-x-10 gap-y-12">
                      {filteredSpecs.map((spec) => {
                        const scale = getDisplayScale(spec.width);
                        const isExporting = exportingSpecId === spec.id;
                        const isCopied = copiedHtmlSpecId === spec.id;

                        return (
                          <div key={spec.id} className="flex flex-col group">
                            <div className="mb-2.5 flex items-center justify-between gap-4 border-b border-[#222630] pb-2">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="font-semibold text-white">{spec.name}</span>
                                <span className="text-[#6B7280]">·</span>
                                <span className="font-mono-tabular text-[#9CA3AF]">
                                  {spec.width}×{spec.height}
                                </span>
                                <span className="text-[#6B7280]">·</span>
                                <span className="font-mono-tabular text-[11px] text-[#6B7280]">
                                  {spec.aspectRatioLabel}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setFocusedSpecId(spec.id)}
                                  title="Inspect 1:1 Pixel Artboard"
                                  className="px-2 py-1 text-[11px] font-medium text-[#9CA3AF] hover:text-white bg-[#151821] hover:bg-[#1E222B] rounded-[3px] transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                >
                                  <Eye className="w-3 h-3" />
                                  Inspect
                                </button>
                                <button
                                  onClick={() => handleCopyHtml5(spec.id)}
                                  className="px-2 py-1 text-[11px] font-mono-tabular text-[#9CA3AF] hover:text-white bg-[#151821] hover:bg-[#1E222B] rounded-[3px] transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                >
                                  <Code className="w-3 h-3" />
                                  {isCopied ? "Copied" : "HTML5"}
                                </button>
                                {/* PNG Download */}
                                <button
                                  onClick={() => handleDownloadImage(spec.id, "png")}
                                  disabled={isExporting}
                                  title="Download PNG format"
                                  className="px-2 py-1 text-[11px] font-semibold text-white bg-[#1E222B] hover:bg-[#FF4F18] rounded-[3px] transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                >
                                  <Download className="w-3 h-3" />
                                  {isExporting ? "..." : "PNG"}
                                </button>
                                {/* JPG Download */}
                                <button
                                  onClick={() => handleDownloadImage(spec.id, "jpeg")}
                                  disabled={isExporting}
                                  title="Download JPG format"
                                  className="px-2 py-1 text-[11px] font-semibold text-[#E5E7EB] bg-[#1E222B] hover:bg-[#D97706] rounded-[3px] transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                >
                                  <FileImage className="w-3 h-3" />
                                  JPG
                                </button>
                              </div>
                            </div>

                            <div className="p-3 bg-[#13161E] border border-[#222630] rounded-[4px] inline-block">
                              <BannerCanvasRenderer
                                spec={spec}
                                campaign={campaign}
                                displayScale={scale}
                              />
                            </div>

                            <div className="mt-2 text-[11px] text-[#6B7280] flex items-center justify-between">
                              <span>{spec.placementNote}</span>
                              {scale < 1 && (
                                <span className="font-mono-tabular text-[10px] text-[#9CA3AF]">
                                  Scaled {Math.round(scale * 100)}% for canvas
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tab 2: Specification Matrix */}
          {activeTab === "specs" && (
            <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
              <div className="mb-6">
                <h1 className="font-display text-xl font-bold text-white">
                  Specification Matrix
                </h1>
                <p className="text-xs text-[#9CA3AF] mt-1">
                  Dimensional telemetry and export controls for {activeSelectedSpecs.length} currently selected banner sizes.
                </p>
              </div>

              {!campaign ? (
                <div className="py-12 text-center border border-[#222630] rounded-[4px] bg-[#111319] text-xs text-[#9CA3AF]">
                  Generate banner ads from the sidebar to view specification parameters.
                </div>
              ) : filteredSpecs.length === 0 ? (
                <div className="py-12 text-center border border-[#222630] rounded-[4px] bg-[#111319] text-xs text-[#9CA3AF]">
                  No banner sizes selected or matching filters.
                </div>
              ) : (
                <div className="border border-[#222630] rounded-[4px] overflow-x-auto bg-[#111319]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#222630] text-[11px] font-mono-tabular text-[#9CA3AF] bg-[#0B0D11]">
                        <th className="py-3 px-4 font-medium">Placement Name</th>
                        <th className="py-3 px-4 font-medium">IAB Code</th>
                        <th className="py-3 px-4 font-medium text-right">Dimensions (px)</th>
                        <th className="py-3 px-4 font-medium text-right">Aspect Ratio</th>
                        <th className="py-3 px-4 font-medium">Assigned Copy Variant</th>
                        <th className="py-3 px-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222630] text-xs">
                      {filteredSpecs.map((spec) => (
                        <tr
                          key={spec.id}
                          className="hover:bg-[#171A23] transition-colors h-[44px]"
                        >
                          <td className="py-2.5 px-4 font-medium text-white">
                            {spec.name}
                            <span className="block text-[11px] text-[#6B7280] font-normal">
                              {spec.placementNote}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-mono-tabular text-[#9CA3AF]">
                            {spec.code}
                          </td>
                          <td className="py-2.5 px-4 font-mono-tabular text-right text-white">
                            {spec.width} × {spec.height}
                          </td>
                          <td className="py-2.5 px-4 font-mono-tabular text-right text-[#9CA3AF]">
                            {spec.aspectRatioLabel}
                          </td>
                          <td className="py-2.5 px-4 text-[#E5E7EB] max-w-[280px] truncate">
                            {campaign.headlines[spec.headlineKey]}
                          </td>
                          <td className="py-2.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleDownloadImage(spec.id, "png")}
                                className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[#FF4F18] hover:bg-[#E03E0B] rounded-[3px] cursor-pointer"
                              >
                                PNG
                              </button>
                              <button
                                onClick={() => handleDownloadImage(spec.id, "jpeg")}
                                className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[#D97706] hover:bg-[#B45309] rounded-[3px] cursor-pointer"
                              >
                                JPG
                              </button>
                              <button
                                onClick={() => handleDownloadHtmlFile(spec.id)}
                                className="px-2 py-1 text-[11px] font-mono-tabular text-[#E5E7EB] bg-[#1E222B] hover:bg-[#2A303C] rounded-[3px] cursor-pointer"
                              >
                                HTML
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: HTML5 Ad Bundles */}
          {activeTab === "export" && (
            <div className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222630] pb-5">
                <div>
                  <h1 className="font-display text-xl font-bold text-white">
                    HTML5 Ad Bundles
                  </h1>
                  <p className="text-xs text-[#9CA3AF] mt-1">
                    Self-contained HTML5 ad documents with <code className="font-mono-tabular text-white">ad.size</code> meta tags and <code className="font-mono-tabular text-white">window.clickTag</code> support.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBatchExportAll("png")}
                    disabled={!campaign || filteredSpecs.length === 0}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-[#FF4F18] rounded-[4px] hover:bg-[#E03E0B] cursor-pointer whitespace-nowrap disabled:opacity-40"
                  >
                    Download PNG Suite ({campaign ? filteredSpecs.length : 0})
                  </button>
                  <button
                    onClick={() => handleBatchExportAll("jpeg")}
                    disabled={!campaign || filteredSpecs.length === 0}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-[#D97706] rounded-[4px] hover:bg-[#B45309] cursor-pointer whitespace-nowrap disabled:opacity-40"
                  >
                    Download JPG Suite ({campaign ? filteredSpecs.length : 0})
                  </button>
                </div>
              </div>

              {!campaign ? (
                <div className="py-12 text-center border border-[#222630] rounded-[4px] bg-[#111319] text-xs text-[#9CA3AF]">
                  Generate banner ads from the sidebar to inspect and download HTML5 code bundles.
                </div>
              ) : filteredSpecs.length === 0 ? (
                <div className="py-12 text-center border border-[#222630] rounded-[4px] bg-[#111319] text-xs text-[#9CA3AF]">
                  No banner sizes selected or matching filters.
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {filteredSpecs.map((spec) => {
                    const code = generateIabHtml5Bundle(spec, campaign);
                    const isCopied = copiedHtmlSpecId === spec.id;
                    return (
                      <div
                        key={spec.id}
                        className="border border-[#222630] rounded-[4px] bg-[#111319] flex flex-col"
                      >
                        <div className="px-4 py-3 border-b border-[#222630] flex items-center justify-between">
                          <div className="text-xs">
                            <span className="font-semibold text-white">{spec.name}</span>
                            <span className="mx-2 text-[#6B7280]">·</span>
                            <span className="font-mono-tabular text-[#9CA3AF]">
                              {spec.width}×{spec.height}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyHtml5(spec.id)}
                              className="px-2.5 py-1 text-[11px] font-mono-tabular bg-[#1E222B] hover:bg-[#2B303C] text-white rounded-[3px] cursor-pointer"
                            >
                              {isCopied ? "Copied" : "Copy Code"}
                            </button>
                            <button
                              onClick={() => handleDownloadHtmlFile(spec.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-[#FF4F18] hover:bg-[#E03E0B] text-white rounded-[3px] cursor-pointer"
                            >
                              Download .html
                            </button>
                          </div>
                        </div>
                        <pre className="p-4 text-[11px] font-mono-tabular text-[#9CA3AF] overflow-x-auto max-h-56 bg-[#0B0D11]">
                          <code>{code}</code>
                        </pre>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* History Slide-Over Drawer */}
      <HistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectCampaign={handleSelectFromHistory}
        currentCampaignId={campaign?.id}
        refreshKey={historyRefreshKey}
      />

      {/* 1:1 Pixel Inspection Modal */}
      {focusedSpecId && campaign && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
          onClick={() => setFocusedSpecId(null)}
        >
          {(() => {
            const spec = STANDARD_BANNER_SPECS.find((s) => s.id === focusedSpecId);
            if (!spec) return null;
            const modalScale = spec.width > 1000 ? 0.65 : 1;
            return (
              <div
                className="bg-[#111319] border border-[#2D3342] rounded-[6px] max-w-full max-h-full overflow-auto p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-8 pb-4 mb-5 border-b border-[#222630]">
                  <div>
                    <div className="text-sm font-bold text-white">
                      {spec.name} ({spec.width} × {spec.height} px)
                    </div>
                    <div className="text-xs text-[#9CA3AF] mt-0.5">{spec.placementNote}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadImage(spec.id, "png")}
                      className="px-3 py-1.5 text-xs font-semibold bg-[#FF4F18] text-white rounded-[4px] hover:bg-[#E03E0B] cursor-pointer"
                    >
                      Download PNG
                    </button>
                    <button
                      onClick={() => handleDownloadImage(spec.id, "jpeg")}
                      className="px-3 py-1.5 text-xs font-semibold bg-[#D97706] text-white rounded-[4px] hover:bg-[#B45309] cursor-pointer"
                    >
                      Download JPG
                    </button>
                    <button
                      onClick={() => setFocusedSpecId(null)}
                      className="px-3 py-1.5 text-xs font-medium bg-[#1E222B] text-white rounded-[4px] hover:bg-[#2A303C] cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-center bg-[#0B0D11] p-6 border border-[#222630] overflow-auto">
                  <BannerCanvasRenderer
                    spec={spec}
                    campaign={campaign}
                    displayScale={modalScale}
                  />
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
