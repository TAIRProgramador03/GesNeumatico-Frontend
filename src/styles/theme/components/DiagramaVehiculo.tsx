import * as React from 'react';
import Box from '@mui/material/Box';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import ModalMantenimientoNeu from '../../../components/dashboard/integrations/modal-mantenimientoNeu';
import ModalInpeccionNeu from '../../../components/dashboard/integrations/modal-inspeccionNeu';
import { useEffect, useState } from 'react';
import { obtenerUltimosMovimientosPorCodigo } from '../../../api/Neumaticos';
import { calcularKmRecorrido, MovimientoNeumatico } from './calculoKmRecorrido';
import axios from 'axios';

interface Neumatico {
    POSICION: string;
    CODIGO_NEU?: string;
    CODIGO?: string;
    POSICION_NEU?: string;
    ESTADO?: string | number;
    ID_MOVIMIENTO?: number | string;
    TIPO_MOVIMIENTO?: string;
    PRESION_AIRE?: string | number;
    KM_ULTIMA_INSPECCION?: string | number;
    KM_ASIGNACION?: string | number;
}

interface DiagramaVehiculoProps {
    neumaticosAsignados: Neumatico[];
    layout?: 'dashboard' | 'modal';
    tipoModal?: 'inspeccion' | 'mantenimiento'; // NUEVO: para distinguir el modal
    editable?: boolean; // <-- Agregado para permitir la prop editable
    onDragEnd?: (event: any) => void; // <-- Agregado para permitir la prop onDragEnd
}

// Layouts diferenciados para dashboard, modalInspeccion y modalMantenimiento
const posiciones = {
    dashboard: [
        { key: 'POS01', top: '38px', left: '333px' },
        { key: 'POS02', top: '38px', left: '228px' },
        { key: 'POS03', top: '211px', left: '333px' },
        { key: 'POS04', top: '211px', left: '228px' },
        { key: 'RES01', top: '284px', left: '264px' },
    ],
    modalInspeccion: [
        { key: 'POS01', top: '124px', left: '145px' },
        { key: 'POS02', top: '124px', left: '45px' },
        { key: 'POS03', top: '288px', left: '145px' },
        { key: 'POS04', top: '288px', left: '45px' },
        { key: 'RES01', top: '359px', left: '79px' },
    ],
    modalMantenimiento: [
        { key: 'POS01', top: '115px', left: '268px' },
        { key: 'POS02', top: '115px', left: '168px' },
        { key: 'POS03', top: '279px', left: '268px' },
        { key: 'POS04', top: '279px', left: '168px' },
        { key: 'RES01', top: '348px', left: '202px' },
    ],
};

