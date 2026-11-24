import Link from 'next/link';
import {Activity as ActivityIcon, ArrowDownRight, ArrowUpRight, Check, ChevronRight, CircleDollarSign, Clock3, ShieldCheck, Wallet} from 'lucide-react';
import type {Activity, Dashboard} from '@/lib/dashboard-types';
import {naira,formatDay} from '@/lib/dashboard-types';
export function PsLogo(){return <Link href="/" className="ps-logo"><span className="ps-logo-glyph" aria-hidden="true"><i/></span><span>Paysplit</span></Link>}
export function Status({status}:{status:string}){return <span className={'ps-status ps-status-'+status}>{status.replaceAll('_',' ')}</span>}
export function SectionIntro({title,crumb,action}:{title:string;crumb?:string;action?:React.ReactNode}){return <div className="ps-section-heading"><div><h1>{title}</h1><div className="ps-breadcrumb"><span>Dashboard</span><em>/</em><strong>{crumb||title}</strong></div></div>{action}</div>}
export function Empty({title,body,action}:{title:string;body:string;action?:React.ReactNode}){return <div className="ps-empty"><div className="ps-empty-circle"><Wallet size={24}/></div><b>{title}</b><p>{body}</p>{action}</div>}
export function ActivityTable({items,onSelect,limit=0}:{items:Activity[];onSelect?:(item:Activity)=>void;limit?:number}){
 const list=limit?items.slice(0,limit):items;
 if(!list.length)return <Empty title="No activity yet" body="Confirmed salary payments and split movements will appear here."/>;
 return <div className="ps-table-scroll"><table className="ps-table"><thead><tr><th>Reference</th><th>Destination</th><th>Category</th><th>Date</th><th>Status</th><th>Amount</th><th></th></tr></thead><tbody>{list.map(item=><tr key={item.id} onClick={()=>onSelect?.(item)} className={onSelect?'ps-clickable-row':''}>
 <td className="ps-mono">{item.reference.slice(0,22)}</td>
 <td><span className={'ps-flow-badge '+item.type}>{item.type==='salary'?<CircleDollarSign size={14}/>:item.type==='wallet'?<ArrowDownRight size={14}/>:<ArrowUpRight size={14}/>}</span> {item.name}</td>
 <td><span className="ps-neutral-tag">{item.category}</span></td><td>{formatDay(item.date)}</td><td><Status status={item.status}/></td><td className={item.type==='salary'?'ps-income-amount':'ps-outgoing-amount'}>{item.type==='salary'?'+':'−'}{naira(item.amount_kobo)}</td><td><ChevronRight size={16}/></td></tr>)}</tbody></table></div>;
}
const colorSet=['#3ca9f6','#48c2b3','#202b39','#15639d','#4d91d8','#bcdaeb','#7fbccd','#7693b5'];
export function PartitionBar({data}:{data:Dashboard}){
 const rules=data.rules.filter(r=>r.status==='active');
 const baseline=Number(data.profile.expected_salary_kobo)||Number(data.salaries[0]?.amount_kobo)||0;
 const calculated=rules.map((r,i)=>({name:r.name,amount:r.method==='fixed'?Number(r.value):Math.floor(baseline*r.value/10000),color:colorSet[i%colorSet.length]}));
 const total=calculated.reduce((a,b)=>a+b.amount,0);const denom=Math.max(total,baseline,1);
 return <div className="ps-partition"><div className="ps-partition-bar" role="img" aria-label="Projected salary allocation">{calculated.map((r,i)=><span key={i} title={r.name+' '+naira(r.amount)} style={{width:(r.amount/denom*100)+'%',background:r.color}}/>)}{Math.max(0,denom-total)>0&&<span style={{width:(Math.max(0,denom-total)/denom*100)+'%',background:'#edf0f1'}}/>}</div>
 <div className="ps-partition-legend">{calculated.map((r,i)=><span key={i}><i style={{background:r.color}}/>{r.name}</span>)}<span><i style={{background:'#d5d9db'}}/>Unallocated</span></div></div>;
}
export function RingChart({data}:{data:Dashboard}){
 const last=data.runs[0];
 const salary=data.salaries.find(x=>x.id===last?.salary_payment_id);
 const amount=Number(salary?.amount_kobo)||0;
 const allocations=data.allocations.filter(x=>x.run_id===last?.id&&x.status!=='skipped'&&x.status!=='failed');
 const wallet=allocations.filter(x=>x.destination_type==='wallet').reduce((n,a)=>n+Number(a.requested_kobo),0);
 const recipients=allocations.filter(x=>x.destination_type==='beneficiary').reduce((n,a)=>n+Number(a.requested_kobo),0);
 const remaining=Math.max(0,amount-wallet-recipients);
 const pct=(v:number)=>amount?Math.min(100,v/amount*100):0;
 const circ=2*Math.PI*54; const w=pct(wallet),b=pct(recipients),r=pct(remaining);
 return <div className="ps-ring-layout"><svg viewBox="0 0 160 160" role="img" aria-label="Salary allocation chart"><circle cx="80" cy="80" r="54" stroke="#eaf1f5" strokeWidth="16" fill="none"/>
 <circle cx="80" cy="80" r="54" stroke="#36adf5" strokeWidth="16" fill="none" strokeDasharray={(circ*w/100)+' '+circ} transform="rotate(-90 80 80)"/>
 <circle cx="80" cy="80" r="54" stroke="#18272c" strokeWidth="16" fill="none" strokeDasharray={(circ*b/100)+' '+circ} strokeDashoffset={-circ*w/100} transform="rotate(-90 80 80)"/>
 <text x="80" y="71" textAnchor="middle" fontSize="8" fill="#708494">Unallocated</text><text x="80" y="87" textAnchor="middle" fontSize="13" fontWeight="700" fill="#071d27">{naira(remaining)}</text><text x="80" y="101" textAnchor="middle" fontSize="7" fill="#6b8b9e">{r.toFixed(0)}% of salary</text></svg>
 <div className="ps-ring-legend"><div><span><i style={{background:'#36adf5'}}/>Wallets</span><b>{naira(wallet)}</b></div><div><span><i style={{background:'#18272c'}}/>Beneficiaries</span><b>{naira(recipients)}</b></div></div></div>;
}
export function CashflowChart({data}:{data:Dashboard}){
 const now=new Date(), months=Array.from({length:7},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-6+i,1);return {date:d,key:d.getFullYear()+'-'+(d.getMonth()+1),label:d.toLocaleString('en-US',{month:'short'})};});
 const amounts=months.map(m=>({month:m.label,income:data.salaries.filter(s=>{const d=new Date(s.confirmed_at);return d.getFullYear()+'-'+(d.getMonth()+1)===m.key;}).reduce((n,s)=>n+Number(s.amount_kobo),0),out:data.allocations.filter(a=>a.status!=='skipped'&&a.status!=='failed'&&(()=>{const d=new Date(a.created_at);return d.getFullYear()+'-'+(d.getMonth()+1)===m.key;})()).reduce((n,a)=>n+Number(a.requested_kobo),0)}));
 const max=Math.max(...amounts.flatMap(x=>[x.income,x.out]),1);
 return <div className="ps-cashflow"><div className="ps-chart-header"><div><b>Salary Allocation & Split Cash Flow</b><strong>{naira(data.salaries.reduce((n,s)=>n+Number(s.amount_kobo),0))}</strong><small>Confirmed salary deposits</small></div><span className="ps-chart-key"><i style={{background:'#38aafa'}}/> Salary <i style={{background:'#1b2b37'}}/> Allocations</span></div>
 <div className="ps-chart-area">{amounts.map((x,i)=><div className="ps-month-col" key={i}><div className="ps-month-bars"><span title={'Salary '+naira(x.income)} style={{height:Math.max(x.income/max*100,1)+'%',background:'#38aafa'}}/><span title={'Allocations '+naira(x.out)} style={{height:Math.max(x.out/max*100,1)+'%',background:'#172b39'}}/></div><small>{x.month}</small></div>)}</div></div>;
}
