import { NextRequest, NextResponse } from 'next/server';
import { contas, referenciaDoMes } from '@ceak/db';
import { contextoRls, exigirModulo } from '@/lib/auth';
import { gerarCsvContas } from '../exportacao';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Revalida a autorização no servidor: um botão oculto não protege o download.
  const sessao = await exigirModulo('financeiro');
  const tipo = request.nextUrl.searchParams.get('tipo');
  const mes = request.nextUrl.searchParams.get('mes');
  if (tipo !== 'PAGAR' && tipo !== 'RECEBER') {
    return NextResponse.json({ erro: 'Tipo de lançamento inválido.' }, { status: 400 });
  }
  if (mes !== null && !/^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) {
    return NextResponse.json({ erro: 'Mês inválido.' }, { status: 400 });
  }
  const ref = mes === null ? new Date() : referenciaDoMes(mes);
  if (!ref) {
    return NextResponse.json({ erro: 'Mês inválido.' }, { status: 400 });
  }
  const lista = await contas(contextoRls(sessao), tipo, ref);
  const nome = `ceak-${tipo.toLowerCase()}-${mes ?? `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}`}.csv`;
  return new NextResponse(gerarCsvContas(tipo, lista.linhas), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nome}"`,
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
