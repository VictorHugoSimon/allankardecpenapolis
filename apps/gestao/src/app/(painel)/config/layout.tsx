import { exigirModulo } from '@/lib/auth';
import { AbasConfig } from './Abas';

export default async function ConfigLayout({ children }: { children: React.ReactNode }) {
  await exigirModulo('config');
  return (
    <div className="flex flex-col gap-[18px]">
      <h1 className="m-0 font-serif text-[34px] font-medium">Configurações</h1>
      <AbasConfig />
      {children}
    </div>
  );
}
