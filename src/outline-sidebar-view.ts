import { MapMode, type Text } from '@codemirror/state';
import { EditorView, type ViewUpdate } from '@codemirror/view';
import {
	ItemView,
	Modal,
	type EventRef,
	type Workspace,
	type WorkspaceLeaf,
} from 'obsidian';

import {
	buildBulletOutline,
	BulletOutlineLimitError,
	BulletOutlineParsePendingError,
	displayBulletLabel,
	findOutlinePath,
	findSupportedBullet,
	type BulletOutlineNode,
} from './list-structure';
import { appendHomeIcon } from './home-icon';

export const BULLET_OUTLINE_VIEW_TYPE = 'bullet-zoom-outline';
export const BULLET_OUTLINE_VIEW_NAME = 'Bullet 大綱';

const CARET_REFRESH_DELAY_MS = 40;

export type OutlineOpenResult = 'opened' | 'superseded' | 'failed';

export type OutlineSidebarStatus =
	| 'ready'
	| 'empty'
	| 'pending'
	| 'limited'
	| 'unavailable';

export type OutlineSidebarModel = Readonly<{
	revision: number;
	status: OutlineSidebarStatus;
	noteTitle: string;
	outline: readonly BulletOutlineNode[];
	currentAnchor: number | null;
	expandedAnchors: ReadonlySet<number>;
	revealCurrent: boolean;
	isMobile: boolean;
}>;

export type OutlineNodeAction = Readonly<{
	anchor: number;
	revision: number;
}>;

export type OutlineSidebarActions = Readonly<{
	onToggle: (action: OutlineNodeAction) => void;
	onSelect: (action: OutlineNodeAction) => void;
	onExit: (revision: number) => void;
	onRetry: (revision: number) => void;
	onPreview: (
		action: OutlineNodeAction,
		label: string,
		trigger: HTMLButtonElement,
	) => void;
}>;

type SourceContext = Readonly<{
	leaf: WorkspaceLeaf;
	view: EditorView;
	filePath: string;
	noteTitle: string;
	doc: Text;
	focusAnchor: number | null;
	currentAnchor: number | null;
}>;

export type OutlineSidebarCoordinatorOptions = Readonly<{
	workspace: Workspace;
	isMobile: boolean;
	getActiveEditorView: () => EditorView | null;
	resolveEditorView: (leaf: WorkspaceLeaf) => EditorView | null;
	isEditorEligible: (view: EditorView) => boolean;
	getFilePath: (view: EditorView) => string | null;
	getNoteTitle: (view: EditorView) => string;
	getFocusAnchor: (view: EditorView) => number | null;
	getCurrentAnchor: (view: EditorView) => number | null;
	onFocus: (view: EditorView, anchor: number) => boolean;
	onExit: (view: EditorView) => boolean;
	buildOutline?: typeof buildBulletOutline;
	onUnexpectedError?: () => void;
}>;

function collectAnchors(
	nodes: readonly BulletOutlineNode[],
	anchors = new Set<number>(),
): Set<number> {
	for (const node of nodes) {
		anchors.add(node.anchor);
		collectAnchors(node.children, anchors);
	}
	return anchors;
}

function createButton(
	document: Document,
	className: string,
	label: string,
): HTMLButtonElement {
	const button = document.createElement('button');
	button.type = 'button';
	button.className = className;
	button.textContent = label;
	return button;
}

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

function createDisclosureIcon(
	document: Document,
	isExpanded: boolean,
): SVGSVGElement {
	const icon = document.createElementNS(SVG_NAMESPACE, 'svg');
	icon.classList.add('bullet-zoom-outline-sidebar-disclosure-icon');
	icon.setAttribute('viewBox', '0 0 16 16');
	icon.setAttribute('aria-hidden', 'true');
	icon.setAttribute('focusable', 'false');
	const path = document.createElementNS(SVG_NAMESPACE, 'path');
	path.setAttribute(
		'd',
		isExpanded ? 'M3.5 5.5 8 10.5 12.5 5.5' : 'M5 3.5 10.5 8 5 12.5',
	);
	path.setAttribute('fill', 'none');
	path.setAttribute('stroke', 'currentColor');
	path.setAttribute('stroke-linecap', 'round');
	path.setAttribute('stroke-linejoin', 'round');
	path.setAttribute('stroke-width', '1.5');
	icon.append(path);
	return icon;
}

