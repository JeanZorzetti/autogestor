import Link from "next/link";
import { dbOn, resumo, leadsParados } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";
import { nomeDoPipeline, LIMIAR_PARADO, ETAPAS } from "@/lib/pipelines.mjs";
import { Tabs } from "./tabs";

export const dynamic = "force-dynamic";

export default async function Page() {
  const usuario = await usuarioAtual();
  const on = dbOn();
  const [r, parados] = on ? await Promise.all([resumo(), leadsParados(LIMIAR_PARADO)]) : [null, []];

  return (
    <main className="page">
      <Tabs active="painel" nome={usuario?.nome ?? ""} />

      {!on && (
        <div className="banner" role="alert">
          Painel sem persistência — configure <code>DATABASE_URL</code> (Postgres) no ambiente e redeploy.
        </div>
      )}

      {r && (
        <>
          <section className="metricas">
            <div className="card metrica">
              <p className="metrica-label">Leads hoje</p>
              <p className="metrica-valor">{r.hoje}</p>
            </div>
            <div className="card metrica">
              <p className="metrica-label">Últimos 7 dias</p>
              <p className="metrica-valor">{r.d7}</p>
            </div>
            <div className="card metrica">
              <p className="metrica-label">Últimos 30 dias</p>
              <p className="metrica-valor">{r.d30}</p>
            </div>
          </section>

          <section className="ag-section card">
            <h2 className="ag-h alert">Parados ({parados.length})</h2>
            {parados.length === 0 ? (
              <p className="vazio">Nenhum lead parado além do prazo — tudo em dia.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>lead</th>
                    <th>vertical</th>
                    <th>etapa</th>
                    <th>parado</th>
                  </tr>
                </thead>
                <tbody>
                  {parados.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <Link href={`/leads/${l.id}`}>{l.nome}</Link>
                      </td>
                      <td>{nomeDoPipeline(l.pipeline)}</td>
                      <td>
                        <span className="pill pill-alerta">{l.etapa}</span>
                      </td>
                      <td>há {l.diasParado}d</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="ag-section card">
            <h2 className="ag-h">Por vertical</h2>
            <table>
              <thead>
                <tr>
                  <th>vertical</th>
                  <th>total</th>
                  <th>novos 7d</th>
                  <th>em aberto</th>
                  <th>ganhos 30d</th>
                </tr>
              </thead>
              <tbody>
                {r.porPipeline.map((p) => (
                  <tr key={p.pipeline}>
                    <td>{nomeDoPipeline(p.pipeline)}</td>
                    <td>{p.total}</td>
                    <td>{p.novos7d}</td>
                    <td>{p.emAberto}</td>
                    <td>{p.ganhos30d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="ag-section card">
            <h2 className="ag-h">Funil por etapa</h2>
            <table>
              <thead>
                <tr>
                  <th>etapa</th>
                  <th>total</th>
                </tr>
              </thead>
              <tbody>
                {ETAPAS.map((e) => (
                  <tr key={e}>
                    <td>{e}</td>
                    <td>{r.porEtapa.find((x) => x.etapa === e)?.total ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </main>
  );
}
