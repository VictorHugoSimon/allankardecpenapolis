import { randomUUID } from 'node:crypto';

export type CanalSocial = 'FACEBOOK' | 'INSTAGRAM' | 'GOOGLE_BUSINESS' | 'YOUTUBE';
export type StatusIntegracao = 'CONECTADO' | 'ATENCAO' | 'ERRO';

export interface PublicacaoSocial {
  idExterno: string;
  url: string;
  publicadaEm: Date;
}

/** Meta Graph API (Facebook/Instagram), Google Business Profile, YouTube. */
export interface SocialProvider {
  readonly nome: string;
  readonly canal: CanalSocial;
  status(): Promise<{ status: StatusIntegracao; detalhe: string }>;
  /** Só é chamado para conteúdo com status APROVADO/AGENDADO. */
  publicar(
    texto: string,
    opcoes?: { imagemUrl?: string; link?: string },
  ): Promise<PublicacaoSocial>;
}

export function criarMockSocialProvider(
  canal: CanalSocial,
  status: StatusIntegracao = 'CONECTADO',
): SocialProvider {
  return {
    nome: 'mock',
    canal,
    async status() {
      return {
        status,
        detalhe: status === 'CONECTADO' ? 'Integração simulada' : 'Token expirado (simulado)',
      };
    },
    async publicar() {
      if (status !== 'CONECTADO') throw new Error(`${canal}: integração indisponível (${status}).`);
      const id = randomUUID();
      return {
        idExterno: id,
        url: `https://example.invalid/${canal.toLowerCase()}/${id}`,
        publicadaEm: new Date(),
      };
    },
  };
}
