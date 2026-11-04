'use strict';
(function(){
 const el=id=>document.getElementById(id);
 const message=t=>{el('bmwGateMessage').textContent=t||''};
 const parts=['bmwGateAuth','bmwGateRequest','bmwGatePending'];
 let gateSession=null,user=null,member=null,busy=false,checking=false,revalidating=false,signupBlockUntil=0,signupTicker=null,signupMode=false,signupProfessional='';
 const baseHeaders=t=>({Authorization:'Bearer '+t});
 const show=(id)=>{for(const x of parts)el(x).style.display=x===id?'block':'none'};
 const setBusy=value=>{busy=value;for(const id of ['bmwGateEnter','bmwGateSignup','bmwGateReset','bmwGateRequestButton','bmwGateRecheck'])el(id).disabled=value};
 const signupField=document.createElement('div');
 signupField.id='bmwSignupProfessionalWrap';signupField.style.display='none';
 signupField.innerHTML='<label for="bmwSignupProfessional">Seu nome na equipe</label><select id="bmwSignupProfessional" style="width:100%;padding:12px;border-radius:9px" required><option value="">Carregando participantes...</option></select>';
 el('bmwGateConfirmWrap').after(signupField);
 async function prepareSignupRoster(){
  const rows=await rest('/rest/v1/bmw_x1_roster?select=professional,role&order=professional.asc');
  const select=el('bmwSignupProfessional');select.innerHTML='<option value="">Selecione seu nome</option>';
  for(const p of rows||[]){const option=document.createElement('option');option.value=p.professional;option.textContent=p.professional+' · '+p.role;select.appendChild(option)}
  if(!rows?.length)throw Error('Não foi possível carregar a lista de profissionais.');
 }
 async function submitPendingRequest(t,identity,professional){
  await rest('/rest/v1/bmw_x1_members',{method:'POST',headers:{...baseHeaders(t),Prefer:'return=minimal'},body:JSON.stringify({user_id:identity.id,requester_email:String(identity.email||'').toLowerCase(),professional,status:'pending'})});
 }
 function setSignupMode(active){
  if(busy)return;
  signupMode=active;
  el('bmwGateConfirmWrap').style.display=active?'block':'none';
  signupField.style.display=active?'block':'none';
  el('bmwSignupProfessional').required=active;
  if(active)prepareSignupRoster().catch(e=>message('Não foi possível carregar os profissionais: '+e.message));
  el('bmwGateConfirm').required=active;
  el('bmwGatePassword').autocomplete=active?'new-password':'current-password';
  el('bmwGateEnter').textContent=active?'Criar minha conta':'Entrar';
  el('bmwGateSignup').textContent=active?'Voltar ao login':'Criar conta';
  el('bmwGateReset').style.display='none';
  message(active?'Cadastro novo: informe seu e-mail, crie uma senha e confirme-a. Depois clique em Criar minha conta.':'Acesse com seu e-mail e senha já cadastrados.');
 }
 function clearClient(){
  accessGranted=false;admin=false;session=null;gateSession=null;user=null;member=null;
  people=[];changes=[];approvalsAvailable=false;
  document.body.classList.remove('bmw-authorized');
  sessionStorage.removeItem('bmwx1-auth');
  localStorage.removeItem('bmw-x1-arena-auth');
  menu();
 }
 function storeAuth(obj,asAdmin){
  const wrapped={...obj,expires_at:obj.expires_at||Math.floor(Date.now()/1000)+Number(obj.expires_in||3600)};
  gateSession=wrapped;
  if(asAdmin){
   session=wrapped;sessionStorage.setItem('bmwx1-auth',JSON.stringify(wrapped));
   localStorage.removeItem('bmw-x1-arena-auth');
  }else{
   session=null;sessionStorage.removeItem('bmwx1-auth');
   localStorage.setItem('bmw-x1-arena-auth',JSON.stringify(wrapped));
  }
 }
 async function jwt(){
  if(!gateSession)return null;
  if(Date.now() < Number(gateSession.expires_at||0)*1000-45000)return gateSession.access_token;
  try{
   const result=await rest('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:gateSession.refresh_token})});
   storeAuth(result,admin);
   return gateSession.access_token;
  }catch(error){
   // Falha de rede não é prova de que a sessão expirou.
   if(/invalid refresh token|refresh token not found|invalid grant|session not found|jwt expired/i.test(String(error?.message||''))){
    clearClient();show('bmwGateAuth');message('Sessão encerrada. Faça login novamente.');
    return null;
   }
   throw error;
  }
 }
 window.bmwAppToken=jwt;
 async function isManager(t){
  const rows=await rest('/rest/v1/bmw_x1_admin_allowlist?select=email&limit=1',{headers:baseHeaders(t)});
  return Array.isArray(rows)&&rows.length===1;
 }
 async function getMember(t,id){
  const rows=await rest('/rest/v1/bmw_x1_members?select=professional,status,requested_at&user_id=eq.'+encodeURIComponent(id),{headers:baseHeaders(t)});
  return Array.isArray(rows)?rows[0]||null:null;
 }
 async function loadRoster(t){
  const rows=await rest('/rest/v1/bmw_x1_roster?select=professional,role&order=professional.asc',{headers:baseHeaders(t)});
  const select=el('bmwGateProfessional');
  select.innerHTML='';
  for(const p of rows){
   const opt=document.createElement('option');opt.value=p.professional;opt.textContent=p.professional+' · '+p.role;select.appendChild(opt);
  }
  if(!rows.length)throw Error('Lista de participantes indisponível.');
 }
 function pendingScreen(){
  show('bmwGatePending');
  el('bmwGatePendingTitle').textContent=member?.status==='rejected'?'Acesso não aprovado':'Aguardando aprovação';
  el('bmwGatePendingText').textContent=member?.status==='rejected'?
   'Sua solicitação para '+member.professional+' foi recusada. Procure Raphael ou Luis.':
   'Solicitação para '+member.professional+'. Raphael ou Luis precisa aprovar o cadastro para liberar o ranking, resultados individuais e Arena.';
  message('Você será avisado quando atualizar o status de acesso.');
 }
 async function enableApp(isAdmin){
  const alreadyOpen=accessGranted&&document.body.classList.contains('bmw-authorized');
  accessGranted=true;admin=isAdmin;
  document.body.classList.add('bmw-authorized');
  show('bmwGateAuth');
  menu();
  // Não trocar a aba selecionada quando houver revalidação.
  if(!alreadyOpen)nav('ranking');
  try{
   await refresh();
  }catch(err){
   const node=document.getElementById('publicLoadStatus');
   if(node)node.textContent='Login confirmado. Não foi possível carregar o ranking agora: '+(err?.message||err)+'. Abra a Arena ou use Atualizar ranking.';
   // Uma falha de rede no ranking não deve bloquear o login nem a Arena.
  }
 }
 async function checkSession(){
  if(checking)return;checking=true;
  try{
   const t=await jwt();
   if(!t){show('bmwGateAuth');return}
   user=await rest('/auth/v1/user',{headers:baseHeaders(t)});
   if(!user?.id)throw Error('Não foi possível confirmar sua identidade.');
   const manager=await isManager(t);
   if(manager){
    storeAuth(gateSession,true);
    message('Acesso de gestor confirmado.');
    await enableApp(true);
    return;
   }
   member=await getMember(t,user.id);
   if(member?.status==='approved'){
    storeAuth(gateSession,false);
    message('Cadastro aprovado.');
    await enableApp(false);
   }else{
    accessGranted=false;admin=false;document.body.classList.remove('bmw-authorized');menu();
    if(member)pendingScreen();
    else{await loadRoster(t);show('bmwGateRequest');el('bmwGateAccount').textContent='Conta autenticada: '+(user.email||'')+'. Escolha seu nome para que Raphael ou Luis possa aprovar seu acesso.';message('Selecione apenas seu próprio nome. A gestão verificará a identidade.')}
   }
  }catch(error){
   // Uma falha temporária não deve trocar a tela de quem já está autorizado.
   if(accessGranted&&document.body.classList.contains('bmw-authorized')){
    const status=document.getElementById('publicLoadStatus');
    if(status)status.textContent='Conexão instável. Seu acesso e a aba atual foram preservados; tente atualizar novamente.';
   }else{
    show('bmwGateAuth');
    message('Não foi possível validar sua conta agora: '+error.message+'. Toque em Entrar novamente.');
   }
  }finally{checking=false}
 }
 function rateLimit(err){
  const text=String(err?.message||err);
  const match=text.match(/(?:after|in)\s+(\d+)\s*seconds?/i);
  if(/security purposes|too many|rate.limit|429/i.test(text)){
   const seconds=match?Math.max(1,Number(match[1])):60;
   signupBlockUntil=Date.now()+seconds*1000;
   if(signupTicker)clearInterval(signupTicker);
   signupTicker=setInterval(()=>{
    const n=Math.max(0,Math.ceil((signupBlockUntil-Date.now())/1000));
    if(signupMode){el('bmwGateEnter').textContent=n?'Aguarde '+n+'s':'Criar minha conta';el('bmwGateEnter').disabled=n>0}
    if(!n){clearInterval(signupTicker);signupTicker=null}
   },1000);
   message('Limite temporário de cadastros. Aguarde '+seconds+' segundos e tente novamente somente uma vez.');
  }else message('Cadastro: '+text);
 }
 el('bmwGateForm').onsubmit=async e=>{
  e.preventDefault();if(busy)return;
  const email=el('bmwGateEmail').value.trim().toLowerCase(),password=el('bmwGatePassword').value;
  if(signupMode){
   if(Date.now()<signupBlockUntil){rateLimit(new Error('For security purposes, you can only request this after '+Math.ceil((signupBlockUntil-Date.now())/1000)+' seconds.'));return}
   signupProfessional=el('bmwSignupProfessional').value;
   if(!signupProfessional){message('Selecione seu nome na equipe para solicitar aprovação.');return}
   if(password.length<8||password!==el('bmwGateConfirm').value){message(password.length<8?'A senha precisa ter pelo menos oito caracteres.':'As duas senhas estão diferentes. Digite novamente.');return}
   setBusy(true);message('Criando sua conta, confira a mensagem aqui...');
   try{
    const created=await rest('/auth/v1/signup',{method:'POST',body:JSON.stringify({email,password})});
    el('bmwGatePassword').value='';el('bmwGateConfirm').value='';
    signupMode=false;setBusy(false);setSignupMode(false);
    if(created?.access_token&&created?.refresh_token){
     storeAuth(created,false);
     try{
      const identity=await rest('/auth/v1/user',{headers:baseHeaders(created.access_token)});
      if(!identity?.id)throw Error('Identidade não confirmada.');
      await submitPendingRequest(created.access_token,identity,signupProfessional);
      member={professional:signupProfessional,status:'pending'};
      pendingScreen();
      message('Cadastro enviado para aprovação dos administradores. Nenhum e-mail de confirmação é necessário.');
     }catch(requestError){
      message('Conta criada, mas o pedido ainda não foi registrado: '+requestError.message+'. Entre com sua senha para concluir a solicitação.');
      await checkSession();
     }
    }else{
     message('Cadastro recebido, mas o Supabase não retornou uma sessão. Isso também acontece quando o e-mail já está cadastrado. Volte ao login e tente entrar com sua senha. Se aparecer “Email not confirmed”, confira a configuração Confirm email do projeto correto.');
    }
   }catch(error){rateLimit(error)}
   finally{setBusy(false);if(signupMode&&Date.now()<signupBlockUntil)el('bmwGateEnter').disabled=true}
   return;
  }
  setBusy(true);message('Validando e-mail, senha e autorização...');
  try{
   const result=await rest('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email,password})});
   storeAuth(result,false);
   el('bmwGatePassword').value='';
   await checkSession();
  }catch(error){
   const raw=String(error?.message||error||'');
   if(/invalid login credentials|invalid credentials/i.test(raw)){
    message('Conta não encontrada ou senha incorreta. Se este é seu primeiro acesso, clique em Criar conta. Depois entre com sua senha.');
   }else if(/email not confirmed/i.test(raw)){
    message('Esta conta ainda está marcada como e-mail não confirmado no Supabase. Mesmo após desativar Confirm email, contas criadas anteriormente podem continuar sem confirmação. Peça à gestão para verificar este usuário em Authentication > Users.');
   }else{
    message('Não foi possível entrar: '+raw);
   }
  }
  finally{setBusy(false)}
 };
 el('bmwGateSignup').onclick=()=>setSignupMode(!signupMode);
 el('bmwGateReset').onclick=async()=>{
  const email=el('bmwGateEmail').value.trim().toLowerCase();
  if(!email){message('Informe seu e-mail primeiro.');return}
  try{await rest('/auth/v1/recover',{method:'POST',body:JSON.stringify({email})});message('Se a conta existir, você receberá instruções de recuperação por e-mail.')}
  catch(e){message('Recuperação: '+e.message)}
 };
 el('bmwGateRequestButton').onclick=async()=>{
  if(busy)return;
  const t=await jwt();if(!t||!user)return;
  const professional=el('bmwGateProfessional').value;
  if(!professional)return message('Selecione um profissional.');
  setBusy(true);message('Registrando pedido de aprovação...');
  try{
   await rest('/rest/v1/bmw_x1_members',{method:'POST',headers:{...baseHeaders(t),Prefer:'return=minimal'},body:JSON.stringify({user_id:user.id,requester_email:String(user.email||'').toLowerCase(),professional,status:'pending'})});
   await checkSession();
  }catch(e){message('Não foi possível registrar a solicitação: '+e.message)}
  finally{setBusy(false)}
 };
 el('bmwGateRecheck').onclick=checkSession;
 async function logOut(){
  const t=await jwt();
  clearClient();show('bmwGateAuth');message('Sessão encerrada. Entre novamente para acessar a competição.');
  try{if(t)await rest('/auth/v1/logout',{method:'POST',headers:baseHeaders(t)})}catch{}
  window.location.reload();
 }
 window.bmwLogout=logOut;
 el('bmwGateRequestLogout').onclick=logOut;
 el('bmwGatePendingLogout').onclick=logOut;
 // Revoga a sessão visual se a aprovação for retirada pelo gestor.
 async function revalidate(){
  if(revalidating||checking||!accessGranted||!gateSession)return;
  revalidating=true;
  try{
   const t=await jwt();
   if(!t)return;
   // Autorizações são conferidas no banco; só uma resposta válida pode revogar a interface.
   const manager=await isManager(t);
   if(admin){
    if(manager)return;
    // Confirme a identidade antes de concluir que o privilégio foi removido.
    const u=await rest('/auth/v1/user',{headers:baseHeaders(t)});
    if(!u?.id)return;
    accessGranted=false;admin=false;document.body.classList.remove('bmw-authorized');
    menu();show('bmwGateAuth');message('O acesso de gestor foi revogado.');
    return;
   }
   const u=await rest('/auth/v1/user',{headers:baseHeaders(t)});
   if(!u?.id)return;
   const m=await getMember(t,u.id);
   if(m?.status==='approved')return;
   member=m;accessGranted=false;admin=false;people=[];changes=[];approvalsAvailable=false;
   document.body.classList.remove('bmw-authorized');menu();
   if(m)pendingScreen();
   else{await loadRoster(t);show('bmwGateRequest')}
  }catch(error){
   // Não deslogar por timeout, falha de Wi-Fi, cache antigo ou resposta 5xx.
   console.warn('Verificação adiada sem alterar a tela:',error?.message||error);
  }finally{revalidating=false}
 }
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)revalidate()});
 setInterval(revalidate,60000);
 try{
  gateSession=JSON.parse(sessionStorage.getItem('bmwx1-auth')||'null')||JSON.parse(localStorage.getItem('bmw-x1-arena-auth')||'null');
 }catch{gateSession=null}
 if(gateSession){
  show('bmwGateAuth');
  message('🔐 Restaurando seu acesso com segurança...');
  checkSession();
 }else{
  show('bmwGateAuth');
  message('Acesso restrito a profissionais aprovados e gestores.');
 }
})();
