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


## Atualização — exportação em texto e status rápidos
- O botão **Copiar relatório (texto)** copia uma tabela separada por TAB, ideal para colar diretamente no Excel, Word ou outros aplicativos.
- **Estoque** e **Catálogo** começam como `false` (exibidos como `null`) no cadastro.
- Na tabela de produtos, basta clicar no badge `null`/`OK` para alternar o status sem abrir a edição.
- A alteração é salva imediatamente no `localStorage`.
