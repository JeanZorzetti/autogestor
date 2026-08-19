import type { APIRoute } from "astro";
import { parseLead } from "../../lib/lead.mjs";
import { dbOn, gravarLead } from "../../lib/db";
import { SOLUCOES, PARCEIRO, GERAL } from "../../data/solucoes";

// Única rota dinâmica do site. O resto é HTML estático.
export const prerender = false;

const SLUGS = [...SOLUCOES, PARCEIRO, GERAL].map((s) => s.slug);

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export const POST: APIRoute = async ({ request, clientAddress, redirect }) => {
  // Sem JS o navegador manda form-urlencoded e espera navegar; com JS o script
  // manda JSON e espera resposta. Aceitar os dois é o que faz o formulário
  // continuar funcionando quando o bundle não carrega.
  const form = !(request.headers.get("content-type") ?? "").includes("application/json");

  let body: unknown;
  try {
    body = form ? Object.fromEntries(await request.formData()) : await request.json();
  } catch {
    return json({ erro: "Não recebemos os dados do formulário." }, 400);
  }

  const r = parseLead(body, SLUGS);
  if (!r.ok) return form ? redirect(`/obrigado?erro=1`, 303) : json({ erro: r.erro, campo: r.campo }, 400);

  // Robô recebe 200 e vai embora achando que funcionou. Ensinar o robô qual
  // campo o denunciou só faz ele voltar sabendo contornar.
  if (r.lead.isca) return form ? redirect("/obrigado", 303) : json({ ok: true }, 200);

  if (!dbOn()) {
    // Fail closed e honesto: o formulário mostra o WhatsApp em vez de fingir
    // que gravou. Lead engolido em silêncio é pior que formulário fora do ar.
    return form
      ? redirect("/obrigado?erro=1", 303)
      : json({ erro: "Nosso formulário está fora do ar. Fale com a gente no WhatsApp." }, 503);
  }

  try {
    const { created } = await gravarLead(r.lead, {
      ua: request.headers.get("user-agent")?.slice(0, 200) ?? null,
      referer: request.headers.get("referer")?.slice(0, 300) ?? null,
      ip: clientAddress ?? null,
    });
    return form ? redirect("/obrigado", 303) : json({ ok: true, duplicado: !created }, 200);
  } catch (e) {
    console.error("falha ao gravar lead", e);
    return form
      ? redirect("/obrigado?erro=1", 303)
      : json({ erro: "Não conseguimos registrar agora. Chame no WhatsApp que respondemos na hora." }, 500);
  }
};
