"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ETAPAS, nomeDaEtapa } from "@/lib/pipelines.mjs";
import { agruparPorEtapa } from "@/lib/quadro.mjs";
import type { Lead } from "@/lib/db";
import { mover, reposicionar, type Resultado } from "./actions";
import { Cartao } from "./cartao";

const MENSAGENS_ERRO: Record<Extract<Resultado, { ok: false }>["erro"], string> = {
  sessao: "Sua sessão expirou.",
  db: "Sem conexão com o banco — a mudança não foi salva.",
  invalido: "Não foi possível mover este lead.",
  falhou: "A mudança não foi salva.",
};

type Grupos = Map<string, Lead[]>;

function idColuna(etapa: string): string {
  return `col:${etapa}`;
}

function alvoDoSolto(overId: string | number, grupos: Grupos): { etapa: string; index: number } | null {
  const s = String(overId);
  if (s.startsWith("col:")) {
    const etapa = s.slice(4);
    return grupos.has(etapa) ? { etapa, index: (grupos.get(etapa) ?? []).length } : null;
  }
  const idNum = Number(s);
  for (const [etapa, cartoes] of grupos) {
    const i = cartoes.findIndex((l) => l.id === idNum);
    if (i !== -1) return { etapa, index: i };
  }
  return null;
}

