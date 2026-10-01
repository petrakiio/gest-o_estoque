/* Gestão de Produtos - Vanilla JS */
const STORAGE_KEY = "gestao_produtos_v1";
let products = loadProducts();

const $ = id => document.getElementById(id);
const form = $("productForm");

function loadProducts(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch(e){ return []; }
}
function saveProducts(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(products)); }
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
function esc(value){
  return String(value ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
function num(v){ return Number(v || 0); }

function render(){
  const query = $("search").value.trim().toLowerCase();
  const filtered = products.filter(p =>
    p.produto.toLowerCase().includes(query) || p.fileira.toLowerCase().includes(query)
  );

  $("totalCount").textContent = products.length;
  $("stockCount").textContent = products.filter(p => p.estoque).length;
  $("catalogCount").textContent = products.filter(p => p.catalogo).length;
  $("lowCount").textContent = products.filter(p => num(p.quantidade) < num(p.minimo)).length;
  $("resultInfo").textContent = `${filtered.length} ${filtered.length === 1 ? "item" : "itens"}`;

  $("productTable").innerHTML = filtered.map(p => {
    const isLow = num(p.quantidade) < num(p.minimo);
    return `<tr>
      <td><span class="product-name">${esc(p.produto)}</span></td>
      <td>${esc(p.quantidade)}</td>
      <td>${esc(p.fileira || "—")}</td>
      <td>${esc(p.minimo)}</td>
      <td>${esc(p.maximo)}</td>
      <td><button class="badge ${p.estoque ? "ok" : "null"} status-toggle" title="Clique para alternar Estoque" onclick="toggleStatus('${p.id}','estoque')">${p.estoque ? "OK" : "null"}</button></td>
      <td><button class="badge ${p.catalogo ? "ok" : "null"} status-toggle" title="Clique para alternar Catálogo" onclick="toggleStatus('${p.id}','catalogo')">${p.catalogo ? "OK" : "null"}</button></td>
      <td>
        <button class="action" title="Editar" onclick="editProduct('${p.id}')">✎</button>
        <button class="action delete" title="Remover" onclick="removeProduct('${p.id}')">⌫</button>
      </td>
    </tr>`;
  }).join("");

  $("emptyState").style.display = filtered.length ? "none" : "block";
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const produto = $("produto").value.trim();
  const quantidade = $("quantidade").value;
  const minimo = $("minimo").value;
  const maximo = $("maximo").value;

  if(!produto || quantidade === "" || minimo === "" || maximo === "") return;
  if(num(maximo) < num(minimo)){ alert("O estoque máximo deve ser maior ou igual ao mínimo."); return; }

  const data = {
    produto,
    quantidade,
    fileira: $("fileira").value.trim(),
    minimo,
    maximo,
    estoque: $("estoque").checked,
    catalogo: $("catalogo").checked
  };
  const editId = $("editId").value;

  if(editId){
    const i = products.findIndex(p => p.id === editId);
    if(i >= 0) products[i] = {...products[i], ...data};
  } else {
    products.push({id:uid(), ...data});
  }
  saveProducts();
  resetForm();
  render();
});

function toggleStatus(id, field){
  const p = products.find(x => x.id === id);
  if(!p || !["estoque","catalogo"].includes(field)) return;
  p[field] = !Boolean(p[field]);
  saveProducts();
  render();
}

function editProduct(id){
  const p = products.find(x => x.id === id);
  if(!p) return;
  $("editId").value=p.id; $("produto").value=p.produto; $("quantidade").value=p.quantidade;
  $("fileira").value=p.fileira; $("minimo").value=p.minimo; $("maximo").value=p.maximo;
  $("estoque").checked=!!p.estoque; $("catalogo").checked=!!p.catalogo;
  $("formTitle").textContent="Editar produto"; $("saveBtn").textContent="Salvar alterações";
  $("cancelEdit").classList.remove("hidden");
  location.hash="cadastro"; $("produto").focus();
}
function removeProduct(id){
  const p=products.find(x=>x.id===id);
  if(p && confirm(`Remover "${p.produto}"?`)){
    products=products.filter(x=>x.id!==id); saveProducts(); render();
  }
}
function resetForm(){
  form.reset(); $("editId").value=""; $("formTitle").textContent="Cadastrar produto";
  $("saveBtn").textContent="Adicionar produto"; $("cancelEdit").classList.add("hidden");
}
$("cancelEdit").addEventListener("click", resetForm);
$("clearBtn").addEventListener("click", () => setTimeout(resetForm,0));
$("search").addEventListener("input", render);

async function copyTextReport(){
  if(!products.length){ alert("Cadastre pelo menos um produto antes de copiar."); return; }

  const headers = ["Produto","Quantidade","Fileira","Mínimo","Máximo","Estoque","Catalogo"];
  const lines = [headers.join("\t")];

  products.forEach(p => {
    lines.push([
      p.produto, p.quantidade, p.fileira || "",
      p.minimo, p.maximo,
      p.estoque ? "OK" : "null",
      p.catalogo ? "OK" : "null"
    ].map(v => String(v ?? "").replace(/[\r\n\t]+/g," ")).join("\t"));
  });

  const text = lines.join("\n");
  try {
    await navigator.clipboard.writeText(text);
    alert("Relatório copiado! Agora você pode colar no Excel, Word, WhatsApp ou outro aplicativo.");
  } catch(e) {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    alert("Relatório copiado para a área de transferência.");
  }
}
$("copyBtn").addEventListener("click", copyTextReport);

/* Exportação DOCX: 38 itens por lote, com cabeçalho repetido. */
$("exportBtn").addEventListener("click", exportDocx);

async function exportDocx(){
  if(!products.length){ alert("Cadastre pelo menos um produto antes de exportar."); return; }
  if(!window.docx){ alert("A biblioteca de exportação não foi carregada. Verifique sua conexão e tente novamente."); return; }

  const {Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType,
         HeadingLevel, TextRun, BorderStyle, VerticalAlign} = window.docx;

  const chunks=[];
  for(let i=0;i<products.length;i+=38) chunks.push(products.slice(i,i+38));

  const children=[];
  chunks.forEach((chunk, pageIndex) => {
    if(pageIndex>0) children.push(new Paragraph({pageBreakBefore:true, children:[]}));
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children:[new TextRun({text:"Tabela de Estoque", bold:true, size:28})],
      spacing:{after:80}
    }));
    children.push(new Paragraph({
      children:[new TextRun({text:`Lote ${pageIndex+1} • ${chunk.length} item(ns)`, size:18, color:"64748B"})],
      spacing:{after:180}
    }));

    const headers=["Produto","Quantidade","Fileira","Mín.","Máx.","Estoque","Catalogo"];
    const rows=[new TableRow({
      tableHeader:true,
      children:headers.map(h=>new TableCell({
        width:{size:1, type:WidthType.AUTO},
        shading:{fill:"E2E8F0"},
        verticalAlign:VerticalAlign.CENTER,
        children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:h,bold:true,size:16})]})]
      }))
    })];

    chunk.forEach(p=>{
      const vals=[p.produto,p.quantidade,p.fileira,p.minimo,p.maximo,p.estoque?"OK":"null",p.catalogo?"OK":"null"];
      rows.push(new TableRow({children:vals.map((v,idx)=>new TableCell({
        verticalAlign:VerticalAlign.CENTER,
        children:[new Paragraph({
          alignment: idx===0 ? AlignmentType.LEFT : AlignmentType.CENTER,
          children:[new TextRun({text:String(v ?? ""),size:15})]
        })]
      }))}));
    });

    children.push(new Table({
      width:{size:100,type:WidthType.PERCENTAGE},
      borders:{
        top:{style:BorderStyle.SINGLE,size:4,color:"CBD5E1"},
        bottom:{style:BorderStyle.SINGLE,size:4,color:"CBD5E1"},
        left:{style:BorderStyle.SINGLE,size:4,color:"CBD5E1"},
        right:{style:BorderStyle.SINGLE,size:4,color:"CBD5E1"},
        insideHorizontal:{style:BorderStyle.SINGLE,size:3,color:"E2E8F0"},
        insideVertical:{style:BorderStyle.SINGLE,size:3,color:"E2E8F0"}
      },
      rows
    }));
  });

  const doc=new Document({
    sections:[{
      properties:{page:{margin:{top:600,right:500,bottom:600,left:500}}},
      children
    }]
  });
  const blob=await Packer.toBlob(doc);
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=`relatorio_estoque_${new Date().toISOString().slice(0,10)}.docx`;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1500);
}

render();
