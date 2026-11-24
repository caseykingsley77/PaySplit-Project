import {NextResponse} from 'next/server';
import {supabaseAdmin} from '@/lib/supabase';

export const dynamic='force-dynamic';

/**
 * Public, non-sensitive readiness check. No rows, account data, credentials,
 * SQL text, or provider configuration are returned. Schema checks use fixed names.
 */
export async function GET(){
 try{
  const db=supabaseAdmin();
  const probes=[
   {key:'profiles',run:()=>db.from('profiles').select('id').limit(1)},
   {key:'ledger_accounts',run:()=>db.from('ledger_accounts').select('id').limit(1)},
   {key:'wallets',run:()=>db.from('wallets').select('id').limit(1)},
   {key:'beneficiaries',run:()=>db.from('beneficiaries').select('id').limit(1)},
   {key:'split_rules',run:()=>db.from('split_rules').select('id').limit(1)},
   {key:'salary_payments',run:()=>db.from('salary_payments').select('id').limit(1)},
   {key:'split_runs',run:()=>db.from('split_runs').select('id').limit(1)},
   {key:'allocations',run:()=>db.from('allocations').select('id').limit(1)},
   {key:'collection_accounts',run:()=>db.from('collection_accounts').select('user_id').limit(1)},
   {key:'notifications',run:()=>db.from('notifications').select('id').limit(1)},
   {key:'profile_migration',run:()=>db.from('profiles').select('employer_name,expected_salary_kobo').limit(1)},
   {key:'account_balance',run:()=>db.rpc('account_balance',{p_account:'00000000-0000-0000-0000-000000000000'})}
  ];
  const results=await Promise.all(probes.map(async p=>{
   try{
    const r=await p.run();
    if(r.error){console.error('Readiness probe failed',{probe:p.key,code:r.error.code,message:r.error.message?.slice(0,200)});}
    return {key:p.key,ready:!r.error};
   }catch(e){
    console.error('Readiness probe exception',{probe:p.key,type:e instanceof Error?e.name:'unknown'});
    return {key:p.key,ready:false};
   }
  }));
  const failures=results.filter(r=>!r.ready).map(r=>r.key);
  return NextResponse.json({ready:failures.length===0,checks:results.map(r=>({name:r.key,ready:r.ready}))},{status:failures.length?503:200,headers:{'Cache-Control':'no-store'}});
 }catch(e){
  console.error('Database readiness unavailable',e instanceof Error?e.message:'Unknown');
  return NextResponse.json({ready:false,checks:[],reason:'service_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
 }
}