export function syncOutlineLabelOverflow(container: HTMLElement): void {
	const rows = Array.from(
		container.querySelectorAll<HTMLElement>(
			'.bullet-zoom-outline-sidebar-row',
		),
	);
	for (const row of rows) {
		const preview = row.querySelector<HTMLButtonElement>(
			'.bullet-zoom-outline-sidebar-preview',
		);
		if (preview !== null) {
			preview.hidden = true;
		}
	}
	for (const row of rows) {
		const label = row.querySelector<HTMLButtonElement>(
			'.bullet-zoom-outline-sidebar-label',
		);
		const preview = row.querySelector<HTMLButtonElement>(
			'.bullet-zoom-outline-sidebar-preview',
		);
		if (label === null || preview === null) {
			continue;
		}
		const labelText = label.querySelector<HTMLElement>(
			'.bullet-zoom-outline-sidebar-label-text',
		);
		const overflowTarget = labelText ?? label;
		preview.hidden =
			overflowTarget.scrollWidth <= overflowTarget.clientWidth + 1;
	}
}

class BulletLabelPreviewModal extends Modal {
	private closing = false;

	constructor(
		app: BulletOutlineSidebarView['app'],
		private readonly label: string,
		private readonly trigger: HTMLButtonElement,
	) {
		super(app);
	}

	onOpen(): void {
		this.titleEl.textContent = 'Bullet 全文';
		const text = this.contentEl.ownerDocument.createElement('p');
		text.className = 'bullet-zoom-outline-preview-text';
		text.textContent = this.label;
		const close = createButton(
			this.contentEl.ownerDocument,
			'bullet-zoom-outline-preview-close',
			'關閉',
		);
		close.addEventListener('click', () => this.close());
		this.contentEl.replaceChildren(text, close);
	}

	override close(): void {
		if (this.closing) {
			return;
		}
		this.closing = true;
		this.modalEl.hidden = true;
		super.close();
	}

	onClose(): void {
		this.contentEl.replaceChildren();
		if (this.trigger.isConnected) {
			this.trigger.focus({ preventScroll: true });
		}
	}
}

