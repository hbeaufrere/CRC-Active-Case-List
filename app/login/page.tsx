import LoginForm from '@/components/login-form';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="California Raptor Center Logo"
            width={400}
            height={120}
            className="mx-auto mb-4"
            priority
          />
          <p className="text-slate-500 text-sm mt-2">Active Case List</p>
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
