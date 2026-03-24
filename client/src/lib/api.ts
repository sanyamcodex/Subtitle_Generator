export type SubtitleSegment = {
  index: number;
  start: number;
  end: number;
  text: string;
};

export type Project = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  video_filename: string | null;
  video_path: string | null;
  subtitle_path?: string;
  subtitle_segments?: SubtitleSegment[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...opts.headers,
    },
    ...opts,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  return (await res.json()) as T;
}

export async function createProject(title: string): Promise<Project> {
  return request<Project>("/projects", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export async function listProjects(): Promise<Project[]> {
  return request<Project[]>("/projects");
}

export async function getProject(projectId: string): Promise<Project> {
  return request<Project>(`/projects/${projectId}`);
}

export async function generateSubtitles(projectId: string): Promise<{ message: string; project_id:string; subtitle_path:string; download_url:string; subtitle_segments: SubtitleSegment[]; }> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/generate-subtitles`, {
    method: 'POST',
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Generate subtitles error ${res.status}: ${body}`);
  }

  return res.json();
}

export function getSubtitleDownloadUrl(projectId: string): string {
  return `${API_BASE}/projects/${projectId}/subtitle-file`;
}

export function getBurnedVideoDownloadUrl(projectId: string): string {
  return `${API_BASE}/projects/${projectId}/burned-video-file`;
}

export async function fetchSubtitleText(projectId: string): Promise<string> {
  const res = await fetch(getSubtitleDownloadUrl(projectId));
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Fetch subtitle text error ${res.status}: ${body}`);
  }
  return res.text();
}

export async function burnSubtitlesIntoVideo(projectId: string, subtitleText?: string): Promise<{ message: string; project_id: string; burned_video_path: string; download_url: string; }> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/burn-subtitles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subtitle_text: subtitleText ?? null }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Burn subtitles error ${res.status}: ${body}`);
  }

  return res.json();
}

export async function updateSubtitleText(projectId: string, subtitleText: string): Promise<{ message: string; project_id: string; subtitle_path: string; download_url: string; }> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/subtitle-update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subtitle_text: subtitleText }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Update subtitle text error ${res.status}: ${body}`);
  }

  return res.json();
}

export async function uploadVideo(projectId: string, file: File): Promise<{ message: string; project_id: string; filename: string; saved_path: string; }> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}/projects/${projectId}/upload`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Upload error ${res.status}: ${body}`);
  }

  return res.json();
}
