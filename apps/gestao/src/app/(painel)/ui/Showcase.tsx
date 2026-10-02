'use client';

import { useState, type ReactNode } from 'react';
import {
  Button,
  Card,
  categoryColors,
  Chip,
  colors,
  EmptyState,
  ImagePlaceholder,
  Input,
  Kpi,
  LogoMark,
  Pill,
  ProgressBar,
  Select,
  StatusPill,
  Stepper,
  SuccessMark,
  Table,
  Tabs,
  Textarea,
  Toggle,
  ToastProvider,
  useToast,
} from '@ceak/ui';

function Secao({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3.5">
      <h2 id={id} className="m-0 font-serif text-2xl font-medium">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

const pagar = [
  { f: 'Sabesp', d: 'Água e esgoto — set/26', v: '30/09/2026', val: 'R$ 2.800,00', st: 'Vencido' },
  {
    f: 'CPFL Paulista',
    d: 'Energia elétrica — set/26',
    v: '05/10/2026',
    val: 'R$ 862,00',
    st: 'Pendente',
  },
  {
    f: 'Atacadão Penápolis',
    d: 'Alimentos — cestas de outubro',
    v: '08/10/2026',
    val: 'R$ 3.420,00',
    st: 'Aprovado',
  },
  { f: 'FEB Editora', d: 'Livros para a loja', v: '20/09/2026', val: 'R$ 960,20', st: 'Pago' },
  {
    f: 'Limpeza Total ME',
    d: 'Material de limpeza',
    v: '25/09/2026',
    val: 'R$ 214,30',
    st: 'Cancelado',
  },
];

const filtros = [
  'Todos',
  'Palestras',
  'Estudos',
  'Cursos',
  'Eventos',
  'Assistência',
  'Campanhas',
] as const;
const etapas = ['Conheça', 'Orientações', 'Solicitação', 'Data', 'Confirmar'];

function BotaoToast() {
  const toast = useToast();
  return (
    <Button shape="rounded" onClick={() => toast.show('Aprovado · registro de auditoria criado')}>
      Mostrar toast
    </Button>
  );
}

export function Showcase() {
  const [filtro, setFiltro] = useState<string>('Todos');
  const [etapa, setEtapa] = useState(2);
  const [sucesso, setSucesso] = useState(0);
  const [linha, setLinha] = useState<string>();

  return (
    <ToastProvider>
      <div className="flex flex-col gap-10">
        <Secao id="cores" titulo="Cores">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2.5">
            {Object.entries(colors).map(([nome, hex]) => (
              <div
                key={nome}
                className="rounded-card-sm border-line overflow-hidden border bg-white"
              >
                <div className="h-14" style={{ background: hex }} />
                <div className="p-2.5 text-xs">
                  <div className="font-semibold">{nome}</div>
                  <div className="text-muted-2 font-mono">{hex}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoryColors).map(([nome, c]) => (
              <span
                key={nome}
                className="rounded-pill px-3 py-1.5 text-xs font-medium text-white"
                style={{ background: c }}
              >
                {nome}
              </span>
            ))}
          </div>
        </Secao>

        <Secao id="tipografia" titulo="Tipografia">
          <Card className="flex flex-col gap-3">
            <p className="m-0 font-serif text-[clamp(38px,5vw,56px)] leading-[1.06]">
              Newsreader · título do site
            </p>
            <p className="m-0 font-serif text-[34px]">H1 do admin · 34px</p>
            <p className="text-ink-2 m-0 text-lg leading-[1.7]">
              Instrument Sans · texto de leitura com 18px e entrelinha 1,7. Aproximar, acolher,
              informar, ensinar, envolver, permitir ajudar e facilitar ser ajudado.
            </p>
            <p className="label-caps text-green m-0">Rótulo em caixa alta</p>
            <p className="m-0 font-mono text-[13px]">JetBrains Mono · 02/10/2026 10:28:31 INFO</p>
            <div className="flex items-center gap-3">
              <LogoMark />
              <LogoMark size={34} />
              <span className="bg-green-dark inline-flex rounded-full p-1.5">
                <LogoMark size={34} inverted />
              </span>
            </div>
          </Card>
        </Secao>

        <Secao id="botoes" titulo="Button">
          <div className="flex flex-wrap items-center gap-2.5">
            <Button>Conheça o CEAK</Button>
            <Button variant="secondary">Ver agenda</Button>
            <Button variant="ghost">Ver detalhes</Button>
            <Button variant="danger">Rejeitar</Button>
            <Button size="sm">Pequeno</Button>
            <Button size="lg">Grande</Button>
            <Button shape="rounded">Entrar</Button>
            <Button disabled>Desabilitado</Button>
          </div>
        </Secao>

        <Secao id="chips" titulo="Chip">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar agenda">
            {filtros.map((f) => (
              <Chip
                key={f}
                selected={filtro === f}
                onClick={() => setFiltro(f)}
                dotColor={f === 'Todos' ? undefined : categoryColors[f]}
              >
                {f}
              </Chip>
            ))}
          </div>
        </Secao>

        <Secao id="pills" titulo="Pill de status">
          <div className="flex flex-wrap gap-2">
            <Pill tone="ok">ok</Pill>
            <Pill tone="warn">warn</Pill>
            <Pill tone="err">err</Pill>
            <Pill tone="neutral">neutro</Pill>
            <Pill tone="info">info</Pill>
            {[
              'Capturado',
              'Processando',
              'Rascunho IA',
              'Revisão',
              'Aprovado',
              'Agendado',
              'Publicado',
              'Erro',
            ].map((s) => (
              <StatusPill key={s} status={s} />
            ))}
          </div>
        </Secao>

        <Secao id="cards" titulo="Card e KPI">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
            <Kpi label="Pessoas" value="1.284" detail="+38 no mês" trend="positive" />
            <Kpi label="Membros ativos" value="382" detail="+6" trend="positive" />
            <Kpi label="Visitantes no mês" value="214" detail="+12%" trend="positive" />
            <Kpi label="Check-ins" value="1.472" detail="setembro" />
            <Kpi label="Despesas" value="R$ 13.290" valueClassName="text-[#8A5A1E]" />
            <Kpi label="Evasão" value="11%" valueClassName="text-danger" />
          </div>
          <div className="flex flex-wrap gap-4">
            <Card className="flex-[2_1_320px]">
              <h3 className="m-0 mb-2 text-[15px] font-semibold">Card padrão</h3>
              <p className="text-muted m-0 text-sm">Fundo branco, borda line e raio de 16px.</p>
            </Card>
            <Card tone="beige" className="flex-[1_1_220px]">
              <h3 className="m-0 mb-2 text-[15px] font-semibold">Bege</h3>
              <p className="text-muted m-0 text-sm">Seções de destaque.</p>
            </Card>
            <Card tone="dark" className="flex-[1_1_220px]">
              <h3 className="m-0 mb-2 text-[15px] font-semibold">Verde escuro</h3>
              <p className="text-green-on-dark m-0 text-sm">Blocos de contraste.</p>
            </Card>
          </div>
        </Secao>

        <Secao id="tabela" titulo="Table">
          <Table
            caption="Contas a pagar"
            captionVisible
            rows={pagar}
            rowKey={(r) => r.f}
            selectedKey={linha}
            onRowClick={(r) => setLinha(r.f)}
            columns={[
              { key: 'f', header: 'Fornecedor', cell: (r) => r.f },
              { key: 'd', header: 'Descrição', cell: (r) => r.d },
              { key: 'v', header: 'Vencimento', cell: (r) => r.v },
              { key: 'val', header: 'Valor', cell: (r) => r.val, align: 'right' },
              { key: 'st', header: 'Status', cell: (r) => <StatusPill status={r.st} /> },
            ]}
          />
        </Secao>

        <Secao id="abas" titulo="Tabs">
          <Tabs
            label="Abas do financeiro"
            items={['Dashboard', 'Contas a pagar', 'Contas a receber', 'Fluxo de caixa'].map(
              (t) => ({
                id: t,
                label: t,
                content: <p className="text-muted m-0 text-sm">Conteúdo da aba {t}.</p>,
              }),
            )}
          />
          <Tabs
            variant="segmented"
            label="Canal da comunicação"
            items={['Push', 'E-mail', 'WhatsApp'].map((t) => ({ id: t, label: t }))}
          />
        </Secao>

        <Secao id="formularios" titulo="Input, Select, Textarea e Toggle">
          <Card className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-4">
            <Input label="Nome completo" placeholder="Como você gostaria de ser chamado" />
            <Input
              label="WhatsApp"
              placeholder="(18) 99999-9999"
              hint="Usamos apenas para confirmar o atendimento."
            />
            <Input label="E-mail" defaultValue="email-invalido" error="Informe um e-mail válido." />
            <Select
              label="Assunto"
              options={['Informações gerais', 'Estudos', 'Doações', 'Voluntariado', 'Imprensa'].map(
                (v) => ({ value: v, label: v }),
              )}
            />
            <Textarea
              label="Mensagem"
              placeholder="Gostaria de saber se há estacionamento próximo ao salão."
            />
            <div className="flex flex-col gap-1">
              <Toggle label="Tornar mensal" description="PIX Automático (em breve)" />
              <Toggle
                label="Autenticação em dois fatores"
                description="Obrigatória para Administrador, Diretoria e Tesouraria"
                defaultChecked
              />
            </div>
          </Card>
        </Secao>

        <Secao id="progresso" titulo="Stepper e ProgressBar">
          <Card className="flex flex-col gap-6">
            <Stepper steps={etapas} current={etapa} label="Etapas do atendimento" />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setEtapa((e) => Math.max(0, e - 1))}
              >
                Voltar
              </Button>
              <Button size="sm" onClick={() => setEtapa((e) => Math.min(etapas.length - 1, e + 1))}>
                Avançar
              </Button>
            </div>
            <ProgressBar label="Módulo 3 · Os Espíritos" value={78} showLabel />
            <ProgressBar
              label="Campanha do Agasalho"
              value={378}
              max={500}
              showLabel
              valueText="378 de 500 peças"
            />
          </Card>
        </Secao>

        <Secao id="feedback" titulo="SuccessMark, Toast e EmptyState">
          <div className="flex flex-wrap gap-4">
            <Card className="flex flex-[1_1_260px] flex-col items-center gap-4 text-center">
              <SuccessMark key={sucesso} label="Check-in realizado" />
              <div>
                <div className="font-serif text-2xl">Check-in realizado</div>
                <div className="text-muted text-sm">
                  Centro Espírita Allan Kardec · 02/10/2026 · 19:54
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setSucesso((n) => n + 1)}>
                Repetir animação
              </Button>
            </Card>
            <Card className="flex flex-[1_1_260px] flex-col items-start gap-3">
              <p className="text-muted m-0 text-sm">
                Toast escuro no canto inferior direito por 2,6 s.
              </p>
              <BotaoToast />
            </Card>
            <EmptyState
              className="flex-[1_1_260px]"
              title="Nenhuma aprovação pendente"
              description="Quando houver conteúdos, pagamentos ou comunicações aguardando decisão, eles aparecem aqui."
            />
          </div>
        </Secao>

        <Secao id="imagens" titulo="ImagePlaceholder">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            <ImagePlaceholder
              caption="foto da fachada ou do salão do CEAK"
              ratio="5/4"
              radius="hero"
            />
            <ImagePlaceholder caption="foto do produto" ratio="1" badge="Produto doado" />
            <ImagePlaceholder caption="grupo de estudo" />
            <ImagePlaceholder caption="foto" ratio="1" radius="full" style={{ width: 120 }} />
          </div>
        </Secao>
      </div>
    </ToastProvider>
  );
}
