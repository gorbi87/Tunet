import { useState, useEffect } from 'react';
import { MOBILE_BREAKPOINT } from '../config/constants';

/** @typedef {import('../types/dashboard').ResponsiveGridResult} ResponsiveGridResult */

export const MIN_GRID_COLUMNS = 1;
export const MAX_GRID_COLUMNS = 5;

export function getMaxGridColumnsForWidth(width) {
  if (width < MOBILE_BREAKPOINT) return 2;
  if (width < 768) return 3;
  if (width < 1024) return 4;
  return MAX_GRID_COLUMNS;
}

export function getAutoGridColumnsForWidth(width) {
  if (width < 420) return 1;
  if (width < 640) return 2;
  if (width < 1100) return 3;
  return 4;
}

export function getEffectiveGridColumnsForWidth(width, gridColumns, dynamicColumns = false) {
  const maxForWidth = getMaxGridColumnsForWidth(width);
  const suggested = getAutoGridColumnsForWidth(width);
  const targetColumns = dynamicColumns ? Math.min(gridColumns, suggested) : gridColumns;
  return Math.max(MIN_GRID_COLUMNS, Math.min(targetColumns, maxForWidth));
}

/**
 * Responsive grid column count, mobile detection & compact-card flag.
 *
 * @param {number} gridColumns – user-chosen max column count
 * @param {boolean} dynamicColumns – if true, auto-adjust columns by width/orientation
 * @returns {ResponsiveGridResult}
 */
export function useResponsiveGrid(gridColumns, dynamicColumns = false) {
  const [gridColCount, setGridColCount] = useState(1);
  const [isCompactCards, setIsCompactCards] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setIsMobile(w < MOBILE_BREAKPOINT);
      setGridColCount(getEffectiveGridColumnsForWidth(w, gridColumns, dynamicColumns));
      setIsCompactCards(w >= 480 && w < 640);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [gridColumns, dynamicColumns]);

  return { gridColCount, isCompactCards, isMobile };
}
