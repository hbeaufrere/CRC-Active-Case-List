export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-amber-800 h-16" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="animate-pulse space-y-4">
          <div className="flex gap-4">
            <div className="h-10 w-40 bg-slate-200 rounded-lg" />
            <div className="h-10 w-40 bg-slate-200 rounded-lg" />
          </div>
          <div className="h-10 bg-slate-200 rounded-lg" />
          <div className="h-64 bg-slate-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
