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

/* Importação e exportação */
function normalizedHeader(h){
  return String(h || "").trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g,"");
}
function parseNumber(v){
  const s=String(v ?? "").trim().replace(/\s/g,"").replace(",",".");
  const n=Number(s);
  return Number.isFinite(n) ? n : 0;
}
function boolFrom(v){
  const s=String(v ?? "").trim().toLowerCase();
  return ["ok","true","1","sim","yes","x","✓","✔"].includes(s);
}
function mapImportedRow(row, headers){
  const get=(...names)=>{
    for(const n of names){
      const i=headers.indexOf(normalizedHeader(n));
      if(i>=0) return row[i] ?? "";
    }
    return "";
  };
  const produto=String(get("Produto","Nome")).trim();
  if(!produto) return null;
  return {
    id:uid(),
    produto,
    quantidade:String(get("Quantidade","Qtd")).trim() || "0",
    fileira:String(get("Fileira")).trim(),
    minimo:String(get("Mínimo","Minimo","Estoque Mínimo","Estoque Minimo","Limite Mínimo","Limite Minimo")).trim() || "0",
    maximo:String(get("Máximo","Maximo","Estoque Máximo","Estoque Maximo","Limite Máximo","Limite Maximo")).trim() || "0",
    estoque:boolFrom(get("Estoque")),
    catalogo:boolFrom(get("Catalogo","Catálogo"))
  };
}
function splitDelimited(text, delimiter){
  return text.split(/\r?\n/).map(line=>{
    if(!line.trim()) return [];
    const out=[]; let cur="", quoted=false;
    for(let i=0;i<line.length;i++){
      const c=line[i];
      if(c==='"'){
        if(quoted && line[i+1]==='"'){cur+='"';i++}
        else quoted=!quoted;
      } else if(c===delimiter && !quoted){out.push(cur);cur=""}
      else cur+=c;
    }
    out.push(cur);
    return out.map(x=>x.trim());
  }).filter(r=>r.length && r.some(x=>x));
}
function parseTextTable(text){
  const lines=text.replace(/^\uFEFF/,"").trim();
  if(!lines) return [];
  let delimiter="\t";
  const first=lines.split(/\r?\n/)[0];
  if(first.includes("\t")) delimiter="\t";
  else if(first.includes(";")) delimiter=";";
  else if(first.includes(",")) delimiter=",";
  else delimiter=/\s{2,}/.test(first) ? "  " : "\t";
  let rows=delimiter==="  " ? lines.split(/\r?\n/).map(x=>x.split(/\s{2,}/).map(y=>y.trim())) : splitDelimited(lines,delimiter);
  if(rows.length<2) return [];
  const headers=rows[0].map(normalizedHeader);
  return rows.slice(1).map(r=>mapImportedRow(r,headers)).filter(Boolean);
}
async function importDocx(file){
  if(!window.mammoth) throw new Error("A biblioteca de leitura DOCX não foi carregada.");
  const arrayBuffer=await file.arrayBuffer();
  const result=await mammoth.convertToHtml({arrayBuffer});
  const doc=document.createElement("div");
  doc.innerHTML=result.value;
  const table=doc.querySelector("table");
  if(!table) throw new Error("Nenhuma tabela foi encontrada no DOCX.");
  const rows=[...table.querySelectorAll("tr")].map(tr=>[...tr.querySelectorAll("th,td")].map(td=>td.textContent.trim()));
  if(rows.length<2) return [];
  const headers=rows[0].map(normalizedHeader);
  return rows.slice(1).map(r=>mapImportedRow(r,headers)).filter(Boolean);
}
function normalizeLocationKey(value){
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ');
}
function productKey(p){ return `${normalizeLocationKey(p.produto)}||${normalizeLocationKey(p.fileira)}`; }
function dedupeProducts(list){
  const map=new Map(); let duplicates=0;
  for(const raw of list){
    const p={...raw,id:raw.id||uid()}, key=productKey(p);
    if(!map.has(key)){map.set(key,p);continue;}
    duplicates++; const old=map.get(key);
    map.set(key,{...old,...p,id:old.id,
      quantidade:(p.quantidade!==undefined&&String(p.quantidade)!=='')?p.quantidade:old.quantidade,
      minimo:(p.minimo!==undefined&&String(p.minimo)!=='')?p.minimo:old.minimo,
      maximo:(p.maximo!==undefined&&String(p.maximo)!=='')?p.maximo:old.maximo,
      estoque:Boolean(old.estoque||p.estoque),catalogo:Boolean(old.catalogo||p.catalogo)});
  }
  return {items:[...map.values()],duplicates};
}
function chooseImportMode(){
  const answer=prompt('Como deseja importar?\n\n1 = Juntar com a lista atual e remover repetidos (recomendado)\n2 = Substituir a lista atual (removendo repetidos)\n3 = Adicionar tudo sem remover repetidos\n\nDigite 1, 2 ou 3:','1');
  if(answer===null)return null; const mode=answer.trim();
  if(!['1','2','3'].includes(mode)){alert('Opção inválida. Importação cancelada.');return null;} return mode;
}
function applyImport(imported){
  const mode=chooseImportMode(); if(mode===null)return false; let duplicates=0;
  if(mode==='1'){const result=dedupeProducts([...products,...imported]);products=result.items;duplicates=result.duplicates;}
  else if(mode==='2'){const result=dedupeProducts(imported);products=result.items;duplicates=result.duplicates;}
  else products=[...products,...imported.map(p=>({...p,id:p.id||uid()}))];
  saveProducts();render();
  alert(`Importação concluída.\nProdutos lidos: ${imported.length}\nDuplicados consolidados: ${duplicates}\nTotal na lista: ${products.length}`); return true;
}

