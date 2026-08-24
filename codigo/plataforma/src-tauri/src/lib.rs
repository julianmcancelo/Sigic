use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

const SIGIC_DEMO_URL: &str = "https://demo.sigic.com.ar";

#[tauri::command]
fn abrir_modulo(app: tauri::AppHandle, ruta: String, titulo: String) -> Result<(), String> {
  let etiqueta = format!("modulo-{}", ruta.replace('/', "-").replace(|c: char| !c.is_ascii_alphanumeric() && c != '-', ""));
  if let Some(ventana) = app.get_webview_window(&etiqueta) {
    let _ = ventana.set_focus();
    return Ok(());
  }
  let destino = format!("{}/{}", SIGIC_DEMO_URL.trim_end_matches('/'), ruta.trim_start_matches('/'));
  let url = url::Url::parse(&destino).map_err(|error| error.to_string())?;
  WebviewWindowBuilder::new(&app, etiqueta, WebviewUrl::External(url))
    .title(titulo)
    .inner_size(1280.0, 820.0)
    .min_inner_size(960.0, 640.0)
    .center()
    .resizable(true)
    .build()
    .map_err(|error| error.to_string())?;
  Ok(())
}

pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_updater::Builder::new().build())
    .invoke_handler(tauri::generate_handler![abrir_modulo])
    .setup(|app| {
      let url = url::Url::parse(SIGIC_DEMO_URL)?;
      if let Some(ventana) = app.get_webview_window("main") {
        ventana.navigate(url)?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error al iniciar SiGIC Escritorio");
}
