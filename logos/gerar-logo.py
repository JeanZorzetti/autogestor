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


def afila(s, inicio, expoente):
    """1 ate `inicio`, caindo a 0 em s=1.

    O max(0, ...) nao e paranoia: em s=1 a divisao da -2e-16 por arredondamento,
    e em Python base negativa elevada a expoente fracionario devolve um COMPLEXO
    em vez de estourar — as coordenadas viram lixo silenciosamente.
    """
    if s <= inicio:
        return 1.0
    return max(0.0, 1.0 - (s - inicio) / (1.0 - inicio)) ** expoente


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
# Amplitude do hexagono: 4,0% do raio, o harmonico de cos(6t) medido no original.
HEX = 0.040


def _ring_r(s, th):
    """Raio pelo angulo ABSOLUTO, nao pelo parametro do arco — senao os dois
    arcos decaem em ritmos diferentes e abre um degrau na emenda."""
    return RHO * math.exp(-0.05 * (th - A_RING) / 360.0)


def ring_blue():
    def wfn(s):                       # cinzel na cabeca, o pico do topo
        return 0.5 * THK * (0.62 + 0.38 * min(1.0, s / 0.09))
    return sample(A_RING, 250, _ring_r, wfn, HEX, 30)


def ring_orange():
    def wfn(s):                       # afila ate a ponta que fecha o vortice
        return 0.5 * THK * afila(s, 0.70, 0.85)
    # Comeca em 300 e nao em 330: o corte reto da traseira precisa cair onde a
    # rampa "oa" ja e azul puro, senao ele mesmo vira a aresta que veio evitar.
    return sample(A_RING + 208, 148, _ring_r, wfn, HEX, 26)


# --- bracos -----------------------------------------------------------------
def arm(a0):
    r0, r1, wmax, sweep = 0.250 * R, 0.680 * R, 0.108 * R, 205
    k = math.log(r1 / r0)
    # Lente: espessura zero nas duas pontas, cheia no meio. Expoente acima de 1
    # alonga o afilamento — no original as pontas sao laminas, nao dedos.
    wfn = lambda s: wmax * math.sin(math.pi * s) ** 1.35
    return sample(a0, sweep, lambda s, th: r0 * math.exp(k * s), wfn, 0.012, 30)


def build():
    """[(rampa, d)] — a distribuicao azul/laranja segue a medida no PNG original.

    O anel laranja usa a rampa "oa", que apaga no rabo: no original ele nao
    encosta no azul, dissolve nele entre 320 e 0 graus.
    """
    return [("b", d_of(*ring_blue())), ("oa", d_of(*ring_orange())),
            ("b", d_of(*arm(62))), ("o", d_of(*arm(182))), ("b", d_of(*arm(302)))]


# ---------------------------------------------------------------- saidas

# O degrade e VERTICAL e GLOBAL, nao um por caminho: medindo o PNG original, a
# cor de qualquer pixel depende so da altura dele na marca — anel e bracos
# seguem a mesma rampa. Por isso userSpaceOnUse com o mesmo eixo em todos.
Y0, Y1 = 5.0, 95.0

# Rampas: (offset, chave-de-cor). Offsets vieram da leitura do original faixa a
# faixa (#006bb6 no topo, #002b74 embaixo, no azul).
RAMPAS = {
    "b": (("0", "b0"), (".28", "b1"), (".62", "b2"), ("1", "b3")),
    "o": (("0", "o0"), (".45", "o1"), ("1", "o2")),
}

# Anel laranja: fracao de laranja sobre azul ao longo do mesmo eixo vertical.
# No original ele nao encosta no azul, dissolve nele — #ff8d36 puro no topo,
# #a86d61 na altura de 0 grau, #4c5375 a 340, azul limpo a 320. Mistura opaca e
# nao opacidade: no trecho de baixo o laranja e a unica camada ali, entao
# transparencia deixaria o fundo aparecer em vez do azul.
OA = ((0.0, 1.0), (.20, 1.0), (.34, .93), (.50, .75), (.66, .37), (.79, .05),
      (.87, 0.0), (1.0, 0.0))

# Claro: valores lidos do original — os tokens da paleta (#005ca6, #002b74,
# #e47a45) sairam dele, entao caem quase em cima.
CLARO = {"b0": "#006bb6", "b1": "#0057a6", "b2": "#0b3c82", "b3": "#002b74",
         "o0": "#f2813b", "o1": "#e47a45", "o2": "#d26831"}
