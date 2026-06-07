import { AdminReadingList } from "@/features/quiz/components/admin/AdminReadingList";
import {Navbar} from "@/components/Navbar";

export default function AdminReadingsPage() {
    return (
        <div>
            <Navbar />
            <main className="min-h-screen flex justify-center px-4 py-8">
                <div className="w-full max-w-5xl">
                    <AdminReadingList />
                </div>
            </main>
        </div>
    );
}