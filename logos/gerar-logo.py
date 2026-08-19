"""Gera a marca Autogestor por formula e escreve todos os arquivos derivados.

A logo original (logos/logo-1.png) era raster gerado por IA — o "Design sem
nome (14).svg" que existia aqui era um PNG de 5 MB embutido em base64, vetor
so no nome, por isso serrilhava. Este script reconstroi a marca com geometria
de verdade: um anel hexagonal quase fechado mais tres bracos em espiral
logaritmica a ~120 graus, o vortice.

As proporcoes nao foram chutadas: sairam de uma segmentacao polar do PNG
original (raio, espessura e extensao angular de cada arco, por cor).

Uso:  python logos/gerar-logo.py
Depois:  node logos/rasterizar.mjs   (icones PNG, usa o sharp do projeto)
"""
import math
import os

CX = CY = 50.0          # centro no viewBox 0 0 100 100
R = 46.0                # raio de referencia

# ---------------------------------------------------------------- geometria


def hexmod(th, amp):
    """Hexagono arredondado em polares, vertices em 30+60k graus.

    Uma harmonica de cos(6t) em vez do poligono exato: os cantos ja saem
    macios, sem raio de arredondamento para calibrar. amp=0 devolve o circulo.
    """
    return 1.0 + amp * math.cos(math.radians(6.0 * (th - 30.0)))


def pt(r, th):
    return (CX + r * math.cos(math.radians(th)), CY - r * math.sin(math.radians(th)))


def sample(a0, sweep, rfn, wfn, amp, n):
    """Amostra as duas bordas de uma fita: rfn da o eixo, wfn a meia-espessura."""
    out, inn = [], []
    for i in range(n + 1):
        s = i / n
        th = a0 + sweep * s
        r = rfn(s, th) * hexmod(th, amp)
        w = wfn(s)
        out.append(pt(r + w, th))
        inn.append(pt(r - w, th))
    return out, inn


def catmull(p):
    """Polilinha -> cubicas. Catmull-Rom uniforme: passa por todos os pontos."""
    segs = []
    for i in range(len(p) - 1):
        p0 = p[i - 1] if i else p[0]
        p1, p2 = p[i], p[i + 1]
        p3 = p[i + 2] if i + 2 < len(p) else p[-1]
        segs.append(((p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6),
                     (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6), p2))
    return segs


def f(v):
    s = "{:.2f}".format(v).rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def d_of(out, inn):
    d = ["M{} {}".format(f(out[0][0]), f(out[0][1]))]
    for c1, c2, p in catmull(out):
        d.append("C{} {} {} {} {} {}".format(f(c1[0]), f(c1[1]), f(c2[0]), f(c2[1]), f(p[0]), f(p[1])))
    rev = inn[::-1]
    d.append("L{} {}".format(f(rev[0][0]), f(rev[0][1])))
    for c1, c2, p in catmull(rev):
        d.append("C{} {} {} {} {} {}".format(f(c1[0]), f(c1[1]), f(c2[0]), f(c2[1]), f(p[0]), f(p[1])))
    return "".join(d) + "Z"


# --- anel externo -----------------------------------------------------------
# Dois arcos, e nao um so com gradiente azul->laranja: interpolar entre #005ca6
# e #e47a45 passa por um marrom dessaturado bem no meio da marca. O original
# tambem troca de cor de chapa, no lado direito.
RHO, THK, A_RING = 0.865 * R, 0.205 * R, 92.0


def _ring_r(s, th):
    """Raio pelo angulo ABSOLUTO, nao pelo parametro do arco — senao os dois
    arcos decaem em ritmos diferentes e abre um degrau na emenda."""
    return RHO * math.exp(-0.05 * (th - A_RING) / 360.0)


def ring_blue():
    def wfn(s):                       # cinzel na cabeca, o pico do topo
        return 0.5 * THK * (0.62 + 0.38 * min(1.0, s / 0.09))
    return sample(A_RING, 250, _ring_r, wfn, 0.030, 30)


def ring_orange():
    def wfn(s):                       # afila ate a ponta que fecha o vortice
        t = 1.0 if s < 0.62 else (1 - (s - 0.62) / 0.38) ** 0.85
        return 0.5 * THK * t
    return sample(A_RING + 238, 108, _ring_r, wfn, 0.030, 20)


# --- bracos -----------------------------------------------------------------
def arm(a0):
    r0, r1, wmax, sweep = 0.250 * R, 0.680 * R, 0.100 * R, 205
    k = math.log(r1 / r0)
    # lente: espessura zero nas duas pontas, cheia no meio
    wfn = lambda s: wmax * math.sin(math.pi * s) ** 0.60
    return sample(a0, sweep, lambda s, th: r0 * math.exp(k * s), wfn, 0.012, 26)


def build():
    """[(cor, d)] — a distribuicao azul/laranja segue a medida no PNG original."""
    return [("b", d_of(*ring_blue())), ("o", d_of(*ring_orange())),
            ("b", d_of(*arm(62))), ("o", d_of(*arm(182))), ("b", d_of(*arm(302)))]


# ---------------------------------------------------------------- saidas

