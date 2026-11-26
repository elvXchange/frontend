let renewal: Promise<unknown> | undefined;
export function renewSession() {
  renewal ??= api('/auth/refresh', 'POST').finally(() => {
    renewal = undefined;
  });
  return renewal;
}
export async function api<T = unknown>(
  path: string,
  method = 'GET',
  body?: unknown,
  retry = true,
): Promise<T> {
  const form = body instanceof FormData;
  const controller = new AbortController(),
    timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body && !form ? { 'Content-Type': 'application/json' } : {},
      body: body ? (form ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok) {
      if (
        retry &&
        response.status === 401 &&
        response.headers.get('X-Auth-Renew') === '1' &&
        path !== '/auth/refresh'
      ) {
        await renewSession();
        return api<T>(path, method, body, false);
      }
      if (
        response.status === 401 &&
        (path === '/auth/refresh' || response.headers.has('X-Auth-Renew'))
      )
        window.dispatchEvent(new Event('session-ended'));
      throw Object.assign(new Error(data.error || 'Request failed.'), {
        reportBase64:
          typeof data.reportBase64 === 'string' ? data.reportBase64 : undefined,
      });
    }
    return data as T;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError')
      throw new Error(
        'Request timed out. Refresh to check the result before retrying.',
      );
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}
