import { dbOn, listarUsuarios } from "@/lib/db";
import { usuarioAtual } from "@/lib/auth";
import { Tabs } from "../tabs";
import { adicionar, alternarAtivo, trocarSenha } from "./actions";

export const dynamic = "force-dynamic";

const data = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

const ERROS: Record<string, string> = {
  dados: "Preencha nome, e-mail e uma senha de pelo menos 8 caracteres.",
  email: "Esse e-mail já está cadastrado.",
  proprio: "Você não pode desativar a própria conta.",
  curta: "A nova senha precisa ter pelo menos 8 caracteres.",
  senha: "A senha atual não confere.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  const usuario = await usuarioAtual();
  const { erro, ok } = await searchParams;
  const on = dbOn();
  const usuarios = on ? await listarUsuarios() : [];

  return (
    <main>
      <Tabs active="equipe" nome={usuario?.nome ?? ""} />
      <div className="page">
        <h1 className="sr-only">Equipe</h1>

        {!on && (
          <div className="banner" role="alert">
            Equipe sem persistência — configure <code>DATABASE_URL</code> (Postgres) no ambiente e redeploy.
          </div>
        )}
        {erro && (
          <div className="entrar-erro" role="alert">
            {ERROS[erro] ?? "Não foi possível concluir."}
          </div>
        )}
        {ok === "senha" && (
          <div className="aviso-ok" role="status">
            Senha alterada.
          </div>
        )}

        <section className="card ag-section">
          <h2 className="ag-h">Corretores</h2>
          {usuarios.length === 0 ? (
            <p className="vazio">Nenhum corretor cadastrado ainda.</p>
          ) : (
            <table className="tabela-empilha" role="table">
              <thead>
                <tr role="row">
                  <th>nome</th>
                  <th>e-mail</th>
                  <th>status</th>
                  <th>desde</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id} role="row">
                    <td role="cell">{u.nome}</td>
                    <td role="cell" data-rotulo="e-mail">{u.email}</td>
                    <td role="cell" data-rotulo="status">{u.ativo ? <span className="pill pill-ok">ativo</span> : <span className="pill pill-alerta">inativo</span>}</td>
                    <td role="cell" data-rotulo="desde">{data(u.criado)}</td>
                    <td role="cell">
                      <form action={alternarAtivo}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="ativo" value={u.ativo ? "0" : "1"} />
                        <button className={u.ativo ? "ag-btn perigo" : "ag-btn secundario"} type="submit">
                          {u.ativo ? "Desativar" : "Reativar"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card ag-section">
          <h2 className="ag-h">Adicionar corretor</h2>
          <form action={adicionar} className="filtros">
            <div className="campo">
              <label htmlFor="nome-novo">Nome</label>
              <input id="nome-novo" name="nome" required className="ag-in" />
            </div>
            <div className="campo">
              <label htmlFor="email-novo">E-mail</label>
              <input id="email-novo" name="email" type="email" required className="ag-in" />
            </div>
            <div className="campo">
              <label htmlFor="senha-novo">Senha inicial</label>
              <input id="senha-novo" name="senha" type="password" required minLength={8} className="ag-in" />
            </div>
            <button className="ag-btn" type="submit">
              Adicionar
            </button>
          </form>
        </section>

        <section className="card ag-section">
          <h2 className="ag-h">Trocar minha senha</h2>
          <form action={trocarSenha} className="filtros">
            <div className="campo">
              <label htmlFor="senha-atual">Senha atual</label>
              <input id="senha-atual" name="senhaAtual" type="password" required autoComplete="current-password" className="ag-in" />
            </div>
            <div className="campo">
              <label htmlFor="senha-nova">Nova senha</label>
              <input id="senha-nova" name="senhaNova" type="password" required minLength={8} autoComplete="new-password" className="ag-in" />
            </div>
            <button className="ag-btn" type="submit">
              Salvar senha
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
