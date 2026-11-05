/* Importação CSV e mapeamento — compartilha a mesma lista do index.html. */
const PRODUCTS_KEY = "gestao_produtos_v1";
const PENDING_KEY = "gestao_produtos_csv_pending_v1";
const COMPLETED_KEY = "gestao_produtos_csv_completed_v1";
const QUICK_FILTER_KEY = "gestao_produtos_csv_quick_keywords_v1";
const $ = id => document.getElementById(id);
let pending = loadPending();
function loadCompleted(){ try { const v=JSON.parse(localStorage.getItem(COMPLETED_KEY)); return Array.isArray(v)?v:[]; } catch(e){ return []; } }
let completed = loadCompleted();
let quickKeywords = loadQuickKeywords();
let activePendingId = null;
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
function esc(value){ return String(value ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
function normalize(value){ return String(value ?? "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").toLowerCase(); }
function loadProducts(){ try { const v=JSON.parse(localStorage.getItem(PRODUCTS_KEY)); return Array.isArray(v)?v:[]; } catch(e){ return []; } }
function saveProducts(items){ localStorage.setItem(PRODUCTS_KEY,JSON.stringify(items)); }
function loadPending(){ try { const v=JSON.parse(localStorage.getItem(PENDING_KEY)); return Array.isArray(v)?v:[]; } catch(e){ return []; } }
function loadQuickKeywords(){ try { const v=JSON.parse(localStorage.getItem(QUICK_FILTER_KEY)); return Array.isArray(v)?v.filter(x=>typeof x==="string"):[]; } catch(e){ return []; } }
function saveQuickKeywords(){ localStorage.setItem(QUICK_FILTER_KEY,JSON.stringify(quickKeywords)); }
function parseQuickKeywords(value){ return [...new Set(String(value||"").split(",").map(x=>normalize(x)).filter(Boolean))]; }
function savePending(){ localStorage.setItem(PENDING_KEY,JSON.stringify(pending)); }
function saveCompleted(){ localStorage.setItem(COMPLETED_KEY,JSON.stringify(completed)); }
function parseCSVLine(line, delimiter){
  const out=[]; let value="", quoted=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(ch==='"' && quoted && line[i+1]==='"'){ value+='"'; i++; }
    else if(ch==='"'){ quoted=!quoted; }
    else if(ch===delimiter && !quoted){ out.push(value.trim()); value=""; }
    else value+=ch;
  }
  out.push(value.trim()); return out;
}
function parseCSV(text){
  const lines=String(text||"").replace(/^\uFEFF/,"").split(/\r?\n/).filter(line=>line.trim());
  if(lines.length<2) throw new Error("O CSV precisa ter uma linha de cabeçalho e pelo menos um produto.");
  const delimiter=lines[0].includes(";")?";":",";
  const headers=parseCSVLine(lines[0],delimiter).map(h=>normalize(h));
  const codeIndex=headers.findIndex(h=>["codigo","código","cod","code"].includes(h));
  const referenceIndex=headers.findIndex(h=>["referencia","referência","ref"].includes(h));
  if(codeIndex<0 || referenceIndex<0) throw new Error("Não encontrei as colunas Código e Referência no cabeçalho do CSV.");
  const rows=[];
  for(let i=1;i<lines.length;i++){
    const cols=parseCSVLine(lines[i],delimiter); const code=(cols[codeIndex]||"").trim();
    if(!code) continue;
    const reference=(cols[referenceIndex]||"").trim();
    if(rows.some(r=>normalize(r.codigo)===normalize(code))) continue;
    rows.push({id:uid(),codigo:code,referencia:reference});
  }
  if(!rows.length) throw new Error("Nenhum código de produto válido foi encontrado.");
  return rows;
}
function render(){
  const q=normalize($("pendingSearch").value);
  const field=$("pendingFilterField").value;
  const visible=pending.filter(p=>{
    const codigo=normalize(p.codigo), referencia=normalize(p.referencia);
    const matchesText=!q || (field==="codigo" ? codigo.includes(q) : field==="referencia" ? referencia.includes(q) : (codigo+" "+referencia).includes(q));
    const matchesQuick=!quickKeywords.length || quickKeywords.some(keyword=>codigo.includes(keyword)||referencia.includes(keyword));
    return matchesText && matchesQuick;
  });
  $("quickFilterStatus").textContent=quickKeywords.length ? `${quickKeywords.length} palavra(s)-chave ativa(s): ${quickKeywords.join(", ")}` : "Nenhuma palavra-chave configurada.";
  $("pendingList").innerHTML=visible.map(p=>{
    const existing=loadProducts().find(x=>normalize(x.produto)===normalize(p.codigo));
    const label=existing?"Editar dados":"Adicionar";
    return `<article class="pending-item"><div class="pending-item-main"><span class="pending-code">Produto: ${esc(p.codigo)}</span><span class="pending-reference">Referência: <strong>${esc(p.referencia||"—")}</strong></span>${existing?'<span class="pending-status">Já existe na lista principal — será atualizado ao salvar</span>':''}</div><button class="btn btn-primary" type="button" data-open="${esc(p.id)}">${label}</button></article>`;
  }).join("");
  $("pendingEmpty").style.display=visible.length?"none":"block";
  $("csvTotal").textContent=pending.length+completed.length;
  $("pendingTotal").textContent=pending.length;
  $("completedTotal").textContent=completed.length;
}
function openMapping(id){
  const item=pending.find(p=>p.id===id); if(!item)return;
  activePendingId=id;
  const existing=loadProducts().find(p=>normalize(p.produto)===normalize(item.codigo));
  $("modalTitle").textContent=existing?"Editar produto existente":"Preencher dados do produto";
  $("modalSubtitle").textContent=existing?"Os dados atuais serão carregados. Ao salvar, o cadastro será atualizado.":"Preencha os dados obrigatórios para enviar o produto à lista principal.";
  $("mappingId").value=id; $("mappingCode").value=item.codigo;
  $("mappingReference").textContent=`Referência (somente visualização): ${item.referencia||"—"}`;
  $("mappingQuantity").value=existing?.quantidade??"";
  $("mappingMinimum").value=existing?.minimo??"";
  $("mappingMaximum").value=existing?.maximo??"";
  $("mappingLocation").value=existing?.fileira??"";
  $("productModal").classList.remove("hidden"); $("mappingQuantity").focus();
}
function closeMapping(){ $("productModal").classList.add("hidden"); activePendingId=null; }
$("csvFile").addEventListener("change",async e=>{
  const file=e.target.files?.[0]; if(!file)return;
  try{
    if(!file.name.toLowerCase().endsWith(".csv")) throw new Error("Selecione um arquivo com extensão .csv.");
    const imported=parseCSV(await file.text());
    const seen=new Set([...pending.map(p=>normalize(p.codigo)), ...completed.map(p=>normalize(p.codigo))]);
    let added=0;
    imported.forEach(p=>{if(!seen.has(normalize(p.codigo))){pending.push(p);seen.add(normalize(p.codigo));added++;}});
    savePending(); render();
    $("csvStatus").textContent=`Arquivo lido: ${imported.length} linha(s); ${added} novo(s) produto(s) pendente(s).`;
  }catch(err){alert(err.message||String(err));$("csvStatus").textContent="Falha ao ler o CSV.";}
  finally{e.target.value="";}
});
$("pendingList").addEventListener("click",e=>{const btn=e.target.closest("[data-open]");if(btn)openMapping(btn.dataset.open);});
$("pendingSearch").addEventListener("input",render);
$("pendingFilterField").addEventListener("change",render);
$("quickKeywords").value=quickKeywords.join(", ");
$("quickKeywords").addEventListener("change",()=>{
  quickKeywords=parseQuickKeywords($("quickKeywords").value);
  $("quickKeywords").value=quickKeywords.join(", ");
  saveQuickKeywords(); render();
});
$("quickKeywords").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();$("quickKeywords").dispatchEvent(new Event("change"));}});
$("clearQuickFilterBtn").addEventListener("click",()=>{
  quickKeywords=[]; $("quickKeywords").value=""; saveQuickKeywords(); render();
});
$("mappingForm").addEventListener("submit",e=>{
  e.preventDefault();
  const item=pending.find(p=>p.id===activePendingId); if(!item)return;
  const quantidade=$("mappingQuantity").value, minimo=$("mappingMinimum").value, maximo=$("mappingMaximum").value;
  if(quantidade===""||minimo===""||maximo===""){alert("Preencha Estoque Atual, Estoque Mínimo e Estoque Máximo.");return;}
  if(Number(maximo)<Number(minimo)){alert("O Estoque Máximo deve ser maior ou igual ao Estoque Mínimo.");return;}
  const products=loadProducts(); const idx=products.findIndex(p=>normalize(p.produto)===normalize(item.codigo));
  const data={produto:item.codigo,referencia:item.referencia||"",quantidade,minimo,maximo,fileira:$("mappingLocation").value.trim(),estoque:false,catalogo:false};
  if(idx>=0) products[idx]={...products[idx],...data};
  else products.push({id:uid(),...data});
  saveProducts(products);
  pending=pending.filter(p=>p.id!==item.id);
  completed=completed.filter(p=>normalize(p.codigo)!==normalize(item.codigo));
  completed.push({id:item.id,codigo:item.codigo,referencia:item.referencia||""});
  savePending(); saveCompleted(); closeMapping(); render();
  $("csvStatus").textContent=`Produto ${item.codigo} salvo na lista principal. Abra a página inicial para consultar ou exportar.`;
});
["closeModalBtn","cancelMappingBtn"].forEach(id=>$(id).addEventListener("click",closeMapping));
$("productModal").addEventListener("click",e=>{if(e.target.id==="productModal")closeMapping();});
$("clearPendingBtn").addEventListener("click",()=>{
  if(!pending.length){alert("Não há importações pendentes para limpar.");return;}
  if(!confirm(`Deseja remover os ${pending.length} produto(s) pendente(s)? Os produtos já enviados à lista principal não serão apagados.`))return;
  pending=[];savePending();render();$("csvStatus").textContent="Lista de importação pendente limpa.";
});
render();
