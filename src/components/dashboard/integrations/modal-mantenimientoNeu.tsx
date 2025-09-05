import * as React from 'react';
import { useState } from 'react';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import DialogContentText from '@mui/material/DialogContentText';
import { useUser } from '@/hooks/use-user';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
// import ModalMantenimientoAver from '@/components/core/modal-mantenimientoAver';

import { obtenerUltimosMovimientosPorCodigo, registrarReubicacionNeumatico, registrarDesasignacionNeumatico, obtenerUltimosMovimientosPorPlaca, getUltimaFechaInspeccionPorPlaca } from '../../../api/Neumaticos';
import DiagramaVehiculo from '../../../styles/theme/components/DiagramaVehiculo';

// Ampliar la interfaz para evitar errores de propiedades
interface Neumatico {
    POSICION: string;
    CODIGO_NEU?: string;
    CODIGO?: string;
    POSICION_NEU?: string;
    ESTADO?: string | number;
    ID_MOVIMIENTO?: number | string;
    TIPO_MOVIMIENTO?: string;
    MARCA?: string;
    MEDIDA?: string;
    DISEÑO?: string;
    REMANENTE?: string | number;
}

interface Vehiculo {
    placa: string;
    marca: string;
    modelo: string;
    anio: string;
    color?: string;
    proyecto?: string;
    operacion?: string;
    kilometro?: number;
}

interface ModalInpeccionNeuProps {
    open: boolean;
    onClose: () => void;
    placa: string;
    neumaticosAsignados: Neumatico[];
    vehiculo?: Vehiculo;
    onSeleccionarNeumatico?: (neumatico: any) => void; // NUEVO
}

