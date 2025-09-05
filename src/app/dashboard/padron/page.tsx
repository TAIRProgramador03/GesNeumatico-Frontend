'use client';

import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import tirePng from "@/public/assets/tire.png";
import { cargarPadronNeumatico } from "@/api/Neumaticos";
import { useState, useRef, useEffect } from "react";
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Download as DownloadIcon } from '@phosphor-icons/react/dist/ssr/Download';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { Upload as UploadIcon } from '@phosphor-icons/react/dist/ssr/Upload';
import { ArrowClockwise as RefreshIcon } from '@phosphor-icons/react/dist/ssr/ArrowClockwise';
import styled from '@emotion/styled';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { CustomersFilters } from '@/components/dashboard/customer/customers-filters';
import { CustomersTable, Customer } from '@/components/dashboard/customer/customers-table';
import { Neumaticos } from '@/api/Neumaticos';
import { MainNav } from '@/components/dashboard/layout/main-nav';
import { useUser } from '@/hooks/use-user';
import { obtenerCantidadNeumaticos, obtenerCantidadNeumaticosDisponibles, obtenerCantidadNeumaticosAsignados, obtenerCantidadAutosDisponibles } from '@/api/Neumaticos';
import ModalInsertExcel from '@/components/dashboard/customer/modal-insertExcel';

export default function Page(): React.JSX.Element {
  const { user } = useUser();
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [loading, setLoading] = useState(false);
  const [resultadoCarga, setResultadoCarga] = useState<any>(null);
  const [modalCargaVisible, setModalCargaVisible] = useState(false);
  const [modalErroresVisible, setModalErroresVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [modalImportarVisible, setModalImportarVisible] = useState(false);

  const [projectCount, setProjectCount] = useState<number>(0);
  const [disponiblesCount, setDisponiblesCount] = useState<number>(0);
  const [asignadosCount, setAsignadosCount] = useState<number>(0);
  const [autosDisponiblesCount, setAutosDisponiblesCount] = useState<number>(0);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await Neumaticos();
        setCustomers(data);
      } catch (error) {
        console.error('Error al cargar los datos de la API:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    obtenerCantidadNeumaticos()
      .then(setProjectCount)
      .catch(console.error);
  }, []);

  useEffect(() => {
    obtenerCantidadNeumaticosDisponibles()
      .then(setDisponiblesCount)
      .catch(console.error);
  }, []);

  useEffect(() => {
    obtenerCantidadNeumaticosAsignados()
      .then(setAsignadosCount)
      .catch(console.error);
  }, []);

  useEffect(() => {
    obtenerCantidadAutosDisponibles()
      .then(setAutosDisponiblesCount)
      .catch(console.error);
  }, []);



  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value.toLowerCase());
    setPage(0);
  };

  const handleMainNavSearch = (text: string) => {
    setSearchText(text.toLowerCase());
    setPage(0);
  };

  const filteredCustomers = customers.filter((c) =>
    c.CODIGO.toString().toLowerCase().includes(searchText) ||
    c.MARCA.toLowerCase().includes(searchText) ||
    c.MEDIDA.toLowerCase().includes(searchText) ||
    c.DISEÑO.toLowerCase().includes(searchText) ||
    c.REMANENTE.toString().toLowerCase().includes(searchText) ||
    c.PR.toString().toLowerCase().includes(searchText) ||
    c.CARGA.toString().toLowerCase().includes(searchText) ||
    c.RQ.toString().toLowerCase().includes(searchText) ||
    c.OC.toString().toLowerCase().includes(searchText) ||
    c.PROYECTO.toLowerCase().includes(searchText) ||
    c.PROVEEDOR.toLowerCase().includes(searchText) ||
    c.FECHA_FABRICACION_COD.toLowerCase().includes(searchText) ||
    c.TIPO_MOVIMIENTO.toLowerCase().includes(searchText)
  );

  const paginatedCustomers = applyPagination(filteredCustomers, page, rowsPerPage);

  const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

  const Modal = styled.div`
  background: white;
  padding: 24px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  text-align: center;
  width: fit-content;
  max-width: 90vw;

  h2 {
    margin-bottom: 16px;
  }

  button {
    margin-top: 20px;
    padding: 10px 18px;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
`;

  const ErrorTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;

  th, td {
    border: 1px solid #ccc;
    padding: 6px;
    text-align: left;
  }

  th {
    background: #f5f5f5;
  }
