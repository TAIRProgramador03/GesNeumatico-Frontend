"use client";

import * as React from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { config } from '@/config';
import { obtenerCantidadNeumaticos, obtenerCantidadNeumaticosDisponibles, obtenerCantidadNeumaticosAsignados } from '@/api/Neumaticos';
import { Budget } from '@/components/dashboard/overview/cantidadNeu';
import { Sales } from '@/components/dashboard/overview/inspeccionNeu';
import { TasksProgress } from '@/components/dashboard/overview/cantidadNeuAsig';
import { TotalCustomers } from '@/components/dashboard/overview/cantidadNeuDisp';
import { TotalProfit } from '@/components/dashboard/overview/total-profit';
import { Traffic } from '@/components/dashboard/overview/traffic';

// export const metadata = { title: `Overview | Dashboard | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  const [cantidadNeumaticos, setCantidadNeumaticos] = useState<string | number>('...');
  const [cantidadDisponibles, setCantidadDisponibles] = useState<string | number>('...');
  const [cantidadAsignados, setCantidadAsignados] = useState<string | number>(0);

  useEffect(() => {
    obtenerCantidadNeumaticos()
      .then((cantidad) => setCantidadNeumaticos(cantidad))
      .catch(() => setCantidadNeumaticos('Error'));
    obtenerCantidadNeumaticosDisponibles()
      .then((cantidad) => setCantidadDisponibles(cantidad))
      .catch(() => setCantidadDisponibles('Error'));
    obtenerCantidadNeumaticosAsignados()
      .then((cantidad) => setCantidadAsignados(cantidad))
      .catch(() => setCantidadAsignados(0));
  }, []);

  return (
    <Grid container spacing={3}>
      <Grid lg={3} sm={6} xs={12}>
        <Budget diff={12} trend="up" sx={{ height: '100%' }} value={cantidadNeumaticos.toString()} />
      </Grid>
      <Grid lg={3} sm={6} xs={12}>
        <TotalCustomers diff={16} trend="down" sx={{ height: '100%' }} value={cantidadDisponibles.toString()} />
      </Grid>
      <Grid lg={3} sm={6} xs={12}>
        <TasksProgress sx={{ height: '100%' }} value={Number(cantidadAsignados)} />
      </Grid>
      <Grid lg={3} sm={6} xs={12}>
        <TotalProfit sx={{ height: '100%' }} value="$15k" />
      </Grid>
      <Grid lg={12} xs={12}>
        <Sales sx={{ height: '100%' }} />
      </Grid>
      {/* <Grid lg={4} md={6} xs={12}>
        <Traffic chartSeries={[63, 15, 22]} labels={['Desktop', 'Tablet', 'Phone']} sx={{ height: '100%' }} />
      </Grid> */}
    </Grid>
  );
}
