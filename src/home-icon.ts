export function appendHomeIcon(target: HTMLElement): void {
	const document = target.ownerDocument;
	const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	icon.classList.add('bullet-zoom-home-icon');
	icon.setAttribute('viewBox', '0 0 24 24');
	icon.setAttribute('fill', 'none');
	icon.setAttribute('stroke', 'currentColor');
	icon.setAttribute('stroke-width', '2');
	icon.setAttribute('stroke-linecap', 'round');
	icon.setAttribute('stroke-linejoin', 'round');
	icon.setAttribute('aria-hidden', 'true');
	const roof = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	roof.setAttribute('d', 'm3 11 9-8 9 8');
	const house = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	house.setAttribute('d', 'M5 10v10h14V10M9 20v-6h6v6');
	icon.append(roof, house);
	target.append(icon);
}
