import JSZip from "jszip";
import { ParsedUserData } from "@/lib/types";

export interface ParseProgress {
  stage: string;
  percent: number;
}

export type ProgressCallback = (progress: ParseProgress) => void;

export async function parseTakeoutZip(
  file: File,
  onProgress?: ProgressCallback
): Promise<ParsedUserData> {
  onProgress?.({ stage: "ZIPを展開中...", percent: 5 });

  const zip = await JSZip.loadAsync(file);

  // ファイル検索（ネストされたTakeout/プレフィックスやロケール違いに対応）
  const findFile = (patterns: string[]): JSZip.JSZipObject | null => {
    for (const pattern of patterns) {
      for (const [path, entry] of Object.entries(zip.files)) {
        if (path.toLowerCase().includes(pattern.toLowerCase()) && !entry.dir) {
          return entry;
        }
      }
    }
    return null;
  };

  onProgress?.({ stage: "YouTube視聴履歴を解析中...", percent: 15 });

  // YouTube視聴履歴
  const watchHistoryFile = findFile([
    "watch-history.json",
    "再生履歴.json",
  ]);
  let watchHistory: any[] = [];
  if (watchHistoryFile) {
    const content = await watchHistoryFile.async("string");
    watchHistory = JSON.parse(content);
  }

  onProgress?.({ stage: "YouTube検索履歴を解析中...", percent: 30 });

  // YouTube検索履歴
  const searchHistoryFile = findFile([
    "search-history.json",
    "検索履歴.json",
  ]);
  let searchHistory: any[] = [];
  if (searchHistoryFile) {
    const content = await searchHistoryFile.async("string");
    searchHistory = JSON.parse(content);
  }

  onProgress?.({ stage: "Chrome履歴を解析中...", percent: 45 });

  // Chrome閲覧履歴
  const chromeFile = findFile([
    "BrowserHistory.json",
    "ブラウザ履歴.json",
  ]);
  let chromeHistory: any[] = [];
  if (chromeFile) {
    const content = await chromeFile.async("string");
    const parsed = JSON.parse(content);
    chromeHistory = parsed.Browser_History || parsed["Browser History"] || parsed || [];
  }

  onProgress?.({ stage: "Google検索履歴を解析中...", percent: 55 });

  // Google検索アクティビティ
  const searchActivityFile = findFile([
    "MyActivity.json",
    "マイアクティビティ.json",
  ]);
  let searchActivity: any[] = [];
  if (searchActivityFile) {
    const content = await searchActivityFile.async("string");
    searchActivity = JSON.parse(content);
  }

  onProgress?.({ stage: "データを集計中...", percent: 70 });

  // === ヒートマップ構築 (7x24) ===
  const heatmap: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));

  const addToHeatmap = (timestamp: string | number) => {
    const date = new Date(typeof timestamp === "number" ? timestamp * 1000 : timestamp);
    if (isNaN(date.getTime())) return;
    const day = date.getDay(); // 0=日, 1=月, ...
    const hour = date.getHours();
    heatmap[day][hour]++;
  };

  // YouTube視聴タイムスタンプ
  watchHistory.forEach((entry: any) => {
    if (entry.time) addToHeatmap(entry.time);
  });

  // Chrome履歴タイムスタンプ
  chromeHistory.forEach((entry: any) => {
    if (entry.time_usec) {
      // Chromeはマイクロ秒（エポックからの経過）を使用
      addToHeatmap(new Date(entry.time_usec / 1000).toISOString());
    }
  });

  // 検索アクティビティタイムスタンプ
  searchActivity.forEach((entry: any) => {
    if (entry.time) addToHeatmap(entry.time);
  });

  // === 各種メトリクス算出 ===
  const totalDataPoints = watchHistory.length + searchHistory.length + chromeHistory.length + searchActivity.length;

  // ピーク時間帯
  const hourTotals = new Array(24).fill(0);
  for (let h = 0; h < 24; h++) {
    for (let d = 0; d < 7; d++) hourTotals[h] += heatmap[d][h];
  }
  const peakHour = hourTotals.indexOf(Math.max(...hourTotals));

  // 夜行性指数: 0-6時のアクティビティ / 全体
  const nightActivity = hourTotals.slice(0, 6).reduce((a, b) => a + b, 0);
  const totalActivity = hourTotals.reduce((a, b) => a + b, 0);
  const nocturnalIndex = totalActivity > 0 ? Math.round((nightActivity / totalActivity) * 100) : 0;

  // YouTubeアルゴリズム率
  const ytAlgorithmPercent = watchHistory.length > 0
    ? Math.round(((watchHistory.length - searchHistory.length) / watchHistory.length) * 100)
    : 0;

  // 総合アルゴリズム率（簡略: YouTube重み * 0.7 + サブスク想定 * 0.3）
  const algorithmRate = Math.min(100, Math.max(0, Math.round(ytAlgorithmPercent * 0.7 + 50 * 0.3)));

  onProgress?.({ stage: "データ型を判定中...", percent: 85 });

  // === データ型の算出 ===
  // 軸1: 専門型 vs 雑食型（Chromeのドメイン多様性に基づく）
  const domains = new Set<string>();
  chromeHistory.forEach((entry: any) => {
    try {
      const url = new URL(entry.url);
      domains.add(url.hostname);
    } catch {}
  });
  const diversityScore = Math.min(100, Math.round((domains.size / Math.max(1, chromeHistory.length)) * 500));

  // 軸2: 昼行型 vs 夜行型
  const nightScore = Math.min(100, nocturnalIndex * 3);

  // 軸3: 体験型 vs 構築型（開発系ドメインの割合で近似）
  const devDomains = ["github.com", "stackoverflow.com", "npmjs.com", "vercel.com", "supabase.com", "developer.mozilla.org"];
  let devCount = 0;
  chromeHistory.forEach((entry: any) => {
    try {
      const url = new URL(entry.url);
      if (devDomains.some(d => url.hostname.includes(d))) devCount++;
    } catch {}
  });
  const builderScore = chromeHistory.length > 0
    ? Math.min(100, Math.round((devCount / chromeHistory.length) * 500))
    : 50;

  // 軸4: 受動型 vs 自律型（アルゴリズム率の逆数）
  const autonomyScore = 100 - algorithmRate;

  // スコアからタイプコードを生成
  const typeLetters = [
    diversityScore > 50 ? "O" : "S",   // Omnivore vs Specialist
    nightScore > 50 ? "N" : "D",       // Night vs Day
    builderScore > 50 ? "B" : "E",     // Builder vs Explorer
    autonomyScore > 50 ? "H" : "A",    // Human vs Algorithm
  ];
  const typeCode = typeLetters.join("-");

  // タイプ名のルックアップ（簡略版）
  const typeNames: Record<string, string> = {
    "O-N-B-H": "THE ARCHITECT",
    "O-D-B-H": "THE ENGINEER",
    "O-N-E-H": "THE EXPLORER",
    "O-D-E-H": "THE ANALYST",
    "S-N-B-H": "THE SPECIALIST",
    "S-D-B-H": "THE CRAFTSMAN",
    "O-N-B-A": "THE AUTOMATOR",
    "S-N-E-A": "THE CONSUMER",
  };
  const typeName = typeNames[typeCode] || "THE DIGITAL NATIVE";

  onProgress?.({ stage: "データ価値を算出中...", percent: 95 });

  // === データ価値の推定 ===
  // Google ARPU（日本）≈ $60/年をデータ量で調整
  const dataMultiplier = Math.max(0.5, Math.min(3.0, totalDataPoints / 50000));
  const googleValue = Math.round(8500 * dataMultiplier);
  const metaValue = Math.round(3500 * dataMultiplier);
  const amazonValue = Math.round(2300 * dataMultiplier);
  const totalValue = googleValue + metaValue + amazonValue;

  // === アクティブなデータソースの判定 ===
  const sources: string[] = [];
  if (watchHistory.length > 0) sources.push("YouTube");
  if (searchHistory.length > 0) sources.push("YouTube検索");
  if (chromeHistory.length > 0) sources.push("Chrome");
  if (searchActivity.length > 0) sources.push("Google検索");
  if (sources.length === 0) sources.push("データなし");

  // === ポートレート用カテゴリ（Chrome閲覧ドメインから分類） ===
  const categoryMap: Record<string, { count: number; color: [number, number, number]; angle: number }> = {
    "テック": { count: 0, color: [0.0, 0.9, 1.0], angle: Math.PI * 0.7 },
    "SNS": { count: 0, color: [0.5, 0.3, 1.0], angle: Math.PI * 1.05 },
    "動画": { count: 0, color: [1.0, 0.15, 0.67], angle: 0 },
    "ニュース": { count: 0, color: [1.0, 0.45, 0.85], angle: Math.PI * 0.35 },
    "金融": { count: 0, color: [0.22, 1.0, 0.08], angle: Math.PI * 1.4 },
    "その他": { count: 0, color: [0.0, 0.65, 1.0], angle: Math.PI * 1.7 },
  };

  const domainCategories: Record<string, string> = {
    "youtube.com": "動画", "youtu.be": "動画", "netflix.com": "動画", "twitch.tv": "動画",
    "twitter.com": "SNS", "x.com": "SNS", "facebook.com": "SNS", "instagram.com": "SNS", "reddit.com": "SNS",
    "github.com": "テック", "stackoverflow.com": "テック", "npmjs.com": "テック", "vercel.com": "テック",
    "news.ycombinator.com": "ニュース", "nikkei.com": "ニュース", "nhk.or.jp": "ニュース",
    "coindesk.com": "金融", "coingecko.com": "金融", "tradingview.com": "金融",
  };

  chromeHistory.forEach((entry: any) => {
    try {
      const hostname = new URL(entry.url).hostname.replace("www.", "");
      const category = Object.entries(domainCategories).find(([domain]) => hostname.includes(domain));
      if (category) {
        categoryMap[category[1]].count++;
      } else {
        categoryMap["その他"].count++;
      }
    } catch {}
  });

  // YouTube視聴履歴は「動画」カテゴリに加算
  categoryMap["動画"].count += watchHistory.length;

  const totalCategoryCount = Object.values(categoryMap).reduce((a, b) => a + b.count, 0) || 1;
  const categories = Object.entries(categoryMap)
    .filter(([, v]) => v.count > 0)
    .map(([label, v]) => ({
      weight: v.count / totalCategoryCount,
      color: v.color as [number, number, number],
      angle: v.angle,
      label,
    }))
    .sort((a, b) => b.weight - a.weight);

  onProgress?.({ stage: "完了", percent: 100 });

  return {
    totalDataPoints: Math.max(totalDataPoints, 1),
    sources,
    heatmap,
    peakHour,
    nocturnalIndex,
    algorithmRate,
    youtube: {
      totalViews: watchHistory.length,
      searchCount: searchHistory.length,
      algorithmPercent: ytAlgorithmPercent,
    },
    subscriptions: {
      totalAnnual: 0, // Takeoutからは判定不可
      count: 0,
      services: [],
    },
    dataType: {
      code: typeCode,
      name: typeName,
      axes: [
        {
          label: ["専門型", "雑食型"],
          value: diversityScore,
          color: "var(--cyan)",
          description: `${domains.size}種類のドメインを閲覧`,
        },
        {
          label: ["昼行型", "夜行型"],
          value: nightScore,
          color: "var(--magenta)",
          description: `ピーク${peakHour}時、深夜${nocturnalIndex}%活動`,
        },
        {
          label: ["体験型", "構築型"],
          value: builderScore,
          color: "var(--green)",
          description: `開発関連サイトが全体の${chromeHistory.length > 0 ? Math.round((devCount / chromeHistory.length) * 100) : 0}%`,
        },
        {
          label: ["受動型", "自律型"],
          value: autonomyScore,
          color: "var(--amber)",
          description: `アルゴリズム依存度${algorithmRate}%`,
        },
      ],
    },
    dataValue: {
      companies: [
        {
          name: "Google",
          logo: "G",
          logoColor: "#4285f4",
          description: "検索 / Chrome / YouTube / 位置情報",
          annualValue: googleValue,
        },
        {
          name: "Meta",
          logo: "M",
          logoColor: "#1877f2",
          description: "Instagram / 閲覧行動",
          annualValue: metaValue,
        },
        {
          name: "Amazon",
          logo: "A",
          logoColor: "#ff9900",
          description: "購買履歴 / Kindle / 閲覧",
          annualValue: amazonValue,
        },
      ],
      totalAnnual: totalValue,
      humadReturn: Math.round(totalValue * 0.7),
    },
    categories: categories.length > 0 ? categories : [
      { weight: 1.0, color: [0.0, 0.9, 1.0] as [number, number, number], angle: 0, label: "データ" },
    ],
  };
}
