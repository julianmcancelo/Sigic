use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

const SIGIC_PROD_URL: &str = "https://app.sigic.com.ar";
const SIGIC_LOCAL_URL: &str = "http://localhost:3000";

fn obtener_base_url() -> String {
  if let Ok(url) = std::env::var("SIGIC_DESKTOP_URL") {
    return url;
  }
  SIGIC_PROD_URL.to_string()
}

#[tauri::command]
fn abrir_modulo(app: tauri::AppHandle, ruta: String, titulo: String, base_url: Option<String>) -> Result<(), String> {
  let etiqueta = format!("modulo-{}", ruta.replace('/', "-").replace(|c: char| !c.is_ascii_alphanumeric() && c != '-', ""));
  if let Some(ventana) = app.get_webview_window(&etiqueta) {
    let _ = ventana.show();
    let _ = ventana.unminimize();
    let _ = ventana.set_focus();
    return Ok(());
  }
  let base = base_url.unwrap_or_else(obtener_base_url);
  let destino = if ruta.starts_with('?') || ruta.starts_with('#') {
    format!("{}{}", base.trim_end_matches('/'), ruta)
  } else {
    format!("{}/{}", base.trim_end_matches('/'), ruta.trim_start_matches('/'))
  };
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

#[tauri::command]
fn cerrar_ventana_actual(app: tauri::AppHandle) -> Result<(), String> {
  if let Some((_, ventana)) = app.webview_windows().into_iter().find(|(_, w)| w.is_focused().unwrap_or(false)) {
    let _ = ventana.close();
  }
  Ok(())
}

pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_updater::Builder::new().build())
    .invoke_handler(tauri::generate_handler![abrir_modulo, cerrar_ventana_actual])
    .setup(|app| {
      let base = obtener_base_url();
      let url = url::Url::parse(&base).map_err(|e| e.to_string())?;

      if let Some(w) = app.get_webview_window("main") {
        let _ = w.navigate(url);
        let _ = w.show();
        let _ = w.set_focus();
      } else {
        WebviewWindowBuilder::new(app, "main", WebviewUrl::External(url))
          .title("SiGIC Escritorio · Instituto Tecnológico Beltrán")
          .inner_size(1440.0, 920.0)
          .min_inner_size(1024.0, 680.0)
          .center()
          .resizable(true)
          .build()
          .map_err(|e| e.to_string())?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error al iniciar SiGIC Escritorio");
}
