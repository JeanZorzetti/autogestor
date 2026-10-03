import Link from "next/link";
import type { CSSProperties } from "react";
import { Archivo } from "next/font/google";
import { dbOn, filaDeEspera, panorama, entradaPorSemana, porFrente, fechados30d, type Panorama } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";
import { nomeDoPipeline, nomeDaEtapa, ETAPAS, PIPELINES } from "@/lib/pipelines.mjs";
import { ESCALA_DIAS, formatarEspera, situacao, textoSituacao, ordenarFila, respostaDaCapa } from "@/lib/painel.mjs";
import { Tabs } from "./tabs";
import { Selo } from "./selo";
import "./painel.css";

// A display da home (Costura): Archivo variável com o eixo de largura — é ele
// que deixa o número da capa a 168px caber ao lado do título.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--fonte-display", display: "swap" });

export const dynamic = "force-dynamic";

const FUSO = "America/Sao_Paulo";
const dataCurta = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, day: "2-digit", month: "2-digit" });
const hora = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, hour: "2-digit", minute: "2-digit" });
const diaLongo = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, weekday: "long" });
const diaCurto = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, weekday: "short" });
const umaCasa = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

// ponytail: a fila mostra 12 linhas; o resto fica no quadro de leads, com a contagem aqui.
const MAX_FILA = 12;

const vars = (v: Record<string, number | string>) => v as CSSProperties;
const ddmm = (isoData: string) => `${isoData.slice(8, 10)}/${isoData.slice(5, 7)}`;
const plural = (n: number, um: string, varios: string) => (n === 1 ? um : varios);

function Falha({ oQue }: { oQue: string }) {
  return (
    <p className="estado estado-erro" role="alert">
      Não deu para ler {oQue} agora: o banco não respondeu. Recarregue a página; se continuar, confira o Postgres no
      EasyPanel.
    </p>
  );
}

