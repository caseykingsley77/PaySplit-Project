import type {CSSProperties} from 'react';
type BrandMarkProps={size?:number;className?:string};
export function BrandMark({size=28,className=''}:BrandMarkProps){
 return <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false" style={{flexShrink:0}}>
  <path d="M17 6.5H46.5C52.5 6.5 57.5 11.5 57.5 17.5V46C57.5 52.5 52.5 57.5 46 57.5H17.5C11.5 57.5 6.5 52.5 6.5 46.5V17C6.5 11.5 11.5 6.5 17 6.5Z" fill="#2BA8F4"/>
  <path d="M8 57L56 8" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round"/>
 </svg>;
}
type BrandLogoProps={variant?:'light'|'dark';className?:string;markSize?:number;style?:CSSProperties};
export function BrandLogo({variant='dark',className='',markSize=27,style}:BrandLogoProps){
 return <span className={'paysplit-brand '+className} style={{display:'inline-flex',alignItems:'center',gap:9,color:variant==='light'?'#FFFFFF':'#121820',whiteSpace:'nowrap',fontFamily:'Arial,Helvetica,sans-serif',fontWeight:600,letterSpacing:'-.025em',...style}}>
  <BrandMark size={markSize}/><span>PaySplit</span>
 </span>;
}
