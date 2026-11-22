import { postPaystack,paystack } from './paystack';
export interface CollectionAccount {account_number:string;bank_name:string;account_name:string;provider_customer_code:string;provider_account_id:string}
export async function createCollectionAccount(email:string,fullName:string):Promise<CollectionAccount>{
 const words=fullName.trim().split(/\s+/);
 const customer=await postPaystack<{customer_code:string}>('/customer',{email,first_name:words[0]||'PaySplit',last_name:words.slice(1).join(' ')||'Customer'});
 const account=await postPaystack<{account_number:string;bank:{name:string};account_name:string;id:number}>('/dedicated_account',
   {customer:customer.customer_code,preferred_bank:'wema-bank'});
 return {account_number:account.account_number,bank_name:account.bank.name,account_name:account.account_name,provider_customer_code:customer.customer_code,provider_account_id:String(account.id)};
}
export async function resolveBank(account_number:string,bank_code:string) {
 const q=new URLSearchParams({account_number,bank_code});
 return paystack<{account_number:string;account_name:string;bank_id:number}>('/bank/resolve?'+q.toString());
}
export async function createRecipient(details:{name:string;account_number:string;bank_code:string}) {
 return postPaystack<{recipient_code:string}>('/transferrecipient',{type:'nuban',name:details.name,account_number:details.account_number,bank_code:details.bank_code,currency:'NGN'});
}
export async function initiateTransfer(recipient:string,amount:number,reference:string) {
 return postPaystack<{reference:string;status:string;transfer_code:string}>('/transfer',{source:'balance',amount,recipient,reference,reason:'PaySplit salary allocation'});
}
