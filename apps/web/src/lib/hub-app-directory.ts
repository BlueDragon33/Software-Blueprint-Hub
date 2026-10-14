/**
 * Presentation-only mapping for Constitution-governed repositories.
 * Canonical ProjectProfiles, access, deployments and adoption are NOT derived
 * from this file. Registry identities come from the existing authoritative JSON.
 */
export type HubGroup = "management" | "education" | "engineering" | "utilities";

export interface GovernedAppIdentity {
  readonly projectId: string;
  readonly repository: string;
  readonly branch: string;
  readonly blueprintLevel: string;
}

export interface HubAppPresentation extends GovernedAppIdentity {
  readonly group: HubGroup;
  readonly icon: string;
  readonly vi: string;
  readonly en: string;
  readonly keywords: string;
}

const presentation: Readonly<Record<string, Pick<HubAppPresentation, "group" | "icon" | "vi" | "en" | "keywords">>> = {
  "project:blueprint-os": { group: "management", icon: "🧭", vi: "Trung tâm Blueprint", en: "Blueprint OS Hub", keywords: "hiến pháp hub quản trị" },
  "project:application-management": { group: "management", icon: "🗂️", vi: "Quản lý ứng dụng", en: "Application Management", keywords: "app hồ sơ visa vận hành" },
  "project:pc-manager-desktop": { group: "management", icon: "🖥️", vi: "Quản lý máy tính", en: "PC Manager", keywords: "desktop pc windows dọn dẹp" },
  "project:bauman-master-ai-system": { group: "education", icon: "🎓", vi: "Học tập Bauman", en: "Bauman Learning", keywords: "master tiếng nga kỹ thuật học" },
  "project:math-bauman": { group: "education", icon: "📐", vi: "Toán Bauman", en: "Bauman Mathematics", keywords: "toán math" },
  "project:ru-life": { group: "education", icon: "🇷🇺", vi: "Hòa nhập Nga", en: "Life in Russia", keywords: "nga russian cuộc sống" },
  "project:growup-mychildren": { group: "education", icon: "🌱", vi: "Phát triển trẻ em", en: "Growing Children", keywords: "con cái học tập trẻ em" },
  "project:ros-1-2": { group: "engineering", icon: "🤖", vi: "Robot ROS", en: "ROS Robotics", keywords: "robot robotics ros" },
  "project:hardware-simulation": { group: "engineering", icon: "🧩", vi: "Mô phỏng phần cứng", en: "Hardware Simulation", keywords: "hardware vi mạch" },
  "project:mpc-pid-system": { group: "engineering", icon: "🎛️", vi: "Điều khiển MPC/PID", en: "MPC/PID Control", keywords: "điều khiển tự động hóa" },
  "project:cad-cam-3d": { group: "engineering", icon: "🛠️", vi: "Thiết kế CAD/CAM", en: "CAD/CAM 3D", keywords: "thiết kế 3d cad cam" },
  "project:nc03-modem": { group: "engineering", icon: "📡", vi: "Modem NC03", en: "NC03 Modem", keywords: "mạng kết nối modem" },
  "project:boiech-ai": { group: "utilities", icon: "🏊", vi: "Trợ lý bơi ếch AI", en: "BOIECH AI", keywords: "boiech bơi bơi ếch" },
  "project:health-care": { group: "utilities", icon: "🩺", vi: "Chăm sóc sức khỏe", en: "Health Care", keywords: "health y tế" },
  "project:pricereport-tunggiabao": { group: "utilities", icon: "📊", vi: "Báo cáo giá", en: "Price Reports", keywords: "giá báo cáo thương mại" }
};

export const groupLabels: Readonly<Record<HubGroup, { vi: string; en: string; icon: string }>> = {
  management: { vi: "Quản trị & vận hành", en: "Management & operations", icon: "⚙️" },
  education: { vi: "Học tập & phát triển", en: "Education & growth", icon: "📚" },
  engineering: { vi: "Kỹ thuật & nghiên cứu", en: "Engineering & research", icon: "🔧" },
  utilities: { vi: "Tiện ích & cuộc sống", en: "Utilities & life", icon: "✨" }
};

export const groupOrder: readonly HubGroup[] = ["management", "education", "engineering", "utilities"];

export function presentGovernedApps(registry: readonly GovernedAppIdentity[]): readonly HubAppPresentation[] {
  const seen = new Set<string>();
  return Object.freeze(registry.map((entry) => {
    if (seen.has(entry.projectId)) throw new Error("Duplicate governed app identity");
    seen.add(entry.projectId);
    const profile = presentation[entry.projectId];
    if (!profile) throw new Error("Unknown governed app has no curated presentation");
    return Object.freeze({ ...entry, ...profile });
  }));
}

export function appSearchKey(input: string): string {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d")
    .toLocaleLowerCase("vi").trim();
}

export function matchesApp(app: HubAppPresentation, query: string): boolean {
  const search = appSearchKey(query);
  if (!search) return true;
  return appSearchKey([app.vi, app.en, app.repository, app.keywords, groupLabels[app.group].vi].join(" ")).includes(search);
}
