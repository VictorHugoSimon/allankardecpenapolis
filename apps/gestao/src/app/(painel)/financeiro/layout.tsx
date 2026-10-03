import { exigirModulo } from '@/lib/auth';
import { AbasFinanceiro } from './Abas';

export default async function FinanceiroLayout({ children }: { children: React.ReactNode }) {
  await exigirModulo('financeiro');
  return (
    <div className="flex flex-col gap-[18px]">
      <h1 className="m-0 font-serif text-[34px] font-medium">Financeiro</h1>
      <AbasFinanceiro />
      {children}
    </div>
  );
}
