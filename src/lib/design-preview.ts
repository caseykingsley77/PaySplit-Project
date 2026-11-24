import type {Dashboard} from '@/lib/dashboard-types';
const stamp=(n:number)=>new Date(Date.now()-n*86400000).toISOString();
export const designPreview:Dashboard={
 profile:{id:'preview-user',full_name:'Paul Clarke',kyc_status:'approved',expected_salary_day:25,employer_name:'Example Employer',expected_salary_kobo:85000000,phone_number:'+234 800 *** 1928',country:'Nigeria',created_at:stamp(220),notifications_preferences:{push:true,email:true,sms:false}},
 email:'paul@example.com',
 collection:{account_number:'1029384756',bank_name:'Example Bank (sample)',account_name:'Paul Clarke'},
 wallets:[
 {id:'w1',name:'December Trip Fund',category:'Travel',target_kobo:150000000,balance_kobo:22000000,created_at:stamp(72)},
 {id:'w2',name:'Emergency Buffer',category:'Emergency',target_kobo:150000000,balance_kobo:22000000,created_at:stamp(62)},
 {id:'w3',name:'Wealth Pocket',category:'Investment',target_kobo:200000000,balance_kobo:117000000,created_at:stamp(48)}
 ],
 beneficiaries:[
 {id:'b1',name:'Family Support',category:'Family',bank_code:'000',bank_name:'Example Bank',account_number:'0000004857',account_name:'Sample Recipient One',created_at:stamp(52)},
 {id:'b2',name:'Rent Payment',category:'Rent',bank_code:'000',bank_name:'Example Bank',account_number:'0000001832',account_name:'Sample Recipient Two',created_at:stamp(40)}
 ],
 rules:[
 {id:'r1',name:'Trip Savings',destination_type:'wallet',destination_id:'w1',method:'fixed',value:20000000,priority:1,status:'active',created_at:stamp(51)},
 {id:'r2',name:'Family Allowance',destination_type:'beneficiary',destination_id:'b1',method:'fixed',value:10000000,priority:2,status:'active',created_at:stamp(51)},
 {id:'r3',name:'Emergency Fund',destination_type:'wallet',destination_id:'w2',method:'percent',value:1000,priority:3,status:'active',created_at:stamp(49)},
 {id:'r4',name:'Monthly Rent',destination_type:'beneficiary',destination_id:'b2',method:'fixed',value:15000000,priority:4,status:'active',created_at:stamp(49)}
 ],
 salaries:[
 {id:'s1',amount_kobo:85000000,provider_reference:'PREVIEW-SALARY-001',confirmed_at:stamp(4)},
 {id:'s2',amount_kobo:80000000,provider_reference:'PREVIEW-SALARY-002',confirmed_at:stamp(37)},
 {id:'s3',amount_kobo:78000000,provider_reference:'PREVIEW-SALARY-003',confirmed_at:stamp(70)}
 ],
 runs:[{id:'run1',salary_payment_id:'s1',created_at:stamp(4)},{id:'run2',salary_payment_id:'s2',created_at:stamp(37)}],
 allocations:[
 {id:'a1',run_id:'run1',rule_name:'Trip Savings',requested_kobo:20000000,status:'completed',created_at:stamp(4),destination_type:'wallet',destination_id:'w1',reason:null,provider_reference:null},
 {id:'a2',run_id:'run1',rule_name:'Family Allowance',requested_kobo:10000000,status:'completed',created_at:stamp(4),destination_type:'beneficiary',destination_id:'b1',reason:null,provider_reference:'PREVIEW-TRF-001'},
 {id:'a3',run_id:'run1',rule_name:'Emergency Fund',requested_kobo:8500000,status:'completed',created_at:stamp(4),destination_type:'wallet',destination_id:'w2',reason:null,provider_reference:null},
 {id:'a4',run_id:'run1',rule_name:'Monthly Rent',requested_kobo:15000000,status:'completed',created_at:stamp(4),destination_type:'beneficiary',destination_id:'b2',reason:null,provider_reference:'PREVIEW-TRF-002'},
 {id:'a5',run_id:'run1',rule_name:'Wealth Savings',requested_kobo:7750000,status:'completed',created_at:stamp(4),destination_type:'wallet',destination_id:'w3',reason:null,provider_reference:null},
 {id:'a6',run_id:'run2',rule_name:'Trip Savings',requested_kobo:20000000,status:'completed',created_at:stamp(37),destination_type:'wallet',destination_id:'w1',reason:null,provider_reference:null},
 {id:'a7',run_id:'run2',rule_name:'Family Allowance',requested_kobo:10000000,status:'completed',created_at:stamp(37),destination_type:'beneficiary',destination_id:'b1',reason:null,provider_reference:'PREVIEW-TRF-003'}
 ],
 notifications:[{id:'n1',title:'Salary processed',message:'Your latest salary allocation is complete.',read_at:null,created_at:stamp(4)},{id:'n2',title:'Welcome to PaySplit',message:'Your salary goals are ready.',read_at:stamp(10),created_at:stamp(20)}],
 balance_kobo:85000000,
 pending_kobo:0,
 wallets_total_kobo:161000000
};
