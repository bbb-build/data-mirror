import JSZip from "jszip";
import { ParsedUserData } from "@/lib/types";

export interface ParseProgress {
  stage: string;
  percent: number;
}

export type ProgressCallback = (progress: ParseProgress) => void;

interface FitDay {
  date: string;
  steps: number;
  calories: number;
  distance: number;
  activeMinutes: number;
}

interface PayEntry {
  ts: string;
  amount?: number;
  description: string;
}

interface LocationEntry {
  ts: string;
}

interface RawParsedData {
  watchHistory: { time: string }[];
  searchHistory: { time: string }[];
  chromeHistory: any[];
  searchActivity: any[];
  fitDays: FitDay[];
  payments: PayEntry[];
  locations: LocationEntry[];
}

// ============================================================
// メインエントリポイント
// ============================================================

export async function parseFiles(
  files: File[],
  onProgress?: ProgressCallback
): Promise<ParsedUserData> {
  const zipFile = files.find(f => f.name.toLowerCase().endsWith(".zip"));
  if (zipFile) {
    // ブラウザメモリ上限を考慮（4GB超はクラッシュする）
    if (zipFile.size > 4 * 1024 * 1024 * 1024) {
      throw new Error(
        "ZIPファイルが大きすぎます（4GB超）。Takeoutで写真・動画を除外するか、個別ファイルをアップロードしてください。"
      );
    }
    return parseTakeoutZip(zipFile, onProgress);
  }
  return parseIndividualFiles(files, onProgress);
}

