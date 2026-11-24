import {NextRequest,NextResponse} from 'next/server';
import {authenticateAdmin} from '@/lib/admin';import {ApiError,errorResponse} from '@/lib/auth';import {z} from 'zod';
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){try{
 const {db}=await authenticateAdmin(req);const {id}=await params;
 if(!z.string().uuid().safeParse(id).success)throw new ApiError(400,'Invalid user identifier');
 const [profile,wallets,beneficiaries,rules,allocations,salaries,collection]=await Promise.all([
  db.from('profiles').select('id,full_name,kyc_status,expected_salary_day,expected_salary_kobo,employer_name,country,phone_number,created_at').eq('id',id).maybeSingle(),
  db.from('wallets').select('id,name,category,target_kobo,created_at').eq('user_id',id),
  db.from('beneficiaries').select('id,name,category,bank_name,account_number,account_name').eq('user_id',id),
  db.from('split_rules').select('id,name,method,value,priority,status').eq('user_id',id),
  db.from('allocations').select('id,rule_name,requested_kobo,status,created_at,destination_type').eq('user_id',id).order('created_at',{ascending:false}).limit(100),
  db.from('salary_payments').select('id,provider_reference,amount_kobo,confirmed_at').eq('user_id',id).order('confirmed_at',{ascending:false}).limit(100),
  db.from('collection_accounts').select('account_number,bank_name,account_name').eq('user_id',id).maybeSingle()
 ]);
 for(const r of [profile,wallets,beneficiaries,rules,allocations,salaries,collection])if(r.error)throw r.error;
 if(!profile.data)throw new ApiError(404,'User not found');
 const {data:userResponse,error:userError}=await db.auth.admin.getUserById(id);if(userError)throw userError;
 return NextResponse.json({profile:profile.data,email:userResponse.user?.email||'',wallets:wallets.data||[],beneficiaries:beneficiaries.data||[],rules:rules.data||[],allocations:allocations.data||[],salaries:salaries.data||[],collection:collection.data});
}catch(e){return errorResponse(e);}}
