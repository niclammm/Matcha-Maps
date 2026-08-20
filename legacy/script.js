const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

const gridCanvas = document.getElementById('bgGrid');
if (gridCanvas && window.ShapeGrid) {
  new ShapeGrid(gridCanvas, {
    direction: 'diagonal',
    speed: 0.25,
    squareSize: 36,
    borderColor: 'rgba(47, 94, 59, 0.14)',
    hoverFillColor: 'rgba(47, 94, 59, 0.14)',
    hoverTrailAmount: 6,
    icons: false,
  });
}