export function renderOutlineSidebar(
	container: HTMLElement,
	model: OutlineSidebarModel,
	actions: OutlineSidebarActions,
): void {
	const previousBody = container.querySelector<HTMLElement>(
		'.bullet-zoom-outline-sidebar-body',
	);
	const previousScrollTop = previousBody?.scrollTop ?? 0;
	const activeElement = container.ownerDocument.activeElement;
	const HTMLElementConstructor =
		container.ownerDocument.defaultView?.HTMLElement;
	const activeControl =
		HTMLElementConstructor !== undefined &&
		activeElement instanceof HTMLElementConstructor &&
		container.contains(activeElement)
			? activeElement
			: null;
	const activeAnchorText = activeControl
		?.closest<HTMLElement>('[data-anchor]')
		?.dataset.anchor;
	const activeAnchor =
		activeAnchorText !== undefined && /^\d+$/.test(activeAnchorText)
			? Number.parseInt(activeAnchorText, 10)
			: null;
	const activeRole = activeControl?.classList.contains(
		'bullet-zoom-outline-sidebar-disclosure',
	)
		? 'disclosure'
		: activeControl?.classList.contains('bullet-zoom-outline-sidebar-label')
			? 'label'
			: null;
	container.replaceChildren();
	container.classList.add('bullet-zoom-outline-sidebar');

	const document = container.ownerDocument;
	const header = document.createElement('div');
	header.className = 'bullet-zoom-outline-sidebar-header';
	const title = document.createElement('div');
	title.className = 'bullet-zoom-outline-sidebar-title';
	title.textContent = model.noteTitle;
	title.title = model.noteTitle;
	header.append(title);
	container.append(header);

	const body = document.createElement('div');
	body.className = 'bullet-zoom-outline-sidebar-body';
	container.append(body);
	if (model.status === 'unavailable') {
		const state = document.createElement('div');
		state.className = 'bullet-zoom-outline-sidebar-empty';
		state.textContent = '請先開啟即時預覽模式的 Markdown 筆記';
		body.append(state);
		return;
	}

	const root = createButton(document, 'bullet-zoom-outline-sidebar-root', '');
	appendHomeIcon(root);
	root.title = '回到全文';
	root.setAttribute('aria-label', '回到全文');
	if (model.currentAnchor === null) {
		root.classList.add('is-current');
		root.setAttribute('aria-current', 'true');
	}
	root.addEventListener('click', () => actions.onExit(model.revision));
	body.append(root);

	if (model.status !== 'ready') {
		const state = document.createElement('div');
		state.className = 'bullet-zoom-outline-sidebar-empty';
		state.textContent =
			model.status === 'pending'
				? '筆記結構仍在解析'
				: model.status === 'limited'
					? '這份筆記的 Bullet 大綱過大，請縮小結構後再試'
					: '這份筆記沒有可切換的 Bullet';
		body.append(state);
		if (model.status === 'pending') {
			const retry = createButton(
				document,
				'bullet-zoom-outline-sidebar-retry',
				'重新整理',
			);
			retry.setAttribute('aria-label', '重新整理 Bullet 大綱');
			retry.addEventListener('click', () => actions.onRetry(model.revision));
			body.append(retry);
		}
		return;
	}

	const tree = document.createElement('ul');
	tree.className = 'bullet-zoom-outline-sidebar-tree';
	tree.setAttribute('aria-label', `${model.noteTitle} Bullet 大綱`);
	body.append(tree);
	const renderNodes = (
		nodes: readonly BulletOutlineNode[],
		parent: HTMLUListElement,
		depth: number,
		parentNumberPath: readonly number[],
	): void => {
		for (const [index, node] of nodes.entries()) {
			const numberPath = [...parentNumberPath, index + 1];
			const item = document.createElement('li');
			item.className = 'bullet-zoom-outline-sidebar-item';
			item.dataset.anchor = String(node.anchor);
			const hasChildren = node.children.length > 0;
			const isExpanded = hasChildren && model.expandedAnchors.has(node.anchor);

			const row = document.createElement('div');
			row.className = `bullet-zoom-outline-sidebar-row is-depth-${Math.min(depth, 6)}`;
			if (node.anchor === model.currentAnchor) {
				row.classList.add('is-current');
			}
			item.append(row);

			const indexLabel = document.createElement('span');
			indexLabel.className = 'bullet-zoom-outline-sidebar-index';
			indexLabel.textContent =
				numberPath.length === 1
					? `${numberPath.join('.')}.`
					: numberPath.join('.');
			indexLabel.setAttribute('aria-hidden', 'true');
			row.append(indexLabel);

			if (hasChildren) {
				const disclosure = createButton(
					document,
					'bullet-zoom-outline-sidebar-disclosure',
					'',
				);
				disclosure.append(createDisclosureIcon(document, isExpanded));
				const nodeLabel = displayBulletLabel(node.label);
				const childGroupId = `bullet-zoom-outline-children-${model.revision}-${node.anchor}`;
				disclosure.setAttribute('aria-expanded', String(isExpanded));
				if (isExpanded) {
					disclosure.setAttribute('aria-controls', childGroupId);
				}
				disclosure.setAttribute(
					'aria-label',
					`${isExpanded ? '收合' : '展開'}「${nodeLabel}」的子節點`,
				);
				disclosure.addEventListener('click', () =>
					actions.onToggle(
						Object.freeze({ anchor: node.anchor, revision: model.revision }),
					),
				);
				row.append(disclosure);
			} else {
				const spacer = document.createElement('span');
				spacer.className = 'bullet-zoom-outline-sidebar-disclosure-spacer';
				spacer.setAttribute('aria-hidden', 'true');
				row.append(spacer);
			}

			const label = displayBulletLabel(node.label);
			const labelButton = createButton(
				document,
				'bullet-zoom-outline-sidebar-label',
				'',
			);
			const labelText = document.createElement('span');
			labelText.className = 'bullet-zoom-outline-sidebar-label-text';
			labelText.textContent = label;
			labelButton.append(labelText);
			labelButton.title = label;
			labelButton.setAttribute('aria-label', `聚焦「${label}」`);
			if (node.anchor === model.currentAnchor) {
				labelButton.setAttribute('aria-current', 'true');
			}
			labelButton.addEventListener('click', () =>
				actions.onSelect(
					Object.freeze({ anchor: node.anchor, revision: model.revision }),
				),
			);
			row.append(labelButton);
			if (model.isMobile) {
				const preview = createButton(
					document,
					'bullet-zoom-outline-sidebar-preview',
					'…',
				);
				preview.hidden = true;
				preview.setAttribute('aria-label', `查看「${label}」全文`);
				preview.addEventListener('click', () =>
					actions.onPreview(
						Object.freeze({ anchor: node.anchor, revision: model.revision }),
						label,
						preview,
					),
				);
				row.append(preview);
			}

			if (isExpanded) {
				const group = document.createElement('ul');
				group.className = 'bullet-zoom-outline-sidebar-group';
				group.id = `bullet-zoom-outline-children-${model.revision}-${node.anchor}`;
				item.append(group);
				renderNodes(node.children, group, depth + 1, numberPath);
			}
			parent.append(item);
		}
	};

	renderNodes(model.outline, tree, 0, []);
	syncOutlineLabelOverflow(container);
	if (
		!model.revealCurrent &&
		activeAnchor !== null &&
		activeRole !== null
	) {
		const restoredItem = Array.from(
			tree.querySelectorAll<HTMLElement>('[data-anchor]'),
		).find(
			({ dataset }) =>
				Number.parseInt(dataset.anchor ?? '', 10) === activeAnchor,
		);
		const restoredControl = restoredItem?.querySelector<HTMLButtonElement>(
			`.bullet-zoom-outline-sidebar-${activeRole}`,
		);
		if (restoredControl !== undefined && restoredControl !== null) {
			restoredControl.focus({ preventScroll: true });
			body.scrollTop = previousScrollTop;
			return;
		}
	}
	if (!model.revealCurrent) {
		body.scrollTop = previousScrollTop;
		return;
	}
	const current = container.querySelector<HTMLElement>('[aria-current="true"]');
	if (
		model.revealCurrent &&
		current !== null &&
		typeof current.scrollIntoView === 'function'
	) {
		current.scrollIntoView({ block: 'nearest' });
	}
}

