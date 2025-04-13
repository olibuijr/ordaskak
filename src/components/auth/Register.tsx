
import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { pb } from '@/services/pocketbase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
  username: z.string().min(3, { message: 'Notandanafn verður að vera að minnsta kosti 3 stafir.' }),
  email: z.string().email({ message: 'Vinsamlegast sláðu inn gilt netfang.' }),
  password: z.string().min(6, { message: 'Lykilorð verður að vera að minnsta kosti 6 stafir.' }),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Lykilorð passa ekki saman.',
  path: ['passwordConfirm'],
});

type FormValues = z.infer<typeof formSchema>;

const Register = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      passwordConfirm: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const userData = {
        username: data.username,
        email: data.email,
        password: data.password,
        passwordConfirm: data.passwordConfirm,
      };
      
      await pb.collection('users').create(userData);
      await pb.collection('users').authWithPassword(data.email, data.password);
      
      toast({
        title: 'Skráning tókst',
        description: 'Velkominn í Orðaskák!',
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Skráning mistókst',
        description: error.message || 'Reyndu aftur síðar.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-[450px] max-w-full bg-game-light/40 backdrop-blur-md border-game-accent-blue/30">
      <CardHeader>
        <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-game-accent-blue to-game-accent-purple">
          Nýskráning
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notandanafn</FormLabel>
                  <FormControl>
                    <Input placeholder="Notandanafn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Netfang</FormLabel>
                  <FormControl>
                    <Input placeholder="netfang@dæmi.is" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lykilorð</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="passwordConfirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Staðfesta lykilorð</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col space-y-2">
              <Button 
                type="submit" 
                className="bg-game-accent-blue hover:bg-game-accent-blue/80 text-black"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Skrái...' : 'Skrá'}
              </Button>
              <Button
                type="button"
                variant="link"
                onClick={() => navigate('/login')}
              >
                Ertu nú þegar með aðgang? Skráðu þig inn
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default Register;
