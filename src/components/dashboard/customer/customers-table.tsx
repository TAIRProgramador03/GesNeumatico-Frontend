'use client';

import * as React from 'react';
import {
  Card, Table, TableBody, TableCell, TableHead, TablePagination,
  TableRow, Box, Divider, Typography, Checkbox, Stack, LinearProgress
} from '@mui/material';

import { useSelection } from '@/hooks/use-selection';
import { obtenerUltimosMovimientosPorPlaca, obtenerUltimosMovimientosPorCodigo } from '@/api/Neumaticos';

export interface Customer {
  CODIGO: number;
  MARCA: string;
  MEDIDA: string;
  DISEÑO: string;
  REMANENTE: number;
  PR: number;
  CARGA: number;
  VELOCIDAD: string;
  RQ: number;
  OC: number;
  PROYECTO: string;
  COSTO: number;
  PROVEEDOR: string;
  FECHA_FABRICACION_COD: string;
  USUARIO_SUPER: string;
  TIPO_MOVIMIENTO: string;
  ESTADO: string;
  PLACA?: string; // Añadido para poder agrupar por placa
}

interface CustomersTableProps {
  count?: number;
  page?: number;
  rows?: Customer[];
  rowsPerPage?: number;
  onPageChange?: (event: React.MouseEvent<HTMLButtonElement> | null, page: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function CustomersTable({
  count = 0,
  rows = [],
  page = 0,
  rowsPerPage = 0,
  onPageChange = () => {},
  onRowsPerPageChange,
}: CustomersTableProps): React.JSX.Element {
  const rowIds = React.useMemo(() => {
    return rows.map((customer) => customer.CODIGO.toString());
  }, [rows]);

  const { selectAll, deselectAll, selectOne, deselectOne, selected } = useSelection(rowIds);

  const selectedSome = (selected?.size ?? 0) > 0 && (selected?.size ?? 0) < rows.length;
  const selectedAll = rows.length > 0 && selected?.size === rows.length;

  const [estadoPorCodigo, setEstadoPorCodigo] = React.useState<{ [codigo: number]: string | number }>({});

  React.useEffect(() => {
    async function fetchEstados() {
      const codigos = rows.map(r => r.CODIGO);
      const estados: { [codigo: number]: string | number } = {};
      await Promise.all(codigos.map(async (codigo) => {
        try {
          const movimientos = await obtenerUltimosMovimientosPorCodigo(codigo);
          // Log para depuración: ver movimientos retornados
          if (window && window.console) {
           // console.log('Movimientos para código', codigo, movimientos);
          }
          if (Array.isArray(movimientos) && movimientos.length > 0) {
            movimientos.sort((a, b) => new Date(b.FECHA_MOVIMIENTO).getTime() - new Date(a.FECHA_MOVIMIENTO).getTime());
            const mov = movimientos[0];
            if (mov && mov.ESTADO !== undefined) {
              estados[codigo] = mov.ESTADO;
            }
          }
        } catch (e) {
          if (window && window.console) {
            console.error('Error obteniendo movimientos para código', codigo, e);
          }
        }
      }));
      setEstadoPorCodigo(estados);
    }
    if (rows.length > 0) fetchEstados();
  }, [rows]);

  return (
    <Card sx={{ width: '100%' }}>
      <Box sx={{ width: '100%', overflowX: 'auto' }}>
        <Table sx={{ width: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedAll}
                  indeterminate={selectedSome}
                  onChange={(event) => {
                    if (event.target.checked) {
                      selectAll();
                    } else {
                      deselectAll();
                    }
                  }}
                />
              </TableCell>
              <TableCell><Typography fontWeight="bold">Código</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Marca</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Medida</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Diseño</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Remanente</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">PR</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Carga</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">RQ</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">OC</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Proyecto</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Proveedor</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Fecha Fabricación</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Situación</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Estado</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const isSelected = selected?.has(row.CODIGO.toString());
              const estado = estadoPorCodigo[row.CODIGO] !== undefined ? estadoPorCodigo[row.CODIGO] : row.ESTADO;

              return (
                <TableRow hover key={row.CODIGO} selected={isSelected}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isSelected}
                      onChange={(event) => {
                        if (event.target.checked) {
                          selectOne(row.CODIGO.toString());
                        } else {
                          deselectOne(row.CODIGO.toString());
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>{row.CODIGO}</TableCell>
                  <TableCell>{row.MARCA}</TableCell>
                  <TableCell>{row.MEDIDA}</TableCell>
                  <TableCell>{row.DISEÑO}</TableCell>
                  <TableCell>{row.REMANENTE}</TableCell>
                  <TableCell>{row.PR}</TableCell>
                  <TableCell>{row.CARGA}</TableCell>
                  <TableCell>{row.RQ}</TableCell>
                  <TableCell>{row.OC}</TableCell>
                  <TableCell>{row.PROYECTO}</TableCell>
                  <TableCell>{row.PROVEEDOR}</TableCell>
                  <TableCell>{row.FECHA_FABRICACION_COD}</TableCell>
                  <TableCell>{row.TIPO_MOVIMIENTO}</TableCell>
                  <TableCell align="center">
                    {typeof estado === 'number' ? (
                      <Box sx={{ width: '120px', position: 'relative' }}>
                        <LinearProgress
                          variant="determinate"
                          value={estado}
                          sx={{
                            height: 20,
                            borderRadius: 5,
                            backgroundColor: '#eee',
                            boxShadow: '0 0 0 1.5px #222', // Borde oscuro
                            '& .MuiLinearProgress-bar': {
                              backgroundColor:
                                estado < 39 ? '#d32f2f' : estado < 79 ? '#FFEB3B' : '#2e7d32',
                              borderRadius: 5,
                            },
                          }}
                        />
                        <Typography
                          variant="caption"
                          fontWeight="bold"
                          sx={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#000',
                            fontWeight: 'bold',
                            fontSize: 13,
                            letterSpacing: 0.5,
                            textShadow: '0 1px 2px rgba(255,255,255,0.15)'
                          }}
                        >
                          {estado}%
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
      <Divider />
      <Box sx={{ px: 2 }}>
        <TablePagination
          component="div"
          count={count}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          rowsPerPageOptions={[8, 10, 20, 30]}
        />
      </Box>
    </Card>
  );
}