export class BulletOutlineSidebarView extends ItemView {
	private model: OutlineSidebarModel | null = null;
	private retainedReadyScrollTop = 0;
	private resizeObserver: ResizeObserver | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly coordinator: BulletOutlineSidebarCoordinator,
	) {
		super(leaf);
	}

	getViewType(): string {
		return BULLET_OUTLINE_VIEW_TYPE;
	}

	getDisplayText(): string {
		return BULLET_OUTLINE_VIEW_NAME;
	}

	getIcon(): string {
		return 'list-tree';
	}

	async onOpen(): Promise<void> {
		const ResizeObserverConstructor =
			this.contentEl.ownerDocument.defaultView?.ResizeObserver;
		if (ResizeObserverConstructor !== undefined) {
			this.resizeObserver = new ResizeObserverConstructor(() =>
				syncOutlineLabelOverflow(this.contentEl),
			);
			this.resizeObserver.observe(this.contentEl);
		}
		this.coordinator.attachView(this);
	}

	async onClose(): Promise<void> {
		this.resizeObserver?.disconnect();
		this.resizeObserver = null;
		this.coordinator.detachView(this);
		this.contentEl.replaceChildren();
		this.contentEl.classList.remove('bullet-zoom-outline-sidebar');
	}

	isVisible(): boolean {
		if (!this.contentEl.isConnected) {
			return false;
		}
		return (
			typeof this.contentEl.isShown !== 'function' || this.contentEl.isShown()
		);
	}

	updateModel(model: OutlineSidebarModel): void {
		const previousStatus = this.model?.status;
		if (previousStatus === 'ready') {
			this.retainedReadyScrollTop =
				this.contentEl.querySelector<HTMLElement>(
					'.bullet-zoom-outline-sidebar-body',
				)?.scrollTop ?? 0;
		}
		this.model = model;
		renderOutlineSidebar(this.contentEl, model, {
				onToggle: (action) => this.coordinator.toggle(action),
				onSelect: (action) => {
					void this.coordinator.select(action);
				},
				onExit: (revision) => {
					void this.coordinator.exit(revision);
				},
				onRetry: (revision) => this.coordinator.retry(revision),
				onPreview: (action, label, trigger) => {
					if (
						trigger.isConnected &&
						this.contentEl.contains(trigger) &&
						this.coordinator.isPreviewActionValid(action)
					) {
						new BulletLabelPreviewModal(this.app, label, trigger).open();
					}
				},
		});
		if (
			previousStatus === 'pending' &&
			model.status === 'ready' &&
			!model.revealCurrent
		) {
			const body = this.contentEl.querySelector<HTMLElement>(
				'.bullet-zoom-outline-sidebar-body',
			);
			if (body !== null) {
				body.scrollTop = this.retainedReadyScrollTop;
			}
		}
	}

	clear(): void {
		this.model = null;
		this.retainedReadyScrollTop = 0;
		this.contentEl.replaceChildren();
	}
}

export class BulletOutlineSidebarCoordinator {
	private source: SourceContext | null = null;
	private sidebarView: BulletOutlineSidebarView | null = null;
	private readonly expandedAnchors = new Set<number>();
	private readonly manuallyCollapsedAnchors = new Set<number>();
	private readonly eventRefs: EventRef[] = [];
	private refreshQueued = false;
	private refreshTimer: number | null = null;
	private refreshTimerWindow: Window | null = null;
	private refreshGeneration = 0;
	private lastRenderedContext: string | null = null;
	private forceRevealCurrent = false;
	private openRequestGeneration = 0;
	private destroyed = false;
	private revision = 0;
	private cachedOutlineDoc: Text | null = null;
	private cachedOutline: readonly BulletOutlineNode[] | null = null;
	private cachedOutlineStatus: Exclude<OutlineSidebarStatus, 'pending' | 'unavailable'> | null = null;

	constructor(private readonly options: OutlineSidebarCoordinatorOptions) {}

	start(): void {
		const { workspace } = this.options;
		this.eventRefs.push(
			workspace.on('active-leaf-change', (leaf) => this.captureLeaf(leaf)),
			workspace.on('file-open', () => this.captureMostRecentLeaf()),
			workspace.on('editor-change', () => this.captureMostRecentLeaf()),
			workspace.on('layout-change', () => this.scheduleRefresh()),
		);
		workspace.onLayoutReady(() => {
			if (this.destroyed) {
				return;
			}
			this.captureMostRecentLeaf();
			void this.ensureSidebarLeaf(false);
		});
	}