// ============================================================
// ZIPパーサー
// ============================================================

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

  // 複数ファイル検索（Fitness CSVなどディレクトリ内の全ファイル）
  const findFiles = (dirPattern: string, ext: string): JSZip.JSZipObject[] => {
    const results: JSZip.JSZipObject[] = [];
    for (const [path, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;
      if (!path.toLowerCase().includes(dirPattern.toLowerCase())) continue;
      if (!path.toLowerCase().endsWith(ext.toLowerCase())) continue;
      results.push(entry);
    }
    return results;
  };

  onProgress?.({ stage: "YouTube視聴履歴を解析中...", percent: 10 });

  // ========== YouTube視聴履歴（HTML優先 → JSONフォールバック） ==========
  let watchHistory: { time: string }[] = [];

  const watchHtmlFile = findFile([
    "watch-history.html",
    "再生履歴.html",
  ]);
  if (watchHtmlFile) {
    const html = await watchHtmlFile.async("string");
    watchHistory = parseYouTubeWatchHtml(html);
  }

  // HTMLで0件ならJSONフォールバック
  if (watchHistory.length === 0) {
    const watchJsonFile = findFile([
      "watch-history.json",
      "再生履歴.json",
    ]);
    if (watchJsonFile) {
      const content = await watchJsonFile.async("string");
      const parsed = JSON.parse(content);
      watchHistory = Array.isArray(parsed)
        ? parsed.filter((e: any) => e.time).map((e: any) => ({ time: e.time }))
        : [];
    }
  }

  onProgress?.({ stage: "YouTube検索履歴を解析中...", percent: 20 });

  // ========== YouTube検索履歴（HTML優先 → JSONフォールバック） ==========
  let searchHistory: { time: string }[] = [];

  const searchHtmlFile = findFile([
    "search-history.html",
    "検索履歴.html",
  ]);
  if (searchHtmlFile) {
    const html = await searchHtmlFile.async("string");
    searchHistory = parseYouTubeSearchHtml(html);
  }

  if (searchHistory.length === 0) {
    const searchJsonFile = findFile([
      "search-history.json",
      "検索履歴.json",
    ]);
    if (searchJsonFile) {
      const content = await searchJsonFile.async("string");
      const parsed = JSON.parse(content);
      searchHistory = Array.isArray(parsed)
        ? parsed.filter((e: any) => e.time).map((e: any) => ({ time: e.time }))
        : [];
    }
  }

  onProgress?.({ stage: "Chrome履歴を解析中...", percent: 30 });

  // ========== Chrome閲覧履歴 ==========
  const chromeFile = findFile([
    "BrowserHistory.json",
    "ブラウザ履歴.json",
    "ブラウザの履歴.json",
    "履歴.json",
  ]);
  let chromeHistory: any[] = [];
  if (chromeFile) {
    const content = await chromeFile.async("string");
    const parsed = JSON.parse(content);
    chromeHistory = parsed.Browser_History || parsed["Browser History"] || (Array.isArray(parsed) ? parsed : []);
  }

  onProgress?.({ stage: "Google検索履歴を解析中...", percent: 38 });

  // ========== Google検索アクティビティ ==========
  const searchActivityFile = findFile([
    "MyActivity.json",
    "マイアクティビティ.json",
  ]);
  let searchActivity: any[] = [];
  if (searchActivityFile) {
    const content = await searchActivityFile.async("string");
    searchActivity = JSON.parse(content);
  }

  onProgress?.({ stage: "フィットネスデータを解析中...", percent: 45 });

  // ========== Google Fit（日別CSV） ==========
  const fitDays: FitDay[] = [];
  const fitCsvFiles = findFiles("fit", ".csv").filter(f => {
    const name = f.name.split("/").pop() || "";
    return /^\d{4}-\d{2}-\d{2}\.csv$/.test(name);
  });

  for (const csvFile of fitCsvFiles) {
    const name = csvFile.name.split("/").pop() || "";
    const date = name.replace(".csv", "");
    const csv = await csvFile.async("string");
    const day = parseFitCsv(csv, date);
    if (day) fitDays.push(day);
  }

  onProgress?.({ stage: "決済データを解析中...", percent: 55 });

  // ========== Google Pay（CSV） ==========
  const payments: PayEntry[] = [];
  const payFile = findFile([
    "Google での取引",
    "Google transactions",
  ]);
  if (payFile) {
    const csv = await payFile.async("string");
    payments.push(...parsePayCsv(csv));
  }

  onProgress?.({ stage: "位置情報を解析中...", percent: 62 });

  // ========== Location History ==========
  const locations: LocationEntry[] = [];
  const locationFile = findFile(["Records.json"]);
  if (locationFile) {
    const content = await locationFile.async("string");
    locations.push(...parseLocationJson(content));
  }

  // 認識可能なデータが1つも見つからない場合はエラー
  const totalFound = watchHistory.length + searchHistory.length + chromeHistory.length
    + searchActivity.length + fitDays.length + payments.length + locations.length;
  if (totalFound === 0) {
    throw new Error(
      "このファイルからGoogle Takeoutのデータを検出できませんでした。\n" +
      "YouTube視聴履歴（HTML/JSON）、Chrome閲覧履歴、Google検索履歴などが含まれるZIPをアップロードしてください。"
    );
  }

  return aggregateData({
    watchHistory,
    searchHistory,
    chromeHistory,
    searchActivity,
    fitDays,
    payments,
    locations,
  }, onProgress);
}

// ============================================================
// 個別ファイルパーサー
// ============================================================

const FILE_DETECT_PATTERNS: [RegExp, string][] = [
  [/watch-history\.(html|json)|再生履歴\.(html|json)/i, "youtube-watch"],
  [/search-history\.(html|json)|検索履歴\.(html|json)/i, "youtube-search"],
  [/browserhistory\.json|ブラウザ(の)?履歴\.json/i, "chrome"],
  [/myactivity\.json|マイアクティビティ\.json/i, "search-activity"],
  [/^\d{4}-\d{2}-\d{2}\.csv$/i, "fitness"],
  [/^records\.json$/i, "location"],
];

function detectFileType(filename: string): string | null {
  const name = filename.split("/").pop() || filename;
  for (const [pattern, type] of FILE_DETECT_PATTERNS) {
    if (pattern.test(name)) return type;
  }
  if (name.toLowerCase().endsWith(".csv") && /取引|transaction/i.test(name)) return "payments";
  return null;
}

