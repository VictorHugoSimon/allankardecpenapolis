/** Documento indexado para RAG (agenda, regulamentos, comunicados). */
export interface DocumentoBase {
  id: string;
  titulo: string;
  /** Rótulo exibido em "Fonte consultada". */
  fonte: string;
  texto: string;
}

export interface RespostaIA {
  texto: string;
  /** Toda resposta cita a fonte. */
  fontes: string[];
  /** Pergunta pessoal: encaminhar ao atendimento fraterno. */
  encaminharAtendimento: boolean;
}

export interface AIProvider {
  readonly nome: string;
  responder(pergunta: string, contexto: DocumentoBase[]): Promise<RespostaIA>;
  /** Gera rascunho; o resultado SEMPRE segue para aprovação humana. */
  gerarRascunho(instrucao: string, contexto: DocumentoBase[]): Promise<RespostaIA>;
}

export const MENSAGEM_ENCAMINHAMENTO =
  'Para questões pessoais, o melhor caminho é uma conversa com a equipe do atendimento fraterno. ' +
  'Você pode solicitar pelo app em "Preciso de ajuda".';

const PESSOAL =
  /\b(estou|me sinto|sinto|minha (vida|m[aã]e|fam[ií]lia)|meu (pai|filho|marido)|depress|ansiedad|suic|luto|perdi|doen[cç]a|sofr)/i;

const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2);

/** Recuperação simples por sobreposição de termos (usada pelo mock e como fallback). */
export function recuperar(pergunta: string, docs: DocumentoBase[], k = 3): DocumentoBase[] {
  const q = new Set(normalizar(pergunta));
  return docs
    .map((d) => ({ d, score: normalizar(`${d.titulo} ${d.texto}`).filter((w) => q.has(w)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => x.d);
}

/** IA simulada: responde com o trecho mais relevante e cita a fonte. */
export function criarMockAIProvider(): AIProvider {
  return {
    nome: 'mock',
    async responder(pergunta, contexto) {
      if (PESSOAL.test(pergunta)) {
        return {
          texto: MENSAGEM_ENCAMINHAMENTO,
          fontes: ['Orientações do atendimento fraterno'],
          encaminharAtendimento: true,
        };
      }
      const docs = recuperar(pergunta, contexto, 1);
      const doc = docs[0];
      if (!doc) {
        return {
          texto: 'Não encontrei essa informação na base do CEAK. Recomendo falar com a secretaria.',
          fontes: ['Índice CEAK'],
          encaminharAtendimento: false,
        };
      }
      return { texto: doc.texto, fontes: [doc.fonte], encaminharAtendimento: false };
    },
    async gerarRascunho(instrucao, contexto) {
      const docs = recuperar(instrucao, contexto, 2);
      return {
        texto: `Rascunho: ${docs[0]?.texto ?? instrucao}`,
        fontes: docs.length ? docs.map((d) => d.fonte) : ['Instrução do usuário'],
        encaminharAtendimento: false,
      };
    },
  };
}
