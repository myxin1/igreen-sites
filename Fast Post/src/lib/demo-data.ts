import type { SocialProvider } from "@/lib/scheduling-engine";

export type ProfileSummary = {
  id: string;
  name: string;
  description: string;
  avatar: string;
  zernioProfileId?: string;
  queueRemaining: number;
  queueDays: number;
  slots: { hour: number; minute: number; active: boolean }[];
  accounts: { provider: SocialProvider; username: string; status: "active" | "expired" | "error"; externalAccountId?: string }[];
};

export const profiles: ProfileSummary[] = [
  {
    id: "profile-low-carb",
    name: "Receitas Low Carb",
    description: "Conteudos diarios de receitas rapidas e saudaveis.",
    avatar: "RL",
    queueRemaining: 10,
    queueDays: 87,
    slots: [
      { hour: 9, minute: 0, active: true },
      { hour: 15, minute: 0, active: true },
      { hour: 20, minute: 0, active: true }
    ],
    accounts: [
      { provider: "instagram", username: "@receitaslowcarb", status: "active" },
      { provider: "facebook", username: "Receitas Low Carb", status: "active" },
      { provider: "tiktok", username: "@lowcarbfast", status: "active" }
    ]
  },
  {
    id: "profile-receitas-dia",
    name: "Receitas do Dia",
    description: "Ideias para cafe, almoco, jantar e sobremesas.",
    avatar: "RD",
    queueRemaining: 42,
    queueDays: 28,
    slots: [
      { hour: 8, minute: 0, active: true },
      { hour: 12, minute: 0, active: true },
      { hour: 18, minute: 0, active: true },
      { hour: 21, minute: 0, active: true }
    ],
    accounts: [
      { provider: "instagram", username: "@receitasdodia", status: "active" },
      { provider: "facebook", username: "Receitas do Dia", status: "expired" },
      { provider: "tiktok", username: "@receitadodia", status: "active" }
    ]
  },
  {
    id: "profile-eu-sou-fla",
    name: "Eu Sou Fla",
    description: "Cortes, bastidores e agenda rubro-negra.",
    avatar: "EF",
    queueRemaining: 126,
    queueDays: 63,
    slots: [
      { hour: 10, minute: 0, active: true },
      { hour: 19, minute: 30, active: true }
    ],
    accounts: [
      { provider: "instagram", username: "@eusoufla", status: "active" },
      { provider: "facebook", username: "Eu Sou Fla", status: "active" },
      { provider: "tiktok", username: "@eusoufla", status: "error" }
    ]
  }
];

export const demoPosts = [
  { id: "551", profile: "Receitas Low Carb", title: "video-01.mp4", status: "scheduled", scheduledAt: "2026-06-04T09:00:00.000Z", networks: ["instagram", "facebook"] },
  { id: "552", profile: "Receitas Low Carb", title: "video-02.mp4", status: "processing", scheduledAt: "2026-06-04T15:00:00.000Z", networks: ["instagram", "facebook"] },
  { id: "553", profile: "Receitas do Dia", title: "almoco-webp.webp", status: "published", scheduledAt: "2026-06-04T18:00:00.000Z", networks: ["instagram", "tiktok"] },
  { id: "554", profile: "Eu Sou Fla", title: "gol-final.mp4", status: "failed", scheduledAt: "2026-06-05T10:00:00.000Z", networks: ["tiktok"] },
  { id: "555", profile: "Receitas Low Carb", title: "video-03.mp4", status: "scheduled", scheduledAt: "2026-06-05T09:00:00.000Z", networks: ["instagram", "facebook"] },
  { id: "556", profile: "Receitas Low Carb", title: "video-04.mp4", status: "scheduled", scheduledAt: "2026-06-05T15:00:00.000Z", networks: ["instagram", "facebook"] }
];

export const logs = [
  { time: "03/06 09:00", type: "post.published", profile: "Receitas Low Carb", message: "Post #551 publicado no Instagram." },
  { time: "03/06 15:00", type: "post.failed", profile: "Eu Sou Fla", message: "Erro TikTok: video acima do limite." },
  { time: "03/06 20:00", type: "upload.completed", profile: "Receitas do Dia", message: "438 midias carregadas." },
  { time: "04/06 08:00", type: "queue.created", profile: "Receitas Low Carb", message: "100 posts criados automaticamente." }
];
