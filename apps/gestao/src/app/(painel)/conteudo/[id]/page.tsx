import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { formatarData, formatarHora } from '@ceak/core/format';
import { podeAprovarConteudo } from '@ceak/core/rbac';
import { conteudoParaEditor } from '@ceak/db';
import { Trilha } from '@/components/Pagina';
import { exigirModulo } from '@/lib/auth';
import { SITE_URL } from '@/lib/servidor';
import { Editor } from './Editor';

export const metadata: Metadata = { title: 'Editor de conteúdo' };
export const dynamic = 'force-dynamic';

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await exigirModulo('conteudo');
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const c = await conteudoParaEditor(id);
  if (!c) notFound();
  const nota =
    c.status === 'PUBLICADO'
      ? `Publicado em ${c.canais
          .filter((x) => x.publicadoEm)
          .map((x) => (x.rotulo === 'Google Business' ? 'Google' : x.rotulo))
          .join(', ')}${
          c.canais.some((x) => x.erro)
            ? ` · ${c.canais
                .filter((x) => x.erro)
                .map((x) => x.rotulo)
                .join(', ')} na fila (token)`
            : ''
        }`
      : c.status === 'AGENDADO' && c.agendadoPara
        ? `Agendado para ${formatarData(c.agendadoPara).slice(0, 5)} ${formatarHora(c.agendadoPara)}`
        : c.status === 'APROVADO' && c.decisao
          ? `Aprovado por ${c.decisao.por}${c.decisao.em ? ` · ${formatarData(c.decisao.em).slice(0, 5)} ${formatarHora(c.decisao.em)}` : ''}`
          : c.status === 'REJEITADO'
            ? 'Devolvido ao autor com comentários'
            : c.status === 'REVISAO' || c.status === 'RASCUNHO_IA'
              ? 'Aguardando aprovação de um responsável'
              : c.status === 'ERRO'
                ? (c.erro ?? 'Falha na publicação')
                : 'Rascunho em preparação';
  return (
    <div className="flex flex-col gap-4">
      <Trilha itens={[{ href: '/conteudo', texto: 'Conteúdo' }, { texto: 'Editor' }]} />
      <Editor
        conteudo={{
          id: c.id,
          titulo: c.titulo,
          status: c.status,
          statusLabel: c.statusLabel,
          tom: c.tom,
          geradoPorIa: c.geradoPorIa,
          textoOriginal: c.textoOriginal,
          origem: c.origem,
          resumo: c.resumo,
          seoTitulo: c.seoTitulo,
          seoDescricao: c.seoDescricao,
          slug: c.slug,
          tags: c.tags,
          imagemUrl: c.imagemUrl,
          fontes: c.fontes,
          canais: c.canais.map((x) => ({
            canal: x.canal,
            rotulo: x.rotulo,
            texto: x.texto,
            erro: x.erro,
          })),
        }}
        nota={nota}
        podeAprovar={podeAprovarConteudo(s.perfil)}
        urlBlog={c.status === 'PUBLICADO' && c.slug ? `${SITE_URL}/blog/${c.slug}` : null}
      />
    </div>
  );
}
