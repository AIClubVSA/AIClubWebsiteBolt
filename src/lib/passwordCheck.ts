const HIBP_API = 'https://api.pwnedpasswords.com/range/';

async function sha1Hex(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-1', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

export interface LeakedPasswordResult {
  leaked: boolean;
  occurrences: number;
}

export async function checkLeakedPassword(password: string): Promise<LeakedPasswordResult> {
  const hash = await sha1Hex(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const res = await fetch(`${HIBP_API}${prefix}`, {
    headers: { 'Add-Padding': 'true' },
  });
  if (!res.ok) {
    throw new Error(`Password check service unavailable (${res.status})`);
  }

  const body = await res.text();
  const lines = body.split('\n');
  for (const line of lines) {
    const [sfx, count] = line.trim().split(':');
    if (sfx === suffix) {
      return { leaked: true, occurrences: Number(count) };
    }
  }
  return { leaked: false, occurrences: 0 };
}
