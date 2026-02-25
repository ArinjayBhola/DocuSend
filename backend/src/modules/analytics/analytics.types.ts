export interface DocumentStats {
  totalViews: number;
  uniqueViewers: number;
  avgDuration: number;
  totalDuration: number;
}

export interface PageHeatmapItem {
  pageNumber: number;
  totalTime: number;
  viewCount: number;
}

export interface ViewTimelineItem {
  date: string;
  count: number;
}

export interface DocumentAnalyticsResult {
  document: any;
  stats: DocumentStats;
  viewers: any[];
  pageHeatmap: PageHeatmapItem[];
  viewTimeline: ViewTimelineItem[];
}
