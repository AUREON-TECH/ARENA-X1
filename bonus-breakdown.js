'use strict';
// Resumo detalhado: cada coluna corresponde a uma categoria de pontos distinta.
(function(){
  const heading=document.querySelector('.ranking-table thead tr');
  if(!heading)return;
  const old=heading.querySelectorAll('th');
  if(old.length!==11)return;
  const fresh=['TOP','RENDA CAPTAÇÃO','CASAIS','EFICIÊNCIA','ENTRADA (LUIS)','AJUSTES'];
  const existing=old[8];
  existing.textContent='TOP';
  existing.title='TOPs mensais, julho a outubro';
  for(const label of fresh.slice(1)){
    const th=document.createElement('th');th.className='num';th.textContent=label;existing.parentNode.insertBefore(th,old[9]);
  }
  heading.querySelector('th:nth-last-child(2)').textContent='EQUIPARAÇÃO';
  const style=document.createElement('style');
  style.textContent='.ranking-table{min-width:1630px}.ranking-table td.num{white-space:nowrap;font-variant-numeric:tabular-nums}.ranking-table th{font-size:11px}.bonus-breakdown{margin:14px 0}.bonus-breakdown strong{color:#edc476}.bonus-breakdown .month-item{padding:7px 10px;border-bottom:1px solid #364b65}.bonus-breakdown summary{cursor:pointer;padding:10px;font-weight:700}';
  document.head.appendChild(style);

  function manualEntrada(p,month){
    if(!approvalsAvailable||p.role!=='CLOSER')return 0;
    return changes.filter(x=>x.person===p.name&&x.category==='entrada'&&String(x.editor_email||'').toLowerCase()==='luisaneto@gmail.com'&&(!month||x.month===month)).reduce((n,x)=>n+Number(x.points||0),0);
  }
  // Creditar no total apenas as decisões efetivamente registradas pelo Luis.
  const originalOwn=ownXP;
  const originalMonthly=monthTotalXP;
  ownXP=function(p){return originalOwn(p)+manualEntrada(p)};
  monthTotalXP=function(p,m){return originalMonthly(p,m)+manualEntrada(p,m)};
  function cell(n){return '<td class="num">'+fmt.format(n)+'</td>'}
  const originalRanking=drawRank;
  drawRank=function(){
    originalRanking();
    const filter=norm(document.getElementById('search').value),role=document.getElementById('roleFilter').value;
    const list=ranking().map((p,i)=>({p,rank:i+1})).filter(x=>(!role||x.p.role===role)&&norm(x.p.name).includes(filter));
    document.getElementById('rankRows').innerHTML=list.map(({p,rank})=>
      '<tr class="clickrow" data-person="'+esc(p.name)+'"><td class="rank">'+rank+'º</td><td><span class="role">'+esc(p.role)+'</span></td><td>'+esc(p.name)+'</td><td class="num">'+money.format(p.vgv_gross_total)+'</td>'+cell(XP_FACTOR[p.role]*1000)+cell(baseXP(p))+
      (approvalsAvailable?cell(attendanceXP(p,'presenca'))+cell(attendanceXP(p,'pontualidade'))+cell(topXP(p))+cell(rendaXP(p))+cell(casalXP(p))+cell(eficienciaXP(p))+cell(manualEntrada(p))+cell(otherBonusXP(p))+cell(equalizationXP(p))+cell(xp(p)):'<td colspan="10">Bônus indisponíveis — XP provisório pelo VGV: '+fmt.format(baseXP(p))+'</td>')+'</tr>').join('')||'<tr><td colspan="16">Nenhum participante encontrado</td></tr>';
    document.querySelectorAll('#rankRows [data-person]').forEach(row=>row.onclick=()=>{document.getElementById('personSelect').value=row.dataset.person;nav('professional')});
  };

  const originalPerson=drawPerson;
  drawPerson=function(){
    originalPerson();
    const p=person(document.getElementById('personSelect').value);
    if(!p||!approvalsAvailable)return;
    const root=document.getElementById('personBody');
    // Ajustar as tabelas mensais antigas para exibir o que já está creditado.
    const categories=p.role==='CAPTADOR'?['top','ticket','casais']:p.role==='CONSULTOR'?['top','eficiencia']:['top','entrada'];
    root.querySelectorAll('.month-card').forEach((card,i)=>{
      const mm=p.months[i];if(!mm)return;
      card.querySelectorAll('.bonus-entry').forEach((row,j)=>{
        const category=categories[j],amt=category==='top'?topXP(p,mm.month):category==='ticket'?rendaXP(p,mm.month):category==='casais'?casalXP(p,mm.month):category==='eficiencia'?(mm.month==='2026-11'?eficienciaXP(p):0):manualEntrada(p,mm.month);
        const parts=row.children;
        if(category==='ticket'&&parts[0]?.querySelector('b'))parts[0].querySelector('b').textContent='Renda média — Captação';
        if(parts[1]?.querySelector('b'))parts[1].querySelector('b').textContent=fmt.format(amt);
        if(parts[2]?.querySelector('b'))parts[2].querySelector('b').textContent=fmt.format(amt);
        if(parts[3]?.querySelector('b'))parts[3].querySelector('b').textContent='0';
        if(parts[4]?.querySelector('small'))parts[4].querySelector('small').textContent=category==='entrada'?'Aguardando Luis':amt>0?'Creditado automaticamente':'Sem XP nesta categoria';
      });
    });
    const old=root.querySelector('.bonus-breakdown');if(old)old.remove();
    const div=document.createElement('section');div.className='bonus-breakdown';
    const parts=[
      ['TOP mensal',topXP(p)],['Renda média — captação',rendaXP(p)],
      ['Casais qualificados',casalXP(p)],['Eficiência — consultoria',eficienciaXP(p)],
      ['Entrada efetiva — Luis',manualEntrada(p)],['Ajustes adicionais',otherBonusXP(p)]
    ];
    div.innerHTML='<h3>De onde vem cada bônus?</h3><div class="month-grid">'+parts.map(x=>'<div><small>'+esc(x[0])+'</small><strong>'+fmt.format(x[1])+' XP</strong></div>').join('')+'</div>'+
      p.months.map((m,i)=>'<details><summary>'+MN[i]+' 2026 — '+fmt.format(monthTotalXP(p,m.month))+' XP</summary>'+
        '<div class="month-item">VGV: '+fmt.format(m.xp_base)+' XP</div>'+
        '<div class="month-item">Presença: '+fmt.format(attendanceXP(p,'presenca',m.month))+' XP ('+monthDays(p,m.month)+' dias previstos; líquido após descontos)</div>'+
        '<div class="month-item">Pontualidade: '+fmt.format(attendanceXP(p,'pontualidade',m.month))+' XP</div>'+
        '<div class="month-item">TOP: '+fmt.format(topXP(p,m.month))+' XP</div>'+
        '<div class="month-item">Renda média: '+fmt.format(rendaXP(p,m.month))+' XP</div>'+
        '<div class="month-item">Casais qualificados: '+fmt.format(casalXP(p,m.month))+' XP ('+fmt.format(m.q||0)+' casais Q)</div>'+
        '<div class="month-item">Eficiência acumulada: '+fmt.format(m.month==='2026-11'?eficienciaXP(p):0)+' XP</div>'+
        '<div class="month-item">Entrada efetiva — Luis: '+fmt.format(manualEntrada(p,m.month))+' XP</div>'+
        '<div class="month-item">Outros ajustes: '+fmt.format(otherBonusXP(p,m.month))+' XP</div></details>').join('')+
      '<p class="muted">Meetings não pontuam. Ticket médio dos Consultores e Closers não pontua. Entrada efetiva só conta após lançamento pelo Luis. Os bônus de presença e pontualidade são iniciais e sujeitos a descontos.</p>';
    root.insertBefore(div,root.querySelector('.month-card'));
  };
  // A tela inicial do app pode carregar antes da rede; a função revisada é usada em cada atualização.
  if(people.length){drawRank();drawPerson()}
})();