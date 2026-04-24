import tkinter as tk
from tkinter import messagebox, scrolledtext
import subprocess
import threading
import os
import webbrowser
import time
import socket
import sys

# --- DISEÑO PREMIUM MINIMALISTA (Inspirado en la Web UI) ---
UI = {
    "bg": "#F9FAFB",
    "card": "#FFFFFF",
    "header": "#111827",      # Slate 950
    "accent": "#0EA5E9",      # Sky 500
    "success": "#10B981",     # Emerald
    "danger": "#EF4444",      # Rose
    "text": "#374151",        # Slate 700
    "text_light": "#6B7280",  # Slate 500
    "border": "#F3F4F6"
}

VERSION = "3.5.0"
NOMBRE = "SiGIC"
DESCRIPCION = "Sistema de Gestión de Invitados y Ceremonias"

class SiGICManagerPro:
    def __init__(self, root):
        self.root = root
        self.root.title(f"{NOMBRE} | Centro de Control")
        self.root.geometry("850x700")
        self.root.configure(bg=UI["bg"])
        
        self.procesos = {"api": None, "web": None}
        self.raiz = self.detectar_raiz()
        self.activo = False
        
        # Establecer icono de ventana si existe el logo
        logo_path = os.path.join(self.raiz, "logo-oficial.png")
        if os.path.exists(logo_path):
            try:
                self.icon_img = tk.PhotoImage(file=logo_path)
                self.root.iconphoto(False, self.icon_img)
            except:
                pass

        self.setup_ui()
        self.log(f"Sistema {NOMBRE} listo para operar. Versión {VERSION}.")

    def detectar_raiz(self):
        if getattr(sys, 'frozen', False): c = os.path.dirname(sys.executable)
        else: c = os.path.dirname(os.path.abspath(__file__))
        if os.path.exists(os.path.join(c, "backend")): return c
        p = os.path.dirname(c)
        if os.path.exists(os.path.join(p, "backend")): return p
        return c

    def setup_ui(self):
        # --- HEADER ---
        header = tk.Frame(self.root, bg=UI["header"], height=130)
        header.pack(fill="x")
        header.pack_propagate(False)

        inner_header = tk.Frame(header, bg=UI["header"], padx=50)
        inner_header.pack(fill="both", expand=True)

        self.logo_img = None
        logo_path = os.path.join(self.raiz, "logo-oficial.png")
        if os.path.exists(logo_path):
            try:
                self.logo_img = tk.PhotoImage(file=logo_path)
                self.logo_img = self.logo_img.subsample(2, 2) # Logo más grande (1/2 en vez de 1/3)
            except Exception:
                pass
                
        if self.logo_img:
            tk.Label(inner_header, image=self.logo_img, bg=UI["header"]).pack(anchor="w", pady=(20, 0))
        else:
            tk.Label(inner_header, text=NOMBRE, bg=UI["header"], fg=UI["accent"], 
                     font=("Segoe UI Variable Display", 28, "bold")).pack(anchor="w", pady=(25, 0))
            tk.Label(inner_header, text=DESCRIPCION, bg=UI["header"], fg="white", 
                     font=("Segoe UI", 10)).pack(anchor="w")


        # --- CUERPO ---
        cuerpo = tk.Frame(self.root, bg=UI["bg"], padx=50, pady=40)
        cuerpo.pack(fill="both", expand=True)

        # Dashboard de Operaciones (Bento Style)
        dash = tk.Frame(cuerpo, bg=UI["bg"])
        dash.pack(fill="x", pady=(0, 20))

        # Tarjeta 1: Estado Operativo
        self.card_status = self.crear_tarjeta(dash, "CENTRO DE OPERACIONES", 0, 0)
        self.lbl_status = tk.Label(self.card_status, text="MODO STANDBY", bg="white", fg=UI["text_light"], 
                                    font=("Segoe UI", 11, "bold"))
        self.lbl_status.pack(pady=(15, 5))
        
        # Indicador visual
        self.canvas_dot = tk.Canvas(self.card_status, width=140, height=30, bg="white", highlightthickness=0)
        self.canvas_dot.pack()
        self.dibujar_punto("OFFLINE")

        # Tarjeta 2: Servicios de Red
        self.card_net = self.crear_tarjeta(dash, "ESTADO DE SERVICIOS", 0, 1)
        self.lbl_api = tk.Label(self.card_net, text="• Backend API: Inactivo", bg="white", fg=UI["text_light"], font=("Segoe UI", 9))
        self.lbl_api.pack(anchor="w", padx=20, pady=(10, 2))
        self.lbl_web = tk.Label(self.card_net, text="• Frontend Web: Inactivo", bg="white", fg=UI["text_light"], font=("Segoe UI", 9))
        self.lbl_web.pack(anchor="w", padx=20)

        # --- BOTONES DE ACCIÓN ---
        acciones = tk.Frame(cuerpo, bg=UI["bg"])
        acciones.pack(fill="x", pady=10)

        self.btn_main = self.crear_boton(acciones, "DESPLEGAR INFRAESTRUCTURA", UI["accent"], self.toggle_infra)
        self.btn_main.pack(side="left", expand=True, fill="x", padx=(0, 10))

        self.btn_panel = self.crear_boton(acciones, "ABRIR PANEL DE CONTROL", UI["header"], self.abrir_web)
        self.btn_panel.pack(side="left", expand=True, fill="x")
        self.btn_panel.config(state="disabled")

        # --- REGISTRO DE ACTIVIDAD ---
        tk.Label(cuerpo, text="REGISTRO DE EVENTOS", bg=UI["bg"], fg=UI["text_light"], 
                 font=("Segoe UI", 8, "bold")).pack(anchor="w", pady=(25, 5))
        
        consola_bg = tk.Frame(cuerpo, bg=UI["border"], padx=1, pady=1)
        consola_bg.pack(fill="both", expand=True)

        self.console = scrolledtext.ScrolledText(consola_bg, bg="#FFFFFF", fg=UI["text"], 
                                                 font=("Consolas", 10), borderwidth=0, padx=15, pady=15)
        self.console.pack(fill="both", expand=True)

        # Footer
        footer = tk.Frame(cuerpo, bg=UI["bg"], pady=20)
        footer.pack(fill="x")
        
        tk.Button(footer, text="Acerca de SiGIC", command=self.acerca_de, bg=UI["bg"], fg=UI["text_light"], 
                  font=("Segoe UI", 9), relief="flat", padx=10).pack(side="left")
        
        tk.Button(footer, text="Salir", command=self.salir, bg="#CBD5E1", fg=UI["text"], 
                  font=("Segoe UI", 9, "bold"), relief="flat", padx=20, pady=8).pack(side="right")

    def crear_tarjeta(self, padre, titulo, r, c):
        f = tk.Frame(padre, bg="white", padx=20, pady=25, highlightbackground=UI["border"], highlightthickness=1)
        f.grid(row=r, column=c, sticky="nsew", padx=6)
        padre.grid_columnconfigure(c, weight=1)
        tk.Label(f, text=titulo, bg="white", fg=UI["accent"], font=("Segoe UI", 8, "bold")).pack(anchor="w")
        return f

    def crear_boton(self, padre, texto, color, cmd):
        btn = tk.Button(padre, text=texto, command=cmd, bg=color, fg="white", 
                        font=("Segoe UI", 10, "bold"), relief="flat", padx=25, pady=15, cursor="hand2")
        btn.bind("<Enter>", lambda e: btn.config(background="#0284C7" if color == UI["accent"] else "#1F2937"))
        btn.bind("<Leave>", lambda e: btn.config(background=color))
        return btn

    def dibujar_punto(self, estado):
        self.canvas_dot.delete("all")
        color = UI["success"] if estado == "OPERATIVO" else UI["danger"] if estado == "ERROR" else UI["text_light"]
        self.canvas_dot.create_oval(45, 12, 53, 20, fill=color, outline="")
        self.canvas_dot.create_text(85, 16, text=estado, fill=UI["text_light"], font=("Segoe UI", 8, "bold"))

    def log(self, msg, tipo="INFO"):
        ahora = time.strftime("%H:%M:%S")
        self.console.insert(tk.END, f"[{ahora}] [{tipo}] {msg}\n")
        self.console.see(tk.END)

    def toggle_infra(self):
        if not self.activo: self.encender()
        else: self.apagar()

    def encender(self):
        self.activo = True
        self.btn_main.config(text="DETENER INFRAESTRUCTURA", bg=UI["danger"])
        self.lbl_status.config(text="SISTEMA ACTIVO", fg=UI["success"])
        self.dibujar_punto("OPERATIVO")
        self.log("Desplegando servicios de red.")
        threading.Thread(target=self._hilo_run, daemon=True).start()

    def _hilo_run(self):
        try:
            self.lbl_api.config(text="• Backend API: Iniciando...", fg=UI["accent"])
            self.procesos["api"] = subprocess.Popen("npm start", cwd=os.path.join(self.raiz, "backend"), 
                                                   shell=True, creationflags=0x08000000)
            self.log("Backend activo.")
            self.lbl_api.config(text="• Backend API: Operativo", fg=UI["success"])
            
            self.lbl_web.config(text="• Frontend Web: Iniciando...", fg=UI["accent"])
            self.procesos["web"] = subprocess.Popen("npm run dev", cwd=os.path.join(self.raiz, "frontend"), 
                                                   shell=True, creationflags=0x08000000)
            self.log("Interfaz Web activa.")
            self.lbl_web.config(text="• Frontend Web: Operativo", fg=UI["success"])
            
            time.sleep(3)
            self.btn_panel.config(state="normal")
            self.log("Sincronización completa.", "EXITO")
        except Exception as e:
            self.log(f"Falla: {e}", "ERROR")
            self.apagar()

    def apagar(self):
        self.log("Solicitando desconexión de servicios.")
        subprocess.call(['taskkill', '/F', '/IM', 'node.exe', '/T'], shell=True, creationflags=0x08000000)
        self.activo = False
        self.btn_main.config(text="DESPLEGAR INFRAESTRUCTURA", bg=UI["accent"])
        self.btn_panel.config(state="disabled")
        self.lbl_status.config(text="MODO STANDBY", fg=UI["text_light"])
        self.lbl_api.config(text="• Backend API: Inactivo", fg=UI["text_light"])
        self.lbl_web.config(text="• Frontend Web: Inactivo", fg=UI["text_light"])
        self.dibujar_punto("OFFLINE")
        self.log("Servidores desconectados.")

    def abrir_web(self):
        webbrowser.open("http://localhost:5173")

    def acerca_de(self):
        info = (
            f"{NOMBRE} v{VERSION}\n\n"
            f"{DESCRIPCION}\n\n"
            "Desarrollado para el Instituto Tecnológico Beltrán.\n"
            "Propósito: Gestión autónoma de colaciones e invitados.\n\n"
            "© 2026 Ecosistema SiGIC."
        )
        messagebox.showinfo(f"Acerca de {NOMBRE}", info)

    def salir(self):
        if self.activo:
            if messagebox.askyesno("Confirmar", "¿Desea apagar los servicios antes de salir?"):
                self.apagar()
        self.root.destroy()

if __name__ == "__main__":
    root = tk.Tk()
    app = SiGICManagerPro(root)
    root.protocol("WM_DELETE_WINDOW", app.salir)
    root.mainloop()
