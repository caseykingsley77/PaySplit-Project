import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from './supabase';
export async function authenticate(req: NextRequest) { const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1]; if (!token) throw new ApiError(401,'Sign in to continue'); const db=supabaseAdmin(); const {data,error}=await db.auth.getUser(token); if(error || !data.user) throw new ApiError(401,'Session expired'); return {user:data.user,db}; }
export class ApiError extends Error {constructor(public status:number,message:string){super(message)}}
export function errorResponse(err:unknown){const status=err instanceof ApiError?err.status:500;const message=err instanceof Error?err.message:'Unknown server error';if(status>=500)console.error('API error:',message);return NextResponse.json({error:status>=500?'Internal server error':message},{status});}
