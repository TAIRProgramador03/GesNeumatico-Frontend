import React, { useRef, useState } from 'react';
import styled from '@emotion/styled';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { cargarPadronNeumatico } from '@/api/Neumaticos';

interface ModalInsertExcelProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void; // Notifica al padre si hubo éxito para refrescar
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.5);
  z-index: 1300;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalBox = styled.div`
  background: #fff;
  border-radius: 18px;
  padding: 38px 32px 28px 32px;
  min-width: 340px;
  max-width: 95vw;
  box-shadow: 0 10px 40px 0 rgba(25, 118, 210, 0.18), 0 1.5px 8px 0 rgba(0,0,0,0.10);
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: modalFadeIn 0.35s cubic-bezier(.4,0,.2,1);
  @keyframes modalFadeIn {
    from { opacity: 0; transform: translateY(40px) scale(0.98); }
    to { opacity: 1; transform: none; }
  }
`;

const DropArea = styled.label<{ dragActive: boolean }>`
  border: 2.5px dashed #1976d2;
  background: ${({ dragActive }) => dragActive ? '#e3f2fd' : '#f5faff'};
  border-radius: 12px;
  width: 340px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-bottom: 22px;
  transition: background 0.2s, border-color 0.2s;
  box-shadow: ${({ dragActive }) => dragActive ? '0 0 0 2px #1976d2' : 'none'};
  border-color: ${({ dragActive }) => dragActive ? '#1565c0' : '#1976d2'};
`;

const FileNameBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f5faff;
  border-radius: 6px;
  padding: 6px 14px;
  margin-bottom: 10px;
  color: #1976d2;
  font-weight: 500;
  font-size: 1rem;
  min-height: 32px;
