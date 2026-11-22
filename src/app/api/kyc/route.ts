import {NextRequest,NextResponse} from 'next/server';import {authenticate,ApiError,errorResponse} from '@/lib/auth';
export async function POST(req:NextRequest){try{
 const {user,db}=await authenticate(req);
 if(!process.env.DOJAH_APP_ID||!process.env.DOJAH_PUBLIC_KEY||!process.env.DOJAH_WIDGET_ID)throw new ApiError(503,'Dojah KYC credentials are not configured');
 const profile=await db.from('profiles').select('kyc_status').eq('id',user.id).single();
 if(profile.data?.kyc_status==='approved')return NextResponse.json({status:'approved'});
 const configured=process.env.DOJAH_WIDGET_URL;
 if(!configured)throw new ApiError(503,'Configure Dojah hosted verification widget URL');
 const url=new URL(configured);
 if(url.protocol!=='https:'||url.hostname!=='identity.dojah.io')throw new ApiError(503,'Untrusted verification widget domain');
 url.searchParams.set('widget_id',process.env.DOJAH_WIDGET_ID);
 // Reference is bound to the signed-in user and rechecked server-side.
 url.searchParams.set('reference_id',user.id);
 const update=await db.from('profiles').update({kyc_status:'pending'}).eq('id',user.id);if(update.error)throw update.error;
 return NextResponse.json({status:'pending',widget_url:url.toString()});
 }catch(e){return errorResponse(e);}}
