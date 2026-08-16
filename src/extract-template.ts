export interface ExtractTemplateValues {
	readonly content: string;
	readonly title: string;
	readonly date: string;
	readonly time: string;
	readonly source: string;
}

const PLACEHOLDER_PATTERN = /\{\{\s*(content|title|date|time|source)\s*\}\}/gi;

export function renderExtractTemplate(
	template: string,
	values: ExtractTemplateValues,
): string {
	if (template.trim().length === 0) {
		return values.content;
	}
	let sawContent = false;
	const rendered = template.replace(PLACEHOLDER_PATTERN, (_match, name) => {
		const key = String(name).toLowerCase();
		if (key === 'content') {
			sawContent = true;
			return values.content;
		}
		if (key === 'title') {
			return values.title;
		}
		if (key === 'date') {
			return values.date;
		}
		if (key === 'time') {
			return values.time;
		}
		return values.source;
	});
	if (sawContent) {
		return rendered;
	}
	return `${rendered.replace(/\s+$/, '')}\n\n${values.content}`;
}

export function formatTemplateDate(now: Date): string {
	const year = String(now.getFullYear()).padStart(4, '0');
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function formatTemplateTime(now: Date): string {
	const hours = String(now.getHours()).padStart(2, '0');
	const minutes = String(now.getMinutes()).padStart(2, '0');
	return `${hours}:${minutes}`;
}
