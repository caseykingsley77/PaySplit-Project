import Link from 'next/link';
import {BrandLogo,BrandMark} from '@/components/brand';
import {ArrowRight, Bell, ChevronRight, Download, LockKeyhole, Plus, Search, Wallet} from 'lucide-react';

function AppleBadge(){
 return <div className="lp-store-badge" title="iOS app coming soon" aria-label="App Store: coming soon">
  <svg viewBox="0 0 24 28" width="27" height="30" aria-hidden="true" fill="white">
   <path d="M18.92 14.84c.03 3.13 2.75 4.17 2.78 4.18-.02.07-.43 1.47-1.43 2.91-.87 1.24-1.78 2.48-3.19 2.5-1.39.03-1.84-.81-3.43-.81-1.59 0-2.09.79-3.41.84-1.37.05-2.42-1.34-3.29-2.58-1.79-2.54-3.15-7.19-1.31-10.32.91-1.55 2.52-2.54 4.28-2.57 1.33-.02 2.59.9 3.42.9.82 0 2.37-1.12 4-.95.68.03 2.6.28 3.83 2.07-.1.07-2.28 1.31-2.25 3.83ZM16.18 6.28c.73-.89 1.22-2.12 1.09-3.36-1.05.04-2.33.7-3.09 1.59-.68.78-1.27 2.04-1.11 3.26 1.18.09 2.38-.59 3.11-1.49Z"/>
  </svg>
  <span><small>Download on the</small><strong>App Store</strong></span>
 </div>;
}
function GoogleBadge(){
 return <div className="lp-store-badge" title="Android app coming soon" aria-label="Google Play: coming soon">
  <svg viewBox="0 0 27 30" width="28" height="30" aria-hidden="true">
   <path d="M2 1.5L15.2 15 2 28.5Z" fill="#26BBF4"/>
   <path d="M2 1.5L20 11.6 15.2 15Z" fill="#45D48A"/>
   <path d="M15.2 15L20 11.6 25.3 14.5c.7.4.7 1.6 0 2L20 19.4Z" fill="#F9D14D"/>
   <path d="M2 28.5L20 19.4 15.2 15Z" fill="#F36A68"/>
  </svg>
  <span><small>Download on the</small><strong>Google play</strong></span>
 </div>;
}
function ProductPreview(){
 return <div className="lp-product-device" aria-label="Preview of the PaySplit dashboard" role="img">
  <div className="lp-device-screen">
   <div className="lp-device-camera"/>
   <div className="lp-product-ui">
    <div className="lp-ui-nav">
     <div className="lp-ui-brand"><BrandMark size={14}/> <b>PaySplit</b></div>
     <div className="lp-ui-navitems"><span className="selected">Dashboard</span><span>Transactions</span><span>My wallet</span><span>Split Rules</span></div>
     <div className="lp-ui-user"><Search size={12}/><Bell size={12}/><span className="lp-ui-avatar">P</span><small>Paul</small></div>
    </div>
    <div className="lp-ui-welcome">
     <div className="lp-welcome-copy"><strong>Good Afternoon, Paul!</strong><small>Saturday, December 25th, 2026</small></div>
     <div className="lp-mini-notification"><div><Bell size={10}/> <b>Notification</b> <span>View <ChevronRight size={10}/></span></div><p>Your salary split has been processed. Your money is working for you.</p><i/></div>
    </div>
    <div className="lp-ui-body">
     <div className="lp-ui-summary">
      <div><small>Unallocated Balance</small><strong>₦850,000</strong><em>Direct deposit via Access Bank Plc</em></div>
      <div><small>Split Allocation</small><strong>₦612,500</strong><em className="positive">72% of Salary</em></div>
      <div><small>Total in Vaults</small><strong>₦1,610,000</strong><em>Active vaults</em></div>
      <div><small>Next Split Run</small><strong className="lp-ui-date">Nov 25, 2026</strong><em>Fund Status <span className="negative">Unavailable</span></em></div>
     </div>
     <div className="lp-ui-panels">
      <div className="lp-chart-panel"><div className="lp-chart-head"><b>Salary Allocation & Split Cash Flow</b><span>● Savings Vaults　● Transfers & Bills</span></div><div className="lp-chart-sub"><strong>₦850,000</strong> <small>↑ 18% from last month</small></div><div className="lp-bars"><i style={{height:'23%'}}/><i style={{height:'58%'}}/><i style={{height:'37%'}}/><i style={{height:'83%'}}/><i style={{height:'70%'}}/><i style={{height:'46%'}}/><i style={{height:'95%'}}/></div></div>
      <div className="lp-chart-panel lp-donut-panel"><div className="lp-chart-head"><b>Salary Partition</b><small>Edit rule ›</small></div><div className="lp-donut"><span/></div><div className="lp-donut-caption">Saved Account <b>₦237,500</b></div></div>
     </div>
    </div>
   </div>
  </div>
  <div className="lp-device-hinge"/>
  <div className="lp-device-base"><span className="lp-base-trackpad"/></div>
 </div>;
}
export default function MarketingLanding(){
 return <div className="lp-page">
  <header className="lp-header">
   <Link className="lp-brand" href="/" aria-label="PaySplit home"><BrandLogo variant="light" markSize={27}/></Link>
   <nav className="lp-nav" aria-label="Main navigation"><a href="#about">About PaySplit</a><a href="#insights">Blog</a><a href="#contact">Contact</a></nav>
   <div className="lp-header-actions"><Link className="lp-login" href="/auth?mode=signin">Login <ArrowRight size={17}/></Link><Link className="lp-get-started" href="/auth?mode=signup">Get Started <ArrowRight size={18}/></Link></div>
  </header>
  <main>
   <section className="lp-hero" aria-labelledby="lp-heading">
    <div className="lp-hero-glow" aria-hidden="true"/>
    <div className="lp-hero-copy">
     <h1 id="lp-heading">We automate<br/>salary partitions<br/>that ignite<br/>financial clarity.</h1>
     <div className="lp-store-row"><AppleBadge/><GoogleBadge/></div>
    </div>
    <ProductPreview/>
   </section>
   <section className="lp-about" id="about">
    <div><small>ABOUT PAYSPLIT</small><h2>Make every payday work for you.</h2></div>
    <p>PaySplit helps you put your salary to work automatically. Create savings wallets, assign payments to people you care about, and choose how your income is split whenever it arrives.</p>
    <Link href="/auth?mode=signup">Get started <ArrowRight size={16}/></Link>
   </section>
   <section className="lp-how" id="insights">
    <div className="lp-how-heading"><small>HOW IT WORKS</small><h2>One salary. A plan for every naira.</h2></div>
    <div className="lp-how-grid">
     <article><div className="lp-how-icon"><Wallet size={22}/></div><b>01 — Set your destinations</b><p>Create savings wallets and securely add beneficiaries.</p></article>
     <article><div className="lp-how-icon"><Plus size={22}/></div><b>02 — Define your rules</b><p>Choose fixed amounts or percentages and put allocations in priority order.</p></article>
     <article><div className="lp-how-icon"><Download size={22}/></div><b>03 — Follow every movement</b><p>When salary arrives, PaySplit records and processes the allocations with a clear transaction history.</p></article>
    </div>
   </section>
  </main>
  <footer className="lp-footer" id="contact"><div className="lp-brand"><BrandLogo variant="light" markSize={27}/></div><span>Salary automation, made simple.</span><a href="https://github.com/caseykingsley77/PaySplit-Project/issues" target="_blank" rel="noreferrer">Contact & support <ArrowRight size={15}/></a><span className="lp-footer-security"><LockKeyhole size={14}/> Sandbox environment</span></footer>
 </div>;
}
