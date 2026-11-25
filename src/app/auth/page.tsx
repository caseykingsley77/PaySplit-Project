'use client';
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {ArrowRight,Check,Eye,EyeOff,LockKeyhole,Mail,ShieldCheck,X} from 'lucide-react';
import MarketingLanding from '@/components/marketing-landing';
import {BrandMark} from '@/components/brand';
import {supabaseBrowser} from '@/lib/supabase';
type Mode='signin'|'signup'|'verify'|'welcome'|'reset';
const configured=Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export default function AuthPage(){
 const router=useRouter();
 const [mode,setMode]=useState<Mode>('signin'),[email,setEmail]=useState(''),[password,setPassword]=useState('');
 const [first,setFirst]=useState(''),[last,setLast]=useState(''),[showPassword,setShowPassword]=useState(false);
 const [otp,setOtp]=useState(['','','','','','']),[busy,setBusy]=useState(false),[error,setError]=useState(''),[info,setInfo]=useState('');
 const codeRefs=useRef<Array<HTMLInputElement|null>>([]);
 useEffect(()=>{const u=new URLSearchParams(window.location.search),requested=u.get('mode');if(requested==='signup')setMode('signup');else if(requested==='reset')setMode('reset');else setMode('signin');
  if(configured){supabaseBrowser().auth.getSession().then(({data})=>{if(data.session)router.replace('/dashboard');}).catch(()=>{});}
 },[router]);
 function changeMode(next:Mode){setMode(next);setError('');setInfo('');setOtp(['','','','','','']);}
 async function submit(event:React.FormEvent){event.preventDefault();if(!configured)return;
 setBusy(true);setError('');setInfo('');
 try{
  const client=supabaseBrowser();
  if(mode==='signin'){
   const {error:e}=await client.auth.signInWithPassword({email,password});if(e)throw e;
   router.push('/dashboard');return;
  }
  if(mode==='signup'){
   if(!first.trim()||!last.trim())throw new Error('Enter your first and last name');
   const {data,error:e}=await client.auth.signUp({email,password,options:{data:{first_name:first.trim(),last_name:last.trim(),full_name:first.trim()+' '+last.trim()}}});
   if(e)throw e;
   if(data.session){await client.auth.signOut();throw new Error('Email confirmation is disabled in Supabase. Enable it so signups require a six-digit verification code.');}
   setOtp(['','','','','','']);setMode('verify');setInfo('Enter the six-digit code from your verification email. Check spam if you cannot find it.');
  }
  if(mode==='verify'){
   if(otp.join('').length!==6)throw new Error('Enter the six-digit email verification code');
   const {data:verified,error:e}=await client.auth.verifyOtp({email,token:otp.join(''),type:'email'});if(e)throw e;
   if(!verified.session)throw new Error('Code accepted, but no login session was created. Please sign in again.');
   setOtp(['','','','','','']);setMode('welcome');
  }
  if(mode==='reset'){
   const {error:e}=await client.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+'/auth?mode=signin'});if(e)throw e;
   setInfo('If an account exists for this address, a password reset link has been sent.');
  }
 }catch(e){setError(e instanceof Error?e.message:'Unable to complete this request');}finally{setBusy(false);}
 }
 async function resend(){setBusy(true);setError('');setInfo('');try{const {error:e}=await supabaseBrowser().auth.resend({type:'signup',email});if(e)throw e;setOtp(['','','','','','']);setInfo('A new six-digit code has been requested. Check your inbox or spam folder.');}catch(e){setError(e instanceof Error?e.message:'Could not request another code. Please try again later.');}finally{setBusy(false);}}
 function codeChange(index:number,value:string){const digit=value.replace(/\D/g,'').slice(-1);setOtp(current=>{const next=[...current];next[index]=digit;return next;});if(digit&&index<5)codeRefs.current[index+1]?.focus();}
 function pasteCode(index:number,event:React.ClipboardEvent<HTMLInputElement>){const digits=event.clipboardData.getData('text').replace(/\D/g,'').slice(0,6-index);if(!digits)return;event.preventDefault();setOtp(current=>{const next=[...current];for(let n=0;n<digits.length;n++)next[index+n]=digits[n];return next;});codeRefs.current[Math.min(5,index+digits.length)]?.focus();}
 return <div className="ps-auth-wrap">
  <div className="ps-auth-background" aria-hidden="true"><MarketingLanding/></div>
  <Link href="/" className="ps-auth-close-page" aria-label="Return to PaySplit homepage"><X size={18}/></Link>
  <main className="ps-auth-overlay">
   {mode==='welcome'?<section className="ps-auth-dialog ps-welcome" role="dialog" aria-modal="true" aria-label="Account created">
    <div className="ps-welcome-sunburst"><div className="ps-welcome-check"><Check size={62}/></div></div>
    <h1>Welcome to PaySplit{first?', '+first:''}!</h1>
    <p>Your account is ready. Set up identity verification and your salary allocation rules to get started.</p>
    <div className="ps-welcome-steps"><div><span>✦ Step 1</span><b>Profile & Identity Verification</b><small>Secure verification through a trusted provider</small></div><div><span>✦ Step 2</span><b>Setup Checklist</b><small>Income, wallets, beneficiaries & split rules</small></div></div>
    <div className="ps-auth-footer-actions"><button type="button" className="ps-outline-btn" onClick={()=>router.push('/dashboard')}>Go to Dashboard</button><button type="button" className="ps-blue-btn" onClick={()=>router.push('/onboarding')}>Continue to KYC <ArrowRight size={16}/></button></div>
   </section>:
   <section className="ps-auth-dialog" role="dialog" aria-modal="true" aria-label={mode==='signin'?'Sign in':mode==='signup'?'Create account':mode==='verify'?'Verify email':'Reset password'}>
    <Link className="ps-auth-x" href="/" aria-label="Close"><X size={20}/></Link>
    <div className="ps-auth-logo-holder"><BrandMark size={44} tone="black"/></div>
    <h1>{mode==='signin'?'Welcome back!':mode==='signup'?'Create an account':mode==='verify'?'Please check your email':'Reset your password'}</h1>
    <p className="ps-auth-subtitle">{mode==='signin'?'Please enter your details, to log in to your account':mode==='signup'?'Get started with smarter salary management':mode==='verify'?'We’ve sent a verification code to '+email:'Enter your email to receive a password reset link'}</p>
    {!configured&&<div className="ps-auth-warning"><ShieldCheck size={17}/> Account services are temporarily unavailable. Authentication configuration is pending.</div>}
    {info&&<div className="ps-auth-info" role="status"><Mail size={16}/>{info}</div>}
    {error&&<div className="ps-auth-error" role="alert">{error}</div>}
    <form onSubmit={submit} className="ps-auth-form">
     {mode==='signup'&&<div className="ps-auth-name-row"><label>First Name<input value={first} onChange={e=>setFirst(e.target.value)} required minLength={1} placeholder="Enter first name" autoComplete="given-name"/></label><label>Last Name<input value={last} onChange={e=>setLast(e.target.value)} required minLength={1} placeholder="Enter last name" autoComplete="family-name"/></label></div>}
     {mode!=='verify'&&<label>Email address<input type="email" required autoComplete="email" placeholder="Enter your email" value={email} onChange={e=>setEmail(e.target.value)}/></label>}
     {(mode==='signin'||mode==='signup')&&<label>Password<div className="ps-password-field"><input type={showPassword?'text':'password'} minLength={8} required autoComplete={mode==='signup'?'new-password':'current-password'} placeholder="At least 8 characters" value={password} onChange={e=>setPassword(e.target.value)}/><button type="button" aria-label={showPassword?'Hide password':'Show password'} onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>}
     {mode==='verify'&&<div className="ps-otp-row" role="group" aria-label="Six-digit email verification code">{otp.map((digit,i)=><input key={i} aria-label={'Verification digit '+(i+1)} ref={e=>{codeRefs.current[i]=e;}} value={digit} onChange={e=>codeChange(i,e.target.value)} onPaste={e=>pasteCode(i,e)} onFocus={e=>e.currentTarget.select()} onKeyDown={e=>{if(e.key==='Backspace'&&!digit&&i>0)codeRefs.current[i-1]?.focus();else if(e.key==='ArrowLeft'&&i>0)codeRefs.current[i-1]?.focus();else if(e.key==='ArrowRight'&&i<5)codeRefs.current[i+1]?.focus();}} inputMode="numeric" pattern="[0-9]*" autoComplete={i===0?'one-time-code':'off'} maxLength={1}/>)}</div>}
     {mode==='signin'&&<div className="ps-auth-helper"><span><LockKeyhole size={14}/> Secure sign in</span><button type="button" onClick={()=>changeMode('reset')}>Forgot password?</button></div>}
     {mode==='verify'&&<p className="ps-resend">Didn&apos;t get a code? <button type="button" disabled={!configured||busy} onClick={()=>void resend()}>Click to resend.</button></p>}
     <button disabled={!configured||busy||(mode==='verify'&&otp.join('').length!==6)} type="submit" className="ps-auth-submit">{busy?'Please wait…':mode==='signin'?'Confirm':mode==='signup'?'Create account':mode==='verify'?'Verify email':'Send reset link'}</button>
    </form>
    <div className="ps-auth-bottom">
     {mode==='signin'?"Don’t have an account? ":mode==='signup'?'Already have an account? ':mode==='verify'?'Wrong email address? ':'Remembered your password? '}
     <button type="button" onClick={()=>changeMode(mode==='signin'?'signup':mode==='verify'?'signup':'signin')}>{mode==='signin'?'Create One':mode==='verify'?'Change email':'Sign in'}</button>
    </div>
   </section>}
  </main>
 </div>;
}
