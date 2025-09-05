"use client";

import * as React from 'react';
import Card from '@mui/material/Card';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import ModalTodasPlacas from './modal-todasPlacas';

interface CompaniesFiltersProps {
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  projectName: string;
  operationName?: string;
  autosDisponiblesCount?: number;
  onVehiculoSeleccionado?: (vehiculo: any) => void;
}

export function CompaniesFilters({
  onSearchChange,
  projectName,
  operationName,
  autosDisponiblesCount,
  onVehiculoSeleccionado,
}: CompaniesFiltersProps): React.JSX.Element {
  const [openModal, setOpenModal] = React.useState(false);
  const [checkboxChecked, setCheckboxChecked] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [placaSeleccionada, setPlacaSeleccionada] = React.useState('');

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setCheckboxChecked(checked);
    if (checked) {
      setOpenModal(true);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setCheckboxChecked(false); // Desactivar el checkbox al cerrar el modal
    setInputValue(''); // Limpiar el input al cerrar el modal
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    setPlacaSeleccionada(''); // Limpiar placa seleccionada si escribe
    onSearchChange(event);
    if (event.target.value.trim() !== '') {
      setCheckboxChecked(false);
    }
  };

  const handleVehiculoSeleccionado = (vehiculo: any) => {
    // Solo dispara la consulta si la placa es diferente a la actual
    if ((vehiculo?.PLACA || '').toUpperCase() !== inputValue.toUpperCase()) {
      if (onVehiculoSeleccionado) onVehiculoSeleccionado(vehiculo);
    }
    setOpenModal(false);
    setCheckboxChecked(false);
    setInputValue(vehiculo?.PLACA || '');
    setPlacaSeleccionada(vehiculo?.PLACA || '');
  };

  return (
    <Card sx={{ p: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        {/* Input de búsqueda */}
        <OutlinedInput
          onChange={handleInputChange}
          value={inputValue}
          fullWidth
          placeholder="Buscar por Placa"
          startAdornment={
            <InputAdornment position="start">
              <MagnifyingGlassIcon fontSize="var(--icon-fontSize-md)" />
            </InputAdornment>
          }
          sx={{ maxWidth: '400px' }}
          disabled={checkboxChecked}
        />
        <FormControlLabel
          control={<Checkbox onChange={handleCheckboxChange} checked={checkboxChecked} disabled={inputValue.trim() !== ''} />}
          label="Transito"
        />
        <Box
          component="img"
          src="/assets/proyecto.png"
          alt="Proyecto"
          sx={{
            width: 70,
            height: 70,
          }}
        />
        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
          {projectName}
        </Typography>
        <Box
          component="img"
          src="/assets/operacion.png"
          alt="Operación"
          sx={{
            width: 70,
            height: 70,
          }}
        />
        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
          {operationName}
        </Typography>
        <Box
          component="img"
          src="/assets/vehiculo.png"
          alt="Vehículo"
          sx={{
            width: 100,
            height: 100,
          }}
        />

        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
          {autosDisponiblesCount} VEHICULOS DISPONIBLES
        </Typography>
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <Box
              component="img"
              src="/assets/placa.png"
              alt="Placa"
              sx={{
                width: 170,
                height: 70,
                ml: 1,
                display: 'block',
              }}
            />
            {(inputValue.trim() !== '' || placaSeleccionada) && (
              <Typography
                variant="h6"
                sx={{
                  position: 'absolute',
                  top: '55%',
                  left: '52%',
                  transform: 'translate(-50%, -50%)',
                  color: 'black',
                  fontWeight: 'bold',
                  fontSize: 33,
                  textShadow: '0 2px 8px #fff, 0 1px 0 #fff',
                  fontFamily: 'Arial, sans-serif',  
                  pointerEvents: 'none',
                  width: '100%',
                  textAlign: 'center',
                  letterSpacing: 2,
                }}
              >
                {(inputValue.trim() || placaSeleccionada).toUpperCase()}
              </Typography>
            )}
          </Box>
      </Stack>
      {/* Modal para todas las placas */}
      <ModalTodasPlacas open={openModal} onClose={handleCloseModal} onVehiculoSeleccionado={handleVehiculoSeleccionado} />

    </Card>
  );
}

export default CompaniesFilters;