# Claro: primitivos da paleta (#005ca6, #002b74, #e47a45 e vizinhos).
# Escuro: familia do azul-marca do tema escuro (--marca #77abf8). O #002b74
# do claro some sobre o #142339 do cabecalho escuro.
CLARO = {"b": ("#0a6fbd", "#005ca6", "#002b74"), "o": ("#eb8f68", "#e47a45", "#d26831")}
ESCURO = {"b": ("#9cc4ff", "#6fa6f2", "#4a86d8"), "o": ("#f5a074", "#eb8f68", "#dd7648")}

GEO = {"b": (".62", "0", ".12", "1"), "o": (".85", "0", ".45", "1")}
OFFS = ("0", ".5", "1")

HEAD = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" '
        'role="img" aria-label="Autogestor">')


def _grad(gid, key, stops):
    x1, y1, x2, y2 = GEO[key]
    return ('<linearGradient id="{}" x1="{}" y1="{}" x2="{}" y2="{}">{}</linearGradient>'
            .format(gid, x1, y1, x2, y2, stops))


def svg_fixo(pal):
    defs = "".join(
        _grad(k, k, "".join('<stop offset="{}" stop-color="{}"/>'.format(o, c)
                            for o, c in zip(OFFS, pal[k])))
        for k in ("b", "o"))
    corpo = "".join('<path fill="url(#{})" d="{}"/>'.format(c, d) for c, d in build())
    return HEAD + "<defs>" + defs + "</defs>" + corpo + "</svg>"


def svg_mono():
    corpo = "".join('<path fill="currentColor" d="{}"/>'.format(d) for _, d in build())
    return HEAD + corpo + "</svg>"


def svg_auto():
    """Arquivo unico que troca sozinho no prefers-color-scheme (favicon, e-mail)."""
    regras = ["".join("#{}{}{{stop-color:{}}}".format(k, i, c)
                      for k in ("b", "o") for i, c in enumerate(CLARO[k]))]
    regras.append("@media(prefers-color-scheme:dark){")
    regras.append("".join("#{}{}{{stop-color:{}}}".format(k, i, c)
                          for k in ("b", "o") for i, c in enumerate(ESCURO[k])))
    regras.append("}")
    defs = "".join(
        _grad("g" + k, k, "".join('<stop id="{}{}" offset="{}"/>'.format(k, i, o)
                                  for i, o in enumerate(OFFS)))
        for k in ("b", "o"))
    corpo = "".join('<path fill="url(#g{})" d="{}"/>'.format(c, d) for c, d in build())
    return HEAD + "<style>" + "".join(regras) + "</style><defs>" + defs + "</defs>" + corpo + "</svg>"


ASTRO = '''---
/* Gerado por logos/gerar-logo.py — não editar à mão, rode o script.
   Inline em vez de <img>: assim os gradientes leem tokens da própria página e a
   marca acompanha o tema, inclusive o seletor manual (data-tema), que um .svg
   externo não enxerga. */
interface Props {{ size?: number; class?: string }}
const {{ size = 40, class: klass }} = Astro.props;
---

<svg
  class:list={{["logo", klass]}}
  width={{size}}
  height={{size}}
  viewBox="0 0 100 100"
  role="img"
  aria-label="Autogestor"
  focusable="false"
>
  <defs>
    {defs}
  </defs>
  {corpo}
</svg>

<style>
  /* Valores claros crus: é o que sobra se light-dark() não existir — o bloco
     inteiro do @supports cai fora e a marca fica na versão clara. */
  .logo {{
    {var_claro}

    display: block;
  }}

  @supports (color: light-dark(#fff, #000)) {{
    .logo {{
      {var_tema}
    }}
  }}
</style>
'''


def svg_astro():
    defs = "\n    ".join(
        _grad("lg-" + k, k, "".join(
            '<stop offset="{}" style="stop-color:var(--lg-{}{})" />'.format(o, k, i)
            for i, o in enumerate(OFFS)))
        for k in ("b", "o"))
    corpo = "\n  ".join('<path fill="url(#lg-{})" d="{}" />'.format(c, d) for c, d in build())
    var_claro = "\n    ".join("--lg-{}{}: {};".format(k, i, c)
                              for k in ("b", "o") for i, c in enumerate(CLARO[k]))
    var_tema = "\n      ".join("--lg-{}{}: light-dark({}, {});".format(k, i, CLARO[k][i], ESCURO[k][i])
                               for k in ("b", "o") for i in range(3))
    return ASTRO.format(defs=defs, corpo=corpo, var_claro=var_claro, var_tema=var_tema)


SAIDAS = (
    ("public/img/logo.svg", lambda: svg_fixo(CLARO)),
    ("public/img/logo-escuro.svg", lambda: svg_fixo(ESCURO)),
    ("public/img/logo-mono.svg", svg_mono),
    ("public/favicon.svg", svg_auto),
    ("src/components/Logo.astro", svg_astro),
)


if __name__ == "__main__":
    raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for rel, fn in SAIDAS:
        conteudo = fn()
        caminho = os.path.join(raiz, *rel.split("/"))
        os.makedirs(os.path.dirname(caminho), exist_ok=True)
        with open(caminho, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(conteudo)
        print("{:6d} B  {}".format(len(conteudo), rel))
