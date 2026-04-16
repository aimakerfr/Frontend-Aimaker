export default function ComponenteEspanol() {
  const manejarClic = (nombre) => {
    alert(`Hiciste clic en: ${nombre}`);
  };

  return (
    <div style={{
      maxWidth: "480px",
      margin: "2rem auto",
      padding: "2rem",
      background: "var(--color-background-primary)",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: "var(--border-radius-lg)",
      fontFamily: "var(--font-sans)",
    }}>
      <h1 style={{
        fontSize: "22px",
        fontWeight: "500",
        color: "var(--color-text-primary)",
        margin: "0 0 1rem 0",
      }}>
        Bienvenido a mi aplicación
      </h1>

      <p style={{
        fontSize: "16px",
        lineHeight: "1.7",
        color: "var(--color-text-secondary)",
        margin: "0 0 1.5rem 0",
      }}>
        Este es un componente de ejemplo en español. Puedes interactuar con los botones
        de abajo para realizar diferentes acciones dentro de la aplicación.
      </p>

      <div style={{
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
      }}>
        <button onClick={() => manejarClic("Guardar")}>
          Guardar
        </button>
        <button onClick={() => manejarClic("Cancelar")}>
          Cancelar
        </button>
        <button onClick={() => manejarClic("Eliminar")}>
          Eliminar
        </button>
      </div>
    </div>
  );
}
