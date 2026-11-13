/**
 * Web Push deve alcançar somente serviços push reconhecidos.
 * Impede usar uma inscrição forjada para direcionar requisições do servidor
 * a endpoints arbitrários, redes privadas ou URLs com credenciais.
 */
export function endpointPushSeguro(endpoint: unknown): boolean {
  if (typeof endpoint !== 'string' || endpoint.length > 1000) return false;
  try {
    const url = new URL(endpoint);
    if (
      url.protocol !== 'https:' ||
      url.username !== '' ||
      url.password !== '' ||
      url.port !== '' ||
      url.hash !== ''
    ) {
      return false;
    }
    const host = url.hostname.toLowerCase();
    return (
      host === 'fcm.googleapis.com' ||
      host === 'updates.push.services.mozilla.com' ||
      host === 'push.services.mozilla.com' ||
      host === 'web.push.apple.com' ||
      (host.endsWith('.notify.windows.com') && host !== '.notify.windows.com')
    );
  } catch {
    return false;
  }
}
