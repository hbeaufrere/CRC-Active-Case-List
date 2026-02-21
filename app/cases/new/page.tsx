import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Navbar from '@/components/navbar';
import CaseForm from '@/components/case-form';
import Link from 'next/link';

export default async function NewCasePage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar initials={session.initials} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <Link href="/dashboard" className="text-sm text-amber-700 hover:text-amber-900">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 mt-2">New Case</h1>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <CaseForm mode="create" />
        </div>
      </main>
    </div>
  );
}
