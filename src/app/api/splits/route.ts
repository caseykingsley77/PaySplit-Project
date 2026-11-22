import {NextRequest,NextResponse} from 'next/server';import {z} from 'zod';
import {authenticate,ApiError,errorResponse} from '@/lib/auth';
import {runSplit} from '@/lib/splits';
export async function POST(req:NextRequest){try{const {user,db}=await authenticate(req);
 const {payment_id}=z.object({payment_id:z.string().uuid()}).parse(await req.json());
 const payment=await db.from('salary_payments').select('id').eq('id',payment_id).eq('user_id',user.id).maybeSingle();
 if(!payment.data)throw new ApiError(404,'Salary payment not found');
 const result=await runSplit(db,user.id,payment_id,'manual');
 return NextResponse.json(result);
 }catch(e){return errorResponse(e instanceof z.ZodError?new ApiError(400,e.issues[0].message):e);}}
