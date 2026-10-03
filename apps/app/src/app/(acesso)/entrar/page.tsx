import type { Metadata } from 'next';
import { FormEntrar } from './FormEntrar';

export const metadata: Metadata = { title: 'Entrar' };

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <>
      <span
        aria-hidden="true"
        className="bg-green text-bg flex size-16 items-center justify-center rounded-[18px] font-serif text-2xl"
      >
        AK
      </span>
      <h1 className="m-0 font-serif text-[32px] leading-[1.1] font-normal">
        Bem-vindo ao
        <br />
        CEAK App
      </h1>
      <p className="text-muted m-0 text-[15px] leading-normal">
        Agenda, check-in, estudos e comunicados do Centro Espírita Allan Kardec.
      </p>
      <FormEntrar next={next} />
    </>
  );
}
