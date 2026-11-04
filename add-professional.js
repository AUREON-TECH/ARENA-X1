'use strict';
(function(){
 const management=document.getElementById('management');if(!management)return;
 const section=document.createElement('section');
 section.id='newProfessionalManager';
 section.style.cssText='margin:17px 0;padding:14px;border:1px solid #405a78;border-radius:12px;background:#192b42';
 section.innerHTML='<details><summary style="cursor:pointer;font-weight:800;color:#f2cc83">➕ Novo profissional — equipe sem limite fixo</summary><p class="muted">Raphael e Luis podem incluir novos competidores. Eles aparecem no ranking após o cadastro e só acessam o aplicativo quando tiverem sua conta aprovada.</p><form id="bmwNewPersonForm" class="form-grid"><div class="field full"><label for="bmwNewPersonName">Nome completo</label><input id="bmwNewPersonName" maxlength="110" required placeholder="Nome completo"></div><div class="field"><label for="bmwNewPersonRole">Função</label><select id="bmwNewPersonRole"><option value="CAPTADOR">Captador</option><option value="CONSULTOR">Consultor</option><option value="CLOSER">Closer</option></select></div><div class="field"><label for="bmwNewPersonDate">Data de entrada</label><input id="bmwNewPersonDate" type="date" min="2026-01-01" max="2026-12-31" required></div><div class="field full"><button class="btn primary" type="submit" id="bmwNewPersonSubmit">Cadastrar participante</button></div></form><p class="muted" id="bmwNewPersonStatus" role="status"></p></details>';
 management.insertBefore(section,management.querySelector('.form-grid'));
 const form=document.getElementById('bmwNewPersonForm');
 form.onsubmit=async e=>{
  e.preventDefault();if(!admin)return;
  const name=document.getElementById('bmwNewPersonName').value.trim().toUpperCase().replace(/\s+/g,' ');
  const role=document.getElementById('bmwNewPersonRole').value;
  const start=document.getElementById('bmwNewPersonDate').value;
  const status=document.getElementById('bmwNewPersonStatus');
  const button=document.getElementById('bmwNewPersonSubmit');
  if(name.length<5||!name.includes(' ')||!start){status.textContent='Informe nome completo e data de entrada.';return}
  if(people.some(x=>norm(x.name)===norm(name))){status.textContent='Este profissional já está no ranking.';return}
  if(!confirm('Adicionar '+name+' como '+role+' a partir de '+start+'?'))return;
  button.disabled=true;status.textContent='Cadastrando no banco protegido...';
  try{
   const jwt=await window.bmwAppToken?.();
   if(!jwt)throw Error('Sessão expirada.');
   const created=await rest('/rest/v1/rpc/bmw_x1_add_professional',{method:'POST',headers:{Authorization:'Bearer '+jwt},body:JSON.stringify({p_name:name,p_role:role,p_start:start})});
   await refresh();
   status.textContent='Cadastro concluído! '+name+' incluído. Total: '+created.total+' profissionais. Ele já pode criar uma conta e solicitar aprovação.';
   form.reset();
  }catch(err){status.textContent='Não foi possível cadastrar: '+err.message}
  finally{button.disabled=false}
 };
})();
