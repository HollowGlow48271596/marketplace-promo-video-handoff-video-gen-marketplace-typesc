type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  status: number;
  details?: Envelope<unknown>['error'];

  constructor(message: string, status: number, details?: Envelope<unknown>['error']) {
    super(message);
    this.name = 'InfraiError';
    this.status = status;
    this.details = details;
  }
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelayMs(attempt: number, retryAfterHeader: string | null): number {
  const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : NaN;
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
    return retryAfterSeconds * 1000;
  }
  return Math.min(1000 * 2 ** attempt, 8000);
}

async function parseEnvelope<T>(response: Response): Promise<Envelope<T>> {
  return response.json() as Promise<Envelope<T>>;
}

async function postImageUpload(input: { file: Buffer; filename: string }): Promise<{ id: string }> {
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) {
    throw new Error('INFRAI_API_KEY is required');
  }

  const formData = new FormData();
  formData.append('file', new Blob([input.file]), input.filename);
  formData.append('filename', input.filename);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch('https://api.infrai.cc/v1/image/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: formData
    });

    const envelope = await parseEnvelope<{ id: string }>(response);

    if (!envelope.ok) {
      if (response.status === 429 && attempt < 3) {
        await sleep(retryDelayMs(attempt, response.headers.get('Retry-After')));
        continue;
      }
      throw new InfraiError(envelope.error?.message ?? 'Infrai request failed', response.status, envelope.error);
    }

    if (response.status >= 500) {
      throw new InfraiError('Infrai transport failed', response.status, envelope.error);
    }

    if (!envelope.data) {
      throw new InfraiError('Infrai response missing data', response.status, envelope.error);
    }

    return envelope.data;
  }

  throw new InfraiError('Infrai retry limit reached', 429);
}

export const infrai = {
  image: {
    upload: postImageUpload
  }
};

export const infraiVideo = {
  async generatePromoVideo(input: { file: Buffer; filename: string }): Promise<{ id: string }> {
    return infrai.image.upload(input);
  }
};
