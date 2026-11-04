const movimientoReducido = matchMedia('(prefers-reduced-motion: reduce)');
const elementos = document.querySelectorAll('.benefits-heading, .benefits-grid article, .landing-closing');
if ('IntersectionObserver' in window && !movimientoReducido.matches) {
  const observador = new IntersectionObserver(entradas => entradas.forEach(entrada => {
    if (entrada.isIntersecting) { entrada.target.classList.add('visible'); observador.unobserve(entrada.target); }
  }), {threshold:.1});
  elementos.forEach(elemento => { elemento.classList.add('reveal'); observador.observe(elemento); });
}
const portada = document.querySelector('.hero');
const encabezado = document.querySelector('.landing-header');
let cuadroPendiente = false;
function actualizarMovimiento() {
  cuadroPendiente = false;
  const rect = portada.getBoundingClientRect();
  const salida = movimientoReducido.matches ? 0 : Math.max(0,Math.min(1,-rect.top/rect.height));
  portada.style.setProperty('--salida',salida);
  encabezado.classList.toggle('scrolled',scrollY>35);
}
function solicitarCuadro() { if (!cuadroPendiente) { cuadroPendiente=true; requestAnimationFrame(actualizarMovimiento); } }
addEventListener('scroll',solicitarCuadro,{passive:true});
addEventListener('resize',solicitarCuadro);
movimientoReducido.addEventListener('change',()=>{elementos.forEach(elemento=>elemento.classList.add('visible'));solicitarCuadro();});
const escenaEncuentro = document.querySelector('.ceremony-scene');
const contenedorPersonas = document.getElementById('personas-ceremonia');
for (let indice = 0; indice < 36; indice++) {
  const persona = document.createElement('span');
  persona.className = 'ceremony-person';
  const fila = Math.floor(indice / 12);
  const angulo = (22 + (indice % 12) * 12.3) * Math.PI / 180;
  const radioX = 29 + fila * 9;
  const radioY = 21 + fila * 8;
  persona.style.setProperty('--destino-x', `${50 + Math.cos(angulo) * radioX}%`);
  persona.style.setProperty('--destino-y', `${31 + Math.sin(angulo) * radioY}%`);
  persona.style.setProperty('--origen-x', `${Math.sin(indice * 7.3) * 170}px`);
  persona.style.setProperty('--origen-y', `${Math.cos(indice * 3.7) * 95}px`);
  persona.style.setProperty('--espera', `${indice * 22}ms`);
  persona.style.setProperty('--tono', indice % 3 === 0 ? '#087fbd' : indice % 3 === 1 ? '#29abe2' : '#a6d6e9');
  contenedorPersonas.append(persona);
}
if ('IntersectionObserver' in window) {
  const observadorEncuentro = new IntersectionObserver(entradas => {
    entradas.forEach(entrada => escenaEncuentro.classList.toggle('assembled', entrada.isIntersecting));
  }, {threshold: .28});
  observadorEncuentro.observe(escenaEncuentro);
} else escenaEncuentro.classList.add('assembled');

actualizarMovimiento();
