using System;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SiGIC_ControlCenter
{
    public class Configuracion
    {
        [JsonPropertyName("entorno")]
        public string Entorno { get; set; } = "local";

        [JsonPropertyName("backend_url")]
        public string BackendUrl { get; set; } = "http://localhost:3001";

        [JsonPropertyName("frontend_url")]
        public string FrontendUrl { get; set; } = "http://localhost:5173";

        [JsonPropertyName("database_url")]
        public string DatabaseUrl { get; set; } = "";

        [JsonPropertyName("backend_port")]
        public string BackendPort { get; set; } = "3001";

        [JsonPropertyName("frontend_api_path")]
        public string FrontendApiPath { get; set; } = "/api";

        [JsonPropertyName("tema")]
        public string Tema { get; set; } = "sistema";

        public static Configuracion Cargar(string ruta)
        {
            try
            {
                if (File.Exists(ruta))
                {
                    string json = File.ReadAllText(ruta);
                    var opciones = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var config = JsonSerializer.Deserialize<Configuracion>(json, opciones);
                    if (config != null) return config;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al cargar la configuración: {ex.Message}");
            }
            return new Configuracion();
        }

        public void Guardar(string ruta)
        {
            try
            {
                var directorio = Path.GetDirectoryName(ruta);
                if (!string.IsNullOrEmpty(directorio) && !Directory.Exists(directorio))
                {
                    Directory.CreateDirectory(directorio);
                }

                var opciones = new JsonSerializerOptions { WriteIndented = true };
                string json = JsonSerializer.Serialize(this, opciones);
                File.WriteAllText(ruta, json);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al guardar la configuración: {ex.Message}");
            }
        }
    }
}
