export type Wallet = {id:string;name:string;category:string;target_kobo:number|null;balance_kobo:number;created_at:string};
export type Beneficiary = {id:string;name:string;category:string;bank_code:string;bank_name:string;account_number:string;account_name:string;created_at:string};
export type SplitRule = {id:string;name:string;destination_id:string;destination_type:'wallet'|'beneficiary';method:'fixed'|'percent';value:number;priority:number;status:'active'|'paused';created_at:string};
export type Salary = {id:string;amount_kobo:number;provider_reference:string;confirmed_at:string};
export type Allocation = {id:string;run_id:string;rule_name:string;requested_kobo:number;status:'completed'|'pending'|'skipped'|'failed'|'retrying';created_at:string;destination_type:string;destination_id:string;reason:string|null;provider_reference:string|null};
export type Profile = {id:string;full_name:string;kyc_status:'not_started'|'pending'|'approved'|'rejected';expected_salary_day:number;employer_name?:string;expected_salary_kobo?:number|null;phone_number?:string;country?:string;created_at:string;notifications_preferences?:{push?:boolean;email?:boolean;sms?:boolean}};
export type Dashboard = {profile:Profile;email:string;collection:{bank_name:string;account_name:string;account_number:string}|null;wallets:Wallet[];beneficiaries:Beneficiary[];rules:SplitRule[];salaries:Salary[];runs:{id:string;salary_payment_id:string;created_at:string}[];allocations:Allocation[];notifications:{id:string;title:string;message:string;read_at:string|null;created_at:string}[];balance_kobo:number;pending_kobo:number;wallets_total_kobo:number};
export type Activity = {id:string;reference:string;name:string;detail:string;category:string;type:'salary'|'wallet'|'beneficiary';status:string;amount_kobo:number;date:string;run_id?:string};
export const naira=(kobo:number|null|undefined)=>new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:2}).format((Number(kobo)||0)/100);
export const formatDay=(s:string)=>new Date(s).toLocaleString('en-NG',{month:'short',day:'numeric',year:'numeric'});
export const monthDay=(s:string)=>new Date(s).toLocaleString('en-NG',{month:'short',day:'numeric'});
export const accountMask=(s:string)=>s?'••••••'+s.slice(-4):'—';
export function nextPayday(day:number){const today=new Date();for(let i=0;i<3;i++){const d=new Date(today.getFullYear(),today.getMonth()+i,Math.min(day,new Date(today.getFullYear(),today.getMonth()+i+1,0).getDate()));if(d>=new Date(today.getFullYear(),today.getMonth(),today.getDate()))return d;}return new Date();}
export function activities(d:Dashboard):Activity[]{return [
 ...d.salaries.map(s=>({id:s.id,reference:s.provider_reference,name:'Salary received',detail:'Confirmed salary pay-in',category:'Salary',type:'salary' as const,status:'completed',amount_kobo:Number(s.amount_kobo),date:s.confirmed_at})),
 ...d.allocations.map(a=>({id:a.id,reference:a.provider_reference||a.id.slice(0,8).toUpperCase(),name:a.rule_name,detail:a.destination_type==='wallet'?'Internal wallet allocation':'External beneficiary transfer',category:a.destination_type==='wallet'?'Savings':'Transfer',type:a.destination_type==='wallet'?'wallet' as const:'beneficiary' as const,status:a.status,amount_kobo:Number(a.requested_kobo),date:a.created_at,run_id:a.run_id}))
 ].sort((a,b)=>b.date.localeCompare(a.date));}
