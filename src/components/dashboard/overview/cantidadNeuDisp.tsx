import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import type { SxProps } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { ArrowDown as ArrowDownIcon } from '@phosphor-icons/react/dist/ssr/ArrowDown';
import { ArrowUp as ArrowUpIcon } from '@phosphor-icons/react/dist/ssr/ArrowUp';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useEffect, useState } from 'react';
import { obtenerNeumaticosDisponiblesPorMes } from '../../../api/Neumaticos';
import { useUser } from '@/hooks/use-user';

export interface TotalCustomersProps {
  diff?: number;
  trend: 'up' | 'down';
  sx?: SxProps;
  value: string;
}

export function TotalCustomers({ diff, trend, sx, value }: TotalCustomersProps): React.JSX.Element {
  const { user } = useUser();
  const TrendIcon = trend === 'up' ? ArrowUpIcon : ArrowDownIcon;
  const trendColor = trend === 'up' ? 'var(--mui-palette-success-main)' : 'var(--mui-palette-error-main)';

  const [data, setData] = useState<{ fecha: string; cantidad: number }[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!user?.usuario) return;
      try {
        const result = await obtenerNeumaticosDisponiblesPorMes(user.usuario);
        // Formatear la fecha a DD-MM-YYYY
        const dataFormateada = result.map((item: any) => {
          // Soporta tanto FECHA/CANTIDAD como fecha/cantidad
          const fechaRaw = item.FECHA || item.fecha;
          const cantidadRaw = item.CANTIDAD ?? item.cantidad;
          const [year, month, day] = fechaRaw.split('-');
          return {
            fecha: `${day}-${month}-${year}`,
            cantidad: Number(cantidadRaw)
          };
        });
        // console.log('Datos recibidos para el gráfico:', result);
        setData(dataFormateada);
      } catch (error) {
        setData([]);
      }
    }
    fetchData();
  }, [user]);

  return (
    <Card sx={sx}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }} spacing={3}>
            <Stack spacing={1}>
              <Typography color="text.secondary" variant="overline">
                Neumáticos disponibles
              </Typography>
              <Typography variant="h4">{value}</Typography>
            </Stack>
            
            <Stack sx={{ position: 'relative', width: 75, height: 75 }}>
              <img src="/assets/disponibles.ico" alt="Neumático Disponible" style={{ width: 115, height: 115, position: 'absolute', top: -13, left: -25, zIndex: 1, opacity: 1 }} />
            </Stack>
          </Stack>
          <div style={{ width: '100%', height: 60 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                {/* <CartesianGrid strokeDasharray="3 3" /> */}
                <XAxis dataKey="fecha" hide />
                <YAxis hide />
                <Tooltip />
                <Line type="monotone" dataKey="cantidad" stroke="#8884d8" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* {diff ? (
            <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
              <Stack sx={{ alignItems: 'center' }} direction="row" spacing={0.5}>
                <TrendIcon color={trendColor} fontSize="var(--icon-fontSize-md)" />
                <Typography color={trendColor} variant="body2">
                  {diff}%
                </Typography>
              </Stack>
              <Typography color="text.secondary" variant="caption">
                Since last month
              </Typography>
            </Stack>
          ) : null} */}
        </Stack>
      </CardContent>
    </Card>
  );
}
