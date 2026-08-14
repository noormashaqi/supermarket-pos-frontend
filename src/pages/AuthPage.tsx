import { useState, type FormEvent } from 'react';
import { LoginPage } from '../features/auth/LoginPage';
import type { SignInFormState } from '../types/app';
import { useNavigate } from 'react-router-dom';

export const AuthPage = () => {
  const [form, setForm] = useState<SignInFormState>({
    username: 'admin',
    password: '',
  });

  const navigate = useNavigate();

  const handleChange = (field: keyof SignInFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.username) return;
    navigate('/pos');
  };

  return (
    <LoginPage
      form={form}
      onChange={handleChange}
      onSubmit={handleSubmit}
    />
  );
};
