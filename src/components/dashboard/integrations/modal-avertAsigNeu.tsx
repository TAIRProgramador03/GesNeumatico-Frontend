import React from 'react';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Button,
    Box,
} from '@mui/material';
import { asignarNeumatico } from "@/api/Neumaticos";


interface ModalAvertAsigNeuProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    message: string;
}

const ModalAvertAsigNeu: React.FC<ModalAvertAsigNeuProps> = ({ open, onClose, onConfirm, message }) => {
    const confirmRef = React.useRef<HTMLButtonElement | null>(null);

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            document.body.focus(); 
        }, 0);
    };
    
    React.useEffect(() => {
        if (open) {
            setTimeout(() => {
                confirmRef.current?.focus();
            }, 0);
        }
    }, [open]);
    return (
        <Dialog
            open={open}
            onClose={handleClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title" sx={{ textAlign: 'center' }}>
                {/* Imagen personalizada */}
                <img
                    src="/assets/quitarNeumatico.png"
                    alt="Quitar Neumático"
                    style={{ width: 100, height: 100 }}
                />

                <Box sx={{ mt: 1, fontWeight: 'bold', fontSize: '1.2rem' }}>Confirmación</Box>
            </DialogTitle>
            <DialogContent>
                <DialogContentText
                    id="alert-dialog-description"
                    sx={{ textAlign: 'center', color: 'black', fontWeight: 'bold', fontSize: '1rem' }}
                >
                    {message}
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center' }}>
                <Button onClick={onClose} variant="outlined" color="secondary">
                    Cancelar
                </Button>
                <Button onClick={onConfirm} variant="contained" color="error" ref={confirmRef}>
                    Confirmar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ModalAvertAsigNeu;