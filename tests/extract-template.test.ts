import { describe, expect, it } from 'vitest';

import {
	formatTemplateDate,
	formatTemplateTime,
	renderExtractTemplate,
} from '../src/extract-template';

const values = {
	content: '- A',
	title: '想法',
	date: '2026-08-16',
	time: '09:30',
	source: '[[Daily]]',
};

describe('renderExtractTemplate', () => {
	it('substitutes every known placeholder', () => {
		expect(
			renderExtractTemplate(
				'# {{title}}\n\n{{content}}\n\n來源：{{source}}',
				values,
			),
		).toBe('# 想法\n\n- A\n\n來源：[[Daily]]');
	});

	it('appends content after a blank line when the template has no content placeholder', () => {
		expect(renderExtractTemplate('# {{title}}', values)).toBe('# 想法\n\n- A');
	});

	it('returns the content unchanged for an empty template', () => {
		expect(renderExtractTemplate('', values)).toBe('- A');
		expect(renderExtractTemplate('   \n  ', values)).toBe('- A');
	});

	it('matches placeholders case-insensitively and tolerates inner whitespace', () => {
		expect(
			renderExtractTemplate('{{ TITLE }} / {{Date}} / {{ time }}', values),
		).toBe('想法 / 2026-08-16 / 09:30\n\n- A');
	});

	it('leaves unknown placeholders untouched', () => {
		expect(renderExtractTemplate('{{unknown}}\n{{content}}', values)).toBe(
			'{{unknown}}\n- A',
		);
	});
});

describe('template date and time formatting', () => {
	it('formats local date and time with zero padding', () => {
		const moment = new Date(2026, 7, 5, 7, 4);
		expect(formatTemplateDate(moment)).toBe('2026-08-05');
		expect(formatTemplateTime(moment)).toBe('07:04');
	});
});
