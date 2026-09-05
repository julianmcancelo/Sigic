const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { PGlite } = require('@electric-sql/pglite');
const { NextRequest } = require('next/server');

// Carga los módulos reales con una base PostgreSQL aislada en memoria.
// No lee archivos .env ni abre conexiones a servicios externos.
function cargar(nombre, mocks = {}, env = {}) {
  const archivo = path.join(__dirname, '../src', nombre);
  const source = fs.readFileSync(archivo, 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  const context = { module, exports: module.exports, Buffer, Date, console,
    process: { env: { NODE_ENV: 'test', JWT_SECRET: 'test-only-secret-'.repeat(4), ...env } },
    require: name => Object.hasOwn(mocks, name) ? mocks[name] : require(name) };
  vm.runInNewContext(compiled, context, { filename: archivo });
  return module.exports;
}

const tokens = cargar('lib/tokens.ts');
const request = (token, cookie) => new NextRequest('https://app.sigic.com.ar/api/usuarios', {
  headers: { ...(token !== undefined ? { authorization: `Bearer ${token}` } : {}), ...(cookie ? { cookie: `sigic_admin_session=${cookie}` } : {}) }
});

test('JWT: rechaza todos los bypass aun con DEMO_MODE, firmas alteradas y expirados', () => {
  const demo = cargar('lib/tokens.ts', {}, { DEMO_MODE: 'true' });
  for (const token of ['bypass-admin-token', 'bypass-support-token', 'bypass-egresado-123']) assert.equal(demo.verificar(token).valido, false);
  const token = tokens.firmar({ tipo: 'egresado', id: '123' });
  assert.equal(tokens.verificar(token).valido, true);
  assert.equal(tokens.verificar(token + 'x').valido, false);
  assert.equal(tokens.verificar(tokens.firmar({ tipo: 'egresado', id: '123' }, 0)).valido, false);
  assert.equal(tokens.verificar(tokens.firmar({ tipo: 'otro', id: '123' })).valido, false);
  assert.throws(() => cargar('lib/tokens.ts', {}, { NODE_ENV: 'production', JWT_SECRET: '' }), /JWT_SECRET/);
});

test('OTP: código de seis dígitos, hash, error y vencimiento', () => {
  const otp = cargar('lib/otp.ts');
  const generado = otp.generar();
  assert.match(generado.codigo, /^\d{6}$/);
  assert.equal(otp.verificar(generado.codigo, generado.hash, generado.expiracion), 'VALIDO');
  assert.equal(otp.verificar('incorrecto', generado.hash, true), 'CODIGO_INVALIDO');
  assert.equal(otp.verificar(generado.codigo, generado.hash, false), 'EXPIRADO');
});

test('Origen: mismo sitio y lista explícita, rechaza null y sitios externos', () => {
  const { origenPermitido } = cargar('lib/request-origin.ts', {}, { SIGIC_ALLOWED_ORIGINS: 'https://permitido.example' });
  for (const origin of ['https://app.sigic.com.ar', 'https://permitido.example']) {
    assert.equal(origenPermitido(new NextRequest('https://app.sigic.com.ar/api', { headers: { origin } })), true);
  }
  for (const origin of ['null', 'https://malicioso.example', 'https://app.sigic.com.ar.malicioso.example']) {
    assert.equal(origenPermitido(new NextRequest('https://app.sigic.com.ar/api', { headers: { origin } })), false);
  }
  assert.equal(origenPermitido(new NextRequest('https://app.sigic.com.ar/api')), true);
});

test('PostgreSQL: migración de roles, revocación, permisos, último administrativo y límites compartidos', async () => {
  const db = new PGlite();
  try {
    await db.exec(`CREATE TABLE usuarios_sistema (
      id TEXT PRIMARY KEY, rol TEXT CHECK (rol IN ('SUPER_ADMIN','ADMIN','ADMINISTRATIVO','PORTERIA','AUDITOR')),
      activo INTEGER, nombre TEXT, email TEXT, password_hash TEXT, ultimo_login TIMESTAMP);
      INSERT INTO usuarios_sistema (id,rol,activo) VALUES
        ('a','SUPER_ADMIN',1), ('b','ADMIN',1), ('c','ADMINISTRATIVO',1), ('p','PORTERIA',1), ('r','AUDITOR',1);
      CREATE TABLE ceremonias (id TEXT PRIMARY KEY, activa INTEGER);
      CREATE TABLE ceremonias_usuarios_autorizados (ceremonia_id TEXT, usuario_id TEXT);
      CREATE TABLE tokens_recuperacion_contrasena (usuario_id TEXT);
      CREATE TABLE sesiones_porteria (usuario_id TEXT);
      CREATE TABLE dispositivos_moviles (usuario_id TEXT);
      INSERT INTO ceremonias VALUES ('evento',1);`);
    const schema = fs.readFileSync(path.join(__dirname, '../src/lib/schema.ts'), 'utf8');
    const migration = schema.match(/await client.query\(`\s*(ALTER TABLE usuarios_sistema ADD COLUMN IF NOT EXISTS session_version[\s\S]*?)`\);/)[1];
    await db.exec(migration);
    await db.exec(migration); // Reejecutar no vuelve a invalidar sesiones.
    const roles = (await db.query('SELECT id,rol,activo,session_version FROM usuarios_sistema ORDER BY id')).rows;
    assert.deepEqual(roles.map(r => [r.id, r.rol, r.activo, r.session_version]), [
      ['a','ADMINISTRATIVO',1,2], ['b','ADMINISTRATIVO',1,2], ['c','ADMINISTRATIVO',1,1], ['p','PORTERIA',1,1], ['r','PORTERIA',0,2]
    ]);
    await assert.rejects(db.query("UPDATE usuarios_sistema SET rol = 'SUPER_ADMIN' WHERE id = 'a'"));
    const query = async (sql, params) => { const result = await db.query(sql, params); return { ...result, rowCount: result.affectedRows }; };
    const database = { query, pool: { connect: async () => ({ query, release() {} }) } };
    const auth = cargar('lib/auth-middleware.ts', { './tokens': tokens, './db': database, './schema': { inicializarBaseDatos: async () => {} } });
    const administrativo = tokens.firmar({ tipo: 'personal', id: 'a', rol: 'PORTERIA', sessionVersion: 2 });
    assert.equal((await auth.obtenerUsuarioAutenticado(request(administrativo), ['ADMINISTRATIVO'])).valido, true, 'Usa el rol de la base');
    assert.equal((await auth.obtenerUsuarioAutenticado(request('bypass-admin-token', administrativo), ['ADMINISTRATIVO'])).valido, false, 'No hereda cookie ante Bearer inválido');
    const antiguo = tokens.firmar({ tipo: 'personal', id: 'a', rol: 'ADMINISTRATIVO' });
    assert.equal((await auth.obtenerUsuarioAutenticado(request(antiguo))).valido, false);
    await query("UPDATE usuarios_sistema SET activo=0 WHERE id='a'");
    assert.equal((await auth.obtenerUsuarioAutenticado(request(administrativo))).valido, false);
    await query("UPDATE usuarios_sistema SET activo=1,session_version=3 WHERE id='a'");
    assert.equal((await auth.obtenerUsuarioAutenticado(request(administrativo))).valido, false);
    const helpers = cargar('lib/api-helpers.ts', {
      '@/lib/db': database, '@/lib/auth-middleware': auth, '@jcancelo/google-wallet': {},
      './rate-limit': {}, './request-origin': cargar('lib/request-origin.ts')
    });
    const portero = tokens.firmar({ tipo: 'personal', id: 'p', rol: 'ADMINISTRATIVO', sessionVersion: 1 });
    assert.equal((await auth.obtenerUsuarioAutenticado(request(portero), ['ADMINISTRATIVO'])).valido, false);
    assert.equal(await helpers.esPersonalValido(request(portero)), false);
    const bcrypt = require('bcryptjs');
    await query('UPDATE usuarios_sistema SET email=$1, password_hash=$2 WHERE id=$3', ['portero@example.test', await bcrypt.hash('PasswordDePrueba', 4), 'p']);
    const login = cargar('app/api/auth/login/route.ts', {
      '@/lib/db': database, '@/lib/tokens': tokens, '@/lib/schema': { inicializarBaseDatos: async () => {} },
      '@/lib/rate-limit': cargar('lib/rate-limit.ts', { './db': database }), '@/lib/auth-middleware': auth
    });
    const solicitudLogin = () => new NextRequest('https://app.sigic.com.ar/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'portero@example.test', password: 'PasswordDePrueba' }) });
    assert.equal((await login.POST(solicitudLogin())).status, 403);
    assert.equal((await query("SELECT * FROM ceremonias_usuarios_autorizados WHERE usuario_id='p'")).rows.length, 0, 'Login no crea permisos');
    await query("INSERT INTO ceremonias_usuarios_autorizados VALUES ('evento','p')");
    assert.equal(await helpers.esPersonalValido(request(portero)), true);
    const acceso = await login.POST(solicitudLogin());
    assert.equal(acceso.status, 200);
    assert.equal(tokens.verificar((await acceso.json()).token).datos.sessionVersion, 1);
    await query("DELETE FROM ceremonias_usuarios_autorizados WHERE usuario_id='p'");
    assert.equal(await helpers.esPersonalValido(request(portero)), false);
    const graduado = tokens.firmar({ tipo: 'egresado', id: 'g' });
    assert.equal(await helpers.esAutorizadoPersonalOEgresado(request(graduado), 'g'), true);
    assert.equal(await helpers.esAutorizadoPersonalOEgresado(request(graduado), 'otro'), false);
    assert.equal((await auth.obtenerUsuarioAutenticado(request(graduado), ['ADMINISTRATIVO'])).valido, false);
    const seguridad = cargar('lib/usuarios-seguridad.ts', { './db': database });
    assert.equal((await seguridad.cambiarAccesoUsuario('a', { activo: 0 })).status, 200);
    assert.equal((await seguridad.cambiarAccesoUsuario('b', { rol: 'PORTERIA' })).status, 200);
    for (const cambio of [{ activo: 0 }, { rol: 'PORTERIA' }, { eliminar: true }]) {
      assert.equal((await seguridad.cambiarAccesoUsuario('c', cambio)).status, 409);
    }
    assert.equal((await seguridad.cambiarAccesoUsuario('p', { eliminar: true })).status, 200);
    const uno = cargar('lib/rate-limit.ts', { './db': database });
    const dos = cargar('lib/rate-limit.ts', { './db': database });
    const resultados = await Promise.all(Array.from({ length: 8 }, (_, i) => (i % 2 ? uno : dos).verificarRateLimit('prueba', 3, 60000)));
    assert.equal(resultados.filter(r => r.permitido).length, 3);
    await query("UPDATE auth_rate_limits SET reinicio = CURRENT_TIMESTAMP - INTERVAL '1 second'");
    assert.equal((await dos.verificarRateLimit('prueba', 3, 60000)).permitido, true);
  } finally {
    await db.close();
  }
});

test('Excel: importa y exporta el padrón con la biblioteca actualizada', () => {
  const xlsx = require('xlsx');
  assert.equal(xlsx.version, '0.20.3');
  const filas = [{ Nombre: 'Ana Pérez', DNI: '12345678', Carrera: 'Sistemas' }];
  const libro = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(libro, xlsx.utils.json_to_sheet(filas), 'Graduados');
  const buffer = xlsx.write(libro, { type: 'buffer', bookType: 'xlsx' });
  const recuperado = xlsx.read(buffer, { type: 'buffer' });
  assert.deepEqual(xlsx.utils.sheet_to_json(recuperado.Sheets.Graduados), filas);
});
