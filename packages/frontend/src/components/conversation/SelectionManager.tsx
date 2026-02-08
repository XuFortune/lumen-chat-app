/**
 * 划词功能状态管理 Context
 */
import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import type { SelectionInfo } from "@/hooks/useTextSelection";

// 解释模式
export type ExplainMode = "simple" | "detailed" | "technical" | "example";

// Prompt 模板
export const PROMPT_TEMPLATES: Record<ExplainMode, string> = {
  simple: '用不超过 80 字向初学者解释："{text}"',
  detailed: '详细解释以下概念，包括背景、原理和应用："{text}"',
  technical: '从技术角度深入解释："{text}"，包括实现细节',
  example: '解释"{text}"并给出 3 个实际应用案例',
};

// 划词状态
export interface SelectionState {
  // 当前选中文本信息
  selectedText: string;
  selectedRange: Range | null;
  selectionRect: DOMRect | null;

  // Toolbar 状态
  isToolbarVisible: boolean;
  toolbarPosition: { x: number; y: number };

  // 浮窗状态
  isInsightPopupOpen: boolean;
  popupPosition: { x: number; y: number };
  currentExplanation: string;
  isExplaining: boolean;
  explainError: string | null;
  explainMode: ExplainMode;
}

// 初始状态
const initialState: SelectionState = {
  selectedText: "",
  selectedRange: null,
  selectionRect: null,
  isToolbarVisible: false,
  toolbarPosition: { x: 0, y: 0 },
  isInsightPopupOpen: false,
  popupPosition: { x: 0, y: 0 },
  currentExplanation: "",
  isExplaining: false,
  explainError: null,
  explainMode: "simple",
};

// Context Actions
interface SelectionActions {
  // 选中文本
  selectText: (info: SelectionInfo) => void;
  // 清除选择
  clearSelection: () => void;
  // 打开浮窗
  openInsightPopup: (position?: { x: number; y: number }) => void;
  // 关闭浮窗
  closeInsightPopup: () => void;
  // 开始解释
  startExplain: () => void;
  // 取消解释
  cancelExplain: () => void;
  // 设置解释内容
  setExplanation(content: string | ((prev: string) => string)): void;
  // 重新生成
  regenerateExplanation: () => void;
  // 切换模式
  switchExplainMode: (mode: ExplainMode) => void;
  // 设置错误
  setError: (error: string | null) => void;
}

// Context 类型
interface SelectionContextType extends SelectionState, SelectionActions {}

// 创建 Context
const SelectionContext = createContext<SelectionContextType | null>(null);

// Provider Props
interface SelectionProviderProps {
  children: React.ReactNode;
}

// Provider 组件
export function SelectionProvider({ children }: SelectionProviderProps) {
  const [state, setState] = useState<SelectionState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 选中文本
  const selectText = useCallback((info: SelectionInfo) => {
    setState((prev) => ({
      ...prev,
      selectedText: info.text,
      selectedRange: info.range,
      selectionRect: info.rect,
      isToolbarVisible: true,
      toolbarPosition: info.position,
      // 重置浮窗状态
      isInsightPopupOpen: false,
      currentExplanation: "",
      explainError: null,
    }));
  }, []);

  // 清除选择
  const clearSelection = useCallback(() => {
    // 如果正在解释，不清除
    if (state.isExplaining) return;

    // 清除浏览器的选中状态
    window.getSelection()?.removeAllRanges();

    setState((prev) => ({
      ...prev,
      selectedText: "",
      selectedRange: null,
      selectionRect: null,
      isToolbarVisible: false,
      // 如果浮窗打开，保持浮窗状态
    }));
  }, [state.isExplaining]);

  // 打开浮窗
  const openInsightPopup = useCallback((position?: { x: number; y: number }) => {
    setState((prev) => ({
      ...prev,
      isInsightPopupOpen: true,
      popupPosition: position || prev.toolbarPosition,
      currentExplanation: "",
      explainError: null,
    }));
  }, []);

  // 关闭浮窗
  const closeInsightPopup = useCallback(() => {
    // 取消正在进行的请求
    cancelExplain();

    setState((prev) => ({
      ...prev,
      isInsightPopupOpen: false,
      currentExplanation: "",
      explainError: null,
    }));
  }, []);

  // 开始解释
  const startExplain = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isExplaining: true,
      currentExplanation: "",
      explainError: null,
    }));
  }, []);

  // 取消解释
  const cancelExplain = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setState((prev) => ({ ...prev, isExplaining: false }));
  }, []);

  // 设置解释内容
  const setExplanation = useCallback((content: string | ((prev: string) => string)) => {
    setState((prev) => ({
      ...prev,
      currentExplanation: typeof content === 'function' ? content(prev.currentExplanation) : content,
    }));
  }, []);

  // 重新生成（外部需要调用 startExplain）
  const regenerateExplanation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentExplanation: "",
      explainError: null,
    }));
  }, []);

  // 切换模式
  const switchExplainMode = useCallback((mode: ExplainMode) => {
    setState((prev) => ({
      ...prev,
      explainMode: mode,
      currentExplanation: "",
      explainError: null,
    }));
  }, []);

  // 设置错误
  const setError = useCallback((error: string | null) => {
    setState((prev) => ({
      ...prev,
      explainError: error,
      isExplaining: false,
    }));
  }, []);

  const contextValue: SelectionContextType = {
    ...state,
    selectText,
    clearSelection,
    openInsightPopup,
    closeInsightPopup,
    startExplain,
    cancelExplain,
    setExplanation,
    regenerateExplanation,
    switchExplainMode,
    setError,
  };

  return (
    <SelectionContext.Provider value={contextValue}>
      {children}
    </SelectionContext.Provider>
  );
}

// Hook to use the context
export function useSelectionContext() {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error("useSelectionContext must be used within SelectionProvider");
  }
  return context;
}
