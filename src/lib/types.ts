export interface FileItem {
  key: string;
  size: number;
  lastModified: string;
}

export interface PreviewState {
  key: string;
  content: string;
  loading: boolean;
  error: string | null;
}

export interface Banner {
  type: "success" | "error";
  text: string;
}

export interface UploadProgress {
  filename: string;
  percent: number;
  current: number;
  total: number;
}

export type ViewMode = "explorer" | "grouped";

export class UnauthorizedError extends Error {
  constructor() {
    super("Session expired or unauthorized.");
    this.name = "UnauthorizedError";
  }
}