async function parseIndividualFiles(
  files: File[],
  onProgress?: ProgressCallback
): Promise<ParsedUserData> {
  const raw: RawParsedData = {
    watchHistory: [],
    searchHistory: [],
    chromeHistory: [],
    searchActivity: [],
    fitDays: [],
    payments: [],
    locations: [],
  };

  const total = files.length;
  let processed = 0;

  for (const file of files) {
    const type = detectFileType(file.name);
    if (!type) { processed++; continue; }

    const pct = Math.round(5 + (processed / total) * 60);

    switch (type) {
      case "youtube-watch": {
        onProgress?.({ stage: "YouTube視聴履歴を解析中...", percent: pct });
        const content = await file.text();
        if (file.name.toLowerCase().endsWith(".html")) {
          raw.watchHistory = parseYouTubeWatchHtml(content);
        } else {
          const parsed = JSON.parse(content);
          raw.watchHistory = Array.isArray(parsed)
            ? parsed.filter((e: any) => e.time).map((e: any) => ({ time: e.time }))
            : [];
        }
        break;
      }
      case "youtube-search": {
        onProgress?.({ stage: "YouTube検索履歴を解析中...", percent: pct });
        const content = await file.text();
        if (file.name.toLowerCase().endsWith(".html")) {
          raw.searchHistory = parseYouTubeSearchHtml(content);
        } else {
          const parsed = JSON.parse(content);
          raw.searchHistory = Array.isArray(parsed)
            ? parsed.filter((e: any) => e.time).map((e: any) => ({ time: e.time }))
            : [];
        }
        break;
      }
      case "chrome": {
        onProgress?.({ stage: "Chrome履歴を解析中...", percent: pct });
        const content = await file.text();
        const parsed = JSON.parse(content);
        raw.chromeHistory = parsed.Browser_History || parsed["Browser History"] || (Array.isArray(parsed) ? parsed : []);
        break;
      }
      case "search-activity": {
        onProgress?.({ stage: "Google検索を解析中...", percent: pct });
        const content = await file.text();
        raw.searchActivity = JSON.parse(content);
        break;
      }
      case "fitness": {
        onProgress?.({ stage: "フィットネスデータを解析中...", percent: pct });
        const name = file.name.split("/").pop() || "";
        const date = name.replace(".csv", "");
        const content = await file.text();
        const day = parseFitCsv(content, date);
        if (day) raw.fitDays.push(day);
        break;
      }
      case "payments": {
        onProgress?.({ stage: "決済データを解析中...", percent: pct });
        const content = await file.text();
        raw.payments.push(...parsePayCsv(content));
        break;
      }
      case "location": {
        onProgress?.({ stage: "位置情報を解析中...", percent: pct });
        const content = await file.text();
        raw.locations.push(...parseLocationJson(content));
        break;
      }
    }
    processed++;
  }

  // 認識可能なデータが1つも見つからない場合はエラー
  const totalFound = raw.watchHistory.length + raw.searchHistory.length + raw.chromeHistory.length
    + raw.searchActivity.length + raw.fitDays.length + raw.payments.length + raw.locations.length;
  if (totalFound === 0) {
    throw new Error(
      "アップロードされたファイルからデータを検出できませんでした。\n" +
      "Google Takeoutの視聴履歴（HTML/JSON）、Chrome閲覧履歴などのファイルを選択してください。"
    );
  }

  return aggregateData(raw, onProgress);
}

// ============================================================
// 個別データ型パーサー（ZIP・個別ファイル共通）
// ============================================================

function parseFitCsv(csv: string, date: string): FitDay | null {
  const lines = csv.split("\n").slice(1);
  let steps = 0, calories = 0, distance = 0, activeMinutes = 0;
  let hasData = false;

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = line.split(",");
    const s = parseFloat(cols[14]);
    const c = parseFloat(cols[3]);
    const d = parseFloat(cols[4]);
    const a = parseFloat(cols[2]);

    if (!isNaN(s)) { steps += s; hasData = true; }
    if (!isNaN(c)) { calories += c; hasData = true; }
    if (!isNaN(d)) { distance += d; hasData = true; }
    if (!isNaN(a)) { activeMinutes += a; hasData = true; }
  }

  if (!hasData) return null;
  return {
    date,
    steps,
    calories: Math.round(calories),
    distance: Math.round(distance),
    activeMinutes: Math.round(activeMinutes),
  };
}