export default async function Page() {
  // usuarioAtual lê o banco: com ele fora, o Painel ainda abre e cada bloco diz o que falhou.
  const usuario = await usuarioAtual().catch(() => null);
  const on = dbOn();
  const agora = new Date();
  const res = on
    ? await Promise.allSettled([filaDeEspera(), panorama(), entradaPorSemana(), porFrente(), fechados30d()])
    : null;
  if (res) for (const r of res) if (r.status === "rejected") console.error("painel:", r.reason);

  const [rFila, rGeral, rSemanas, rFrentes, rFechados] = res ?? [];
  const geral = rGeral?.status === "fulfilled" ? rGeral.value : null;
  const primeiro = geral?.primeiro ? dataCurta.format(new Date(geral.primeiro)) : null;
  const fila = rFila?.status === "fulfilled" ? ordenarFila(rFila.value) : null;
  const visiveis = fila?.slice(0, MAX_FILA) ?? [];
  const apurado = `${dataCurta.format(agora)} ${hora.format(agora)}`;
  const dia = diaLongo.format(agora);

  const capa = !on
    ? { numero: "", texto: "Painel sem banco de dados", destaque: "", sub: "" }
    : fila
      ? respostaDaCapa(fila, geral?.total ?? 1)
      : { numero: "", texto: "A fila não carregou", destaque: "", sub: "O banco não respondeu. Recarregue a página." };

  return (
    <main data-art="costura" className={archivo.variable}>
      <section className="capa" aria-labelledby="painel-resposta">
        <Selo />
        <div className="painel-largura">
          <Tabs active="painel" nome={usuario?.nome ?? ""} />
          {!on && (
            <div className="banner" role="alert">
              Painel sem persistência — configure <code>DATABASE_URL</code> (Postgres) no ambiente e redeploy.
            </div>
          )}
          <div className="resposta">
            <p className="olho">
              {dia.charAt(0).toUpperCase() + dia.slice(1)}, {apurado.replace(" ", " · ")}
            </p>
            {capa.numero && (
              <span className="grande" aria-hidden="true" style={vars({ "--digitos": capa.numero.length })}>
                {capa.numero}
              </span>
            )}
            <h1 id="painel-resposta">
              {capa.numero && <span className="sr-only">{capa.numero} </span>}
              {capa.texto}
              {capa.destaque && (
                <>
                  {" "}
                  <em>{capa.destaque}</em>
                </>
              )}
            </h1>
            {capa.sub && <p className="sub">{capa.sub}</p>}
          </div>
        </div>
      </section>

      {on && (
        <div className="painel-largura corpo">
          <section className="fila" aria-labelledby="fila-titulo">
            <h2 id="fila-titulo" className="sr-only">
              Fila de espera
            </h2>
            {!fila ? (
              <Falha oQue="a fila de espera" />
            ) : fila.length === 0 ? (
              <p className="estado">
                {geral?.total === 0
                  ? "Nenhum lead registrado ainda."
                  : `Ninguém esperando: nenhum lead em Novo, Contato ou Proposta${primeiro ? ` entre os ${geral?.total} desde ${primeiro}` : ""}.`}
              </p>
            ) : (
              <>
                <div className="fila-cab" aria-hidden="true">
                  <span>Espera</span>
                  <span>Lead</span>
                  <span>Na etapa, em dias (0 a {ESCALA_DIAS})</span>
                  <span>Situação</span>
                </div>
                <ol className="fila-lista">
                  {visiveis.map((l, i) => {
                    const { prazoDias, alemHoras } = situacao(l.etapa, l.horas);
                    const atrasado = alemHoras > 0;
                    return (
                      <li key={l.id} className={atrasado ? "item atrasado" : "item"} style={vars({ "--i": i })}>
                        <p className="espera">
                          <b>{formatarEspera(l.horas)}</b>
                          <span>em {nomeDaEtapa(l.etapa)}</span>
                        </p>
                        <p className="lead">
                          <Link href={`/leads/${l.id}`}>{l.nome}</Link>
                          <span>
                            {nomeDoPipeline(l.pipeline)} · desde {dataCurta.format(new Date(l.desde))}
                          </span>
                        </p>
                        <div
                          className="regua"
                          role="img"
                          aria-label={`${formatarEspera(l.horas)} na etapa, prazo de ${prazoDias} ${plural(prazoDias, "dia", "dias")}`}
                          style={vars({ "--v": Math.min(l.horas / 24, ESCALA_DIAS), "--p": prazoDias, "--escala": ESCALA_DIAS })}
                        >
                          <span className="regua-ok" />
                          {atrasado && <span className="regua-alem" />}
                          <span className={prazoDias === ESCALA_DIAS ? "regua-prazo no-fim" : "regua-prazo"}>
                            <span>prazo {prazoDias} d</span>
                          </span>
                        </div>
                        <p className="situacao">{textoSituacao(l.etapa, l.horas)}</p>
                      </li>
                    );
                  })}
                </ol>
                <div className="fila-eixo" aria-hidden="true">
                  <div className="eixo">
                    {Array.from({ length: ESCALA_DIAS + 1 }, (_, d) => (
                      <span key={d} style={vars({ "--d": d / ESCALA_DIAS })}>
                        {d === 0 ? "0" : `${d} d`}
                      </span>
                    ))}
                  </div>
                </div>
                {fila.length > MAX_FILA && (
                  <p className="fila-mais">
                    E mais {fila.length - MAX_FILA} em aberto no <Link href="/leads">quadro de leads</Link>.
                  </p>
                )}
              </>
            )}
          </section>
          <p className="procedencia">
            Fonte: crm_leads, com a entrada na etapa lida de crm_eventos · prazos: Novo 1 d, Contato 5 d, Proposta 7 d ·
            apurado {apurado} (Brasília)
          </p>

          <div className="evidencias">
            <section className="bloco" aria-labelledby="entrada-titulo">
              <h2 id="entrada-titulo">Entrada por semana</h2>
              {rSemanas?.status === "fulfilled" ? (
                <Entrada semanas={rSemanas.value} geral={geral} primeiro={primeiro} agora={agora} apurado={apurado} />
              ) : (
                <Falha oQue="a entrada por semana" />
              )}
            </section>
            <section className="bloco" aria-labelledby="frentes-titulo">
              <h2 id="frentes-titulo">Em aberto por frente</h2>
              {rFrentes?.status === "fulfilled" ? (
                <Frentes frentes={rFrentes.value} primeiro={primeiro} apurado={apurado} />
              ) : (
                <Falha oQue="as frentes" />
              )}
            </section>
            <section className="bloco" aria-labelledby="fechados-titulo">
              <h2 id="fechados-titulo">Fechados em 30 dias</h2>
              {rFechados?.status === "fulfilled" ? (
                <Fechados {...rFechados.value} agora={agora} apurado={apurado} />
              ) : (
                <Falha oQue="os fechados" />
              )}
            </section>
          </div>

          {geral && geral.total > 0 && (
            <p className="contexto">
              Hoje, dos {geral.total} leads desde {primeiro}:{" "}
              {ETAPAS.map((e) => {
                const n = geral.porEtapa.find((x) => x.etapa === e)?.total ?? 0;
                if (e === "ganho") return `${n} ${plural(n, "ganho", "ganhos")}`;
                if (e === "perdido") return `${n} ${plural(n, "perdido", "perdidos")}`;
                return `${n} em ${nomeDaEtapa(e)}`;
              }).join(" · ")}
              . <Link href="/leads">Ver o quadro de leads →</Link>
            </p>
          )}
          {rGeral?.status === "rejected" && <Falha oQue="o histórico de leads" />}
        </div>
      )}
    </main>
  );
}

