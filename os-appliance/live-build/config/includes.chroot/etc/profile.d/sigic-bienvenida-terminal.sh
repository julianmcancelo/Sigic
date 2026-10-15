# Banner institucional exclusivo de SiGIC para terminales interactivas
if [ -t 1 ] && [ -n "$PS1" ]; then
  CYAN="\033[1;36m"
  BLUE="\033[1;34m"
  GREEN="\033[1;32m"
  YELLOW="\033[1;33m"
  WHITE="\033[1;37m"
  SLATE="\033[0;37m"
  MUTED="\033[0;90m"
  RESET="\033[0m"

  echo -e ""
  echo -e "  ${CYAN}╭─────────────────────────────────────────────────────────────╮${RESET}"
  echo -e "  ${CYAN}│${RESET}   ${CYAN}____  _ ____ ___ ____${RESET}                                     ${CYAN}│${RESET}"
  echo -e "  ${CYAN}│${RESET}  ${CYAN}/ ___|(_) ___|_ _/ ___|${RESET}   ${WHITE}Instituto Beltrán${RESET}                  ${CYAN}│${RESET}"
  echo -e "  ${CYAN}│${RESET}  ${CYAN}\___ \| | |  _| | |${RESET}      ${MUTED}Práctica Profesionalizante 2026${RESET}    ${CYAN}│${RESET}"
  echo -e "  ${CYAN}│${RESET}   ${BLUE}___) | | |_| | | |___${RESET}                                     ${CYAN}│${RESET}"
  echo -e "  ${CYAN}│${RESET}  ${BLUE}|____/|_|\____|___\____|${RESET}  ${GREEN}Sistema Institucional${RESET}              ${CYAN}│${RESET}"
  echo -e "  ${CYAN}│${RESET}                                                             ${CYAN}│${RESET}"
  echo -e "  ${CYAN}│${RESET}  ${WHITE}Equipo:${RESET} Cancelo J. · Alfonso A. · Contreras S. ·                 ${CYAN}│${RESET}"
  echo -e "  ${CYAN}│${RESET}          Frassia M. · Santillán L.                                  ${CYAN}│${RESET}"
  echo -e "  ${CYAN}│${RESET}  ${WHITE}Servicio:${RESET} ${GREEN}localhost:3000${RESET}  •  ${WHITE}Base de Datos:${RESET} ${GREEN}PostgreSQL Activo${RESET} ${CYAN}│${RESET}"
  echo -e "  ${CYAN}│${RESET}  ${WHITE}Comandos:${RESET} ${YELLOW}sigic-acerca-de${RESET}  •  ${YELLOW}sigic-iniciar${RESET}               ${CYAN}│${RESET}"
  echo -e "  ${CYAN}╰─────────────────────────────────────────────────────────────╯${RESET}"
  echo -e ""

  # Prompt personalizado de SiGIC
  export PS1="\[\033[1;36m\]sigic\[\033[0m\]@\[\033[1;34m\]beltran\[\033[0m\]:\[\033[1;32m\]\w\[\033[0m\]\[\033[1;36m\] ❯\[\033[0m\] "
fi
