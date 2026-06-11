using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Media;
using System.Windows.Navigation;
using Microsoft.Win32;

namespace SiGIC_ControlCenter
{
    public partial class MainWindow : Window
    {
        private const string Version = "5.1.0";
        private const string Nombre = "SiGIC";
        
        private Configuracion config = null!;
        private string rootPath = "";
        private string backendDir = "";
        private string frontendDir = "";
        private string configPath = "";

        private Process? backendProcess;
        private Process? frontendProcess;
        private bool isInfraActive = false;
        private bool isMonitorActive = true;

        private SolidColorBrush colorOk = null!;
        private SolidColorBrush colorError = null!;
        private SolidColorBrush colorNeutro = null!;

        private string lastBackendState = "";
        private string lastFrontendState = "";
        private string lastDbState = "";

        private struct DbStats
        {
            public bool Ok;
            public string Mode;
            public int Egresados;
            public int Invitados;
            public int Ceremonias;
            public string Error;
        }

        public MainWindow()
        {
            InitializeComponent();
            
            lblVersion.Content = $"v{Version}";
            
            DetectarRutas();
            config = Configuracion.Cargar(configPath);
            CargarDatabaseUrlDesdeEnvSiFalta();

            AplicarTema(config.Tema);
            AplicarConfiguracionAUi();

            Log($"{Nombre} Control Center listo — versión {Version}");
            Log($"Raíz del proyecto detectada: {rootPath}");

            // Iniciar bucle de monitoreo asíncrono
            Task.Run(BucleMonitoreo);

            this.Closing += MainWindow_Closing;
        }

        private void DetectarRutas()
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            
            // Buscar la raíz subiendo directorios
            string candidata = baseDir;
            while (!string.IsNullOrEmpty(candidata))
            {
                if (Directory.Exists(Path.Combine(candidata, "codigo")))
                {
                    rootPath = candidata;
                    break;
                }
                candidata = Path.GetDirectoryName(candidata) ?? "";
            }

            if (string.IsNullOrEmpty(rootPath))
            {
                rootPath = baseDir;
            }

            backendDir = Path.Combine(rootPath, "codigo", "servidor");
            frontendDir = Path.Combine(rootPath, "codigo", "interfaz", "web");
            configPath = Path.Combine(rootPath, "scripts", "sigic_control_config.json");
        }

        private void CargarDatabaseUrlDesdeEnvSiFalta()
        {
            if (!string.IsNullOrWhiteSpace(config.DatabaseUrl)) return;

            string envPath = Path.Combine(backendDir, ".env");
            if (File.Exists(envPath))
            {
                try
                {
                    foreach (var linea in File.ReadLines(envPath))
                    {
                        var limpia = linea.Trim();
                        if (string.IsNullOrEmpty(limpia) || limpia.StartsWith("#") || !limpia.Contains("="))
                            continue;

                        var partes = limpia.Split('=', 2);
                        if (partes[0].Trim() == "DATABASE_URL")
                        {
                            config.DatabaseUrl = partes[1].Trim(' ', '"', '\'');
                            break;
                        }
                    }
                }
                catch (Exception ex)
                {
                    Log($"No se pudo leer el archivo .env del backend: {ex.Message}", "ERROR");
                }
            }
        }

        private void AplicarConfiguracionAUi()
        {
            comboEntorno.Text = config.Entorno;
            comboTema.Text = config.Tema;
            txtBackendUrl.Text = config.BackendUrl;
            txtFrontendUrl.Text = config.FrontendUrl;
            txtDatabaseUrl.Text = config.DatabaseUrl;
        }

        private void ActualizarConfigDesdeUi()
        {
            config.Entorno = comboEntorno.Text;
            config.Tema = comboTema.Text;
            config.BackendUrl = txtBackendUrl.Text.Trim();
            config.FrontendUrl = txtFrontendUrl.Text.Trim();
            config.DatabaseUrl = txtDatabaseUrl.Text.Trim();
        }

        // ── Temas y Apariencia (Fluent Estilo Windows 11) ────────────────────────────────

