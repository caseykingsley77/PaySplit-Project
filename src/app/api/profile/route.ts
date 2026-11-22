import {NextRequest,NextResponse} from 'next/server';import {z} from 'zod';import {authenticate,ApiError,errorResponse} from '@/lib/auth';
export async function PATCH(req:NextRequest){try{const {user,db}=await authenticate(req);
 const p=z.object({full_name:z.string().min(1).max(120).optional(),expected_salary_day:z.number().int().min(1).max(31).optional()}).parse(await req.json());
 const result=await db.from('profiles').update(p).eq('id',user.id).select().single();if(result.error)throw result.error;
 return NextResponse.json({profile:result.data});
 }catch(e){return errorResponse(e instanceof z.ZodError?new ApiError(400,e.issues[0].message):e);}}
