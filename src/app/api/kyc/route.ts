import {NextRequest,NextResponse} from 'next/server';import {authenticate,ApiError,errorResponse} from '@/lib/auth';
export async function POST(req:NextRequest){try{const {user,db}=await authenticate(req);
 if(!process.env.DOJAH_APP_ID||!process.env.DOJAH_PUBLIC_KEY||!process.env.DOJAH_WIDGET_ID)throw new ApiError(503,'Dojah KYC credentials are not configured');
 const profile=await db.from('profiles').select('kyc_status').eq('id',user.id).single();
 if(profile.data?.kyc_status==='approved')return NextResponse.json({status:'approved'});
 const update=await db.from('profiles').update({kyc_status:'pending'}).eq('id',user.id);if(update.error)throw update.error;
 return NextResponse.json({status:'pending',widget_id:process.env.DOJAH_WIDGET_ID,public_key:process.env.DOJAH_PUBLIC_KEY,app_id:process.env.DOJAH_APP_ID});
 }catch(e){return errorResponse(e);}}
