/**
 * Geração de BR Code PIX estático/dinâmico (padrão EMV® QRCPS-MPM do Banco Central).
 * Usado pelo PaymentProvider mock; o PSP real devolve o próprio BR Code.
 */
function tlv(id: string, value: string): string {
  return id + String(value.length).padStart(2, '0') + value;
}

/** CRC16-CCITT (polinômio 0x1021, inicial 0xFFFF), exigido no campo 63. */
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

export interface BrCodeInput {
  chave: string;
  nomeRecebedor: string;
  cidade: string;
  valorCentavos?: number;
  txid?: string;
  descricao?: string;
}

export function gerarBrCode(i: BrCodeInput): string {
  const conta =
    tlv('00', 'br.gov.bcb.pix') +
    tlv('01', i.chave) +
    (i.descricao ? tlv('02', semAcento(i.descricao).slice(0, 40)) : '');
  const txid = (i.txid ?? '***').replace(/[^A-Za-z0-9*]/g, '').slice(0, 25) || '***';
  let p =
    tlv('00', '01') +
    tlv('26', conta) +
    tlv('52', '0000') +
    tlv('53', '986') +
    (i.valorCentavos ? tlv('54', (i.valorCentavos / 100).toFixed(2)) : '') +
    tlv('58', 'BR') +
    tlv('59', semAcento(i.nomeRecebedor).toUpperCase().slice(0, 25)) +
    tlv('60', semAcento(i.cidade).toUpperCase().slice(0, 15)) +
    tlv('62', tlv('05', txid));
  p += '6304';
  return p + crc16(p);
}
