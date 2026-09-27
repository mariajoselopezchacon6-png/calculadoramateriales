import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  nombre: string;
  usuario: string;
  password: string;
  rol: "Usuario" | "Administrador";
}

type View =
  | "login"
  | "registro"
  | "menu"
  | "muro"
  | "viga"
  | "columna"
  | "contrapiso"
  | "techo"
  | "pisos"
  | "pintura";

// ─── Utility functions (internal, not shown in menu) ─────────────────────────

function calcularSuperficie(ancho: number, largo: number) {
  return ancho * largo;
}

function calcularVolumen(espesor: number, ancho: number, largo: number) {
  return espesor * ancho * largo;
}

function fmt(n: number) {
  return n.toFixed(2);
}

// ─── Local storage helpers ────────────────────────────────────────────────────

function getUsers(): User[] {
  try {
    return JSON.parse(localStorage.getItem("calc_users") || "[]");
  } catch {
    return [];
  }
}

function saveUsers(users: User[]) {
  localStorage.setItem("calc_users", JSON.stringify(users));
}

// ─── Shared components ────────────────────────────────────────────────────────

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#111827", fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer
      className="text-center py-6 px-4 mt-8"
      style={{
        background: "#0a0f1a",
        borderTop: "2px solid #f59e0b",
      }}
    >
      <p
        className="text-sm font-semibold tracking-wide mb-1"
        style={{ color: "#f59e0b", fontFamily: "'Outfit', sans-serif" }}
      >
        Fundación Escuela Tecnológica Jesús Oviedo Pérez
      </p>
      <p className="text-xs mb-0.5" style={{ color: "#9ca3af" }}>
        Ingeniería de Software – Interfaces I
      </p>
      <p className="text-xs" style={{ color: "#6b7280" }}>
        Proyecto práctico – Calculadora de Materiales de Construcción
      </p>
    </footer>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 active:scale-95"
      style={{
        background: "#1f2937",
        color: "#9ca3af",
        border: "1px solid #374151",
      }}
    >
      ← Volver al menú
    </button>
  );
}

function ResultCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div
      className="flex items-center justify-between p-4 rounded-xl"
      style={{ background: "#1f2937", border: "1px solid #374151" }}
    >
      <span className="text-sm font-medium" style={{ color: "#9ca3af" }}>
        {label}
      </span>
      <span
        className="text-lg font-bold tracking-tight"
        style={{ color: "#f59e0b", fontFamily: "'Outfit', sans-serif" }}
      >
        {value}{" "}
        <span className="text-xs font-normal" style={{ color: "#6b7280" }}>
          {unit}
        </span>
      </span>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium" style={{ color: "#d1d5db" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="px-4 py-3 rounded-xl text-sm outline-none transition-all"
        style={{
          background: "#1f2937",
          border: "1px solid #374151",
          color: "#f9fafb",
          fontFamily: "'DM Sans', sans-serif",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#f59e0b";
          e.target.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.15)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#374151";
          e.target.style.boxShadow = "none";
        }}
      />
    </div>
  );
}

function Alert({
  msg,
  type,
}: {
  msg: string;
  type: "error" | "success" | "warning";
}) {
  const colors = {
    error: { bg: "#450a0a", border: "#ef4444", text: "#fca5a5" },
    success: { bg: "#052e16", border: "#22c55e", text: "#86efac" },
    warning: { bg: "#431407", border: "#f97316", text: "#fdba74" },
  };
  const c = colors[type];
  return (
    <div
      className="px-4 py-3 rounded-xl text-sm font-medium"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
    >
      {msg}
    </div>
  );
}

function CalcButton({
  onClick,
  label,
  variant = "primary",
}: {
  onClick: () => void;
  label: string;
  variant?: "primary" | "secondary" | "danger";
}) {
  const styles = {
    primary: {
      background: "#f59e0b",
      color: "#111827",
      border: "none",
    },
    secondary: {
      background: "#1f2937",
      color: "#d1d5db",
      border: "1px solid #374151",
    },
    danger: {
      background: "#7f1d1d",
      color: "#fca5a5",
      border: "1px solid #ef4444",
    },
  };
  return (
    <button
      onClick={onClick}
      className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95"
      style={styles[variant]}
    >
      {label}
    </button>
  );
}

