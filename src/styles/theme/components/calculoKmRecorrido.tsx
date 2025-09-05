
export interface MovimientoNeumatico {
    CODIGO: string;
    TIPO_MOVIMIENTO: string;
    POSICION: string;
    POSICION_NEU: string;
    KILOMETRO: number | string;
    FECHA_MOVIMIENTO: string;
}

/**
 * Calcula el km recorrido acumulativo de un neumático según su historial de movimientos.
 * @param historial Array de movimientos del neumático
 * @param posicionActual Posición actual del neumático (ej: 'POS01', 'RES01')
 * @returns Km recorrido acumulado (número) 
 */
export function calcularKmRecorrido(historial: MovimientoNeumatico[], posicionActual: string): number {
    if (!Array.isArray(historial) || historial.length === 0) return 0;
    // Ordenar historial de más antiguo a más reciente
    const historialOrdenado = [...historial].sort((a, b) => new Date(a.FECHA_MOVIMIENTO).getTime() - new Date(b.FECHA_MOVIMIENTO).getTime());
    let kmRecorridoTotal = 0;
    // Agrupar movimientos por posición
    const posiciones = new Set(historialOrdenado.map(m => m.POSICION_NEU).filter(Boolean));
    // Obtener código de neumático si existe en el historial
    const codigoNeumatico = historialOrdenado[0]?.CODIGO || 'SIN_CODIGO';
    posiciones.forEach(posicion => {
        if (posicion !== posicionActual) return;
        const movimientosPos = historialOrdenado.filter(m => m.POSICION_NEU === posicion);
        let inicioIdx = movimientosPos.findIndex(m => m.TIPO_MOVIMIENTO === 'ASIGNADO' || m.TIPO_MOVIMIENTO === 'REUBICADO');
        if (inicioIdx === -1) return;
        let kmBase = 0;
        // Si es la primera vez que el neumático entra a esta posición, buscar el km recorrido acumulado hasta ese momento
        const movInicio = movimientosPos[inicioIdx];
        if (movInicio.TIPO_MOVIMIENTO === 'ASIGNADO' || movInicio.TIPO_MOVIMIENTO === 'REUBICADO') {
            // Buscar el movimiento global correspondiente
            const idxGlobal = historialOrdenado.findIndex(m => m === movInicio);
            if (idxGlobal > 0) {
                // Si viene de otra posición, arrastrar el km recorrido acumulado de la posición anterior
                const posAnterior = historialOrdenado[idxGlobal - 1].POSICION_NEU;
                if (posAnterior && posAnterior !== posicion) {
                    kmBase = calcularKmRecorrido(historial, posAnterior);
                }
            }
        }
        // Si la posición es RES01, el km recorrido es fijo y nunca suma (aunque tenga inspecciones)
        if (posicion === 'RES01') {
            // Buscar el último movimiento antes de entrar a RES01
            const idxRes = historialOrdenado.findIndex(m => m.POSICION_NEU === 'RES01' && (m.TIPO_MOVIMIENTO === 'ASIGNADO' || m.TIPO_MOVIMIENTO === 'REUBICADO'));
            if (idxRes > 0) {
                const posAnterior = historialOrdenado[idxRes - 1].POSICION_NEU;
                if (posAnterior && posAnterior !== 'RES01') {
                    kmBase = calcularKmRecorrido(historial, posAnterior);
                }
            }
            kmRecorridoTotal = kmBase;
            // Nunca sumar inspecciones en RES01
            //console.log(`Km recorrido total en RES01:`, kmRecorridoTotal);
            return;
        }
        // Para posiciones activas, sumar solo entre inspecciones en esa posición, partiendo del kmBase
        let kmAnterior = Number(movimientosPos[inicioIdx].KILOMETRO);
        let tieneInspeccion = movimientosPos.some(m => m.TIPO_MOVIMIENTO === 'INSPECCION');
        let sumaPos = 0;
        for (let i = inicioIdx + 1; i < movimientosPos.length; i++) {
            const mov = movimientosPos[i];
            if (mov.TIPO_MOVIMIENTO === 'INSPECCION') {
                const kmActual = Number(mov.KILOMETRO);
                sumaPos += Math.max(0, kmActual - kmAnterior);
                kmAnterior = kmActual;
            }
        }
        kmRecorridoTotal = kmBase + sumaPos;
        //console.log(`Km recorrido total en ${posicion}:`, kmRecorridoTotal);
    });
    return kmRecorridoTotal;
}
