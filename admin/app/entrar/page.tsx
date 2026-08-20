import { entrar } from "./actions";

const MENSAGENS: Record<string, string> = {
  credenciais: "E-mail ou senha não conferem.",
  limite: "Muitas tentativas. Aguarde um pouco e tente novamente.",
  indisponivel: "Não conseguimos processar o login agora. Tente novamente em instantes.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; depois?: string }>;
}) {
  const { erro, depois } = await searchParams;
  const mensagem = erro ? MENSAGENS[erro] : undefined;

  return (
    <main className="entrar-wrap">
      <div className="card entrar-card">
        <h1 className="entrar-titulo">Entrar</h1>
        <p className="entrar-sub">Painel de leads da Autogestor.</p>

        {mensagem && (
          <div className="entrar-erro" role="alert">
            {mensagem}
          </div>
        )}

        <form action={entrar} className="entrar-form">
          <input type="hidden" name="depois" value={depois ?? "/"} />
          <div className="campo">
            <label htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" required autoComplete="username" className="ag-in" />
          </div>
          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <input id="senha" name="senha" type="password" required autoComplete="current-password" className="ag-in" />
          </div>
          <button className="ag-btn" type="submit">
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
