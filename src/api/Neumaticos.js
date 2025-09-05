import axios from "axios";

// Obtener el historial completo de movimientos de un neumático por su código
export const obtenerHistorialMovimientosPorCodigo = async (codigo) => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/po-movimiento/historial-codigo/${codigo}`);
    return response.data;
  } catch (error) {
    console.error('Error en obtenerHistorialMovimientosPorCodigo:', error);
    throw error;
  }
};


// Obtener la lista de neumáticos
export const Neumaticos = async () => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/po-neumaticos`, { withCredentials: true });
  return response.data;
};

// Subir el padrón de neumáticos desde Excel
export const cargarPadronNeumatico = async (archivoExcel) => {
  const formData = new FormData();
  formData.append("archivo", archivoExcel);

  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/po-padron/cargar-padron`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    // Si el backend responde con error 500 o 400, devolver el mensaje de error
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error + (error.response.data.detalle ? `: ${error.response.data.detalle}` : ''));
    }
    throw error;
  }
};

// Buscar vehículo por placa
export const buscarVehiculoPorPlaca = async (placa) => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/vehiculo/${placa}`, { withCredentials: true });
    return response.data; // Retorna los datos del vehículo
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null; // Vehículo no encontrado
    }
    console.error("Error al buscar el vehículo por placa:", error);
    throw error; // Lanza el error para manejarlo en el frontend
  }
};

// Buscar vehículo por placa en toda la empresa (sin filtro de usuario)
export const buscarVehiculoPorPlacaEmpresa = async (placa) => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/vehiculo/buscar-todas/${placa}`, { withCredentials: true });
    return response.data; // Retorna los datos del vehículo
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null; // Vehículo no encontrado
    }
    console.error("Error al buscar el vehículo por placa (empresa):", error);
    throw error;
  }
};

// Obtener la lista de neumáticos asignados por placa
export const obtenerNeumaticosAsignadosPorPlaca = async (placa) => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/po-asignados/${placa}`);
    return response.data;
  } catch (error) {
    console.error('Error en obtenerNeumaticosAsignadosPorPlaca:', error);
    throw error;
  }
};

  // Asignar neumático a una posición de un vehículo (ahora acepta objeto o array)
export const asignarNeumatico = async (payload) => {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/po-asignar-neumatico`,
      payload, // Puede ser objeto o array
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error en asignarNeumatico:', error);
    throw error;
  }
};

// Guardar inspección de neumático
export const guardarInspeccion = async (data) => {
  try {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/inspeccion`, data);
    return response.data;
  } catch (error) {
    // Si el backend responde con error 400/500, devolver el mensaje de error
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

// Obtener la cantidad total de neumáticos
export const obtenerCantidadNeumaticos = async () => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/po-neumaticos/cantidad`, { withCredentials: true });
  return response.data.cantidad;
};

// Obtener la cantidad de neumáticos disponibles
export const obtenerCantidadNeumaticosDisponibles = async () => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/po-neumaticos/disponibles/cantidad`, { withCredentials: true });
  return response.data.cantidad;
};

// Obtener la cantidad de neumáticos asignados
export const obtenerCantidadNeumaticosAsignados = async () => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/po-neumaticos/asignados/cantidad`, { withCredentials: true });
  return response.data.cantidad;
};

// Obtener la cantidad de autos (placas) disponibles para el usuario autenticado
export const obtenerCantidadAutosDisponibles = async () => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/vehiculo/cantidad`, { withCredentials: true });
  return response.data.cantidad;
};

// Obtener la lista de neumáticos asignados (tabla NEU_ASIGNADO) por placa (nuevo endpoint directo)
export const listarNeumaticosAsignados = async (placa) => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/po-asignados/${placa}`);
    return response.data;
  } catch (error) {
    console.error('Error en listarNeumaticosAsignados:', error);
    throw error;
  }
};

// Obtener el último movimiento de cada neumático instalado en una placa
export const obtenerUltimosMovimientosPorPlaca = async (placa) => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/po-movimiento/ultimos/${placa}`);
    return response.data;
  } catch (error) {
    console.error('Error en obtenerUltimosMovimientosPorPlaca:', error);
    throw error;
  }
};

// Obtener el último movimiento de cada posición de un neumático por su código
export const obtenerUltimosMovimientosPorCodigo = async (codigo) => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/po-movimiento/ultimos-codigo/${codigo}`);
    return response.data;
  } catch (error) {
    console.error('Error en obtenerUltimosMovimientosPorCodigo:', error);
    throw error;
  }
};

// Obtener el último movimiento por posición de neumático para una placa
export const obtenerUltimosMovimientosPorPosicion = async (placa) => {
  try {
    // Cambiado a la ruta correcta según backend
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/po-asignados/ultimo-movimiento/${placa}`);
    return response.data;
  } catch (error) {
    console.error('Error en obtenerUltimosMovimientosPorPosicion:', error);
    throw error;
  }
};

// Registrar reubicación de neumático (REUBICADO)
export const registrarReubicacionNeumatico = async (data) => {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/registrorotacionneumatico`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error + (error.response.data.detalle ? `: ${error.response.data.detalle}` : ''));
    }
    throw error;
  }
};

// Registrar desasignación de neumático (BAJA DEFINITIVA o RECUPERADO)
export const registrarDesasignacionNeumatico = async (data) => {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/registrardesasignacionneumatico`,
      data,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error + (error.response.data.detalle ? `: ${error.response.data.detalle}` : ''));
    }
    throw error;
  }
};

// Consultar si existe inspección para hoy para un neumático y placa
export const consultarInspeccionHoy = async ({ codigo, placa, fecha }) => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/inspeccion/existe`, {
      params: { codigo, placa, fecha },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

// Obtener la cantidad de neumáticos disponibles por mes (para el gráfico)
export const obtenerNeumaticosDisponiblesPorMes = async (usuario) => {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_API_URL}/api/po-reportes/disponibles-por-mes`,
    { params: { usuario }, withCredentials: true }
  );
  return response.data;
};

// Obtener la cantidad de neumáticos asignados por mes (para el gráfico)
export const obtenerNeumaticosAsignadosPorMes = async (usuario) => {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_API_URL}/api/po-reportes/asignados-por-mes`,
    { params: { usuario }, withCredentials: true }
  );
  return response.data;
};

// Obtener inspecciones de neumáticos por rango de fechas y usuario
export const obtenerInspeccionesNeumaticosPorFechas = async ({ usuario, fechaInicio, fechaFin }) => {
  const response = await axios.get(
    `${process.env.NEXT_PUBLIC_API_URL}/api/po-reportes/neu-inspeccion-por-fechas`,
    { params: { usuario, fechaInicio, fechaFin }, withCredentials: true }
  );
  return response.data;
};

// Obtener la última fecha de inspección solo por placa
export const getUltimaFechaInspeccionPorPlaca = async (placa) => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/ultima-fecha-inspeccion-por-placa`, {
      params: { placa },
      withCredentials: true,
    });
    // El backend retorna { ultima: 'YYYY-MM-DD' | null }
    return response.data.ultima || null;
  } catch (error) {
    console.error('Error en getUltimaFechaInspeccionPorPlaca:', error);
    throw error;
  }
};

