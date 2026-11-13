import { describe, expect, it } from 'vitest';
import { endpointPushSeguro } from './pushSeguranca';

describe('destinos seguros para Web Push', () => {
  it('aceita provedores oficiais em HTTPS', () => {
    for (const url of [
      'https://fcm.googleapis.com/fcm/send/abc',
      'https://fcm.googleapis.com/wp/abc',
      'https://updates.push.services.mozilla.com/wpush/v2/abc',
      'https://push.services.mozilla.com/wpush/v1/abc',
      'https://web.push.apple.com/QABCD',
      'https://wns2-par02p.notify.windows.com/?token=abc',
    ]) {
      expect(endpointPushSeguro(url)).toBe(true);
    }
  });

  it('bloqueia alvos arbitrários, redes privadas e URLs ambíguas', () => {
    for (const url of [
      'https://127.0.0.1/test',
      'https://localhost/push',
      'https://192.168.1.1/notify',
      'http://fcm.googleapis.com/fcm/send/abc',
      'https://fcm.googleapis.com.evil.example/push',
      'https://evil.example/collect',
      'https://fcm.googleapis.com@evil.example/push',
      'https://usuario:senha@fcm.googleapis.com/push',
      'https://fcm.googleapis.com:8443/push',
      'https://fcm.googleapis.com/push#segredo',
      'https://notify.windows.com.evil.example/notify',
      null,
      undefined,
      123,
    ]) {
      expect(endpointPushSeguro(url)).toBe(false);
    }
  });
});
