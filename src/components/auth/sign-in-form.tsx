'use client';

import React, { useState } from 'react';
import RouterLink from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Eye as EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import { EyeSlash as EyeSlashIcon } from '@phosphor-icons/react/dist/ssr/EyeSlash';
import { Controller, useForm } from 'react-hook-form';
import { z as zod } from 'zod';
import IconButton from '@mui/material/IconButton';

import { paths } from '@/paths';
import { loginApi } from '@/lib/auth/authApi';
import { useUser } from '@/hooks/use-user';

const schema = zod.object({
  usuario: zod.string().min(1, { message: 'Se requiere usuario' }),
  password: zod.string().min(1, { message: 'Se requiere contraseña' }),
});

type Values = zod.infer<typeof schema>;

const defaultValues = { usuario: '', password: '' } satisfies Values;

export function SignInForm(): React.JSX.Element {
  const router = useRouter();

  const { checkSession } = useUser();

  const [showPassword, setShowPassword] = React.useState<boolean>();

  const [isPending, setIsPending] = React.useState<boolean>(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({ defaultValues, resolver: zodResolver(schema) });

  const onSubmit = React.useCallback(
    async (values: Values): Promise<void> => {
      setIsPending(true);
      console.log('[SignInForm] onSubmit: valores enviados', values);
      try {
        const loginResp = await loginApi({ usuario: values.usuario, password: values.password });
        console.log('[SignInForm] loginApi OK', loginResp);
      } catch (err: any) {
        console.error('[SignInForm] Error en loginApi', err);
        setError('root', { type: 'server', message: err?.response?.data?.error || 'Error de autenticación' });
        setIsPending(false);
        return;
      }
      // Refresh the auth state
      try {
        console.log('[SignInForm] Llamando a checkSession');
        await checkSession?.();
        console.log('[SignInForm] checkSession OK');
        router.push('/dashboard');
        setIsPending(false);
      } catch (err) {
        console.error('[SignInForm] Error en checkSession', err);
      }
      router.refresh();
      setIsPending(false);
    },
    [checkSession, router, setError]
  );

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h4">Inicio Sesion</Typography>
        <Typography color="text.secondary" variant="body2">
          No tienes una cuenta?{' '}
          <Link component={RouterLink} href={paths.auth.signUp} underline="hover" variant="subtitle2">
            Unete
          </Link>
        </Typography>
      </Stack>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <Controller
            name="usuario"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.usuario}>
                <InputLabel htmlFor="usuario">Usuario</InputLabel>
                <OutlinedInput
                  id="usuario"
                  type="text"
                  label="Usuario"
                  autoComplete="username"
                  {...field}
                />
                <FormHelperText>{errors.usuario?.message}</FormHelperText>
              </FormControl>
            )}
          />
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.password}>
                <InputLabel htmlFor="password">Contraseña</InputLabel>
                <OutlinedInput
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  label="Contraseña"
                  autoComplete="current-password"
                  endAdornment={
                    <IconButton
                      tabIndex={-1}
                      onClick={() => setShowPassword((show) => !show)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                    </IconButton>
                  }
                  {...field}
                />
                <FormHelperText>{errors.password?.message}</FormHelperText>
              </FormControl>
            )}
          />
          <div>
            <Link component={RouterLink} href={paths.auth.resetPassword} variant="subtitle2">
              Olvido su contraseña?
            </Link>
          </div>
          {errors.root && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.root.message}
            </Alert>
          )}
          <Button disabled={isPending} type="submit" variant="contained">
            {isPending ? 'Ingresando...' : 'Iniciar Sesion'}
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}
