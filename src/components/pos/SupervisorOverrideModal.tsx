import { useState, type FormEvent } from 'react';
import { ShieldAlert, KeyRound, Lock } from 'lucide-react';
import { Modal } from '../common';
import { apiClient } from '../../api/client';

interface SupervisorOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthorize: (supervisorName: string) => void;
  itemName?: string;
}

export const SupervisorOverrideModal = ({
  isOpen,
  onClose,
  onAuthorize,
  itemName,
}: SupervisorOverrideModalProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Please enter manager username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      // Authenticate manager credentials against backend API
      const res = await apiClient<any>('/api/Auth/sign-in', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (res && res.accessToken) {
        const role = res.role || '';
        const permissions: string[] = Array.isArray(res.permissions) ? res.permissions : [];

        const isManagerOrAdmin =
          role === 'Admin' ||
          permissions.includes('invoices.override_price') ||
          permissions.includes('sales.price_override') ||
          permissions.includes('employees.manage');

        if (isManagerOrAdmin) {
          const supervisorName = res.fullName || res.username || username;
          onAuthorize(supervisorName);
          setUsername('');
          setPassword('');
          onClose();
        } else {
          setErrorMsg('Provided account does not have Manager Price Override permission.');
        }
      } else {
        setErrorMsg('Invalid supervisor credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Supervisor authorization failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supervisor Price Override Authorization"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-amber-900">Manager Credentials Required</p>
            <p className="text-amber-700 mt-0.5">
              Unit price edit for <span className="font-bold">{itemName || 'cart item'}</span> requires supervisor price override approval.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Manager Username <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Manager Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {isLoading ? 'Authorizing...' : 'Authorize Price Override'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