        private void AplicarTema(string eleccion)
        {
            bool oscuro = false;
            if (eleccion == "oscuro")
            {
                oscuro = true;
            }
            else if (eleccion == "claro")
            {
                oscuro = false;
            }
            else
            {
                // Leer del registro de Windows
                try
                {
                    using (var clave = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize"))
                    {
                        if (clave != null)
                        {
                            var valor = clave.GetValue("AppsUseLightTheme");
                            if (valor is int valInt && valInt == 0) oscuro = true;
                        }
                    }
                }
                catch
                {
                    oscuro = false;
                }
            }

            // Leer color de acento
            Color acento = Color.FromRgb(0, 103, 192); // Azul estándar de Windows
            try
            {
                using (var clave = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\DWM"))
                {
                    if (clave != null)
                    {
                        var valor = clave.GetValue("AccentColor");
                        if (valor is int abgr)
                        {
                            byte r = (byte)(abgr & 0xFF);
                            byte g = (byte)((abgr >> 8) & 0xFF);
                            byte b = (byte)((abgr >> 16) & 0xFF);
                            acento = Color.FromRgb(r, g, b);
                        }
                    }
                }
            }
            catch
            {
                // Fallback
            }

            PintarPaleta(oscuro, acento);
        }

        private void PintarPaleta(bool oscuro, Color acento)
        {
            var p = new ResourceDictionary();

            if (oscuro)
            {
                p["WindowBackgroundBrush"] = new SolidColorBrush(Color.FromRgb(32, 32, 32));
                p["PanelBackgroundBrush"] = new SolidColorBrush(Color.FromRgb(43, 43, 43));
                p["CardBackgroundBrush"] = new SolidColorBrush(Color.FromRgb(43, 43, 43));
                p["BorderBrush"] = new SolidColorBrush(Color.FromRgb(29, 29, 29));
                p["TextBrush"] = new SolidColorBrush(Color.FromRgb(255, 255, 255));
                p["TextSuaveBrush"] = new SolidColorBrush(Color.FromRgb(157, 157, 157));
                p["EntradaBgBrush"] = new SolidColorBrush(Color.FromRgb(56, 56, 56));
                p["EntradaFgBrush"] = new SolidColorBrush(Color.FromRgb(255, 255, 255));
                p["ButtonSecBgBrush"] = new SolidColorBrush(Color.FromRgb(56, 56, 56));
                p["ButtonSecHoverBrush"] = new SolidColorBrush(Color.FromRgb(69, 69, 69));
                p["ButtonSecFgBrush"] = new SolidColorBrush(Color.FromRgb(255, 255, 255));
                p["ConsolaBgBrush"] = new SolidColorBrush(Color.FromRgb(12, 12, 12));
                p["ConsolaFgBrush"] = new SolidColorBrush(Color.FromRgb(204, 204, 204));
                colorOk = new SolidColorBrush(Color.FromRgb(108, 203, 95));
                colorError = new SolidColorBrush(Color.FromRgb(255, 153, 164));
                colorNeutro = new SolidColorBrush(Color.FromRgb(157, 157, 157));
            }
            else
            {
                p["WindowBackgroundBrush"] = new SolidColorBrush(Color.FromRgb(243, 243, 243));
                p["PanelBackgroundBrush"] = new SolidColorBrush(Color.FromRgb(243, 243, 243));
                p["CardBackgroundBrush"] = new SolidColorBrush(Color.FromRgb(255, 255, 255));
                p["BorderBrush"] = new SolidColorBrush(Color.FromRgb(229, 229, 229));
                p["TextBrush"] = new SolidColorBrush(Color.FromRgb(27, 27, 27));
                p["TextSuaveBrush"] = new SolidColorBrush(Color.FromRgb(93, 93, 93));
                p["EntradaBgBrush"] = new SolidColorBrush(Color.FromRgb(255, 255, 255));
                p["EntradaFgBrush"] = new SolidColorBrush(Color.FromRgb(27, 27, 27));
                p["ButtonSecBgBrush"] = new SolidColorBrush(Color.FromRgb(251, 251, 251));
                p["ButtonSecHoverBrush"] = new SolidColorBrush(Color.FromRgb(240, 240, 240));
                p["ButtonSecFgBrush"] = new SolidColorBrush(Color.FromRgb(27, 27, 27));
                p["ConsolaBgBrush"] = new SolidColorBrush(Color.FromRgb(12, 12, 12));
                p["ConsolaFgBrush"] = new SolidColorBrush(Color.FromRgb(204, 204, 204));
                colorOk = new SolidColorBrush(Color.FromRgb(15, 123, 15));
                colorError = new SolidColorBrush(Color.FromRgb(196, 43, 28));
                colorNeutro = new SolidColorBrush(Color.FromRgb(93, 93, 93));
            }

            // Mezclar colores de acento
            p["AcentoBrush"] = new SolidColorBrush(acento);
            p["AcentoHoverBrush"] = new SolidColorBrush(Mezclar(acento, Color.FromRgb(255, 255, 255), 0.15));
            p["AcentoPresionadoBrush"] = new SolidColorBrush(Mezclar(acento, Color.FromRgb(0, 0, 0), 0.15));

            // Actualizar recursos de la ventana
            foreach (var key in p.Keys)
            {
                this.Resources[key] = p[key];
            }

            // Pintar los labels de tarjetas de estado basados en la nueva paleta
            Dispatcher.Invoke(() =>
            {
                ActualizarColorTarjetaEstado(lblEstadoBackend);
                ActualizarColorTarjetaEstado(lblEstadoFrontend);
                ActualizarColorTarjetaEstado(lblEstadoDB);
                ActualizarColorTarjetaGeneral();
            });
        }

        private Color Mezclar(Color colorA, Color colorB, double factor)
        {
            byte r = (byte)(colorA.R + (colorB.R - colorA.R) * factor);
            byte g = (byte)(colorA.G + (colorB.G - colorA.G) * factor);
            byte b = (byte)(colorA.B + (colorB.B - colorA.B) * factor);
            return Color.FromRgb(r, g, b);
        }

        private void ActualizarColorTarjetaEstado(Label label)
        {
            string texto = label.Content?.ToString() ?? "";
            if (texto == "Conectado")
                label.Foreground = colorOk;
            else if (texto == "Sin conexión")
                label.Foreground = colorError;
            else
                label.Foreground = colorNeutro;
        }

        private void ActualizarColorTarjetaGeneral()
        {
            string texto = lblEstadoGeneral.Content?.ToString() ?? "";
            if (texto == "Operativo")
                lblEstadoGeneral.Foreground = colorOk;
            else if (texto == "Falla")
                lblEstadoGeneral.Foreground = colorError;
            else
                lblEstadoGeneral.Foreground = colorNeutro;
        }

        // ── Lógica de Logs ───────────────────────────────────────────────────────────────

        private void Log(string mensaje, string tipo = "INFO")
        {
            Dispatcher.BeginInvoke(new Action(() =>
            {
                var flowDoc = rtbConsole.Document;
                var paragraph = flowDoc.Blocks.FirstBlock as Paragraph;
                if (paragraph == null)
                {
                    paragraph = new Paragraph();
                    flowDoc.Blocks.Add(paragraph);
                }

                // Hora
                var runHora = new Run($"{DateTime.Now:HH:mm:ss}  ")
                {
                    Foreground = new SolidColorBrush(Color.FromRgb(106, 153, 85))
                };
                paragraph.Inlines.Add(runHora);

                // Mensaje
                SolidColorBrush msgBrush = (SolidColorBrush)this.Resources["ConsolaFgBrush"];
                if (tipo == "OK") msgBrush = new SolidColorBrush(Color.FromRgb(78, 201, 176));
                else if (tipo == "ERROR") msgBrush = new SolidColorBrush(Color.FromRgb(244, 135, 113));
                else if (tipo == "AUDIT") msgBrush = new SolidColorBrush(Color.FromRgb(156, 220, 254));

                var runMsg = new Run($"{mensaje}\n") { Foreground = msgBrush };
                paragraph.Inlines.Add(runMsg);

                rtbConsole.ScrollToEnd();
            }));
        }

        // ── Manejo de Procesos ──────────────────────────────────────────────────────────

        private void ConfigurarEntornoNode(ProcessStartInfo psi)
        {
            string wingetNodePath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                @"Microsoft\WinGet\Packages\OpenJS.NodeJS.22_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v22.22.3-win-x64"
            );

            if (Directory.Exists(wingetNodePath))
            {
                string pathVar = psi.EnvironmentVariables.ContainsKey("PATH") 
                    ? psi.EnvironmentVariables["PATH"] 
                    : (Environment.GetEnvironmentVariable("PATH") ?? "");
                psi.EnvironmentVariables["PATH"] = wingetNodePath + ";" + pathVar;
            }
        }

        private void btnInfra_Click(object sender, RoutedEventArgs e)
        {
            if (isInfraActive)
            {
                ApagarInfraestructura();
            }
            else
            {
                EncenderInfraestructura();
            }
        }

        private void EncenderInfraestructura()
        {
            ActualizarConfigDesdeUi();
            isInfraActive = true;

            lblEstadoGeneral.Content = "Operativo";
            ActualizarColorTarjetaGeneral();

            btnInfra.Content = "Detener infraestructura";
            btnInfra.Style = (Style)this.Resources["FluentButtonStyle"];

            Log("Iniciando backend y frontend...");

            try
            {
                // Iniciar Backend
                var infoBackend = new ProcessStartInfo
                {
                    FileName = "npm.cmd",
                    Arguments = "start",
                    WorkingDirectory = backendDir,
                    CreateNoWindow = true,
                    UseShellExecute = false
                };
                ConfigurarEntornoNode(infoBackend);
                infoBackend.EnvironmentVariables["PORT"] = config.BackendPort;
                if (!string.IsNullOrEmpty(config.DatabaseUrl))
                {
                    infoBackend.EnvironmentVariables["DATABASE_URL"] = config.DatabaseUrl;
                }

                backendProcess = Process.Start(infoBackend);
                Log("Backend iniciado", "OK");

                // Iniciar Frontend
                var infoFrontend = new ProcessStartInfo
                {
                    FileName = "npm.cmd",
                    Arguments = "run dev",
                    WorkingDirectory = frontendDir,
                    CreateNoWindow = true,
                    UseShellExecute = false
                };
                ConfigurarEntornoNode(infoFrontend);
                infoFrontend.EnvironmentVariables["VITE_API_BASE_URL"] = $"{config.BackendUrl.TrimEnd('/')}{config.FrontendApiPath}";

                frontendProcess = Process.Start(infoFrontend);
                Log("Frontend iniciado", "OK");

                // Esperar un momento y validar si se cayeron rápido
                Task.Delay(4000).ContinueWith((t) =>
                {
                    Dispatcher.Invoke(() =>
                    {
                        if (backendProcess != null && backendProcess.HasExited)
                        {
                            Log("El backend se detuvo inesperadamente al iniciar. Revisá DATABASE_URL y conectividad.", "ERROR");
                        }
                        if (frontendProcess != null && frontendProcess.HasExited)
                        {
                            Log("El frontend se detuvo inesperadamente al iniciar. Revisá dependencias.", "ERROR");
                        }
                    });
                });
            }
            catch (Exception ex)
            {
                Log($"Error al iniciar servicios: {ex.Message}", "ERROR");
                ApagarInfraestructura();
            }
        }

        private void ApagarInfraestructura()
        {
            Log("Deteniendo procesos activos...");

            // Detener Frontend
            if (frontendProcess != null && !frontendProcess.HasExited)
            {
                try
                {
                    KillProcessTree(frontendProcess);
                }
                catch (Exception ex)
                {
                    Log($"Error al detener el frontend: {ex.Message}", "ERROR");
                }
                frontendProcess = null;
            }

            // Detener Backend
            if (backendProcess != null && !backendProcess.HasExited)
            {
                try
                {
                    KillProcessTree(backendProcess);
                }
                catch (Exception ex)
                {
                    Log($"Error al detener el backend: {ex.Message}", "ERROR");
                }
                backendProcess = null;
            }

            isInfraActive = false;
            lblEstadoGeneral.Content = "Standby";
            ActualizarColorTarjetaGeneral();

            btnInfra.Content = "Iniciar infraestructura";
            btnInfra.Style = (Style)this.Resources["FluentPrimaryButtonStyle"];
        }

        private void KillProcessTree(Process process)
        {
            try
            {
                // En Windows, los procesos levantados a través de .cmd levantan procesos hijos.
                // Usar taskkill es la forma más limpia de matar todo el árbol.
                using (var taskkill = new Process())
                {
                    taskkill.StartInfo.FileName = "taskkill";
                    taskkill.StartInfo.Arguments = $"/T /F /PID {process.Id}";
                    taskkill.StartInfo.CreateNoWindow = true;
                    taskkill.StartInfo.UseShellExecute = false;
                    taskkill.Start();
                    taskkill.WaitForExit(3000);
                }
            }
            catch
            {
                try { process.Kill(); } catch { }
            }
        }

        // ── Monitoreo de Conexiones ──────────────────────────────────────────────────────

        private async Task BucleMonitoreo()
        {
            var cliente = new HttpClient();
            cliente.Timeout = TimeSpan.FromSeconds(4);
            // Evitar alerta del túnel local si se usa ngrok/localtunnel
            cliente.DefaultRequestHeaders.Add("Bypass-Tunnel-Reminder", "true");

            while (isMonitorActive)
            {
                try
                {
                    // 1. Chequeo Backend
                    string bUrl = config.BackendUrl;
                    bool backendOk = false;
                    long backendLatency = 0;
                    try
                    {
                        var sw = Stopwatch.StartNew();
                        var res = await cliente.GetAsync($"{bUrl.TrimEnd('/')}{config.FrontendApiPath}/health");
                        sw.Stop();
                        backendOk = res.IsSuccessStatusCode;
                        backendLatency = sw.ElapsedMilliseconds;
                    }
                    catch { }

                    // 2. Chequeo Frontend
                    string fUrl = config.FrontendUrl;
                    bool frontendOk = false;
                    long frontendLatency = 0;
                    try
                    {
                        var sw = Stopwatch.StartNew();
                        var res = await cliente.GetAsync(fUrl);
                        sw.Stop();
                        frontendOk = res.IsSuccessStatusCode;
                        frontendLatency = sw.ElapsedMilliseconds;
                    }
                    catch { }

                    // 3. Chequeo Base de Datos con obtención de métricas
                    DbStats dbStats = ObtenerDbStats();
                    bool dbOk = dbStats.Ok;

                    // Actualizar interfaz
                    Dispatcher.Invoke(() =>
                    {
                        // Backend
                        lblEstadoBackend.Content = backendOk ? "Conectado" : "Sin conexión";
                        lblDetalleBackend.Content = backendOk ? $"Latencia: {backendLatency} ms" : "Puerto: 3001";
                        ActualizarColorTarjetaEstado(lblEstadoBackend);

                        // Frontend
                        lblEstadoFrontend.Content = frontendOk ? "Conectado" : "Sin conexión";
                        lblDetalleFrontend.Content = frontendOk ? $"Latencia: {frontendLatency} ms" : "Puerto: 5173";
                        ActualizarColorTarjetaEstado(lblEstadoFrontend);

                        // Base de Datos
                        lblEstadoDB.Content = dbOk ? "Conectado" : "Sin conexión";
                        lblTituloDB.Content = dbOk ? $"Base de Datos ({dbStats.Mode})" : "Base de Datos";
                        lblDetalleDB.Content = dbOk 
                            ? $"Graduados: {dbStats.Egresados} | Invitados: {dbStats.Invitados} | Ceremonias: {dbStats.Ceremonias}"
                            : "Puerto local inactivo";
                        ActualizarColorTarjetaEstado(lblEstadoDB);

                        // Global
                        lblEstadoGeneral.Content = (backendOk && frontendOk && dbOk) ? "Operativo" : (isInfraActive ? "Falla" : "Standby");
                        lblDetalleGeneral.Content = (backendOk && frontendOk && dbOk) 
                            ? "Todos los servicios en línea" 
                            : (isInfraActive ? "Fallo en algún servicio" : "Servicios en standby");
                        ActualizarColorTarjetaGeneral();

                        // Registrar en log solo si cambió de estado
                        string curB = backendOk ? "Ok" : "Falla";
                        string curF = frontendOk ? "Ok" : "Falla";
                        string curD = dbOk ? "Ok" : "Falla";

                        if (curB != lastBackendState || curF != lastFrontendState || curD != lastDbState)
                        {
                            lastBackendState = curB;
                            lastFrontendState = curF;
                            lastDbState = curD;
                            Log($"Estado de servicios → Backend: {curB} ({backendLatency}ms) | Frontend: {curF} ({frontendLatency}ms) | DB: {curD} ({dbStats.Mode})", "AUDIT");
                        }
                    });
                }
                catch
                {
                    // Continuar monitoreo
                }

                await Task.Delay(5000);
            }
        }

        private DbStats ObtenerDbStats()
        {
            var stats = new DbStats { Ok = false, Mode = "Desconocido", Error = "Sin conexión" };
            try
            {
                var infoDb = new ProcessStartInfo
                {
                    FileName = "node.exe",
                    Arguments = "-e \"const {query}=require('./db'); Promise.all([query('SELECT COUNT(*) as cnt FROM egresados').then(r => Number(r.rows[0].cnt)).catch(() => 0), query('SELECT COUNT(*) as cnt FROM invitados').then(r => Number(r.rows[0].cnt)).catch(() => 0), query('SELECT COUNT(*) as cnt FROM ceremonias WHERE activa = 1').then(r => Number(r.rows[0].cnt)).catch(() => 0)]).then(([eg, inv, cer]) => { console.log(JSON.stringify({ok:true, mode: process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite', egresados:eg, invitados:inv, ceremonias:cer})); process.exit(0); }).catch(e => { console.log(JSON.stringify({ok:false, err:e.message})); process.exit(1); })\"",
                    WorkingDirectory = backendDir,
                    CreateNoWindow = true,
                    UseShellExecute = false,
                    RedirectStandardOutput = true
                };
                ConfigurarEntornoNode(infoDb);

                if (!string.IsNullOrEmpty(config.DatabaseUrl))
                {
                    infoDb.EnvironmentVariables["DATABASE_URL"] = config.DatabaseUrl;
                }

                using (var proc = Process.Start(infoDb))
                {
                    if (proc != null)
                    {
                        string output = proc.StandardOutput.ReadToEnd();
                        proc.WaitForExit(6000);
                        if (proc.ExitCode == 0 && !string.IsNullOrWhiteSpace(output))
                        {
                            var lineas = output.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
                            foreach (var linea in lineas)
                            {
                                var trimLinea = linea.Trim();
                                if (trimLinea.StartsWith("{") && trimLinea.EndsWith("}"))
                                {
                                    try
                                    {
                                        using (var doc = System.Text.Json.JsonDocument.Parse(trimLinea))
                                        {
                                            var root = doc.RootElement;
                                            if (root.TryGetProperty("ok", out var okProp) && okProp.GetBoolean())
                                            {
                                                stats.Ok = true;
                                                stats.Mode = root.GetProperty("mode").GetString() ?? "Desconocido";
                                                stats.Egresados = root.GetProperty("egresados").GetInt32();
                                                stats.Invitados = root.GetProperty("invitados").GetInt32();
                                                stats.Ceremonias = root.GetProperty("ceremonias").GetInt32();
                                                stats.Error = "";
                                                return stats;
                                            }
                                        }
                                    }
                                    catch { }
                                }
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                stats.Error = ex.Message;
            }
            return stats;
        }

        // ── Eventos de la Interfaz ───────────────────────────────────────────────────────

        private void btnAbrir_Click(object sender, RoutedEventArgs e)
        {
            ActualizarConfigDesdeUi();
            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = config.FrontendUrl,
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                Log($"No se pudo abrir el navegador: {ex.Message}", "ERROR");
            }
        }

        private void btnGuardar_Click(object sender, RoutedEventArgs e)
        {
            ActualizarConfigDesdeUi();
            config.Guardar(configPath);
            Log("Configuración guardada correctamente en JSON", "OK");
        }

        private void btnSetup_Click(object sender, RoutedEventArgs e)
        {
            ActualizarConfigDesdeUi();
            if (MessageBox.Show("¿Estás seguro de que deseas forzar el asistente de configuración inicial? Se limpiarán los datos actuales.", 
                "Forzar Asistente Inicial", MessageBoxButton.YesNo, MessageBoxImage.Warning) == MessageBoxResult.No)
            {
                return;
            }

            Log("Limpiando datos y marcando setup inicial como no completado...", "AUDIT");
            
            try
            {
                var infoReset = new ProcessStartInfo
                {
                    FileName = "npm.cmd",
                    Arguments = "run db:reset-datos",
                    WorkingDirectory = backendDir,
                    CreateNoWindow = true,
                    UseShellExecute = false
                };
                ConfigurarEntornoNode(infoReset);

                if (!string.IsNullOrEmpty(config.DatabaseUrl))
                {
                    infoReset.EnvironmentVariables["DATABASE_URL"] = config.DatabaseUrl;
                }

                var procReset = Process.Start(infoReset);
                procReset?.WaitForExit(30000);

                if (procReset != null && procReset.ExitCode == 0)
                {
                    Log("Asistente inicial forzado con éxito. Reiniciá el servidor y abrí la interfaz.", "OK");
                    try
                    {
                        Process.Start(new ProcessStartInfo
                        {
                            FileName = $"{config.FrontendUrl.TrimEnd('/')}/?asistente=1",
                            UseShellExecute = true
                        });
                    }
                    catch { }
                }
                else
                {
                    Log("No se pudieron resetear los datos del servidor.", "ERROR");
                }
            }
            catch (Exception ex)
            {
                Log($"Error al resetear datos: {ex.Message}", "ERROR");
            }
        }

        private void btnProbar_Click(object sender, RoutedEventArgs e)
        {
            ActualizarConfigDesdeUi();
            Log("Chequeando conexiones manualmente...", "INFO");
            // El hilo de monitoreo se encargará de actualizar el estado inmediatamente al cambiar de variables
        }

        private void comboEntorno_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (config == null || comboEntorno.SelectedItem == null) return;
            string entorno = (comboEntorno.SelectedItem as ComboBoxItem)?.Content?.ToString() ?? "local";
            
            // Cargar presets idénticos a Python
            if (entorno == "local")
            {
                txtBackendUrl.Text = "http://localhost:3001";
                txtFrontendUrl.Text = "http://localhost:5173";
            }
            else if (entorno == "vps")
            {
                txtBackendUrl.Text = "https://api.tu-dominio.com";
                txtFrontendUrl.Text = "https://app.tu-dominio.com";
            }
            else if (entorno == "aws")
            {
                txtBackendUrl.Text = "https://api.tu-app.aws.com";
                txtFrontendUrl.Text = "https://tu-app.aws.com";
            }
            else if (entorno == "firebase")
            {
                txtBackendUrl.Text = "https://us-central1-tu-proyecto.cloudfunctions.net";
                txtFrontendUrl.Text = "https://tu-proyecto.web.app";
            }

            Log($"Entorno seleccionado: {entorno}");
        }

        private void comboTema_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (config == null || comboTema.SelectedItem == null) return;
            string tema = (comboTema.SelectedItem as ComboBoxItem)?.Content?.ToString() ?? "sistema";
            
            config.Tema = tema;
            AplicarTema(tema);
            Log($"Tema de la aplicación actualizado a: {tema}");
        }

        private void MainWindow_Closing(object? sender, System.ComponentModel.CancelEventArgs e)
        {
            isMonitorActive = false;
            ApagarInfraestructura();
        }
    }
}