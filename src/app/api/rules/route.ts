import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';import {authenticate,ApiError,errorResponse} from '@/lib/auth';
const schema=z.object({name:z.string().trim().min(2).max(80),destination_type:z.enum(['wallet','beneficiary']),destination_id:z.string().uuid(),method:z.enum(['fixed','percent']),value:z.number().int().positive(),priority:z.number().int().min(1).max(10)});
export async function POST(req:NextRequest){try{const {user,db}=await authenticate(req);const p=schema.parse(await req.json());
 if(p.method==='percent'&&p.value>10000)throw new ApiError(400,'Percentage cannot exceed 100%');
 const table=p.destination_type==='wallet'?'wallets':'beneficiaries';
 const target=await db.from(table).select('id').eq('id',p.destination_id).eq('user_id',user.id).maybeSingle();
 if(target.error||!target.data)throw new ApiError(400,'Destination does not belong to your account');
 const result=await db.from('split_rules').insert({...p,user_id:user.id,status:'active'}).select().single();
 if(result.error){if(result.error.code==='23505')throw new ApiError(409,'This destination already has a split rule');throw result.error;}
 return NextResponse.json({rule:result.data},{status:201});
 }catch(e){return errorResponse(e instanceof z.ZodError?new ApiError(400,e.issues[0].message):e);}}
export async function PATCH(req:NextRequest){try{const {user,db}=await authenticate(req);
 const p=z.object({id:z.string().uuid(),status:z.enum(['active','paused'])}).parse(await req.json());
 const result=await db.from('split_rules').update({status:p.status}).eq('id',p.id).eq('user_id',user.id).select().maybeSingle();
 if(result.error)throw result.error;if(!result.data)throw new ApiError(404,'Rule not found');
 return NextResponse.json({rule:result.data});
 }catch(e){return errorResponse(e instanceof z.ZodError?new ApiError(400,e.issues[0].message):e);}}
