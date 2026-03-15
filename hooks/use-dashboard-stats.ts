import { useState, useEffect, useCallback } from 'react';
import {
  getCategorySummary,
  getTotalForDateRange,
} from '../db/repository';
import {
  getDateRangeForFilter,
  getDaysInRange,
} from '../utils/date-helpers';
import type { DashboardStats, DateFilter, DateRange } from '../types';

export function useDashboardStats(
  filter: DateFilter,
  customRange?: DateRange
) {
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    daily_average: 0,
    top_category: null,
    category_breakdown: [],
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      let start: string;
      let end: string;

      if (filter === 'custom' && customRange) {
        start = customRange.start;
        end = customRange.end;
      } else if (filter !== 'custom') {
        const range = getDateRangeForFilter(filter);
        start = range.start;
        end = range.end;
      } else {
        return;
      }

      const [total, breakdown] = await Promise.all([
        getTotalForDateRange(start, end),
        getCategorySummary(start, end),
      ]);

      const days = getDaysInRange(start, end);
      const dailyAvg = days > 0 ? total / days : 0;
      const topCategory = breakdown.length > 0 ? breakdown[0] : null;

      setStats({
        total,
        daily_average: dailyAvg,
        top_category: topCategory,
        category_breakdown: breakdown,
      });
    } finally {
      setLoading(false);
    }
  }, [filter, customRange?.start, customRange?.end]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, loading, refresh };
}
