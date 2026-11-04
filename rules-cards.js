'use strict';
(function(){
 const styles=document.createElement('style');
 styles.textContent='#rulesBody{background:transparent;color:inherit;padding:0;border:0;margin:15px 0}.rules-intro{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px;border-radius:14px;background:linear-gradient(120deg,#20395b,#17283f);border:1px solid #455b78;margin:13px 0}.rules-intro h3{margin:0;font-size:20px;color:#f1d294}.rules-intro p{margin:4px 0 0;color:#b9cce1;font-size:12px}.rules-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px;align-items:start}.rules-modern{background:#14273e;border:1px solid #405773;border-radius:15px;overflow:hidden;min-width:0}.rules-modern.cap{border-top:4px solid #5daefa}.rules-modern.con{border-top:4px solid #bb95ec}.rules-modern.clo{border-top:4px solid #e9bf67}.rules-modern.general{border-top:4px solid #8ecfbd;margin:12px 0}.rules-modern-header{padding:16px;background:#1c334e}.rules-modern-header .tag{font-weight:800;font-size:12px}.rules-modern-header h3{font-size:18px;margin:6px 0 0}.rules-modern-body{padding:11px}.rules-section{border:1px solid #334b67;border-radius:10px;margin:0 0 10px;overflow:hidden}.rules-section h4{margin:0;background:#243b56;padding:9px 10px;font-size:11px;letter-spacing:.5px;color:#f1d48c}.rules-line{display:flex;justify-content:space-between;align-items:start;gap:12px;padding:9px 10px;border-top:1px solid #31475f;font-size:12px;line-height:1.5}.rules-line .rule-label{color:#bfd2e8;max-width:49%}.rules-line .rule-value{font-weight:680;text-align:right;max-width:66%;color:#f1f4fa;overflow-wrap:anywhere}.rules-line .rule-value:not(:first-child){font-variant-numeric:tabular-nums}.rules-line:first-of-type{border-top:0}.rules-body-note{color:#c0d0e3;font-size:11px;padding:8px 10px}.rules-private-note{font-size:11px;color:#a9bfd8;margin-top:12px}@media(max-width:1100px){.rules-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:690px){.rules-cards{grid-template-columns:1fr}.rules-intro{flex-direction:column;align-items:start}}';
 document.head.appendChild(styles);
 const original=drawRules;
 drawRules=async function(){
  await original();
  if(!admin||!Array.isArray(ruleData)||!ruleData.length)return;
  const body=document.getElementById('rulesBody');
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function render(item,theme,label){
   const lines=String(item.rule_text||'').split(/\r?\n/);
   let sections=[],current=null;
   for(const raw of lines){
    const line=raw.trim();if(!line)continue;
    if(line.startsWith('## ')){current={name:line.slice(3).trim(),rows:[]};sections.push(current);continue}
    if(!current){current={name:'Informações',rows:[]};sections.push(current)}
    const idx=line.indexOf('|');
    const name=idx<0?'Nota':line.slice(0,idx).trim(),value=idx<0?line:line.slice(idx+1).trim();
    current.rows.push({name,value});
   }
   return '<article class="rules-modern '+theme+'"><div class="rules-modern-header"><span class="tag">'+escape(label)+'</span><h3>'+escape(item.category)+'</h3></div><div class="rules-modern-body">'+sections.map(section=>'<section class="rules-section"><h4>'+escape(section.name)+'</h4>'+section.rows.map(row=>'<div class="rules-line"><span class="rule-label">'+escape(row.name)+'</span><span class="rule-value">'+escape(row.value)+'</span></div>').join('')+'</section>').join('')+'</div></article>';
  }
  const find=id=>ruleData.find(x=>x.id===id);
  const general=find('geral'),roles=[['captador','cap','🔵 CAPTAÇÃO'],['consultor','con','🟣 CONSULTORIA'],['closer','clo','🟡 CLOSER']];
  body.innerHTML='<div class="rules-intro"><div><h3>🏆 Regulamento BMW X1</h3><p>De 1º de julho a 31 de dezembro de 2026 · '+people.length+' profissionais</p></div><span class="tag">🔒 Área exclusiva da gestão</span></div>'+
    (general?render(general,'general','📌 REGRAS GERAIS'):'')+
    '<div class="rules-cards">'+roles.map(item=>{const rule=find(item[0]);return rule?render(rule,item[1],item[2]):''}).join('')+'</div>'+
    '<p class="rules-private-note">Informações consultadas após login autorizado de Raphael ou Luis. A gestão é responsável pelas correções e auditorias.</p>';
 };
})();
