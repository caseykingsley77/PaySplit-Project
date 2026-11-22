import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';import {authenticate,ApiError,errorResponse} from '@/lib/auth';
const schema=z.object({name:z.string().trim().min(2).max(70),category:z.enum(['Savings','Emergency','Rent','Bills','Education','Travel','Investment','Other']),target_kobo:z.number().int().positive().nullable().optional()});
export async function POST(req:NextRequest){try{const {user,db}=await authenticate(req);const data=schema.parse(await req.json());
 const account=await db.from('ledger_accounts').insert({user_id:user.id,code:'wallet:'+crypto.randomUUID(),kind:'wallet',label:data.name}).select('id,code').single();
 if(account.error)throw account.error;
 const wallet=await db.from('wallets').insert({user_id:user.id,name:data.name,category:data.category,target_kobo:data.target_kobo||null,ledger_account_id:account.data.id}).select().single();
 if(wallet.error){await db.from('ledger_accounts').delete().eq('id',account.data.id);throw wallet.error;}
 const rename=await db.from('ledger_accounts').update({code:'wallet:'+wallet.data.id}).eq('id',account.data.id);
 if(rename.error)throw rename.error;
 return NextResponse.json({wallet:wallet.data},{status:201});
 }catch(e){return errorResponse(e instanceof z.ZodError?new ApiError(400,e.issues[0].message):e);}}