	destroy(): void {
		if (this.destroyed) {
			return;
		}
		this.destroyed = true;
		this.openRequestGeneration += 1;
		for (const eventRef of this.eventRefs) {
			this.options.workspace.offref(eventRef);
		}
		this.eventRefs.length = 0;
		this.cancelScheduledRefresh();
		this.sidebarView?.clear();
		this.sidebarView = null;
		this.source = null;
		for (const leaf of this.options.workspace.getLeavesOfType(
			BULLET_OUTLINE_VIEW_TYPE,
		)) {
			leaf.detach();
		}
	}

	attachView(view: BulletOutlineSidebarView): void {
		if (this.destroyed) {
			return;
		}
		this.sidebarView = view;
		this.captureMostRecentLeaf();
		this.scheduleRefresh();
	}

	detachView(view: BulletOutlineSidebarView): void {
		if (this.sidebarView === view) {
			this.sidebarView = null;
		}
	}

	async openForEditor(view: EditorView): Promise<OutlineOpenResult> {
		const requestGeneration = ++this.openRequestGeneration;
		if (this.destroyed || !this.captureEditor(view)) {
			return 'failed';
		}
		const requestedSource = this.source;
		if (requestedSource === null) {
			return 'failed';
		}
		this.cancelScheduledRefresh();
		const leaf = await this.ensureSidebarLeaf(true);
		const currentSource = this.source;
		if (
			requestGeneration !== this.openRequestGeneration ||
			currentSource?.leaf !== requestedSource.leaf ||
			currentSource.view !== requestedSource.view
		) {
			return 'superseded';
		}
		if (leaf === null || !(leaf.view instanceof BulletOutlineSidebarView)) {
			return 'failed';
		}
		this.cancelScheduledRefresh();
		if (!this.captureEditor(view)) {
			return 'failed';
		}
		this.sidebarView = leaf.view;
		this.forceRevealCurrent = true;
		this.clearOutlineCache();
		this.refreshNow();
		return 'opened';
	}

	async openCurrent(): Promise<OutlineOpenResult> {
		if (this.destroyed) {
			return 'failed';
		}
		const activeEditorView = this.options.getActiveEditorView();
		if (activeEditorView !== null) {
			return this.openForEditor(activeEditorView);
		}
		this.captureMostRecentLeaf();
		if (this.source === null) {
			return 'failed';
		}
		return this.openForEditor(this.source.view);
	}

	notifyEditorReady(view: EditorView): void {
		if (this.source?.view === view) {
			this.scheduleRefresh();
		}
	}

	notifyEditorUpdate(update: ViewUpdate): void {
		if (this.destroyed || this.source?.view !== update.view) {
			return;
		}
		if (update.docChanged) {
			const mapSurvivingAnchors = (anchors: ReadonlySet<number>): number[] =>
				Array.from(anchors).flatMap((anchor) => {
					const mapped = update.changes.mapPos(anchor, 1, MapMode.TrackAfter);
					return mapped === null ? [] : [mapped];
				});
			const mapped = mapSurvivingAnchors(this.expandedAnchors);
			const mappedCollapsed = mapSurvivingAnchors(
				this.manuallyCollapsedAnchors,
			);
			this.expandedAnchors.clear();
			for (const anchor of mapped) {
				this.expandedAnchors.add(anchor);
			}
			this.manuallyCollapsedAnchors.clear();
			for (const anchor of mappedCollapsed) {
				this.manuallyCollapsedAnchors.add(anchor);
				this.expandedAnchors.delete(anchor);
			}
		}
		const source = this.source;
		const filePath = this.options.getFilePath(update.view);
		const focusAnchor = this.options.getFocusAnchor(update.view);
		const currentAnchor = this.options.getCurrentAnchor(update.view);
		const mappedFocusAnchor =
			update.docChanged && source.focusAnchor !== null
				? update.changes.mapPos(source.focusAnchor, 1, MapMode.TrackAfter)
				: source.focusAnchor;
		const mappedCurrentAnchor =
			update.docChanged && source.currentAnchor !== null
				? update.changes.mapPos(source.currentAnchor, 1, MapMode.TrackAfter)
				: source.currentAnchor;
		const noteTitle = this.options.getNoteTitle(update.view);
		const eligibilityChanged = !this.options.isEditorEligible(update.view);
		if (
			!update.docChanged &&
			!eligibilityChanged &&
			filePath === source.filePath &&
			focusAnchor === source.focusAnchor &&
			currentAnchor === source.currentAnchor &&
			noteTitle === source.noteTitle
		) {
			return;
		}
		if (
			!this.captureEditor(update.view, {
				mappedFocusAnchor,
				mappedCurrentAnchor,
			})
		) {
			this.invalidateSource();
		}
	}

	notifyEditorDestroyed(view: EditorView): void {
		if (this.source?.view !== view) {
			return;
		}
		this.invalidateSource();
	}

