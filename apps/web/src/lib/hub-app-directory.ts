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
  "project:software-blueprint-execution-gateway": { group: "management", icon: "🛡️", vi: "Cổng thực thi", en: "Execution Gateway", keywords: "gateway quyền chữ ký thực thi" },
  "project:software-blueprint-execution-worker": { group: "management", icon: "⚙️", vi: "Bộ máy thực thi", en: "Execution Worker", keywords: "worker nhiệm vụ sửa lỗi CI" },
  "project:software-blueprint-qa-worker": { group: "management", icon: "🔍", vi: "Bộ máy kiểm định", en: "QA Worker", keywords: "qa kiểm thử bằng chứng độc lập" },
  "project:pc-manager-desktop": { group: "management", icon: "🖥️", vi: "Quản lý máy tính", en: "PC Manager", keywords: "desktop pc windows dọn dẹp" },
  "project:bauman-master-ai-system": { group: "education", icon: "🎓", vi: "Học tập Bauman", en: "Bauman Learning", keywords: "master tiếng nga kỹ thuật học" },
  "project:math-bauman": { group: "education", icon: "📐", vi: "Toán Bauman", en: "Bauman Mathematics", keywords: "toán math" },
  "project:ru-life": { group: "education", icon: "🇷🇺", vi: "Hòa nhập Nga", en: "Life in Russia", keywords: "nga russian cuộc sống" },
  "project:growup-mychildren": { group: "education", icon: "🌱", vi: "Phát triển trẻ em", en: "Growing Children", keywords: "con cái học tập trẻ em" },
  "project:ros-1-2": { group: "engineering", icon: "🤖", vi: "Robot ROS", en: "ROS Robotics", keywords: "robot robotics ros" },
  "project:hardware-simulation": { group: "engineering", icon: "🧩", vi: "Mô phỏng phần cứng", en: "Hardware Simulation", keywords: "hardware vi mạch" },
  "project:mpc-pid-system": { group: "engineering", icon: "🎛️", vi: "Điều khiển MPC/PID", en: "MPC/PID Control", keywords: "MPC PID điều khiển tự động hóa" },
  "project:cad-cam-3d": { group: "engineering", icon: "🛠️", vi: "Thiết kế CAD/CAM", en: "CAD/CAM 3D", keywords: "thiết kế 3d cad cam" },
  "project:ecad-design": { group: "engineering", icon: "🧲", vi: "Thiết kế ECAD", en: "ECAD Design", keywords: "điện tử mạch PCB schematic ECAD" },
  "project:cae-simulation": { group: "engineering", icon: "🌐", vi: "Mô phỏng CAE", en: "CAE Simulation", keywords: "mô phỏng kết cấu solver FEA CAE" },
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


/**
 * A tracked operational app is NOT necessarily a constitutionally registered app.
 * The current view never provides release URLs, Quality Gate PASS, or app permissions.
 */
export type GovernanceRegistrationState = "sealed-baseline" | "admitted-registration" | "pending-onboarding";

export interface HubTrackedAppPresentation extends HubAppPresentation {
  readonly registrationState: GovernanceRegistrationState;
  readonly sourceRevision: string | null;
  readonly observedAt: string | null;
  readonly visibility?: string;
  readonly liveCrossRepoVerified?: boolean;
}

function isGovernanceRegistrationState(value: string): value is GovernanceRegistrationState {
  return value === "sealed-baseline" || value === "admitted-registration" || value === "pending-onboarding";
}

export function presentTrackedApps(registry: readonly (GovernedAppIdentity & {
  readonly registrationState: string;
  readonly sourceRevision: string | null;
  readonly observedAt: string | null;
  readonly visibility?: string;
  readonly liveCrossRepoVerified?: boolean;
})[]): readonly HubTrackedAppPresentation[] {
  const projects = new Set<string>();
  const repositories = new Set<string>();
  return Object.freeze(registry.map((entry): HubTrackedAppPresentation => {
    if (projects.has(entry.projectId) || repositories.has(entry.repository)) {
      throw new Error("Duplicate tracked app identity");
    }
    projects.add(entry.projectId);
    repositories.add(entry.repository);
    if (!isGovernanceRegistrationState(entry.registrationState)) {
      throw new Error("Unknown governance registration state");
    }
    const profile = presentation[entry.projectId];
    if (!profile) throw new Error("Unknown tracked app has no curated presentation");
    if (entry.registrationState !== "sealed-baseline" && !/^[a-f0-9]{40}$/.test(entry.sourceRevision ?? "")) {
      throw new Error("Tracked non-baseline app requires observed exact SHA");
    }
    return Object.freeze({
      ...entry, ...profile, registrationState: entry.registrationState,
      sourceRevision: entry.sourceRevision, observedAt: entry.observedAt
    });
  }));
}

export function appSearchKey(input: string): string {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[Đđ]/g, "d")
    .toLocaleLowerCase("vi").trim();
}

export function matchesApp(app: HubAppPresentation, query: string): boolean {
  const search = appSearchKey(query);
  if (!search) return true;
  return appSearchKey([app.vi, app.en, app.repository, app.keywords, groupLabels[app.group].vi].join(" ")).includes(search);
}