// ─── Screen: Login ────────────────────────────────────────────────────────────

function LoginScreen({
  onLogin,
  onGoRegister,
}: {
  onLogin: (user: User) => void;
  onGoRegister: () => void;
}) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin() {
    if (!usuario.trim() || !password.trim()) {
      setError("Por favor completa todos los campos.");
      return;
    }
    const users = getUsers();
    const found = users.find(
      (u) => u.usuario === usuario.trim() && u.password === password
    );
    if (!found) {
      setError("Usuario o contraseña incorrectos.");
      return;
    }
    setError("");
    onLogin(found);
  }

  return (
    <PageWrapper>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Logo / Branding */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{ background: "#f59e0b" }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#111827"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "#f9fafb", fontFamily: "'Outfit', sans-serif" }}
            >
              Calculadora de
            </h1>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "#f59e0b", fontFamily: "'Outfit', sans-serif" }}
            >
              Materiales de Construcción
            </h1>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl p-8 flex flex-col gap-5"
            style={{
              background: "#1f2937",
              border: "1px solid #374151",
              boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
            }}
          >
            <h2
              className="text-lg font-semibold"
              style={{ color: "#f9fafb", fontFamily: "'Outfit', sans-serif" }}
            >
              Iniciar sesión
            </h2>

            {error && <Alert msg={error} type="error" />}

            <InputField
              label="Usuario"
              value={usuario}
              onChange={setUsuario}
              placeholder="Tu nombre de usuario"
            />
            <InputField
              label="Contraseña"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              type="password"
            />

            <button
              onClick={handleLogin}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105 active:scale-95 mt-1"
              style={{
                background: "#f59e0b",
                color: "#111827",
                fontFamily: "'Outfit', sans-serif",
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            >
              Iniciar sesión
            </button>

            <div
              className="text-center pt-1 border-t"
              style={{ borderColor: "#374151" }}
            >
              <p className="text-sm mb-3" style={{ color: "#6b7280" }}>
                ¿No tienes cuenta?
              </p>
              <button
                onClick={onGoRegister}
                className="w-full py-2.5 rounded-xl font-medium text-sm transition-all hover:scale-105 active:scale-95"
                style={{
                  background: "transparent",
                  color: "#f59e0b",
                  border: "1px solid #f59e0b",
                }}
              >
                Registrarse
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

// ─── Screen: Register ─────────────────────────────────────────────────────────

function RegisterScreen({
  onGoLogin,
}: {
  onGoLogin: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<"Usuario" | "Administrador">("Usuario");
  const [msg, setMsg] = useState<{ text: string; type: "error" | "success" | "warning" } | null>(null);

  function handleRegister() {
    if (!nombre.trim() || !usuario.trim() || !password.trim()) {
      setMsg({ text: "Por favor completa todos los campos.", type: "error" });
      return;
    }
    if (password.length < 4) {
      setMsg({ text: "La contraseña debe tener al menos 4 caracteres.", type: "warning" });
      return;
    }
    const users = getUsers();
    if (users.find((u) => u.usuario === usuario.trim())) {
      setMsg({ text: "El usuario ya existe. Elige otro.", type: "error" });
      return;
    }
    const newUser: User = {
      nombre: nombre.trim(),
      usuario: usuario.trim(),
      password,
      rol,
    };
    saveUsers([...users, newUser]);
    setMsg({ text: "¡Registro exitoso! Ya puedes iniciar sesión.", type: "success" });
    setTimeout(() => onGoLogin(), 1800);
  }

  return (
    <PageWrapper>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{ background: "#f59e0b" }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#111827"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "#f9fafb", fontFamily: "'Outfit', sans-serif" }}
            >
              Crear cuenta
            </h1>
          </div>

          <div
            className="rounded-2xl p-8 flex flex-col gap-5"
            style={{
              background: "#1f2937",
              border: "1px solid #374151",
              boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
            }}
          >
            {msg && <Alert msg={msg.text} type={msg.type} />}

            <InputField
              label="Nombre completo"
              value={nombre}
              onChange={setNombre}
              placeholder="Tu nombre completo"
            />
            <InputField
              label="Usuario"
              value={usuario}
              onChange={setUsuario}
              placeholder="Nombre de usuario único"
            />
            <InputField
              label="Contraseña"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              type="password"
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: "#d1d5db" }}>
                Perfil / Rol
              </label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value as "Usuario" | "Administrador")}
                className="px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "#111827",
                  border: "1px solid #374151",
                  color: "#f9fafb",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <option value="Usuario">Usuario</option>
                <option value="Administrador">Administrador</option>
              </select>
            </div>

            <button
              onClick={handleRegister}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105 active:scale-95 mt-1"
              style={{
                background: "#f59e0b",
                color: "#111827",
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              Registrarse
            </button>

            <div
              className="text-center pt-1 border-t"
              style={{ borderColor: "#374151" }}
            >
              <button
                onClick={onGoLogin}
                className="text-sm transition-colors hover:underline"
                style={{ color: "#f59e0b" }}
              >
                ← Volver al inicio de sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

// ─── Screen: Main Menu ────────────────────────────────────────────────────────

const menuItems = [
  { id: "muro", num: 1, label: "Calcular muro de ladrillo", icon: "🧱" },
  { id: "viga", num: 2, label: "Calcular viga de hormigón", icon: "🏗️" },
  { id: "columna", num: 3, label: "Calcular columna de hormigón", icon: "🏛️" },
  { id: "contrapiso", num: 4, label: "Calcular contrapisos", icon: "⬛" },
  { id: "techo", num: 5, label: "Calcular techo", icon: "🏠" },
  { id: "pisos", num: 6, label: "Calcular pisos", icon: "🔲" },
  { id: "pintura", num: 7, label: "Calcular pintura", icon: "🖌️" },
  { id: "salir", num: 8, label: "Salir", icon: "🚪" },
];

function MainMenu({
  user,
  onNavigate,
  onLogout,
}: {
  user: User;
  onNavigate: (v: View) => void;
  onLogout: () => void;
}) {
  function handleClick(id: string) {
    if (id === "salir") {
      onLogout();
    } else {
      onNavigate(id as View);
    }
  }

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div
          className="flex items-center justify-between mb-8 p-5 rounded-2xl"
          style={{ background: "#1f2937", border: "1px solid #374151" }}
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: "#f59e0b" }}>
              Bienvenido
            </p>
            <h2
              className="text-xl font-bold"
              style={{ color: "#f9fafb", fontFamily: "'Outfit', sans-serif" }}
            >
              {user.nombre}
            </h2>
            <span
              className="inline-block text-xs px-2.5 py-1 rounded-full font-medium mt-1"
              style={{
                background: user.rol === "Administrador" ? "#422006" : "#1c1917",
                color: user.rol === "Administrador" ? "#fbbf24" : "#a8a29e",
                border: `1px solid ${user.rol === "Administrador" ? "#f59e0b" : "#44403c"}`,
              }}
            >
              {user.rol}
            </span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
            style={{
              background: "#111827",
              color: "#9ca3af",
              border: "1px solid #374151",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Cerrar sesión
          </button>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h1
            className="text-3xl font-extrabold tracking-tight"
            style={{ color: "#f9fafb", fontFamily: "'Outfit', sans-serif" }}
          >
            Menú Principal
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
            Selecciona el módulo de cálculo que necesitas
          </p>
        </div>

        {/* Menu grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: item.id === "salir" ? "#1a0a0a" : "#1f2937",
                border: `1px solid ${item.id === "salir" ? "#7f1d1d" : "#374151"}`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  item.id === "salir" ? "#ef4444" : "#f59e0b";
                (e.currentTarget as HTMLElement).style.background =
                  item.id === "salir" ? "#27000a" : "#263040";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  item.id === "salir" ? "#7f1d1d" : "#374151";
                (e.currentTarget as HTMLElement).style.background =
                  item.id === "salir" ? "#1a0a0a" : "#1f2937";
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{
                  background: item.id === "salir" ? "#450a0a" : "#111827",
                }}
              >
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className="text-xs font-bold tracking-widest block mb-0.5"
                  style={{ color: item.id === "salir" ? "#ef4444" : "#f59e0b" }}
                >
                  {item.num}
                </span>
                <span
                  className="text-sm font-medium block"
                  style={{ color: item.id === "salir" ? "#fca5a5" : "#f3f4f6" }}
                >
                  {item.label}
                </span>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={item.id === "salir" ? "#ef4444" : "#6b7280"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}

// ─── Shared Calculator Shell ──────────────────────────────────────────────────

function CalcShell({
  title,
  icon,
  onBack,
  children,
}: {
  title: string;
  icon: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <PageWrapper>
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <BackButton onClick={onBack} />
        </div>
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: "#f59e0b" }}
          >
            {icon}
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "#f9fafb", fontFamily: "'Outfit', sans-serif" }}
          >
            {title}
          </h1>
        </div>
        {children}
      </div>
    </PageWrapper>
  );
}

// ─── Calculator: Muro de Ladrillo ─────────────────────────────────────────────

function CalcMuro({ onBack }: { onBack: () => void }) {
  const [espesor, setEspesor] = useState<"20" | "30">("20");
  const [largo, setLargo] = useState("");
  const [alto, setAlto] = useState("");
  const [result, setResult] = useState<null | {
    superficie: number;
    cemento: number;
    arena: number;
    ladrillos: number;
  }>(null);
  const [error, setError] = useState("");

  function calcular() {
    const l = parseFloat(largo);
    const a = parseFloat(alto);
    if (isNaN(l) || isNaN(a) || l <= 0 || a <= 0) {
      setError("Ingresa valores numéricos mayores que cero.");
      setResult(null);
      return;
    }
    setError("");
    const sup = calcularSuperficie(l, a);
    if (espesor === "30") {
      setResult({
        superficie: sup,
        cemento: sup * 15.2,
        arena: sup * 0.115,
        ladrillos: sup * 120,
      });
    } else {
      setResult({
        superficie: sup,
        cemento: sup * 10.9,
        arena: sup * 0.09,
        ladrillos: sup * 90,
      });
    }
  }

  function limpiar() {
    setLargo("");
    setAlto("");
    setResult(null);
    setError("");
  }

  return (
    <CalcShell title="Muro de Ladrillo" icon="🧱" onBack={onBack}>
      <div
        className="rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: "#1f2937", border: "1px solid #374151" }}
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: "#d1d5db" }}>
            Espesor del muro
          </label>
          <div className="flex gap-3">
            {(["20", "30"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setEspesor(v)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: espesor === v ? "#f59e0b" : "#111827",
                  color: espesor === v ? "#111827" : "#9ca3af",
                  border: `1px solid ${espesor === v ? "#f59e0b" : "#374151"}`,
                }}
              >
                {v} cm
              </button>
            ))}
          </div>
        </div>

        <InputField
          label="Largo del muro (metros)"
          value={largo}
          onChange={setLargo}
          placeholder="Ej: 5.0"
          type="number"
        />
        <InputField
          label="Alto del muro (metros)"
          value={alto}
          onChange={setAlto}
          placeholder="Ej: 2.5"
          type="number"
        />

        {error && <Alert msg={error} type="error" />}

        <div className="flex gap-3 pt-1">
          <CalcButton onClick={calcular} label="Calcular" variant="primary" />
          <CalcButton onClick={limpiar} label="Limpiar" variant="secondary" />
        </div>
      </div>

      {result && (
        <div className="mt-6 flex flex-col gap-3">
          <h3
            className="text-base font-semibold"
            style={{ color: "#f9fafb", fontFamily: "'Outfit', sans-serif" }}
          >
            Resultados — Muro {espesor} cm
          </h3>
          <ResultCard label="Superficie" value={fmt(result.superficie)} unit="m²" />
          <ResultCard label="Cemento" value={fmt(result.cemento)} unit="kg" />
          <ResultCard label="Arena" value={fmt(result.arena)} unit="m³" />
          <ResultCard label="Ladrillos" value={fmt(result.ladrillos)} unit="unidades" />
        </div>
      )}
    </CalcShell>
  );
}

// ─── Calculator: Viga de Hormigón ────────────────────────────────────────────

function CalcViga({ onBack }: { onBack: () => void }) {
  const [largo, setLargo] = useState("");
  const [result, setResult] = useState<null | Record<string, number>>(null);
  const [error, setError] = useState("");

  function calcular() {
    const l = parseFloat(largo);
    if (isNaN(l) || l <= 0) {
      setError("Ingresa un valor numérico mayor que cero.");
      setResult(null);
      return;
    }
    setError("");
    setResult({
      cemento: l * 9,
      arena: l * 0.02,
      piedra: l * 0.02,
      hierro8: l * 4,
      hierro4: l * 3,
    });
  }

  function limpiar() {
    setLargo("");
    setResult(null);
    setError("");
  }

  return (
    <CalcShell title="Viga de Hormigón" icon="🏗️" onBack={onBack}>
      <div
        className="rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: "#1f2937", border: "1px solid #374151" }}
      >
        <InputField
          label="Largo de la viga (metros)"
          value={largo}
          onChange={setLargo}
          placeholder="Ej: 4.0"
          type="number"
        />
        {error && <Alert msg={error} type="error" />}
        <div className="flex gap-3 pt-1">
          <CalcButton onClick={calcular} label="Calcular" variant="primary" />
          <CalcButton onClick={limpiar} label="Limpiar" variant="secondary" />
        </div>
      </div>

      {result && (
        <div className="mt-6 flex flex-col gap-3">
          <h3
            className="text-base font-semibold"
            style={{ color: "#f9fafb", fontFamily: "'Outfit', sans-serif" }}
          >
            Resultados — Viga ({largo} m)
          </h3>
          <ResultCard label="Cemento" value={fmt(result.cemento)} unit="kg" />
          <ResultCard label="Arena" value={fmt(result.arena)} unit="m³" />
          <ResultCard label="Piedra" value={fmt(result.piedra)} unit="m²" />
          <ResultCard label="Hierro del 8" value={fmt(result.hierro8)} unit="m" />
          <ResultCard label="Hierro del 4" value={fmt(result.hierro4)} unit="m" />
        </div>
      )}
    </CalcShell>
  );
}

// ─── Calculator: Columna de Hormigón ─────────────────────────────────────────

function CalcColumna({ onBack }: { onBack: () => void }) {
  const [largo, setLargo] = useState("");
  const [result, setResult] = useState<null | Record<string, number>>(null);
  const [error, setError] = useState("");

  function calcular() {
    const l = parseFloat(largo);
    if (isNaN(l) || l <= 0) {
      setError("Ingresa un valor numérico mayor que cero.");
      setResult(null);
      return;
    }
    setError("");
    setResult({
      cemento: l * 7.5,
      arena: l * 0.016,
      piedra: l * 0.016,
      hierro10: l * 6,
      hierro4: l * 3,
    });
  }

  function limpiar() {
    setLargo("");
    setResult(null);
    setError("");
  }

  return (
    <CalcShell title="Columna de Hormigón" icon="🏛️" onBack={onBack}>
      <div
        className="rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: "#1f2937", border: "1px solid #374151" }}
      >
        <InputField
          label="Largo de la columna (metros)"
          value={largo}
          onChange={setLargo}
          placeholder="Ej: 3.0"
          type="number"
        />
        {error && <Alert msg={error} type="error" />}
        <div className="flex gap-3 pt-1">
          <CalcButton onClick={calcular} label="Calcular" variant="primary" />
          <CalcButton onClick={limpiar} label="Limpiar" variant="secondary" />
        </div>
      </div>

      {result && (
        <div className="mt-6 flex flex-col gap-3">
          <h3
            className="text-base font-semibold"
            style={{ color: "#f9fafb", fontFamily: "'Outfit', sans-serif" }}
          >
            Resultados — Columna ({largo} m)
          </h3>
          <ResultCard label="Cemento" value={fmt(result.cemento)} unit="kg" />
          <ResultCard label="Arena" value={fmt(result.arena)} unit="m³" />
          <ResultCard label="Piedra" value={fmt(result.piedra)} unit="m²" />
          <ResultCard label="Hierro del 10" value={fmt(result.hierro10)} unit="m" />
          <ResultCard label="Hierro del 4" value={fmt(result.hierro4)} unit="m" />
        </div>
      )}
    </CalcShell>
  );
}

// ─── Calculator: Contrapisos ──────────────────────────────────────────────────

function CalcContrapiso({ onBack }: { onBack: () => void }) {
  const [espesor, setEspesor] = useState("");
  const [ancho, setAncho] = useState("");
  const [largo, setLargo] = useState("");
  const [result, setResult] = useState<null | Record<string, number>>(null);
  const [error, setError] = useState("");

  function calcular() {
    const e = parseFloat(espesor);
    const a = parseFloat(ancho);
    const l = parseFloat(largo);
    if (isNaN(e) || isNaN(a) || isNaN(l) || e <= 0 || a <= 0 || l <= 0) {
      setError("Ingresa valores numéricos mayores que cero en todos los campos.");
      setResult(null);
      return;
    }
    setError("");
    const vol = calcularVolumen(e, a, l);
    setResult({
      volumen: vol,
      cemento: vol * 105,
      arena: vol * 0.45,
      piedra: vol * 0.9,
    });
  }

  function limpiar() {
    setEspesor("");
    setAncho("");
    setLargo("");
    setResult(null);
    setError("");
  }

  return (
    <CalcShell title="Contrapisos" icon="⬛" onBack={onBack}>
      <div
        className="rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: "#1f2937", border: "1px solid #374151" }}
      >
        <InputField
          label="Espesor (metros)"
          value={espesor}
          onChange={setEspesor}
          placeholder="Ej: 0.10"
          type="number"
        />
        <InputField
          label="Ancho (metros)"
          value={ancho}
          onChange={setAncho}
          placeholder="Ej: 4.0"
          type="number"
        />
        <InputField
          label="Largo (metros)"
          value={largo}
          onChange={setLargo}
          placeholder="Ej: 6.0"
          type="number"
        />
        {error && <Alert msg={error} type="error" />}
        <div className="flex gap-3 pt-1">
          <CalcButton onClick={calcular} label="Calcular" variant="primary" />
          <CalcButton onClick={limpiar} label="Limpiar" variant="secondary" />
        </div>
      </div>

      {result && (
        <div className="mt-6 flex flex-col gap-3">
          <h3
            className="text-base font-semibold"
            style={{ color: "#f9fafb", fontFamily: "'Outfit', sans-serif" }}
          >
            Resultados — Contrapiso
          </h3>
          <ResultCard label="Volumen" value={fmt(result.volumen)} unit="m³" />
          <ResultCard label="Cemento" value={fmt(result.cemento)} unit="kg" />
          <ResultCard label="Arena" value={fmt(result.arena)} unit="m³" />
          <ResultCard label="Piedra" value={fmt(result.piedra)} unit="m³" />
        </div>
      )}
    </CalcShell>
  );
}

// ─── Calculator: Techo ────────────────────────────────────────────────────────

function CalcTecho({ onBack }: { onBack: () => void }) {
  const [espesor, setEspesor] = useState("");
  const [ancho, setAncho] = useState("");
  const [largo, setLargo] = useState("");
  const [result, setResult] = useState<null | Record<string, number>>(null);
  const [error, setError] = useState("");

  function calcular() {
    const e = parseFloat(espesor);
    const a = parseFloat(ancho);
    const l = parseFloat(largo);
    if (isNaN(e) || isNaN(a) || isNaN(l) || e <= 0 || a <= 0 || l <= 0) {
      setError("Ingresa valores numéricos mayores que cero en todos los campos.");
      setResult(null);
      return;
    }
    setError("");
    const sup = calcularSuperficie(a, l);
    setResult({
      superficie: sup,
      cemento: sup * 33,
      arena: sup * 0.072,
      piedra: sup * 0.072,
      hierro8: sup * 7,
      hierro6: sup * 4,
    });
  }

  function limpiar() {
    setEspesor("");
    setAncho("");
    setLargo("");
    setResult(null);
    setError("");
  }

  return (
    <CalcShell title="Techo" icon="🏠" onBack={onBack}>
      <div
        className="rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: "#1f2937", border: "1px solid #374151" }}
      >
        <InputField
          label="Espesor (metros)"
          value={espesor}
          onChange={setEspesor}
          placeholder="Ej: 0.12"
          type="number"
        />
        <InputField
          label="Ancho (metros)"
          value={ancho}
          onChange={setAncho}
          placeholder="Ej: 5.0"
          type="number"
        />
        <InputField
          label="Largo (metros)"
          value={largo}
          onChange={setLargo}
          placeholder="Ej: 8.0"
          type="number"
        />
        {error && <Alert msg={error} type="error" />}
        <div className="flex gap-3 pt-1">
          <CalcButton onClick={calcular} label="Calcular" variant="primary" />
          <CalcButton onClick={limpiar} label="Limpiar" variant="secondary" />
        </div>
      </div>

      {result && (
        <div className="mt-6 flex flex-col gap-3">
          <h3
            className="text-base font-semibold"
            style={{ color: "#f9fafb", fontFamily: "'Outfit', sans-serif" }}
          >
            Resultados — Techo
          </h3>
          <ResultCard label="Superficie" value={fmt(result.superficie)} unit="m²" />
          <ResultCard label="Cemento" value={fmt(result.cemento)} unit="kg" />
          <ResultCard label="Arena" value={fmt(result.arena)} unit="m³" />
          <ResultCard label="Piedra" value={fmt(result.piedra)} unit="m³" />
          <ResultCard label="Hierro del 8" value={fmt(result.hierro8)} unit="m" />
          <ResultCard label="Hierro del 6" value={fmt(result.hierro6)} unit="m" />
        </div>
      )}
    </CalcShell>
  );
}

// ─── Calculator: Pisos ────────────────────────────────────────────────────────

function CalcPisos({ onBack }: { onBack: () => void }) {
  const [ancho, setAncho] = useState("");
  const [largo, setLargo] = useState("");
  const [result, setResult] = useState<null | Record<string, number>>(null);
  const [error, setError] = useState("");

  function calcular() {
    const a = parseFloat(ancho);
    const l = parseFloat(largo);
    if (isNaN(a) || isNaN(l) || a <= 0 || l <= 0) {
      setError("Ingresa valores numéricos mayores que cero.");
      setResult(null);
      return;
    }
    setError("");
    const sup = calcularSuperficie(a, l);
    const adicional = sup * 0.10;
    setResult({
      superficie: sup,
      adicional,
      total: sup + adicional,
    });
  }

  function limpiar() {
    setAncho("");
    setLargo("");
    setResult(null);
    setError("");
  }

  return (
    <CalcShell title="Pisos" icon="🔲" onBack={onBack}>
      <div
        className="rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: "#1f2937", border: "1px solid #374151" }}
      >
        <InputField
          label="Ancho (metros)"
          value={ancho}
          onChange={setAncho}
          placeholder="Ej: 4.0"
          type="number"
        />
        <InputField
          label="Largo (metros)"
          value={largo}
          onChange={setLargo}
          placeholder="Ej: 5.0"
          type="number"
        />
        {error && <Alert msg={error} type="error" />}
        <div className="flex gap-3 pt-1">
          <CalcButton onClick={calcular} label="Calcular" variant="primary" />
          <CalcButton onClick={limpiar} label="Limpiar" variant="secondary" />
        </div>
      </div>

      {result && (
        <div className="mt-6 flex flex-col gap-3">
          <h3
            className="text-base font-semibold"
            style={{ color: "#f9fafb", fontFamily: "'Outfit', sans-serif" }}
          >
            Resultados — Pisos
          </h3>
          <ResultCard label="Superficie original" value={fmt(result.superficie)} unit="m²" />
          <ResultCard label="10% adicional por recortes" value={fmt(result.adicional)} unit="m²" />
          <div
            className="flex items-center justify-between p-4 rounded-xl"
            style={{ background: "#422006", border: "1px solid #f59e0b" }}
          >
            <span className="text-sm font-bold" style={{ color: "#fde68a" }}>
              Total de piso necesario
            </span>
            <span
              className="text-xl font-extrabold"
              style={{ color: "#f59e0b", fontFamily: "'Outfit', sans-serif" }}
            >
              {fmt(result.total)}{" "}
              <span className="text-xs font-normal" style={{ color: "#fbbf24" }}>
                m²
              </span>
            </span>
          </div>
        </div>
      )}
    </CalcShell>
  );
}

// ─── Calculator: Pintura ──────────────────────────────────────────────────────

function CalcPintura({ onBack }: { onBack: () => void }) {
  const [superficie, setSuperficie] = useState("");
  const [result, setResult] = useState<null | number>(null);
  const [error, setError] = useState("");

  function calcular() {
    const s = parseFloat(superficie);
    if (isNaN(s) || s <= 0) {
      setError("Ingresa un valor numérico mayor que cero.");
      setResult(null);
      return;
    }
    setError("");
    setResult(s / 6);
  }

  function limpiar() {
    setSuperficie("");
    setResult(null);
    setError("");
  }

  return (
    <CalcShell title="Pintura" icon="🖌️" onBack={onBack}>
      <div
        className="rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: "#1f2937", border: "1px solid #374151" }}
      >
        <div
          className="flex items-center gap-3 p-3 rounded-xl text-xs"
          style={{ background: "#111827", color: "#9ca3af", border: "1px solid #1f2937" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Rendimiento: 6 m² por litro de pintura
        </div>
        <InputField
          label="Superficie del muro (m²)"
          value={superficie}
          onChange={setSuperficie}
          placeholder="Ej: 24.0"
          type="number"
        />
        {error && <Alert msg={error} type="error" />}
        <div className="flex gap-3 pt-1">
          <CalcButton onClick={calcular} label="Calcular" variant="primary" />
          <CalcButton onClick={limpiar} label="Limpiar" variant="secondary" />
        </div>
      </div>

      {result !== null && (
        <div className="mt-6 flex flex-col gap-3">
          <h3
            className="text-base font-semibold"
            style={{ color: "#f9fafb", fontFamily: "'Outfit', sans-serif" }}
          >
            Resultados — Pintura
          </h3>
          <div
            className="flex items-center justify-between p-5 rounded-xl"
            style={{ background: "#422006", border: "1px solid #f59e0b" }}
          >
            <span className="text-sm font-bold" style={{ color: "#fde68a" }}>
              Litros de pintura necesarios
            </span>
            <span
              className="text-2xl font-extrabold"
              style={{ color: "#f59e0b", fontFamily: "'Outfit', sans-serif" }}
            >
              {fmt(result)}{" "}
              <span className="text-xs font-normal" style={{ color: "#fbbf24" }}>
                L
              </span>
            </span>
          </div>
        </div>
      )}
    </CalcShell>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<View>("login");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("calc_session");
    if (saved) {
      try {
        const user = JSON.parse(saved) as User;
        setCurrentUser(user);
        setView("menu");
      } catch {
        // ignore
      }
    }
  }, []);

  function handleLogin(user: User) {
    setCurrentUser(user);
    localStorage.setItem("calc_session", JSON.stringify(user));
    setView("menu");
  }

  function handleLogout() {
    setCurrentUser(null);
    localStorage.removeItem("calc_session");
    setView("login");
  }

  if (view === "login") return <LoginScreen onLogin={handleLogin} onGoRegister={() => setView("registro")} />;
  if (view === "registro") return <RegisterScreen onGoLogin={() => setView("login")} />;
  if (!currentUser) return <LoginScreen onLogin={handleLogin} onGoRegister={() => setView("registro")} />;
  if (view === "menu") return <MainMenu user={currentUser} onNavigate={setView} onLogout={handleLogout} />;
  if (view === "muro") return <CalcMuro onBack={() => setView("menu")} />;
  if (view === "viga") return <CalcViga onBack={() => setView("menu")} />;
  if (view === "columna") return <CalcColumna onBack={() => setView("menu")} />;
  if (view === "contrapiso") return <CalcContrapiso onBack={() => setView("menu")} />;
  if (view === "techo") return <CalcTecho onBack={() => setView("menu")} />;
  if (view === "pisos") return <CalcPisos onBack={() => setView("menu")} />;
  if (view === "pintura") return <CalcPintura onBack={() => setView("menu")} />;

  return null;
}
