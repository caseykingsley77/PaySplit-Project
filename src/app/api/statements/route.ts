import {NextRequest,NextResponse} from 'next/server';import {authenticate,errorResponse} from '@/lib/auth';
function csvCell(s:unknown){const v=String(s??'');return '"'+( /^[=+\-@\t\r]/.test(v)?"'":'')+v.replaceAll('"','""')+'"';}
export async function GET(req:NextRequest){try{const {user,db}=await authenticate(req);
 const {data,error}=await db.from('ledger_journals').select('reference,description,created_at,ledger_postings(amount_kobo,ledger_accounts(code))').eq('user_id',user.id).order('created_at',{ascending:false}).limit(500);
 if(error)throw error;
 const lines=['Date,Reference,Description,Account,Amount (kobo)'];
 for(const journal of data||[])for(const posting of (journal.ledger_postings as any[])||[]){
  lines.push([journal.created_at,journal.reference,journal.description,posting.ledger_accounts?.code||'',posting.amount_kobo].map(csvCell).join(','));
 }
 return new NextResponse(lines.join('\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="paysplit-statement.csv"','Cache-Control':'private, no-store'}});
 }catch(e){return errorResponse(e);}}
