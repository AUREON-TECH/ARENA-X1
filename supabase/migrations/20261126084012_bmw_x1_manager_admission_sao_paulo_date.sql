-- Use the application's business timezone for admission-date validation and calendar eligibility.
CREATE OR REPLACE FUNCTION public.bmw_x1_add_professional(p_name text, p_role text, p_start date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_name text := upper(btrim(p_name));
 v_role text := upper(btrim(p_role));
 v_payload jsonb;
 v_record jsonb;
 v_months jsonb := '[]'::jsonb;
 v_month text;
 v_start date;
 v_today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
 v_day integer;
 v_last date;
 i integer;
begin
 if not bmw_auth.is_verified_admin() then
  raise exception 'Somente gestores podem cadastrar profissionais' using errcode='42501';
 end if;
 if v_name is null or char_length(v_name) < 5 or char_length(v_name) > 110 or v_name !~ '^[A-ZÀ-Ú ]+$' then
  raise exception 'Informe o nome completo válido';
 end if;
 if v_role not in ('CAPTADOR','CONSULTOR','CLOSER') then
  raise exception 'Função inválida';
 end if;
 if p_start is null or p_start > v_today or p_start > '2026-12-31'::date then
  raise exception 'Data de ingresso inválida';
 end if;
 v_start:=greatest(p_start,'2026-07-01'::date);
 if exists(select 1 from public.bmw_x1_roster where professional=v_name) then
  raise exception 'Profissional já cadastrado';
 end if;
 select payload into v_payload from public.bmw_x1_campaign_snapshot where id='current' for update;
 if v_payload is null then
  raise exception 'Campanha não configurada';
 end if;
 for i in 7..12 loop
  v_month:=format('2026-%s',lpad(i::text,2,'0'));
  v_last:=(date_trunc('month',make_date(2026,i,1))+interval '1 month - 1 day')::date;
  v_day:=greatest(0,least(v_last,v_today,'2026-12-31'::date)-greatest(v_start,make_date(2026,i,1))+1);
  v_months:=v_months||jsonb_build_array(jsonb_build_object(
   'month',v_month,'attend',0,'q',0,'nq',0,'sales',0,'vgv_gross',0,'vgv_net_est',0,
   'xp_base',0,'renda_q_avg',0,'ticket_avg',0,
   'suggested',jsonb_build_object('top',0,'ticket',0,'casais',0,'eficiencia',0,'entrada',0),
   'assiduity',jsonb_build_object('eligible_calendar_days',v_day,'presence_days_confirmed',null,
   'punctual_days_confirmed',null,'presence_xp_suggested_max',v_day*50000,'punctuality_xp_suggested_max',v_day*50000,'confirmed',false)
   ));
 end loop;
 v_record:=jsonb_build_object('name',v_name,'role',v_role,'months',v_months,'first_record',null,
  'source','Cadastro pela gestão','status','Ativo','xp_base',0,'xp_suggested_bonus',0,
  'xp_suggested_total',0,'vgv_gross_total',0,'attend_total',0,'sales_total',0,'q_total',0,
  'first_record_date',null,'admission_date',p_start::text,
  'presence_policy',jsonb_build_object('source','hire_date_calendar_default','days_confirmed',null,
    'punctual_days_confirmed',null,'automatic_award',true),
  'assiduity_start',v_start::text,'eligibility_start',v_start::text);
 insert into public.bmw_x1_roster(professional,role)values(v_name,v_role);
 update public.bmw_x1_campaign_snapshot
 set payload=jsonb_set(v_payload,'{records}',coalesce(v_payload->'records','[]'::jsonb)||jsonb_build_array(v_record)),
     updated_at=now()
 where id='current';
 return jsonb_build_object('professional',v_name,'role',v_role,'total',jsonb_array_length(v_payload->'records')+1);
end
$function$;
