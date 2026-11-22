import type {SupabaseClient} from '@supabase/supabase-js';
import {ProviderError} from './paystack';
import {createRecipient,initiateTransfer} from './providers';
export async function processTransfers(db:SupabaseClient,runId:string) {
 const {data:rows,error}=await db.from('allocations').select('*').eq('run_id',runId).in('status',['pending','retrying']);
 if(error)throw error;
 const results:{id:string;status:string}[]=[];
 for(const allocation of rows||[]) {
  const ref='paysplit-'+allocation.id.replaceAll('-','');
  try {
   const {data:beneficiary,error:beneficiaryError}=await db.from('beneficiaries').select('*').eq('id',allocation.destination_id).eq('user_id',allocation.user_id).single();
   if(beneficiaryError||!beneficiary)throw new Error('Beneficiary not found');
   const existing=await db.from('allocations').update({provider_reference:ref}).eq('id',allocation.id).in('status',['pending','retrying']).select('id').maybeSingle();
   if(existing.error)throw existing.error;
   if(!existing.data)continue;
   let recipient=beneficiary.recipient_code as string|null;
   if(!recipient){
    recipient=(await createRecipient({name:beneficiary.account_name,account_number:beneficiary.account_number,bank_code:beneficiary.bank_code})).recipient_code;
    await db.from('beneficiaries').update({recipient_code:recipient}).eq('id',beneficiary.id).eq('user_id',allocation.user_id);
   }
   const transfer=await initiateTransfer(recipient,Number(allocation.requested_kobo),ref);
   // Initiation != settlement. Paystack's signed transfer.success/failed webhook is authoritative.
   if(transfer.status==='success')await db.rpc('complete_transfer',{p_allocation:allocation.id,p_success:true,p_provider_ref:ref,p_reason:null});
   else if(transfer.status==='failed')await db.rpc('complete_transfer',{p_allocation:allocation.id,p_success:false,p_provider_ref:ref,p_reason:'Paystack rejected the transfer'});
   results.push({id:allocation.id,status:transfer.status});
  }catch(err){
   // Network timeouts, provider 5xx and indeterminate errors MUST NOT release
   // reserved funds: a transfer may already have been submitted successfully.
   if(err instanceof ProviderError&&err.status>=400&&err.status<500&&err.status!==429){
    await db.rpc('complete_transfer',{p_allocation:allocation.id,p_success:false,p_provider_ref:ref,p_reason:'Provider declined transfer initiation'});
    results.push({id:allocation.id,status:'failed'});
   }else{
    await db.from('allocations').update({status:'retrying',reason:'Provider status is unconfirmed; reconcile before retry'}).eq('id',allocation.id).eq('status','pending');
    results.push({id:allocation.id,status:'retrying'});
   }
  }
 }
 return results;
}
export async function runSplit(db:SupabaseClient,userId:string,paymentId:string,trigger:'automatic'|'manual'){
 const {data,error}=await db.rpc('execute_salary_split',{p_user:userId,p_salary_id:paymentId,p_trigger:trigger});
 if(error)throw error;
 if(!data.already_executed)await processTransfers(db,data.run_id);
 return data;
}