	toggle({ anchor, revision }: OutlineNodeAction): void {
		if (!this.isActionValid(anchor, revision)) {
			this.scheduleRefresh();
			return;
		}
		const outline = this.buildCurrentOutline();
		const node = outline === null ? null : findOutlinePath(outline, anchor)?.at(-1);
		if (node === undefined || node === null || node.children.length === 0) {
			return;
		}
		if (this.expandedAnchors.has(anchor)) {
			this.expandedAnchors.delete(anchor);
			this.manuallyCollapsedAnchors.add(anchor);
		} else {
			this.expandedAnchors.add(anchor);
			this.manuallyCollapsedAnchors.delete(anchor);
		}
		this.refreshNow();
	}

	async select({ anchor, revision }: OutlineNodeAction): Promise<boolean> {
		try {
			const source = this.source;
			if (
				source === null ||
				!this.isActionValid(anchor, revision) ||
				!this.options.onFocus(source.view, anchor)
			) {
				this.scheduleRefresh();
				return false;
			}
			return this.finishSuccessfulSelection(source);
		} catch {
			this.options.onUnexpectedError?.();
			this.scheduleRefresh();
			return false;
		}
	}

	async exit(revision: number): Promise<boolean> {
		try {
			const source = this.source;
			if (
				source === null ||
				!this.isSourceValid(source) ||
				revision !== this.revision
			) {
				this.scheduleRefresh();
				return false;
			}
			if (this.options.getFocusAnchor(source.view) !== null) {
				if (!this.options.onExit(source.view)) {
					this.scheduleRefresh();
					return false;
				}
			}
			return this.finishSuccessfulSelection(source);
		} catch {
			this.options.onUnexpectedError?.();
			this.scheduleRefresh();
			return false;
		}
	}

	retry(revision: number): void {
		if (revision === this.revision) {
			this.clearOutlineCache();
			this.refreshNow();
		}
	}

	isPreviewActionValid({ anchor, revision }: OutlineNodeAction): boolean {
		return this.isActionValid(anchor, revision);
	}

	private captureLeaf(leaf: WorkspaceLeaf | null): void {
		if (leaf === null || this.destroyed) {
			return;
		}
		if (leaf === this.sidebarView?.leaf) {
			return;
		}
		const view = this.options.resolveEditorView(leaf);
		if (view !== null) {
			this.setSource(leaf, view);
		}
	}

	private captureMostRecentLeaf(): void {
		if (this.destroyed) {
			return;
		}
		const recent = this.options.workspace.getMostRecentLeaf(
			this.options.workspace.rootSplit,
		);
		if (recent !== null) {
			this.captureLeaf(recent);
		}
	}

	private captureEditor(
		view: EditorView,
		mappedAnchors?: Readonly<{
			mappedFocusAnchor: number | null;
			mappedCurrentAnchor: number | null;
		}>,
	): boolean {
		for (const leaf of this.options.workspace.getLeavesOfType('markdown')) {
			if (this.options.resolveEditorView(leaf) === view) {
				return this.setSource(leaf, view, mappedAnchors);
			}
		}
		return false;
	}

	private setSource(
		leaf: WorkspaceLeaf,
		view: EditorView,
		mappedAnchors?: Readonly<{
			mappedFocusAnchor: number | null;
			mappedCurrentAnchor: number | null;
		}>,
	): boolean {
		if (!this.options.isEditorEligible(view)) {
			return false;
		}
		const filePath = this.options.getFilePath(view);
		if (filePath === null) {
			return false;
		}
		const changedFile = this.source?.filePath !== filePath;
		const changedEditor = this.source?.view !== view || this.source.leaf !== leaf;
		const changedDocument = this.source?.doc !== view.state.doc;
		const focusAnchor = this.options.getFocusAnchor(view);
		const changedFocus = this.source?.focusAnchor !== focusAnchor;
		const currentAnchor = this.options.getCurrentAnchor(view);
		const changedCurrent = this.source?.currentAnchor !== currentAnchor;
		const changedFocusIdentity =
			mappedAnchors === undefined
				? changedFocus
				: mappedAnchors.mappedFocusAnchor !== focusAnchor;
		const changedCurrentIdentity =
			mappedAnchors === undefined
				? changedCurrent
				: mappedAnchors.mappedCurrentAnchor !== currentAnchor;
		const changedTitle = this.source?.noteTitle !== this.options.getNoteTitle(view);
		if (
			this.source !== null &&
			!changedFile &&
			!changedEditor &&
			!changedDocument &&
			!changedFocus &&
			!changedCurrent &&
			!changedTitle
		) {
			return true;
		}
		if (
			this.source !== null &&
			(changedFile ||
				changedEditor ||
				changedDocument ||
				changedFocus ||
				changedCurrent ||
				changedTitle)
		) {
			this.revision += 1;
		}
		this.source = Object.freeze({
			leaf,
			view,
			filePath,
			noteTitle: this.options.getNoteTitle(view),
			doc: view.state.doc,
			focusAnchor,
			currentAnchor,
		});
		if (changedFile) {
			this.expandedAnchors.clear();
		}
		if (changedFile || changedEditor || changedCurrentIdentity) {
			this.manuallyCollapsedAnchors.clear();
		}
		if (changedDocument) {
			this.clearOutlineCache();
		}
		if (changedEditor) {
			this.forceRevealCurrent = true;
		} else if (
			changedDocument &&
			!changedFile &&
			!changedFocusIdentity &&
			!changedCurrentIdentity
		) {
			this.lastRenderedContext = `${filePath}\0${currentAnchor ?? 'full'}`;
		}
		const isTypingOnly =
			changedDocument &&
			!changedFile &&
			!changedEditor &&
			!changedFocusIdentity &&
			!changedCurrentIdentity;
		const isCaretOnly =
			!changedDocument &&
			!changedFile &&
			!changedEditor &&
			!changedFocusIdentity &&
			changedCurrentIdentity;
		this.scheduleRefresh(
			isTypingOnly ? 80 : isCaretOnly ? CARET_REFRESH_DELAY_MS : 0,
		);
		return true;
	}

