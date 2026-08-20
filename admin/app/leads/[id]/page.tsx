import { notFound } from "next/navigation";
import { dbOn, buscarLead, eventosDoLead } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";
import { nomeDoPipeline } from "@/lib/pipelines.mjs";
import { Tabs } from "../../tabs";
import { definirValor } from "../actions";

export const dynamic = "force-dynamic";

const moeda = (v: number | null) => (v === null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
const dataHora = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!dbOn() || !Number.isInteger(id)) notFound();

  const usuario = await usuarioAtual();
  const [lead, eventos] = await Promise.all([buscarLead(id), eventosDoLead(id)]);
  if (!lead) notFound();

  const metadata = lead.metadata;
  const campo = (chave: string) => (typeof metadata[chave] === "string" ? (metadata[chave] as string) : null);

  return (
    <main className="page">
      <Tabs active="leads" nome={usuario?.nome ?? ""} />

      <div className="card ag-section">
        <h1 className="entrar-titulo" style={{ marginBottom: 4 }}>
          {lead.nome}
        </h1>
        <p className="foot">
          {nomeDoPipeline(lead.pipeline)} · etapa {lead.etapa} · origem {lead.origem}
        </p>
      </div>

      <div className="detalhe-grid">
        <section className="card ag-section">
          <h2 className="ag-h">Dados</h2>
          <dl className="meta-lista">
            <dt>Telefone</dt>
            <dd>{lead.telefone ?? "—"}</dd>
            <dt>E-mail</dt>
            <dd>{lead.email ?? "—"}</dd>
            <dt>Contexto</dt>
            <dd>{campo("contexto") ?? "—"}</dd>
            <dt>Referer</dt>
            <dd>{campo("referer") ?? "—"}</dd>
            <dt>User-agent</dt>
            <dd>{campo("ua") ?? "—"}</dd>
            <dt>IP</dt>
            <dd>{campo("ip") ?? "—"}</dd>
            <dt>Criado em</dt>
            <dd>{dataHora(lead.criado)}</dd>
          </dl>

          <h2 className="ag-h" style={{ marginTop: 20 }}>
            Valor
          </h2>
          <form action={definirValor} className="campo" style={{ flexDirection: "row", alignItems: "center" }}>
            <input type="hidden" name="id" value={lead.id} />
            <label htmlFor="valor">Valor</label>
            <input
              id="valor"
              name="valor"
              defaultValue={lead.valor === null ? "" : lead.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              placeholder="ex.: 1.200,00"
              className="ag-in"
              inputMode="decimal"
            />
            <button className="ag-btn" type="submit">
              Salvar
            </button>
          </form>
          <p className="foot">Valor atual: {moeda(lead.valor)}</p>
        </section>

        <section className="card ag-section">
          <h2 className="ag-h">Histórico</h2>
          {eventos.length === 0 ? (
            <p className="vazio">Sem eventos registrados ainda.</p>
          ) : (
            <ul className="timeline">
              {eventos.map((e) => (
                <li key={e.id}>
                  <div className="mudanca">{e.de ? `${e.de} → ${e.para}` : `entrada em ${e.para}`}</div>
                  {e.nota && <div>{e.nota}</div>}
                  <div className="meta">
                    {e.autor ?? "site"} · {dataHora(e.quando)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
