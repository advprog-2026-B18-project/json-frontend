export type ApiErrorBody = {
  message?: string;
  errors?: Array<{ field?: string; message?: string }>;
};

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

function getBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_AUTH;
  if (!baseUrl) {
    throw new Error('Konfigurasi API auth belum tersedia.');
  }

  return baseUrl;
}

async function tryReadJson(response: Response): Promise<unknown | null> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!res.ok) {
    const body = await tryReadJson(res);
    const maybeBody = body as ApiErrorBody | null;
    const message = maybeBody?.message ?? `Request gagal (HTTP ${res.status}).`;
    throw new ApiError(res.status, message, body);
  }

  const body = await tryReadJson(res);
  return body as T;
}
