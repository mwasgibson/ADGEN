import React, { useState, useEffect } from "react";
import { CampaignData } from "../types/banner";
import { History, Trash2, ArrowRight, Clock } from "lucide-react";

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCampaign: (campaign: CampaignData) => void;
  currentCampaignId?: string;
  refreshKey?: number;
}

const STORAGE_KEY = "adgen_campaign_history_v1";

export function loadCampaignHistory(): CampaignData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCampaignToHistory(campaign: CampaignData): CampaignData[] {
  try {
    const existing = loadCampaignHistory();
    // Prepend or update if existing ID
    const filtered = existing.filter((c) => c.id !== campaign.id);
    const updated = [
      { ...campaign, createdAt: campaign.createdAt || Date.now() },
      ...filtered,
    ].slice(0, 30); // Store up to 30 past designs
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  onSelectCampaign,
  currentCampaignId,
  refreshKey,
}) => {
  const [historyItems, setHistoryItems] = useState<CampaignData[]>([]);

  useEffect(() => {
    setHistoryItems(loadCampaignHistory());
  }, [isOpen, refreshKey]);

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const remaining = historyItems.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
      setHistoryItems(remaining);
    } catch {
      // ignore
    }
  };

  const handleClearAll = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setHistoryItems([]);
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div
        className="w-full max-w-sm h-full bg-[#111319] border-l border-[#222630] flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#222630] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#FF4F18]" />
            <h3 className="font-display text-sm font-bold text-white">
              Generated Ads History
            </h3>
            <span className="font-mono-tabular text-[11px] text-[#9CA3AF]">
              ({historyItems.length})
            </span>
          </div>
          <div className="flex items-center gap-2">
            {historyItems.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-[11px] text-[#9CA3AF] hover:text-[#F87171] transition-colors cursor-pointer"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="px-2 py-1 text-xs text-[#9CA3AF] hover:text-white bg-[#1A1E27] rounded-[4px] cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* List of Designs */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {historyItems.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#9CA3AF] space-y-2">
              <Clock className="w-8 h-8 text-[#363C4A] mx-auto mb-2" />
              <p className="text-white font-medium">No saved ad designs yet.</p>
              <p className="text-[11px] text-[#6B7280]">
                Every time you generate banner ads, they will automatically be saved here so you can revisit them anytime.
              </p>
            </div>
          ) : (
            historyItems.map((item) => {
              const isSelected = item.id === currentCampaignId;
              const dateStr = item.createdAt
                ? new Date(item.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    month: "short",
                    day: "numeric",
                  })
                : "Recent";

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectCampaign(item);
                    onClose();
                  }}
                  className={`p-3 rounded-[5px] border cursor-pointer transition-all group ${
                    isSelected
                      ? "bg-[#1A1E27] border-[#FF4F18]"
                      : "bg-[#0B0D11] border-[#222630] hover:border-[#363C4A] hover:bg-[#141720]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white truncate">
                          {item.productName || item.brandName}
                        </span>
                        <span className="font-mono-tabular text-[10px] text-[#6B7280]">
                          {dateStr}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#9CA3AF] line-clamp-2 mt-1 leading-snug">
                        {item.headlines?.medium || item.productDescription}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteItem(item.id, e)}
                      title="Delete design from history"
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#6B7280] hover:text-[#F87171] transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#1F2430]">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-full border border-white/20"
                        style={{ backgroundColor: item.palette.backgroundHex }}
                      />
                      <span
                        className="w-3 h-3 rounded-full border border-white/20"
                        style={{ backgroundColor: item.palette.accentHex }}
                      />
                      <span className="font-mono-tabular text-[10px] text-[#6B7280] ml-1 truncate max-w-[120px]">
                        {item.displayUrl}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-[#FF4F18] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Restore <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
