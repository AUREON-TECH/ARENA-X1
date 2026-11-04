'use strict';
(function(){
 const tabs=document.querySelector('.nav');
 if(!tabs)return;
 const tab=document.createElement('button');
 tab.className='btn';tab.dataset.tab='arena';tab.textContent='🏟️ Arena • Mural';
 const loginTab=document.getElementById('loginTab');
 tabs.insertBefore(tab,loginTab);
 const section=document.createElement('section');section.className='panel view hidden';section.id='arena';
 section.innerHTML='<div class="arena-head"><div><h2>🏟️ Arena BMW X1</h2><p>Desafios, provocações saudáveis e torcida pela BMW. Publicações de até <strong>50 caracteres</strong>.</p></div><div class="arena-subtitle">Competidores aprovados · Arena BMW X1</div></div>'+
 '<div id="arenaStatus" class="arena-status" role="status"></div>'+
 '<div id="arenaAccess"><div class="arena-card"><h3>Entre na disputa</h3><p>Crie sua conta com seu e-mail. Depois da confirmação, solicite aprovação para participar.</p>'+
 '<form id="arenaAuthForm"><label>E-mail<input id="arenaEmail" type="email" autocomplete="email" required placeholder="voce@exemplo.com"></label><label>Senha<input id="arenaPassword" type="password" autocomplete="current-password" minlength="8" required placeholder="Sua senha"></label>'+
 '<div class="arena-buttons"><button class="btn primary" type="submit">Entrar</button><button class="btn" id="arenaSignup" type="button">Criar conta</button><button class="btn small" id="arenaRecover" type="button">Esqueci a senha</button></div></form><p class="arena-hint">A conta não libera o mural automaticamente. Raphael ou Luis precisa aprovar seu perfil. Nunca compartilhe sua senha.</p></div></div>'+
 '<div id="arenaWaiting" class="arena-card hidden"><h3>Solicitação de acesso</h3><p id="arenaMemberInfo"></p><div id="arenaRequestArea"><label>Selecione seu nome na competição<select id="arenaProfessional"></select></label><button class="btn primary" id="arenaRequest" type="button">Solicitar aprovação</button></div><button class="btn small" id="arenaLeave" type="button">Sair desta conta</button></div>'+
 '<div id="arenaFeedArea" class="hidden"><div class="arena-compose"><div class="arena-authrow"><span id="arenaIdentity"></span><div class="arena-buttons"><button class="btn small" id="arenaReload" type="button">↻ Atualizar</button><button class="btn small" id="arenaLogout" type="button">Sair</button></div></div><form id="arenaPostForm"><textarea id="arenaPostText" rows="2" maxlength="50" placeholder="Seu desafio em até 50 caracteres..." required></textarea><div class="arena-buttons"><span id="arenaPostCount">0 / 50</span><button class="btn primary" type="submit">Publicar desafio</button></div></form></div><div id="arenaFeed"></div></div>'+
 '<div id="arenaManage" class="arena-card hidden"><div class="arena-authrow"><h3>Solicitações de acesso</h3><button class="btn small" id="arenaReviewReload">Atualizar solicitações</button></div><div id="arenaReviewList"></div><h3 style="margin-top:20px">Moderação de mensagens</h3><div id="arenaModPosts"></div><p class="arena-hint">Só aprove o perfil após confirmar que a pessoa corresponde ao profissional indicado. O banco impede dois perfis aprovados com o mesmo nome.</p></div>';
 document.querySelector('.nav').insertAdjacentElement('afterend',section);
 const css=document.createElement('style');
 css.textContent='.arena-head{display:flex;justify-content:space-between;gap:15px;align-items:start;margin-bottom:12px}.arena-head p,.arena-hint{color:#adc0d8;font-size:12px;line-height:1.5}.arena-subtitle{font-size:12px;color:#f1cd84}.arena-card,.arena-compose,.arena-post{border:1px solid #39536f;border-radius:13px;background:#172940;padding:14px;margin:12px 0}.arena-card h3,.arena-post h3{margin:0 0 9px}.arena-card label{display:flex;flex-direction:column;gap:7px;margin:12px 0;color:#bacde4;font-size:12px;font-weight:650}.arena-card input,.arena-card select,.arena-compose textarea,.arena-comments input{width:100%;padding:10px;background:#0b192b;color:#f3f6fc;border:1px solid #4e6581;border-radius:9px}.arena-buttons{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.arena-authrow{display:flex;justify-content:space-between;align-items:center;gap:9px;flex-wrap:wrap}.arena-status{font-size:12px;color:#f1cd84;min-height:16px}.arena-post-text{font-size:18px;font-weight:700;overflow-wrap:anywhere;margin:12px 0}.arena-post-head{display:flex;justify-content:space-between;align-items:center;gap:8px;color:#a9bfdc;font-size:12px}.arena-post-head strong{color:#f4d18e}.arena-post-actions{display:flex;flex-wrap:wrap;gap:9px}.arena-post-actions .btn{padding:6px 10px}.arena-comment{border-top:1px solid #344b64;padding:7px 0;font-size:12px}.arena-comment b{color:#e4c580}.arena-comments{margin-top:10px}.arena-comment-form{display:flex;gap:8px;margin-top:8px}.arena-comment-form input{min-width:0;flex:1}.arena-review-row{border-top:1px solid #3b526a;padding:10px 0}.arena-review-row strong{display:block}.arena-review-row small{display:block;color:#b5c9e0;margin:4px 0 8px}@media(max-width:600px){.arena-head{flex-direction:column}.arena-card,.arena-compose,.arena-post{padding:11px}.arena-post-text{font-size:16px}.arena-comment-form{flex-wrap:wrap}}';
 document.head.appendChild(css);

 let local=null,user=null,member=null,postCache=[],comments=[],likes=[],poll=null;
 const managerName=()=>admin?(String(user?.email||session?.user?.email||'').toLowerCase()==='luisaneto@gmail.com'?'LUIS • GESTÃO':'RAPHAEL • GESTÃO'):null;
 const authorName=()=>admin?managerName():member?.professional;
 const canInteract=()=>accessGranted&&(admin||member?.status==='approved');
 try{local=JSON.parse(localStorage.getItem('bmw-x1-arena-auth')||'null')}catch{}
 const el=id=>document.getElementById(id);
 el('arenaAccess').classList.add('hidden');el('arenaWaiting').classList.add('hidden');
 const safe=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const setmsg=msg=>{el('arenaStatus').textContent=msg||''};
 function authToken(){return local?.access_token||''}
 async function arenaToken(){
  if(window.bmwAppToken)return await window.bmwAppToken();
  if(!local)return null;
  if(Date.now()<Number(local.expires_at||0)*1000-45000)return local.access_token;
  try{
   const r=await rest('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:local.refresh_token})});
   local={...r,expires_at:Math.floor(Date.now()/1000)+r.expires_in};
   localStorage.setItem('bmw-x1-arena-auth',JSON.stringify(local));user=r.user||user;return local.access_token;
  }catch{local=null;user=null;member=null;localStorage.removeItem('bmw-x1-arena-auth');return null}
 }
 async function api(path,opts={},manager=false){
  const t=await window.bmwAppToken?.();
  if(!accessGranted||!t)throw Error('Acesso não liberado. Entre pela tela inicial.');
  return rest('/rest/v1/'+path,{...opts,headers:{Authorization:'Bearer '+t,...(opts.headers||{})}});
 }
 function renderAccess(){
  const allowed=member?.status==='approved'||admin;
  el('arenaAccess').classList.add('hidden');
  el('arenaWaiting').classList.add('hidden');
  el('arenaFeedArea').classList.toggle('hidden',!accessGranted||!allowed);
  const prof=member?.professional;
  el('arenaMemberInfo').textContent=member?(member.status==='pending'?'Aguardando aprovação de Raphael ou Luis para '+prof+'.':member.status==='rejected'?'Solicitação não aprovada para '+prof+'. Fale com a gestão.':'Seu perfil: '+prof):'Sua conta foi autenticada. Escolha seu nome e solicite aprovação.';
  el('arenaRequestArea').classList.toggle('hidden',!!member);
  if(allowed)el('arenaIdentity').textContent=admin?'🛡️ '+managerName()+' · Publique, curta e comente':'✅ '+prof+' · Participante aprovado';
  el('arenaPostForm').classList.toggle('hidden',!canInteract());
  el('arenaLogout').classList.add('hidden');
  el('arenaManage').classList.toggle('hidden',!admin);
 }
 function roster(){
  const select=el('arenaProfessional');
  const current=select.value;
  select.innerHTML=people.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(p=>'<option value="'+safe(p.name)+'">'+safe(p.name)+' · '+safe(p.role)+'</option>').join('');
  if(people.some(x=>x.name===current))select.value=current;
 }
 async function connect(){
  roster();
  const t=await window.bmwAppToken?.();
  if(!accessGranted||!t){user=null;member=null;renderAccess();return}
  try{
   const u=await rest('/auth/v1/user',{headers:{Authorization:'Bearer '+t}});
   user=u;
   const rows=await api('bmw_x1_members?select=user_id,professional,status,requested_at&user_id=eq.'+encodeURIComponent(u.id));
   member=rows?.[0]||null;
   if(!admin&&member?.status!=='approved')throw Error('Conta ainda não aprovada.');
   renderAccess();
   if(member?.status==='approved'||admin)await loadFeed();
  }catch(e){setmsg('Acesso: '+e.message);renderAccess()}
 }
 el('arenaAuthForm').onsubmit=async event=>{
  event.preventDefault();
  const email=el('arenaEmail').value.trim().toLowerCase(),password=el('arenaPassword').value;
  setmsg('Conferindo sua conta...');
  try{
   const result=await rest('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});
   local={...result,expires_at:Math.floor(Date.now()/1000)+result.expires_in};
   localStorage.setItem('bmw-x1-arena-auth',JSON.stringify(local));user=result.user;el('arenaPassword').value='';
   await connect();setmsg('Conta conectada. '+(member?.status==='approved'?'Bem-vindo à Arena!':'Solicite ou acompanhe sua aprovação.'));
  }catch(e){setmsg('Não foi possível entrar: '+e.message)}
 };
 let signupCooldownUntil=0,signupTimer=null;
 function refreshSignupCooldown(){
  const remaining=Math.max(0,Math.ceil((signupCooldownUntil-Date.now())/1000)),btn=el('arenaSignup');
  btn.disabled=remaining>0;
  btn.textContent=remaining>0?'Aguarde '+remaining+'s':'Criar conta';
  if(!remaining&&signupTimer){clearInterval(signupTimer);signupTimer=null}
 }
 function handleSignupError(err){
  const message=String(err?.message||err||'');
  const seconds=message.match(/(?:after|in)\s+(\d+)\s*seconds?/i)||message.match(/(\d+)\s*segundos?/i);
  if(/security purposes|rate.limit|too many requests|limite.*tentativa|429/i.test(message)){
   const cooldown=seconds?Number(seconds[1]):60;
   signupCooldownUntil=Date.now()+Math.max(1,cooldown)*1000;
   refreshSignupCooldown();
   if(!signupTimer)signupTimer=setInterval(refreshSignupCooldown,1000);
   setmsg('Por segurança, o cadastro está temporariamente bloqueado. Aguarde '+cooldown+' segundos antes de tentar novamente. Se já criou a conta, confira seu e-mail ou use Entrar.');
  }else{
   setmsg('Não foi possível criar a conta: '+message);
  }
 }
 el('arenaSignup').onclick=async()=>{
  if(Date.now()<signupCooldownUntil){refreshSignupCooldown();return}
  const btn=el('arenaSignup');btn.disabled=true;
  const email=el('arenaEmail').value.trim().toLowerCase(),password=el('arenaPassword').value;
  if(!email||password.length<8){setmsg('Informe um e-mail válido e senha com pelo menos 8 caracteres.');btn.disabled=false;return}
  try{
   setmsg('Enviando cadastro...');
   await rest('/auth/v1/signup',{method:'POST',body:JSON.stringify({email,password})});
   el('arenaPassword').value='';
   setmsg('Solicitação recebida. Se a conta for nova, confirme pelo e-mail recebido; depois use Entrar para solicitar aprovação. Não clique novamente em Criar conta.');
  }catch(e){handleSignupError(e)}finally{if(Date.now()>=signupCooldownUntil)btn.disabled=false}
 };
 el('arenaRecover').onclick=async()=>{
  const email=el('arenaEmail').value.trim().toLowerCase();
  if(!email)return setmsg('Informe seu e-mail para recuperar a senha.');
  try{
   await rest('/auth/v1/recover',{method:'POST',body:JSON.stringify({email})});
   setmsg('Se o e-mail estiver cadastrado, você receberá instruções para recuperar a senha.');
  }catch(e){setmsg('Recuperação de senha: '+e.message)}
 };
 el('arenaRequest').onclick=async()=>{
  const professional=el('arenaProfessional').value;
  if(!people.some(x=>x.name===professional))return setmsg('Escolha um nome válido da lista.');
  try{
   await api('bmw_x1_members',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({user_id:user.id,professional,status:'pending',requester_email:String(user.email||'').toLowerCase()})});
   setmsg('Solicitação enviada! Aguarde aprovação de Raphael ou Luis.');await connect();
  }catch(e){setmsg('Não foi possível solicitar aprovação: '+e.message)}
 };
 async function leave(){const access=local?.access_token;local=null;user=null;member=null;localStorage.removeItem('bmw-x1-arena-auth');renderAccess();setmsg('Você saiu da sua conta da Arena.');if(access)try{await rest('/auth/v1/logout',{method:'POST',headers:{Authorization:'Bearer '+access}})}catch{}}
 el('arenaLeave').onclick=leave;el('arenaLogout').onclick=leave;
 const age=iso=>{try{return new Date(iso).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}catch{return ''}};
 async function loadFeed(){
  if(member?.status!=='approved'&&!admin)return;
  const [postsData,commentsData,likesData]=await Promise.all([
   api('bmw_x1_posts?select=id,user_id,professional,body,created_at&order=created_at.desc&limit=80',{},admin),
   api('bmw_x1_comments?select=id,post_id,user_id,professional,body,created_at&order=created_at.asc&limit=500',{},admin),
   api('bmw_x1_likes?select=post_id,user_id&limit=2000',{},admin)
  ]);
  postCache=postsData||[];comments=commentsData||[];likes=likesData||[];
  const html=postCache.map(post=>{
   const postComments=comments.filter(x=>x.post_id===post.id),postLikes=likes.filter(x=>x.post_id===post.id),liked=postLikes.some(x=>x.user_id===user.id),owner=post.user_id===user.id;
   return '<article class="arena-post"><div class="arena-post-head"><strong>'+safe(post.professional)+'</strong><span>'+age(post.created_at)+'</span></div>'+
    '<div class="arena-post-text">'+safe(post.body)+'</div><div class="arena-post-actions">'+
    (canInteract()?'<button class="btn small" data-like="'+post.id+'">'+(liked?'❤️ Curtido':'🤍 Curtir')+' · '+postLikes.length+'</button>':'<span>❤️ '+postLikes.length+'</span>')+
    '<button class="btn small" data-commenttoggle="'+post.id+'">💬 Comentários · '+postComments.length+'</button>'+
    ((owner||admin)?'<button class="btn small red" data-delete="'+post.id+'">Excluir</button>':'')+'</div>'+
    '<div class="arena-comments hidden" id="arenaComments'+post.id+'">'+postComments.map(c=>'<div class="arena-comment"><b>'+safe(c.professional)+':</b> '+safe(c.body)+' <small>'+age(c.created_at)+'</small>'+(c.user_id===user.id||admin?' <button class="btn small red" data-deletecomment="'+c.id+'">Excluir</button>':'')+'</div>').join('')+
    (canInteract()?'<form class="arena-comment-form" data-post="'+post.id+'"><input maxlength="50" required placeholder="Comente em até 50 caracteres" aria-label="Comentar"><button class="btn small primary" type="submit">Comentar</button></form>':'')+'</div></article>';
  }).join('')||'<div class="arena-card">Ainda não há mensagens. Publique o primeiro desafio!</div>';
  el('arenaFeed').innerHTML=html;
  el('arenaFeed').querySelectorAll('[data-commenttoggle]').forEach(btn=>btn.onclick=()=>el('arenaComments'+btn.dataset.commenttoggle).classList.toggle('hidden'));
  el('arenaFeed').querySelectorAll('[data-like]').forEach(btn=>btn.onclick=async()=>{
   btn.disabled=true;const pid=Number(btn.dataset.like),liked=likes.some(x=>x.post_id===pid&&x.user_id===user.id);
   try{if(liked)await api('bmw_x1_likes?post_id=eq.'+pid+'&user_id=eq.'+encodeURIComponent(user.id),{method:'DELETE'},admin);else await api('bmw_x1_likes',{method:'POST',body:JSON.stringify({post_id:pid,user_id:user.id}),headers:{Prefer:'return=minimal'}},admin);await loadFeed()}catch(e){setmsg('Curtida: '+e.message)}finally{btn.disabled=false}
  });
  el('arenaFeed').querySelectorAll('[data-delete]').forEach(btn=>btn.onclick=async()=>{if(!confirm('Excluir esta publicação e os comentários?'))return;try{await api('bmw_x1_posts?id=eq.'+Number(btn.dataset.delete),{method:'DELETE'},admin);await loadFeed()}catch(e){setmsg('Excluir: '+e.message)}});
  el('arenaFeed').querySelectorAll('[data-deletecomment]').forEach(btn=>btn.onclick=async()=>{try{await api('bmw_x1_comments?id=eq.'+Number(btn.dataset.deletecomment),{method:'DELETE'},admin);await loadFeed()}catch(e){setmsg('Comentário: '+e.message)}});
  el('arenaFeed').querySelectorAll('form[data-post]').forEach(form=>form.onsubmit=async e=>{
   e.preventDefault();if(!canInteract())return setmsg('Acesso não autorizado.');const body=form.querySelector('input').value.trim();if(!body||body.length>50)return;
   const button=form.querySelector('button');button.disabled=true;
   try{await api('bmw_x1_comments',{method:'POST',body:JSON.stringify({post_id:Number(form.dataset.post),user_id:user.id,professional:authorName(),body}),headers:{Prefer:'return=minimal'}},admin);await loadFeed()}catch(err){setmsg('Comentário: '+err.message)}finally{button.disabled=false}
  });
 }
 el('arenaPostText').oninput=()=>el('arenaPostCount').textContent=el('arenaPostText').value.length+' / 50';
 el('arenaPostForm').onsubmit=async e=>{
  e.preventDefault();if(!canInteract())return setmsg('Acesso não autorizado.');const body=el('arenaPostText').value.trim();if(!body||body.length>50)return setmsg('Use de 1 a 50 caracteres.');
  const button=el('arenaPostForm').querySelector('button');button.disabled=true;
  try{
   await api('bmw_x1_posts',{method:'POST',body:JSON.stringify({user_id:user.id,professional:authorName(),body}),headers:{Prefer:'return=minimal'}},admin);
   el('arenaPostText').value='';el('arenaPostCount').textContent='0 / 50';setmsg('Desafio publicado!');await loadFeed();
  }catch(err){setmsg('Não foi possível publicar: '+err.message)}finally{button.disabled=false}
 };
 el('arenaReload').onclick=()=>loadFeed().catch(e=>setmsg('Atualização: '+e.message));
 async function review(){
  if(!admin){el('arenaManage').classList.add('hidden');return}
  el('arenaManage').classList.remove('hidden');
  try{
   const rows=await api('bmw_x1_members?select=user_id,professional,status,requested_at,requester_email&order=requested_at.desc&limit=100',{},true);
   const pending=rows.filter(x=>x.status==='pending'),approved=rows.filter(x=>x.status==='approved');
   el('arenaReviewList').innerHTML='<p>'+pending.length+' solicitações pendentes · '+approved.length+' aprovadas</p>'+
    pending.map(m=>'<div class="arena-review-row"><strong>'+safe(m.professional)+'</strong><small>Solicitado em '+age(m.requested_at)+' · '+safe(m.requester_email||'sem e-mail')+' · ID '+safe(m.user_id.slice(0,8))+'</small><div class="arena-buttons"><button class="btn small primary" data-approve="'+safe(m.user_id)+'">Aprovar</button><button class="btn small red" data-reject="'+safe(m.user_id)+'">Recusar</button></div></div>').join('')+
    (pending.length?'':'<p class="arena-hint">Nenhuma solicitação aguardando aprovação.</p>');
   for(const row of el('arenaReviewList').querySelectorAll('[data-approve],[data-reject]')){
    row.onclick=async()=>{
     const approve=row.dataset.approve;const id=approve||row.dataset.reject;const record=pending.find(x=>x.user_id===id);
     if(!record||!confirm((approve?'Aprovar':'Recusar')+' acesso de '+record.professional+'?'))return;
     row.disabled=true;
     try{
      const data={status:approve?'approved':'rejected',approved_by:session?.user?.email||'gestão',approved_at:approve?new Date().toISOString():null};
      await api('bmw_x1_members?user_id=eq.'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify(data),headers:{Prefer:'return=minimal'}},true);
      setmsg('Solicitação atualizada: '+record.professional);await review();
     }catch(e){setmsg('Não foi possível aprovar: '+e.message)}finally{row.disabled=false}
    };
   }
  const recent=await api('bmw_x1_posts?select=id,professional,body,created_at&order=created_at.desc&limit=40',{},true);
   el('arenaModPosts').innerHTML=(recent||[]).map(post=>'<div class="arena-review-row"><strong>'+safe(post.professional)+'</strong><small>'+safe(post.body)+' · '+age(post.created_at)+'</small><button class="btn small red" data-moderate="'+post.id+'">Remover mensagem</button></div>').join('')||'<p class="arena-hint">Nenhuma publicação encontrada.</p>';
   el('arenaModPosts').querySelectorAll('[data-moderate]').forEach(button=>button.onclick=async()=>{
    if(!confirm('Remover esta mensagem e seus comentários?'))return;
    button.disabled=true;
    try{await api('bmw_x1_posts?id=eq.'+Number(button.dataset.moderate),{method:'DELETE'},true);await review();if(member?.status==='approved')await loadFeed()}catch(err){setmsg('Moderação: '+err.message)}finally{button.disabled=false}
   });
  }catch(e){el('arenaReviewList').textContent='Verificação de solicitações: '+e.message}
 }
 el('arenaReviewReload').onclick=review;
 const previousNav=nav;
 nav=function(id){
  previousNav(id);
  if(id==='arena'&&accessGranted){
   connect().catch(e=>setmsg('Não foi possível abrir o mural: '+e.message));
   if(admin)review();
  }
 };
 tab.onclick=()=>nav('arena');
 setInterval(()=>{if(el('arena').classList.contains('hidden')||(member?.status!=='approved'&&!admin))return;if(document.activeElement===el('arenaPostText')||document.activeElement?.closest('.arena-comment-form'))return;loadFeed().catch(()=>{})},30000);
 // Também mostrar a aprovação de acesso dentro da Gestão, sem mudar as permissões existentes.
 const approveShortcut=document.createElement('button');approveShortcut.className='btn small';approveShortcut.type='button';approveShortcut.textContent='👥 Aprovar contas do mural';
 approveShortcut.onclick=()=>nav('arena');
 const management=document.getElementById('management');
 if(management)management.insertBefore(approveShortcut,management.querySelector('h2')?.nextSibling||management.firstChild);
})();
