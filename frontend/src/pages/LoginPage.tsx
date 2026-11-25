import { useState, type FormEvent } from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.ts';
import { Button } from '../components/ui/Button.tsx';
import { Card } from '../components/ui/Card.tsx';
import { Input } from '../components/ui/Input.tsx';

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await login({ username: trimmedUser, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid username or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-botanical-cream px-4 py-8 sm:py-12 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1.5">
          <p className="text-xs uppercase tracking-[0.2em] text-botanical-muted font-medium">
            Bandhan · Wedding Ledger
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-botanical-text">
            Welcome Back
          </h1>
          <p className="text-sm text-botanical-muted">
            Sign in to continue planning your wedding budget.
          </p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              name="username"
              autoComplete="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <Input
              type="password"
              label="Password"
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error ? (
              <p
                role="alert"
                className="text-xs font-medium text-botanical-terracotta bg-botanical-terracotta/10 border border-botanical-terracotta/30 rounded-lg px-3 py-2"
              >
                {error}
              </p>
            ) : null}

            <div className="pt-1">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting}
                icon={<Lock className="w-4 h-4" strokeWidth={1.5} />}
              >
                Sign In
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