const DiagramaVehiculo: React.FC<DiagramaVehiculoProps & {
    onPosicionClick?: (neumatico: Neumatico | undefined) => void;
    onMantenimientoClick?: () => void;
    onRotarClick?: () => void;
    onDesasignarClick?: () => void;
    fromMantenimientoModal?: boolean;
    placa?: string;
}> = ({ neumaticosAsignados = [], layout = 'dashboard', tipoModal, onPosicionClick, onRotarClick, onDesasignarClick, fromMantenimientoModal, placa, ...props }) => {
    // Selección de layout según tipoModal
    let pos;
    if (layout === 'modal') {
        if (tipoModal === 'mantenimiento') {
            pos = posiciones.modalMantenimiento;
        } else {
            pos = posiciones.modalInspeccion;
        }
    } else {
        pos = posiciones.dashboard;
    }
    const neumaticosFiltrados = React.useMemo(() => {
        // 1. Filtrar por posición: el movimiento más reciente por posición
        const porPosicion = new Map<string, Neumatico>();
        for (const n of neumaticosAsignados) {
            // Excluir BAJA DEFINITIVA y RECUPERADO
            if (n.TIPO_MOVIMIENTO === 'BAJA DEFINITIVA' || n.TIPO_MOVIMIENTO === 'RECUPERADO') continue;
            const pos = n.POSICION;
            if (!pos) continue;
            if (!porPosicion.has(pos) || ((n.ID_MOVIMIENTO || 0) > (porPosicion.get(pos)?.ID_MOVIMIENTO || 0))) {
                porPosicion.set(pos, n);
            }
        }
        // 2. Filtrar por código: solo dejar el movimiento más reciente por código
        const porCodigo = new Map<string, Neumatico>();
        for (const n of porPosicion.values()) {
            const codigo = n.CODIGO_NEU || n.CODIGO;
            if (!codigo) continue;
            if (!porCodigo.has(codigo) || ((n.ID_MOVIMIENTO || 0) > (porCodigo.get(codigo)?.ID_MOVIMIENTO || 0))) {
                porCodigo.set(codigo, n);
            }
        }
        return Array.from(porCodigo.values());
    }, [neumaticosAsignados]);
    // Handler para click en rotar: ahora busca la última inspección por placa y loguea
    const handleRotarClick = async () => {
        if (onRotarClick) {
            if (placa) {
                console.log('[DiagramaVehiculo] Click en REUBICAR para placa:', placa);
            }
            // Log extra para saber si hay neumáticos filtrados
            console.log('[DiagramaVehiculo] Neumáticos filtrados:', neumaticosFiltrados);
            onRotarClick();
        }
    };
    // Handler para click en desasignar: igual, delega y la lógica real está en el modal
    const handleDesasignarClick = async () => {
        if (onDesasignarClick) {
            if (placa) {
                console.log('[DiagramaVehiculo] Click en DESASIGNAR para placa:', placa);
            }
            console.log('[DiagramaVehiculo] Neumaticos filtrados:', neumaticosFiltrados);
            onDesasignarClick();
        }
    };
    // --- INICIO INTEGRACIÓN MODALES ---
    const [openMantenimiento, setOpenMantenimiento] = React.useState(false);
    const [openInspeccion, setOpenInspeccion] = React.useState(false);

    // Definir placa y neumaticosAsignados para los modales
    // Usar solo la prop 'placa' (no buscar en los neumáticos)
    const placaModal = placa || '';
    // Usar el array original de neumáticos asignados, asegurando que CODIGO nunca sea undefined
    const neumaticosAsignadosModal = neumaticosAsignados.map(n => ({
        ...n,
        CODIGO: n.CODIGO ?? '', // Forzar string
    }));

    // Puedes ajustar cuándo abrir cada modal según tu lógica
    // Por ejemplo, podrías abrir el modal de mantenimiento con un botón o acción específica
    // Aquí solo se muestra la integración básica

    return (
        <>
            {/* Renderizado del diagrama */}
            <Box
                sx={
                    layout === 'dashboard'
                        ? { position: 'relative', width: '262px', height: '365px' }
                        : { position: 'relative', width: '370px', height: '430px' }
                }
            >
                {/* Imagen base diferente según tipoModal */}
                <img
                    src={
                        tipoModal === 'mantenimiento'
                            ? '/assets/car-diagram.png'
                            : '/assets/car-diagram.png'
                    }
                    alt="Base"
                    style={
                        layout === 'dashboard'
                            ? {
                                width: '468px',
                                height: '400px',
                                objectFit: 'contain',
                                position: 'absolute',
                                top: '-30px',
                                left: '60px',
                                zIndex: 1,
                                pointerEvents: 'none',
                            }
                            : tipoModal === 'mantenimiento'
                                ? {
                                    width: '260px',
                                    height: '380px',
                                    objectFit: 'contain',
                                    position: 'absolute',
                                    top: '50px',
                                    left: '100px',
                                    zIndex: 1,
                                    pointerEvents: 'none',
                                }
                                : {
                                    width: '250px',
                                    height: '380px',
                                    objectFit: 'contain',
                                    position: 'absolute',
                                    top: '60px',
                                    left: '-17px',
                                    zIndex: 1,
                                    pointerEvents: 'none',
                                }
                    }
                />
                {/* Acciones rápidas solo en modal de mantenimiento */}
                {tipoModal === 'mantenimiento' && layout === 'modal' && fromMantenimientoModal && (
                    <>
                        <img src="/assets/rotar.png" alt="Reubicar" title="Reubicar" style={{ position: 'absolute', top: '280px', left: '5px', width: '60px', height: '50px', zIndex: 2, objectFit: 'contain', cursor: 'pointer' }} onClick={handleRotarClick} />
                        <img src="/assets/desasignar.png" alt="Desasignar" title="Desasignar" style={{ position: 'absolute', top: '340px', left: '5px', width: '60px', height: '50px', zIndex: 2, objectFit: 'contain', cursor: 'pointer' }} onClick={handleDesasignarClick} />
                    </>
                )}
                {pos.map(({ key, top, left }) => (
                    <PosicionNeumatico
                        key={key}
                        keyPos={key}
                        top={top}
                        left={left}
                        neumatico={neumaticosFiltrados.find(n => n.POSICION === key)}
                        layout={layout}
                        tipoModal={tipoModal}
                        onPosicionClick={onPosicionClick}
                    />
                ))}
            </Box>
            {/* Modales integrados */}
            <ModalMantenimientoNeu
                open={openMantenimiento}
                onClose={() => setOpenMantenimiento(false)}
                placa={placaModal}
                neumaticosAsignados={neumaticosAsignadosModal}
                // ...otros props necesarios...
                onAbrirInspeccion={() => setOpenInspeccion(true)}
            />
            <ModalInpeccionNeu
                open={openInspeccion}
                onClose={() => setOpenInspeccion(false)}
                placa={placaModal}
                neumaticosAsignados={neumaticosAsignadosModal}
            // ...otros props necesarios...
            />
        </>
    );
};