export function Quadro({ leads, truncado, semResultado }: { leads: Lead[]; truncado: boolean; semResultado: boolean }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [avisoFalha, setAvisoFalha] = useState("");
  const [, startTransition] = useTransition();

  const [grupos, aplicarOtimista] = useOptimistic<Grupos, { id: number; destino: string; index: number }>(
    agruparPorEtapa(leads),
    (estado, { id, destino, index }) => {
      const novo = new Map(estado);
      let movido: Lead | undefined;
      for (const [etapa, cartoes] of novo) {
        const i = cartoes.findIndex((l) => l.id === id);
        if (i !== -1) {
          movido = cartoes[i];
          novo.set(etapa, [...cartoes.slice(0, i), ...cartoes.slice(i + 1)]);
          break;
        }
      }
      if (!movido) return estado;
      const destinoCartoes = [...(novo.get(destino) ?? [])];
      destinoCartoes.splice(index, 0, { ...movido, etapa: destino });
      novo.set(destino, destinoCartoes);
      return novo;
    }
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function nomeDoLead(id: number): string {
    for (const cartoes of grupos.values()) {
      const l = cartoes.find((x) => x.id === id);
      if (l) return l.nome;
    }
    return "";
  }

  function etapaDoLead(id: number): string | null {
    for (const [etapa, cartoes] of grupos) {
      if (cartoes.some((l) => l.id === id)) return etapa;
    }
    return null;
  }

  function tratarResultado(resultado: Resultado, nome: string) {
    if (resultado.ok) {
      router.refresh();
      return;
    }
    setErro(MENSAGENS_ERRO[resultado.erro]);
    setAvisoFalha(`A mudança de ${nome} não foi salva.`);
    if (resultado.erro === "sessao") router.push("/entrar");
  }

  /** Anúncios do ciclo do gesto (pego/sobre/movido/cancelado) vão para a
   * região aria-live que o próprio @dnd-kit gerencia — declarar outra em
   * paralelo duplicaria a fala do leitor de tela a cada gesto. */
  const anunciosDrag = {
    onDragStart({ active }: { active: { id: string | number } }) {
      const id = Number(active.id);
      const etapa = etapaDoLead(id);
      if (!etapa) return "";
      const cartoes = grupos.get(etapa) ?? [];
      const i = cartoes.findIndex((l) => l.id === id);
      return `Cartão ${nomeDoLead(id)} pego, etapa ${nomeDaEtapa(etapa)}, posição ${i + 1} de ${cartoes.length}.`;
    },
    onDragOver({ active, over }: { active: { id: string | number }; over: { id: string | number } | null }) {
      if (!over) return "";
      const alvo = alvoDoSolto(over.id, grupos);
      if (!alvo) return "";
      const cartoes = (grupos.get(alvo.etapa) ?? []).filter((l) => l.id !== Number(active.id));
      return `${nomeDoLead(Number(active.id))} sobre ${nomeDaEtapa(alvo.etapa)}, posição ${Math.min(alvo.index + 1, cartoes.length + 1)} de ${cartoes.length + 1}.`;
    },
    onDragEnd({ active, over }: { active: { id: string | number }; over: { id: string | number } | null }) {
      const nome = nomeDoLead(Number(active.id));
      const alvo = over ? alvoDoSolto(over.id, grupos) : null;
      if (!alvo) return `Movimentação de ${nome} cancelada.`;
      const cartoes = (grupos.get(alvo.etapa) ?? []).filter((l) => l.id !== Number(active.id));
      return `${nome} movido para ${nomeDaEtapa(alvo.etapa)}, posição ${alvo.index + 1} de ${cartoes.length + 1}.`;
    },
    onDragCancel({ active }: { active: { id: string | number } }) {
      const etapa = etapaDoLead(Number(active.id));
      const nome = nomeDoLead(Number(active.id));
      return `Movimentação de ${nome} cancelada.${etapa ? ` Cartão voltou para ${nomeDaEtapa(etapa)}.` : ""}`;
    },
  };

  function handleDragStart() {
    setErro(null);
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    const id = Number(active.id);
    const nome = nomeDoLead(id);
    const etapaOrigem = etapaDoLead(id);

    if (!etapaOrigem || !over) return; // cancelado ou solto fora de qualquer coluna: nada muda

    const alvo = alvoDoSolto(over.id, grupos);
    if (!alvo) return; // fora de qualquer coluna: nada muda

    const cartoesOrigem = grupos.get(etapaOrigem) ?? [];
    const indexOrigem = cartoesOrigem.findIndex((l) => l.id === id);
    const mesmaColuna = alvo.etapa === etapaOrigem;
    if (mesmaColuna && alvo.index === indexOrigem) return; // soltou no mesmo lugar: nada muda

    const cartoesDestino = (grupos.get(alvo.etapa) ?? []).filter((l) => l.id !== id);
    const antes = cartoesDestino[alvo.index - 1]?.id ?? null;
    const depois = cartoesDestino[alvo.index] ?? null;
    const depoisId = depois ? depois.id : null;

    startTransition(async () => {
      aplicarOtimista({ id, destino: alvo.etapa, index: alvo.index });
      const resultado = mesmaColuna
        ? await reposicionar({ id, antes, depois: depoisId })
        : await mover({ id, etapa: alvo.etapa, antes, depois: depoisId, nota: null });
      tratarResultado(resultado, nome);
    });
  }

  function moverPorSelect(id: number, novaEtapa: string) {
    const etapaOrigem = etapaDoLead(id);
    if (!etapaOrigem || etapaOrigem === novaEtapa) return;
    const nome = nomeDoLead(id);
    const cartoesDestino = grupos.get(novaEtapa) ?? [];
    const antes = cartoesDestino[cartoesDestino.length - 1]?.id ?? null;
    startTransition(async () => {
      aplicarOtimista({ id, destino: novaEtapa, index: cartoesDestino.length });
      const resultado = await mover({ id, etapa: novaEtapa, antes, depois: null, nota: null });
      tratarResultado(resultado, nome);
    });
  }

  return (
    <div>
      {truncado && (
        <p className="quadro-aviso" role="status">
          Mostrando os 500 primeiros leads deste recorte — refine o filtro para ver o restante.
        </p>
      )}
      {erro && (
        <p className="quadro-erro" role="alert">
          {erro}{" "}
          <button className="ag-btn secundario" type="button" onClick={() => setErro(null)}>
            entendi
          </button>
        </p>
      )}
      <div aria-live="assertive" className="sr-only">
        {avisoFalha}
      </div>

      {/* As 5 colunas continuam visíveis mesmo sem resultado (US3 cenário 3) —
       * cada uma já mostra "Nenhum lead nesta etapa" sozinha; este aviso só
       * soma o contexto de que foi um filtro que não encontrou nada. */}
      {semResultado && <p className="vazio">Nenhum lead encontrado com esses filtros.</p>}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        accessibility={{
          announcements: anunciosDrag,
          screenReaderInstructions: {
            draggable:
              "Pressione espaço ou enter para pegar o cartão. Use as setas para mover entre colunas e posições. Pressione espaço ou enter de novo para soltar, ou esc para cancelar.",
          },
        }}
      >
        <div className="quadro">
          {ETAPAS.map((etapa) => (
            <Coluna key={etapa} etapa={etapa} cartoes={grupos.get(etapa) ?? []} onMudarEtapa={moverPorSelect} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

function Coluna({ etapa, cartoes, onMudarEtapa }: { etapa: string; cartoes: Lead[]; onMudarEtapa: (id: number, etapa: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: idColuna(etapa) });
  const tituloId = `coluna-titulo-${etapa}`;
  return (
    <section className={`coluna${isOver ? " coluna-sobre" : ""}`} aria-labelledby={tituloId}>
      <div className="coluna-cabecalho">
        <h2 id={tituloId}>{nomeDaEtapa(etapa)}</h2>
        <span className="pill">{cartoes.length}</span>
      </div>
      <SortableContext items={cartoes.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="coluna-lista">
          {cartoes.length === 0 && <li className="coluna-vazia">Nenhum lead nesta etapa</li>}
          {cartoes.map((lead) => (
            <Cartao key={lead.id} lead={lead} onMudarEtapa={(novaEtapa) => onMudarEtapa(lead.id, novaEtapa)} />
          ))}
        </ul>
      </SortableContext>
    </section>
  );
}
