// Login page uses its own full-screen layout, bypassing the admin sidebar layout
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
