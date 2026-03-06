import { AdminReadingList } from "@/features/quiz/components/admin/AdminReadingList";

export default function AdminReadingsPage() {
    return (
        <main className="min-h-screen flex justify-center px-4 py-8">
            <div className="w-full max-w-5xl">
                <AdminReadingList />
            </div>
        </main>
    );
}