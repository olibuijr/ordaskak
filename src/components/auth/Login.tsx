
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
  email: z.string().email({ message: 'Vinsamlegast sláðu inn gilt netfang.' }),
  password: z.string().min(6, { message: 'Lykilorð verður að vera að minnsta kosti 6 stafir.' }),
});

type FormValues = z.infer<typeof formSchema>;

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await pb.collection('users').authWithPassword(data.email, data.password);
      toast({
        title: 'Innskráning tókst',
        description: 'Velkominn aftur!',
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Innskráning mistókst',
        description: error.message || 'Reyndu aftur síðar.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-[450px] max-w-full bg-game-light/40 backdrop-blur-md border-game-accent-blue/30">
      <CardHeader>
        <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-game-accent-blue to-game-accent-purple">
          Innskráning
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <div className="flex flex-col space-y-2">
              <Button 
                type="submit" 
                className="bg-game-accent-blue hover:bg-game-accent-blue/80 text-black"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Skrái inn...' : 'Skrá inn'}
              </Button>
              <Button
                type="button"
                variant="link"
                onClick={() => navigate('/register')}
              >
                Ekki með aðgang? Skráðu þig
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default Login;
