import type { Metadata } from 'next';
import { LayoutLogin } from '@/components/LayoutLogin';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Entrar' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <LayoutLogin>
      <LoginForm next={next} />
    </LayoutLogin>
  );
}
