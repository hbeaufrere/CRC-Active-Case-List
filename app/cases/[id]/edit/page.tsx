import { db } from '@/db';
import { cases } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import type { Case } from '@/types';
import Navbar from '@/components/navbar';
import CaseForm from '@/components/case-form';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function EditCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;
  const caseId = parseInt(id, 10);

  const caseResult = await db.select().from(cases).where(eq(cases.id, caseId));
  if (caseResult.length === 0) notFound();

  const caseData = caseResult[0] as Case;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar initials={session.initials} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <Link href={`/cases/${caseId}`} className="text-sm text-amber-700 hover:text-amber-900">
            &larr; Back to Case
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 mt-2">
            Edit {caseData.caseNumber}
          </h1>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <CaseForm
            mode="edit"
            caseId={caseId}
            initialData={{
              ...caseData,
              commonName: caseData.commonName ?? '',
              wrmdCaseNumber: caseData.wrmdCaseNumber ?? '',
              location: caseData.location ?? '',
              otherNotes: caseData.otherNotes ?? '',
              nextFollowUpDate: caseData.nextFollowUpDate ?? '',
              intakeDate: caseData.intakeDate ?? '',
              intakeReason: caseData.intakeReason ?? '',
            }}
          />
        </div>
      </main>
    </div>
  );
}
