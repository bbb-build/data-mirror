import { ParsedUserData } from "./types";

export const SAMPLE_DATA: ParsedUserData = {
  totalDataPoints: 162967,
  sources: [
    "YouTube",
    "Chrome",
    "Google検索",
    "Amazon",
    "Kindle",
    "サブスクリプション",
    "位置情報",
  ],

  // 曜日x時間のヒートマップ (7x24) — BBBの実データ
  heatmap: [
    [1439,560,744,1126,1250,782,782,722,470,771,817,554,486,994,1053,1567,3881,2905,2620,1075,790,353,652,877],
    [800,983,966,633,417,529,439,271,296,430,367,282,327,531,838,1602,1037,1857,3050,492,134,1125,291,107],
    [193,748,509,413,338,384,423,444,408,630,671,561,583,808,957,1274,1791,1652,1696,1126,723,487,553,451],
    [361,431,537,429,305,294,310,355,342,619,619,586,515,725,905,1291,1628,1622,1538,842,651,413,516,525],
    [419,418,380,286,278,296,342,268,319,455,514,511,526,738,914,1287,1660,1607,1557,890,668,482,507,443],
    [398,395,342,395,394,404,360,328,352,547,594,463,527,692,856,1098,1512,1425,1444,882,616,515,458,477],
    [512,535,472,428,407,512,533,506,489,746,716,504,508,762,946,1142,1597,1458,1556,1044,678,447,581,580],
  ],

  peakHour: 16,
  nocturnalIndex: 22,
  algorithmRate: 64,

  youtube: {
    totalViews: 10220,
    searchCount: 3250,
    algorithmPercent: 68,
  },

  subscriptions: {
    totalAnnual: 684000,
    count: 14,
    services: [
      "Claude",
      "Supabase",
      "Slack",
      "YouTube Premium",
      "Google One",
    ],
  },

  dataType: {
    code: "O-N-B-H",
    name: "THE ARCHITECT",
    axes: [
      {
        label: ["専門型", "雑食型"],
        value: 72,
        color: "var(--cyan)",
        description: "SF, 科学, アニメ, 音楽, 暗号資産 — 幅広い好奇心",
      },
      {
        label: ["昼行型", "夜行型"],
        value: 65,
        color: "var(--magenta)",
        description: "ピーク16時、深夜22%活動",
      },
      {
        label: ["体験型", "構築型"],
        value: 78,
        color: "var(--green)",
        description: "SaaS/開発ツールに集中投資",
      },
      {
        label: ["受動型", "自律型"],
        value: 61,
        color: "var(--amber)",
        description: "会社経営 + AI活用。YouTube受動消費が足を引く",
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
        annualValue: 22100,
      },
      {
        name: "Meta",
        logo: "M",
        logoColor: "#1877f2",
        description: "Instagram / 閲覧行動",
        annualValue: 9800,
      },
      {
        name: "Amazon",
        logo: "A",
        logoColor: "#ff9900",
        description: "購買履歴 / Kindle / 閲覧",
        annualValue: 6500,
      },
    ],
    totalAnnual: 38400,
    humadReturn: 26880,
  },

  // カテゴリ別閲覧データ (ポートレート用) — Three.jsのfloat色 + ラジアン角度
  categories: [
    { weight: 0.686, color: [1.0, 0.15, 0.67], angle: 0, label: "アダルト" },
    { weight: 0.063, color: [1.0, 0.45, 0.85], angle: Math.PI * 0.35, label: "マンガ/アニメ" },
    { weight: 0.050, color: [0.0, 0.9, 1.0], angle: Math.PI * 0.7, label: "テック" },
    { weight: 0.031, color: [0.5, 0.3, 1.0], angle: Math.PI * 1.05, label: "SNS" },
    { weight: 0.028, color: [0.22, 1.0, 0.08], angle: Math.PI * 1.4, label: "金融" },
    { weight: 0.015, color: [0.0, 0.65, 1.0], angle: Math.PI * 1.7, label: "科学" },
  ],
};
