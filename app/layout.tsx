import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: '종목 분석 Dashboard', description: '개발 Fixture 기반 종목 분석 Dashboard' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