const ModalInpeccionNeu: React.FC<ModalInpeccionNeuProps & { onAbrirInspeccion?: () => void }> = ({
    open,
    onClose,
    placa,
    neumaticosAsignados,
    vehiculo,
    onSeleccionarNeumatico,
    onAbrirInspeccion,
}) => {
    const { user } = useUser();
    const [neumaticoSeleccionado, setNeumaticoSeleccionado] = useState<any | null>(null);
    const [formValues, setFormValues] = useState({
        kilometro: '',
        marca: '',
        modelo: '',
        codigo: '',
        posicion: '',
        medida: '',
        diseño: '',
        remanente: '',
        presion_aire: '',
        torque: '',
        tipo_movimiento: '',
        estado: '',
        observacion: '',
        fecha_inspeccion: '',
        accion: '', // <-- Añadido para el select de acción
    });

    // Estado local para los neumáticos asignados (para poder actualizar al hacer drop)
    const [neumaticosAsignadosState, setNeumaticosAsignadosState] = useState<Neumatico[]>(neumaticosAsignados);

    // Estado para la acción seleccionada (REUBICADO o DESASIGNAR)
    const [accion, setAccion] = useState<'REUBICADO' | 'DESASIGNAR' | null>(null);

    // Estado para guardar la posición original antes del drop
    const [posicionOriginal, setPosicionOriginal] = useState<string | null>(null);
    // Guardar el código del neumático que está siendo reubicado para controlar la posición original
    const [codigoOriginal, setCodigoOriginal] = useState<string | null>(null);

    // Estado para guardar info del swap
    const [swapInfo, setSwapInfo] = useState<null | { codigo: string; posicionOriginal: string; posicionNueva: string }>(null);

    // Estado para guardar el mapeo inicial de posición a neumático
    const [initialAssignedMap, setInitialAssignedMap] = useState<Record<string, any>>({});

    // Estado para guardar la última posición antes de desasignar
    const [ultimaPosicionDesasignada, setUltimaPosicionDesasignada] = useState<string | null>(null);

    // Snackbar personalizado para feedback visual
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMsg, setSnackbarMsg] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

    // Estado para la fecha de la última inspección
    const [fechaUltimaInspeccion, setFechaUltimaInspeccion] = useState<string>('');

    // Estado para controlar redirección a inspección
    const [redirigirAInspeccion, setRedirigirAInspeccion] = useState(false);

    // Estado para el modal de advertencia centralizado
    const [modalAdvertencia, setModalAdvertencia] = useState({
        open: false,
        tipoAccion: null as 'REUBICADO' | 'DESASIGNAR' | null,
        ultimaInspeccionFecha: '',
        diasDiferencia: 0,
        onContinuar: () => { },
        onNuevaInspeccion: () => { },
    });

    // Estado para bloquear reubicación por inspección
    const [bloqueoReubicacionPorInspeccion, setBloqueoReubicacionPorInspeccion] = useState(false);

    // Función robusta para detectar si ya hubo reubicación con la última inspección
    const verificarBloqueoReubicacion = React.useCallback(async (placa: string, fechaInspeccion: string) => {
        if (!placa || !fechaInspeccion) {
            setBloqueoReubicacionPorInspeccion(false);
            return;
        }
        try {
            const { obtenerUltimosMovimientosPorPlaca } = await import('../../../api/Neumaticos');
            const movimientos = await obtenerUltimosMovimientosPorPlaca(placa);
            // Comparar solo la parte de la fecha (YYYY-MM-DD)
            const fechaSolo = fechaInspeccion.slice(0, 10);
            const existe = movimientos?.some((m: any) =>
                m.TIPO_MOVIMIENTO === 'REUBICADO' &&
                (
                    m.FECHA_MOVIMIENTO?.slice(0, 10) === fechaSolo ||
                    m.FECHA_REGISTRO?.slice(0, 10) === fechaSolo
                )
            );
            setBloqueoReubicacionPorInspeccion(!!existe);
        } catch (e) {
            setBloqueoReubicacionPorInspeccion(false);
        }
    }, []);

    // Actualizar bloqueo cada vez que cambie la placa o la fecha de inspección
    React.useEffect(() => {
        if (placa && fechaUltimaInspeccion) {
            verificarBloqueoReubicacion(placa, fechaUltimaInspeccion);
        } else {
            setBloqueoReubicacionPorInspeccion(false);
        }
    }, [placa, fechaUltimaInspeccion, verificarBloqueoReubicacion]);

    // Actualizar el estado local y el mapa inicial si cambian los props
    React.useEffect(() => {
        setNeumaticosAsignadosState(neumaticosAsignados);
        // Mapear posición => neumático (solo los que tienen posición)
        const map: Record<string, any> = {};
        neumaticosAsignados.forEach(n => {
            if (n.POSICION) map[n.POSICION] = n;
        });
        setInitialAssignedMap(map);
    }, [neumaticosAsignados]);

    // Helper centralizado para obtener y setear la última inspección por placa
    const obtenerYSetearUltimaInspeccionPorPlaca = async (placa: string): Promise<string> => {
        console.log('[obtenerYSetearUltimaInspeccionPorPlaca] INICIO, placa:', placa);
        try {
            const { getUltimaFechaInspeccionPorPlaca } = await import('../../../api/Neumaticos');
            const ultima = await getUltimaFechaInspeccionPorPlaca(placa);
            setFechaUltimaInspeccion(ultima || '');
            console.log('[obtenerYSetearUltimaInspeccionPorPlaca] FECHA OBTENIDA:', ultima);
            return ultima || '';
        } catch (e) {
            console.error('[obtenerYSetearUltimaInspeccionPorPlaca] ERROR:', e);
            setFechaUltimaInspeccion('');
            return '';
        }
    };

    // Cuando se selecciona un neumático, obtener la última inspección de la PLACA y setear la fecha
    const handleSeleccionarNeumatico = async (neumatico: any) => {
        setNeumaticoSeleccionado(neumatico);
        if ((neumatico.CODIGO_NEU || neumatico.CODIGO) !== codigoOriginal) {
            setPosicionOriginal(null);
            setCodigoOriginal(null);
        }
        let ultimoKilometro = vehiculo?.kilometro?.toString() ?? '';
        let pr = '', carga = '', velocidad = '', fecha_fabricacion = '', rq = '', oc = '', remanente = '';
        let costo = '', proveedor = '', fecha_compra = '', presion_aire = '', torque_aplicado = '', estado = '';
        // --- CAMBIO: obtener y setear la última inspección por placa ---
        await obtenerYSetearUltimaInspeccionPorPlaca(placa);
        try {
            const mov = await obtenerUltimosMovimientosPorPlaca(placa);
            if (mov && mov.length > 0) {
                // Buscar el movimiento más reciente de este neumático para los datos adicionales
                const codigoBuscar = neumatico.CODIGO_NEU || neumatico.CODIGO;
                const movimientosDeNeumatico = mov.filter((m: any) => (m.CODIGO_NEU || m.CODIGO) === codigoBuscar || m.CODIGO === codigoBuscar);
                const m = movimientosDeNeumatico[0];
                if (m) {
                    if (m.KILOMETRO !== undefined && m.KILOMETRO !== null) {
                        ultimoKilometro = m.KILOMETRO.toString();
                    }
                    pr = m.PR || '';
                    carga = m.CARGA || '';
                    velocidad = m.VELOCIDAD || '';
                    fecha_fabricacion = m.FECHA_FABRICACION || '';
                    rq = m.RQ || '';
                    oc = m.OC || '';
                    remanente = m.REMANENTE?.toString() || '';
                    costo = m.COSTO || '';
                    proveedor = m.PROVEEDOR || '';
                    fecha_compra = m.FECHA_COMPRA || '';
                    presion_aire = m.PRESION_AIRE?.toString() || '';
                    torque_aplicado = m.TORQUE_APLICADO?.toString() || '';
                    estado = m.ESTADO || '';
                }
            } else {
                setFechaUltimaInspeccion('');
            }
        } catch (e) {
            setFechaUltimaInspeccion('');
        }
        setFormValues({
            kilometro: ultimoKilometro,
            marca: neumatico.MARCA ?? '',
            modelo: neumatico.MODELO ?? '',
            codigo: neumatico.CODIGO_NEU ?? neumatico.CODIGO ?? '',
            posicion: neumatico.POSICION ?? '',
            medida: neumatico.MEDIDA ?? '',
            diseño: neumatico.DISEÑO ?? '',
            remanente: remanente,
            presion_aire: presion_aire,
            torque: torque_aplicado,
            tipo_movimiento: '',
            estado: estado,
            fecha_inspeccion: new Date().toISOString().slice(0, 16),
            observacion: '',
            accion: '',
        });
        setNeumaticoSeleccionado((prev: any) => ({
            ...prev,
            PR: pr,
            CARGA: carga,
            VELOCIDAD: velocidad,
            FECHA_FABRICACION: fecha_fabricacion,
            RQ: rq,
            OC: oc,
            COSTO: costo,
            PROVEEDOR: proveedor,
            FECHA_COMPRA: fecha_compra,
            PRESION_AIRE: presion_aire,
            TORQUE_APLICADO: torque_aplicado,
            ESTADO: estado,
            KILOMETRO: ultimoKilometro,
            REMANENTE: remanente,
        }));
        if (onSeleccionarNeumatico) onSeleccionarNeumatico(neumatico);
    };

    // Manejar cambios en los inputs
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    // Lógica para actualizar la posición del neumático al hacer drop
    const handleDropNeumatico = (neumatico: Neumatico, nuevaPosicion: string) => {
        const codigo = neumatico.CODIGO_NEU || neumatico.CODIGO;
        // Buscar si la posición destino está ocupada por otro neumático
        const neumaticoDestino = neumaticosAsignadosState.find(n => n.POSICION === nuevaPosicion);
        // Eliminar todos los duplicados de ese código (excepto el que se está moviendo y el swap)
        let nuevosNeumaticos = neumaticosAsignadosState.filter(n => (n.CODIGO_NEU || n.CODIGO) !== codigo);
        // Si hay swap, mantener el destino pero con la posición intercambiada
        if (nuevaPosicion && neumaticoDestino && (neumaticoDestino.CODIGO_NEU !== neumatico.CODIGO_NEU && neumaticoDestino.CODIGO !== neumatico.CODIGO)) {
            nuevosNeumaticos.push({ ...neumatico, POSICION: nuevaPosicion });
            nuevosNeumaticos.push({ ...neumaticoDestino, POSICION: neumatico.POSICION });
            setNeumaticosAsignadosState(nuevosNeumaticos);
            handleSeleccionarNeumatico({ ...neumatico, POSICION: nuevaPosicion });
            setPosicionOriginal(neumatico.POSICION || null);
            setCodigoOriginal(codigo || null);
            setSwapInfo({
                codigo: neumaticoDestino.CODIGO_NEU || neumaticoDestino.CODIGO || '',
                posicionOriginal: neumaticoDestino.POSICION,
                posicionNueva: neumatico.POSICION,
            });
            return;
        }
        // Si no hay swap, lógica normal
        const yaOcupada = neumaticosAsignadosState.some(n => n.POSICION === nuevaPosicion && (n.CODIGO_NEU !== neumatico.CODIGO_NEU && n.CODIGO !== neumatico.CODIGO));
        if (nuevaPosicion && yaOcupada) return;
        if (typeof neumatico.POSICION === 'string' && neumatico.POSICION !== nuevaPosicion) {
            setPosicionOriginal(neumatico.POSICION);
            setCodigoOriginal(codigo || null);
        } else if (!nuevaPosicion) {
            setPosicionOriginal(null);
            setCodigoOriginal(null);
        }
        // Guardar la última posición antes de desasignar
        if (!nuevaPosicion && neumatico.POSICION) {
            setUltimaPosicionDesasignada(neumatico.POSICION);
        }
        // Permitir que RES01 se reubique y desasigne como los demás
        // (No excluirlo de la lógica, solo excluir BAJA DEFINITIVA y RECUPERADO)
        if (!nuevaPosicion && (neumatico.TIPO_MOVIMIENTO === 'BAJA DEFINITIVA' || neumatico.TIPO_MOVIMIENTO === 'RECUPERADO')) {
            // No lo agregues a nuevosNeumaticos
        } else if (nuevaPosicion) {
            nuevosNeumaticos.push({ ...neumatico, POSICION: nuevaPosicion });
        } else {
            nuevosNeumaticos.push({ ...neumatico, POSICION: '' });
        }
        setNeumaticosAsignadosState(nuevosNeumaticos);
        handleSeleccionarNeumatico({ ...neumatico, POSICION: nuevaPosicion });
        setSwapInfo(null);
    };

    // Limpiar selección al hacer click en una posición vacía
    const handlePosicionClick = (neumatico: Neumatico | undefined) => {
        if (!neumatico) {
            setNeumaticoSeleccionado(null);
            setFormValues({
                kilometro: '',
                marca: '',
                modelo: '',
                codigo: '',
                posicion: '',
                medida: '',
                diseño: '',
                remanente: '',
                presion_aire: '',
                torque: '',
                tipo_movimiento: '',
                estado: '',
                observacion: '',
                fecha_inspeccion: '',
                accion: '', // <-- Limpiar acción
            });
        } else {
            // Validar solo movimientos definitivos que realmente impiden el mantenimiento
            if (neumatico.TIPO_MOVIMIENTO === 'BAJA DEFINITIVA' || neumatico.TIPO_MOVIMIENTO === 'RECUPERADO') {
                setSnackbarMsg('Este neumático no está disponible para mantenimiento debido a su estado.');
                setSnackbarSeverity('info');
                setSnackbarOpen(true);
                return;
            }
            // Permitir la selección - la validación de posición se hará en el momento de la acción
            handleSeleccionarNeumatico(neumatico);
        }
    };

    // Manejar el drop de neumático en una posición
    const handleDragEnd = (event: any) => {
        const { over, active } = event;
        if (over && active) {
            if (over.id === 'neumaticos-por-rotar') {
                // Drop en el card: desasignar
                const neu = neumaticosAsignadosState.find((n) => (n.CODIGO_NEU || n.CODIGO || n.POSICION) === active.id);
                if (neu && neu.POSICION) {
                    handleDropNeumatico(neu, '');
                }
            } else if (typeof over.id === 'string' && (over.id.startsWith('POS') || over.id === 'RES01')) {
                // Drop en una posición del diagrama
                const neu = neumaticosAsignadosState.find((n) => (n.CODIGO_NEU || n.CODIGO || n.POSICION) === active.id);
                if (neu && over.id) {
                    handleDropNeumatico(neu, over.id);
                }
            }
        }
    };

    // Obtener datos extra del último movimiento para ambos neumáticos
    const getFullData = async (neu: any) => {
        let result = { ...neu };
        try {
            const codigoBuscar = neu.CODIGO_NEU || neu.CODIGO;
            if (codigoBuscar) {
                const mov = await obtenerUltimosMovimientosPorCodigo(codigoBuscar);
                if (mov && mov.length > 0) {
                    const m = mov[0];
                    result = {
                        ...result,
                        PR: m.PR || '',
                        CARGA: m.CARGA || '',
                        VELOCIDAD: m.VELOCIDAD || '',
                        FECHA_FABRICACION: m.FECHA_FABRICACION || '',
                        RQ: m.RQ || '',
                        OC: m.OC || '',
                        COSTO: m.COSTO || '',
                        PROVEEDOR: m.PROVEEDOR || '',
                        FECHA_COMPRA: m.FECHA_COMPRA || '',
                        PRESION_AIRE: m.PRESION_AIRE?.toString() || '',
                        TORQUE_APLICADO: m.TORQUE_APLICADO?.toString() || '',
                        ESTADO: m.ESTADO || '',
                        KILOMETRO: m.KILOMETRO?.toString() || '',
                        REMANENTE: m.REMANENTE?.toString() || '',
                    };
                }
            }
        } catch (e) { /* ignorar error, usar lo que haya */ }
        return result;
    };

    // Handler para guardar reubicación
    const handleGuardarReubicacion = async () => {
        // Validar en tiempo real si ya existe reubicación para la última inspección
        if (!placa || !fechaUltimaInspeccion) {
            setSnackbarMsg('No se puede validar la reubicación: falta placa o fecha de inspección.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }
        await verificarBloqueoReubicacion(placa, fechaUltimaInspeccion);
        if (bloqueoReubicacionPorInspeccion) {
            setSnackbarMsg('Ya realizaste una reubicación con la última inspección. Debes realizar una nueva inspección para poder reubicar nuevamente.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }

        // 1. Detectar todos los swaps comparando estado inicial y final
        const movimientos: any[] = [];
        const movimientosPorCodigo = new Map<string, any>(); // Para evitar duplicados
        const posiciones = Object.keys(initialAssignedMap);

        for (const pos of posiciones) {
            const neuInicial = initialAssignedMap[pos];
            // Ignorar completamente los neumáticos de baja definitiva o recuperado
            if (neuInicial && (neuInicial.TIPO_MOVIMIENTO === 'BAJA DEFINITIVA' || neuInicial.TIPO_MOVIMIENTO === 'RECUPERADO')) {
                continue;
            }
            const neuFinal = neumaticosAsignadosState.find(n => n.POSICION === pos && n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && n.TIPO_MOVIMIENTO !== 'RECUPERADO');

            // Si hay neumático en la posición final y cambió respecto al inicial (o antes no había)
            if (neuFinal && (!neuInicial || (neuFinal.CODIGO_NEU || neuFinal.CODIGO) !== (neuInicial.CODIGO_NEU || neuInicial.CODIGO))) {
                const codigoNeu = neuFinal.CODIGO_NEU || neuFinal.CODIGO;

                // Verificar que el código no sea undefined
                if (!codigoNeu) {
                    console.warn(`[handleGuardarReubicacion] Neumático sin código válido en posición ${pos}`);
                    continue;
                }

                // Verificar si ya procesamos este neumático
                if (movimientosPorCodigo.has(codigoNeu)) {
                    console.warn(`[handleGuardarReubicacion] Neumático ${codigoNeu} ya procesado, omitiendo duplicado`);
                    continue;
                }

                // Buscar la posición anterior de este neumático (robusto)
                let posAnterior = '';
                // 1. Buscar en initialAssignedMap
                for (const p2 of posiciones) {
                    const n2 = initialAssignedMap[p2];
                    if (n2 && (n2.CODIGO_NEU || n2.CODIGO) === codigoNeu) {
                        posAnterior = p2;
                        break;
                    }
                }
                // 2. Si sigue vacío, buscar en el estado actual (por si viene de RES01 o swap)
                if (!posAnterior) {
                    const nActual = neumaticosAsignadosState.find(n => (n.CODIGO_NEU || n.CODIGO) === codigoNeu && n.POSICION && n.POSICION !== pos);
                    if (nActual && nActual.POSICION) {
                        posAnterior = nActual.POSICION;
                    }
                }
                // 3. Si sigue vacío, buscar en el historial de movimientos (opcional, si tienes acceso)
                // (Aquí podrías agregar una consulta a la API si es necesario)

                // Si sigue vacío, como último recurso, poner RES01 si el neumático estaba ahí
                if (!posAnterior && neuFinal && neuFinal.POSICION === pos && pos === 'RES01') {
                    posAnterior = 'RES01';
                }

                // Si después de todo sigue vacío, loguear advertencia y asignar RES01
                if (!posAnterior) {
                    console.warn(`[handleGuardarReubicacion] No se pudo determinar la posición original para el neumático ${codigoNeu}, se enviará RES01 por defecto.`);
                    posAnterior = 'RES01';
                }

                const fullNeu = await getFullData({
                    ...neuFinal,
                    MARCA: neuFinal.MARCA,
                    MEDIDA: neuFinal.MEDIDA,
                    DISEÑO: neuFinal.DISEÑO,
                    REMANENTE: neuFinal.REMANENTE,
                    PLACA: placa,
                });

                let posicionNeuOriginal = posAnterior;
                // Obtener la fecha de asignación original desde initialAssignedMap usando el código del neumático
                let fechaAsignacionOriginal = '';
                // Buscar en el mapa inicial por código
                for (const key of Object.keys(initialAssignedMap)) {
                    const n = initialAssignedMap[key];
                    if (n && (n.CODIGO_NEU || n.CODIGO) === codigoNeu) {
                        fechaAsignacionOriginal = n.FECHA_ASIGNACION || n.FECHA_REGISTRO || '';
                        break;
                    }
                }

                const movimiento = {
                    CODIGO: fullNeu.CODIGO_NEU || fullNeu.CODIGO,
                    MARCA: fullNeu.MARCA,
                    MEDIDA: fullNeu.MEDIDA,
                    DISEÑO: fullNeu.DISEÑO,
                    REMANENTE: fullNeu.REMANENTE,
                    PR: fullNeu.PR,
                    CARGA: fullNeu.CARGA,
                    VELOCIDAD: fullNeu.VELOCIDAD,
                    FECHA_FABRICACION: fullNeu.FECHA_FABRICACION,
                    RQ: fullNeu.RQ,
                    OC: fullNeu.OC,
                    PROYECTO: vehiculo?.proyecto || '',
                    COSTO: fullNeu.COSTO,
                    PROVEEDOR: fullNeu.PROVEEDOR,
                    FECHA_REGISTRO: fechaUltimaInspeccion ? fechaUltimaInspeccion.slice(0, 10) : new Date().toISOString().slice(0, 10),
                    FECHA_COMPRA: fullNeu.FECHA_COMPRA,
                    USUARIO_SUPER: user?.usuario || user?.email || user?.nombre || '',
                    PRESION_AIRE: fullNeu.PRESION_AIRE,
                    TORQUE_APLICADO: fullNeu.TORQUE_APLICADO,
                    ESTADO: fullNeu.ESTADO,
                    PLACA: placa,
                    POSICION_NEU: posicionNeuOriginal, // POSICION_NEU = POSICION_INICIAL
                    POSICION_INICIAL: posicionNeuOriginal,
                    POSICION_FIN: pos, // POSICION_FIN = nueva posición
                    DESTINO: vehiculo?.proyecto || '',
                    FECHA_ASIGNACION: fechaAsignacionOriginal,
                    KILOMETRO: fullNeu.KILOMETRO,
                    FECHA_MOVIMIENTO: getPeruLocalISOString(),
                    OBSERVACION: formValues.observacion,
                };

                // Registrar el movimiento para este código
                movimientosPorCodigo.set(codigoNeu, movimiento);
                movimientos.push(movimiento);
            }
        }
        if (movimientos.length === 0) {
            setSnackbarMsg('No hay cambios de posición para registrar.');
            setSnackbarSeverity('info');
            setSnackbarOpen(true);
            return;
        }

        // LOG para depuración: mostrar los códigos procesados
        console.log('[handleGuardarReubicacion] Códigos procesados:', Array.from(movimientosPorCodigo.keys()));
        console.log('[handleGuardarReubicacion] Total de movimientos generados:', movimientos.length);

        // Normalizar el array antes de enviarlo
        const normalizedPayloadArray = movimientos.map(normalizePayload);
        // LOG para depuración: ver el payload antes de enviarlo
        console.log('FECHA_MOVIMIENTO que se enviará (reubicación):', movimientos.map(m => m.FECHA_MOVIMIENTO));
        console.log('Payload que se enviará al backend (reubicación):', movimientos);
        // Puedes dejar este log o quitarlo luego de validar
        try {
            await registrarReubicacionNeumatico(normalizedPayloadArray);
            setSnackbarMsg('Reubicación registrada correctamente');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            setPosicionOriginal(null);
            setCodigoOriginal(null);
            setSwapInfo(null);

            // Refrescar automáticamente la última inspección y el bloqueo tras guardar
            if (placa) {
                // Actualiza la fecha de inspección local
                const nuevaFecha = await obtenerYSetearUltimaInspeccionPorPlaca(placa);
                if (nuevaFecha) {
                    await verificarBloqueoReubicacion(placa, nuevaFecha);
                }
            }
            // Opcional: podrías también recargar los neumáticos asignados si lo deseas
            // onClose(); // <--- Eliminar el cierre inmediato
        } catch (error) {
            if (error instanceof Error) {
                setSnackbarMsg('Error al registrar la reubicación: ' + error.message);
            } else {
                setSnackbarMsg('Error al registrar la reubicación: ' + String(error));
            }
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    // Handler para guardar desasignación
    const handleGuardarDesasignacion = async () => {
        if (!neumaticoSeleccionado) {
            setSnackbarMsg('Selecciona un neumático para desasignar.');
            setSnackbarSeverity('info');
            setSnackbarOpen(true);
            return;
        }
        if (!formValues.accion) {
            setSnackbarMsg('Selecciona una acción para la desasignación.');
            setSnackbarSeverity('info');
            setSnackbarOpen(true);
            return;
        }
        // Validar que exista una fecha de inspección válida
        if (!fechaUltimaInspeccion || isNaN(new Date(fechaUltimaInspeccion).getTime())) {
            setSnackbarMsg('No se puede desasignar: primero debe existir una inspección válida para este neumático.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }
        // Determinar la posición inicial y final para el payload completo
        let posicionInicial = neumaticoSeleccionado.POSICION || ultimaPosicionDesasignada || posicionOriginal || '';
        // Si no hay posición en el objeto, intentar buscarla en el mapeo inicial
        if (!posicionInicial) {
            const codigo = neumaticoSeleccionado.CODIGO_NEU || neumaticoSeleccionado.CODIGO;
            const posValida = Object.keys(initialAssignedMap).find(
                key => (initialAssignedMap[key]?.CODIGO_NEU || initialAssignedMap[key]?.CODIGO) === codigo
            );
            if (posValida) {
                posicionInicial = posValida;
            }
        }
        // Validar que realmente se pueda determinar una posición válida
        if (!posicionInicial || !/^POS\d{2}$/.test(posicionInicial)) {
            setSnackbarMsg('Este neumático ya está desasignado o no tiene posición asignada.');
            setSnackbarSeverity('info');
            setSnackbarOpen(true);
            return;
        }
        // Para desasignación, la posición final es vacía (sin asignar)
        const posicionFin = '';
        // POSICION_NEU debe ser igual a la posición inicial (de dónde sale)
        // DESTINO puede ser el proyecto o un valor especial si lo requieres
        const payload = {
            CODIGO: neumaticoSeleccionado.CODIGO_NEU || neumaticoSeleccionado.CODIGO,
            MARCA: neumaticoSeleccionado.MARCA,
            MEDIDA: neumaticoSeleccionado.MEDIDA,
            DISEÑO: neumaticoSeleccionado.DISEÑO,
            REMANENTE: neumaticoSeleccionado.REMANENTE,
            PR: neumaticoSeleccionado.PR,
            CARGA: neumaticoSeleccionado.CARGA,
            VELOCIDAD: neumaticoSeleccionado.VELOCIDAD,
            FECHA_FABRICACION: neumaticoSeleccionado.FECHA_FABRICACION,
            RQ: neumaticoSeleccionado.RQ,
            OC: neumaticoSeleccionado.OC,
            PROYECTO: vehiculo?.proyecto || '',
            COSTO: neumaticoSeleccionado.COSTO,
            PROVEEDOR: neumaticoSeleccionado.PROVEEDOR,
            FECHA_REGISTRO: fechaUltimaInspeccion || new Date().toISOString().slice(0, 10),
            FECHA_COMPRA: neumaticoSeleccionado.FECHA_COMPRA,
            USUARIO_SUPER: user?.usuario || user?.email || user?.nombre || '',
            TIPO_MOVIMIENTO: formValues.accion, // <-- Usar formValues.accion
            PRESION_AIRE: neumaticoSeleccionado.PRESION_AIRE,
            TORQUE_APLICADO: neumaticoSeleccionado.TORQUE_APLICADO,
            ESTADO: neumaticoSeleccionado.ESTADO,
            PLACA: placa,
            POSICION_NEU: posicionInicial,
            POSICION_INICIAL: posicionInicial,
            POSICION_FIN: posicionFin,
            DESTINO: vehiculo?.proyecto || '',
            FECHA_ASIGNACION: fechaUltimaInspeccion || new Date().toISOString().slice(0, 10),
            KILOMETRO: neumaticoSeleccionado.KILOMETRO,
            FECHA_MOVIMIENTO: getPeruLocalISOString(),
            OBSERVACION: formValues.observacion,
        };
        // LOG para depuración: ver el payload antes de enviarlo
        console.log('FECHA_MOVIMIENTO que se enviará (desasignación):', payload.FECHA_MOVIMIENTO);
        console.log('Payload que se enviará al backend (desasignación):', payload);
        try {
            await registrarDesasignacionNeumatico(payload);
            setSnackbarMsg('Desasignación registrada correctamente');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            // Actualizar el estado local: quitar la posición del neumático desasignado
            setNeumaticosAsignadosState(prev =>
                prev.map(n =>
                    (n.CODIGO_NEU || n.CODIGO) === (neumaticoSeleccionado.CODIGO_NEU || neumaticoSeleccionado.CODIGO)
                        ? { ...n, POSICION: '', TIPO_MOVIMIENTO: formValues.accion }
                        : n
                )
            );
            // Limpiar selección para evitar intentos duplicados
            setNeumaticoSeleccionado(null);
            setFormValues(prev => ({ ...prev, accion: '', observacion: '' }));
            onClose();
        } catch (error) {
            setSnackbarMsg('Error al registrar la desasignación: ' + (error instanceof Error ? error.message : String(error)));
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };

    // Filtro robusto para la dropzone: solo el último movimiento por código y sin BAJA DEFINITIVA/RECUPERADO
    const neumaticosSinPosicionFiltrados = React.useMemo(() => {
        // 1. Solo los que no tienen posición
        const sinPos = neumaticosAsignadosState.filter(n => (!n.POSICION || n.POSICION === '') && n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && n.TIPO_MOVIMIENTO !== 'RECUPERADO');
        // 2. Solo el último movimiento por código
        const porCodigo = Object.values(
            sinPos.reduce((acc: Record<string, Neumatico>, curr) => {
                const cod = curr.CODIGO_NEU || curr.CODIGO;
                if (!cod) return acc;
                if (!acc[cod] || ((curr.ID_MOVIMIENTO ?? 0) > (acc[cod].ID_MOVIMIENTO ?? 0))) {
                    acc[cod] = curr;
                }
                return acc;
            }, {})
        );
        // 3. Excluir BAJA DEFINITIVA y RECUPERADO (ya filtrado arriba, pero por seguridad)
        return porCodigo.filter(n => n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && n.TIPO_MOVIMIENTO !== 'RECUPERADO');
    }, [neumaticosAsignadosState]);

    // Utilidad para obtener fecha/hora local en formato YYYY-MM-DDTHH:mm
    function getLocalDateTimeString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    // Utilidad para obtener fecha/hora local en formato YYYY-MM-DD HH:mm:ss
    function getLocalDateTimeStringForPayload() {
        const d = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

    // Utilidad para obtener fecha local en formato YYYY-MM-DD
    function getLocalDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const fechaHoy = `${year}-${month}-${day}`;
        console.log('[getLocalDateString] Fecha de hoy:', fechaHoy, 'Llamado desde:', (new Error()).stack?.split('\n')[2]?.trim());
        return fechaHoy;
    }

    // Utilidad para asegurar que una fecha tenga hora (si solo viene YYYY-MM-DD, agrega hora actual)
    function ensureDateTime(fecha: string | undefined | null): string {
        if (!fecha) return new Date().toISOString();
        // Si ya tiene hora (T o espacio), retorna igual
        if (fecha.includes('T') || fecha.trim().length > 10) return fecha;
        // Si solo es fecha, agrega hora actual
        const now = new Date();
        const [y, m, d] = fecha.split('-');
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
    }

    // Utilidad para comparar fechas y calcular diferencia en días
    function diasEntreFechas(fecha1: string, fecha2: string) {
        // Ambas fechas en formato YYYY-MM-DD
        const d1 = new Date(fecha1.slice(0, 10));
        const d2 = new Date(fecha2.slice(0, 10));
        const diff = d2.getTime() - d1.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }

    // Utilidad para calcular la diferencia en días entre dos fechas (sin importar la hora)
    function daysBetween(date1: string, date2: string) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        d1.setHours(0, 0, 0, 0);
        d2.setHours(0, 0, 0, 0);
        return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Función para mostrar el modal de advertencia centralizado
    function mostrarModalAdvertencia(
        tipoAccion: 'REUBICADO' | 'DESASIGNAR',
        fechaInspeccion: string,
        onContinuar: () => void,
        onNuevaInspeccion: () => void
    ) {
        const hoy = getLocalDateString();
        const dias = daysBetween(fechaInspeccion, hoy);

        setModalAdvertencia({
            open: true,
            tipoAccion,
            ultimaInspeccionFecha: fechaInspeccion,
            diasDiferencia: dias,
            onContinuar,
            onNuevaInspeccion,
        });
    }

    // Función para cerrar el modal de advertencia
    function cerrarModalAdvertencia() {
        setModalAdvertencia(prev => ({ ...prev, open: false }));
    }

    // Handler validado para REUBICAR
    const handleGuardarReubicacionValidado = async (fechaInspeccion: string, forzarDialogo: boolean = false) => {
        // Validar si hay neumáticos seleccionados para reubicar antes de inspección
        const movimientos: any[] = [];
        const posiciones = Object.keys(initialAssignedMap);
        for (const pos of posiciones) {
            const neuInicial = initialAssignedMap[pos];
            if (neuInicial && (neuInicial.TIPO_MOVIMIENTO === 'BAJA DEFINITIVA' || neuInicial.TIPO_MOVIMIENTO === 'RECUPERADO')) {
                continue;
            }
            const neuFinal = neumaticosAsignadosState.find(n => n.POSICION === pos && n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && n.TIPO_MOVIMIENTO !== 'RECUPERADO');
            if (neuFinal && (!neuInicial || (neuFinal.CODIGO_NEU || neuFinal.CODIGO) !== (neuInicial.CODIGO_NEU || neuInicial.CODIGO))) {
                movimientos.push({}); // Solo para contar cambios
            }
        }
        if (movimientos.length === 0) {
            setSnackbarMsg('Selecciona los neumáticos que vas a reubicar.');
            setSnackbarSeverity('info');
            setSnackbarOpen(true);
            return;
        }
        if (!fechaInspeccion) {
            console.error('[ModalMantenimiento][REUBICAR] No hay fechaUltimaInspeccion disponible.');
            setSnackbarMsg('No se puede reubicar: primero debe seleccionar un neumático con inspección válida.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }
        const hoy = getLocalDateString();
        const dias = daysBetween(fechaInspeccion, hoy);
        if (!fechaInspeccion || isNaN(new Date(fechaInspeccion).getTime())) {
            setSnackbarMsg('No se puede reubicar: primero debe existir una inspección válida para este neumático.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }
        // Si la inspección es mayor a 4 días, forzar nueva inspección
        if (dias > 4) {
            mostrarModalAdvertencia(
                'REUBICADO',
                fechaInspeccion,
                () => {
                    cerrarModalAdvertencia();
                    onClose();
                    if (onAbrirInspeccion) onAbrirInspeccion();
                },
                () => {
                    cerrarModalAdvertencia();
                    onClose();
                    if (onAbrirInspeccion) onAbrirInspeccion();
                }
            );
            return;
        }
        // Si se fuerza el diálogo para inspecciones recientes (1-4 días), mostrar confirmación
        if (forzarDialogo && dias >= 1 && dias <= 4) {
            mostrarModalAdvertencia(
                'REUBICADO',
                fechaInspeccion,
                async () => {
                    cerrarModalAdvertencia();
                    await handleGuardarReubicacion();
                },
                () => {
                    cerrarModalAdvertencia();
                    onClose();
                    if (onAbrirInspeccion) onAbrirInspeccion();
                }
            );
            return;
        }
        // Si no se fuerza el diálogo, guardar directo
        await handleGuardarReubicacion();
    };

    // Handler validado para DESASIGNAR
    const handleGuardarDesasignacionValidado = async (fechaInspeccion: string, forzarDialogo: boolean = false) => {
        if (!fechaInspeccion) {
            console.error('[ModalMantenimiento][DESASIGNAR] No hay fechaUltimaInspeccion disponible.');
            setSnackbarMsg('No se puede desasignar: primero debe seleccionar un neumático con inspección válida.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }
        const hoy = getLocalDateString();
        const dias = daysBetween(fechaInspeccion, hoy);
        if (!fechaInspeccion || isNaN(new Date(fechaInspeccion).getTime())) {
            setSnackbarMsg('No se puede desasignar: primero debe existir una inspección válida para este neumático.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }
        // Si la inspección es mayor a 4 días, forzar nueva inspección (igual que en reubicación)
        if (dias > 4) {
            mostrarModalAdvertencia(
                'DESASIGNAR',
                fechaInspeccion,
                () => {
                    cerrarModalAdvertencia();
                    onClose();
                    if (onAbrirInspeccion) onAbrirInspeccion();
                },
                () => {
                    cerrarModalAdvertencia();
                    onClose();
                    if (onAbrirInspeccion) onAbrirInspeccion();
                }
            );
            return;
        }
        // Si se fuerza el diálogo para inspecciones recientes (1-4 días), mostrar confirmación
        if (forzarDialogo && dias >= 1 && dias <= 4) {
            mostrarModalAdvertencia(
                'DESASIGNAR',
                fechaInspeccion,
                async () => {
                    cerrarModalAdvertencia();
                    await handleGuardarDesasignacion();
                },
                () => {
                    cerrarModalAdvertencia();
                    onClose();
                    if (onAbrirInspeccion) onAbrirInspeccion();
                }
            );
            return;
        }
        await handleGuardarDesasignacion();
    };

    // --- INICIO CAMBIO: nuevos handlers para click en REUBICAR/DESASIGNAR desde el diagrama ---
    const handleClickReubicarDesdeDiagrama = async () => {
        setAccion('REUBICADO');
        // Validar si hay neumáticos seleccionados para reubicar antes de consultar inspección
        const movimientos: any[] = [];
        const posiciones = Object.keys(initialAssignedMap);
        for (const pos of posiciones) {
            const neuInicial = initialAssignedMap[pos];
            if (neuInicial && (neuInicial.TIPO_MOVIMIENTO === 'BAJA DEFINITIVA' || neuInicial.TIPO_MOVIMIENTO === 'RECUPERADO')) {
                continue;
            }
            const neuFinal = neumaticosAsignadosState.find(n => n.POSICION === pos && n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && n.TIPO_MOVIMIENTO !== 'RECUPERADO');
            if (neuFinal && (!neuInicial || (neuFinal.CODIGO_NEU || neuFinal.CODIGO) !== (neuInicial.CODIGO_NEU || neuInicial.CODIGO))) {
                movimientos.push({}); // Solo para contar cambios
            }
        }
        if (movimientos.length === 0) {
            setSnackbarMsg('Selecciona los neumáticos que vas a reubicar.');
            setSnackbarSeverity('info');
            setSnackbarOpen(true);
            return;
        }
        // Si hay neumáticos, ahora sí consultar inspección
        const ultimaFecha = await obtenerYSetearUltimaInspeccionPorPlaca(placa);
        console.log('[handleClickReubicarDesdeDiagrama] Fecha inspección obtenida:', ultimaFecha);
        if (!ultimaFecha) {
            mostrarModalAdvertencia(
                'REUBICADO',
                '', // sin inspección
                () => { }, // No hay continuar
                () => {
                    cerrarModalAdvertencia();
                    onClose();
                    if (onAbrirInspeccion) onAbrirInspeccion();
                }
            );
            return;
        }
        // Llamar al validador pasando la fecha obtenida y forzar el diálogo
        await handleGuardarReubicacionValidado(ultimaFecha, true);
    };
    const handleClickDesasignarDesdeDiagrama = async () => {
        setAccion('DESASIGNAR');
        const ultimaFecha = await obtenerYSetearUltimaInspeccionPorPlaca(placa);
        console.log('[handleClickDesasignarDesdeDiagrama] Fecha inspección obtenida:', ultimaFecha);
        if (!ultimaFecha) {
            mostrarModalAdvertencia(
                'DESASIGNAR',
                '', // sin inspección
                () => { }, // No hay continuar
                () => {
                    cerrarModalAdvertencia();
                    onClose();
                    if (onAbrirInspeccion) onAbrirInspeccion();
                }
            );
            return;
        }
        await handleGuardarDesasignacionValidado(ultimaFecha, true);
    };
    // --- FIN CAMBIO ---

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={(_event, reason) => {
                    setSnackbarOpen(false);
                    if (snackbarSeverity === 'success' && snackbarMsg === 'Reubicación registrada correctamente') {
                        onClose();
                    }
                }}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <MuiAlert
                    onClose={() => setSnackbarOpen(false)}
                    severity={snackbarSeverity}
                    elevation={6}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbarSeverity === 'success' && (
                        <AlertTitle>Éxito</AlertTitle>
                    )}
                    {snackbarSeverity === 'error' && (
                        <AlertTitle>Error</AlertTitle>
                    )}
                    {snackbarSeverity === 'info' && (
                        <AlertTitle>Información</AlertTitle>
                    )}
                    {snackbarSeverity === 'warning' && (
                        <AlertTitle>Advertencia</AlertTitle>
                    )}
                    {snackbarMsg}
                </MuiAlert>
            </Snackbar>
            <DialogContent>
                <DndContext onDragEnd={handleDragEnd}>
                    <Stack direction="row" spacing={2}>
                        <Stack direction="column" spacing={2} sx={{ flex: 1, width: '1px' }}>
                            <Card sx={{ p: 2, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)' }}>
                                <Box>
                                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                                        Mantenimiento de Neumáticos
                                    </Typography>
                                    {vehiculo ? (
                                        <Stack direction="row" spacing={4} alignItems="flex-start" sx={{ mb: 1 }}>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Marca
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                    {vehiculo.marca}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Modelo
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                    {vehiculo.modelo}
                                                </Typography>
                                            </Box>
                                            {vehiculo.proyecto && (
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Proyecto
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        {vehiculo.proyecto}
                                                    </Typography>
                                                </Box>
                                            )}
                                            {vehiculo.operacion && (
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Operación
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        {vehiculo.operacion}
                                                    </Typography>
                                                </Box>
                                            )}
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Año
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                    {vehiculo.anio}
                                                </Typography>
                                            </Box>
                                            {vehiculo.color && (
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Color
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        {vehiculo.color}
                                                    </Typography>
                                                </Box>
                                            )}
                                            {typeof vehiculo.kilometro === 'number' && (
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Kilometraje
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                        {vehiculo.kilometro.toLocaleString()} km
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Stack>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No hay datos del vehículo.
                                        </Typography>
                                    )}
                                </Box>
                            </Card>
                            {/* Mostrar solo el card correspondiente según la acción */}
                            {accion === 'REUBICADO' && (console.log('[RENDER][REUBICADO] fechaUltimaInspeccion:', fechaUltimaInspeccion),
                                <Card sx={{ p: 2, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 1, gap: 2 }}>
                                        <Typography variant="h6" sx={{ mt: 1, mb: 0 }}>
                                            REUBICAR
                                        </Typography>
                                        <Box sx={{ flex: 1 }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Fecha última inspección</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                {fechaUltimaInspeccion || 'Sin registro'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 2 }}>
                                        <TextField
                                            label="motivo"
                                            name="observacion"
                                            size="small"
                                            multiline
                                            minRows={2}
                                            value={formValues.observacion}
                                            onChange={handleInputChange}
                                            sx={{ minWidth: 220, flex: 1 }}
                                        />
                                        <DropNeumaticosPorRotar onDropNeumatico={(neu) => handleDropNeumatico(neu, '')}>
                                            <Box
                                                sx={{
                                                    mt: 0,
                                                    display: 'flex',
                                                    justifyContent: 'flex-start',
                                                    alignItems: 'flex-end',
                                                    minHeight: 100,
                                                    width: '300px',
                                                    maxWidth: '100%',
                                                    mx: 0,
                                                    p: 1,
                                                    overflowX: 'auto',
                                                }}
                                            >
                                                <Stack direction="row" spacing={1} alignItems="flex-end">
                                                    {neumaticosSinPosicionFiltrados.filter(n => n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && n.TIPO_MOVIMIENTO !== 'RECUPERADO').map((neu, idx) => (
                                                        <Box
                                                            key={`${neu.CODIGO_NEU || neu.CODIGO || neu.POSICION}-${idx}`}
                                                            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}
                                                        >
                                                            <DraggableNeumatico neumatico={neu} />
                                                            <NeumaticoInfo neumatico={neu} />
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            </Box>
                                        </DropNeumaticosPorRotar>
                                    </Box>
                                    <Button onClick={onClose} color="primary" variant="contained">
                                        Cerrar
                                    </Button>
                                    <Button color="success" variant="contained" sx={{ ml: 1 }}
                                        onClick={async () => {
                                            await handleGuardarReubicacion();
                                        }}
                                    >
                                        Guardar Reubicación
                                    </Button>
                                </Card>
                            )}
                            {accion === 'DESASIGNAR' && (console.log('[RENDER][DESASIGNAR] fechaUltimaInspeccion:', fechaUltimaInspeccion),
                                <Card sx={{ p: 2, boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 1, gap: 2 }}>
                                        <Typography variant="h6" sx={{ mt: 1, mb: 0 }}>
                                            DESASIGNAR
                                        </Typography>
                                        <Box sx={{ flex: 1 }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Fecha última inspección</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                {fechaUltimaInspeccion || 'Sin registro'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 2 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 220, flex: 1 }}>
                                            <TextField
                                                select
                                                label="Acción"
                                                name="accion"
                                                size="small"
                                                value={formValues.accion}
                                                onChange={handleInputChange}
                                                inputProps={{ style: { minWidth: '180px' } }}
                                                sx={{ minWidth: 220 }}
                                            >
                                                <MenuItem value="RECUPERADO">RECUPERADO</MenuItem>
                                                <MenuItem value="BAJA DEFINITIVA">BAJA DEFINITIVA</MenuItem>
                                            </TextField>
                                            <TextField
                                                label="Observación"
                                                name="observacion"
                                                size="small"
                                                multiline
                                                onChange={handleInputChange}
                                                sx={{ minWidth: 220, width: '100%' }}
                                            />
                                        </Box>
                                        <DropNeumaticosPorRotar onDropNeumatico={(neu) => handleDropNeumatico(neu, '')}>
                                            <Box
                                                sx={{
                                                    mt: 0,
                                                    display: 'flex',
                                                    justifyContent: 'flex-start',
                                                    alignItems: 'flex-end',
                                                    minHeight: 100,
                                                    width: '300px',
                                                    maxWidth: '100%',
                                                    mx: 0,
                                                    p: 1,
                                                    overflowX: 'auto',
                                                }}
                                            >
                                                <Stack direction="row" spacing={1} alignItems="flex-end">
                                                    {neumaticosSinPosicionFiltrados.filter(n => n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && n.TIPO_MOVIMIENTO !== 'RECUPERADO').map((neu, idx) => (
                                                        <Box
                                                            key={`${neu.CODIGO_NEU || neu.CODIGO || neu.POSICION}-${idx}`}
                                                            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}
                                                        >
                                                            <DraggableNeumatico neumatico={neu} />
                                                            <NeumaticoInfo neumatico={neu} />
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            </Box>
                                        </DropNeumaticosPorRotar>
                                    </Box>
                                    <Button onClick={onClose} color="primary" variant="contained">
                                        Cerrar
                                    </Button>
                                    <Button color="success" variant="contained" sx={{ ml: 1 }} onClick={() => handleGuardarDesasignacionValidado(fechaUltimaInspeccion)}>
                                        Guardar Desasignación
                                    </Button>
                                </Card>
                            )}
                        </Stack>
                        {/* Columna derecha: Imagen o visualización */}
                        <Card
                            sx={{
                                flex: 0.5,
                                p: 2,
                                position: 'relative',
                                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
                                maxWidth: 400,
                                minWidth: 320,
                                width: '100%',
                            }}
                        >
                            <Box sx={{ position: 'relative', width: '370px', height: '430px' }}>
                                <DiagramaVehiculo
                                    neumaticosAsignados={neumaticosAsignadosState.filter(n => n.TIPO_MOVIMIENTO !== 'BAJA DEFINITIVA' && n.TIPO_MOVIMIENTO !== 'RECUPERADO')}
                                    layout="modal"
                                    tipoModal="mantenimiento"
                                    onPosicionClick={handlePosicionClick}
                                    onRotarClick={handleClickReubicarDesdeDiagrama} // CAMBIO: ahora usa el handler que valida por placa
                                    onDesasignarClick={handleClickDesasignarDesdeDiagrama} // CAMBIO: ahora usa el handler que valida por placa
                                    fromMantenimientoModal={true}
                                    placa={placa}
                                />
                                <img
                                    src="/assets/placa.png"
                                    alt="Placa"
                                    style={{
                                        width: '130px',
                                        height: '60px',
                                        objectFit: 'contain',
                                        position: 'absolute',
                                        top: '10px',
                                        right: '55px',
                                        zIndex: 2,
                                        pointerEvents: 'none',
                                    }}
                                />
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: '24px',
                                        right: '60px',
                                        zIndex: 3,
                                        color: 'black',
                                        padding: '2px 8px',
                                        borderRadius: '5px',
                                        fontFamily: 'Arial, sans-serif',
                                        fontWeight: 'bold',
                                        fontSize: '24px',
                                        textAlign: 'center',
                                    }}
                                >
                                    {placa}
                                </Box>
                            </Box>
                        </Card>
                    </Stack>
                </DndContext>
            </DialogContent>
            {/* Modal de Advertencia de Mantenimiento - Centralizado */}
            {/* MODAL ELIMINADO: Aquí debe ir el nuevo modal de advertencia si aplica */}
        </Dialog>
    );
};

// Componente para un neumático draggable
export type DraggableNeumaticoProps = { neumatico: Neumatico };
export const DraggableNeumatico: React.FC<DraggableNeumaticoProps> = ({ neumatico }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: neumatico.CODIGO_NEU || neumatico.CODIGO || neumatico.POSICION,
    });
    const style = {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 62,
        borderRadius: '11px',
        background: '#fff',
        border: isDragging ? '2px solid #388e3c' : '2px solid #bdbdbd',
        boxShadow: isDragging ? '0 0 12px #388e3c' : '0 5px 7px #bbb',
        margin: '0 auto 12px auto',
        cursor: 'grab',
        opacity: isDragging ? 0.7 : 1,
        transition: 'box-shadow 0.2s, border 0.2s, opacity 0.2s',
        position: 'relative' as const,
    };
    return (
        <div
            ref={setNodeRef}
            style={{ ...style, transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined }}
            {...listeners}
            {...attributes}
        >
            <img
                src={'/assets/neumatico.png'}
                alt="Neumático"
                style={{ width: 28, height: 77, objectFit: 'contain', filter: isDragging ? 'brightness(0.8)' : undefined }}
            />
        </div>
    );
};

// Componente para mostrar información de un neumático
const NeumaticoInfo: React.FC<{ neumatico: Neumatico }> = ({ neumatico }) => (
    <>
        <Typography variant="caption" fontWeight="bold" sx={{ mt: 0.5, fontSize: 11, textAlign: 'center', width: '100%' }}>
            {neumatico.CODIGO_NEU || neumatico.CODIGO || 'Sin código'}
        </Typography>
        <Typography variant="caption" sx={{ fontSize: 10, color: '#888', textAlign: 'center', width: '100%' }}>
            {neumatico.MARCA || ''}
        </Typography>
    </>
);

// Dropzone para neumáticos por rotar (si se usa en el modal)
export const DropNeumaticosPorRotar: React.FC<{ onDropNeumatico: (neu: Neumatico) => void; children: React.ReactNode }> = ({ onDropNeumatico, children }) => {
    const { setNodeRef, isOver, active } = useDroppable({ id: 'neumaticos-por-rotar' });
    React.useEffect(() => {
        if (isOver && active && active.data?.current) {
            const neu = active.data.current as Neumatico;
            if (neu && typeof neu.POSICION === 'string' && neu.POSICION) {
                onDropNeumatico({ ...neu, POSICION: '' });
            }
        }
        // eslint-disable-next-line
    }, [isOver]);
    return (
        <Box
            ref={setNodeRef}
            sx={{
                minHeight: 120,
                width: '300px',
                maxWidth: '100%', // No se sale del card
                background: isOver ? '#e0f7fa' : '#fafafa',
                border: isOver ? '2px solid #388e3c' : '1px solid #bdbdbd',
                borderRadius: 2,
                p: 1,
                transition: 'background 0.2s, border 0.2s',
                overflowX: 'auto',
            }}
        >
            {children}
        </Box>
    );
};

export default ModalInpeccionNeu;

function normalizePayload(mov: any) {
    // Normaliza los campos y asegura que todos estén presentes y en el formato correcto
    return {
        CODIGO: mov.CODIGO || '',
        MARCA: mov.MARCA || '',
        MEDIDA: mov.MEDIDA || '',
        DISEÑO: mov.DISEÑO || '',
        REMANENTE: mov.REMANENTE || '',
        PR: mov.PR || '',
        CARGA: mov.CARGA || '',
        VELOCIDAD: mov.VELOCIDAD || '',
        FECHA_FABRICACION: mov.FECHA_FABRICACION || '',
        RQ: mov.RQ || '',
        OC: mov.OC || '',
        PROYECTO: mov.PROYECTO || '',
        COSTO: mov.COSTO || '',
        PROVEEDOR: mov.PROVEEDOR || '',
        FECHA_REGISTRO: mov.FECHA_REGISTRO ? new Date(mov.FECHA_REGISTRO).toISOString() : new Date().toISOString(),
        FECHA_COMPRA: mov.FECHA_COMPRA || '',
        USUARIO_SUPER: mov.USUARIO_SUPER || '',
        PRESION_AIRE: mov.PRESION_AIRE || '',
        TORQUE_APLICADO: mov.TORQUE_APLICADO || '',
        ESTADO: mov.ESTADO || '',
        PLACA: mov.PLACA || '',
        POSICION_NEU: mov.POSICION_NEU || '',
        POSICION_INICIAL: mov.POSICION_INICIAL || '',
        POSICION_FIN: mov.POSICION_FIN || '',
        DESTINO: mov.DESTINO || '',
        FECHA_ASIGNACION: mov.FECHA_ASIGNACION || '',
        KILOMETRO: mov.KILOMETRO || '',
        FECHA_MOVIMIENTO: mov.FECHA_MOVIMIENTO || '',
        OBSERVACION: mov.OBSERVACION || mov.OBS || mov.observacion || '',
    };
}

// --- Utilidad: obtener la última inspección real por placa desde el backend (nuevo endpoint) ---
async function obtenerYSetearUltimaInspeccionPorPlaca(placa: string): Promise<string | null> {
    if (!placa) return null;
    try {
        const fecha = await getUltimaFechaInspeccionPorPlaca(placa);
        console.log('[DEBUG] Última inspección recibida para placa', placa, ':', fecha);
        return fecha || null;
    } catch (error) {
        console.error('Error obteniendo la última inspección por placa:', error);
        return null;
    }
}
// Función para formatear fechas tipo 'YYYY-MM-DD' a 'DD/MM/YYYY' sin problemas de zona horaria
function formatearFechaDDMMYYYY(fecha: string): string {
    if (!fecha) return '';
    // Si ya viene en formato YYYY-MM-DD
    const partes = fecha.split('-');
    if (partes.length === 3) {
        return `${parseInt(partes[2], 10)}/${parseInt(partes[1], 10)}/${partes[0]}`;
    }
    // Si viene en otro formato, intentar parsear como Date y formatear
    const d = new Date(fecha);
    if (!isNaN(d.getTime())) {
        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    }
    return fecha;
}

// Utilidad para obtener la fecha/hora local de Perú (UTC-5) en formato ISO real
function getPeruLocalISOString() {
    // Obtener la fecha actual en UTC
    const now = new Date();
    // Obtener los componentes de la hora en la zona horaria de Lima
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    // El formato será: yyyy-MM-dd, HH:mm:ss
    const parts = formatter.formatToParts(now);
    const get = (type: string) => parts.find(p => p.type === type)?.value.padStart(2, '0');
    const year = get('year');
    const month = get('month');
    const day = get('day');
    const hour = get('hour');
    const minute = get('minute');
    const second = get('second');
    // Formato ISO: yyyy-MM-ddTHH:mm:ss
    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

// Utilidad para mostrar en consola la fecha que se muestra en la UI
export function logFechaMovimientoVisual(fechaMovimiento: string) {
    console.log('FECHA_MOVIMIENTO que se muestra en la UI:', fechaMovimiento);
    return fechaMovimiento;
}

