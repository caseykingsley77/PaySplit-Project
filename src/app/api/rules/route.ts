import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {authenticate,ApiError,errorResponse} from '@/lib/auth';
const schema=z.object({name:z.string().trim().min(2).max(80),destination_type:z.enum(['wallet','beneficiary']),destination_id:z.string().uuid(),method:z.enum(['fixed','percent']),value:z.number().int().positive(),priority:z.number().int().min(1).max(10)});
async function validateDestination(db:ReturnType<typeof import('@/lib/supabase').supabaseAdmin>,userId:string,type:'wallet'|'beneficiary',id:string){
 const {data,error}=await db.from(type==='wallet'?'wallets':'beneficiaries').select('id').eq('id',id).eq('user_id',userId).maybeSingle();
 if(error||!data)throw new ApiError(400,'Invalid destination for this account');
}
export async function POST(req:NextRequest){try{
 const {user,db}=await authenticate(req);const p=schema.parse(await req.json());
 if(p.method==='percent'&&p.value>10000)throw new ApiError(400,'Percentage cannot exceed 100%');
 await validateDestination(db,user.id,p.destination_type,p.destination_id);
 const {data,error}=await db.from('split_rules').insert({...p,user_id:user.id,status:'active'}).select().single();
 if(error){if(error.code==='23505')throw new ApiError(409,'This destination already has a split rule');throw error;}
 return NextResponse.json({rule:data},{status:201});
}catch(e){return errorResponse(e instanceof z.ZodError?new ApiError(400,e.issues[0].message):e);}}
export async function PATCH(req:NextRequest){try{
 const {user,db}=await authenticate(req);
 const p=schema.partial().extend({id:z.string().uuid(),status:z.enum(['active','paused']).optional()}).parse(await req.json());
 const {id,...patch}=p;if(!Object.keys(patch).length)throw new ApiError(400,'No rule changes supplied');
 if(p.method==='percent'&&p.value!==undefined&&p.value>10000)throw new ApiError(400,'Percentage exceeds 100%');
 const {data:current,error:currentErr}=await db.from('split_rules').select('*').eq('user_id',user.id).eq('id',id).maybeSingle();
 if(currentErr)throw currentErr;if(!current)throw new ApiError(404,'Rule not found');
 const type=p.destination_type??current.destination_type,idDest=p.destination_id??current.destination_id;
 if(p.destination_id||p.destination_type)await validateDestination(db,user.id,type,idDest);
 const method=p.method??current.method,value=p.value??current.value;
 if(method==='percent'&&value>10000)throw new ApiError(400,'Percentage exceeds 100%');
 const {data,error}=await db.from('split_rules').update(patch).eq('user_id',user.id).eq('id',id).select().single();
 if(error){if(error.code==='23505')throw new ApiError(409,'This destination already has a split rule');throw error;}
 return NextResponse.json({rule:data});
}catch(e){return errorResponse(e instanceof z.ZodError?new ApiError(400,e.issues[0].message):e);}}
export async function DELETE(req:NextRequest){try{
 const {user,db}=await authenticate(req);
 const {id}=z.object({id:z.string().uuid()}).parse(await req.json());
 const {data,error}=await db.from('split_rules').delete().eq('user_id',user.id).eq('id',id).select('id').maybeSingle();
 if(error)throw error;if(!data)throw new ApiError(404,'Rule not found');
 return NextResponse.json({deleted:true});
}catch(e){return errorResponse(e instanceof z.ZodError?new ApiError(400,e.issues[0].message):e);}}
