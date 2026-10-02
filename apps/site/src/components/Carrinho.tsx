'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export interface ItemCarrinho {
  produtoId: string;
  slug: string;
  nome: string;
  estado: string;
  precoCentavos: number;
  quantidade: number;
}

interface CarrinhoCtx {
  itens: ItemCarrinho[];
  pronto: boolean;
  quantidadeTotal: number;
  subtotalCentavos: number;
  adicionar: (item: Omit<ItemCarrinho, 'quantidade'>, quantidade?: number) => void;
  alterar: (produtoId: string, delta: number) => void;
  remover: (produtoId: string) => void;
  limpar: () => void;
}

const Ctx = createContext<CarrinhoCtx | null>(null);
const CHAVE = 'ceak.carrinho.v1';

/**
 * Carrinho guardado no navegador. Preço e estoque são exibidos só como referência:
 * o checkout recalcula tudo no servidor.
 */
export function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE) ?? '[]') as ItemCarrinho[];
      if (Array.isArray(salvo)) setItens(salvo.filter((i) => i && i.produtoId && i.quantidade > 0));
    } catch {
      // armazenamento indisponível ou corrompido: começa vazio
    }
    setPronto(true);
  }, []);

  useEffect(() => {
    if (!pronto) return;
    try {
      localStorage.setItem(CHAVE, JSON.stringify(itens));
    } catch {
      // modo privado: segue só em memória
    }
  }, [itens, pronto]);

  const adicionar = useCallback<CarrinhoCtx['adicionar']>((item, quantidade = 1) => {
    setItens((atual) => {
      const ex = atual.find((i) => i.produtoId === item.produtoId);
      if (ex)
        return atual.map((i) =>
          i.produtoId === item.produtoId
            ? { ...i, quantidade: Math.min(20, i.quantidade + quantidade) }
            : i,
        );
      return [...atual, { ...item, quantidade }];
    });
  }, []);

  const alterar = useCallback((produtoId: string, delta: number) => {
    setItens((atual) =>
      atual.map((i) =>
        i.produtoId === produtoId
          ? { ...i, quantidade: Math.max(1, Math.min(20, i.quantidade + delta)) }
          : i,
      ),
    );
  }, []);

  const remover = useCallback(
    (produtoId: string) => setItens((a) => a.filter((i) => i.produtoId !== produtoId)),
    [],
  );
  const limpar = useCallback(() => setItens([]), []);

  const valor = useMemo<CarrinhoCtx>(
    () => ({
      itens,
      pronto,
      quantidadeTotal: itens.reduce((s, i) => s + i.quantidade, 0),
      subtotalCentavos: itens.reduce((s, i) => s + i.precoCentavos * i.quantidade, 0),
      adicionar,
      alterar,
      remover,
      limpar,
    }),
    [itens, pronto, adicionar, alterar, remover, limpar],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useCarrinho(): CarrinhoCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCarrinho precisa de <CarrinhoProvider>.');
  return c;
}