`;

const InfoBar = styled.div`
  background: linear-gradient(90deg, #e3f2fd 60%, #bbdefb 100%);
  color: #1976d2;
  border-radius: 7px;
  padding: 10px 18px;
  margin-bottom: 22px;
  width: 100%;
  text-align: center;
  font-size: 1.04rem;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 1px 4px 0 rgba(25,118,210,0.07);
`;

const Actions = styled.div`
  display: flex;
  gap: 18px;
  margin-top: 22px;
`;

const ImportButton = styled(Button)`
  background: linear-gradient(90deg, #536dfe 0%, #1976d2 100%);
  color: #fff;
  font-weight: 600;
  border-radius: 7px;
  box-shadow: 0 2px 8px 0 rgba(25,118,210,0.10);
  &:hover {
    background: linear-gradient(90deg, #1976d2 0%, #536dfe 100%);
    box-shadow: 0 4px 16px 0 rgba(25,118,210,0.13);
  }
`;

const CancelButton = styled(Button)`
  border-radius: 7px;
  font-weight: 600;
  color: #c62828;
  border: 1.5px solid #ffcdd2;
  background: #fff;
  &:hover {
    background: #ffcdd2;
    color: #fff;
    border-color: #c62828;
  }
`;

const ModalInsertExcel: React.FC<ModalInsertExcelProps> = ({ open, onClose, onSuccess }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resultadoCarga, setResultadoCarga] = useState<any>(null);
    const [showResumen, setShowResumen] = useState(false);

    if (!open) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setSelectedFile(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0] || null;
        setSelectedFile(file);
    };

    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        setDragActive(false);
    };

    const handleImport = async () => {
        if (!selectedFile) return;
        setLoading(true);
        setResultadoCarga(null);
        try {
            const response = await cargarPadronNeumatico(selectedFile);
            setResultadoCarga(response);
            setShowResumen(true);
            if (response.insertados > 0 && onSuccess) {
                onSuccess(); 
            }
        } catch (error: any) {
            setResultadoCarga({
                mensaje: error.message || 'Error desconocido al cargar el archivo',
                total: 0,
                insertados: 0,
                errores: []
            });
            setShowResumen(true);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseResumen = () => {
        setShowResumen(false);
        setSelectedFile(null);
        setResultadoCarga(null);
        onClose();
    };

    return (
        <Overlay>
            <ModalBox>
                {!showResumen ? (
                    <>
                        <Typography variant="h5" sx={{ mb: 2.5, fontWeight: 700, letterSpacing: 0.2, textAlign: 'center' }}>
                            Importar archivo Excel
                        </Typography>
                        <DropArea
                            dragActive={dragActive}
                            htmlFor="excel-file-input"
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                        >
                            <input
                                id="excel-file-input"
                                type="file"
                                accept=".xlsx,.xls"
                                ref={inputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                                disabled={loading}
                            />
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                <svg width="44" height="44" fill="#1976d2" viewBox="0 0 24 24" style={{marginBottom: 2}}><path d="M19 15v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                <Typography variant="body1" sx={{ color: '#1976d2', fontWeight: 600, fontSize: '1.08rem' }}>
                                    Arrastra aquí tu archivo o haz clic para seleccionar
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#888', fontSize: '0.97rem' }}>
                                    (Solo .xlsx o .xls)
                                </Typography>
                            </Box>
                        </DropArea>
                        {selectedFile ? (
                          <FileNameBox>
                            <svg width="20" height="20" fill="#1976d2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" fill="#e3f2fd" stroke="#1976d2" strokeWidth="1.5"/><path d="M7 8h10M7 12h10M7 16h6" stroke="#1976d2" strokeWidth="1.5" strokeLinecap="round"/></svg>
                            {selectedFile.name}
                          </FileNameBox>
                        ) : (
                          <FileNameBox style={{ color: '#888', background: '#f5f5f5' }}>
                            No hay archivos cargados
                          </FileNameBox>
                        )}
                        <InfoBar>
                            <svg width="22" height="22" fill="#1976d2" viewBox="0 0 24 24" style={{ marginRight: 4 }}><circle cx="12" cy="12" r="10" stroke="#1976d2" strokeWidth="2" fill="none"/><line x1="12" y1="8" x2="12" y2="12" stroke="#1976d2" strokeWidth="2"/><circle cx="12" cy="16" r="1" fill="#1976d2"/></svg>
                            Esta acción puede demorar unos minutos.
                        </InfoBar>
                        <Actions>
                            <ImportButton
                                variant="contained"
                                onClick={handleImport}
                                disabled={!selectedFile || loading}
                                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
                            >
                                Importar
                            </ImportButton>
                            <CancelButton
                                variant="outlined"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancelar
                            </CancelButton>
                        </Actions>
                    </>
                ) : (
                    <>
                        <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, textAlign: 'center' }}>Resumen de carga</Typography>
                        <p><strong>Total:</strong> {resultadoCarga?.total}</p>
                        <p><strong>Insertados:</strong> {resultadoCarga?.insertados}</p>
                        {resultadoCarga?.mensaje && (
                          <p style={{
                            marginTop: '12px',
                            padding: '10px',
                            borderRadius: '6px',
                            backgroundColor:
                              resultadoCarga.mensaje.includes("correctamente") ? "#e0f7e9"
                                : resultadoCarga.mensaje.includes("no realizada") ? "#ffebee"
                                  : resultadoCarga.mensaje.toLowerCase().includes("error") ? "#ffebee"
                                    : "#fff8e1",
                            color:
                              resultadoCarga.mensaje.includes("correctamente") ? "#2e7d32"
                                : resultadoCarga.mensaje.includes("no realizada") ? "#c62828"
                                  : resultadoCarga.mensaje.toLowerCase().includes("error") ? "#c62828"
                                    : "#f9a825",
                            fontWeight: "bold"
                          }}>
                            {resultadoCarga.mensaje}
                          </p>
                        )}
                        {resultadoCarga?.errores && resultadoCarga.errores.length > 0 && (
                          <>
                            <p style={{marginTop: 18, fontWeight: 600, color: '#c62828'}}>Errores detectados:</p>
                            <div style={{ maxHeight: '300px', overflowY: 'auto', margin: '0 auto', marginBottom: 10, minWidth: 'min(90vw, 400px)' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.98rem' }}>
                                <thead>
                                  <tr>
                                    <th style={{background:'#f5f5f5', padding:'6px'}}>Fila/Código</th>
                                    <th style={{background:'#f5f5f5', padding:'6px'}}>Mensaje</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {resultadoCarga.errores.map((err: { fila: string; mensaje: string }, idx: number) => (
                                    <tr key={idx}>
                                      <td style={{ padding: '6px', border: '1px solid #eee' }}>{err.fila}</td>
                                      <td style={{ color: '#c62828', fontWeight: 'bold', padding: '6px', border: '1px solid #eee' }}>
                                        {err.mensaje || "Error desconocido"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        )}
                        <Actions>
                          <ImportButton
                            variant="contained"
                            onClick={handleCloseResumen}
                          >
                            Aceptar
                          </ImportButton>
                        </Actions>
                    </>
                )}
            </ModalBox>
        </Overlay>
    );
};

export default ModalInsertExcel;
