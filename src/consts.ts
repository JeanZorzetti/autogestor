/** Dados de NAP (nome/endereço/telefone). Ficam num lugar só porque saem em três
 *  lugares — rodapé, JSON-LD e página de contato — e divergir entre eles é o
 *  erro clássico que derruba SEO local. */
export const EMPRESA = {
  nome: "Autogestor",
  nomeLegal: "Grupo Autogestor Adm de Serviços — Seguros, Financiamentos e Turismo",
  fundacao: "2004",
  susep: "202070004",
  telefone: "+5562982622220",
  telefoneExibicao: "(62) 98262-2220",
  email: "atendimento@autogestor.com.br",
  endereco: {
    rua: "Av. Itália, 1326",
    bairro: "Jardim Europa",
    cidade: "Goiânia",
    uf: "GO",
    cep: "74325-110",
    pais: "BR",
  },
  geo: { lat: -16.7089, lon: -49.2325 },
  redes: [
    "https://www.instagram.com/autogestorseguros/",
    "https://www.facebook.com/autogestorseguros/",
    "https://twitter.com/autogestors",
  ],
} as const;

export const enderecoLinha = `${EMPRESA.endereco.rua} — ${EMPRESA.endereco.bairro}, ${EMPRESA.endereco.cidade}/${EMPRESA.endereco.uf}, CEP ${EMPRESA.endereco.cep}`;

/** Link de WhatsApp com mensagem pronta. O contexto no texto poupa a primeira
 *  pergunta do atendente — é o passo que o formulário de 3 campos economizou. */
export function whatsapp(mensagem: string): string {
  return `https://wa.me/${EMPRESA.telefone.replace("+", "")}?text=${encodeURIComponent(mensagem)}`;
}

/** Destinos externos que já operam hoje. Mantidos fora das páginas para não
 *  caçar URL em 6 arquivos quando um parceiro trocar de link. */
export const EXTERNOS = {
  cotacaoVeiculo: "https://www.corretor-online.com.br/canalcliente/index.htm?Pw=WUtjNkJwM05vNC9iZ1RhblcyT3RMUT09",
  cotacaoMoto: "https://www.corretor-online.com.br/canalcliente/index.htm?Pw=bkZCWmtZUHRFZE00ZTdtZml6bkV1QT09",
  cotacaoCaminhao: "https://www.corretor-online.com.br/canalcliente/index.htm?Pw=QlhjVzV2QjlKdjFHc05ua1ZSU2YrUT09",
  agenciaViagens: "https://br.onertravel.com/autogestorviagens/home",
  coopluz: "https://coopluz.eco.br/",
} as const;
