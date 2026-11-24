import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {authenticate,ApiError,errorResponse} from '@/lib/auth';
const schema=z.object({name:z.string().trim().min(2).max(70),category:z.enum(['Savings','Emergency','Rent','Bills','Education','Travel','Investment','Other']),target_kobo:z.number().int().positive().nullable().optional()});
export async function POST(req:NextRequest){try{
 const {user,db}=await authenticate(req);const payload=schema.parse(await req.json());
 const {data:account,error:accErr}=await db.from('ledger_accounts').insert({user_id:user.id,code:'wallet:'+crypto.randomUUID(),kind:'wallet',label:payload.name}).select('id').single();
 if(accErr)throw accErr;
 const {data:wallet,error}=await db.from('wallets').insert({user_id:user.id,...payload,target_kobo:payload.target_kobo??null,ledger_account_id:account.id}).select().single();
 if(error){await db.from('ledger_accounts').delete().eq('id',account.id);throw error;}
 const {error:renameErr}=await db.from('ledger_accounts').update({code:'wallet:'+wallet.id}).eq('id',account.id).eq('user_id',user.id);
 if(renameErr)throw renameErr;
 return NextResponse.json({wallet},{status:201});
}catch(e){return errorResponse(e instanceof z.ZodError?new ApiError(400,e.issues[0].message):e);}}
export async function PATCH(req:NextRequest){try{
 const {user,db}=await authenticate(req);
 const payload=schema.partial().extend({id:z.string().uuid()}).parse(await req.json());
 const {id,...patch}=payload;if(!Object.keys(patch).length)throw new ApiError(400,'No wallet changes supplied');
 const {data,error}=await db.from('wallets').update(patch).eq('id',id).eq('user_id',user.id).select().maybeSingle();
 if(error)throw error;if(!data)throw new ApiError(404,'Wallet not found');
 return NextResponse.json({wallet:data});
}catch(e){return errorResponse(e instanceof z.ZodError?new ApiError(400,e.issues[0].message):e);}}
