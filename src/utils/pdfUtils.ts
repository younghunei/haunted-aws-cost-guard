/**
 * PDF 생성 유틸리티 - 한글 지원 개선
 */

export interface PDFOptions {
  includeKoreanText: boolean;
  useHighQuality: boolean;
  backgroundColor: string;
  scale: number;
}

export const DEFAULT_PDF_OPTIONS: PDFOptions = {
  includeKoreanText: true,
  useHighQuality: true,
  backgroundColor: '#1a1a2e',
  scale: 2
};

/**
 * 한글 텍스트가 포함된 요소를 PDF 친화적으로 준비
 */
export function preparePDFElement(element: HTMLElement): () => void {
  const originalStyles = new Map<HTMLElement, string>();
  
  // 모든 텍스트 요소에 PDF 친화적 스타일 적용
  const textElements = element.querySelectorAll('*');
  textElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    originalStyles.set(htmlEl, htmlEl.style.cssText);
    
    // 한글 폰트 스택 적용
    htmlEl.style.fontFamily = 'Arial, "Malgun Gothic", "맑은 고딕", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
    htmlEl.style.webkitFontSmoothing = 'antialiased';
    htmlEl.style.textRendering = 'optimizeLegibility';
  });
  
  // 복원 함수 반환
  return () => {
    originalStyles.forEach((style, el) => {
      el.style.cssText = style;
    });
  };
}

/**
 * 한글이 포함된 텍스트를 안전하게 처리
 */
export function sanitizeTextForPDF(text: string): string {
  // 이모지와 특수 문자는 유지하되, 문제가 될 수 있는 문자들을 처리
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero-width characters 제거
    .replace(/\s+/g, ' ') // 연속된 공백 정리
    .trim();
}

/**
 * 한글 텍스트 감지
 */
export function containsKorean(text: string): boolean {
  const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
  return koreanRegex.test(text);
}

/**
 * PDF 생성을 위한 최적화된 html2canvas 옵션
 */
export function getOptimizedCanvasOptions(options: Partial<PDFOptions> = {}) {
  const opts = { ...DEFAULT_PDF_OPTIONS, ...options };
  
  return {
    backgroundColor: opts.backgroundColor,
    scale: opts.scale,
    useCORS: true,
    allowTaint: true,
    logging: false,
    foreignObjectRendering: true,
    imageTimeout: 15000,
    removeContainer: true,
    // 한글 텍스트가 있을 때 추가 옵션
    ...(opts.includeKoreanText && {
      letterRendering: true,
      allowTaint: false
    })
  };
}

/**
 * 브라우저의 한글 폰트 지원 확인
 */
export function checkKoreanFontSupport(): boolean {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return false;
  
  // 한글 텍스트로 폰트 지원 테스트
  ctx.font = '16px Arial';
  const arialWidth = ctx.measureText('한글').width;
  
  ctx.font = '16px "Malgun Gothic", Arial';
  const koreanFontWidth = ctx.measureText('한글').width;
  
  return koreanFontWidth !== arialWidth;
}

/**
 * PDF 내보내기 전 요소 검증
 */
export function validateElementForPDF(elementId: string): {
  isValid: boolean;
  element?: HTMLElement;
  error?: string;
} {
  const element = document.getElementById(elementId);
  
  if (!element) {
    return {
      isValid: false,
      error: `Element with ID '${elementId}' not found`
    };
  }
  
  if (element.offsetWidth === 0 || element.offsetHeight === 0) {
    return {
      isValid: false,
      error: 'Element is not visible or has zero dimensions'
    };
  }
  
  return {
    isValid: true,
    element
  };
}