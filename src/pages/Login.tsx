import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertCircle, Eye, EyeOff, LogIn } from 'lucide-react';

type LoginErrors = { email?: string; password?: string; form?: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getLoginErrorMessage(error: unknown) {
  const code = (error as { code?: string })?.code;

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email ou senha incorretos. Confira os dados e tente novamente.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.';
    case 'auth/network-request-failed':
      return 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.';
    case 'auth/user-disabled':
      return 'Este usuário está desativado. Procure o administrador do sistema.';
    default:
      return 'Não foi possível entrar agora. Tente novamente em instantes.';
  }
}

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({ email: false, password: false });
  const [errors, setErrors] = useState<LoginErrors>({});

  const getEmailError = () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) return 'Informe seu email.';
    if (!emailPattern.test(normalizedEmail)) return 'Digite um email válido, como nome@empresa.com.';
    return undefined;
  };

  const getPasswordError = () => {
    if (!password) return 'Informe sua senha.';
    if (password.length < 6) return 'A senha deve ter pelo menos 6 caracteres.';
    return undefined;
  };

  const validate = () => {
    const nextErrors: LoginErrors = {};
    const emailError = getEmailError();
    const passwordError = getPasswordError();

    if (emailError) nextErrors.email = emailError;
    if (passwordError) nextErrors.password = passwordError;

    setErrors(nextErrors);
    setTouched({ email: true, password: true });
    return nextErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    setErrors((current) => ({ ...current, form: undefined }));
    try {
      await login(email.trim(), password);
      toast.success('Bem-vindo!');
      navigate('/');
    } catch (error) {
      const message = getLoginErrorMessage(error);
      setErrors((current) => ({ ...current, form: message }));
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateEmail = (value: string) => {
    setEmail(value);
    if (errors.email || errors.form) setErrors((current) => ({ ...current, email: undefined, form: undefined }));
  };

  const updatePassword = (value: string) => {
    setPassword(value);
    if (errors.password || errors.form) setErrors((current) => ({ ...current, password: undefined, form: undefined }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            CRM <span className="text-emerald-500">+Cotação</span>
          </h1>
          <p className="text-slate-400 mt-2">Faça login para continuar</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-label="Formulário de login">
          {errors.form && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}
          <Input
            id="email"
            name="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => updateEmail(e.target.value)}
            onBlur={() => {
              setTouched((current) => ({ ...current, email: true }));
              setErrors((current) => ({ ...current, email: getEmailError() }));
            }}
            placeholder="seu@email.com"
            autoComplete="username"
            error={touched.email ? errors.email : undefined}
          />
          <div className="relative">
            <Input
              id="password"
              name="password"
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => updatePassword(e.target.value)}
              onBlur={() => {
                setTouched((current) => ({ ...current, password: true }));
                setErrors((current) => ({ ...current, password: getPasswordError() }));
              }}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              error={touched.password ? errors.password : undefined}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              className="absolute right-3 top-8 rounded p-1 text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <Button type="submit" isLoading={loading} className="w-full">
            <LogIn size={16} className="mr-2" />
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
