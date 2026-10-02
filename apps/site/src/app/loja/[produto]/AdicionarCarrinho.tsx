'use client';

import { useRouter } from 'next/navigation';
import { useCarrinho, type ItemCarrinho } from '@/components/Carrinho';

export function AdicionarCarrinho({
  item,
  disponivel,
}: {
  item: Omit<ItemCarrinho, 'quantidade'>;
  disponivel: boolean;
}) {
  const { adicionar } = useCarrinho();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={!disponivel}
      onClick={() => {
        adicionar(item);
        router.push('/carrinho');
      }}
      className="rounded-pill bg-green hover:bg-green-dark min-h-12 p-[15px] text-base font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {disponivel ? 'Adicionar ao carrinho' : 'Esgotado'}
    </button>
  );
}
