import { NextRequest, NextResponse } from 'next/server'
import { obtenerUsuarioAutenticado, ROLES_GESTION } from '@/lib/auth-middleware'
import fs from 'fs/promises'
import path from 'path'

export async function GET() {
  try {
    const rutaArchivo = path.join(process.cwd(), 'src', 'datos', 'rutinas-demo-oficiales.json')
    try {
      const contenido = await fs.readFile(rutaArchivo, 'utf-8')
      return NextResponse.json({ ok: true, rutinas: JSON.parse(contenido) })
    } catch {
      return NextResponse.json({ ok: true, rutinas: {} })
    }
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'No disponible' }, { status: 404 })
  const auth = await obtenerUsuarioAutenticado(req, ROLES_GESTION)
  if (!auth.valido) return NextResponse.json({ error: auth.error }, { status: auth.statusCode })
  try {
    const body = await req.json()
    const { fase, secuencia, todasLasFases } = body

    const rutaArchivo = path.join(process.cwd(), 'src', 'datos', 'rutinas-demo-oficiales.json')
    let actuales: Record<string, any[]> = {}
    try {
      const previo = await fs.readFile(rutaArchivo, 'utf-8')
      actuales = JSON.parse(previo)
    } catch {
      actuales = {}
    }

    if (todasLasFases && typeof todasLasFases === 'object') {
      actuales = { ...actuales, ...todasLasFases }
    } else if (fase && Array.isArray(secuencia)) {
      actuales[String(fase)] = secuencia
    }

    await fs.writeFile(rutaArchivo, JSON.stringify(actuales, null, 2), 'utf-8')
    return NextResponse.json({ ok: true, mensaje: 'Rutinas guardadas permanentemente en el proyecto', rutinas: actuales })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
