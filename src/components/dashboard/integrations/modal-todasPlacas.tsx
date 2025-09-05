import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { Stack, Box, TableHead, TableRow, TableCell, Table } from '@mui/material';
import { buscarVehiculoPorPlacaEmpresa } from '@/api/Neumaticos';

interface ModalTodasPlacasProps {
    open: boolean;
    onClose: () => void;
    onVehiculoSeleccionado?: (vehiculo: any) => void;
}

const ModalTodasPlacas: React.FC<ModalTodasPlacasProps> = ({ open, onClose, onVehiculoSeleccionado }) => {
    const [busqueda, setBusqueda] = React.useState('');
    const [vehiculo, setVehiculo] = React.useState<any | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [seleccionando, setSeleccionando] = React.useState(false);

    const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setBusqueda(value);
        setVehiculo(null);
        setError(null);
        if (value.trim().length === 0) return;
        setLoading(true);
        try {
            const data = await buscarVehiculoPorPlacaEmpresa(value);
            if (data && data.mensaje === "Esa placa la tienes asignada en tu Taller") {
                setVehiculo(null);
                setError("Esa placa la tienes asignada en tu operación");
            } else if (!data || data.mensaje) {
                setVehiculo(null);
                setError(data?.mensaje || 'Vehículo no encontrado');
            } else {
                setVehiculo(data);
            }
        } catch (err) {
            setError('Error de conexión');
            setVehiculo(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            sx={{
                '& .MuiDialog-container': {
                    alignItems: 'flex-start',
                    justifyContent: 'flex-end',
                }
            }}
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    p: 4,
                    boxShadow: 3,
                    minHeight: 200,
                    minWidth: 350,
                    bgcolor: 'background.paper',
                }
            }}
        >
            <DialogContent>
                <Stack spacing={3} direction="column">
                    {/* Primer Stack: contenido principal */}
                    <Box
                        sx={{
                            bgcolor: 'background.paper',
                            borderRadius: 3,
                            boxShadow: 2,
                            p: 2,
                            border: '1px solid #e0e0e0',
                            minHeight: 60,
                        }}
                    >
                        <Stack spacing={1} direction="row" alignItems="center">
                            {/* Input para buscar placas */}
                            <input
                                type="text"
                                placeholder="Buscar placas..."
                                value={busqueda}
                                onChange={handleInputChange}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #ccc',
                                    fontSize: '1rem',
                                    width: '100%'
                                }}
                            />
                        </Stack>
                    </Box>
                    {/* Segundo Stack: detalles o acciones adicionales */}
                    <Box
                        sx={{
                            bgcolor: 'background.paper',
                            borderRadius: 3,
                            boxShadow: 2,
                            p: 2,
                            border: '1px solid #e0e0e0',
                            minHeight: 60,
                        }}
                    >
                        <Stack spacing={1} direction="row" alignItems="center">
                            <Table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '1rem', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold' }}>Marca</TableCell>
                                        <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold' }}>Modelo</TableCell>
                                        <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold' }}>Tipo</TableCell>
                                        <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold' }}>Color</TableCell>
                                        <TableCell sx={{ backgroundColor: '#e0f7fa', fontWeight: 'bold' }}>Año</TableCell>
                                    </TableRow>
                                </TableHead>
                                    <tbody>
                                        {loading && (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center">Buscando...</TableCell>
                                            </TableRow>
                                        )}
                                        {error && !loading && (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center">{error}</TableCell>
                                            </TableRow>
                                        )}
                                        {vehiculo && !loading && !error && (
                                            <TableRow
                                                hover
                                                style={{ cursor: seleccionando ? 'not-allowed' : 'pointer', opacity: seleccionando ? 0.5 : 1 }}
                                                onClick={() => {
                                                    if (seleccionando) return;
                                                    setSeleccionando(true);
                                                    if (onVehiculoSeleccionado) onVehiculoSeleccionado(vehiculo);
                                                    onClose();
                                                    setTimeout(() => setSeleccionando(false), 500); // Evita doble click rápido
                                                }}
                                            >
                                                <TableCell>{vehiculo.MARCA}</TableCell>
                                                <TableCell>{vehiculo.MODELO}</TableCell>
                                                <TableCell>{vehiculo.TIPO}</TableCell>
                                                <TableCell>{vehiculo.COLOR}</TableCell>
                                                <TableCell>{vehiculo.ANO}</TableCell>
                                            </TableRow>
                                        )}
                                    </tbody>
                            </Table>
                        </Stack>
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained" color="primary">
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ModalTodasPlacas;
