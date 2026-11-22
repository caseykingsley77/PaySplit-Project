import {NextRequest,NextResponse} from 'next/server';import {z} from 'zod';import {authenticate,ApiError,errorResponse} from '@/lib/auth';import {postPaystack} from '@/lib/paystack';
export async function POST(req:NextRequest){try{const {user}=await authenticate(req);
 const {amount_kobo}=z.object({amount_kobo:z.number().int().min(10000).max(100000000000)}).parse(await req.json());
 const url=process.env.NEXT_PUBLIC_SITE_URL;
 if(!url)throw new ApiError(503,'Site URL not configured');
 const result=await postPaystack<{authorization_url:string;reference:string}>('/transaction/initialize',
 {email:user.email,amount:amount_kobo,currency:'NGN',callback_url:url+'/dashboard',metadata:{paysplit_user_id:user.id,purpose:'sandbox_salary_demo'}});
 return NextResponse.json({authorization_url:result.authorization_url,reference:result.reference});
 }catch(e){return errorResponse(e instanceof z.ZodError?new ApiError(400,e.issues[0].message):e);}}
