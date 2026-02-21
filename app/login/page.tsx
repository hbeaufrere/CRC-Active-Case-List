import LoginForm from '@/components/login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-800 tracking-tight">CRC</h1>
          <p className="text-slate-600 mt-1">California Raptor Center</p>
          <p className="text-slate-500 text-sm mt-0.5">Active Case List</p>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-6 border border-slate-200">
          <LoginForm />
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">
          UC Davis School of Veterinary Medicine
        </p>
      </div>
    </div>
  );
}
