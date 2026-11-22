import {NextRequest,NextResponse} from 'next/server';import {z} from 'zod';
import {authenticate,ApiError,errorResponse} from '@/lib/auth';
/* Server-side verification: never promote KYC based on the browser widget callback.
   Configure DOJAH_VERIFICATION_STATUS_URL as the provider's approved backend
   verification-status endpoint (with {reference} substitution) from your Dojah account.
   Only an explicit verified decision AND completed liveness can approve an account. */
export async function POST(req:NextRequest){try{const {user,db}=await authenticate(req);
 const {reference}=z.object({reference:z.string().trim().min(4).max(200)}).parse(await req.json());
 const template=process.env.DOJAH_VERIFICATION_STATUS_URL;
 if(!template||!process.env.DOJAH_SECRET_KEY||!process.env.DOJAH_APP_ID)throw new ApiError(503,'Dojah server verification is not yet configured');
 const url=new URL(template.replace('{reference}',encodeURIComponent(reference)));
 if(url.protocol!=='https:'||url.hostname!=='api.dojah.io')throw new ApiError(503,'Invalid Dojah verification endpoint');
 const response=await fetch(url,{headers:{AppId:process.env.DOJAH_APP_ID,Authorization:process.env.DOJAH_SECRET_KEY},cache:'no-store'});
 if(!response.ok)throw new ApiError(502,'Could not verify KYC with Dojah');
 const payload=await response.json();
 // Provider schemas can vary by product; do not assume a successful HTTP response means KYC passed.
 const result=payload?.entity||payload?.data||{};
 const identityPassed=result.identity_verified===true;
 const livenessPassed=result.liveness_verified===true;
 const approved=result.status==='approved'&&identityPassed&&livenessPassed;
 if(approved){
  const update=await db.from('profiles').update({kyc_status:'approved'}).eq('id',user.id);
  if(update.error)throw update.error;
  await db.from('notifications').insert({user_id:user.id,title:'Verification approved',message:'Your identity and liveness checks passed.'});
 }
 return NextResponse.json({status:approved?'approved':'pending',identity_verified:identityPassed,liveness_verified:livenessPassed});
 }catch(e){return errorResponse(e instanceof z.ZodError?new ApiError(400,e.issues[0].message):e);}}
