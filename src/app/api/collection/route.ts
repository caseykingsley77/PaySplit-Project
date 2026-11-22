import {NextRequest,NextResponse} from 'next/server';import {authenticate,ApiError,errorResponse} from '@/lib/auth';import {createCollectionAccount} from '@/lib/providers';
export async function POST(req:NextRequest){try{const {user,db}=await authenticate(req);
 const p=await db.from('profiles').select('kyc_status,full_name').eq('id',user.id).single();
 if(p.error)throw p.error;if(p.data.kyc_status!=='approved')throw new ApiError(403,'Complete verification before requesting a dedicated account');
 const exists=await db.from('collection_accounts').select('*').eq('user_id',user.id).maybeSingle();
 if(exists.data)return NextResponse.json({collection:exists.data});
 const account=await createCollectionAccount(user.email!,p.data.full_name);
 const result=await db.from('collection_accounts').upsert({user_id:user.id,...account},{onConflict:'user_id'}).select().single();
 if(result.error)throw result.error;return NextResponse.json({collection:result.data});
 }catch(e){return errorResponse(e);}}
