import {NextRequest,NextResponse} from 'next/server';import {z} from 'zod';
import {authenticate,ApiError,errorResponse} from '@/lib/auth';
/* Never trust a browser callback: obtain product-specific verification details
   from the Dojah backend. Check both ID and liveness results and bind the
   reference to the authenticated user's own KYC session. */
export async function POST(req:NextRequest){try{const {user,db}=await authenticate(req);
 const {reference}=z.object({reference:z.string().uuid()}).parse(await req.json());
 if(reference!==user.id)throw new ApiError(403,'Verification reference does not belong to you');
 const template=process.env.DOJAH_VERIFICATION_STATUS_URL;
 if(!template||!process.env.DOJAH_SECRET_KEY||!process.env.DOJAH_APP_ID)throw new ApiError(503,'Dojah server verification is not configured');
 const url=new URL(template.replace('{reference}',encodeURIComponent(reference)));
 if(url.protocol!=='https:'||url.hostname!=='api.dojah.io')throw new ApiError(503,'Untrusted KYC provider endpoint');
 const response=await fetch(url,{headers:{AppId:process.env.DOJAH_APP_ID,Authorization:process.env.DOJAH_SECRET_KEY},cache:'no-store'});
 if(!response.ok)throw new ApiError(502,'Unable to verify identity with Dojah');
 const payload=await response.json();
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
