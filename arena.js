'use strict';
(function(){
 const tabs=document.querySelector('.nav');
 if(!tabs)return;
 const tab=document.getElementById('arenaTab')||document.createElement('button');
 if(!tab.parentElement){
  tab.className='btn';tab.dataset.tab='arena';tab.textContent='🏟️ Arena • Mural';
  const loginTab=document.getElementById('loginTab');
  tabs.insertBefore(tab,loginTab);
 }
 const section=document.getElementById('arena')||document.createElement('section');section.className='panel view hidden';section.id='arena';
 section.innerHTML='<div class="arena-head"><div><h2>🏟️ Arena BMW X1</h2><p>Desafios, provocações saudáveis e torcida pela BMW. Publicações de até <strong>50 caracteres</strong>.</p></div><div class="arena-subtitle">Competidores aprovados · Arena BMW X1</div></div>'+
 '<div id="arenaStatus" class="arena-status" role="status"></div>'+
 '<div id="arenaAccess"><div class="arena-card"><h3>Entre na disputa</h3><p>Crie uma conta na tela inicial e solicite aprovação. Não é necessário outro login para participar.</p>'+
 '<form id="arenaAuthForm"><label>E-mail<input id="arenaEmail" type="email" autocomplete="email" required placeholder="voce@exemplo.com"></label><label>Senha<input id="arenaPassword" type="password" autocomplete="current-password" minlength="8" required placeholder="Sua senha"></label>'+
 '<div class="arena-buttons"><button class="btn primary" type="submit">Entrar</button><button class="btn" id="arenaSignup" type="button">Criar conta</button><button class="btn small" id="arenaRecover" type="button">Esqueci a senha</button></div></form><p class="arena-hint">A conta não libera o mural automaticamente. Raphael ou Luis precisa aprovar seu perfil. Nunca compartilhe sua senha.</p></div></div>'+
 '<div id="arenaWaiting" class="arena-card hidden"><h3>Solicitação de acesso</h3><p id="arenaMemberInfo"></p><div id="arenaRequestArea"><label>Selecione seu nome na competição<select id="arenaProfessional"></select></label><button class="btn primary" id="arenaRequest" type="button">Solicitar aprovação</button></div><button class="btn small" id="arenaLeave" type="button">Sair desta conta</button></div>'+
 '<div id="arenaFeedArea" class="hidden"><div class="arena-spotlight" id="arenaSpotlight"></div><div class="arena-compose"><div class="arena-authrow"><span id="arenaIdentity"></span><button class="btn small" id="arenaReload" type="button">↻ Atualizar</button></div><h3 class="arena-compose-title">💬 Qual é o grito da Arena hoje?</h3><form id="arenaPostForm"><div class="arena-input-wrap"><textarea id="arenaPostText" rows="2" maxlength="50" placeholder="Mande sua torcida, desafio ou parabéns... 🔥" required></textarea><div class="arena-emoji-bar" id="arenaEmojiBar"></div></div><div class="arena-compose-bottom"><select id="arenaPostCategory" aria-label="Tipo da publicação"><option value="torcida">❤️ Torcida</option><option value="desafio">🔥 Desafio</option><option value="parabens">👏 Parabéns</option><option value="meta">🏆 Meta batida</option><option value="gestao">🛡️ Recado da gestão</option></select><span id="arenaPostCount">0 / 50</span><button class="btn primary" type="submit">🚀 Publicar</button></div></form></div><div class="arena-feed-toolbar"><strong>💬 Conversas da Arena</strong><div class="arena-feed-filters"><select id="arenaFeedFilter" aria-label="Filtrar mensagens"><option value="all">Todas as mensagens</option><option value="desafio">🔥 Desafios</option><option value="parabens">👏 Parabéns</option><option value="meta">🏆 Metas batidas</option><option value="gestao">🛡️ Gestão</option></select><select id="arenaFeedSort" aria-label="Ordenação"><option value="recent">Mais recentes</option><option value="popular">Mais curtidas</option></select></div></div><div id="arenaFeed"></div></div>'+
 '';
 if(!section.parentElement)document.querySelector('.nav').insertAdjacentElement('afterend',section);
 // Mover depois de inserir a Arena no DOM: antes disso getElementById não encontra o painel.
 const managementSection=document.getElementById('management');
 if(managementSection){
  const holder=document.createElement('div');holder.innerHTML="<details id=\"arenaManage\" class=\"arena-card arena-manager hidden\"><summary>🛡️ Gestão: aprovações e moderação</summary><div class=\"arena-authrow\"><h3>Solicitações de acesso</h3><button class=\"btn small\" id=\"arenaReviewReload\">Atualizar solicitações</button></div><div id=\"arenaReviewList\"></div><h3 style=\"margin-top:20px\">Moderação de mensagens</h3><div id=\"arenaModPosts\"></div><p class=\"arena-hint\">Só aprove o perfil após confirmar que a pessoa corresponde ao profissional indicado. O banco impede dois perfis aprovados com o mesmo nome.</p></details>";
  const managementPanel=holder.firstElementChild;
  managementPanel.open=true;
  managementSection.appendChild(managementPanel);
 }

 // Arena 2.0: chat compacto, publicações e destaques com dados existentes.
 const feedArea=document.getElementById('arenaFeedArea');
 if(feedArea){
  const switcher=document.createElement('div');switcher.className='arena-community-tabs';switcher.setAttribute('role','tablist');switcher.setAttribute('aria-label','Seções da Arena');
  switcher.innerHTML='<button type="button" class="arena-community-tab active" data-arena-view="chat" role="tab" aria-selected="true">Conversas</button><button type="button" class="arena-community-tab" data-arena-view="posts" role="tab" aria-selected="false">Publicações</button><button type="button" class="arena-community-tab" data-arena-view="highlights" role="tab" aria-selected="false">Destaques</button>';
  feedArea.prepend(switcher);
  const note=document.createElement('p');note.className='arena-community-note';note.textContent='Converse com a equipe, compartilhe conquistas e acompanhe os destaques.';switcher.after(note);
  function switchView(view){
   feedArea.dataset.communityView=view;
   switcher.querySelectorAll('[data-arena-view]').forEach(b=>{const active=b.dataset.arenaView===view;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active))});
   const spotlight=document.getElementById('arenaSpotlight'),compose=feedArea.querySelector('.arena-compose'),toolbar=feedArea.querySelector('.arena-feed-toolbar'),feed=document.getElementById('arenaFeed');
   if(spotlight)spotlight.style.display=view==='chat'?'none':'';
   if(compose)compose.style.display=view==='highlights'?'none':'';
   if(toolbar)toolbar.style.display=view==='highlights'?'none':'';
   if(feed)feed.style.display=view==='highlights'?'none':'';
   if(window.bmwArenaReadyForTabs&&typeof drawFeed==='function')drawFeed();
   const title=feedArea.querySelector('.arena-compose-title');if(title)title.textContent=view==='chat'?'Mensagem para o grupo': 'Compartilhe uma conquista com a Arena';
   const field=document.getElementById('arenaPostText');if(field)field.placeholder=view==='chat'?'Escreva para os competidores...':'Publique sua conquista, meta ou desafio...';
  }
  switcher.addEventListener('click',e=>{const b=e.target.closest('[data-arena-view]');if(b)switchView(b.dataset.arenaView)});
  switchView('chat');
 }

 const communityStyle=document.createElement('style');communityStyle.id='arena-community-v20';communityStyle.textContent=`.arena-community-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;padding:5px;background:#0b192b;border:1px solid #2d4561;border-radius:14px;margin:14px 0 5px}.arena-community-tab{border:0;border-radius:10px;padding:12px 8px;color:#a9c2df;background:transparent;font-weight:750;cursor:pointer}.arena-community-tab.active{background:#263d5d;color:#fff;box-shadow:0 2px 12px #0003}.arena-community-note{font-size:12px;color:#a9bfdc;margin:8px 2px 15px}.arena-head h2{margin-bottom:6px}.arena-head p{margin-top:0}.arena-feed-toolbar{margin-top:16px}.arena-compose{border-radius:17px;padding:15px}.arena-compose textarea{border-radius:12px}.arena-post{border-radius:16px}.arena-post-actions{opacity:.95}#arenaFeedArea[data-community-view="chat"] .arena-chat-message{max-width:88%;padding:12px 15px;margin:10px 0;background:#1b344f;border-color:#355777}#arenaFeedArea[data-community-view="chat"] .arena-chat-message:nth-child(even){margin-left:auto;background:#183d52;border-color:#356577}#arenaFeedArea[data-community-view="chat"] .arena-chat-bubble{font-size:15px;font-weight:500;line-height:1.45;margin:7px 0}#arenaFeedArea[data-community-view="chat"] .arena-chat-actions{gap:5px}#arenaFeedArea[data-community-view="chat"] .arena-chat-actions .arena-action{font-size:11px;padding:5px 8px}#arenaFeedArea[data-community-view="chat"] .arena-chat-header{font-size:11px}#arenaFeedArea[data-community-view="posts"] .arena-chat-message{padding:19px}#arenaFeedArea[data-community-view="posts"] .arena-chat-bubble{font-size:19px}#arenaFeedArea[data-community-view="highlights"] .arena-spotlight{margin-top:15px}@media(max-width:600px){.arena-community-tab{font-size:12px;padding:11px 4px}#arenaFeedArea[data-community-view="chat"] .arena-chat-message{max-width:96%}.arena-head{flex-direction:column}.arena-post-actions .btn{font-size:11px}}`;
 document.head.appendChild(communityStyle);
 // O painel administrativo nunca deve ser inserido na Arena.

 const css=document.createElement('style');
 css.textContent='.arena-head{display:flex;justify-content:space-between;gap:15px;align-items:start;margin-bottom:12px}.arena-head p,.arena-hint{color:#adc0d8;font-size:12px;line-height:1.5}.arena-subtitle{font-size:12px;color:#f1cd84}.arena-card,.arena-compose,.arena-post{border:1px solid #39536f;border-radius:13px;background:#172940;padding:14px;margin:12px 0}.arena-card h3,.arena-post h3{margin:0 0 9px}.arena-card label{display:flex;flex-direction:column;gap:7px;margin:12px 0;color:#bacde4;font-size:12px;font-weight:650}.arena-card input,.arena-card select,.arena-compose textarea,.arena-comments input{width:100%;padding:10px;background:#0b192b;color:#f3f6fc;border:1px solid #4e6581;border-radius:9px}.arena-buttons{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.arena-authrow{display:flex;justify-content:space-between;align-items:center;gap:9px;flex-wrap:wrap}.arena-status{font-size:12px;color:#f1cd84;min-height:16px}.arena-post-text{font-size:18px;font-weight:700;overflow-wrap:anywhere;margin:12px 0}.arena-post-head{display:flex;justify-content:space-between;align-items:center;gap:8px;color:#a9bfdc;font-size:12px}.arena-post-head strong{color:#f4d18e}.arena-post-actions{display:flex;flex-wrap:wrap;gap:9px}.arena-post-actions .btn{padding:6px 10px}.arena-comment{border-top:1px solid #344b64;padding:7px 0;font-size:12px}.arena-comment b{color:#e4c580}.arena-comments{margin-top:10px}.arena-comment-form{display:flex;gap:8px;margin-top:8px}.arena-comment-form input{min-width:0;flex:1}.arena-review-row{border-top:1px solid #3b526a;padding:10px 0}.arena-review-row strong{display:block}.arena-review-row small{display:block;color:#b5c9e0;margin:4px 0 8px}@media(max-width:600px){.arena-head{flex-direction:column}.arena-card,.arena-compose,.arena-post{padding:11px}.arena-post-text{font-size:16px}.arena-comment-form{flex-wrap:wrap}}';
 css.textContent+="\n#arena{max-width:1100px;margin-inline:auto}\n.arena-head h2{font-size:24px}\n.arena-spotlight-card{background:linear-gradient(112deg,#2e3d62,#1d314b 65%,#17374d);border:1px solid #806b58;border-radius:17px;padding:17px 22px;display:flex;justify-content:space-between;gap:15px;align-items:center;margin-bottom:14px}\n.arena-spotlight-card small{display:block;color:#f4c677;font-size:10px;letter-spacing:1.6px;font-weight:800;margin-bottom:6px}\n.arena-spotlight-card strong{display:block;font-size:18px;color:#fff;overflow-wrap:anywhere}\n.arena-spotlight-card span{display:block;font-size:11px;color:#c5d7e8;margin-top:6px}\n.arena-spotlight-icon{font-size:38px}\n.arena-compose{padding:18px;background:#1a2d45;border-radius:16px}\n.arena-compose-title{font-size:16px;margin:16px 0 9px;color:#f0f4ff}\n.arena-input-wrap{border:1px solid #496480;border-radius:13px;overflow:hidden;background:#0c1b2e}\n.arena-input-wrap textarea{border:0!important;border-radius:0!important;background:transparent!important;resize:vertical;font-size:14px;min-height:76px}\n.arena-emoji-bar{display:flex;gap:5px;padding:6px 8px;border-top:1px solid #28425b;flex-wrap:wrap}\n.arena-emoji-insert{border:0;background:transparent;cursor:pointer;padding:5px 7px;border-radius:8px;font-size:17px}\n.arena-emoji-insert:hover{background:#294562}\n.arena-compose-bottom{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:12px}\n.arena-compose-bottom select,.arena-feed-filters select{background:#10233a;border:1px solid #466383;border-radius:9px;color:#f2f5fc;padding:9px;font-size:12px}\n#arenaPostCount{margin-left:auto;color:#bbcadc;font-size:12px}\n.arena-feed-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:18px 0 10px}\n.arena-feed-toolbar strong{font-size:17px}\n.arena-feed-filters{display:flex;gap:8px;flex-wrap:wrap}\n.arena-chat-message{background:#172b45;border:1px solid #365371;border-radius:17px;margin:10px 0;padding:17px;box-shadow:0 4px 16px #07111e2b}\n.arena-chat-pinned{border-color:#c59b58;box-shadow:0 0 0 1px #c59b5822}\n.arena-chat-header{display:flex;align-items:center;gap:10px}\n.arena-avatar,.arena-mini-avatar{width:39px;height:39px;border-radius:13px;background:linear-gradient(140deg,#9a7848,#4a698e);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:850;flex:none}\n.arena-chat-author{flex:1;min-width:0}\n.arena-chat-author strong{display:block;color:#f4e0af;font-size:13px;overflow-wrap:anywhere}\n.arena-chat-author span{display:block;color:#a9c0d9;font-size:11px;margin-top:3px}\n.arena-chat-header time{font-size:11px;color:#b9cbdf;align-self:start}\n.arena-chat-bubble{margin:14px 0 10px 49px;padding:13px 16px;border-radius:4px 15px 15px 15px;background:#203b59;border:1px solid #375878;font-size:17px;font-weight:600;line-height:1.5;overflow-wrap:anywhere}\n.arena-reaction-row{display:flex;gap:6px;flex-wrap:wrap;margin-left:49px}\n.arena-react{border:1px solid #425b73;background:#1b3048;border-radius:999px;padding:6px 11px;color:#fff;font-size:14px;cursor:pointer}\n.arena-react.active{border-color:#e3bc70;background:#58492f}\n.arena-chat-actions{display:flex;gap:15px;align-items:center;flex-wrap:wrap;margin-top:13px;padding:11px 0 0;border-top:1px solid #304c68}\n.arena-action,.arena-mini-delete{background:none;border:0;color:#c9daf0;cursor:pointer;font-size:12px;font-weight:700;padding:5px}\n.arena-action:hover{color:#f3c979}\n.arena-delete{margin-left:auto;color:#efb1b1}\n.arena-chat-comments{border-top:1px solid #2b4662;padding-top:11px;margin-top:10px}\n.arena-mini-message{display:flex;gap:8px;align-items:flex-start;margin:9px 0}\n.arena-mini-avatar{width:28px;height:28px;border-radius:10px;font-size:9px}\n.arena-mini-bubble{background:#0d2035;border:1px solid #2e4860;border-radius:4px 12px 12px;padding:8px 12px;min-width:0;flex:1}\n.arena-mini-bubble strong{font-size:11px;color:#f2d28c}.arena-mini-bubble p{font-size:13px;margin:4px 0;color:#fff;overflow-wrap:anywhere}.arena-mini-bubble small{font-size:10px;color:#9eb8d4}\n.arena-comment-form{display:flex;gap:8px;margin-top:10px}\n.arena-empty{text-align:center;padding:26px;background:#172b43;border-radius:14px;color:#f3cf86}.arena-empty span{font-size:12px;color:#aebfd5}\n.arena-manager{margin-top:19px!important}.arena-manager>summary{font-weight:800;cursor:pointer;color:#f2d39a;font-size:14px}\n@media(max-width:650px){.arena-chat-message,.arena-compose{padding:12px}.arena-chat-bubble,.arena-reaction-row{margin-left:0}.arena-feed-toolbar{align-items:flex-start;flex-direction:column}.arena-feed-filters select{max-width:165px}.arena-chat-bubble{font-size:15px}.arena-chat-header time{font-size:10px}.arena-compose-bottom select{flex:1}}\n";
 document.head.appendChild(css);

 let local=null,user=null,member=null,postCache=[],comments=[],likes=[],reactions=[],poll=null,postLastAt=0;const visibleComments=new Set();const emojiSet=['🔥','👏','💪','😂','👀','🏆'];const categoryLabels={torcida:'❤️ Torcida',desafio:'🔥 Desafio',parabens:'👏 Parabéns',meta:'🏆 Meta batida',gestao:'🛡️ Gestão'};
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
  el('arenaPostCategory').querySelector('option[value="gestao"]').disabled=!admin;
  if(!admin&&el('arenaPostCategory').value==='gestao')el('arenaPostCategory').value='torcida';
  // O login é único; não existe botão de logout separado na Arena.
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
   if(member?.status==='approved'||admin){await loadFeed();setmsg('✅ Mural carregado. Publique, curta e comente!')}
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
   setmsg('Cadastro enviado. Entre com seu e-mail e senha na tela inicial e acompanhe a aprovação da gestão. Não é necessário confirmar por e-mail quando essa opção estiver desativada no Supabase.');
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
 el('arenaLeave').onclick=()=>window.bmwLogout?.();
 const age=iso=>{try{return new Date(iso).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}catch{return ''}};

 const avatar=name=>safe(String(name||'?').split(/\s+/).filter(Boolean).slice(0,2).map(v=>v[0]).join('').toUpperCase());
 const ago=iso=>{const d=Math.max(0,Date.now()-new Date(iso).getTime());return d<60000?'Agora':d<3600000?Math.floor(d/60000)+' min':d<86400000?Math.floor(d/3600000)+' h':age(iso)};
 const isToday=iso=>new Date(iso).toDateString()===new Date().toDateString();
 function drawFeed(){
  const filter=el('arenaFeedFilter').value,sort=el('arenaFeedSort').value;
  const reactionScore=post=>likes.filter(x=>x.post_id===post.id).length+reactions.filter(x=>x.post_id===post.id).length;
  const view=document.getElementById('arenaFeedArea')?.dataset.communityView||'chat';
  const list=postCache.filter(p=>(filter==='all'||p.category===filter)&&(view!=='posts'||p.category!=='torcida')).sort((a,b)=>Number(b.pinned)-Number(a.pinned)||(sort==='popular'?reactionScore(b)-reactionScore(a)||Date.parse(b.created_at)-Date.parse(a.created_at):Date.parse(b.created_at)-Date.parse(a.created_at)));
  const mostToday=postCache.filter(x=>isToday(x.created_at)).sort((a,b)=>reactionScore(b)-reactionScore(a))[0];
  const pinned=postCache.find(p=>p.pinned);
  el('arenaSpotlight').innerHTML='<div class="arena-spotlight-card"><div><small>🏆 DESTAQUE DA ARENA</small><strong>'+(pinned?safe(pinned.body):mostToday?safe(mostToday.body):'Quem vai subir no ranking hoje? 🔥')+'</strong><span>'+(pinned?'📌 Recado fixado • '+safe(pinned.professional):mostToday?'🔥 Mais interagido hoje • '+safe(mostToday.professional):'A competição começa com você!')+'</span></div><div class="arena-spotlight-icon">🏆</div></div>';
  el('arenaFeed').innerHTML=list.map(post=>{
   const cs=comments.filter(x=>x.post_id===post.id),ls=likes.filter(x=>x.post_id===post.id),rs=reactions.filter(x=>x.post_id===post.id),liked=ls.some(x=>x.user_id===user.id),mine=post.user_id===user.id,open=visibleComments.has(post.id);
   return '<article class="arena-chat-message '+(post.pinned?'arena-chat-pinned':'')+'" data-msg="'+post.id+'"><div class="arena-chat-header"><div class="arena-avatar">'+avatar(post.professional)+'</div><div class="arena-chat-author"><strong>'+safe(post.professional)+'</strong><span>'+safe(categoryLabels[post.category]||'❤️ Torcida')+(post.pinned?' • 📌 Fixado':'')+'</span></div><time>'+ago(post.created_at)+'</time></div><div class="arena-chat-bubble">'+safe(post.body)+'</div><div class="arena-reaction-row">'+emojiSet.map(e=>{const n=rs.filter(r=>r.emoji===e).length,selected=rs.some(r=>r.emoji===e&&r.user_id===user.id);return '<button class="arena-react '+(selected?'active':'')+'" data-react="'+post.id+'" data-emoji="'+e+'" aria-label="Reagir '+e+'">'+e+(n?' '+n:'')+'</button>'}).join('')+'</div><div class="arena-chat-actions"><button class="arena-action" data-like="'+post.id+'">'+(liked?'❤️ Curtido':'🤍 Curtir')+' · '+ls.length+'</button><button class="arena-action" data-commenttoggle="'+post.id+'">💬 Conversar · '+cs.length+'</button>'+(admin?'<button class="arena-action" data-pin="'+post.id+'">'+(post.pinned?'📍 Desafixar':'📌 Fixar')+'</button>':'')+(mine||admin?'<button class="arena-action arena-delete" data-delete="'+post.id+'">Excluir</button>':'')+'</div><div class="arena-chat-comments '+(open?'':'hidden')+'" id="arenaComments'+post.id+'">'+cs.map(c=>'<div class="arena-mini-message"><div class="arena-mini-avatar">'+avatar(c.professional)+'</div><div class="arena-mini-bubble"><strong>'+safe(c.professional)+'</strong><p>'+safe(c.body)+'</p><small>'+ago(c.created_at)+'</small>'+(c.user_id===user.id||admin?' <button class="arena-mini-delete" data-deletecomment="'+c.id+'">Excluir</button>':'')+'</div></div>').join('')+'<form class="arena-comment-form" data-post="'+post.id+'"><input maxlength="50" required placeholder="Responda em até 50 caracteres 💬" aria-label="Responder"><button class="btn small primary" type="submit">Enviar</button></form></div></article>';
  }).join('')||'<div class="arena-empty">💬 Nenhuma conversa neste filtro.<br><span>Que tal puxar o próximo desafio? 🔥</span></div>';
  el('arenaFeed').querySelectorAll('[data-commenttoggle]').forEach(btn=>btn.onclick=()=>{const id=Number(btn.dataset.commenttoggle);if(visibleComments.has(id))visibleComments.delete(id);else visibleComments.add(id);el('arenaComments'+id).classList.toggle('hidden')});
  el('arenaFeed').querySelectorAll('[data-like]').forEach(btn=>btn.onclick=async()=>{
   btn.disabled=true;const id=Number(btn.dataset.like),selected=likes.some(x=>x.post_id===id&&x.user_id===user.id);
   try{if(selected)await api('bmw_x1_likes?post_id=eq.'+id+'&user_id=eq.'+encodeURIComponent(user.id),{method:'DELETE'},admin);else await api('bmw_x1_likes',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({post_id:id,user_id:user.id})},admin);await loadFeed()}catch(e){setmsg('Curtida: '+e.message)}finally{btn.disabled=false}
  });
  el('arenaFeed').querySelectorAll('[data-react]').forEach(btn=>btn.onclick=async()=>{
   const id=Number(btn.dataset.react),emoji=btn.dataset.emoji,old=reactions.find(r=>r.post_id===id&&r.user_id===user.id);btn.disabled=true;
   try{
    if(old?.emoji===emoji)await api('bmw_x1_reactions?post_id=eq.'+id+'&user_id=eq.'+encodeURIComponent(user.id),{method:'DELETE'},admin);
    else if(old)await api('bmw_x1_reactions?post_id=eq.'+id+'&user_id=eq.'+encodeURIComponent(user.id),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({emoji})},admin);
    else await api('bmw_x1_reactions',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({post_id:id,user_id:user.id,emoji})},admin);
    await loadFeed();
   }catch(e){setmsg('Reação: '+e.message)}finally{btn.disabled=false}
  });
  el('arenaFeed').querySelectorAll('[data-pin]').forEach(btn=>btn.onclick=async()=>{const id=Number(btn.dataset.pin),p=postCache.find(x=>x.id===id);if(!p||!admin)return;
   try{await api('bmw_x1_posts?id=eq.'+id,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({pinned:!p.pinned})},true);await loadFeed()}catch(e){setmsg('Fixar: '+e.message)}
  });
  el('arenaFeed').querySelectorAll('[data-delete]').forEach(btn=>btn.onclick=async()=>{if(!confirm('Excluir esta publicação?'))return;try{await api('bmw_x1_posts?id=eq.'+Number(btn.dataset.delete),{method:'DELETE'},admin);await loadFeed()}catch(e){setmsg('Excluir: '+e.message)}});
  el('arenaFeed').querySelectorAll('[data-deletecomment]').forEach(btn=>btn.onclick=async()=>{try{await api('bmw_x1_comments?id=eq.'+Number(btn.dataset.deletecomment),{method:'DELETE'},admin);await loadFeed()}catch(e){setmsg('Excluir comentário: '+e.message)}});
  el('arenaFeed').querySelectorAll('form[data-post]').forEach(form=>form.onsubmit=async e=>{
   e.preventDefault();if(!canInteract())return;
   const body=form.querySelector('input').value.trim();if(!body||Array.from(body).length>50)return;
   const button=form.querySelector('button');button.disabled=true;
   try{await api('bmw_x1_comments',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({post_id:Number(form.dataset.post),user_id:user.id,professional:authorName(),body})},admin);visibleComments.add(Number(form.dataset.post));await loadFeed()}catch(err){setmsg('Comentário: '+err.message)}finally{button.disabled=false}
  });
 }
 async function loadFeed(){
  if(!canInteract())return;
  const [p,c,l,r]=await Promise.all([
   api('bmw_x1_posts?select=id,user_id,professional,body,category,pinned,created_at&order=created_at.desc&limit=80',{},admin),
   api('bmw_x1_comments?select=id,post_id,user_id,professional,body,created_at&order=created_at.asc&limit=500',{},admin),
   api('bmw_x1_likes?select=post_id,user_id&limit=2000',{},admin),
   api('bmw_x1_reactions?select=post_id,user_id,emoji&limit=2000',{},admin)
  ]);
  postCache=p||[];comments=c||[];likes=l||[];reactions=r||[];
  window.bmwArenaReadyForTabs=true;
  drawFeed();
 }
 el('arenaFeedSort').onchange=drawFeed;
 el('arenaFeedFilter').onchange=drawFeed;
 const bar=el('arenaEmojiBar');
 emojiSet.concat(['❤️','🚀','😎']).forEach(emoji=>{
  const btn=document.createElement('button');btn.type='button';btn.className='arena-emoji-insert';btn.textContent=emoji;btn.title='Inserir '+emoji;
  btn.onclick=()=>{const field=el('arenaPostText'),before=field.value;const next=before+emoji;if(Array.from(next).length<=50){field.value=next;field.dispatchEvent(new Event('input',{bubbles:true}));field.focus()}};
  bar.appendChild(btn)
 });
 el('arenaPostText').oninput=()=>el('arenaPostCount').textContent=Array.from(el('arenaPostText').value).length+' / 50';
 el('arenaPostForm').onsubmit=async e=>{
  e.preventDefault();if(!canInteract())return setmsg('Acesso não autorizado.');const body=el('arenaPostText').value.trim();if(!body||Array.from(body).length>50)return setmsg('Use de 1 a 50 caracteres.');if(Date.now()-postLastAt<15000)return setmsg('Aguarde 15 segundos entre suas publicações.');
  const button=el('arenaPostForm').querySelector('button');button.disabled=true;
  try{
   await api('bmw_x1_posts',{method:'POST',body:JSON.stringify({user_id:user.id,professional:authorName(),body,category:admin?el('arenaPostCategory').value:el('arenaPostCategory').value==='gestao'?'torcida':el('arenaPostCategory').value}),headers:{Prefer:'return=minimal'}},admin);postLastAt=Date.now();
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
 window.bmwArenaOpen=function(){
  if(!accessGranted)return;
  el('arenaFeedArea').classList.remove('hidden');
  setmsg('Abrindo seu Mural...');
  connect().catch(e=>setmsg('Não foi possível abrir o Mural: '+e.message));
  if(admin)review().catch(e=>setmsg('Aprovações: '+e.message));
 };
 // O clique da Arena é tratado exclusivamente pela navegação central do aplicativo.
 setInterval(()=>{if(el('arena').classList.contains('hidden')||(member?.status!=='approved'&&!admin))return;if(document.activeElement===el('arenaPostText')||document.activeElement?.closest('.arena-comment-form'))return;loadFeed().catch(()=>{})},30000);
 // Também mostrar a aprovação de acesso dentro da Gestão, sem mudar as permissões existentes.
 const approveShortcut=document.createElement('button');approveShortcut.className='btn small';approveShortcut.type='button';approveShortcut.textContent='👥 Aprovar contas do mural';
 approveShortcut.onclick=()=>{
  nav('management');
  const panel=el('arenaManage');
  panel.open=true;
  review().catch(e=>setmsg('Aprovações: '+e.message));
  panel.scrollIntoView?.({behavior:'smooth',block:'start'});
 };
 const management=document.getElementById('management');
 if(management){
  const heading=management.querySelector('h2');
  management.insertBefore(approveShortcut,heading?.nextSibling||management.firstChild);
  // O painel precisa estar na seção Gestão; dentro da Arena ele ficava oculto ao navegar.
  management.insertBefore(el('arenaManage'),approveShortcut.nextSibling);
 }
})();