// Nuevo componente hijo para cada posición
const PosicionNeumatico: React.FC<{
    keyPos: string;
    top: string;
    left: string;
    neumatico: Neumatico | undefined;
    layout: 'dashboard' | 'modal';
    tipoModal?: 'inspeccion' | 'mantenimiento';
    onPosicionClick?: (neumatico: Neumatico | undefined) => void;
}> = ({ keyPos, top, left, neumatico, layout, tipoModal, onPosicionClick }) => {
    // Drop target para cada posición
    const { setNodeRef: setDropRef, isOver } = useDroppable({ id: keyPos });
    // Siempre ejecuta el hook, pero solo activa el draggable si hay neumático
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: neumatico ? (neumatico.CODIGO_NEU || neumatico.CODIGO || neumatico.POSICION) : keyPos,
        disabled: !neumatico,
        data: neumatico ? { ...neumatico, from: keyPos } : undefined,
    });
    // Determinar color según el estado
    let estado = undefined;
    if (neumatico && neumatico.ESTADO !== undefined && neumatico.ESTADO !== null && neumatico.ESTADO !== '') {
        estado = typeof neumatico.ESTADO === 'string' ? parseInt(neumatico.ESTADO.replace('%', ''), 10) : neumatico.ESTADO;
    }
    let bgColor = 'transparent';
    if (estado !== undefined && !isNaN(estado)) {
        if (estado < 39) bgColor = '#d32f2f';
        else if (estado < 79) bgColor = '#FFEB3B';
        else bgColor = '#2e7d32';
    } else if (neumatico) {
        bgColor = 'lightgreen';
    }
    // Forzar log en el pointerDown del área de drag
    const handlePointerDown = (e: React.PointerEvent) => {
        if (neumatico) {
            console.log('[DiagramaVehiculo] pointerDown en neumático', {
                id: neumatico.CODIGO_NEU || neumatico.CODIGO || neumatico.POSICION,
                e
            });
        }
        if (listeners && listeners.onPointerDown) {
            listeners.onPointerDown(e);
        }
    };
    // Unir refs de draggable y droppable
    const combinedRef = (node: HTMLDivElement | null) => {
        setNodeRef(node);
        setDropRef(node);
    };
    // Estado para km recorrido
    const [kmRecorrido, setKmRecorrido] = useState<string>('—');
    // Refrescar kmRecorrido cuando cambien los datos del neumático (props)
    useEffect(() => {
        fetchKm();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [neumatico?.CODIGO, neumatico?.CODIGO_NEU]);
    useEffect(() => {
        fetchKm();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(neumatico)]);
    useEffect(() => {
        const refrescarKm = () => {
            fetchKm();
        };
        window.addEventListener('actualizar-diagrama-vehiculo', refrescarKm);
        return () => {
            window.removeEventListener('actualizar-diagrama-vehiculo', refrescarKm);
        };
    }, [neumatico?.CODIGO, neumatico?.CODIGO_NEU]);
    // Nueva función para obtener el historial y calcular km recorrido
    const fetchKm = React.useCallback(async () => {
        if (!neumatico) {
            setKmRecorrido('—');
            return;
        }
        const codigo = neumatico.CODIGO || neumatico.CODIGO_NEU;
        if (!codigo) {
            setKmRecorrido('—');
            return;
        }
        try {
            // Usar el endpoint correcto para historial completo
            const { obtenerHistorialMovimientosPorCodigo } = await import('../../../api/Neumaticos');
            const historial = await obtenerHistorialMovimientosPorCodigo(codigo);
            if (!Array.isArray(historial) || historial.length === 0) {
                setKmRecorrido('—');
                return;
            }
            // Log de depuración para ver los datos reales
            //console.log('[DEBUG calculoKmRecorrido] keyPos:', keyPos);
            //console.log('[DEBUG calculoKmRecorrido] historial:', historial);
            // Usar la función centralizada para calcular el km recorrido acumulado
            const kmTotal = calcularKmRecorrido(historial as MovimientoNeumatico[], keyPos);
            //console.log('[DEBUG calculoKmRecorrido] resultado kmTotal:', kmTotal);
            setKmRecorrido(kmTotal > 0 ? kmTotal.toLocaleString() + ' km' : '0 km');
        } catch (e: any) {
            setKmRecorrido('—');
        }
    }, [neumatico]);
    // Estilos personalizados para REPUESTO
    const isReserva = keyPos === 'RES01';
    const boxStyles = isReserva
        ? {
            position: 'absolute',
            top,
            left,
            zIndex: 2,
            width: '60px', 
            height: '29px',
            borderRadius: '6px',
            backgroundColor: isOver ? '#e0f7fa' : bgColor,
            border: isOver ? '2px solid #388e3c' : '2px solid #888',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: '#222',
            fontSize: 18,
            cursor: neumatico ? 'grab' : 'pointer',
            transition: 'box-shadow 0.2s, background 0.2s, border 0.2s',
            boxShadow: neumatico && isDragging ? '0 0 16px 4px #388e3c' : neumatico ? '0 0 8px 2px #4caf50' : 'none',
            opacity: neumatico && isDragging ? 0.5 : 1,
            userSelect: 'none',
            outline: neumatico && isDragging ? '2px solid #388e3c' : 'none',
        }
        : {
            position: 'absolute',
            top,
            left,
            zIndex: 2,
            width: layout === 'modal' ? '25px' : '26px',
            height: layout === 'modal' ? '58px' : '61px',
            borderRadius: '15px',
            backgroundColor: isOver ? '#e0f7fa' : bgColor,
            border: isOver ? '2px solid #388e3c' : '2px solid #888',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: '#222',
            fontSize: 18,
            cursor: neumatico ? 'grab' : 'pointer',
            transition: 'box-shadow 0.2s, background 0.2s, border 0.2s',
            boxShadow: neumatico && isDragging ? '0 0 16px 4px #388e3c' : neumatico ? '0 0 8px 2px #4caf50' : 'none',
            opacity: neumatico && isDragging ? 0.5 : 1,
            userSelect: 'none',
            outline: neumatico && isDragging ? '2px solid #388e3c' : 'none',
        };
    return (
        <>
            <Box
                ref={combinedRef}
                key={keyPos}
                aria-label={neumatico ? `Arrastrar neumático ${neumatico.CODIGO_NEU || neumatico.CODIGO}` : undefined}
                {...attributes}
                onPointerDown={neumatico ? handlePointerDown : undefined}
                sx={boxStyles}
                onClick={() => onPosicionClick && onPosicionClick(neumatico ? { ...neumatico, POSICION: keyPos } : undefined)}
                title={keyPos + (neumatico ? ` - ${neumatico.CODIGO_NEU || neumatico.CODIGO || ''}` : '')}
            >
                <span style={{ fontWeight: 'bold', fontSize: isReserva ? '15px' : '13px', color: '#333', pointerEvents: 'none' }}>
                    {isReserva ? 'RES' : keyPos.replace('POS', '')}
                </span>
            </Box>
            {/* Mostrar presión de aire en dashboard y en modal de mantenimiento */}
            {(layout === 'dashboard' || (layout === 'modal' && tipoModal === 'mantenimiento')) && neumatico && neumatico.PRESION_AIRE !== undefined && neumatico.PRESION_AIRE !== null && neumatico.PRESION_AIRE !== '' && (
                keyPos === 'RES01' ? (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: `calc(${top} + 30px)`,
                            left: `calc(${left} + -13px)`,
                            zIndex: 3,
                            background: 'rgba(255,255,255,0.95)',
                            borderRadius: '6px',
                            padding: '2px 10px',
                            fontSize: '13px',
                            color: '#1976d2',
                            fontWeight: 600,
                            boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                            pointerEvents: 'none',
                            minWidth: '85px',
                            textAlign: 'center',
                            border: '1px solid #e0e0e0',
                        }}
                    >
                        {` ${neumatico.PRESION_AIRE} psi`}
                    </Box>
                ) : (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: `calc(${top} + 5px)`,
                            left:
                                keyPos === 'POS01' || keyPos === 'POS03'
                                    ? `calc(${left} + 30px)` // Derecha para POS01 y POS03
                                    : `calc(${left} - 90px)`, // Izquierda para POS02 y POS04
                            zIndex: 3,
                            background: 'rgba(255,255,255,0.95)',
                            borderRadius: '6px',
                            padding: '2px 10px',
                            fontSize: '13px',
                            color: '#1976d2',
                            fontWeight: 600,
                            boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                            pointerEvents: 'none',
                            minWidth: '85px',
                            textAlign: 'center',
                            border: '1px solid #e0e0e0',
                        }}
                    >
                        {` ${neumatico.PRESION_AIRE} psi`}
                    </Box>
                )
            )}
            {layout === 'dashboard' && (
                <>
                    {/* Cuadro para POS01, POS02, POS03, POS04 */}
                    {(keyPos === 'POS01' || keyPos === 'POS02' || keyPos === 'POS03' || keyPos === 'POS04') && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: keyPos === 'POS01' ? '75px'
                                    : keyPos === 'POS02' ? '75px'
                                        : keyPos === 'POS03' ? '250px'
                                            : '250px',
                                left: keyPos === 'POS01' || keyPos === 'POS03' ? '385px' : '1px',
                                width: '200px',
                                minHeight: '90px',
                                border: '1px solid #8888882e',
                                borderRadius: '20px',
                                background: '#fff',
                                color: '#d32f2f',
                                fontWeight: 500,
                                fontSize: '14px',
                                padding: '10px 12px',
                                zIndex: 4,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-start',
                                alignItems: 'flex-start',
                                pointerEvents: 'none',
                            }}
                        >
                            <span style={{ color: '#d32f2f', fontWeight: 500 }}>
                                {keyPos}: {neumatico ? (neumatico.CODIGO_NEU || neumatico.CODIGO) : '—'}
                            </span>
                            <span style={{ color: '#222', fontWeight: 500, marginTop: 4 }}>
                                Km recorrido: {kmRecorrido}
                            </span>
                        </Box>
                    )}
                    {/* Cuadro para REPUESTO */}
                    {keyPos === 'RES01' && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: '340px', 
                                left: '195px', 
                                width: '190px',
                                minHeight: '90px',
                                border: '1px solid #8888882e',
                                borderRadius: '20px',
                                background: '#fff',
                                color: '#d32f2f',
                                fontWeight: 500,
                                fontSize: '14px',
                                padding: '10px 12px',
                                zIndex: 4,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-start',
                                alignItems: 'flex-start',
                                pointerEvents: 'none',
                            }}
                        >
                            <span style={{ color: '#d32f2f', fontWeight: 500 }}>
                                {keyPos}: {neumatico ? (neumatico.CODIGO_NEU || neumatico.CODIGO) : '—'}
                            </span>
                            <span style={{ color: '#222', fontWeight: 500, marginTop: 4 }}>
                                Km recorrido: {kmRecorrido}
                            </span>
                        </Box>
                    )}
                </>
            )}
        </>
    );
};

export default DiagramaVehiculo;
