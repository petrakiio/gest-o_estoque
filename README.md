# Gestão de Produtos — Sistema Web

## Arquivos
- `index.html` — estrutura da aplicação.
- `style.css` — layout responsivo e visual do painel.
- `script.js` — cadastro, edição, remoção, localStorage e exportação DOCX.

## Como usar
1. Extraia o ZIP.
2. Abra `index.html` no Chrome, Edge ou outro navegador moderno.
3. Cadastre os produtos.
4. Os dados ficam salvos no `localStorage` deste navegador.
5. Clique em **Exportar Relatório (.docx)** para gerar o Word.

## Modelo utilizado
O Word de referência possui as colunas:
Produto | Quantidade | Fileira | Estoque | Catalogo

O sistema mantém esses campos e acrescenta **Estoque Mínimo** e **Estoque Máximo**, conforme solicitado. A exportação inclui todos os campos em uma tabela de relatório.

## Limite por lote
A exportação organiza os dados em lotes de até **38 produtos por página**, repetindo o cabeçalho. Se houver mais de 38 produtos, novas páginas são criadas automaticamente.

## Observação
A biblioteca `docx` é carregada pelo CDN jsDelivr, portanto a exportação requer conexão com a internet no momento da geração. O cadastro e o armazenamento local funcionam no navegador sem backend.


## Importação de tabelas
- **DOCX:** selecione um arquivo Word que contenha uma tabela; a primeira linha é interpretada como cabeçalho.
- **TXT/CSV/TSV:** a primeira linha deve conter os cabeçalhos. O sistema reconhece TAB, `;` ou `,`.
- Ao importar, o usuário escolhe entre substituir a lista atual ou adicionar os itens importados.
- Status `OK`, `true`, `1`, `sim` ou `x` são importados como verdadeiro; os demais valores iniciam como falso/null.
- Cabeçalhos reconhecidos: Produto, Quantidade, Fileira, Estoque, Catalogo/ Catálogo, Mínimo/Minimo e Máximo/Maximo.

## Exportações
- Word `.docx` — até 38 itens por lote/página.
- CSV completo `.csv`
- Produto + Fileira `.csv` — exporta somente o nome do produto e sua localização/fileira.
- TSV `.tsv`
- JSON `.json`
- XML `.xml`
- Texto copiado para a área de transferência.

## Bibliotecas
- `docx@8.5.0` para geração de Word.
- `mammoth@1.9.0` para leitura de tabelas DOCX.
Ambas são carregadas por CDN e o sistema informa caso a biblioteca não esteja disponível.


## Atualização — limpeza e importação por input
- **Limpar lista:** remove todos os produtos do `localStorage` após confirmação.
- **Importar tabela por texto:** permite colar diretamente uma tabela copiada do Excel, Word, TXT, CSV ou TSV e importar os produtos.
- A importação por texto mantém a opção de substituir a lista atual ou adicionar aos produtos existentes.


## Atualização v6 — alteração em lote de localização e importação com tratamento de repetidos
- O botão **Alterar localização** pede a localização atual e a nova localização e atualiza todos os produtos cuja coluna **Fileira** corresponda exatamente à localização informada, ignorando diferença entre maiúsculas/minúsculas e espaços nas pontas.
- Antes de alterar, mostra quantos produtos serão atualizados e pede confirmação.
- Na importação, escolha entre juntar e deduplicar, substituir e deduplicar, ou adicionar sem deduplicar. A identificação de repetidos usa nome do produto + fileira; os status positivos são preservados.


## Cadastro por voz (v8)
- Permite ditar um campo por vez ou informar vários campos na mesma frase.
- Exemplo para todos os campos: `produto: MTX-12, quantidade: 12, minimo: 12, maximo: 24, fileira: P1-02`.
- O sistema mostra uma pré-visualização editável e pede confirmação antes de cadastrar; o cadastro por voz inicia com Estoque e Catálogo desmarcados.
- Usa reconhecimento de voz do navegador (Web Speech API), recomendado em versões atuais do Chrome/Edge e com permissão de microfone. Se o reconhecimento não estiver disponível, é possível digitar a frase e clicar em “Interpretar texto”.


## Auto Mín./Máx. (v9)
- Na seção **Lista de regras para Auto Mín./Máx.**, cadastre uma regra por linha no formato `PREFIXO:mínimo,máximo`, por exemplo `MTX:12,24`.
- Salve a lista; as regras ficam armazenadas no navegador.
- No formulário, preencha o produto/código (por exemplo `MTX12-12`) e clique em **Auto Mín./Máx.**. O sistema usa as letras iniciais como prefixo e preenche os dois campos se existir regra correspondente.
- Se não houver regra para o prefixo, o sistema avisa e deixa os campos Mínimo e Máximo como estavam, sem preencher valores automaticamente.
- A validação da lista rejeita linhas em formato inválido e valores negativos, ou máximo menor que mínimo.
