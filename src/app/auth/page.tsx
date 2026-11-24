'use client';
import {useEffect,useState} from 'react';
import {ArrowRight,CheckCircle2,ShieldCheck,GitBranch,Wallet} from 'lucide-react';
import {supabaseBrowser} from '@/lib/supabase';
import {useRouter} from 'next/navigation';
const authConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export default function Home(){
 const router=useRouter();const [mode,setMode]=useState<'signin'|'signup'>('signup');
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[fullName,setFullName]=useState('');
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 useEffect(()=>{const m=new URLSearchParams(window.location.search).get('mode');if(m==='signin')setMode('signin');if(m==='signup')setMode('signup');},[]);
 useEffect(()=>{if(!authConfigured)return;supabaseBrowser().auth.getSession().then(({data})=>{if(data.session)router.replace('/dashboard');}).catch(()=>setNotice('Unable to connect to the account service. Please try again.'));},[router]);
 async function submit(e:React.FormEvent){
 e.preventDefault();setBusy(true);setNotice('');
 try{
 const supabase=supabaseBrowser();
 if(mode==='signup'){
 const {data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name:fullName}}});
 if(error)throw error;
 if(data.session)router.push('/dashboard');
 else setNotice('Check your inbox for the confirmation link, then sign in.');
 }else{
 const {error}=await supabase.auth.signInWithPassword({email,password});
 if(error)throw error;router.push('/dashboard');
 }
 }catch(err){setNotice(err instanceof Error?err.message:'Something went wrong');}finally{setBusy(false);}
 }
 return <main className="auth-page"><section className="auth-hero">
 <div className="brand brand-light"><span className="brand-icon"><GitBranch size={20}/></span>PaySplit<span className="brand-dot">.</span></div>
 <div className="hero-inner"><div className="eyebrow inverse">YOUR SALARY. YOUR RULES.</div>
 <h1>Make every payday <em>count.</em></h1>
 <p>Pay yourself first, take care of the people you love, and save toward what matters. Automatically.</p>
 <div className="hero-feature"><Wallet/> One salary. Unlimited possibilities.</div>
 <div className="hero-steps"><div><CheckCircle2 size={18}/> Set your rules</div><div><CheckCircle2 size={18}/> Get paid</div><div><CheckCircle2 size={18}/> We handle the rest</div></div>
 </div><div className="hero-bottom"><ShieldCheck size={18}/> Built with security and transparency at its core</div>
 </section><section className="auth-main"><div className="auth-card">
 <span className="pill">WELCOME TO BETTER MONEY</span><h2>{mode==='signup'?'Create your account':'Welcome back'}</h2>
 <p className="muted">{mode==='signup'?'Start organizing your money in just a few steps.':'Sign in to your PaySplit account.'}</p>
 {!authConfigured?<div role="status" className="notice">Account services are temporarily unavailable. Please check back shortly.</div>:<form onSubmit={submit} className="form-stack">{mode==='signup'&&<label>Full name<input required minLength={2} placeholder="Your full name" value={fullName} onChange={e=>setFullName(e.target.value)}/></label>}
 <label>Email address<input required type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/></label>
 <label>Password<input required type="password" autoComplete={mode==='signup'?'new-password':'current-password'} minLength={8} placeholder="At least 8 characters" value={password} onChange={e=>setPassword(e.target.value)}/></label>
 {notice&&<div role="status" className="notice">{notice}</div>}
 <button className="primary-btn full" disabled={busy}>{busy?'Please wait…':mode==='signup'?'Create account':'Sign in'} <ArrowRight size={18}/></button></form>}
 {authConfigured&&<p className="auth-switch">{mode==='signup'?'Already have an account?':'New to PaySplit?'} <button className="text-link" onClick={()=>{setMode(mode==='signup'?'signin':'signup');setNotice('');}}>{mode==='signup'?'Sign in':'Create an account'}</button></p>}
 <div className="auth-footnote"><ShieldCheck size={15}/> PaySplit secure account access</div>
 </div></section></main>;
}
