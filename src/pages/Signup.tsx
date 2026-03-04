import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

// Feature flag
const SIGNUP_ENABLED = false;

export default function Signup() {
  if (!SIGNUP_ENABLED) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-6 invoice-card">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-5 w-5 text-warning" />
            <h2 className="text-lg font-semibold text-foreground">Sign up</h2>
          </div>
          <div className="bg-warning/10 border border-warning/20 text-foreground px-4 py-3 rounded-lg mb-4">
            <p className="font-medium">Sign up is disabled</p>
            <p className="text-sm text-muted-foreground mt-1">
              Contact the admin for access. Use demo credentials to sign in instead.
            </p>
          </div>
          <Button disabled className="w-full">Sign up (disabled)</Button>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Use demo credentials on the login page.
          </p>
        </Card>
      </div>
    );
  }

  return null;
}
