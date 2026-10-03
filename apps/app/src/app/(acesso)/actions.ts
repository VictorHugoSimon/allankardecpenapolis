'use server';

import { redirect } from 'next/navigation';
import { cadastroSchema, loginSchema, telefoneBR } from '@ceak/core/validacao';
import {
  autenticarComSenha,
  cadastrarParticipante,
  ErroNegocio,
  sessaoParaIdentidade,
  whatsappTemConta,
} from '@ceak/db';
import {
  destinoSeguro,
  errosDoZod,
  MSG_FALHA,
  MSG_LIMITE,
  textos,
  type EstadoForm,
} from '@/lib/formulario';
import {
  authProvider,
  dentroDoLimite,
  gravarCookieSessao,
  ipDaRequisicao,
  log,
} from '@/lib/servidor';

export async function entrar(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const valores = textos(form, ['email']);
  const r = loginSchema.safeParse({ email: form.get('email'), senha: form.get('senha') });
  if (!r.success) return { erros: errosDoZod(r.error), valores };
  if (!(await dentroDoLimite('app-login', 20))) return { erro: MSG_LIMITE, valores };
  const res = await autenticarComSenha(authProvider(), r.data.email, r.data.senha);
  if (!res.ok) {
    log.warn('SEGURANCA', `app: login falhou (${res.motivo})`, {
      rota: '/entrar',
      status: res.motivo === 'bloqueado' ? 429 : 401,
      usuario: (await ipDaRequisicao()) ?? undefined,
    });
    return {
      erro:
        res.motivo === 'bloqueado'
          ? 'Muitas tentativas. Tente novamente em 15 minutos.'
          : 'E-mail ou senha incorretos.',
      valores,
    };
  }
  await gravarCookieSessao(res.sessao);
  log.info('SEGURANCA', `app: login · ${res.sessao.perfil}`, { rota: '/entrar', status: 200 });
  redirect(destinoSeguro(form.get('next')));
}

export interface EstadoCodigo extends EstadoForm {
  etapa?: 'telefone' | 'codigo';
  telefone?: string;
}

/** Envia o código só para WhatsApp de uma conta ativa, sem revelar se o número existe. */
export async function pedirCodigo(_: EstadoCodigo, form: FormData): Promise<EstadoCodigo> {
  const valores = textos(form, ['whatsapp']);
  const tel = telefoneBR.safeParse(form.get('whatsapp') ?? '');
  if (!tel.success)
    return { etapa: 'telefone', erros: { whatsapp: tel.error.issues[0]!.message }, valores };
  if (!(await dentroDoLimite('app-codigo', 5)))
    return { etapa: 'telefone', erro: MSG_LIMITE, valores };
  try {
    if (await whatsappTemConta(tel.data)) await authProvider().enviarCodigo(tel.data, 'whatsapp');
  } catch (e) {
    log.error('SEGURANCA', 'app: envio de código falhou', {
      rota: '/entrar/codigo',
      status: 500,
      contexto: { erro: String(e) },
    });
    return { etapa: 'telefone', erro: MSG_FALHA, valores };
  }
  return { etapa: 'codigo', telefone: tel.data, ok: true };
}

export async function confirmarCodigo(_: EstadoCodigo, form: FormData): Promise<EstadoCodigo> {
  const telefone = String(form.get('telefone') ?? '');
  const codigo = String(form.get('codigo') ?? '').replace(/\D/g, '');
  const tel = telefoneBR.safeParse(telefone);
  if (!tel.success) return { etapa: 'telefone' };
  if (!/^\d{6}$/.test(codigo))
    return { etapa: 'codigo', telefone, erros: { codigo: 'O código tem 6 dígitos.' } };
  if (!(await dentroDoLimite('app-codigo-verificar', 10)))
    return { etapa: 'codigo', telefone, erro: MSG_LIMITE };
  const id = await authProvider().verificarCodigo(tel.data, 'whatsapp', codigo);
  const sessao = id ? await sessaoParaIdentidade(id) : null;
  if (!sessao) {
    log.warn('SEGURANCA', 'app: código inválido ou expirado', {
      rota: '/entrar/codigo',
      status: 401,
    });
    return {
      etapa: 'codigo',
      telefone,
      erros: { codigo: 'Código inválido ou expirado. Confira ou peça um novo código.' },
    };
  }
  await gravarCookieSessao(sessao);
  log.info('SEGURANCA', `app: login por código · ${sessao.perfil}`, {
    rota: '/entrar/codigo',
    status: 200,
  });
  redirect('/');
}

export async function cadastrar(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const valores = textos(form, ['nome', 'email', 'whatsapp']);
  const r = cadastroSchema.safeParse({
    nome: form.get('nome'),
    email: form.get('email'),
    whatsapp: valores.whatsapp || undefined,
    senha: form.get('senha'),
    primeiraVez: form.get('primeiraVez') === 'sim',
    consentimentoLgpd: form.get('consentimento') === 'sim',
  });
  if (!r.success) {
    const erros = errosDoZod(r.error);
    if (erros.consentimentoLgpd) erros.consentimento = erros.consentimentoLgpd;
    return { erros, valores };
  }
  if (!(await dentroDoLimite('app-cadastro', 5))) return { erro: MSG_LIMITE, valores };
  try {
    await cadastrarParticipante(r.data);
  } catch (e) {
    if (e instanceof ErroNegocio) return { erros: { email: e.message }, valores };
    log.error('APLICACAO', 'app: cadastro falhou', {
      rota: '/cadastro',
      status: 500,
      contexto: { erro: String(e) },
    });
    return { erro: MSG_FALHA, valores };
  }
  const sessao = await sessaoParaIdentidade({ email: r.data.email });
  if (!sessao) return { erro: MSG_FALHA, valores };
  await gravarCookieSessao(sessao);
  log.info('APLICACAO', 'app: nova conta (Visitante)', { rota: '/cadastro', status: 201 });
  redirect('/');
}
