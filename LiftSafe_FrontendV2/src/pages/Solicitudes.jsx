import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { solicitudService } from '../services/solicitudService';
import { ascensorService } from '../services/ascensorService';

export default function Solicitudes() {
    const { user } = useAuth();
    const [solicitudes, setSolicitudes] = useState([]);
    const [ascensores, setAscensores] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        id_ascensor: '',
        tipo_servicio: 'Inspección Periódica',
        prioridad: 'Media',
        fecha_deseada: '',
        observaciones: ''
    });

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const solicitudesData = await solicitudService.listar();
            setSolicitudes(solicitudesData);
            
            if (user?.rol === 'Cliente') {
                const ascensoresData = await ascensorService.listar();
                setAscensores(ascensoresData);
            }
        } catch (error) {
            console.error('Error cargando solicitudes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await solicitudService.crear(formData);
            setShowForm(false);
            setFormData({
                id_ascensor: '',
                tipo_servicio: 'Inspección Periódica',
                prioridad: 'Media',
                fecha_deseada: '',
                observaciones: ''
            });
            await cargarDatos();
        } catch (error) {
            console.error('Error creando solicitud:', error);
            alert('Error al crear la solicitud: ' + (error.message || 'Intenta de nuevo'));
        }
    };

    const total = solicitudes.length;
    const pendientes = solicitudes.filter(s => s.estado === 'Pendiente').length;
    const programadas = solicitudes.filter(s => s.estado === 'Programada').length;
    const finalizadas = solicitudes.filter(s => s.estado === 'Finalizada').length;

    return (
        <div style={{ padding: '20px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
                Solicitudes de Inspección
            </h1>
            <p style={{ color: '#666', marginBottom: '20px' }}>
                Gestiona las solicitudes de inspección de ascensores
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: '#f0f4ff', padding: '15px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                    <div style={{ fontSize: '14px', color: '#666' }}>Total</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{total}</div>
                </div>
                <div style={{ background: '#fff8e1', padding: '15px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                    <div style={{ fontSize: '14px', color: '#666' }}>Pendientes</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{pendientes}</div>
                </div>
                <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                    <div style={{ fontSize: '14px', color: '#666' }}>Programadas</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{programadas}</div>
                </div>
                <div style={{ background: '#f3e5f5', padding: '15px', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                    <div style={{ fontSize: '14px', color: '#666' }}>Finalizadas</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{finalizadas}</div>
                </div>
            </div>

            {user?.rol === 'Cliente' && (
                <button
                    onClick={() => setShowForm(true)}
                    style={{
                        background: '#1976d2',
                        color: 'white',
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginBottom: '20px'
                    }}
                >
                    + Nueva Solicitud
                </button>
            )}

            {showForm && (
                <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', background: '#f9f9f9' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>Nueva Solicitud de Inspección</h2>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Ascensor *</label>
                                <select
                                    value={formData.id_ascensor}
                                    onChange={(e) => setFormData({...formData, id_ascensor: e.target.value})}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                    required
                                >
                                    <option value="">Seleccionar ascensor...</option>
                                    {ascensores.map(a => (
                                        <option key={a.id_ascensor} value={a.id_ascensor}>
                                            {a.codigo_interno || a.marca} - {a.marca} {a.modelo}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Tipo de servicio *</label>
                                <select
                                    value={formData.tipo_servicio}
                                    onChange={(e) => setFormData({...formData, tipo_servicio: e.target.value})}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                >
                                    <option value="Inspección Periódica">Inspección Periódica</option>
                                    <option value="Inspección Inicial">Inspección Inicial</option>
                                    <option value="Inspección Extraordinaria">Inspección Extraordinaria</option>
                                    <option value="Post-mantenimiento">Post-mantenimiento</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Prioridad *</label>
                                <select
                                    value={formData.prioridad}
                                    onChange={(e) => setFormData({...formData, prioridad: e.target.value})}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                >
                                    <option value="Baja">Baja</option>
                                    <option value="Media">Media</option>
                                    <option value="Alta">Alta</option>
                                    <option value="Crítica">Crítica</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Fecha deseada</label>
                                <input
                                    type="date"
                                    value={formData.fecha_deseada}
                                    onChange={(e) => setFormData({...formData, fecha_deseada: e.target.value})}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Observaciones</label>
                                <textarea
                                    placeholder="Observaciones adicionales..."
                                    value={formData.observaciones}
                                    onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                    rows="2"
                                />
                            </div>
                        </div>
                        <div style={{ marginTop: '15px' }}>
                            <button
                                type="submit"
                                style={{
                                    background: '#4caf50',
                                    color: 'white',
                                    padding: '10px 20px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Guardar
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                style={{
                                    background: '#9e9e9e',
                                    color: 'white',
                                    padding: '10px 20px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    marginLeft: '10px'
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#e0e0e0' }}>
                            <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>ID</th>
                            <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Ascensor</th>
                            <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Cliente</th>
                            <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Tipo</th>
                            <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Prioridad</th>
                            <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Estado</th>
                            <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center' }}>Cargando...</td></tr>
                        ) : solicitudes.length === 0 ? (
                            <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center' }}>No hay solicitudes registradas</td></tr>
                        ) : (
                            solicitudes.map(s => (
                                <tr key={s.id_solicitud} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '10px', border: '1px solid #ccc' }}>{s.id_solicitud}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ccc' }}>{s.ascensor?.codigo_interno || '-'}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ccc' }}>{s.cliente?.nombre_completo || '-'}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ccc' }}>{s.tipo_servicio}</td>
                                    <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            color: 'white',
                                            fontSize: '12px',
                                            background: s.prioridad === 'Crítica' ? '#d32f2f' :
                                                       s.prioridad === 'Alta' ? '#ed6c02' :
                                                       s.prioridad === 'Media' ? '#f9a825' : '#757575'
                                        }}>
                                            {s.prioridad}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #ccc' }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            color: 'white',
                                            fontSize: '12px',
                                            background: s.estado === 'Pendiente' ? '#f9a825' :
                                                       s.estado === 'Programada' ? '#1976d2' :
                                                       s.estado === 'Finalizada' ? '#388e3c' : '#757575'
                                        }}>
                                            {s.estado}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #ccc' }}>{s.fecha_solicitud}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}