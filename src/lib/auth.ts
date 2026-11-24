import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from './supabase';

export class ApiError extends Error {
  constructor(public status:number,message:string){super(message);this.name='ApiError';}
}

export async function authenticate(req: NextRequest) {
 const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
 if(!token)throw new ApiError(401,'Sign in to continue');
 const db=supabaseAdmin();
 const {data,error}=await db.auth.getUser(token);
 if(error||!data.user)throw new ApiError(401,'Session expired');
 return {user:data.user,db};
}

type SupabaseFailure={code?:string;message?:string;details?:string};
function asDatabaseFailure(err:unknown):SupabaseFailure|null{
 if(!err||typeof err!=='object')return null;
 const e=err as Record<string,unknown>;
 return typeof e.code==='string'&&typeof e.message==='string'
  ?{code:e.code,message:e.message,details:typeof e.details==='string'?e.details:undefined}:null;
}

export function errorResponse(err:unknown){
 if(err instanceof ApiError)return NextResponse.json({error:err.message},{status:err.status});
 const dbFailure=asDatabaseFailure(err);
 if(dbFailure){
  // PostgrestError is a plain object, not an Error instance.
  // Never return raw database details to the browser.
  console.error('PaySplit database request failed',{
   code:dbFailure.code,
   message:dbFailure.message.slice(0,240)
  });
  if(['PGRST205','PGRST202','42P01','42703','42883'].includes(dbFailure.code||'')){
   return NextResponse.json({error:'PaySplit database setup needs attention. Please contact support.',code:'DATABASE_SETUP_REQUIRED'},{status:503});
  }
  if(dbFailure.code==='PGRST116'){
   return NextResponse.json({error:'Your account setup has not finished. Please retry shortly.',code:'PROFILE_NOT_READY'},{status:503});
  }
  return NextResponse.json({error:'Your account data is temporarily unavailable. Please try again.',code:'DATABASE_UNAVAILABLE'},{status:503});
 }
 const message=err instanceof Error?err.message:'Unexpected failure';
 console.error('PaySplit API failure',{type:err instanceof Error?err.name:typeof err,message:message.slice(0,240)});
 return NextResponse.json({error:'The service is temporarily unavailable. Please try again.',code:'SERVICE_UNAVAILABLE'},{status:503});
}
