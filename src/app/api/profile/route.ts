import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {authenticate,ApiError,errorResponse} from '@/lib/auth';
const schema=z.object({
 full_name:z.string().trim().min(1).max(120).optional(),
 expected_salary_day:z.number().int().min(1).max(31).optional(),
 employer_name:z.string().trim().max(120).optional(),
 expected_salary_kobo:z.number().int().positive().nullable().optional(),
 phone_number:z.string().trim().max(22).optional(),
 country:z.string().trim().max(80).optional(),
 notifications_preferences:z.object({push:z.boolean(),email:z.boolean(),sms:z.boolean()}).optional()
}).strict();
export async function PATCH(req:NextRequest){try{
 const {user,db}=await authenticate(req);
 const p=schema.parse(await req.json());
 if(!Object.keys(p).length)throw new ApiError(400,'No profile updates supplied');
 const {data,error}=await db.from('profiles').update(p).eq('id',user.id).select().single();
 if(error)throw error;
 return NextResponse.json({profile:data});
}catch(err){return errorResponse(err instanceof z.ZodError?new ApiError(400,err.issues[0].message):err);}}
