import { z } from 'zod'
import { centavosDoTexto } from './dinheiro'

/**
 * Estado devolvido pelas Server Actions para o `useActionState`.
 * `valores` repõe o que foi digitado: o React 19 limpa o formulário depois da action, mesmo com erro.
 * Use nos campos: `defaultValue={estado.valores?.nome ?? padrao}`.
 */
export type EstadoFormulario = { ok?: string; erro?: string; erros?: Record<string, string>; valores?: Record<string, string> }

/** O que foi digitado (só textos; arquivos ficam de fora). */
export function valoresDoFormulario(formData: FormData): Record<string, string> {
  return Object.fromEntries([...formData].filter((par): par is [string, string] => typeof par[1] === 'string'))
}

/** Valida o FormData com Zod. Devolve os dados ou o estado de erro pronto para a tela. */
export function lerFormulario<T extends z.ZodType>(esquema: T, formData: FormData): { dados: z.infer<T> } | { estado: EstadoFormulario } {
  const resultado = esquema.safeParse(Object.fromEntries(formData))
  if (resultado.success) return { dados: resultado.data }
  return {
    estado: {
      erro: 'Confira os campos destacados.',
      erros: Object.fromEntries(resultado.error.issues.map((issue) => [String(issue.path[0]), issue.message])),
      valores: valoresDoFormulario(formData),
    },
  }
}

/** Campos comuns. */
export const campo = {
  texto: (mensagem = 'Preencha este campo') => z.string().trim().min(1, mensagem),
  opcional: () =>
    z
      .string()
      .trim()
      .transform((valor) => valor || undefined),
  data: () => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  /** "1.234,56" ou "1234.56" → centavos. */
  dinheiro: () =>
    z.string().transform((texto, ctx) => {
      const centavos = centavosDoTexto(texto)
      if (centavos === undefined) ctx.addIssue({ code: 'custom', message: 'Valor inválido' })
      return centavos ?? 0
    }),
  inteiro: () => z.coerce.number().int('Use um número inteiro'),
}
