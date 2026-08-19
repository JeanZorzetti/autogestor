/** O markdown gera `<th>` sem `scope`. Sem o atributo, o leitor de tela lê
 *  "Nenhum" numa tabela comparativa sem dizer de qual coluna a célula é — e a
 *  comparação, que é o ativo do post, vira ruído. Toda `<th>` que o markdown
 *  emite vem do cabeçalho, então `scope="col"` é sempre a resposta certa.
 *
 *  Plugin em vez de HTML cru dentro do .md porque o cluster ainda vai crescer:
 *  a tabela do próximo post nasce correta sem ninguém lembrar do atributo.
 *
 *  ponytail: só cabeçalho de coluna. Tabela que precise de `scope="row"` (a
 *  primeira coluna virando cabeçalho de linha) pede `<th scope="row">` escrito
 *  à mão no markdown — adivinhar isso pela posição erra no primeiro caso em que
 *  a primeira coluna for dado, e não rótulo.
 *
 *  Caminhada manual na árvore: `unist-util-visit` faria o mesmo em uma linha,
 *  mas seria uma dependência a mais para oito linhas de recursão.
 */
export function escopoDeCabecalho() {
  return (arvore) => {
    const andar = (no) => {
      // Só preenche o que falta: `scope="row"` escrito à mão no markdown é a
      // saída para tabela com cabeçalho de linha, e sobrescrevê-lo a fecharia.
      if (no.tagName === "th" && !no.properties?.scope) {
        no.properties = { ...no.properties, scope: "col" };
      }
      for (const filho of no.children ?? []) andar(filho);
    };
    andar(arvore);
    return arvore;
  };
}
