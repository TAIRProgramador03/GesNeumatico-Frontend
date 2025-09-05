import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';

interface ModalInspeccionObligatoriaProps {
    open: boolean;
    onClose: () => void;
    onRegistrarInspeccion: () => void;
}

const ModalInspeccionObligatoria: React.FC<ModalInspeccionObligatoriaProps> = ({ open, onClose, onRegistrarInspeccion }) => (
    <Dialog
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { borderRadius: 3, minWidth: 600, maxWidth: 700 } }}
    >
        <DialogContent sx={{ bgcolor: '#eaf6fb', borderRadius: 2, p: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', p: 3, pb: 2 }}>
                <FactCheckIcon color="primary" sx={{ fontSize: 48, mr: 2, mt: 0.5 }} />
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" fontWeight="bold" color="primary" sx={{ mb: 1 }}>
                        INSPECCIÓN OBLIGATORIA
                    </Typography>
                    <Typography sx={{ fontWeight: 'bold', fontSize: 16, color: '#222', mb: 1 }}>
                        Este vehículo nunca ha sido inspeccionado. Debe realizar una inspección antes de reubicar.
                    </Typography>
                    <Typography sx={{ fontSize: 15, color: '#1976d2', mb: 1 }}>
                        Acción: Reubicar neumático
                    </Typography>
                </Box>
                <img
                    src="/assets/inspeccionVehiculo.png"
                    alt="Inspección Vehículo"
                    style={{ width: 70, height: 70, marginLeft: 16, marginTop: 4, borderRadius: 8 }}
                />
            </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, backgroundColor: '#eaf6fb', justifyContent: 'flex-end', gap: 2 }}>
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
        </DialogActions>
    </Dialog>
);

export default ModalInspeccionObligatoria;
