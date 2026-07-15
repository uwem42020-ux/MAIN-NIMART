import { Outlet } from 'react-router-dom';
import logo from '/logo.png';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img src={logo} alt="Nimart" className="mx-auto h-12 w-auto" />
          <p className="mt-2 text-sm text-gray-600">
            Nigeria's trusted service marketplace
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}