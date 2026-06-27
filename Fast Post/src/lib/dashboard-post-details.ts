export type DashboardPostStatus = "scheduled" | "processing" | "published" | "failed";

export type DashboardRecentPost = {
  id: string;
  profile: string;
  filename: string;
  scheduledAt: string;
  status: DashboardPostStatus;
  type: "reels" | "story" | "feed" | "shorts";
  batchId: string;
  caption: string;
  publishedUrl?: string;
};

export type DashboardPostDetails = {
  account: string;
  filename: string;
  typeLabel: string;
  scheduledFor: string;
  statusLabel: string;
  statusTone: "success" | "warning" | "danger" | "neutral";
  batchId: string;
  caption: string;
};

const statusLabels: Record<DashboardPostStatus, DashboardPostDetails["statusLabel"]> = {
  scheduled: "Agendado",
  processing: "Processando",
  published: "Publicado",
  failed: "Erro"
};

const statusTones: Record<DashboardPostStatus, DashboardPostDetails["statusTone"]> = {
  scheduled: "warning",
  processing: "neutral",
  published: "success",
  failed: "danger"
};

export function buildPostDetails(post: DashboardRecentPost): DashboardPostDetails {
  return {
    account: post.profile,
    filename: post.filename,
    typeLabel: post.type.toUpperCase(),
    scheduledFor: formatIsoDateTime(post.scheduledAt),
    statusLabel: statusLabels[post.status],
    statusTone: statusTones[post.status],
    batchId: post.batchId,
    caption: post.caption
  };
}

function formatIsoDateTime(value: string) {
  const [datePart, timePart = "00:00:00"] = value.replace("Z", "").split("T");
  const [year, month, day] = datePart.split("-");
  const [hour = "00", minute = "00", second = "00"] = timePart.split(":");

  return `${day}/${month}/${year}, ${hour}:${minute}:${second.slice(0, 2)}`;
}