	private scheduleRefresh(delayMs = 0): void {
		if (this.destroyed) {
			return;
		}
		if (delayMs > 0) {
			if (this.refreshQueued && this.refreshTimer === null) {
				return;
			}
			this.cancelScheduledRefresh();
			this.refreshQueued = true;
			const window = this.source?.view.dom.ownerDocument.defaultView;
			if (window !== undefined && window !== null) {
				const generation = ++this.refreshGeneration;
				this.refreshTimerWindow = window;
				this.refreshTimer = window.setTimeout(() => {
					if (generation !== this.refreshGeneration) {
						return;
					}
					this.refreshQueued = false;
					this.refreshTimer = null;
					this.refreshTimerWindow = null;
					this.refreshNow();
				}, delayMs);
				return;
			}
			this.refreshQueued = false;
		}
		if (delayMs === 0 && this.refreshTimer !== null) {
			this.cancelScheduledRefresh();
		}
		if (this.refreshQueued) {
			return;
		}
		this.refreshQueued = true;
		const generation = ++this.refreshGeneration;
		queueMicrotask(() => {
			if (generation !== this.refreshGeneration) {
				return;
			}
			this.refreshQueued = false;
			this.refreshNow();
		});
	}

	private cancelScheduledRefresh(): void {
		this.refreshGeneration += 1;
		if (this.refreshTimer !== null) {
			this.refreshTimerWindow?.clearTimeout(this.refreshTimer);
		}
		this.refreshTimer = null;
		this.refreshTimerWindow = null;
		this.refreshQueued = false;
	}

	private refreshNow(): void {
		if (this.refreshQueued) {
			this.cancelScheduledRefresh();
		}
		if (this.destroyed || this.sidebarView === null) {
			return;
		}
		if (
			!this.options.isMobile &&
			(this.options.workspace.rightSplit.collapsed ||
				!this.sidebarView.isVisible())
		) {
			return;
		}
		const source = this.source;
		if (source === null || !this.isSourceValid(source)) {
			this.invalidateSource();
			return;
		}

		const outlineResult = this.readOutline(source);
		const { outline, status } = outlineResult;

		if (status !== 'pending') {
			const validAnchors = collectAnchors(outline);
			for (const anchor of Array.from(this.expandedAnchors)) {
				if (!validAnchors.has(anchor)) {
					this.expandedAnchors.delete(anchor);
				}
			}
			for (const anchor of Array.from(this.manuallyCollapsedAnchors)) {
				if (!validAnchors.has(anchor)) {
					this.manuallyCollapsedAnchors.delete(anchor);
				}
			}
		}
		const currentAnchor = this.options.getCurrentAnchor(source.view);
		const focusAnchor = this.options.getFocusAnchor(source.view);
		if (currentAnchor !== source.currentAnchor) {
			this.manuallyCollapsedAnchors.clear();
		}
		if (currentAnchor !== null) {
			const path = findOutlinePath(outline, currentAnchor);
			for (const ancestor of path?.slice(0, -1) ?? []) {
				if (!this.manuallyCollapsedAnchors.has(ancestor.anchor)) {
					this.expandedAnchors.add(ancestor.anchor);
				}
			}
		}

		this.revision += 1;
		const renderContext = `${source.filePath}\0${currentAnchor ?? 'full'}`;
		const revealCurrent =
			status === 'ready' &&
			(this.forceRevealCurrent || this.lastRenderedContext !== renderContext);
		if (status !== 'pending') {
			this.forceRevealCurrent = false;
			this.lastRenderedContext = renderContext;
		}
		this.source = Object.freeze({
			...source,
			noteTitle: this.options.getNoteTitle(source.view),
			doc: source.view.state.doc,
			focusAnchor,
			currentAnchor,
		});
		this.sidebarView.updateModel(
			Object.freeze({
				revision: this.revision,
				status,
				noteTitle: this.source.noteTitle,
				outline,
				currentAnchor,
				expandedAnchors: new Set(this.expandedAnchors),
				revealCurrent,
				isMobile: this.options.isMobile,
			}),
		);
	}

