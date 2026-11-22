import {NextRequest,NextResponse} from 'next/server';
import {createHmac,timingSafeEqual} from 'node:crypto';
import {supabaseAdmin} from '@/lib/supabase';import {paystack} from '@/lib/paystack';import {runSplit} from '@/lib/splits';
export const runtime='nodejs';
type Event={event:string;data:{reference?:string}};
type VerifiedPayin={status:string;currency:string;amount:number;metadata?:{purpose?:string;paysplit_user_id?:string};authorization?:{receiver_bank_account_number?:string;account_number?:string};dedicated_account?:{account_number?:string};customer?:{customer_code?:string}};
export async function POST(req:NextRequest) {
 try {
  const raw=await req.text();const signature=req.headers.get('x-paystack-signature')||'';
  const secret=process.env.PAYSTACK_WEBHOOK_SECRET||process.env.PAYSTACK_SECRET_KEY;
  if(!secret)return new NextResponse('Webhook secret missing',{status:503});
  const digest=createHmac('sha512',secret).update(raw).digest('hex');
  const a=Buffer.from(digest,'hex'),b=Buffer.from(signature,'hex');
  if(a.length!==b.length||!timingSafeEqual(a,b))return new NextResponse('Invalid signature',{status:401});
  const event=JSON.parse(raw) as Event,db=supabaseAdmin();
  if(event.event==='charge.success'){
   const ref=String(event.data.reference||'');if(!ref)return new NextResponse('Missing reference',{status:400});
   const transaction=await paystack<VerifiedPayin>('/transaction/verify/'+encodeURIComponent(ref));
   if(transaction.status!=='success'||transaction.currency!=='NGN')return NextResponse.json({ignored:true});
   const amount=Number(transaction.amount);
   if(!Number.isSafeInteger(amount)||amount<=0)return new NextResponse('Invalid amount',{status:400});
   const metadata=transaction.metadata||{};
   let userId:string|null=null;
   if(metadata.purpose==='sandbox_salary_demo'&&/^[0-9a-f-]{36}$/i.test(metadata.paysplit_user_id||''))userId=metadata.paysplit_user_id||null;
   if(!userId){
    const account=transaction.authorization?.receiver_bank_account_number||transaction.authorization?.account_number||transaction.dedicated_account?.account_number;
    const customer=transaction.customer?.customer_code;
    let q=db.from('collection_accounts').select('user_id');
    if(account)q=q.eq('account_number',String(account));
    else if(customer)q=q.eq('provider_customer_code',String(customer));
    else return NextResponse.json({ignored:true,reason:'Cannot match a collection account'});
    const found=await q.maybeSingle();userId=found.data?.user_id||null;
   }
   if(!userId)return NextResponse.json({ignored:true});
   const confirmation=await db.rpc('confirm_salary',{p_user:userId,p_reference:ref,p_amount:amount});
   if(confirmation.error)throw confirmation.error;
   const {data:profile}=await db.from('profiles').select('kyc_status').eq('id',userId).single();
   if(profile?.kyc_status==='approved'&&confirmation.data.inserted){
    try {await runSplit(db,userId,confirmation.data.id,'automatic');}catch(e){console.error('Automatic split deferred:',e);}
   }
  }
  if(event.event==='transfer.success'||event.event==='transfer.failed'||event.event==='transfer.reversed'){
   const ref=String(event.data.reference||'');
   if(ref.startsWith('paysplit-')){
    const {data:alloc}=await db.from('allocations').select('id').eq('provider_reference',ref).maybeSingle();
    if(alloc){const success=event.event==='transfer.success';
     const r=await db.rpc('complete_transfer',{p_allocation:alloc.id,p_success:success,p_provider_ref:ref,p_reason:success?null:event.event});
     if(r.error)throw r.error;}
   }
  }
  return NextResponse.json({ok:true});
 }catch(e){console.error('Paystack webhook processing error:',e);return new NextResponse('Retry later',{status:500});}
}
