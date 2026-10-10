/**
 * Mounts the shared accordion behavior for markup rendered outside React.
 * @param rootElement The root element containing accordion markup.
 * @param onToggle Optional callback called with the accordion ID and open state.
 * @returns A cleanup function that removes the event listener.
 */
export function mountAccordionInteractions(rootElement, onToggle) {
  if (!rootElement) return () => {};

  const handleClick = (event) => {
    const button = event.target.closest('.accordion-btn');
    if (!button || !rootElement.contains(button)) return;

    const accordion = button.closest('.accordion');
    const content = accordion && accordion.querySelector('.accordion-content');
    if (!content) return;

    const isOpen = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(isOpen));
    content.classList.toggle('open', isOpen);

    const icon = button.querySelector('.accordion-icon');
    if (icon) icon.textContent = isOpen ? '−' : '+';

    if (typeof onToggle === 'function') onToggle(accordion.dataset.accordionId, isOpen);
  };

  rootElement.addEventListener('click', handleClick);
  return () => rootElement.removeEventListener('click', handleClick);
}
