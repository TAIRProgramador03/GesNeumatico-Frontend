import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import type { SxProps } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { obtenerNeumaticosAsignadosPorMes } from '../../../api/Neumaticos';
import { useUser } from '@/hooks/use-user';

export interface TasksProgressProps {
  sx?: SxProps;
  value: number;
}

export function TasksProgress({ value, sx }: TasksProgressProps): React.JSX.Element {
  const { user } = useUser();
  const [data, setData] = React.useState<{ fecha: string; cantidad: number }[]>([]);

  React.useEffect(() => {
    async function fetchData() {
      if (!user?.usuario) return;
      try {
        const result = await obtenerNeumaticosAsignadosPorMes(user.usuario);
        const dataFormateada = result.map((item: any) => {
          const fechaRaw = item.FECHA || item.fecha;
          const cantidadRaw = item.CANTIDAD ?? item.cantidad;
          const [year, month, day] = fechaRaw.split('-');
          return {
            fecha: `${day}-${month}-${year}`,
            cantidad: Number(cantidadRaw)
          };
        });
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
              <Typography color="text.secondary" gutterBottom variant="overline">
                neumáticos asignados
              </Typography>
              <Typography variant="h4">{value}</Typography>
            </Stack>
            <Stack sx={{ position: 'relative', width: 75, height: 75 }}>
              <img src="/assets/asignados.png" alt="Neumático Asignado" style={{ width: 115, height: 115, position: 'absolute', top: -28, left: -25, zIndex: 1, opacity: 1 }} />
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
        </Stack>
      </CardContent>
    </Card>
  );
}