# Escuro: a mesma rampa levantada para a familia do --marca do tema escuro. Os
# azuis do claro afundam no #060d19; o degrade continua claro em cima, escuro
# embaixo, so que dentro de uma faixa que ainda contrasta com o fundo.
ESCURO = {"b0": "#a9cdff", "b1": "#7fb2f6", "b2": "#5c93e4", "b3": "#4681d2",
          "o0": "#f9a273", "o1": "#ef8a5c", "o2": "#de7141"}

HEAD = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" '
        'role="img" aria-label="Autogestor">')


def _grad(gid, stops):
    return ('<linearGradient id="{}" gradientUnits="userSpaceOnUse" '
            'x1="0" y1="{}" x2="0" y2="{}">{}</linearGradient>'.format(gid, Y0, Y1, stops))


def _rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def _hex(c):
    return "#" + "".join("{:02x}".format(max(0, min(255, int(round(v))))) for v in c)


def _em(paradas, t):
    """Cor de uma rampa ja resolvida no offset t."""
    for i in range(len(paradas) - 1):
        o0, c0 = paradas[i]
        o1, c1 = paradas[i + 1]
        if o0 <= t <= o1:
            f = 0.0 if o1 == o0 else (t - o0) / (o1 - o0)
            return tuple(a + (b - a) * f for a, b in zip(_rgb(c0), _rgb(c1)))
    return _rgb(paradas[-1][1])


def paradas(pal):
    """{rampa: [(offset, hex)]} — inclui a "oa", misturada laranja sobre azul."""
    res = {k: [(float(o), pal[c]) for o, c in RAMPAS[k]] for k in RAMPAS}
    res["oa"] = [(t, _hex([o * f + b * (1 - f) for o, b in
                           zip(_em(res["o"], t), _em(res["b"], t))]))
                 for t, f in OA]
    return res


def _stops(lista, attr):
    return "".join('<stop offset="{}" {}/>'.format(_num(o), attr(i, c))
                   for i, (o, c) in enumerate(lista))


def _num(o):
    return "{:.3g}".format(o)


def svg_fixo(pal):
    p = paradas(pal)
    defs = "".join(_grad(k, _stops(p[k], lambda i, c: 'stop-color="{}"'.format(c))) for k in p)
    corpo = "".join('<path fill="url(#{})" d="{}"/>'.format(c, d) for c, d in build())
    return HEAD + "<defs>" + defs + "</defs>" + corpo + "</svg>"


def svg_mono():
    corpo = "".join('<path fill="currentColor" d="{}"/>'.format(d) for _, d in build())
    return HEAD + corpo + "</svg>"


def svg_auto():
    """Arquivo unico que troca sozinho no prefers-color-scheme (favicon, e-mail)."""
    claro, escuro = paradas(CLARO), paradas(ESCURO)

    def regras(p):
        return "".join("#s{}{}{{stop-color:{}}}".format(k, i, c)
                       for k in p for i, (_, c) in enumerate(p[k]))
    css = regras(claro) + "@media(prefers-color-scheme:dark){" + regras(escuro) + "}"
    # stop-color tambem como atributo: cliente que descarta o <style> (e-mail
    # faz isso) cairia para preto em vez de ficar na versao clara.
    defs = "".join(
        _grad("g" + k, _stops(claro[k],
                              lambda i, c, k=k: 'id="s{}{}" stop-color="{}"'.format(k, i, c)))
        for k in claro)
    corpo = "".join('<path fill="url(#g{})" d="{}"/>'.format(c, d) for c, d in build())
    return HEAD + "<style>" + css + "</style><defs>" + defs + "</defs>" + corpo + "</svg>"


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
    claro, escuro = paradas(CLARO), paradas(ESCURO)
    defs = "\n    ".join(
        _grad("lg-" + k, _stops(claro[k], lambda i, c, k=k: 'style="stop-color:var(--lg-{}{})"'.format(k, i)))
        for k in claro)
    corpo = "\n  ".join('<path fill="url(#lg-{})" d="{}" />'.format(c, d) for c, d in build())
    nomes = [(k, i) for k in claro for i in range(len(claro[k]))]
    var_claro = "\n    ".join(
        "--lg-{}{}: {};".format(k, i, claro[k][i][1]) for k, i in nomes)
    var_tema = "\n      ".join(
        "--lg-{}{}: light-dark({}, {});".format(k, i, claro[k][i][1], escuro[k][i][1])
        for k, i in nomes)
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
