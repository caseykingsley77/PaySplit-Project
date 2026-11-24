import type {CSSProperties} from 'react';

type BrandMarkProps={size?:number;className?:string;tone?:'blue'|'black'};
export function BrandMark({size=28,className='',tone='blue'}:BrandMarkProps){
 const ink=tone==='black'?'#050505':'#2DA7F3';
 return <svg className={className} width={size} height={size} viewBox="0 0 100 100" fill="none" role="img" aria-label="PaySplit mark" focusable="false" style={{flexShrink:0}}>
  <path d="M37 9H62C67 9 71 11 75 15L85 25C89 29 91 34 91 39V61C91 66 89 71 85 75L75 85C71 89 66 91 61 91H39C34 91 29 89 25 85L15 75C11 71 9 66 9 61V39C9 34 11 29 15 25L25 15C29 11 32 9 37 9Z" fill={ink}/>
  <path d="M14 86L86 14" stroke="white" strokeWidth="8.5" strokeLinecap="round"/>
  <path d="M13 87L20.5 79.5M79.5 20.5L87 13" stroke={ink} strokeWidth="8.5" strokeLinecap="round"/>
 </svg>;
}

type BrandLogoProps={variant?:'light'|'dark';className?:string;markSize?:number;style?:CSSProperties;markTone?:'blue'|'black'};
export function BrandLogo({variant='dark',className='',markSize=27,style,markTone='blue'}:BrandLogoProps){
 return <span className={'paysplit-brand '+className} style={{display:'inline-flex',alignItems:'center',gap:9,color:variant==='light'?'#FFFFFF':'#121820',whiteSpace:'nowrap',fontFamily:'Arial,Helvetica,sans-serif',fontWeight:600,letterSpacing:'-.025em',...style}}>
  <BrandMark size={markSize} tone={markTone}/><span>PaySplit</span>
 </span>;
}
