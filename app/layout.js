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
    description: "1초라도 더 점령하라! 실시간 1원 뺏기 전광판 배틀",
    openGraph: {
      title: "1원 전광판",
      description: "1초라도 더 점령하라! 실시간 1원 뺏기 전광판 배틀",
      images: [imageUrl],
    },
    twitter: {
      card: "summary_large_image",
      title: "1원 전광판",
      description: "1초라도 더 점령하라! 실시간 1원 뺏기 전광판 배틀",
      images: [imageUrl],
    },
    icons: {
      icon: '/icon.svg',
      shortcut: '/icon.svg',
      apple: '/icon.svg',
      other: {
        rel: 'apple-touch-icon-precomposed',
        url: '/icon.svg',
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
        <footer className="w-full bg-gray-900 text-gray-400 text-xs py-8 px-4 text-center mt-auto border-t border-gray-800">
          <div className="max-w-4xl mx-auto space-y-3">
            <p>
              <a href="/policy" className="text-yellow-400 hover:underline">서비스 이용약관</a>
            </p>
            <p className="text-gray-500">© 2026. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
