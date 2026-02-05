import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getLatestMessage } from '@/app/actions';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata() {
  const latestMessage = await getLatestMessage();
  const cacheBusterId = latestMessage?.id || 'no_message'; // 메시지 없으면 기본값 사용

  const imageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/og?id=${cacheBusterId}&_=${Date.now()}`;

  return {
    title: "1원 전광판",
    description: "1원으로 당신의 메시지를 전 세계에 보여주세요!",
    openGraph: {
      title: "1원 전광판",
      description: "1원으로 당신의 메시지를 전 세계에 보여주세요!",
      images: [imageUrl],
    },
    twitter: {
      card: "summary_large_image",
      title: "1원 전광판",
      description: "1원으로 당신의 메시지를 전 세계에 보여주세요!",
      images: [imageUrl],
    },
    icons: {
      icon: '/1wonad.png',
      shortcut: '/1wonad.png', // 기본 파비콘을 위한 설정
      apple: '/1wonad.png',
      other: {
        rel: 'apple-touch-icon-precomposed',
        url: '/1wonad.png',
      },
    },
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.7/kakao.min.js"
          integrity="sha384-tJkjbtDbvoxO+diRuDtwRO9JXR7pjWnfjfRn5ePUpl7e7RJCxKCwwnfqUAdXh53p"
          crossOrigin="anonymous"
        ></script>
        <footer className="w-full bg-gray-900 text-gray-400 text-xs py-4 px-4 text-center mt-auto">
          <div className="max-w-4xl mx-auto space-y-1">
            <p>상호명: 이너몰 | 사업자등록번호: 685-26-02075</p>
            <p>대표자명: 인찬혁 | 사업장 주소: 경기도 고양시 덕양구 지도로 124번길 46-15, 702호</p>
            <p>전화번호: 010-8470-9878</p>
            <p className="mt-2">
              <a href="/policy" className="text-yellow-400 hover:underline">서비스 이용약관 및 환불 규정</a>
            </p>
            <p className="text-gray-500 mt-2">© 2026 이너몰. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
