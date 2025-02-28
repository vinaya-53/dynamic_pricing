'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { hashPassword } from '@/utils/auth'; // Adjust path if needed


// Schema for form validation
const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

type AuthFormData = z.infer<typeof authSchema>;

export function AuthForm() {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  // Firebase error messages mapping
  const getFirebaseErrorMessage = (errorCode: string) => {
    const errorMap: Record<string, string> = {
      'auth/email-already-in-use': 'This email is already in use.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/user-not-found': 'No account found for this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/weak-password': 'Password must be at least 6 characters long.',
    };
    return errorMap[errorCode] || 'An unexpected error occurred.';
  };

  const onSignUp = async (data: AuthFormData) => {
    setIsSigningUp(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // Hash password before sending to MongoDB
      const hashedPassword = await hashPassword(data.password); // Implement this function

      // Send user data to MongoDB via backend
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          user_name: data.name || 'New User',
          email: data.email,
          password: hashedPassword,
        }),
      });

      toast({ title: 'Account created successfully!', description: 'You can now sign in.' });
      router.replace('/dashboard');
    } catch (error: any) {
      toast({ title: 'Error', description: getFirebaseErrorMessage(error.code), variant: 'destructive' });
    } finally {
      setIsSigningUp(false);
    }
  };

  const onSignIn = async (data: AuthFormData) => {
    setIsSigningIn(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({ title: 'Signed in successfully!' });
      window.location.href = '/dashboard'; // Hard reload to refresh auth state
    } catch (error: any) {
      toast({ title: 'Error', description: getFirebaseErrorMessage(error.code), variant: 'destructive' });
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <Card className="w-[400px]">
      <Tabs defaultValue="signin">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>Sign in to your account or create a new one.</CardDescription>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent>
          <TabsContent value="signin">
            <form onSubmit={handleSubmit(onSignIn)}>
              <div className="space-y-4">
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="Email"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}

                <Input
                  {...register('password')}
                  type="password"
                  placeholder="Password"
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}

                <Button type="submit" className="w-full" disabled={isSigningIn}>
                  {isSigningIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={handleSubmit(onSignUp)}>
              <div className="space-y-4">
                <Input
                  {...register('name')}
                  type="text"
                  placeholder="Full Name"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}

                <Input
                  {...register('email')}
                  type="email"
                  placeholder="Email"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}

                <Input
                  {...register('password')}
                  type="password"
                  placeholder="Password"
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}

                <Button type="submit" className="w-full" disabled={isSigningUp}>
                  {isSigningUp ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Sign Up'
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
