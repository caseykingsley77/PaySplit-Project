import type { Metadata } from 'next';
import './globals.css';
import './paysplit.css';
export const metadata: Metadata = { title: 'PaySplit — Your money, on purpose', description: 'Automate your salary allocations with confidence.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
