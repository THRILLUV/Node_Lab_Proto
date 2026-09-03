import "./globals.css";

export const metadata = {
  title: "NodeLab 가입 이식",
  description: "공식 레포로 옮기는 로그인·동의·별명 화면",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
