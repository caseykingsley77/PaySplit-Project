import {NextRequest} from 'next/server';
import {authenticate,ApiError} from './auth';
export async function authenticateAdmin(req:NextRequest){
 const {user,db}=await authenticate(req);
 const allowed=(process.env.ADMIN_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
 const verified=!!user.email_confirmed_at;
 if(!verified||!user.email||(!allowed.includes(user.email.toLowerCase())&&user.app_metadata?.role!=='admin'))
  throw new ApiError(403,'Administrator access required');
 return {user,db};
}
