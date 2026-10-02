import { instituicao } from '@ceak/core';
import { type EventoSite } from './dados';
import { SITE_URL } from './urls';

/** Insere JSON-LD (schema.org) de forma segura. */
export function JsonLd({ dados }: { dados: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(dados).replace(/</g, '\\u003c') }}
    />
  );
}

export function organizacaoLd() {
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'PlaceOfWorship'],
    '@id': `${SITE_URL}/#organizacao`,
    name: instituicao.nome,
    alternateName: `${instituicao.sigla} ${instituicao.cidade}`,
    url: SITE_URL,
    email: instituicao.contato.email,
    telephone: instituicao.contato.telefone,
    foundingDate: String(instituicao.fundacao),
    address: {
      '@type': 'PostalAddress',
      addressLocality: instituicao.cidade,
      addressRegion: instituicao.uf,
      addressCountry: 'BR',
      ...(instituicao.endereco.logradouro &&
      !instituicao.endereco.logradouro.includes('a confirmar')
        ? {
            streetAddress: `${instituicao.endereco.logradouro}, ${instituicao.endereco.numero}`,
            postalCode: instituicao.endereco.cep,
          }
        : {}),
    },
    sameAs: [instituicao.redes.facebook, instituicao.redes.instagram].filter(Boolean),
  };
}

export function eventoLd(e: EventoSite) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: e.titulo,
    description: e.descricao,
    startDate: e.inicio.toISOString(),
    ...(e.fim ? { endDate: e.fim.toISOString() } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: e.transmissaoUrl
      ? 'https://schema.org/MixedEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    location: [
      {
        '@type': 'Place',
        name: `${instituicao.nome} — ${e.local}`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: instituicao.cidade,
          addressRegion: instituicao.uf,
          addressCountry: 'BR',
        },
      },
      ...(e.transmissaoUrl ? [{ '@type': 'VirtualLocation', url: e.transmissaoUrl }] : []),
    ],
    organizer: { '@id': `${SITE_URL}/#organizacao` },
    ...(e.tipo === 'PALESTRA' ? { performer: { '@type': 'Person', name: e.quem } } : {}),
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: 0,
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}${e.url}`,
    },
    url: `${SITE_URL}${e.url}`,
  };
}
