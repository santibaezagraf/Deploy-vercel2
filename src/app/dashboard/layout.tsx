import AuthGuard from '@/app/components/AuthGuard'
import Navbar from '@/app/components/Navbar'

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AuthGuard>
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <main className="py-8">
                    {children}
                </main>
            </div>
        </AuthGuard>
    )
}
