/** Exportação CSV em português, protegida contra injeção de fórmulas no Excel. */
export interface LinhaFinanceiraCsv {
  contraparte: string;
  descricao: string;
  categoria: string;
  centroCusto: string;
  vencimento: string;
  valorCentavos: number;
  rotulo: string;
  responsavel: string;
}

function celula(valor: string | number): string {
  // Excel pode executar fórmulas quando células começam com =, +, -, @,
  // ou quando caracteres de controle precedem esses símbolos.
  let texto = String(valor).replaceAll('\0', '');
  let inicio = 0;
  while (inicio < texto.length && (/\s/u.test(texto[inicio]!) || texto.charCodeAt(inicio) < 32))
    inicio++;
  const primeiro = texto[inicio];
  if (primeiro && '=+@-'.includes(primeiro)) texto = "'" + texto;
  return '"' + texto.replace(/"/g, '""') + '"';
}

export function gerarCsvContas(tipo: 'PAGAR' | 'RECEBER', linhas: LinhaFinanceiraCsv[]): string {
  const cabecalho = [
    tipo === 'PAGAR' ? 'Fornecedor' : 'Origem',
    'Descrição',
    'Categoria',
    'Centro de custo',
    'Vencimento',
    'Valor (R$)',
    'Status',
    'Responsável',
  ];
  const registros = linhas.map((l) => [
    l.contraparte,
    l.descricao,
    l.categoria,
    l.centroCusto,
    l.vencimento,
    (l.valorCentavos / 100).toFixed(2).replace('.', ','),
    l.rotulo,
    l.responsavel,
  ]);
  return (
    '\uFEFF' + [cabecalho, ...registros].map((r) => r.map(celula).join(';')).join('\r\n') + '\r\n'
  );
}
