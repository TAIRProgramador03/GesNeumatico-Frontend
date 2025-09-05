import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import BlockIcon from '@mui/icons-material/Block';

interface ModalAdvertenciaReubicacionProps {
    open: boolean;
    onClose: () => void;
    onAsignarNeumatico?: () => void;
    bloqueoReubicacion?: boolean;
    mensajeBloqueo?: string;
    tituloBloqueo?: string;
}

const ModalAdvertenciaReubicacion: React.FC<ModalAdvertenciaReubicacionProps> = ({
    open,
    onClose,
    onAsignarNeumatico,
    bloqueoReubicacion = false,
    mensajeBloqueo,
    tituloBloqueo
}) => {
    // Si es bloqueo, cambia el mensaje, título, ícono y color
    const titulo = bloqueoReubicacion
        ? (tituloBloqueo || 'REUBICACIÓN BLOQUEADA')
        : 'Sin neumáticos para reubicar';

    const mensaje = bloqueoReubicacion
        ? (mensajeBloqueo || 'Ya realizaste una reubicación con fecha desconocida. Debes realizar una nueva inspección para poder reubicar nuevamente.')
        : 'No hay neumáticos asignados para realizar la reubicación.\nDebe hacer una asignación primero.';

    const color = bloqueoReubicacion ? 'warning' : 'error';
    const fondo = '#fff3cd';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{ sx: { borderRadius: 3, minWidth: 600, maxWidth: 700 } }}
        >
            <DialogContent sx={{ bgcolor: fondo, borderRadius: 2, p: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', p: 3, pb: 2 }}>
                    <BlockIcon color={color} sx={{ fontSize: 56, mr: 2, mt: 0.5 }} />
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" fontWeight="bold" color={color} sx={{ mb: 1 }}>
                            {titulo}
                        </Typography>
                        <Typography sx={{ fontWeight: 'bold', fontSize: 16, color: '#222' }}>
                            {mensaje.split('\n').map((line, idx) => (
                                <span key={idx}>
                                    {line}
                                    <br />
                                </span>
                            ))}
                        </Typography>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions
                sx={{
                    p: 3,
                    backgroundColor: fondo,
                    justifyContent: 'flex-end',
                    gap: 2
                }}
            >
                <Button
                    onClick={onClose}
                    variant="outlined"
                    size="large"
                    sx={{
                        fontWeight: 'bold',
                        color: '#1976d2',
                        borderColor: '#1976d2',
                        borderRadius: 1.5,
                        px: 3,
                        py: 1.2,
                        fontSize: 16,
                        textTransform: 'none',
                        transition: 'all 0.2s',
                        '&:hover': { backgroundColor: '#1976d2', color: '#fff' }
                    }}
                >
                    Cerrar
                </Button>
                {!bloqueoReubicacion && onAsignarNeumatico && (
                    <Button
                        onClick={onAsignarNeumatico}
                        variant="contained"
                        size="large"
                        sx={{
                            fontWeight: 'bold',
                            backgroundColor: '#1976d2',
                            color: '#fff',
                            borderRadius: 1.5,
                            px: 3,
                            py: 1.2,
                            fontSize: 16,
                            textTransform: 'none',
                            boxShadow: 'none',
                            '&:hover': { backgroundColor: '#115293' }
                        }}
                    >
                        Asignar Neumático
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ModalAdvertenciaReubicacion;
