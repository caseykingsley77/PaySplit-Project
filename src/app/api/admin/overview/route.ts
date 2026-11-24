import {NextRequest,NextResponse} from 'next/server';
import {authenticateAdmin} from '@/lib/admin';import {errorResponse} from '@/lib/auth';
export async function GET(req:NextRequest){try{
 const {db}=await authenticateAdmin(req);
 const [{data:profiles,error:pe},{data:salary,error:se},{data:allocations,error:ae},{data:wallets,error:we},{data:beneficiaries,error:be},{data:rules,error:re},{data:accounts,error:ce}]=await Promise.all([
  db.from('profiles').select('id,full_name,kyc_status,expected_salary_day,expected_salary_kobo,country,created_at').order('created_at',{ascending:false}).limit(100),
  db.from('salary_payments').select('id,user_id,provider_reference,amount_kobo,confirmed_at').order('confirmed_at',{ascending:false}).limit(250),
  db.from('allocations').select('id,user_id,rule_name,requested_kobo,status,destination_type,created_at').order('created_at',{ascending:false}).limit(200),
  db.from('wallets').select('id,user_id,balance_not_stored:name').limit(500),
  db.from('beneficiaries').select('id,user_id').limit(500),
  db.from('split_rules').select('id,user_id,status').limit(500),
  db.from('collection_accounts').select('user_id,account_number,bank_name').limit(200)
 ]);
 for(const error of [pe,se,ae,we,be,re,ce])if(error)throw error;
 const ids=(profiles||[]).map(p=>p.id);
 const {data:authUsers,error:userError}=await db.auth.admin.listUsers({page:1,perPage:100});if(userError)throw userError;
 const look=new Map(authUsers.users.map(u=>[u.id,{email:u.email||'',email_verified:!!u.email_confirmed_at}]));
 const counts=(rows:{user_id:string}[]|null|undefined,id:string)=>rows?.filter(r=>r.user_id===id).length||0;
 const users=(profiles||[]).map(p=>({...p,email:look.get(p.id)?.email||'',email_verified:!!look.get(p.id)?.email_verified,wallet_count:counts(wallets,p.id),beneficiary_count:counts(beneficiaries,p.id),rule_count:counts(rules,p.id),account:accounts?.find(c=>c.user_id===p.id)||null,total_salary_kobo:(salary||[]).filter(s=>s.user_id===p.id).reduce((n,s)=>n+Number(s.amount_kobo),0)}));
 const salaryTotal=(salary||[]).reduce((n,s)=>n+Number(s.amount_kobo),0);
 return NextResponse.json({users,summary:{total_users:users.length,verified_users:users.filter(u=>u.kyc_status==='approved').length,pending_users:users.filter(u=>u.kyc_status==='pending').length,total_salary_kobo:salaryTotal},payments:salary||[],allocations:allocations||[]});
}catch(e){return errorResponse(e);}}
