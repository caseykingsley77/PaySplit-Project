import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';import {authenticate,ApiError,errorResponse} from '@/lib/auth';
import {resolveBank} from '@/lib/providers';
const schema=z.object({name:z.string().trim().min(2).max(80),category:z.string().trim().min(2).max(40),bank_code:z.string().trim().min(1),bank_name:z.string().trim().min(2),account_number:z.string().regex(/^\d{10}$/)});
export async function POST(req:NextRequest){try{const {user,db}=await authenticate(req);const p=schema.parse(await req.json());
 const verified=await resolveBank(p.account_number,p.bank_code);
 const result=await db.from('beneficiaries').insert({...p,user_id:user.id,account_name:verified.account_name}).select().single();
 if(result.error)throw result.error;
 return NextResponse.json({beneficiary:result.data},{status:201});
 }catch(e){return errorResponse(e instanceof z.ZodError?new ApiError(400,e.issues[0].message):e);}}
