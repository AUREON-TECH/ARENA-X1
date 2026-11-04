'use strict';
(function(){
 const style=document.createElement('style');
 style.textContent='.results-social{margin:15px 0;background:#132944;border:1px solid #385774;border-radius:14px;padding:15px}.results-social h3{margin:0 0 6px;color:#ecc777}.results-social p{font-size:12px;color:#b5c9df}.results-social-tools{display:flex;align-items:center;gap:8px;margin:10px 0;flex-wrap:wrap}.results-social .social-list{display:grid;gap:7px}.results-social .social-entry{background:#0c1e33;border:1px solid #30465e;border-radius:9px;padding:9px;font-size:12px}.results-social .social-entry strong{color:#e1c584}.results-social .social-entry small{color:#aebfd5}.results-social form{display:flex;gap:8px;flex-wrap:wrap}.results-social input{flex:1;min-width:180px;background:#0b1b2c;border:1px solid #4a6580;border-radius:9px;color:#fff;padding:10px}.results-social .social-message{font-size:12px;color:#f3c679}.results-social .btn{font-size:12px;padding:8px 10px}@media(max-width:650px){.results-social{padding:10px}.results-social form{flex-direction:column}.results-social input{min-width:0}}';
 document.head.appendChild(style);
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let current=0,loaded='',comments=[],likes=[],currentUser=null,currentMember=null,requesting=false;
 const number=x=>encodeURIComponent(x);
 const approved=async()=>{
  const jwt=await window.bmwAppToken?.();
  if(!jwt||!accessGranted)return null;
  const u=await rest('/auth/v1/user',{headers:{Authorization:'Bearer '+jwt}});
  if(admin)return{jwt,user:u,author:null,write:false};
  const rows=await rest('/rest/v1/bmw_x1_members?select=professional,status&user_id=eq.'+number(u.id),{headers:{Authorization:'Bearer '+jwt}});
  return {jwt,user:u,author:rows?.[0]?.professional,write:rows?.[0]?.status==='approved'};
 };
 const api=async(path,token,opts={})=>rest('/rest/v1/'+path,{...opts,headers:{Authorization:'Bearer '+token,...(opts.headers||{})}});
 const box=()=>document.getElementById('resultSocial');
 const who=()=>document.getElementById('personSelect')?.value||'';
 const status=x=>{const e=document.getElementById('resultSocialStatus');if(e)e.textContent=x||''};
 const niceDate=value=>new Date(value).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
 async function loadSocial(){
  const p=who(),seq=++current;
  if(!p||!accessGranted||!box())return;
  try{
   const auth=await approved();
   if(!auth||seq!==current)return;
   currentUser=auth.user;currentMember=auth;
   const [allComments,allLikes]=await Promise.all([
    api('bmw_x1_result_comments?select=id,professional,user_id,author,body,created_at&professional=eq.'+number(p)+'&order=created_at.desc&limit=60',auth.jwt),
    api('bmw_x1_result_likes?select=professional,user_id&professional=eq.'+number(p),auth.jwt)
   ]);
   if(seq!==current||who()!==p)return;
   comments=allComments||[];likes=allLikes||[];loaded=p;
   paint(p);
  }catch(err){status('Comentários indisponíveis: '+err.message)}
 }
 function paint(p){
  if(!box()||who()!==p)return;
  const canWrite=!!currentMember?.write;
  const liked=likes.some(l=>l.user_id===currentUser?.id);
  box().innerHTML='<h3>💬 Torcida e comentários</h3><p>Comente o resultado de '+esc(p)+' e incentive os colegas. Máximo de 50 caracteres por mensagem.</p>'+
  '<div class="results-social-tools">'+
   (canWrite?'<button class="btn" id="socialLike">'+(liked?'❤️ Curtido':'🤍 Curtir')+' · '+likes.length+'</button>':'<span>❤️ '+likes.length+' curtidas</span>')+
   '<span>'+comments.length+' comentários</span><button class="btn" id="socialReload">↻ Atualizar</button></div>'+
   (canWrite?'<form id="socialCommentForm"><input id="socialCommentText" maxlength="50" required placeholder="Parabenize, motive ou provoque com respeito..." aria-label="Escrever comentário"><button class="btn primary" type="submit">Comentar</button></form>':'')+
   '<p id="resultSocialStatus" class="social-message" aria-live="polite"></p>'+
   '<div class="social-list">'+comments.map(c=>'<div class="social-entry"><strong>'+esc(c.author)+'</strong> <small> · '+esc(niceDate(c.created_at))+'</small><div>'+esc(c.body)+'</div>'+
    ((c.user_id===currentUser?.id||admin)?'<button class="btn" data-socialdelete="'+c.id+'">Excluir</button>':'')+'</div>').join('')+'</div>';
  document.getElementById('socialReload').onclick=loadSocial;
  if(canWrite){
   document.getElementById('socialLike').onclick=async()=>{
    try{
     const t=await window.bmwAppToken();
     if(liked)await api('bmw_x1_result_likes?professional=eq.'+number(p)+'&user_id=eq.'+number(currentUser.id),t,{method:'DELETE'});
     else await api('bmw_x1_result_likes',t,{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({professional:p,user_id:currentUser.id})});
     await loadSocial();
    }catch(e){status('Curtida: '+e.message)}
   };
   document.getElementById('socialCommentForm').onsubmit=async e=>{
    e.preventDefault();
    const field=document.getElementById('socialCommentText'),msg=field.value.trim(),btn=e.target.querySelector('button');
    if(!msg||msg.length>50)return status('Use entre 1 e 50 caracteres.');
    if(requesting)return;requesting=true;btn.disabled=true;
    try{const t=await window.bmwAppToken();
     await api('bmw_x1_result_comments',t,{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({professional:p,user_id:currentUser.id,author:currentMember.author,body:msg})});
     field.value='';await loadSocial();
    }catch(err){status('Não foi possível comentar: '+err.message)}finally{requesting=false;btn.disabled=false}
   };
  }
  document.querySelectorAll('[data-socialdelete]').forEach(button=>button.onclick=async()=>{
   if(!confirm('Remover este comentário?'))return;
   try{
    const t=await window.bmwAppToken();
    await api('bmw_x1_result_comments?id=eq.'+number(button.dataset.socialdelete),t,{method:'DELETE'});
    await loadSocial();
   }catch(e){status('Exclusão: '+e.message)}
  });
 }
 const previousDraw=drawPerson;
 drawPerson=function(){
  previousDraw();
  const root=document.getElementById('personBody');
  if(!accessGranted||!root)return;
  const section=document.createElement('section');section.id='resultSocial';section.className='results-social';
  section.innerHTML='<h3>💬 Torcida e comentários</h3><p>Carregando a conversa sobre este resultado...</p>';
  root.insertBefore(section,root.firstChild);
  loadSocial();
 };
 window.bmwResultSocialRefresh=loadSocial;
})();
