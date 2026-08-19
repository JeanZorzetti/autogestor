import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Um post por cluster de intenção (verticais/solucoes.ts), não por vertical:
// um cluster tem 1 pilar + vários spokes que linkam pra ele. `vertical` é o
// slug de SOLUCOES pro qual o post empurra o lead — é o que decide o CTA final.
const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    titulo: z.string(),
    /** Rótulo da trilha. O título inteiro ocupava duas linhas no celular e
     *  repetia o H1 logo abaixo — mesmo motivo do `curto` em solucoes.ts.
     *  Sem ele, a trilha cai no título completo. */
    curto: z.string().optional(),
    descricao: z.string(),
    vertical: z.string(),
    publicado: z.coerce.date(),
    atualizado: z.coerce.date().optional(),
    /** Pilar do cluster = a página que as outras do mesmo `vertical` linkam.
     *  Controla nav interna simples: spoke aponta pro pilar, pilar não aponta pra si. */
    pilar: z.boolean().default(false),
  }),
});

export const collections = { blog };
