import React, { useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import WarningIcon from '@mui/icons-material/Warning';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface ModalInspeccionAverProps {
    open: boolean;
    ultimaInspeccionFecha?: string; // Fecha de la última inspección
    esInspeccionHoy?: boolean; // Si la última inspección fue hoy (7/7/2025)
    onClose: () => void;
    onContinue: () => void;
    onCloseMain?: () => void; // Para cerrar el modal principal de inspección
    advertenciaCantidadNeumaticos?: number; // Nueva prop para advertencia de cantidad
    onAbrirAsignacion?: () => void; // Nueva prop para abrir modal de asignación
}

const ModalInspeccionAver: React.FC<ModalInspeccionAverProps> = ({
    open,
    ultimaInspeccionFecha,
    esInspeccionHoy,
    onClose,
    onContinue,
    onCloseMain,
    advertenciaCantidadNeumaticos,
    onAbrirAsignacion,
}) => {
    // Centralizar la lógica del botón 'Ir a asignar neumáticos'
    const handleIrAsignacion = () => {
        if (onAbrirAsignacion) onAbrirAsignacion();
    };

    // Si la inspección fue hoy, no cerrar automáticamente, solo mostrar el mensaje
    // useEffect(() => {
    //     if (open && esInspeccionHoy) {
    //         // Mostrar un mensaje breve y cerrar
    //         setTimeout(() => {
    //             onClose();
    //         }, 1500); // Darle tiempo al usuario de ver el mensaje
    //     }
    // }, [open, esInspeccionHoy, onClose]);

    return (
        <Dialog 
            open={open} 
            onClose={() => {}} // Desactivar cierre por clic afuera
            disableEscapeKeyDown // Desactivar cierre con tecla Escape
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    minWidth: 600,
                    maxWidth: 700,
                }
            }}
        >
            <DialogContent sx={{ 
                bgcolor: advertenciaCantidadNeumaticos !== undefined ? '#fff3cd' : (ultimaInspeccionFecha ? '#fff3cd' : undefined), 
                borderRadius: 2, 
                p: 0 
            }}>
                {advertenciaCantidadNeumaticos !== undefined ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', p: 3, pb: 2 }}>
                        <WarningAmberIcon color="warning" sx={{ fontSize: 48, mr: 2, mt: 0.5 }} />
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h5" fontWeight="bold" color="warning.main" sx={{ mb: 1 }}>
                                ADVERTENCIA
                            </Typography>
                            <Typography sx={{ fontWeight: 'bold', fontSize: 16, color: '#222' }}>
                                Faltan {advertenciaCantidadNeumaticos} neumáticos asignados para poder inspeccionar.
                            </Typography>
                        </Box>
                    </Box>
                ) : ultimaInspeccionFecha ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', p: 3, pb: 2 }}>
                        <WarningAmberIcon color="warning" sx={{ fontSize: 48, mr: 2, mt: 0.5 }} />
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h5" fontWeight="bold" color="warning.main" sx={{ mb: 1 }}>
                                {esInspeccionHoy ? 'INSPECCIÓN YA REALIZADA' : 'ADVERTENCIA'}
                            </Typography>
                            <Typography sx={{ fontWeight: 'bold', fontSize: 16, color: '#222' }}>
                                La última inspección fue el {ultimaInspeccionFecha}.
                            </Typography>
                        </Box>
                        <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', height: '100%' }}>
                            <img src="/assets/inpeccion_tire.png" alt="Inspección" style={{ width: 72, height: 72 }} />
                        </Box>
                    </Box>
                ) : (
                    <Box sx={{ p: 3, pb: 2 }}>
                        <Typography>Este vehículo ya tiene inspecciones previas.</Typography>
                    </Box>
                )}
            </DialogContent>
            
            {advertenciaCantidadNeumaticos !== undefined ? (
                <DialogActions sx={{ p: 3, backgroundColor: '#fff3cd', justifyContent: 'flex-end', gap: 2 }}>
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
                            '&:hover': {
                                backgroundColor: '#1976d2',
                                color: '#fff',
                            },
                        }}
                    >
                        Cerrar
                    </Button>
                    {onAbrirAsignacion && (
                        <Button
                            onClick={handleIrAsignacion}
                            variant="contained"
                            size="large"
                            sx={{
                                fontWeight: 'bold',
                                color: '#fff',
                                bgcolor: '#1976d2',
                                borderRadius: 1.5,
                                px: 3,
                                py: 1.2,
                                fontSize: 16,
                                textTransform: 'none',
                                transition: 'background 0.2s',
                                '&:hover': {
                                    bgcolor: '#1565c0',
                                },
                            }}
                        >
                            Ir a asignar neumáticos
                        </Button>
                    )}
                </DialogActions>
            ) : esInspeccionHoy ? (
                <DialogActions sx={{ p: 3, backgroundColor: ultimaInspeccionFecha ? '#fff3cd' : undefined, justifyContent: 'flex-end' }}>
                    <Button
                        onClick={() => {
                            onClose();
                            onCloseMain?.();
                        }}
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
                            '&:hover': {
                                backgroundColor: '#1976d2',
                                color: '#fff',
                            },
                        }}
                    >
                        Cerrar
                    </Button>
                </DialogActions>
            ) : (
                !esInspeccionHoy && (
                    <DialogActions sx={{ 
                        p: 3, 
                        backgroundColor: ultimaInspeccionFecha ? '#fff3cd' : undefined,
                        justifyContent: 'flex-end',
                        gap: 2
                    }}>
                        <Button 
                            onClick={() => {
                                onClose(); // Cerrar modal de advertencia
                                onCloseMain?.(); // Cerrar modal principal de inspección
                            }}
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
                                '&:hover': {
                                    backgroundColor: '#1976d2',
                                    color: '#fff',
                                },
                            }}
                        >
                            Cerrar
                        </Button>
                        <Button 
                            onClick={onContinue} 
                            variant="contained"
                            size="large"
                            sx={{
                                fontWeight: 'bold',
                                color: '#fff',
                                bgcolor: '#1976d2',
                                borderRadius: 1.5, 
                                px: 3,
                                py: 1.2,
                                fontSize: 16,
                                boxShadow: '0 2px 8px #bbdefb',
                                textTransform: 'none',
                                transition: 'background 0.2s',
                                '&:hover': {
                                    bgcolor: '#1565c0',
                                },
                            }}
                        >
                            Registrar nueva inspección
                        </Button>
                    </DialogActions>
                )
            )}
        </Dialog>
    );
};

export default ModalInspeccionAver;
