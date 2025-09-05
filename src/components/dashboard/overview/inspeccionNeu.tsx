'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import { alpha, useTheme } from '@mui/material/styles';
import type { SxProps } from '@mui/material/styles';
import { ArrowClockwise as ArrowClockwiseIcon } from '@phosphor-icons/react/dist/ssr/ArrowClockwise';
import { ArrowRight as ArrowRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import type { ApexOptions } from 'apexcharts';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

import { Chart } from '@/components/core/chart';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { obtenerInspeccionesNeumaticosPorFechas } from '@/api/Neumaticos';
import { useUser } from '@/hooks/use-user';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

// Agregar declaración global para window.placasPorBarra
declare global {
  interface Window {
    placasPorBarra?: string[];
    kilometrosPorBarra?: string[];
    posicionesPorBarra?: string[];
    rawInspeccionData?: any[];
  }
}

export interface SalesProps {
  chartSeries?: { name: string; data: number[] }[];
  sx?: SxProps;
}

export function Sales({ chartSeries: _chartSeries, sx }: SalesProps): React.JSX.Element {
  const chartOptions = useChartOptions();
  const { user } = useUser();
  const [startDate, setStartDate] = React.useState<dayjs.Dayjs | null>(dayjs().subtract(3, 'month'));
  const [endDate, setEndDate] = React.useState<dayjs.Dayjs | null>(dayjs());
  const [chartSeries, setChartSeries] = React.useState<{ name: string; data: number[] }[]>([]);
  const [categories, setCategories] = React.useState<string[]>([]);
  const [plotlyData, setPlotlyData] = React.useState<any[]>([]);
  const [allSeriesOptions, setAllSeriesOptions] = React.useState<string[]>([]);
  const [selectedSeries, setSelectedSeries] = React.useState<string[]>([]);
  const [fullChartSeries, setFullChartSeries] = React.useState<{ name: string; data: number[] }[]>([]);

  React.useEffect(() => {
    if (startDate && endDate && user?.usuario) {
      const fetchData = async () => {
        try {
          const data = await obtenerInspeccionesNeumaticosPorFechas({
            usuario: user.usuario,
            fechaInicio: startDate.format('YYYY-MM-DD'),
            fechaFin: endDate.format('YYYY-MM-DD'),
          });
          // console.log('Datos inspecciones backend (crudo):', JSON.stringify(data, null, 2));
          // Agrupar por FECHA_REGISTRO
          const groupByFecha: Record<string, any[]> = {};
          data.forEach((item: any) => {
            if (!groupByFecha[item.FECHA_REGISTRO]) groupByFecha[item.FECHA_REGISTRO] = [];
            groupByFecha[item.FECHA_REGISTRO].push(item);
          });
          // Ordenar fechas
          const fechas = Object.keys(groupByFecha).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
          // Obtener todas las placas únicas por fecha (manteniendo el orden)
          const placasPorFecha: Record<string, string[]> = {};
          fechas.forEach(fecha => {
            placasPorFecha[fecha] = Array.from(new Set(groupByFecha[fecha].map((item: any) => item.PLACA.trim())));
          });
          // Construir categorías: para cada fecha, una barra por cada placa
          const xCategories: string[] = [];
          fechas.forEach(fecha => {
            placasPorFecha[fecha].forEach(placa => {
              xCategories.push(`${fecha}|${placa}`);
            });
          });
          // Todas las combinaciones de POSICION_NEU + CODIGO
          const allSeriesKeys = Array.from(
            new Set(
              data.map((item: any) => `${item.POSICION_NEU} - ${item.CODIGO}`)
            )
          ) as string[];
          // Construir series: para cada serie, un valor por cada (fecha, placa)
          const series = allSeriesKeys.map((serieKey) => ({
            name: serieKey,
            data: xCategories.map((cat) => {
              const [fecha, placa] = cat.split('|');
              const found = groupByFecha[fecha]?.find(
                (item: any) => item.PLACA.trim() === placa && `${item.POSICION_NEU} - ${item.CODIGO}` === serieKey
              );
              return found ? found.REMANENTE : 0;
            }),
          }));
          // Las categorías serán solo la fecha (sin placa)
          const displayCategories = xCategories.map(cat => {
            const [fecha] = cat.split('|');
            return fecha;
          });
          // Guardar también las placas en el mismo orden de las barras
          const placasPorBarra = xCategories.map(cat => {
            const [, placa] = cat.split('|');
            return placa;
          });
          // Guardar también los kilometrajes en el mismo orden de las barras
          const kilometrosPorBarra = xCategories.map(cat => {
            const [fecha, placa] = cat.split('|');
            // Busca el primer registro de esa placa en esa fecha
            const all = groupByFecha[fecha]?.filter((item: any) => item.PLACA.trim() === placa && item.KILOMETRO !== undefined && item.KILOMETRO !== null);
            if (!all || all.length === 0) return '';
            // Si todos los kilometros son 0, mostrar vacío
            const maxKm = Math.max(...all.map((item: any) => Number(item.KILOMETRO) || 0));
            return maxKm > 0 ? maxKm.toLocaleString() : all[0].KILOMETRO.toString();
          });
          // Guardar también las posiciones en el mismo orden de las barras
          const posicionesPorBarra = xCategories.map(cat => {
            const [fecha, placa] = cat.split('|');
            // Busca el primer registro de esa placa en esa fecha
            const found = groupByFecha[fecha]?.find((item: any) => item.PLACA.trim() === placa);
            return found ? found.POSICION_NEU : '';
          });
          setCategories(displayCategories);
          setAllSeriesOptions(allSeriesKeys);
          setFullChartSeries(series);
          setSelectedSeries(allSeriesKeys);
          // Guardar placas y kilometrajes para usarlas en el overlay
          (window as any).placasPorBarra = placasPorBarra;
          (window as any).kilometrosPorBarra = kilometrosPorBarra;
          (window as any).posicionesPorBarra = posicionesPorBarra;
          // Preparar datos para Chart3D (opcional)
          const plotlyData = data.map((item: any) => ({
            placa: item.PLACA.trim(),
            fecha: item.FECHA_REGISTRO,
            posicion: item.POSICION_NEU,
            codigo: item.CODIGO,
            remanente: item.REMANENTE,
          }));
          setPlotlyData(plotlyData);
          // Exponer los datos originales para el tooltip
          (window as any).rawInspeccionData = data;
        } catch (e) {
          setCategories([]);
          setChartSeries([]);
          setPlotlyData([]);
        }
      };
      fetchData();
    }
  }, [startDate, endDate, user]);

  React.useEffect(() => {
    if (selectedSeries.length > 0) {
      const filtered = fullChartSeries.filter(s => selectedSeries.includes(s.name));
      setChartSeries(filtered);
    } else {
      setChartSeries([]);
    }
  }, [selectedSeries, fullChartSeries]);

  return (
    <Card sx={sx}>
      <CardHeader
        action={
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
            <div style={{ display: 'flex', gap: 8 }}>
              <DatePicker
                label="Inicio"
                value={startDate}
                onChange={setStartDate}
                slotProps={{ textField: { size: 'small', variant: 'outlined' } }}
              />
              <span style={{ alignSelf: 'center' }}>-</span>
              <DatePicker
                label="Fin"
                value={endDate}
                onChange={setEndDate}
                slotProps={{ textField: { size: 'small', variant: 'outlined' } }}
                minDate={startDate ?? undefined}
              />
            </div>
          </LocalizationProvider>
        }
        title="Inspecciones por Neumático"
      />
      <CardContent sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
        <div style={{ flexGrow: 1, position: 'relative' }}>
            {/* Gráfico 2D actual */}
            <div style={{ position: 'relative', width: '100%' }}>
            {/* Overlay de placas arriba de cada barra */}
            <BarPlatesOverlay categories={categories} />
            <Chart height={350} options={{ ...chartOptions, xaxis: { ...chartOptions.xaxis, categories } }} series={chartSeries} type="bar" width="100%" />
            </div>
        </div>
        <Autocomplete
          multiple
          limitTags={10}
          options={allSeriesOptions}
          value={selectedSeries}
          onChange={(event, newValue) => {
            setSelectedSeries(newValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              label="Seleccionar Neumáticos"
              placeholder="Neumáticos"
            />
          )}
          sx={{ width: 300 }}
        />
      </CardContent>
      <Divider />
    </Card>
  );
}

function useChartOptions(): ApexOptions {
  const theme = useTheme();

  return {
    chart: { background: 'transparent', stacked: true, toolbar: { show: false } },
    dataLabels: {
      enabled: true,
      style: {
        colors: ['#fff'],
        fontWeight: 700,
        fontSize: '14px',
      },
      dropShadow: {
        enabled: true,
        top: 1,
        left: 1,
        blur: 1,
        color: '#222',
        opacity: 0.5
      },
      formatter: function(val, opts) {
        if (typeof val === 'number' && val > 0) {
          return val % 1 === 0 ? val.toString() : val.toFixed(2).replace('.00','');
        }
        return '';
      },
      offsetY: 0,
    },
    fill: {
      opacity: 1,
      type: 'solid',
      colors: [function({ value, seriesIndex, dataPointIndex, w }: { value: number; seriesIndex: number; dataPointIndex: number; w: any; }) {
        const rawData = (window && (window).rawInspeccionData) || [];
        const placasPorBarra = (window && (window).placasPorBarra) || [];
        const fecha = w.globals.labels[dataPointIndex];
        const serieKey = w.globals.seriesNames[seriesIndex];
        const [posicion, codigo] = serieKey.split(' - ');
        const placa = placasPorBarra[dataPointIndex] || '';
        const found = rawData.find(
          (item: any) => item.PLACA.trim() === placa && item.FECHA_REGISTRO === fecha && item.POSICION_NEU === posicion && String(item.CODIGO) === codigo
        );
        const estado = found ? Number(found.ESTADO) : null;
        if (estado !== null) {
          if (estado > 80) return '#4CAF50'; // Verde
          if (estado > 40) return '#FFEB3B'; // Amarillo
          return '#E53935'; // Rojo
        }
        return '#BDBDBD'; // Gris si no hay dato
      }]
    },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 2,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    legend: {
      show: false,
      position: 'right',
      fontSize: '14px',
      labels: { colors: theme.palette.text.secondary },
      itemMargin: { vertical: 8 },
    },
    plotOptions: {
      bar: {
        columnWidth: '55%',
        borderRadius: 2,
        dataLabels: {
          position: 'top', // Placa arriba de la barra
        },
      },
    },
    stroke: { colors: ['#fff'], show: true, width: 2 },
    theme: { mode: theme.palette.mode },
    xaxis: {
      axisBorder: { color: theme.palette.divider, show: true },
      axisTicks: { color: theme.palette.divider, show: true },
      labels: {
        offsetY: 5,
        style: { colors: theme.palette.text.secondary, fontWeight: 600, fontSize: '13px' },
        rotate: 0,
        rotateAlways: false,
        trim: false,
        maxHeight: 60,
        formatter: (val) => {
          // Ahora solo se muestra la fecha, así que no es necesario invertir nada
          return String(val);
        },
      },
      tooltip: { enabled: true },
    },
    yaxis: {
      labels: {
        formatter: (value) => `${value}`,
        offsetX: -10,
        style: { colors: theme.palette.text.secondary, fontWeight: 600, fontSize: '13px' },
      },
    },
    tooltip: {
      y: {
        formatter: function(val, opts) {
          const placasPorBarra = (window && (window).placasPorBarra) || [];
          const kilometrosPorBarra = (window && (window).kilometrosPorBarra) || [];
          const rawData = (window && (window).rawInspeccionData) || [];
          const placa = placasPorBarra[opts.dataPointIndex] || '';
          const km = kilometrosPorBarra[opts.dataPointIndex] || '';
          let pos = '';
          let estado = '';
          let estadoNum: number | null = null;
          if (rawData && rawData.length) {
            const fecha = opts.w.globals.labels[opts.dataPointIndex];
            const serieKey = opts.w.globals.seriesNames[opts.seriesIndex];
            const [posicion, codigo] = serieKey.split(' - ');
            const placa = placasPorBarra[opts.dataPointIndex] || '';
            const found = rawData.find(
              (item: any) => item.PLACA.trim() === placa && item.FECHA_REGISTRO === fecha && item.POSICION_NEU === posicion && String(item.CODIGO) === codigo
            );
            if (found) {
              pos = found.POSICION_NEU;
              estado = found.ESTADO;
              estadoNum = Number(found.ESTADO);
            }
          }
          let result = placa;
          if (km) result += ` |${km}km`;
          if (pos) result += ` | ${pos}`;
          if (estado !== '') result += ` | Estado: ${estado}`;

          return result;
        },
        title: {
          formatter: () => '',
        },
      },
      x: {
        show: true,
        formatter: (val, opts) => {
          return String(val);
        },
      },
      shared: false,
      intersect: true,
    },
  };
}

// Overlay de placas arriba de cada barra
function BarPlatesOverlay({ categories }: { categories: string[] }) {
  // Obtener placas y kilometrajes en el mismo orden que las barras
  const placasPorBarra = (typeof window !== 'undefined' && window.placasPorBarra) || [];
  const kilometrosPorBarra = (typeof window !== 'undefined' && window.kilometrosPorBarra) || [];
  // console.log('Overlay placasPorBarra:', placasPorBarra);
  // console.log('Overlay kilometrosPorBarra:', kilometrosPorBarra);
  // Renderizar un label por cada barra
  return (
    <div style={{
      position: 'absolute',
      top: 10,
      left: 0,
      width: '100%',
      height: 0,
      pointerEvents: 'none',
      zIndex: 10,
      display: 'grid',
      gridTemplateColumns: `repeat(${placasPorBarra.length}, 1fr)`,
      padding: '0 30px',
      fontWeight: 700,
      fontSize: 13,
      color: '#223A57',
      textShadow: '0 1px 2px #fff, 0 0 2px #fff',
    }}>
      {kilometrosPorBarra.map((km, idx) => (
        <span key={idx} style={{
          minWidth: 0,
          maxWidth: 80,
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          margin: '0 auto',
        }}>
          <span style={{ fontWeight: 700 }}>{`Km: ${km}`}</span>
        </span>
      ))}
    </div>
  );
}