async function importFile(file){
  try{
    const ext=file.name.toLowerCase().split(".").pop();
    let imported=[];
    if(ext==="docx") imported=await importDocx(file);
    else imported=parseTextTable(await file.text());
    if(!imported.length){ alert("Não foi possível encontrar produtos na tabela. Confira se a primeira linha contém os cabeçalhos Produto, Quantidade, Fileira, Estoque, Catalogo e, opcionalmente, Mínimo/Máximo."); return; }
    applyImport(imported);
  }catch(err){
    console.error(err);
    alert("Erro ao importar: "+(err.message || err));
  }finally{
    $("importFile").value="";
  }
}
$("importFile").addEventListener("change",e=>{
  const file=e.target.files?.[0];
  if(file) importFile(file);
});

// Altera em lote a localização (campo Fileira) de todos os produtos que correspondam à origem.
$('changeLocationBtn').addEventListener('click',()=>{
  if(!products.length){ alert('Não há produtos cadastrados para alterar.'); return; }
  const oldLocation=prompt('Digite a localização que deseja mudar (ex.: P1-02):');
  if(oldLocation===null) return;
  const from=oldLocation.trim();
  if(!from){ alert('Informe a localização atual.'); return; }
  const newLocation=prompt('Digite a nova localização (ex.: P1-03):');
  if(newLocation===null) return;
  const to=newLocation.trim();
  if(!to){ alert('Informe a nova localização.'); return; }
  if(from.toLowerCase()===to.toLowerCase()){ alert('A localização nova é igual à atual. Nenhuma alteração foi feita.'); return; }
  const matches=products.filter(p=>String(p.fileira||'').trim().toLowerCase()===from.toLowerCase());
  if(!matches.length){ alert(`Nenhum produto encontrado na localização "${from}".`); return; }
  if(!confirm(`Alterar a localização de ${matches.length} produto(s) de "${from}" para "${to}"?`)) return;
  matches.forEach(p=>{ p.fileira=to; });
  saveProducts(); render();
  alert(`${matches.length} produto(s) atualizado(s): "${from}" → "${to}".`);
});

$('clearListBtn').addEventListener('click',()=>{
  if(!products.length){alert('A lista de produtos já está vazia.');return;}
  if(!confirm(`Tem certeza que deseja apagar os ${products.length} produto(s) cadastrados?\n\nEssa ação remove os dados salvos neste navegador.`)) return;
  products=[]; saveProducts(); resetForm(); render(); alert('Lista de produtos limpa com sucesso.');
});
$('importInputBtn').addEventListener('click',()=>{
  const text=$('tableInput').value.trim();
  if(!text){alert('Cole uma tabela no campo antes de importar.');return;}
  try{
    const imported=parseTextTable(text);
    if(!imported.length){alert('Não foi possível encontrar produtos. A primeira linha deve conter os cabeçalhos, por exemplo: Produto, Quantidade, Fileira, Estoque, Catalogo, Mínimo e Máximo.');return;}
    if(applyImport(imported)) $('tableInput').value='';
  }catch(err){console.error(err);alert('Erro ao importar a tabela: '+(err.message||err));}
});
$('clearInputBtn').addEventListener('click',()=>$('tableInput').value='');