function Entrada({
  semanas,
  geral,
  primeiro,
  agora,
  apurado,
}: {
  semanas: { semana: string; n: number }[];
  geral: Panorama | null;
  primeiro: string | null;
  agora: Date;
  apurado: string;
}) {
  const atual = semanas.at(-1)?.n ?? 0;
  const antes = semanas.slice(0, -1).reduce((s, x) => s + x.n, 0);
  const max = Math.max(1, ...semanas.map((s) => s.n));
  const ate = `${diaCurto.format(agora).replace(".", "")} ${dataCurta.format(agora)}`;
  const legenda =
    atual + antes > 0
      ? `Nas ${semanas.length - 1} semanas antes: ${antes}, média de ${umaCasa.format(antes / (semanas.length - 1))} por semana`
      : geral?.total
        ? `Nenhum nas últimas ${semanas.length} semanas · ${geral.total} desde ${primeiro}`
        : "Sem registro: nenhum lead gravado ainda";
  return (
    <>
      <p className="valor">
        <b>{atual}</b>
        <small>nesta semana</small>
      </p>
      <p className="legenda">{legenda}</p>
      <div className="semanas" role="img" aria-label={`Leads por semana: ${semanas.map((s) => `${ddmm(s.semana)}, ${s.n}`).join("; ")}`}>
        {semanas.map((s, i) => (
          <div key={s.semana} className={i === semanas.length - 1 ? "atual" : undefined} style={vars({ "--i": i })}>
            <span>{s.n}</span>
            <i style={vars({ "--n": s.n / max })} />
          </div>
        ))}
      </div>
      <div className="semanas-x" aria-hidden="true">
        {semanas.map((s, i) => (
          <span key={s.semana}>
            {ddmm(s.semana)}
            {i === semanas.length - 1 ? "*" : ""}
          </span>
        ))}
      </div>
      <p className="procedencia">Semanas de segunda a domingo, horário de Brasília · *parcial, até {ate} · crm_leads.criado · apurado {apurado}</p>
    </>
  );
}

function Frentes({ frentes, primeiro, apurado }: { frentes: { pipeline: string; total: number; emAberto: number }[]; primeiro: string | null; apurado: string }) {
  if (frentes.length === 0) return <p className="estado">Sem registro: nenhum lead gravado ainda.</p>;
  const max = Math.max(1, ...frentes.map((f) => f.total));
  const semLead = PIPELINES.filter((p) => !frentes.some((f) => f.pipeline === p.slug)).map((p) => p.nome);
  return (
    <>
      <ul className="frentes">
        {frentes.map((f) => (
          <li key={f.pipeline}>
            {nomeDoPipeline(f.pipeline)} ·{" "}
            <b>
              {f.emAberto} de {f.total}
            </b>
            <span className="barra" style={vars({ "--t": f.total / max, "--a": f.emAberto / f.total })}>
              <i />
            </span>
          </li>
        ))}
      </ul>
      {semLead.length > 0 && (
        <p className="nota">
          Sem lead{primeiro ? ` desde ${primeiro}` : ""}: {semLead.join(", ")}
        </p>
      )}
      <p className="procedencia">Em aberto = Novo, Contato ou Proposta · total desde {primeiro} · crm_leads · apurado {apurado}</p>
    </>
  );
}

function Fechados({ ganhos, perdidos, agora, apurado }: { ganhos: number; perdidos: number; agora: Date; apurado: string }) {
  const n = ganhos + perdidos;
  const janela = `${dataCurta.format(new Date(agora.getTime() - 30 * 86_400_000))} a ${dataCurta.format(agora)}`;
  return (
    <>
      <p className="valor">
        <b>{ganhos}</b>
        <small>{n === 0 ? "fechados" : `${plural(ganhos, "ganho", "ganhos")} de ${n}`}</small>
      </p>
      {n > 0 && (
        <span className="empilha" role="img" aria-label={`${ganhos} ${plural(ganhos, "ganho", "ganhos")} e ${perdidos} ${plural(perdidos, "perdido", "perdidos")}`}>
          <i className="ganho" style={vars({ "--n": ganhos })} />
          <i className="perdido" style={vars({ "--n": perdidos })} />
        </span>
      )}
      <p className="legenda">
        {n === 0 ? `Nenhum lead fechado de ${janela}` : `${perdidos} ${plural(perdidos, "perdido", "perdidos")} · ${janela}`}
      </p>
      <p className="procedencia">Pela data de entrada em Ganho ou Perdido · crm_eventos · apurado {apurado}</p>
    </>
  );
}
