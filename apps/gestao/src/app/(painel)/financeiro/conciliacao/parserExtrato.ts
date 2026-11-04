/** Importação assistida (prévia). Não grava nenhuma transação bancária. */
export interface LinhaImportada {
  data: string;
  descricao: string;
  valorCentavos: number;
  duplicadaNoArquivo: boolean;
}
export interface PreviaExtrato {
  linhas: LinhaImportada[];
  duplicadas: number;
  creditosCentavos: number;
  debitosCentavos: number;
}

function lerCsv(texto: string): string[][] {
  const resultado: string[][] = [];
  let linha: string[] = [];
  let campo = '';
  let aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i]!;
    if (aspas) {
      if (ch === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++; }
        else aspas = false;
      } else campo += ch;
    } else if (ch === '"' && campo.length === 0) aspas = true;
    else if (ch === ';') { linha.push(campo); campo = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && texto[i + 1] === '\n') i++;
      linha.push(campo); campo = '';
      if (linha.some((v) => v.trim() !== '')) resultado.push(linha);
      linha = [];
    } else campo += ch;
  }
  if (aspas) throw new Error('CSV possui aspas não fechadas.');
  linha.push(campo);
  if (linha.some((v) => v.trim() !== '')) resultado.push(linha);
  return resultado;
}

function dataIso(valor: string): string {
  const v = valor.trim();
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(v) ? v :
    br ? `${br[3]}-${br[2]}-${br[1]}` : '';
  if (!iso) throw new Error(`Data inválida: ${v.slice(0, 25)}`);
  const d = new Date(iso + 'T00:00:00.000Z');
  if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== iso)
    throw new Error(`Data inexistente: ${v.slice(0, 25)}`);
  return iso;
}

function valorCentavos(valor: string): number {
  const v = valor.trim().replace(/\s/g, '');
  // Apenas pt-BR: 1.234,56 / -12,34 / 100 (centavos implícitos 00).
  if (!/^-?(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/.test(v)) {
    throw new Error('Valor monetário inválido: use 1234,56 ou -1234,56.');
  }
  const negativo = v.startsWith('-');
  const absoluto = negativo ? v.slice(1) : v;
  const [inteiro, frac = ''] = absoluto.split(',');
  const centavos = Number(inteiro!.replace(/\./g, '')) * 100 +
    Number(frac.padEnd(2, '0'));
  if (!Number.isSafeInteger(centavos) || centavos === 0 || centavos > 100_000_000_000)
    throw new Error('Valor fora do limite permitido.');
  return negativo ? -centavos : centavos;
}

export function prepararPreviaExtrato(conteudo: string): PreviaExtrato {
  const texto = conteudo.replace(/^\uFEFF/, '');
  if (texto.length > 250_000) throw new Error('O extrato excede 250 KB.');
  const linhas = lerCsv(texto);
  if (linhas.length < 2) throw new Error('Informe cabeçalho e pelo menos uma movimentação.');
  if (linhas.length > 1001) throw new Error('Limite de 1.000 movimentações por arquivo.');
  const cabecalho = linhas[0]!.map((v) => v.trim().toLowerCase());
  if (cabecalho.join(';') !== 'data;descricao;valor') {
    throw new Error('Use exatamente as colunas: data;descricao;valor (nesta ordem).');
  }
  const vistos = new Set<string>();
  let duplicadas = 0;
  let creditosCentavos = 0;
  let debitosCentavos = 0;
  const registros: LinhaImportada[] = [];
  for (const [indice, campos] of linhas.slice(1).entries()) {
    if (campos.length !== 3) throw new Error(`Linha ${indice + 2}: esperado 3 colunas.`);
    const data = dataIso(campos[0]!);
    const descricao = campos[1]!.trim();
    if (!descricao || descricao.length > 200 || Array.from(descricao).some((ch) => { const code = ch.charCodeAt(0); return code < 32 && code !== 9 && code !== 10 && code !== 13; }))
      throw new Error(`Linha ${indice + 2}: descrição inválida.`);
    const valor = valorCentavos(campos[2]!);
    const chave = JSON.stringify([data, descricao.normalize('NFC'), valor]);
    const duplicadaNoArquivo = vistos.has(chave);
    vistos.add(chave);
    if (duplicadaNoArquivo) duplicadas++;
    if (valor > 0) creditosCentavos += valor;
    else debitosCentavos -= valor;
    registros.push({ data, descricao, valorCentavos: valor, duplicadaNoArquivo });
  }
  return { linhas: registros, duplicadas, creditosCentavos, debitosCentavos };
}
