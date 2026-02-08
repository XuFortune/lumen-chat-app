/**
 * 划词工具栏组件
 */
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useSelectionContext } from "./SelectionManager";
import { Sparkles, Copy, X } from "lucide-react";

interface SelectionToolbarProps {
  onCopy?: () => void;
}

export function SelectionToolbar({ onCopy }: SelectionToolbarProps) {
  const {
    isToolbarVisible,
    toolbarPosition,
    isExplaining,
    clearSelection,
    openInsightPopup,
  } = useSelectionContext();

  const toolbarRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    if (!isToolbarVisible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        clearSelection();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        clearSelection();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isToolbarVisible, clearSelection]);

  // 复制功能
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.getSelection()?.toString() || "");
      onCopy?.();
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  // 解释功能
  const handleExplain = () => {
    openInsightPopup();
  };

  if (!isToolbarVisible) return null;

  return (
    <div
      ref={toolbarRef}
      style={{
        position: "fixed",
        left: `${toolbarPosition.x}px`,
        top: `${toolbarPosition.y}px`,
        zIndex: 50,
        animation: "fadeInScale 0.15s ease-out",
      }}
    >
      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(4px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
      <div className="flex items-center gap-1 px-1 py-1 bg-popover border border-border rounded-lg shadow-xl">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          onClick={handleExplain}
          disabled={isExplaining}
        >
          <Sparkles className="h-3 w-3 text-primary" />
          解释
        </Button>

        <div className="w-px h-4 bg-border" />

        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          onClick={handleCopy}
        >
          <Copy className="h-3 w-3" />
          复制
        </Button>

        <div className="w-px h-4 bg-border" />

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={clearSelection}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
