import Link from "next/link";
import { sair } from "./entrar/actions";

export function Tabs({ active, nome }: { active: "painel" | "leads" | "equipe"; nome: string }) {
  const tab = (key: string, href: string, label: string) => (
    <Link href={href} className={active === key ? "tab active" : "tab"} aria-current={active === key ? "page" : undefined}>
      {label}
    </Link>
  );
  return (
    <div className="topbar">
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
  );
}
