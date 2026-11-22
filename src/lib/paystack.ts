const BASE='https://api.paystack.co';
export type PaystackResult<T>={status:boolean;message:string;data:T};
export class ProviderError extends Error {constructor(message:string,public status=502){super(message)}}
export async function paystack<T>(path:string,options:RequestInit={}):Promise<T>{
 const secret=process.env.PAYSTACK_SECRET_KEY;
 if(!secret?.startsWith('sk_test_'))throw new ProviderError('Configure a Paystack TEST secret key');
 const response=await fetch(BASE+path,{...options,headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json',...options.headers},cache:'no-store'});
 const payload=await response.json() as PaystackResult<T>;
 if(!response.ok||!payload.status)throw new ProviderError(payload.message||'Paystack operation failed',response.status);
 return payload.data;
}
export function postPaystack<T>(path:string,body:object){return paystack<T>(path,{method:'POST',body:JSON.stringify(body)});}
export function isPaystackTestMode(){return Boolean(process.env.PAYSTACK_SECRET_KEY?.startsWith('sk_test_'));}
