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
- CSV `.csv`
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