`;

  const LoaderOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;

  .loader-tire {
    display: flex;
    flex-direction: column;
    align-items: center;

    img {
      width: 100px;
      animation: spin 1.5s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  }
`;

  const handleRefresh = async () => {
    setCustomers([]); // Limpia la tabla para ver el efecto
    try {
      const data = await Neumaticos();
      setCustomers(data);
      // Actualiza los contadores usando funciones reutilizables:
      obtenerCantidadNeumaticos()
        .then(setProjectCount)
        .catch(console.error);
      obtenerCantidadNeumaticosDisponibles()
        .then(setDisponiblesCount)
        .catch(console.error);
      obtenerCantidadNeumaticosAsignados()
        .then(setAsignadosCount)
        .catch(console.error);
      obtenerCantidadAutosDisponibles()
        .then(setAutosDisponiblesCount)
        .catch(console.error);
    } catch (error) {
      alert('Error al refrescar los datos');
    }
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Determinar si el usuario tiene el perfil 002 (JEFE DE TALLER)
  const esJefeTaller = Array.isArray(user?.perfiles) && user.perfiles.some((p: any) => p.codigo === '002');

  // Nueva función para importar desde el modal
  const handleImportarArchivo = async (file: File) => {
    setLoading(true);
    setResultadoCarga(null);
    try {
      const response = await cargarPadronNeumatico(file);
      setResultadoCarga(response);
      setModalCargaVisible(true);
      setModalImportarVisible(false);
      if (response.insertados > 0) {
        const data = await Neumaticos();
        setCustomers(data);
      }
    } catch (error: any) {
      setResultadoCarga({
        mensaje: error.message || 'Error desconocido al cargar el archivo',
        total: 0,
        insertados: 0,
        errores: []
      });
      setModalCargaVisible(true);
      setModalImportarVisible(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && (
        <LoaderOverlay>
          <div className="loader-tire">
            <img src="/assets/tire.png" alt="Cargando..." />
            <p style={{ marginTop: "10px", fontWeight: "bold" }}>Procesando Excel...</p>
          </div>
        </LoaderOverlay>
      )}

      <Stack spacing={3} sx={{ width: '100%' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ width: '100%' }}
        >
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
            <TextField
              size="small"
              value={searchText}
              onChange={e => {
                setSearchText(e.target.value.toLowerCase());
                setPage(0);
              }}
              placeholder="Buscar neumático..."
              sx={{
                width: {
                  xs: '100%',   
                  sm: 300       
                }
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mt: { xs: 2, md: 0 } }}>
            <Button
              color="inherit"
              startIcon={<UploadIcon />}
              onClick={() => setModalImportarVisible(true)}
              disabled={loading || esJefeTaller}
            >
              {isMobile ? null : (loading ? "Cargando..." : "Importar")}
            </Button>
            <Button
              color="inherit"
              startIcon={<DownloadIcon fontSize="var(--icon-fontSize-md)" />}
            >
              {isMobile ? null : "Exportar"}
            </Button>
            <Button
              color="inherit"
              startIcon={<RefreshIcon fontSize="var(--icon-fontSize-md)" />}
              onClick={handleRefresh}
              disabled={loading}
            >
              {isMobile ? null : "Refrescar"}
            </Button>
            <Button
              startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />}
              variant="contained"
              disabled={esJefeTaller}
            >
              Agregar
            </Button>
          </Box>
        </Stack>
        <CustomersFilters
          key={projectCount + '-' + disponiblesCount + '-' + asignadosCount + '-' + autosDisponiblesCount + '-' + Date.now()}
          projectCount={projectCount}
          disponiblesCount={disponiblesCount}
          asignadosCount={asignadosCount}
          autosDisponiblesCount={autosDisponiblesCount}
        />


        <CustomersTable
          count={filteredCustomers.length}
          page={page}
          rows={paginatedCustomers}
          rowsPerPage={rowsPerPage}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </Stack >

      {modalCargaVisible && resultadoCarga && (
        <ModalOverlay>
          <Modal>
            <h2>Carga finalizada</h2>
            <p><strong>Total:</strong> {resultadoCarga.total}</p>
            <p><strong>Insertados:</strong> {resultadoCarga.insertados}</p>
            {resultadoCarga.mensaje && (
              <p style={{
                marginTop: '12px',
                padding: '10px',
                borderRadius: '6px',
                backgroundColor:
                  resultadoCarga.mensaje.includes("correctamente") ? "#e0f7e9"
                    : resultadoCarga.mensaje.includes("no realizada") ? "#ffebee"
                      : resultadoCarga.mensaje.toLowerCase().includes("error") ? "#ffebee"
                        : "#fff8e1",
                color:
                  resultadoCarga.mensaje.includes("correctamente") ? "#2e7d32"
                    : resultadoCarga.mensaje.includes("no realizada") ? "#c62828"
                      : resultadoCarga.mensaje.toLowerCase().includes("error") ? "#c62828"
                        : "#f9a825",
                fontWeight: "bold"
              }}>
                {resultadoCarga.mensaje}
              </p>
            )}
            {resultadoCarga.errores && resultadoCarga.errores.length > 0 && (
              <>
                <p style={{marginTop: 18, fontWeight: 600, color: '#c62828'}}>Errores detectados:</p>
                <div style={{ maxHeight: '300px', overflowY: 'auto', margin: '0 auto', marginBottom: 10, minWidth: 'min(90vw, 400px)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.98rem' }}>
                    <thead>
                      <tr>
                        <th style={{background:'#f5f5f5', padding:'6px'}}>Fila/Código</th>
                        <th style={{background:'#f5f5f5', padding:'6px'}}>Mensaje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultadoCarga.errores.map((err: { fila: string; mensaje: string }, idx: number) => (
                        <tr key={idx}>
                          <td style={{ padding: '6px', border: '1px solid #eee' }}>{err.fila}</td>
                          <td style={{ color: '#c62828', fontWeight: 'bold', padding: '6px', border: '1px solid #eee' }}>
                            {err.mensaje || "Error desconocido"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <button onClick={() => {
              setModalCargaVisible(false);
              if (resultadoCarga.errores && resultadoCarga.errores.length > 0) {
                setModalErroresVisible(true);
              }
            }}>Aceptar</button>
          </Modal>
        </ModalOverlay>
      )
      }

      {
        modalErroresVisible && resultadoCarga?.errores?.length > 0 && (
          <ModalOverlay>
            <Modal>
              <h2>Errores de carga</h2>
              <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px', minWidth: 'min(90vw, 600px)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th>Fila/Código</th>
                      <th>Mensaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultadoCarga.errores.map((err: { fila: string; mensaje: string }, idx: number) => (
                      <tr key={idx}>
                        <td>{err.fila}</td>
                        <td style={{ color: 'red', fontWeight: 'bold' }}>
                          {err.mensaje || "Error desconocido"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={() => setModalErroresVisible(false)}>Cerrar</button>
            </Modal>
          </ModalOverlay>
        )
      }

      <ModalInsertExcel
        open={modalImportarVisible}
        onClose={() => setModalImportarVisible(false)}
        onSuccess={async () => {
          // Refresca la tabla solo si hubo éxito en la carga
          const data = await Neumaticos();
          setCustomers(data);
          // También refresca los contadores
          obtenerCantidadNeumaticos().then(setProjectCount).catch(console.error);
          obtenerCantidadNeumaticosDisponibles().then(setDisponiblesCount).catch(console.error);
          obtenerCantidadNeumaticosAsignados().then(setAsignadosCount).catch(console.error);
          obtenerCantidadAutosDisponibles().then(setAutosDisponiblesCount).catch(console.error);
        }}
      />
    </>
  );
}

function applyPagination(rows: Customer[], page: number, rowsPerPage: number): Customer[] {
  return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
}
