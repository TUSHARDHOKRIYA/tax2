import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuthStore();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-6 invoice-card">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">Invoice Pro</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to continue</p>
        </div>

        <h2 className="text-lg font-semibold mb-4 text-foreground">Login</h2>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email</label>
            <Input
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              type="email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm font-medium text-foreground">Demo credentials</p>
          <p className="text-sm text-muted-foreground mt-1">
            Email: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-xs">admin</code>
          </p>
          <p className="text-sm text-muted-foreground">
            Password: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-xs">admin</code>
          </p>
        </div>
      </Card>
    </div>
  );
}
