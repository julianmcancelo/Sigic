# SiGIC Movil Flutter

Aplicacion movil Flutter para control de accesos y acreditacion de invitados de SiGIC.

## Incluye

- Codigo completamente nuevo en espanol
- Pantalla principal con estado de sesion, ceremonia y estadisticas
- Escaner QR con `mobile_scanner`
- Configuracion manual de servidor y login
- Integracion preparada para Shorebird mediante `shorebird_code_push`

## Ejecutar

```bash
cd codigo/movil_flutter
flutter pub get
flutter run
```

## Shorebird

Documentacion oficial consultada:

- [Bienvenida a Shorebird Docs](https://docs.shorebird.dev/)
- [Code Push Overview](https://docs.shorebird.dev/code-push/)
- [Sitio oficial Shorebird](https://shorebird.dev/)

Pasos habituales:

```bash
shorebird login
shorebird init
shorebird release android
shorebird release ios
shorebird patch android
shorebird patch ios
```
