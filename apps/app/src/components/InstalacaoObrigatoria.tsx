'use client';

import { useEffect, useState, type ReactNode } from 'react';

interface EventoInstalacao extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

type Plataforma = 'ios' | 'android' | 'desktop';
type Estado = 'verificando' | 'instalado' | 'instalar' | 'aguardando';

function emModoAplicativo() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

/**
 * Portal de instalação para dispositivos móveis.
 * O navegador exige um gesto explícito do usuário para abrir o prompt nativo.
 * Não é possível instalar um PWA silenciosamente nem abrir automaticamente
 * uma instalação existente em todas as plataformas.
 */
export function InstalacaoObrigatoria({ children }: { children: ReactNode }) {
  const [plataforma, setPlataforma] = useState<Plataforma>('desktop');
  const [samsungInternet, setSamsungInternet] = useState(false);
  const [linkChrome, setLinkChrome] = useState('');
  const [linkApp, setLinkApp] = useState('');
  const [estado, setEstado] = useState<Estado>('verificando');
  const [convite, setConvite] = useState<EventoInstalacao | null>(null);
  const [tentouInstalar, setTentouInstalar] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const url = new URL(window.location.href);
    setLinkApp(url.href);
    setLinkChrome(
      `intent://${url.host}${url.pathname}${url.search}#Intent;scheme=${url.protocol.slice(0, -1)};package=com.android.chrome;end`,
    );
    const ios =
      /iPad|iPhone|iPod/i.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const android = /Android/i.test(ua);
    // Samsung Internet pode gerar WebAPK com target SDK antigo e ser bloqueado
    // pelo Play Protect. Evite oferecer seu prompt nativo de instalação.
    setSamsungInternet(android && /SamsungBrowser\//i.test(ua));
    const dispositivo = ios ? 'ios' : android ? 'android' : 'desktop';
    setPlataforma(dispositivo);

    const atualizar = () => {
      // Convites pessoais precisam abrir mesmo no navegador: o token expira
      // em 20 min e não sobrevive ao redirecionamento de instalação.
      // Após ativar a conta, o acesso à área do membro volta a exigir o PWA.
      const ativacao = window.location.pathname === '/ativar-conta';
      // O teste automatizado roda em localhost e precisa percorrer fluxos
      // internos sem instalar um WebAPK. Não funciona em domínios publicados.
      const testeLocal =
        process.env.NEXT_PUBLIC_CEAK_E2E === 'sim' && window.location.hostname === 'localhost';
      setEstado(
        emModoAplicativo() || dispositivo === 'desktop' || ativacao || testeLocal
          ? 'instalado'
          : 'instalar',
      );
    };
    const antesDeInstalar = (e: Event) => {
      e.preventDefault();
      if (android && /SamsungBrowser\//i.test(ua)) return;
      setConvite(e as EventoInstalacao);
      atualizar();
    };
    const instalado = () => {
      setConvite(null);
      setTentouInstalar(true);
      setEstado(emModoAplicativo() ? 'instalado' : 'aguardando');
    };
    const media = window.matchMedia('(display-mode: standalone)');
    window.addEventListener('beforeinstallprompt', antesDeInstalar);
    window.addEventListener('appinstalled', instalado);
    window.addEventListener('pageshow', atualizar);
    media.addEventListener?.('change', atualizar);
    atualizar();
    return () => {
      window.removeEventListener('beforeinstallprompt', antesDeInstalar);
      window.removeEventListener('appinstalled', instalado);
      window.removeEventListener('pageshow', atualizar);
      media.removeEventListener?.('change', atualizar);
    };
  }, []);

  async function instalar() {
    if (!convite) return;
    const evento = convite;
    setConvite(null);
    try {
      await evento.prompt();
      const escolha = await evento.userChoice;
      if (escolha.outcome === 'accepted') {
        setTentouInstalar(true);
        setEstado('aguardando');
      } else {
        setMensagem('Instalação cancelada. Você pode tentar novamente pelo menu do navegador.');
      }
    } catch {
      setMensagem('Não foi possível abrir a instalação. Utilize o menu do Chrome para instalar.');
    }
  }

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(linkApp);
      setCopiado(true);
      setMensagem('');
    } catch {
      setMensagem('Selecione o endereço abaixo, copie e cole no Google Chrome.');
    }
  }

  if (estado === 'verificando') {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#F7F4EE] p-6 text-[#1F2A24]">
        <p role="status">Preparando o CEAK App…</p>
      </main>
    );
  }
  if (estado === 'instalado') return <>{children}</>;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#F7F4EE] px-5 py-10 text-[#1F2A24]">
      <section
        className="w-full max-w-[440px] rounded-3xl border border-[#dce5dd] bg-white p-7 shadow-lg"
        aria-labelledby="instalar-titulo"
      >
        <div
          className="mb-5 flex h-20 w-20 items-center justify-center rounded-[22px] bg-[#2F5D46] font-serif text-3xl font-bold text-white"
          aria-hidden="true"
        >
          AK
        </div>
        <p className="mb-2 text-xs font-semibold tracking-widest text-[#2F5D46] uppercase">
          Centro Espírita Allan Kardec
        </p>
        <h1 id="instalar-titulo" className="mb-3 font-serif text-3xl font-semibold">
          Instale o CEAK App para continuar
        </h1>
        <p className="mb-6 leading-relaxed text-[#4A5B51]">
          O acesso à área do membro pelo celular é feito pelo aplicativo instalado, com ícone na
          tela inicial, agenda, estudos e notificações.
        </p>

        {samsungInternet ? (
          <div className="rounded-xl bg-[#EFF5F0] p-4 text-sm leading-relaxed">
            <p className="mb-3 font-semibold">
              Abra o CEAK no Google Chrome para instalar com segurança.
            </p>
            <p className="mb-4">
              O Samsung Internet pode gerar uma instalação incompatível com as proteções mais
              recentes do Android. Não desative o Play Protect.
            </p>
            <a
              href={linkChrome || '#'}
              className="block w-full rounded-xl bg-[#2F5D46] px-5 py-4 text-center font-semibold text-white"
            >
              Abrir no Google Chrome
            </a>
            <p className="mt-4">
              Se o Chrome não abrir, copie este link, abra o Chrome manualmente e cole na barra de
              endereços:
            </p>
            <p className="mt-2 font-semibold break-all select-all">{linkApp}</p>
            <button
              type="button"
              onClick={copiarLink}
              className="mt-3 rounded-lg border border-[#2F5D46] px-4 py-2 font-semibold text-[#2F5D46]"
            >
              {copiado ? 'Link copiado!' : 'Copiar link'}
            </button>
            <p className="mt-3">
              No Chrome, toque em <strong>Instalar aplicativo</strong> ou use o menu ⋮.
            </p>
          </div>
        ) : tentouInstalar || estado === 'aguardando' ? (
          <div className="rounded-xl bg-[#EFF5F0] p-4 text-sm leading-relaxed">
            Instalação solicitada. Agora abra o ícone <strong>CEAK</strong> na tela inicial ou na
            lista de aplicativos do seu celular.
          </div>
        ) : convite ? (
          <button
            type="button"
            onClick={instalar}
            className="w-full rounded-xl bg-[#2F5D46] px-5 py-4 font-semibold text-white"
          >
            Instalar aplicativo CEAK
          </button>
        ) : plataforma === 'ios' ? (
          <div className="rounded-xl bg-[#EFF5F0] p-4 text-sm leading-relaxed">
            <p className="mb-3 font-semibold">No iPhone ou iPad:</p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Abra este link no <strong>Safari</strong>, caso esteja em outro aplicativo.
              </li>
              <li>
                Toque em <strong>Compartilhar</strong> (ícone de quadrado com seta).
              </li>
              <li>
                Selecione <strong>Adicionar à Tela de Início</strong> e confirme.
              </li>
              <li>
                Abra o ícone <strong>CEAK</strong> na tela inicial.
              </li>
            </ol>
          </div>
        ) : (
          <div className="rounded-xl bg-[#EFF5F0] p-4 text-sm leading-relaxed">
            <p className="mb-3 font-semibold">No Android:</p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Abra este link no <strong>Google Chrome</strong>.
              </li>
              <li>
                Toque no menu <strong>⋮</strong> do navegador.
              </li>
              <li>
                Selecione <strong>Instalar aplicativo</strong> ou{' '}
                <strong>Adicionar à tela inicial</strong>.
              </li>
              <li>
                Abra o ícone <strong>CEAK</strong> instalado.
              </li>
            </ol>
          </div>
        )}
        {mensagem && (
          <p role="alert" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
            {mensagem}
          </p>
        )}
        <p className="mt-5 text-xs leading-relaxed text-[#64776A]">
          Por segurança, nenhum site pode instalar um aplicativo automaticamente sem sua
          confirmação. Ao abrir pelo ícone instalado, esta tela desaparece.
        </p>
      </section>
    </main>
  );
}
