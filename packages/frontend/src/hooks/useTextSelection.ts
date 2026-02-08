/**
 * 划词监听 Hook
 */
import { useState, useCallback, useEffect, useRef } from "react";
import type {
  RectSize,
} from "@/utils/selection";

export interface SelectionInfo {
  text: string;
  range: Range;
  rect: DOMRect;
  position: { x: number; y: number };
}

export interface UseTextSelectionOptions {
  /** 最小字符数 */
  minLength?: number;
  /** 最大字符数 */
  maxLength?: number;
  /** 触发延迟（防误触）ms */
  delay?: number;
  /** 是否启用 */
  enabled?: boolean;
  /** 排除的元素选择器 */
  excludeSelectors?: string[];
  /** Toolbar 尺寸（用于位置计算） */
  toolbarSize?: RectSize;
  /** 选中文本回调 */
  onSelectionChange?: (selection: SelectionInfo | null) => void;
}

export function useTextSelection(options: UseTextSelectionOptions = {}) {
  const {
    minLength = 2,
    maxLength = 500,
    delay = 150,
    enabled = true,
    excludeSelectors = ["input", "textarea", "[contenteditable]", "[data-selection-ignore]"],
    toolbarSize = { width: 150, height: 36 },
    onSelectionChange,
  } = options;

  const [selectionInfo, setSelectionInfo] = useState<SelectionInfo | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isSelectingRef = useRef(false);

  // 动态导入 selection 工具（避免循环依赖）
  const calculateToolbarPosition = useCallback((selectionRect: DOMRect) => {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    const padding = 8;

    let x = selectionRect.left + selectionRect.width / 2 - toolbarSize.width / 2;
    let y = selectionRect.top - toolbarSize.height - padding;

    // 边界检测
    if (x < padding) x = padding;
    if (x + toolbarSize.width > viewport.width - padding) {
      x = viewport.width - toolbarSize.width - padding;
    }
    if (y < padding) {
      y = selectionRect.bottom + padding;
    }
    if (y + toolbarSize.height > viewport.height - padding) {
      x = selectionRect.right + padding;
      y = selectionRect.top;
      if (x + toolbarSize.width > viewport.width - padding) {
        x = selectionRect.left - toolbarSize.width - padding;
      }
    }

    x = Math.max(padding, Math.min(x, viewport.width - toolbarSize.width - padding));
    y = Math.max(padding, Math.min(y, viewport.height - toolbarSize.height - padding));

    return { x, y };
  }, [toolbarSize]);

  const validateSelection = useCallback((text: string): boolean => {
    const trimmed = text.trim();
    if (trimmed.length < minLength || trimmed.length > maxLength) {
      return false;
    }
    return true;
  }, [minLength, maxLength]);

  const isSelectionExcluded = useCallback((range: Range): boolean => {
    if (excludeSelectors.length === 0) return false;

    for (const selector of excludeSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        if (element.contains(range.commonAncestorContainer)) {
          return true;
        }
      }
    }
    return false;
  }, [excludeSelectors]);

  const handleMouseUp = useCallback(() => {
    if (!enabled) return;

    isSelectingRef.current = false;

    // 清除之前的延迟
    clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setSelectionInfo(null);
        onSelectionChange?.(null);
        return;
      }

      const text = selection.toString().trim();

      // 长度检查
      if (!validateSelection(text)) {
        setSelectionInfo(null);
        onSelectionChange?.(null);
        return;
      }

      const range = selection.getRangeAt(0);

      // 排除元素检查
      if (isSelectionExcluded(range)) {
        setSelectionInfo(null);
        onSelectionChange?.(null);
        return;
      }

      // 计算位置
      const rect = range.getBoundingClientRect();
      const position = calculateToolbarPosition(rect);

      const info: SelectionInfo = {
        text,
        range: range.cloneRange(),
        rect,
        position,
      };

      setSelectionInfo(info);
      onSelectionChange?.(info);
    }, delay);
  }, [enabled, validateSelection, isSelectionExcluded, calculateToolbarPosition, delay, onSelectionChange]);

  const handleMouseDown = useCallback(() => {
    isSelectingRef.current = true;
  }, []);

  const handleSelectionChange = useCallback(() => {
    // 如果在选择过程中，不处理
    if (isSelectingRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === "") {
      setSelectionInfo(null);
      onSelectionChange?.(null);
    }
  }, [onSelectionChange]);

  const clearSelection = useCallback(() => {
    window.getSelection()?.removeAllRanges();
    setSelectionInfo(null);
    onSelectionChange?.(null);
  }, [onSelectionChange]);

  // 设置事件监听
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("selectionchange", handleSelectionChange);
      clearTimeout(timeoutRef.current);
    };
  }, [enabled, handleMouseUp, handleMouseDown, handleSelectionChange]);

  return {
    selectionInfo,
    clearSelection,
  };
}
