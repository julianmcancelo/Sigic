class UsuarioSesion {
  const UsuarioSesion({
    required this.nombre,
    required this.email,
    required this.rol,
  });

  final String nombre;
  final String email;
  final String rol;

  bool get esAdministrativo =>
      rol.toUpperCase() == 'ADMINISTRATIVO' ||
      rol.toUpperCase() == 'SUPER_ADMIN' ||
      rol.toUpperCase() == 'ADMIN' ||
      rol.toUpperCase() == 'SOPORTE';

  bool get esPorteria =>
      rol.toUpperCase() == 'PORTERIA' || rol.toUpperCase() == 'SEGURIDAD';

  factory UsuarioSesion.desdeMapa(Map<String, dynamic> mapa) {
    return UsuarioSesion(
      nombre: (mapa['nombre'] ?? 'Personal de Seguridad').toString(),
      email: (mapa['email'] ?? '').toString(),
      rol: (mapa['rol'] ?? 'PORTERIA').toString(),
    );
  }

  Map<String, dynamic> aMapa() {
    return {'nombre': nombre, 'email': email, 'rol': rol};
  }
}