function parsePayCsv(csv: string): PayEntry[] {
  const payments: PayEntry[] = [];
  const lines = csv.split("\n").slice(1);

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = parseCsvLine(line);
    if (cols.length < 7) continue;

    const [dateStr, , description, , , status, amountStr] = cols;
    if (status === "キャンセル" || status === "Cancelled") continue;

    const jpMatch = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日\s+(\d{1,2}):(\d{2})/);
    let ts: string | null = null;
    if (jpMatch) {
      const [, y, m, d, h, min] = jpMatch;
      ts = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T${h.padStart(2, "0")}:${min.padStart(2, "0")}:00+09:00`;
    } else {
      try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) ts = date.toISOString();
      } catch { /* 日付パース失敗は無視 */ }
    }
    if (!ts) continue;

    const amtMatch = amountStr?.match(/(?:JPY|¥)\s*([\d,]+)/);
    const amount = amtMatch ? parseInt(amtMatch[1].replace(/,/g, ""), 10) : undefined;

    payments.push({ ts, amount, description });
  }

  return payments;
}

function parseLocationJson(content: string): LocationEntry[] {
  const locations: LocationEntry[] = [];
  const data = JSON.parse(content);
  const records: any[] = data.locations || [];

  // 大量データなので1時間ごとにサンプリング
  let lastHour = "";
  for (const loc of records) {
    const ts = loc.timestamp || (loc.timestampMs ? new Date(parseInt(loc.timestampMs)).toISOString() : null);
    if (!ts) continue;

    const hour = ts.slice(0, 13);
    if (hour === lastHour) continue;
    lastHour = hour;

    locations.push({ ts });
  }

  return locations;
}

// ============================================================
// データ集計（共通ロジック）
// ============================================================

function aggregateData(raw: RawParsedData, onProgress?: ProgressCallback): ParsedUserData {
  onProgress?.({ stage: "データを集計中...", percent: 70 });

  const { watchHistory, searchHistory, chromeHistory, searchActivity, fitDays, payments, locations } = raw;

  // ========== ヒートマップ構築 (7x24) ==========
  const heatmap: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));

  const addToHeatmap = (timestamp: string | number) => {
    const date = new Date(typeof timestamp === "number" ? timestamp * 1000 : timestamp);
    if (isNaN(date.getTime())) return;
    heatmap[date.getDay()][date.getHours()]++;
  };

  watchHistory.forEach(entry => { if (entry.time) addToHeatmap(entry.time); });
  chromeHistory.forEach((entry: any) => {
    if (entry.time_usec) {
      addToHeatmap(new Date(entry.time_usec / 1000).toISOString());
    }
  });
  searchActivity.forEach((entry: any) => { if (entry.time) addToHeatmap(entry.time); });
  locations.forEach(loc => addToHeatmap(loc.ts));
  payments.forEach(pay => addToHeatmap(pay.ts));

  // ========== メトリクス算出 ==========
  const totalDataPoints = watchHistory.length + searchHistory.length + chromeHistory.length
    + searchActivity.length + fitDays.length + payments.length + locations.length;

  // ピーク時間帯
  const hourTotals = new Array(24).fill(0);
  for (let h = 0; h < 24; h++) {
    for (let d = 0; d < 7; d++) hourTotals[h] += heatmap[d][h];
  }
  const peakHour = hourTotals.indexOf(Math.max(...hourTotals));

  // 夜行性指数
  const nightActivity = hourTotals.slice(0, 6).reduce((a: number, b: number) => a + b, 0);
  const totalActivity = hourTotals.reduce((a: number, b: number) => a + b, 0);
  const nocturnalIndex = totalActivity > 0 ? Math.round((nightActivity / totalActivity) * 100) : 0;

  // YouTubeアルゴリズム率
  const ytAlgorithmPercent = watchHistory.length > 0
    ? Math.round(((watchHistory.length - searchHistory.length) / watchHistory.length) * 100)
    : 0;
  const algorithmRate = Math.min(100, Math.max(0, Math.round(ytAlgorithmPercent * 0.7 + 50 * 0.3)));

  onProgress?.({ stage: "データ型を判定中...", percent: 82 });

  // ========== データ型の算出 ==========

  // 軸1: 専門型 vs 雑食型（ドメイン多様性）
  const domains = new Set<string>();
  chromeHistory.forEach((entry: any) => {
    try { domains.add(new URL(entry.url).hostname); } catch {}
  });
  const diversityScore = Math.min(100, Math.round((domains.size / Math.max(1, chromeHistory.length)) * 500));

  // 軸2: 昼行型 vs 夜行型
  const nightScore = Math.min(100, nocturnalIndex * 3);

  // 軸3: 体験型 vs 構築型（開発系ドメインの割合）
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

  // 軸4: 受動型 vs 自律型
  const autonomyScore = 100 - algorithmRate;

  // タイプコード生成
  const typeLetters = [
    diversityScore > 50 ? "O" : "S",
    nightScore > 50 ? "N" : "D",
    builderScore > 50 ? "B" : "E",
    autonomyScore > 50 ? "H" : "A",
  ];
  const typeCode = typeLetters.join("-");

  // 全16パターンのタイプ名
  const typeNames: Record<string, string> = {
    "O-N-B-H": "THE ARCHITECT",
    "O-D-B-H": "THE ENGINEER",
    "O-N-E-H": "THE EXPLORER",
    "O-D-E-H": "THE ANALYST",
    "S-N-B-H": "THE SPECIALIST",
    "S-D-B-H": "THE CRAFTSMAN",
    "S-N-E-H": "THE DEEP DIVER",
    "S-D-E-H": "THE CURATOR",
    "O-N-B-A": "THE AUTOMATOR",
    "O-D-B-A": "THE OPTIMIZER",
    "O-N-E-A": "THE DRIFTER",
    "O-D-E-A": "THE ABSORBER",
    "S-N-B-A": "THE OPERATOR",
    "S-D-B-A": "THE MECHANIC",
    "S-N-E-A": "THE CONSUMER",
    "S-D-E-A": "THE PASSENGER",
  };
  const typeName = typeNames[typeCode] || "THE DIGITAL NATIVE";

  onProgress?.({ stage: "データ価値を算出中...", percent: 90 });

  // ========== データ価値の推定 ==========
  const dataMultiplier = Math.max(0.5, Math.min(3.0, totalDataPoints / 50000));
  const locationBonus = locations.length > 0 ? 1.2 : 1.0;
  const paymentBonus = payments.length > 0 ? 1.15 : 1.0;
  const googleValue = Math.round(8500 * dataMultiplier * locationBonus);
  const metaValue = Math.round(3500 * dataMultiplier);
  const amazonValue = Math.round(2300 * dataMultiplier * paymentBonus);
  const totalValue = googleValue + metaValue + amazonValue;

  // ========== アクティブなデータソースの判定 ==========
  const sources: string[] = [];
  if (watchHistory.length > 0) sources.push("YouTube");
  if (searchHistory.length > 0) sources.push("YouTube検索");
  if (chromeHistory.length > 0) sources.push("Chrome");
  if (searchActivity.length > 0) sources.push("Google検索");
  if (fitDays.length > 0) sources.push("フィットネス");
  if (payments.length > 0) sources.push("Google Pay");
  if (locations.length > 0) sources.push("位置情報");
  if (sources.length === 0) sources.push("データなし");

  // ========== カテゴリ分類（ポートレート用） ==========
  const categoryMap: Record<string, { count: number; color: [number, number, number]; angle: number }> = {
    "テック": { count: 0, color: [0.0, 0.9, 1.0], angle: Math.PI * 0.7 },
    "SNS": { count: 0, color: [0.5, 0.3, 1.0], angle: Math.PI * 1.05 },
    "動画": { count: 0, color: [1.0, 0.15, 0.67], angle: 0 },
    "ニュース": { count: 0, color: [1.0, 0.45, 0.85], angle: Math.PI * 0.35 },
    "金融": { count: 0, color: [0.22, 1.0, 0.08], angle: Math.PI * 1.4 },
    "フィットネス": { count: 0, color: [0.1, 0.85, 0.5], angle: Math.PI * 1.55 },
    "決済": { count: 0, color: [1.0, 0.75, 0.0], angle: Math.PI * 1.85 },
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

  // YouTube視聴は「動画」に加算
  categoryMap["動画"].count += watchHistory.length;
  // フィットネスデータ
  categoryMap["フィットネス"].count += fitDays.length;
  // 決済データ
  categoryMap["決済"].count += payments.length;

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
      totalAnnual: 0,
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
          description: locations.length > 0
            ? "検索 / Chrome / YouTube / 位置情報"
            : "検索 / Chrome / YouTube",
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
          description: payments.length > 0
            ? "購買履歴 / Kindle / 決済行動"
            : "購買履歴 / Kindle / 閲覧",
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

// ============================================================
// HTMLパーサー（Google Takeout 2024年以降のHTML形式）
// ============================================================

/**
 * YouTube視聴履歴をHTMLからパース
 */
function parseYouTubeWatchHtml(html: string): { time: string }[] {
  const entries: { time: string }[] = [];

  // 日本語Takeout: "を視聴しました ... YYYY/MM/DD H:MM:SS JST"
  const jpRegex = /<a href="https:\/\/www\.youtube\.com\/watch\?v=[^"]+">(?:[^<]+)<\/a>\s*を視聴しました\s*<br>\s*(?:<a[^>]*>[^<]*<\/a>\s*<br>\s*)?(\d{4}\/\d{2}\/\d{2}\s+\d{1,2}:\d{2}:\d{2})\s*JST/g;

  let match;
  while ((match = jpRegex.exec(html)) !== null) {
    const dateStr = match[1];
    const [datePart, timePart] = dateStr.split(" ");
    const [y, m, d] = datePart.split("/");
    const [h, min, sec] = timePart.split(":");
    entries.push({
      time: `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T${h.padStart(2, "0")}:${min.padStart(2, "0")}:${sec.padStart(2, "0")}+09:00`,
    });
  }

  // 英語Takeoutフォールバック
  if (entries.length === 0) {
    const cellRegex = /<div class="content-cell[^"]*mdl-typography--body-1"[^>]*>([\s\S]*?)<\/div>/g;
    let cellMatch;
    while ((cellMatch = cellRegex.exec(html)) !== null) {
      const cell = cellMatch[1];
      if (!cell.includes("youtube.com/watch?v=")) continue;

      const dateMatch = cell.match(/(\w{3}\s+\d{1,2},\s+\d{4},?\s+\d{1,2}:\d{2}:\d{2}\s*(?:AM|PM)?\s*\w+)/);
      if (dateMatch) {
        try {
          const date = new Date(dateMatch[1]);
          if (!isNaN(date.getTime())) entries.push({ time: date.toISOString() });
        } catch { /* 日付パース失敗は無視 */ }
      }
    }
  }

  return entries;
}

/**
 * YouTube検索履歴をHTMLからパース
 */
function parseYouTubeSearchHtml(html: string): { time: string }[] {
  const entries: { time: string }[] = [];

  const jpRegex = /<a href="https:\/\/www\.youtube\.com\/results\?search_query=[^"]+">(?:[^<]+)<\/a>\s*(?:」\s*)?を検索しました\s*<br>\s*(\d{4}\/\d{2}\/\d{2}\s+\d{1,2}:\d{2}:\d{2})\s*JST/g;

  let match;
  while ((match = jpRegex.exec(html)) !== null) {
    const dateStr = match[1];
    const [datePart, timePart] = dateStr.split(" ");
    const [y, m, d] = datePart.split("/");
    const [h, min, sec] = timePart.split(":");
    entries.push({
      time: `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T${h.padStart(2, "0")}:${min.padStart(2, "0")}:${sec.padStart(2, "0")}+09:00`,
    });
  }

  if (entries.length === 0) {
    const cellRegex = /<div class="content-cell[^"]*mdl-typography--body-1"[^>]*>([\s\S]*?)<\/div>/g;
    let cellMatch;
    while ((cellMatch = cellRegex.exec(html)) !== null) {
      const cell = cellMatch[1];
      if (!cell.includes("youtube.com/results?search_query=")) continue;

      const dateMatch = cell.match(/(\w{3}\s+\d{1,2},\s+\d{4},?\s+\d{1,2}:\d{2}:\d{2}\s*(?:AM|PM)?\s*\w+)/);
      if (dateMatch) {
        try {
          const date = new Date(dateMatch[1]);
          if (!isNaN(date.getTime())) entries.push({ time: date.toISOString() });
        } catch { /* 日付パース失敗は無視 */ }
      }
    }
  }

  return entries;
}

// ============================================================
// ユーティリティ
// ============================================================

/** 簡易CSVパーサー（ダブルクォート対応） */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}
