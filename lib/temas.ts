// Temas que o cidadão pode seguir. Uma proposição entra num tema quando a ementa (resumo oficial) ou o
// apelido contém uma das palavras-chave — critério simples, público (página Metodologia) e sem escolha caso a caso.
// Uma proposição pode estar em vários temas. Os ids são fixos (usados nas inscrições de alerta): não reaproveitar.

export type Tema = { id: number; slug: string; nome: string; palavras: string[] };

export const TEMAS: Tema[] = [
  { id: 1, slug: "saude", nome: "Saúde", palavras: ["saude", "sus", "hospital", "medic", "vacina", "doenca", "sanitari", "enfermag", "odontolog", "farmac", "epidemi", "cancer"] },
  { id: 2, slug: "educacao", nome: "Educação", palavras: ["educac", "ensino", "escola", "escolar", "professor", "universidade", "estudant", "aluno", "enem", "fies", "creche", "pedagog", "alfabetiz"] },
  { id: 3, slug: "seguranca-publica", nome: "Segurança pública", palavras: ["seguranca publica", "policia", "policial", "crime", "criminal", "penal", "prisao", "prisional", "presidio", "violencia", "arma de fogo", "trafico", "guarda municipal", "homicidio"] },
  { id: 4, slug: "economia-e-tributos", nome: "Economia e tributos", palavras: ["tribut", "imposto", "fiscal", "orcament", "credito", "financeir", "banco central", "juros", "contribuicao social", "receita federal", "microempres", "simples nacional"] },
  { id: 5, slug: "trabalho-e-previdencia", nome: "Trabalho e previdência", palavras: ["trabalhador", "trabalhista", "consolidacao das leis do trabalho", "emprego", "salario", "sindica", "previdencia", "aposentadoria", "inss", "fgts", "seguro-desemprego"] },
  { id: 6, slug: "meio-ambiente", nome: "Meio ambiente", palavras: ["meio ambiente", "ambiental", "floresta", "desmatamento", "climatic", "clima", "poluicao", "saneamento", "recursos hidricos", "residuos", "biodiversidade", "unidade de conservacao"] },
  { id: 7, slug: "agropecuaria", nome: "Agropecuária", palavras: ["agropecuari", "agricultur", "agricola", "rural", "pecuari", "safra", "produtor rural", "reforma agraria", "agrotox", "defensivos agricolas"] },
  { id: 8, slug: "transporte-e-infraestrutura", nome: "Transporte e infraestrutura", palavras: ["transporte", "rodovia", "transito", "ferrovi", "aeroport", "portuari", "mobilidade urbana", "infraestrutura", "habitacao", "moradia", "obras publicas"] },
  { id: 9, slug: "tecnologia", nome: "Tecnologia", palavras: ["digital", "internet", "dados pessoais", "inteligencia artificial", "tecnologia", "telecomunica", "cibern", "software", "plataformas"] },
  { id: 10, slug: "direitos-e-cidadania", nome: "Direitos e cidadania", palavras: ["mulher", "crianca", "adolescente", "idoso", "pessoa com deficiencia", "pessoas com deficiencia", "igualdade", "discriminacao", "indigena", "quilombol", "direitos humanos", "racial"] },
  { id: 11, slug: "consumidor", nome: "Consumidor", palavras: ["consumidor", "procon", "relacoes de consumo", "plano de saude", "tarifa"] },
  { id: 12, slug: "cultura-e-esporte", nome: "Cultura e esporte", palavras: ["cultura", "cultural", "esporte", "desport", "turismo", "patrimonio historico", "artistic", "audiovisual"] },
  { id: 13, slug: "eleicoes-e-politica", nome: "Eleições e política", palavras: ["eleitoral", "eleicao", "eleicoes", "partido politico", "partidos politicos", "propaganda eleitoral", "inelegibilidade", "mandato eletivo"] },
  { id: 14, slug: "energia-e-mineracao", nome: "Energia e mineração", palavras: ["energia eletrica", "energia", "petroleo", "gas natural", "combustive", "mineracao", "minerari", "hidreletric", "biocombustive"] },
];

export const temaPorSlug = (slug: string) => TEMAS.find((t) => t.slug === slug) ?? null;
export const temaPorId = (id: number) => TEMAS.find((t) => t.id === id) ?? null;

/** Normaliza para comparação: minúsculas, sem acento, espaços simples. */
export function normalizarTexto(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ");
}

/** Ids dos temas de um texto (ementa/apelido). A palavra-chave precisa começar no início de uma palavra. */
export function temasDoTexto(texto: string | null | undefined): number[] {
  if (!texto) return [];
  const t = " " + normalizarTexto(texto).replace(/[^a-z0-9 -]/g, " ") + " ";
  return TEMAS.filter((tema) => tema.palavras.some((p) => t.includes(" " + p))).map((tema) => tema.id);
}
