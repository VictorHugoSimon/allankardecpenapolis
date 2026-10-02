import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Button,
  buttonClasses,
  Chip,
  EmptyState,
  ImagePlaceholder,
  Input,
  Kpi,
  Pill,
  ProgressBar,
  Select,
  StatusPill,
  Stepper,
  SuccessMark,
  Table,
  Tabs,
  Textarea,
  ToastProvider,
  Toggle,
  toneForStatus,
  useToast,
} from '../src';

describe('Button', () => {
  it('é type="button" por padrão e aplica variante', () => {
    render(<Button variant="secondary">Ver agenda</Button>);
    const b = screen.getByRole('button', { name: 'Ver agenda' });
    expect(b).toHaveAttribute('type', 'button');
    expect(b.className).toContain('border-line-3');
    expect(b.className).toContain('whitespace-nowrap');
  });

  it('gera classes para links', () => {
    expect(buttonClasses({ shape: 'rounded' })).toContain('rounded-input');
    expect(buttonClasses()).toContain('rounded-pill');
  });
});

describe('Chip', () => {
  it('anuncia seleção com aria-pressed', async () => {
    const onClick = vi.fn();
    render(
      <Chip selected onClick={onClick}>
        Palestras
      </Chip>,
    );
    const c = screen.getByRole('button', { name: 'Palestras' });
    expect(c).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(c);
    expect(onClick).toHaveBeenCalled();
  });
});

describe('Pill', () => {
  it('mapeia status para tons', () => {
    expect(toneForStatus('Vencido')).toBe('err');
    expect(toneForStatus('Revisão')).toBe('warn');
    expect(toneForStatus('Publicado')).toBe('ok');
    expect(toneForStatus('desconhecido')).toBe('neutral');
    render(<StatusPill status="Pago" />);
    expect(screen.getByText('Pago').className).toContain('bg-pill-ok-bg');
    render(<Pill tone="info">info</Pill>);
    expect(screen.getByText('info').className).toContain('text-pill-info-fg');
  });
});

describe('Kpi', () => {
  it('mostra rótulo, valor e detalhe', () => {
    render(<Kpi label="Pessoas" value="1.284" detail="+38 no mês" trend="positive" />);
    expect(screen.getByText('1.284')).toBeInTheDocument();
    expect(screen.getByText('+38 no mês').className).toContain('text-ok-strong');
  });
});

