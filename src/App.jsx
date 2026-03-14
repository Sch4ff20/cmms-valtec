import { useState, useRef, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://koqautbqylhmladowyeg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvcWF1dGJxeWxobWxhZG93eWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTk3MTksImV4cCI6MjA4OTA3NTcxOX0.s563M5KAUS9qt9zHBmfqrXFlyP4hRFrrIwC-lo9inoM";

async function sbFetch(table, params = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  return res.json();
}

async function sbInsert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function sbRpc(fn, params = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  return res.json();
}

const CHECKLIST_CXS = [
  { seccion: "Inspección y limpieza interna", items: [
    { tarea: "Limpieza de la placa de cubierta", desc: "Comprobar deformaciones, daños y tornillos.", tipo: "check" },
    { tarea: "Limpieza de polvos y escombros", desc: "Limpieza interna, libre de polvo y materiales extraños.", tipo: "check" },
    { tarea: "Limpieza del monitor", desc: "Verificar polvo y brillo de pantalla.", tipo: "check" },
    { tarea: "Limpieza del teclado", desc: "Verificar funcionamiento.", tipo: "check" },
    { tarea: "Limpieza ventiladores de refrigeración", desc: "Ventilador y filtro libres de polvo.", tipo: "check" },
    { tarea: "Limpieza del IPC", desc: "IPC, filtro y tarjetas en buen estado.", tipo: "check" },
  ]},
  { seccion: "Seguridad eléctrica", items: [
    { tarea: "Fuente de alimentación externa", desc: "Condiciones y requisitos.", tipo: "check" },
    { tarea: "Mediciones de red", desc: "Tensiones dentro de rango.", tipo: "check" },
    { tarea: "Verificar UPS", desc: "Funcionamiento y alimentación.", tipo: "check" },
    { tarea: "Conexión del equipo", desc: "Buen estado.", tipo: "check" },
    { tarea: "Indicador de encendido", desc: "Luz indicadora correcta.", tipo: "check" },
    { tarea: "Cables y terminales", desc: "Conexiones en buen estado.", tipo: "check" },
  ]},
  { seccion: "Seguridad radiológica", items: [
    { tarea: "Cortinas de plomo", desc: "Sin desgaste severo.", tipo: "check" },
    { tarea: "Botones de emergencia", desc: "Funcionamiento normal.", tipo: "check" },
    { tarea: "Interruptor de seguridad (llave)", desc: "Funcionamiento normal.", tipo: "check" },
    { tarea: "Luces de emisión de rayos", desc: "Se encienden al emitir.", tipo: "check" },
  ]},
  { seccion: "Sensores y transmisión", items: [
    { tarea: "Sensores fotoeléctricos", desc: "Funcionamiento normal.", tipo: "check" },
    { tarea: "Cinta transportadora", desc: "Sin daños.", tipo: "check" },
    { tarea: "Correa", desc: "Verificar desviación.", tipo: "check" },
    { tarea: "Rodillos eléctricos", desc: "Sin sonidos anormales.", tipo: "check" },
  ]},
  { seccion: "Generador de Rayos X", items: [
    { tarea: "Detectores de curva", desc: "Funcionamiento correcto.", tipo: "check" },
    { tarea: "Estado del generador", desc: "Tensión y corriente estables.", tipo: "check" },
    { tarea: "Tensión de tubo", desc: "", tipo: "numero", unidad: "kV" },
    { tarea: "Corriente de tubo", desc: "", tipo: "numero", unidad: "mA" },
    { tarea: "Horas de generador", desc: "Máximo 5000 hrs.", tipo: "numero", unidad: "Hrs" },
    { tarea: "Modelo del generador", desc: "", tipo: "check" },
    { tarea: "Serie del tubo", desc: "", tipo: "check" },
    { tarea: "Serie del generador", desc: "", tipo: "check" },
  ]},
  { seccion: "Software y autodiagnóstico", items: [
    { tarea: "Versión software", desc: "", tipo: "texto" },
    { tarea: "Prueba de autodiagnóstico", desc: "Sin errores.", tipo: "check" },
  ]},
  { seccion: "Calidad de la imagen", items: [
    { tarea: "Dirección de desplazamiento", desc: "Bobina consistente.", tipo: "check" },
    { tarea: "Color", desc: "Orgánicos/inorgánicos correctos.", tipo: "check" },
    { tarea: "Sincronización de imagen", desc: "Simultánea al escaneo.", tipo: "check" },
    { tarea: "Cortes en la imagen", desc: "Sin cortes.", tipo: "check" },
    { tarea: "Suciedad en la imagen", desc: "Sin suciedades.", tipo: "check" },
  ]},
  { seccion: "Estadísticas del equipo", items: [
    { tarea: "Equipaje inspeccionado", desc: "Total aprox.", tipo: "numero", unidad: "unid." },
    { tarea: "Tiempo máquina encendida", desc: "Total aprox.", tipo: "numero", unidad: "Hrs" },
  ]},
];

const CHECKLIST_MDS = [
  { seccion: "Inspección general", items: [
    { tarea: "Inspección visual del pórtico", desc: "Sin daños físicos.", tipo: "check" },
    { tarea: "Limpieza exterior", desc: "Libre de polvo y suciedad.", tipo: "check" },
    { tarea: "Panel de control", desc: "Funcionamiento correcto.", tipo: "check" },
    { tarea: "Indicadores LED", desc: "Todos operativos.", tipo: "check" },
  ]},
  { seccion: "Seguridad eléctrica", items: [
    { tarea: "Fuente de alimentación", desc: "Dentro de parámetros.", tipo: "check" },
    { tarea: "Cables y conexiones", desc: "Buen estado.", tipo: "check" },
    { tarea: "Puesta a tierra", desc: "Conexión correcta.", tipo: "check" },
  ]},
  { seccion: "Calibración y detección", items: [
    { tarea: "Prueba con pieza de testeo", desc: "Detecta correctamente.", tipo: "check" },
    { tarea: "Sensibilidad", desc: "Dentro de parámetros.", tipo: "check" },
    { tarea: "Alarma sonora", desc: "Funciona correctamente.", tipo: "check" },
    { tarea: "Alarma visual", desc: "Funciona correctamente.", tipo: "check" },
    { tarea: "Nivel de sensibilidad configurado", desc: "", tipo: "texto" },
  ]},
];

const TIPOS_SERVICIO = ["Preventivo", "Correctivo", "Instalación", "Desinstalación", "Diagnóstico", "Medición Radiación"];

function SignaturePad({ onSave, label }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSig, setHasSig] = useState(false);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    c.width = c.offsetWidth * 2; c.height = c.offsetHeight * 2;
    const ctx = c.getContext("2d"); ctx.scale(2, 2);
    ctx.strokeStyle = "#1a1a1a"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.lineJoin = "round";
  }, []);
  const getP = (e) => { const r = canvasRef.current.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return { x: t.clientX - r.left, y: t.clientY - r.top }; };
  const start = (e) => { e.preventDefault(); setDrawing(true); setHasSig(true); const ctx = canvasRef.current.getContext("2d"); const p = getP(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
  const draw = (e) => { if (!drawing) return; e.preventDefault(); const ctx = canvasRef.current.getContext("2d"); const p = getP(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
  const stop = () => { setDrawing(false); if (hasSig && onSave) onSave(canvasRef.current.toDataURL()); };
  const clear = () => { const c = canvasRef.current; c.getContext("2d").clearRect(0, 0, c.width, c.height); setHasSig(false); if (onSave) onSave(null); };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#555" }}>{label}</span>
        <button onClick={clear} style={{ fontSize: 12, color: "#999", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Limpiar</button>
      </div>
      <canvas ref={canvasRef} style={{ width: "100%", height: 120, border: "1.5px dashed #ccc", borderRadius: 8, cursor: "crosshair", touchAction: "none", background: "#fafafa" }}
        onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop} onTouchStart={start} onTouchMove={draw} onTouchEnd={stop} />
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState(0);
  const [clientes, setClientes] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [equipoId, setEquipoId] = useState("");
  const [tipoServicio, setTipoServicio] = useState("Preventivo");
  const [checklist, setChecklist] = useState([]);
  const [fotos, setFotos] = useState([]);
  const [observaciones, setObservaciones] = useState("");
  const [firmaTec, setFirmaTec] = useState(null);
  const [firmaCli, setFirmaCli] = useState(null);
  const [nombreFirm, setNombreFirm] = useState("");
  const [cargoFirm, setCargoFirm] = useState("");
  const [fechaInicio] = useState(new Date());
  const [otNumber, setOtNumber] = useState("...");
  const [expandedSec, setExpandedSec] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dbStatus, setDbStatus] = useState("connecting");
  const [servicioId, setServicioId] = useState(null);

  const cliente = clientes.find((c) => String(c.id) === clienteId);
  const equipo = equipos.find((e) => String(e.id) === equipoId);

  const steps = ["Servicio", "Checklist", "Fotos", "Observaciones", "Firma"];

  useEffect(() => {
    sbFetch("clientes", "select=*&order=nombre_fantasia.asc&activo=eq.true")
      .then((data) => {
        if (Array.isArray(data)) {
          setClientes(data.filter(c => c.id !== 0));
          setDbStatus("connected");
        } else {
          setDbStatus("error");
        }
        setLoading(false);
      })
      .catch(() => { setDbStatus("error"); setLoading(false); });
  }, []);

  useEffect(() => {
    if (clienteId) {
      sbFetch("equipos", `select=*&cliente_id=eq.${clienteId}&order=modelo.asc`)
        .then((data) => { if (Array.isArray(data)) setEquipos(data); });
    } else {
      setEquipos([]);
    }
    setEquipoId("");
  }, [clienteId]);

  useEffect(() => {
    if (equipo) {
      const tpl = equipo.tipo_equipo === "MDS" ? CHECKLIST_MDS : CHECKLIST_CXS;
      const items = tpl.flatMap((sec, si) =>
        sec.items.map((it, ii) => ({ seccion: sec.seccion, tarea: it.tarea, desc: it.desc, tipo: it.tipo, unidad: it.unidad || "", resultado: "", observacion: "", valor: "", orden: si * 100 + ii }))
      );
      setChecklist(items);
      const exp = {};
      tpl.forEach((s) => { exp[s.seccion] = true; });
      setExpandedSec(exp);
    }
  }, [equipo]);

  const updateItem = (idx, field, value) => setChecklist((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));

  const handleFoto = (e) => {
    Array.from(e.target.files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setFotos((prev) => [...prev, { url: ev.target.result, desc: "" }]);
      reader.readAsDataURL(file);
    });
  };

  const secciones = [...new Set(checklist.map((it) => it.seccion))];
  const completados = checklist.filter((it) => it.tipo === "check" ? it.resultado : it.valor).length;
  const totalItems = checklist.length;
  const canNext = () => { if (step === 0) return clienteId && equipoId; return true; };

  const saveOT = async () => {
    setSaving(true);
    try {
      const srvData = {
        equipo_id: parseInt(equipoId),
        cliente_id: parseInt(clienteId),
        tipo_servicio: tipoServicio,
        estado: "Completado",
        fecha_inicio: fechaInicio.toISOString(),
        fecha_fin: new Date().toISOString(),
        tecnico: "Marcelo Ignacio Muñoz Schaff",
        observaciones: observaciones,
        equipo_operativo: true,
      };
      const srvRes = await sbInsert("servicios", srvData);
      if (srvRes && srvRes.length > 0) {
        const srv = srvRes[0];
        setOtNumber(srv.numero_ot);
        setServicioId(srv.id);

        const checkData = checklist.map((it) => ({
          servicio_id: srv.id,
          seccion: it.seccion,
          tarea: it.tarea,
          descripcion: it.desc,
          tipo: it.tipo,
          unidad: it.unidad,
          resultado: it.resultado,
          valor: it.valor,
          observacion: it.observacion,
          orden: it.orden,
        }));
        await sbInsert("checklist_items", checkData);

        const firmaData = {
          servicio_id: srv.id,
          firma_tecnico: firmaTec,
          nombre_tecnico: "Marcelo Ignacio Muñoz Schaff",
          firma_cliente: firmaCli,
          nombre_cliente: nombreFirm,
          cargo_cliente: cargoFirm,
        };
        await sbInsert("firmas", firmaData);

        setSaved(true);
      }
    } catch (err) {
      alert("Error al guardar: " + err.message);
    }
    setSaving(false);
  };

  const ac = "#0f6e56"; const acL = "#e1f5ee"; const acD = "#085041";
  const brd = "#e2e0d8"; const bg = "#ffffff"; const tp = "#2c2c2a"; const ts = "#5f5e5a"; const tt = "#888780";
  const inp = { width: "100%", padding: "10px 12px", border: `1px solid ${brd}`, borderRadius: 8, fontSize: 14, color: tp, background: "#fff", outline: "none", boxSizing: "border-box" };
  const btnP = { padding: "10px 24px", background: ac, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer" };
  const btnS = { padding: "10px 24px", background: "transparent", color: ts, border: `1px solid ${brd}`, borderRadius: 8, fontSize: 14, cursor: "pointer" };
  const card = { background: bg, border: `1px solid ${brd}`, borderRadius: 12, padding: 20, marginBottom: 16 };
  const toggleSec = (sec) => setExpandedSec((p) => ({ ...p, [sec]: !p[sec] }));

  if (loading) return (
    <div style={{ maxWidth: 640, margin: "40px auto", textAlign: "center", fontFamily: "system-ui", color: tt }}>
      <div style={{ fontSize: 15 }}>Conectando con Supabase...</div>
    </div>
  );

  if (dbStatus === "error") return (
    <div style={{ maxWidth: 640, margin: "40px auto", textAlign: "center", fontFamily: "system-ui", color: "#a32d2d" }}>
      <div style={{ fontSize: 15 }}>Error de conexión con la base de datos.</div>
      <div style={{ fontSize: 13, marginTop: 8, color: tt }}>Verifica tu conexión a internet.</div>
    </div>
  );

  if (saved) return (
    <div style={{ maxWidth: 640, margin: "0 auto", fontFamily: "system-ui", color: tp }}>
      <div style={{ ...card, background: acL, borderColor: ac + "33", textAlign: "center", padding: 40 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: ac, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, color: acD, marginBottom: 8 }}>{otNumber}</div>
        <div style={{ fontSize: 14, color: acD, marginBottom: 4 }}>Orden de trabajo guardada exitosamente</div>
        <div style={{ fontSize: 13, color: acD, opacity: 0.7 }}>{cliente?.nombre_fantasia} — {equipo?.modelo} {equipo?.marca}</div>
        <div style={{ fontSize: 12, color: acD, opacity: 0.5, marginTop: 4 }}>{fechaInicio.toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
      </div>
      <div style={{ ...card }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: tp, marginBottom: 12 }}>Resumen guardado</div>
        <div style={{ fontSize: 13, color: ts, lineHeight: 1.8 }}>
          <div><span style={{ opacity: 0.6 }}>Tipo:</span> {tipoServicio}</div>
          <div><span style={{ opacity: 0.6 }}>Checklist:</span> {completados}/{totalItems} completados</div>
          <div><span style={{ opacity: 0.6 }}>Observaciones:</span> {checklist.filter(c => c.resultado === "Obs.").length} ítems</div>
          <div><span style={{ opacity: 0.6 }}>Fotos:</span> {fotos.length} adjuntas</div>
          <div><span style={{ opacity: 0.6 }}>Firmado por:</span> {nombreFirm || "—"} ({cargoFirm || "—"})</div>
        </div>
      </div>
      <button onClick={() => { setSaved(false); setStep(0); setClienteId(""); setEquipoId(""); setChecklist([]); setFotos([]); setObservaciones(""); setFirmaTec(null); setFirmaCli(null); setNombreFirm(""); setCargoFirm(""); }}
        style={{ ...btnP, width: "100%", padding: 14, fontSize: 15 }}>
        Nueva orden de trabajo
      </button>
    </div>
  );

  const renderStep0 = () => (
    <div>
      <div style={{ ...card, borderLeft: `4px solid ${ac}`, borderRadius: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: tp }}>Nueva orden de trabajo</div>
          <div style={{ fontSize: 11, color: ac, background: acL, padding: "3px 10px", borderRadius: 20 }}>
            {clientes.length} clientes cargados
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, color: ts, display: "block", marginBottom: 4 }}>Cliente</label>
          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} style={inp}>
            <option value="">Seleccionar cliente...</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre_fantasia || c.nombre} — {c.zona}</option>)}
          </select>
        </div>
        {clienteId && (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, color: ts, display: "block", marginBottom: 4 }}>Equipo</label>
              <select value={equipoId} onChange={(e) => setEquipoId(e.target.value)} style={inp}>
                <option value="">Seleccionar equipo... ({equipos.length} disponibles)</option>
                {equipos.map((eq) => <option key={eq.id} value={eq.id}>{eq.modelo} — {eq.marca} (S/N: {eq.sn_equipo || "N/D"}) [{eq.tipo_equipo}]</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, color: ts, display: "block", marginBottom: 4 }}>Tipo de servicio</label>
              <select value={tipoServicio} onChange={(e) => setTipoServicio(e.target.value)} style={inp}>
                {TIPOS_SERVICIO.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </>
        )}
      </div>
      {cliente && (
        <div style={{ ...card, background: "#E6F1FB", borderColor: "#185FA533" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#0C447C", marginBottom: 8 }}>Datos del cliente</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", fontSize: 13, color: "#0C447C" }}>
            <div><span style={{ opacity: 0.6 }}>Nombre:</span> {cliente.nombre}</div>
            <div><span style={{ opacity: 0.6 }}>Fantasía:</span> {cliente.nombre_fantasia}</div>
            {cliente.rut && <div><span style={{ opacity: 0.6 }}>RUT:</span> {cliente.rut}</div>}
            <div><span style={{ opacity: 0.6 }}>Ciudad:</span> {cliente.ciudad}</div>
            <div><span style={{ opacity: 0.6 }}>Dirección:</span> {cliente.direccion}</div>
            <div><span style={{ opacity: 0.6 }}>Zona:</span> {cliente.zona}</div>
            {cliente.nombre_contacto && <div><span style={{ opacity: 0.6 }}>Contacto:</span> {cliente.nombre_contacto}</div>}
            {cliente.telefono && <div><span style={{ opacity: 0.6 }}>Teléfono:</span> {cliente.telefono}</div>}
          </div>
          {cliente.comentarios && cliente.comentarios !== "-" && (
            <div style={{ marginTop: 8, padding: "8px 10px", background: "#B5D4F433", borderRadius: 6, fontSize: 12, color: "#0C447C" }}>
              {cliente.comentarios}
            </div>
          )}
        </div>
      )}
      {equipo && (
        <div style={{ ...card, background: acL, borderColor: ac + "33" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: acD, marginBottom: 8 }}>Ficha del equipo</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", fontSize: 13, color: acD }}>
            <div><span style={{ opacity: 0.6 }}>Modelo:</span> {equipo.modelo}</div>
            <div><span style={{ opacity: 0.6 }}>Marca:</span> {equipo.marca}</div>
            <div><span style={{ opacity: 0.6 }}>Serie:</span> {equipo.sn_equipo || "N/D"}</div>
            <div><span style={{ opacity: 0.6 }}>Tipo:</span> {equipo.tipo_equipo}</div>
            <div><span style={{ opacity: 0.6 }}>Clasificación:</span> {equipo.clasificacion}</div>
            {equipo.clasificacion2 && <div><span style={{ opacity: 0.6 }}>Categoría:</span> {equipo.clasificacion2}</div>}
            {equipo.ciudad && <div><span style={{ opacity: 0.6 }}>Ciudad:</span> {equipo.ciudad}</div>}
            {equipo.ubicacion_equipo && <div><span style={{ opacity: 0.6 }}>Ubicación:</span> {equipo.ubicacion_equipo}</div>}
            {equipo.tension_tubo && <div><span style={{ opacity: 0.6 }}>Tensión tubo:</span> {equipo.tension_tubo}</div>}
            {equipo.corriente_tubo && <div><span style={{ opacity: 0.6 }}>Corriente tubo:</span> {equipo.corriente_tubo}</div>}
            {equipo.marca_tubo && <div><span style={{ opacity: 0.6 }}>Marca tubo:</span> {equipo.marca_tubo}</div>}
            {equipo.nro_serie_generador && <div><span style={{ opacity: 0.6 }}>Serie generador:</span> {equipo.nro_serie_generador}</div>}
            {equipo.nro_serie_tubo && <div><span style={{ opacity: 0.6 }}>Serie tubo:</span> {equipo.nro_serie_tubo}</div>}
            {equipo.anio_fabricacion && <div><span style={{ opacity: 0.6 }}>Año fabricación:</span> {equipo.anio_fabricacion}</div>}
          </div>
        </div>
      )}
    </div>
  );

  const renderCheckItem = (it, idx) => {
    if (it.tipo === "check") {
      return (
        <div key={idx} style={{ padding: "10px 0", borderBottom: "1px solid #f0eeea" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: tp }}>{it.tarea}</div>
              {it.desc && <div style={{ fontSize: 12, color: tt, marginTop: 2 }}>{it.desc}</div>}
            </div>
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              {["OK", "Obs.", "N/A"].map((r) => (
                <button key={r} onClick={() => updateItem(idx, "resultado", r)} style={{
                  padding: "4px 10px", fontSize: 12, fontWeight: 500, borderRadius: 6, cursor: "pointer",
                  border: `1px solid ${it.resultado === r ? (r === "OK" ? ac : r === "Obs." ? "#ba7517" : "#888") : brd}`,
                  background: it.resultado === r ? (r === "OK" ? acL : r === "Obs." ? "#faeeda" : "#f1efe8") : "#fff",
                  color: it.resultado === r ? (r === "OK" ? acD : r === "Obs." ? "#633806" : "#444") : tt,
                }}>{r}</button>
              ))}
            </div>
          </div>
          {it.resultado === "Obs." && (
            <input type="text" placeholder="Detallar observación..." value={it.observacion}
              onChange={(e) => updateItem(idx, "observacion", e.target.value)}
              style={{ ...inp, marginTop: 8, fontSize: 13, borderColor: "#ba751744" }} />
          )}
        </div>
      );
    }
    if (it.tipo === "numero") {
      return (
        <div key={idx} style={{ padding: "10px 0", borderBottom: "1px solid #f0eeea" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: tp }}>{it.tarea}</div>
              {it.desc && <div style={{ fontSize: 12, color: tt, marginTop: 2 }}>{it.desc}</div>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <input type="number" step="any" placeholder="—" value={it.valor}
                onChange={(e) => updateItem(idx, "valor", e.target.value)}
                style={{ width: 90, padding: "6px 10px", border: `1px solid ${it.valor ? ac : brd}`, borderRadius: 6, fontSize: 14, fontWeight: 500, color: tp, textAlign: "right", outline: "none", background: it.valor ? acL : "#fff" }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: it.valor ? acD : tt, minWidth: 32 }}>{it.unidad}</span>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div key={idx} style={{ padding: "10px 0", borderBottom: "1px solid #f0eeea" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: tp }}>{it.tarea}</div>
          </div>
          <input type="text" placeholder="Ingresar..." value={it.valor}
            onChange={(e) => updateItem(idx, "valor", e.target.value)}
            style={{ width: 160, padding: "6px 10px", border: `1px solid ${it.valor ? ac : brd}`, borderRadius: 6, fontSize: 13, color: tp, outline: "none", background: it.valor ? acL : "#fff" }} />
        </div>
      </div>
    );
  };

  const renderStep1 = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: ts }}>{completados} de {totalItems} completados</span>
        <div style={{ width: 120, height: 6, background: "#e8e6df", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ width: `${(completados / totalItems) * 100}%`, height: "100%", background: ac, borderRadius: 3, transition: "width 0.3s" }} />
        </div>
      </div>
      {secciones.map((sec) => {
        const items = checklist.filter((it) => it.seccion === sec);
        const startIdx = checklist.indexOf(items[0]);
        const secDone = items.filter((it) => it.tipo === "check" ? it.resultado : it.valor).length;
        const isOpen = expandedSec[sec];
        return (
          <div key={sec} style={{ ...card, padding: 0, overflow: "hidden" }}>
            <button onClick={() => toggleSec(sec)} style={{
              width: "100%", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "none", border: "none", cursor: "pointer", borderBottom: isOpen ? `1px solid ${brd}` : "none",
            }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: tp }}>{sec}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: secDone === items.length ? ac : tt }}>{secDone}/{items.length}</span>
                <span style={{ fontSize: 12, color: tt, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>&#9660;</span>
              </div>
            </button>
            {isOpen && <div style={{ padding: "0 20px 10px" }}>{items.map((it, i) => renderCheckItem(it, startIdx + i))}</div>}
          </div>
        );
      })}
    </div>
  );

  const renderStep2 = () => (
    <div>
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12, color: tp }}>Registro fotográfico</div>
        <label style={{ ...btnS, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
          Tomar / subir foto
          <input type="file" accept="image/*" capture="environment" multiple onChange={handleFoto} style={{ display: "none" }} />
        </label>
      </div>
      {fotos.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {fotos.map((f, i) => (
            <div key={i} style={{ ...card, padding: 0, overflow: "hidden", marginBottom: 0 }}>
              <img src={f.url} alt="" style={{ width: "100%", height: 140, objectFit: "cover" }} />
              <div style={{ padding: 10 }}>
                <input type="text" placeholder="Descripción..." value={f.desc}
                  onChange={(e) => setFotos((p) => p.map((x, j) => j === i ? { ...x, desc: e.target.value } : x))}
                  style={{ ...inp, fontSize: 12, padding: "6px 8px" }} />
                <button onClick={() => setFotos((p) => p.filter((_, j) => j !== i))} style={{ fontSize: 11, color: "#a32d2d", background: "none", border: "none", cursor: "pointer", marginTop: 4 }}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      ) : <div style={{ textAlign: "center", padding: 40, color: tt, fontSize: 13 }}>Aún no has agregado fotos.</div>}
    </div>
  );

  const renderStep3 = () => (
    <div style={card}>
      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 12, color: tp }}>Observaciones y resultados</div>
      <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
        placeholder="Observaciones generales, recomendaciones, hallazgos..." style={{ ...inp, minHeight: 160, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }} />
    </div>
  );

  const renderStep4 = () => {
    const numItems = checklist.filter((it) => (it.tipo === "numero" || it.tipo === "texto") && it.valor);
    return (
      <div>
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16, color: tp }}>Cierre y firmas</div>
          <SignaturePad label="Firma del técnico" onSave={setFirmaTec} />
          <div style={{ height: 1, background: brd, margin: "20px 0" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 13, color: ts, display: "block", marginBottom: 4 }}>Nombre de quien recibe</label>
              <input value={nombreFirm} onChange={(e) => setNombreFirm(e.target.value)} placeholder="Nombre completo" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: ts, display: "block", marginBottom: 4 }}>Cargo</label>
              <input value={cargoFirm} onChange={(e) => setCargoFirm(e.target.value)} placeholder="Ej: Jefe de seguridad" style={inp} />
            </div>
          </div>
          <SignaturePad label="Firma del cliente" onSave={setFirmaCli} />
        </div>

        <div style={{ ...card, background: acL, borderColor: ac + "33" }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: acD, marginBottom: 10 }}>Resumen del servicio</div>
          <div style={{ fontSize: 13, color: acD, lineHeight: 1.8 }}>
            <div><span style={{ opacity: 0.6 }}>Cliente:</span> {cliente?.nombre_fantasia}</div>
            <div><span style={{ opacity: 0.6 }}>Equipo:</span> {equipo?.modelo} — {equipo?.marca} (S/N: {equipo?.sn_equipo || "N/D"})</div>
            <div><span style={{ opacity: 0.6 }}>Clasificación:</span> {equipo?.clasificacion} / {equipo?.tipo_equipo}</div>
            <div><span style={{ opacity: 0.6 }}>Tipo:</span> {tipoServicio}</div>
            <div><span style={{ opacity: 0.6 }}>Checklist:</span> {completados}/{totalItems}</div>
            <div><span style={{ opacity: 0.6 }}>Fotos:</span> {fotos.length}</div>
            <div><span style={{ opacity: 0.6 }}>Técnico:</span> Marcelo Ignacio Muñoz Schaff</div>
          </div>
          {numItems.length > 0 && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${ac}33` }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: acD, marginBottom: 6, opacity: 0.7 }}>Mediciones registradas</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", fontSize: 12, color: acD }}>
                {numItems.map((it, i) => <div key={i}><span style={{ opacity: 0.6 }}>{it.tarea}:</span> {it.valor} {it.unidad}</div>)}
              </div>
            </div>
          )}
        </div>

        <button onClick={saveOT} disabled={!firmaCli || !firmaTec || saving}
          style={{ ...btnP, width: "100%", padding: 14, fontSize: 15, opacity: firmaCli && firmaTec && !saving ? 1 : 0.4 }}>
          {saving ? "Guardando en Supabase..." : "Cerrar OT y guardar"}
        </button>
      </div>
    );
  };

  const renderContent = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4];

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", fontFamily: "system-ui, sans-serif", color: tp }}>
      <div style={{ padding: "16px 0 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${brd}`, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: tp, letterSpacing: "-0.3px" }}>Orden de trabajo</div>
          <div style={{ fontSize: 12, color: tt, marginTop: 2 }}>
            {fechaInicio.toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: dbStatus === "connected" ? ac : "#a32d2d" }} />
          <span style={{ fontSize: 11, color: tt }}>Supabase</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {steps.map((s, i) => (
          <button key={i} onClick={() => i <= step && setStep(i)} style={{
            flex: 1, padding: "8px 4px", fontSize: 11, fontWeight: 500, border: "none", borderRadius: 6,
            cursor: i <= step ? "pointer" : "default",
            background: i === step ? ac : i < step ? acL : "#f1efe8",
            color: i === step ? "#fff" : i < step ? acD : tt,
          }}>{s}</button>
        ))}
      </div>

      {renderContent[step]()}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, paddingTop: 16, borderTop: `1px solid ${brd}` }}>
        <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} style={{ ...btnS, opacity: step === 0 ? 0.3 : 1 }}>Anterior</button>
        {step < steps.length - 1 && (
          <button onClick={() => canNext() && setStep(step + 1)} style={{ ...btnP, opacity: canNext() ? 1 : 0.4 }} disabled={!canNext()}>Siguiente</button>
        )}
      </div>
    </div>
  );
}
