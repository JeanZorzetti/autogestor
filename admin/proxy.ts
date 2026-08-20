import { NextResponse, type NextRequest } from "next/server";
import { verificarSessao, COOKIE_SESSAO } from "./lib/sessao.mjs";

export async function proxy(req: NextRequest) {
  if (req.nextUrl.pathname === "/entrar") return NextResponse.next();

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    // Fail closed em produção: sem segredo, ninguém entra — nunca passar aberto.
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("ADMIN_SESSION_SECRET não configurado", { status: 503 });
    }
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_SESSAO)?.value;
  const sessao = await verificarSessao(token, secret);
  if (!sessao) {
    const destino = new URL("/entrar", req.url);
    destino.searchParams.set("depois", req.nextUrl.pathname);
    return NextResponse.redirect(destino);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next|favicon.ico).*)"] };