describe('Table', () => {
  const rows = [
    { id: 'a', nome: 'Sabesp', st: 'Vencido' },
    { id: 'b', nome: 'CPFL Paulista', st: 'Pendente' },
  ];
  const columns = [
    { key: 'nome', header: 'Fornecedor', cell: (r: (typeof rows)[number]) => r.nome },
    {
      key: 'st',
      header: 'Status',
      cell: (r: (typeof rows)[number]) => <StatusPill status={r.st} />,
    },
  ];

  it('renderiza cabeçalhos com scope e legenda acessível', () => {
    render(<Table caption="Contas a pagar" rows={rows} rowKey={(r) => r.id} columns={columns} />);
    expect(screen.getByRole('table', { name: 'Contas a pagar' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Fornecedor' })).toHaveAttribute(
      'scope',
      'col',
    );
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  it('linhas clicáveis são operáveis por teclado', async () => {
    const onRowClick = vi.fn();
    render(
      <Table
        caption="t"
        rows={rows}
        rowKey={(r) => r.id}
        columns={columns}
        onRowClick={onRowClick}
        selectedKey="b"
      />,
    );
    const btn = screen.getByRole('button', { name: 'CPFL Paulista' });
    expect(btn).toHaveAttribute('aria-current', 'true');
    btn.focus();
    await userEvent.keyboard('{Enter}');
    expect(onRowClick).toHaveBeenCalledWith(rows[1], 1);
  });

  it('mostra estado vazio', () => {
    render(<Table caption="t" rows={[]} rowKey={() => ''} columns={columns} />);
    expect(screen.getByText('Nenhum registro encontrado.')).toBeInTheDocument();
  });
});

describe('Tabs', () => {
  it('segue o padrão WAI-ARIA com setas, Home e End', async () => {
    const onChange = vi.fn();
    render(
      <Tabs
        label="Financeiro"
        onChange={onChange}
        items={['Dashboard', 'Contas a pagar', 'Contas a receber'].map((t) => ({
          id: t,
          label: t,
          content: <p>painel {t}</p>,
        }))}
      />,
    );
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('painel Dashboard');
    tabs[0]!.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Contas a pagar' })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('painel Contas a pagar');
    await userEvent.keyboard('{End}');
    expect(onChange).toHaveBeenLastCalledWith('Contas a receber');
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith('Dashboard');
  });
});

describe('Campos de formulário', () => {
  it('associa rótulo, dica e erro', () => {
    render(
      <>
        <Input label="WhatsApp" hint="Com DDD." />
        <Input label="E-mail" error="Informe um e-mail válido." />
        <Select label="Assunto" options={[{ value: 'a', label: 'Estudos' }]} />
        <Textarea label="Mensagem" />
      </>,
    );
    expect(screen.getByLabelText('WhatsApp')).toHaveAccessibleDescription('Com DDD.');
    const email = screen.getByLabelText('E-mail');
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAccessibleDescription('Informe um e-mail válido.');
    expect(screen.getByRole('alert')).toHaveTextContent('Informe um e-mail válido.');
    expect(screen.getByRole('combobox', { name: 'Assunto' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Mensagem' })).toBeInTheDocument();
  });
});

describe('Toggle', () => {
  it('é um switch acessível', async () => {
    const onChange = vi.fn();
    render(
      <Toggle label="Tornar mensal" description="PIX Automático (em breve)" onChange={onChange} />,
    );
    const sw = screen.getByRole('switch', { name: 'Tornar mensal' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'true');
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('Stepper e ProgressBar', () => {
  it('marca a etapa atual', () => {
    render(
      <Stepper
        steps={['Conheça', 'Orientações', 'Solicitação', 'Data', 'Confirmar']}
        current={2}
      />,
    );
    const items = screen.getAllByRole('listitem');
    expect(items[2]).toHaveAttribute('aria-current', 'step');
    expect(items[0]).toHaveTextContent('(concluída)');
  });

  it('expõe valores do progresso', () => {
    render(
      <ProgressBar label="ESDE" value={378} max={500} valueText="378 de 500 peças" showLabel />,
    );
    const pb = screen.getByRole('progressbar', { name: 'ESDE' });
    expect(pb).toHaveAttribute('aria-valuenow', '378');
    expect(pb).toHaveAttribute('aria-valuetext', '378 de 500 peças');
    expect((pb.firstChild as HTMLElement).style.width).toBe('76%');
  });
});

describe('Feedback', () => {
  it('SuccessMark e ImagePlaceholder têm nome acessível', () => {
    render(
      <>
        <SuccessMark label="Check-in realizado" />
        <ImagePlaceholder caption="foto da fachada" />
        <EmptyState title="Nada por aqui" />
      </>,
    );
    expect(screen.getByRole('img', { name: 'Check-in realizado' })).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Imagem provisória: foto da fachada' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Nada por aqui')).toBeInTheDocument();
  });

  it('Toast aparece e some após 2,6 s', async () => {
    vi.useFakeTimers();
    function Disparo() {
      const t = useToast();
      return <button onClick={() => t.show('Aprovado · registro de auditoria criado')}>ok</button>;
    }
    render(
      <ToastProvider>
        <Disparo />
      </ToastProvider>,
    );
    act(() => screen.getByRole('button', { name: 'ok' }).click());
    expect(screen.getByRole('status')).toHaveTextContent('Aprovado · registro de auditoria criado');
    act(() => vi.advanceTimersByTime(2600));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    vi.useRealTimers();
  });
});
