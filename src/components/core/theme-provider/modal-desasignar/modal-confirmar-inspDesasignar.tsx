import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface ModalConfirmarInspDesasignarProps {
    open: boolean;
    fechaUltimaInspeccion: string;
    diasDiferencia?: number;
    onClose: () => void;
    onRegistrarInspeccion: () => void;
    onContinuarDesasignacion: () => void; // Propiedad para continuar la desasignación
}

const ModalConfirmarInspDesasignar: React.FC<ModalConfirmarInspDesasignarProps> = ({
    open,
    fechaUltimaInspeccion,
    diasDiferencia = 0,
    onClose,
    onRegistrarInspeccion,
    onContinuarDesasignacion,
}) => {
    // Lógica adaptada
    const esMuyAntigua = diasDiferencia > 4;
    const esReciente = diasDiferencia >= 1 && diasDiferencia <= 4;
    const esHoy = diasDiferencia === 0;

    // Título
    let titulo = 'CONFIRMAR INSPECCIÓN';
    if (esMuyAntigua) titulo = 'INSPECCIÓN REQUERIDA';
    else if (esHoy) titulo = 'INSPECCIÓN RECIENTE';

    // Formatear fecha
    let fechaFormateada = fechaUltimaInspeccion;
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaUltimaInspeccion)) {
        const [y, m, d] = fechaUltimaInspeccion.split('-');
        const dia = d.padStart(2, '0');
        const mes = m.padStart(2, '0');
        fechaFormateada = `${dia}/${mes}/${y}`;
    }

    // Mensaje
    let mensaje = `La última inspección fue el ${fechaFormateada}. ¿Desea continuar con esa fecha o realizar una nueva inspección?`;
    if (esMuyAntigua) mensaje = `La última inspección (${fechaFormateada}) es demasiado antigua. Debe registrar una nueva inspección para continuar.`;
    else if (esHoy) mensaje = `Ya se realizó una inspección hoy (${fechaFormateada}). ¿Desea continuar con la desasignación?`;

    // Colores
    const fondo = esMuyAntigua ? '#ffebee' : esReciente ? '#fff3cd' : esHoy ? '#e8f5e8' : '#fffbe6';
    const colorIcono = esMuyAntigua ? 'error' : esReciente ? 'warning' : esHoy ? 'success' : 'warning';
    const colorTitulo = esMuyAntigua ? 'error.main' : esReciente ? 'warning.main' : esHoy ? 'success.main' : 'warning.main';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{ sx: { borderRadius: 3, minWidth: 600, maxWidth: 700, border: '3px solid red', zIndex: 9999 } }}
        >
            <DialogContent sx={{ bgcolor: fondo, borderRadius: 2, p: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', p: 3, pb: 2 }}>
                    <WarningAmberIcon color={colorIcono} sx={{ fontSize: 48, mr: 2, mt: 0.5 }} />
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" fontWeight="bold" color={colorTitulo} sx={{ mb: 1 }}>
                            {titulo}
                        </Typography>
                        <Typography sx={{ fontWeight: 'bold', fontSize: 16, color: '#222', mb: 1 }}>
                            {mensaje}
                        </Typography>
                        <Typography sx={{ fontSize: 15, color: '#1976d2', mb: 1 }}>
                            Acción: Desasignar neumático
                        </Typography>
                    </Box>
                    <img
                        src="/assets/inspeccionVehiculo.png"
                        alt="Inspección Vehículo"
                        style={{ width: 70, height: 70, marginLeft: 16, marginTop: 4, borderRadius: 8 }}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, backgroundColor: fondo, justifyContent: 'flex-end', gap: 2 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    size="large"
                    sx={{ fontWeight: 'bold', color: '#1976d2', borderColor: '#1976d2', borderRadius: 1.5, px: 3, py: 1.2, fontSize: 16, textTransform: 'none', transition: 'all 0.2s', '&:hover': { backgroundColor: '#1976d2', color: '#fff' } }}
                >
                    Cerrar
                </Button>
                <Button
                    onClick={onRegistrarInspeccion}
                    variant="contained"
                    size="large"
                    sx={{ fontWeight: 'bold', backgroundColor: '#1976d2', color: '#fff', borderRadius: 1.5, px: 3, py: 1.2, fontSize: 16, textTransform: 'none', boxShadow: 'none', '&:hover': { backgroundColor: '#115293' } }}
                >
                    Registrar nueva inspección
                </Button>
                {/* Solo mostrar continuar si no es muy antigua la inspección */}
                {!esMuyAntigua && (
                    <Button
                        onClick={onContinuarDesasignacion}
                        variant="contained"
                        size="large"
                        sx={{ fontWeight: 'bold', backgroundColor: '#2ecc40', color: '#fff', borderRadius: 1.5, px: 3, py: 1.2, fontSize: 16, textTransform: 'none', boxShadow: 'none', '&:hover': { backgroundColor: '#27ae60' } }}
                    >
                        Continuar desasignación
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ModalConfirmarInspDesasignar;