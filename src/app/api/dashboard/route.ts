import {NextRequest,NextResponse} from 'next/server';
import {authenticate,errorResponse} from '@/lib/auth';
export async function GET(req:NextRequest){try{
 const {user,db}=await authenticate(req);
 const [profile,accounts,wallets,beneficiaries,rules,salaries,runs,allocations,collection,notifications]=await Promise.all([
  db.from('profiles').select('*').eq('id',user.id).single(),
  db.from('ledger_accounts').select('id,code,kind,label').eq('user_id',user.id),
  db.from('wallets').select('*').eq('user_id',user.id).order('created_at',{ascending:false}),
  db.from('beneficiaries').select('*').eq('user_id',user.id).order('created_at',{ascending:false}),
  db.from('split_rules').select('*').eq('user_id',user.id).order('priority'),
  db.from('salary_payments').select('*').eq('user_id',user.id).order('confirmed_at',{ascending:false}).limit(20),
  db.from('split_runs').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(20),
  db.from('allocations').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100),
  db.from('collection_accounts').select('*').eq('user_id',user.id).maybeSingle(),
  db.from('notifications').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(20)
 ]);
 for(const query of [profile,accounts,wallets,beneficiaries,rules,salaries,runs,allocations,collection,notifications])if(query.error)throw query.error;
 const accountBalances=await Promise.all((accounts.data||[]).map(async a=>{const {data,error}=await db.rpc('account_balance',{p_account:a.id});if(error)throw error;return {id:a.id,code:a.code,balance:Number(data)};}));
 const balance=(code:string)=>accountBalances.find(a=>a.code===code)?.balance||0;
 const walletData=(wallets.data||[]).map(w=>({...w,balance_kobo:balance('wallet:'+w.id)}));
 return NextResponse.json({profile:profile.data,email:user.email,collection:collection.data,wallets:walletData,beneficiaries:beneficiaries.data,rules:rules.data,salaries:salaries.data,runs:runs.data,allocations:allocations.data,notifications:notifications.data,balance_kobo:balance('salary'),pending_kobo:balance('pending'),wallets_total_kobo:walletData.reduce((n,w)=>n+w.balance_kobo,0)});
 }catch(error){return errorResponse(error);}}
