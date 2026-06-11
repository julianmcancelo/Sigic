export function LogoBeltran({ size = 48, variant = 'light' }) {
  const iconSize = Math.round(size * 0.85)
  const logoInstitucional = `${import.meta.env.BASE_URL}footer.png`

  const colorNombre = variant === 'dark' ? '#FFFFFF' : '#1A2535'
  const colorSubtitulo = variant === 'dark' ? '#29ABE2' : '#546E7A'
  const colorUom = variant === 'dark' ? 'rgba(255,255,255,0.40)' : '#90A4AE'

  return (
    <div
      style={{ height: size, display: 'flex', alignItems: 'center', gap: '0.65rem' }}
    >
      <img
        src={logoInstitucional}
        alt="Isotipo Instituto Tecnologico Beltran"
        style={{
          width: iconSize,
          height: iconSize,
          objectFit: 'contain',
          flexShrink: 0,
          display: 'block',
        }}
      />

      <div style={{ lineHeight: 1.2 }}>
        <p
          style={{
            margin: 0,
            color: colorNombre,
            fontSize: Math.max(size * 0.175, 10),
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Instituto Tecnologico Beltran
        </p>

        <p
          style={{
            margin: '2px 0 0 0',
            color: colorSubtitulo,
            fontSize: Math.max(size * 0.135, 8),
            fontWeight: 400,
            letterSpacing: '0.04em',
          }}
        >
          Centro de Tecnologia e Innovacion
        </p>

        <p
          style={{
            margin: '1px 0 0 0',
            color: colorUom,
            fontSize: Math.max(size * 0.105, 7),
            fontWeight: 400,
            letterSpacing: '0.03em',
          }}
        >
          UOM · Union Obrera Metalurgica · Avellaneda
        </p>
      </div>
    </div>
  )
}