	private buildCurrentOutline(): readonly BulletOutlineNode[] | null {
		if (this.source === null) {
			return null;
		}
		const result = this.readOutline(this.source);
		return result.status === 'ready' || result.status === 'empty'
			? result.outline
			: null;
	}

	private readOutline(source: SourceContext): Readonly<{
		outline: readonly BulletOutlineNode[];
		status: Exclude<OutlineSidebarStatus, 'unavailable'>;
	}> {
		if (
			this.cachedOutlineDoc === source.view.state.doc &&
			this.cachedOutline !== null &&
			this.cachedOutlineStatus !== null
		) {
			return Object.freeze({
				outline: this.cachedOutline,
				status: this.cachedOutlineStatus,
			});
		}
		let outline: readonly BulletOutlineNode[];
		let status: Exclude<OutlineSidebarStatus, 'unavailable'> = 'ready';
		try {
			outline = (this.options.buildOutline ?? buildBulletOutline)(
				source.view.state,
			);
			if (outline.length === 0) {
				status = 'empty';
			}
		} catch (error) {
			if (error instanceof BulletOutlineLimitError) {
				outline = Object.freeze([]);
				status = 'limited';
			} else if (error instanceof BulletOutlineParsePendingError) {
				return Object.freeze({
					outline: Object.freeze([]),
					status: 'pending',
				});
			} else {
				throw error;
			}
		}
		this.cachedOutlineDoc = source.view.state.doc;
		this.cachedOutline = outline;
		this.cachedOutlineStatus = status;
		return Object.freeze({ outline, status });
	}

	private clearOutlineCache(): void {
		this.cachedOutlineDoc = null;
		this.cachedOutline = null;
		this.cachedOutlineStatus = null;
	}

	private invalidateSource(): void {
		this.cancelScheduledRefresh();
		this.source = null;
		this.expandedAnchors.clear();
		this.manuallyCollapsedAnchors.clear();
		this.lastRenderedContext = null;
		this.forceRevealCurrent = false;
		this.clearOutlineCache();
		this.revision += 1;
		this.sidebarView?.updateModel(
			Object.freeze({
				revision: this.revision,
				status: 'unavailable',
				noteTitle: BULLET_OUTLINE_VIEW_NAME,
				outline: Object.freeze([]),
				currentAnchor: null,
				expandedAnchors: new Set<number>(),
				revealCurrent: false,
				isMobile: this.options.isMobile,
			}),
		);
	}

	private isActionValid(anchor: number, revision: number): boolean {
		const source = this.source;
		if (
			source === null ||
			revision !== this.revision ||
			!this.isSourceValid(source)
		) {
			return false;
		}
		const bullet = findSupportedBullet(source.view.state, anchor);
		return bullet?.markerFrom === anchor;
	}

	private isSourceValid(source: SourceContext): boolean {
		return (
			!this.destroyed &&
			source.view.dom.isConnected &&
			this.options.workspace.getLeavesOfType('markdown').includes(source.leaf) &&
			this.options.resolveEditorView(source.leaf) === source.view &&
			this.options.isEditorEligible(source.view) &&
			this.options.getFilePath(source.view) === source.filePath &&
			source.view.state.doc === source.doc
		);
	}

	private async finishSuccessfulSelection(source: SourceContext): Promise<boolean> {
		if (!this.isSourceValid(source)) {
			this.scheduleRefresh();
			return false;
		}
		try {
			if (this.options.isMobile) {
				this.options.workspace.setActiveLeaf(source.leaf, { focus: true });
			} else {
				source.view.focus();
			}
			this.scheduleRefresh();
			await Promise.resolve();
			return true;
		} catch {
			this.options.onUnexpectedError?.();
			this.scheduleRefresh();
			return false;
		}
	}

	private async ensureSidebarLeaf(
		reveal: boolean,
	): Promise<WorkspaceLeaf | null> {
		if (this.destroyed) {
			return null;
		}
		let leaf: WorkspaceLeaf;
		try {
			leaf = await this.options.workspace.ensureSideLeaf(
				BULLET_OUTLINE_VIEW_TYPE,
				'right',
				{ active: reveal, reveal },
			);
			if (reveal) {
				await this.options.workspace.revealLeaf(leaf);
			}
		} catch {
			return null;
		}
		if (this.destroyed) {
			leaf.detach();
			return null;
		}
		return leaf;
	}
}
