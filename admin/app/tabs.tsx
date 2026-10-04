import Link from "next/link";
import { sair } from "./entrar/actions";

/** A faixa da marca no topo de toda rota: o elemento que não muda quando se
 * troca de aba. No Painel ela fica dentro da capa, que pinta o azul por ela.
 * `largo`: o conteúdo da rota ocupa a tela toda (o quadro de leads), então a
 * faixa alinha com ele em vez de centralizar em 1180px. */
export function Tabs({ active, nome, largo = false }: { active: "painel" | "leads" | "equipe"; nome: string; largo?: boolean }) {
  const tab = (key: string, href: string, label: string) => (
    <Link href={href} className={active === key ? "tab active" : "tab"} aria-current={active === key ? "page" : undefined}>
      {label}
    </Link>
  );
  return (
    <header className="faixa-marca">
      <div className={largo ? "topbar largura largura-cheia" : "topbar largura"}>
        <div className="topbar-left">
          <div className="brand">
            Auto<span>gestor</span>
          </div>
          <nav className="tabs" aria-label="Seções">
            {tab("painel", "/", "Painel")}
            {tab("leads", "/leads", "Leads")}
            {tab("equipe", "/equipe", "Equipe")}
          </nav>
        </div>
        <div className="topbar-meta">
          <span className="topbar-user">{nome}</span>
          <form action={sair}>
            <button className="ag-btn secundario topbar-sair" type="submit">
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
