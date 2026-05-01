// ユーザーのパース済みデータ
export interface ParsedUserData {
  totalDataPoints: number;
  sources: string[];
  // 曜日x時間のヒートマップ (7x24)
  heatmap: number[][];
  // ピーク時間
  peakHour: number;
  // 夜行性指数 (0-100)
  nocturnalIndex: number;
  // アルゴリズム支配率
  algorithmRate: number;
  // YouTube統計
  youtube: {
    totalViews: number;
    searchCount: number;
    algorithmPercent: number;
  };
  // サブスクリプション
  subscriptions: {
    totalAnnual: number;
    count: number;
    services: string[];
  };
  // データ型 (4軸)
  dataType: {
    code: string; // e.g. "O-N-B-H"
    name: string; // e.g. "THE ARCHITECT"
    axes: {
      label: [string, string]; // [left, right] pole names
      value: number; // 0-100
      color: string; // CSS color
      description: string;
    }[];
  };
  // データの価値 (企業別)
  dataValue: {
    companies: {
      name: string;
      logo: string; // single letter
      logoColor: string;
      description: string;
      annualValue: number;
    }[];
    totalAnnual: number;
    humadReturn: number; // 70% of total
  };
  // カテゴリ別閲覧データ (ポートレート用)
  categories: {
    weight: number;
    color: [number, number, number];
    angle: number;
    label: string;
  }[];
}
