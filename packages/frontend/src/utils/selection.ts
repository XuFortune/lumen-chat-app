/**
 * 划词工具函数 - 位置计算、边界检测
 */

export interface RectSize {
  width: number;
  height: number;
}

/**
 * 计算 Toolbar 显示位置（智能边界检测）
 */
export function calculateToolbarPosition(
  selectionRect: DOMRect,
  toolbarSize: RectSize,
  padding = 8
): { x: number; y: number } {
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  // 默认位置：选中文本上方居中
  let x = selectionRect.left + selectionRect.width / 2 - toolbarSize.width / 2;
  let y = selectionRect.top - toolbarSize.height - padding;

  // 边界检测与调整

  // 1. 左边界
  if (x < padding) {
    x = padding;
  }

  // 2. 右边界
  if (x + toolbarSize.width > viewport.width - padding) {
    x = viewport.width - toolbarSize.width - padding;
  }

  // 3. 上边界不足 → 放到下方
  if (y < padding) {
    y = selectionRect.bottom + padding;
  }

  // 4. 下方也不足 → 尝试右侧
  if (y + toolbarSize.height > viewport.height - padding) {
    x = selectionRect.right + padding;
    y = selectionRect.top;

    // 5. 右侧也不足 → 放到左侧
    if (x + toolbarSize.width > viewport.width - padding) {
      x = selectionRect.left - toolbarSize.width - padding;
    }
  }

  // 最终边界检查（确保不超出）
  x = Math.max(padding, Math.min(x, viewport.width - toolbarSize.width - padding));
  y = Math.max(padding, Math.min(y, viewport.height - toolbarSize.height - padding));

  return { x, y };
}

/**
 * 计算浮窗初始显示位置（在 Toolbar 下方或附近）
 */
export function calculatePopupPosition(
  toolbarRect: DOMRect,
  popupSize: RectSize,
  padding = 8
): { x: number; y: number } {
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  // 默认位置：Toolbar 下方左侧对齐
  let x = toolbarRect.left;
  let y = toolbarRect.bottom + padding;

  // 边界检测

  // 1. 右边界
  if (x + popupSize.width > viewport.width - padding) {
    x = viewport.width - popupSize.width - padding;
  }

  // 2. 左边界
  if (x < padding) {
    x = padding;
  }

  // 3. 下边界不足 → 放到上方
  if (y + popupSize.height > viewport.height - padding) {
    y = toolbarRect.top - popupSize.height - padding;
  }

  // 4. 上方也不足 → 垂直居中
  if (y < padding) {
    y = Math.max(padding, (viewport.height - popupSize.height) / 2);
  }

  return { x, y };
}

/**
 * 限制浮窗拖拽位置在视口内
 */
export function clampPosition(
  x: number,
  y: number,
  elementSize: RectSize,
  padding = 8
): { x: number; y: number } {
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  return {
    x: Math.max(padding, Math.min(x, viewport.width - elementSize.width - padding)),
    y: Math.max(padding, Math.min(y, viewport.height - elementSize.height - padding)),
  };
}

/**
 * 检查选中文本是否在指定容器内
 */
export function isSelectionInsideContainer(
  range: Range,
  container: HTMLElement
): boolean {
  return container.contains(range.commonAncestorContainer);
}

/**
 * 检查选中文本是否匹配排除选择器
 */
export function isSelectionInExcludedElements(
  range: Range,
  excludeSelectors: string[]
): boolean {
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
}

/**
 * 验证选中文本长度
 */
export function validateSelectionLength(
  text: string,
  minLength = 2,
  maxLength = 500
): { valid: boolean; reason?: string } {
  const trimmed = text.trim();

  if (trimmed.length < minLength) {
    return { valid: false, reason: 'text_too_short' };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, reason: 'text_too_long' };
  }

  return { valid: true };
}

/**
 * 检测文本中可能包含的敏感信息
 */
export function detectSensitiveInfo(text: string): string[] {
  const sensitive: string[] = [];

  // 邮箱
  if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text)) {
    sensitive.push('email');
  }

  // 手机号（中国大陆）
  if (/\b1[3-9]\d{9}\b/.test(text)) {
    sensitive.push('phone');
  }

  // 身份证号（中国大陆）
  if (/\b\d{17}[\dXx]\b/.test(text)) {
    sensitive.push('id_card');
  }

  // URL 中的参数（可能包含 token）
  if (/[?&](token|api_key|secret|password)=\w+/i.test(text)) {
    sensitive.push('credential');
  }

  return sensitive;
}