function exportRows(){
  return products.map(p=>({
    Produto:p.produto, Quantidade:p.quantidade, Fileira:p.fileira || "",
    Minimo:p.minimo, Maximo:p.maximo, Estoque:p.estoque ? "OK":"null", Catalogo:p.catalogo ? "OK":"null"
  }));
}
function downloadBlob(content, filename, type){
  const blob=new Blob([content],{type});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function csvEscape(v){
  const s=String(v ?? "");
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
}
function exportCSV(){
  if(!products.length){alert("Cadastre pelo menos um produto antes de exportar.");return;}
  const rows=exportRows(), head=Object.keys(rows[0]);
  downloadBlob([head.join(","),...rows.map(r=>head.map(k=>csvEscape(r[k])).join(","))].join("\r\n"),
    `relatorio_estoque_${new Date().toISOString().slice(0,10)}.csv`,"text/csv;charset=utf-8");
}
function exportProductLocation(){
  if(!products.length){alert("Cadastre pelo menos um produto antes de exportar.");return;}
  const rows=products.map(p=>({Produto:p.produto || "", Fileira:p.fileira || ""}));
  const csv=["Produto,Fileira",...rows.map(r=>[r.Produto,r.Fileira].map(csvEscape).join(","))].join("\r\n");
  downloadBlob("\uFEFF"+csv,`produtos_fileiras_${new Date().toISOString().slice(0,10)}.csv`,"text/csv;charset=utf-8");
}
function exportTSV(){
  if(!products.length){alert("Cadastre pelo menos um produto antes de exportar.");return;}
  const rows=exportRows(), head=Object.keys(rows[0]);
  downloadBlob([head.join("\t"),...rows.map(r=>head.map(k=>String(r[k]??"").replace(/[\t\r\n]+/g," ")).join("\t"))].join("\r\n"),
    `relatorio_estoque_${new Date().toISOString().slice(0,10)}.tsv`,"text/tab-separated-values;charset=utf-8");
}
function exportJSON(){
  if(!products.length){alert("Cadastre pelo menos um produto antes de exportar.");return;}
  downloadBlob(JSON.stringify(exportRows(),null,2),
    `relatorio_estoque_${new Date().toISOString().slice(0,10)}.json`,"application/json;charset=utf-8");
}
function xmlEscape(v){
  return String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
}
function exportXML(){
  if(!products.length){alert("Cadastre pelo menos um produto antes de exportar.");return;}
  const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<produtos>\n${exportRows().map(r=>`  <produto>\n${Object.entries(r).map(([k,v])=>`    <${k.toLowerCase()}>${xmlEscape(v)}</${k.toLowerCase()}>`).join("\n")}\n  </produto>`).join("\n")}\n</produtos>`;
  downloadBlob(xml,`relatorio_estoque_${new Date().toISOString().slice(0,10)}.xml`,"application/xml;charset=utf-8");
}
$("exportCsvBtn").addEventListener("click",exportCSV);
$("exportProductLocationBtn").addEventListener("click",exportProductLocation);
$("exportTsvBtn").addEventListener("click",exportTSV);
$("exportJsonBtn").addEventListener("click",exportJSON);
$("exportXmlBtn").addEventListener("click",exportXML);

async function copyTextReport(){
  if(!products.length){ alert("Cadastre pelo menos um produto antes de copiar."); return; }
  const rows=exportRows(), headers=Object.keys(rows[0]);
  const text=[headers.join("\t"),...rows.map(r=>headers.map(k=>String(r[k]??"").replace(/[\r\n\t]+/g," ")).join("\t"))].join("\n");
  try{ await navigator.clipboard.writeText(text); }
  catch(e){
    const area=document.createElement("textarea"); area.value=text; area.style.position="fixed"; area.style.left="-9999px";
    document.body.appendChild(area); area.select(); document.execCommand("copy"); area.remove();
  }
  alert("Relatório copiado para a área de transferência.");
}
$("copyBtn").addEventListener("click",copyTextReport);

/* Exportação DOCX: 38 itens por lote. */
$("exportBtn").addEventListener("click",exportDocx);
async function exportDocx(){
  if(!products.length){alert("Cadastre pelo menos um produto antes de exportar.");return;}
  if(!window.docx){alert("A biblioteca Word não foi carregada. Verifique a conexão e tente novamente.");return;}
  const {Document,Packer,Paragraph,Table,TableRow,TableCell,WidthType,AlignmentType,HeadingLevel,TextRun,BorderStyle,VerticalAlign}=window.docx;
  const chunks=[]; for(let i=0;i<products.length;i+=38) chunks.push(products.slice(i,i+38));
  const children=[];
  chunks.forEach((chunk,pageIndex)=>{
    if(pageIndex) children.push(new Paragraph({pageBreakBefore:true,children:[]}));
    children.push(new Paragraph({heading:HeadingLevel.HEADING_1,children:[new TextRun({text:"Tabela de Estoque",bold:true,size:28})],spacing:{after:80}}));
    children.push(new Paragraph({children:[new TextRun({text:`Lote ${pageIndex+1} • ${chunk.length} item(ns)`,size:18,color:"64748B"})],spacing:{after:180}}));
    const headers=["Produto","Quantidade","Fileira","Mín.","Máx.","Estoque","Catalogo"];
    const rows=[new TableRow({tableHeader:true,children:headers.map(h=>new TableCell({shading:{fill:"E2E8F0"},verticalAlign:VerticalAlign.CENTER,children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:h,bold:true,size:16})]})]}))})];
    chunk.forEach(p=>{
      const vals=[p.produto,p.quantidade,p.fileira,p.minimo,p.maximo,p.estoque?"OK":"null",p.catalogo?"OK":"null"];
      rows.push(new TableRow({children:vals.map((v,i)=>new TableCell({verticalAlign:VerticalAlign.CENTER,children:[new Paragraph({alignment:i===0?AlignmentType.LEFT:AlignmentType.CENTER,children:[new TextRun({text:String(v??""),size:15})]})]}))}));
    });
    children.push(new Table({width:{size:100,type:WidthType.PERCENTAGE},borders:{top:{style:BorderStyle.SINGLE,size:4,color:"CBD5E1"},bottom:{style:BorderStyle.SINGLE,size:4,color:"CBD5E1"},left:{style:BorderStyle.SINGLE,size:4,color:"CBD5E1"},right:{style:BorderStyle.SINGLE,size:4,color:"CBD5E1"},insideHorizontal:{style:BorderStyle.SINGLE,size:3,color:"E2E8F0"},insideVertical:{style:BorderStyle.SINGLE,size:3,color:"E2E8F0"}},rows}));
  });
  try{
    const doc=new Document({sections:[{properties:{page:{margin:{top:600,right:500,bottom:600,left:500}}},children}]});
    const blob=await Packer.toBlob(doc);
    downloadBlob(blob,`relatorio_estoque_${new Date().toISOString().slice(0,10)}.docx`,"application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  }catch(err){console.error(err);alert("Não foi possível gerar o Word: "+(err.message||err));}
}


// Cadastro por voz com pré-visualização obrigatória antes de salvar.
const voiceFieldIds = {produto:"voiceProduto", quantidade:"voiceQuantidade", fileira:"voiceFileira", minimo:"voiceMinimo", maximo:"voiceMaximo"};
const voiceLabels = {produto:"produto", quantidade:"quantidade", fileira:"fileira", minimo:"mínimo", maximo:"máximo"};
function normalizeSpeech(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();}
function parseVoiceData(text, mode){
  const result={produto:"",quantidade:"",fileira:"",minimo:"",maximo:""};
  const source=String(text||"").replace(/[\n;]+/g,",");
  if(mode==="single"){
    const field=$("voiceField").value;
    let value=source.trim();
    const colon=value.indexOf(":"); if(colon>=0)value=value.slice(colon+1).trim();
    result[field]=value.replace(/^['"]|['"]$/g,"").trim();
    return result;
  }
  const chunks=source.split(",").map(x=>x.trim()).filter(Boolean);
  chunks.forEach(chunk=>{
    const parts=chunk.match(/^(produto|nome do produto|nome|quantidade|qtd|fileira|localização|localizacao|estoque\s+mínimo|estoque\s+minimo|mínimo|minimo|estoque\s+máximo|estoque\s+maximo|máximo|maximo)\s*(?::|=)?\s*(.*)$/i);
    if(!parts)return;
    const key=normalizeSpeech(parts[1]); let field=null;
    if(key.includes("produto")||key==="nome")field="produto";
    else if(key==="quantidade"||key==="qtd")field="quantidade";
    else if(key==="fileira"||key.includes("localizacao"))field="fileira";
    else if(key.includes("minimo"))field="minimo";
    else if(key.includes("maximo"))field="maximo";
    if(field)result[field]=parts[2].replace(/^['"]|['"]$/g,"").trim();
  });
  return result;
}
function showVoicePreview(data){
  Object.entries(voiceFieldIds).forEach(([field,id])=>{if(data[field]!==undefined && data[field]!=="")$(id).value=data[field];});
  $("voicePreview").classList.remove("hidden");
  $("voicePreview").scrollIntoView({behavior:"smooth",block:"nearest"});
}
function interpretVoice(){
  const text=$("voiceTranscript").value.trim();
  if(!text){$("voiceStatus").textContent="Nenhum texto foi reconhecido. Fale pelo microfone ou digite a frase no campo acima.";return;}
  const data=parseVoiceData(text,$("voiceMode").value);
  if(!Object.values(data).some(v=>String(v).trim()!=="")){$("voiceStatus").textContent="Não consegui identificar os campos. Use: produto: MTX-12, quantidade: 12, minimo: 12, maximo: 24.";return;}
  showVoicePreview(data);
  const missing=Object.entries(voiceFieldIds).filter(([field])=>!String($(voiceFieldIds[field]).value||"").trim()).map(([field])=>voiceLabels[field]);
  $("voiceStatus").textContent="Interpretação pronta. Confira os campos abaixo; nada foi cadastrado ainda."+(missing.length?" Campos ainda vazios: "+missing.join(", ")+".":"");
}
$("voiceMode").addEventListener("change",()=>{
  $("voiceFieldWrap").classList.toggle("hidden",$("voiceMode").value!=="single");
  $("voiceTranscript").value=""; $("voicePreview").classList.add("hidden");
  $("voiceStatus").textContent=$("voiceMode").value==="single"?"Escolha o campo e dite somente o valor dele.":"Dite os campos com seus nomes, por exemplo: produto: MTX-12, quantidade: 12, minimo: 12, maximo: 24.";
});
$("parseVoiceBtn").addEventListener("click",interpretVoice);
$("startVoiceBtn").addEventListener("click",()=>{
  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SpeechRecognition){$("voiceStatus").textContent="Este navegador não oferece reconhecimento de voz. Use uma versão atual do Google Chrome ou Microsoft Edge; você também pode digitar a frase e clicar em Interpretar texto.";return;}
  const recognition=new SpeechRecognition(); recognition.lang="pt-BR"; recognition.interimResults=false; recognition.maxAlternatives=1;
  $("startVoiceBtn").disabled=true; $("voiceStatus").textContent="Ouvindo… fale agora. O navegador pode solicitar acesso ao microfone.";
  recognition.onresult=event=>{$("voiceTranscript").value=event.results[0][0].transcript;interpretVoice();};
  recognition.onerror=event=>{$("voiceStatus").textContent="Não foi possível reconhecer a fala ("+event.error+"). Confira a permissão do microfone ou digite o texto manualmente.";};
  recognition.onend=()=>{$("startVoiceBtn").disabled=false;};
  try{recognition.start();}catch(err){$("voiceStatus").textContent="Não foi possível iniciar o microfone. Tente novamente.";$("startVoiceBtn").disabled=false;}
});
$("confirmVoiceBtn").addEventListener("click",()=>{
  const data={produto:$("voiceProduto").value.trim(),quantidade:$("voiceQuantidade").value,fileira:$("voiceFileira").value.trim(),minimo:$("voiceMinimo").value,maximo:$("voiceMaximo").value};
  if(!data.produto||data.quantidade===""||data.minimo===""||data.maximo===""){alert("Confira a interpretação: Produto, Quantidade, Estoque mínimo e Estoque máximo são obrigatórios.");return;}
  if([data.quantidade,data.minimo,data.maximo].some(v=>!Number.isFinite(Number(v))||Number(v)<0)){alert("Quantidade, mínimo e máximo devem ser números iguais ou maiores que zero.");return;}
  if(Number(data.maximo)<Number(data.minimo)){alert("O estoque máximo deve ser maior ou igual ao mínimo.");return;}
  if(!confirm(`Confirma cadastrar este produto?\n\nProduto: ${data.produto}\nQuantidade: ${data.quantidade}\nFileira: ${data.fileira||"(não informada)"}\nMínimo: ${data.minimo}\nMáximo: ${data.maximo}\n\nConfira os dados antes de confirmar.`))return;
  products.push({id:uid(),...data,estoque:false,catalogo:false}); saveProducts(); render();
  Object.values(voiceFieldIds).forEach(id=>$(id).value=""); $("voiceTranscript").value=""; $("voicePreview").classList.add("hidden");
  $("voiceStatus").textContent="Produto cadastrado com sucesso. Você pode iniciar outro cadastro por voz.";
});
$("cancelVoiceBtn").addEventListener("click",()=>{$("voicePreview").classList.add("hidden");$("voiceStatus").textContent="Pré-visualização cancelada. Nenhum produto foi cadastrado.";});

render();
