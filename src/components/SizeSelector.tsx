import React from "react";
import { BannerSpec } from "../types/banner";
import { STANDARD_BANNER_SPECS } from "../data/bannerSpecs";
import { Check, CheckSquare, Square } from "lucide-react";

interface SizeSelectorProps {
  selectedSizeIds: string[];
  onChange: (newIds: string[]) => void;
}

export const SizeSelector: React.FC<SizeSelectorProps> = ({
  selectedSizeIds,
  onChange,
}) => {
  const allIds = STANDARD_BANNER_SPECS.map((s) => s.id);
  const isAllSelected = selectedSizeIds.length === allIds.length;
  const isNoneSelected = selectedSizeIds.length === 0;

  const toggleSize = (id: string) => {
    if (selectedSizeIds.includes(id)) {
      onChange(selectedSizeIds.filter((item) => item !== id));
    } else {
      onChange([...selectedSizeIds, id]);
    }
  };

  const selectAll = () => onChange([...allIds]);
  const clearAll = () => onChange([]);

  const selectCategory = (category: BannerSpec["category"]) => {
    const categoryIds = STANDARD_BANNER_SPECS.filter((s) => s.category === category).map(
      (s) => s.id
    );
    const allCategorySelected = categoryIds.every((id) => selectedSizeIds.includes(id));

    if (allCategorySelected) {
      onChange(selectedSizeIds.filter((id) => !categoryIds.includes(id)));
    } else {
      const merged = Array.from(new Set([...selectedSizeIds, ...categoryIds]));
      onChange(merged);
    }
  };

  const categories: { key: BannerSpec["category"]; label: string }[] = [
    { key: "display-rect", label: "Rectangles" },
    { key: "horizontal", label: "Leaderboards" },
    { key: "vertical", label: "Skyscrapers" },
    { key: "social", label: "Social" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#E5E7EB]">
          <span>Target Banner Sizes</span>
          <span className="font-mono-tabular text-[11px] text-[#9CA3AF]">
            ({selectedSizeIds.length}/{allIds.length})
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <button
            type="button"
            onClick={selectAll}
            disabled={isAllSelected}
            className="text-[#9CA3AF] hover:text-white disabled:opacity-30 cursor-pointer transition-colors"
          >
            All
          </button>
          <span className="text-[#363C4A]">·</span>
          <button
            type="button"
            onClick={clearAll}
            disabled={isNoneSelected}
            className="text-[#9CA3AF] hover:text-white disabled:opacity-30 cursor-pointer transition-colors"
          >
            None
          </button>
        </div>
      </div>

      {/* Quick Category Selectors */}
      <div className="grid grid-cols-4 gap-1">
        {categories.map((cat) => {
          const categoryIds = STANDARD_BANNER_SPECS.filter(
            (s) => s.category === cat.key
          ).map((s) => s.id);
          const isCatActive =
            categoryIds.length > 0 &&
            categoryIds.every((id) => selectedSizeIds.includes(id));
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => selectCategory(cat.key)}
              className={`py-1 px-1.5 text-[10px] font-medium rounded-[3px] border transition-colors truncate cursor-pointer ${
                isCatActive
                  ? "bg-[#1E222B] border-[#FF4F18]/50 text-white"
                  : "bg-[#0B0D11] border-[#222630] text-[#9CA3AF] hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Individual Standard Sizes Grid */}
      <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-0.5">
        {STANDARD_BANNER_SPECS.map((spec) => {
          const isChecked = selectedSizeIds.includes(spec.id);
          return (
            <button
              key={spec.id}
              type="button"
              onClick={() => toggleSize(spec.id)}
              className={`p-2 rounded-[4px] border text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                isChecked
                  ? "bg-[#181D26] border-[#FF4F18] text-white shadow-sm"
                  : "bg-[#0B0D11] border-[#222630] text-[#9CA3AF] hover:border-[#363C4A] hover:text-[#D1D5DB]"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="font-mono-tabular text-xs font-semibold tracking-tight text-white truncate">
                  {spec.width}×{spec.height}
                </div>
                <div className="text-[10px] text-[#6B7280] truncate mt-0.5">
                  {spec.name}
                </div>
              </div>
              <div className="shrink-0 text-[#FF4F18]">
                {isChecked ? (
                  <CheckSquare className="w-3.5 h-3.5" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-[#374151]" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedSizeIds.length === 0 && (
        <p className="text-[11px] text-[#F87171] bg-[#F87171]/10 border border-[#F87171]/20 rounded-[4px] p-2">
          Select at least one banner size for generation.
        </p>
      )}
    </div>
  );
};
