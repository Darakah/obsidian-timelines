import type {TimelinesSettings} from './types'

export interface FrontmatterKeys {
	startDateKey: string[];
	endDateKey: string[];
	titleKey: string[];
}

const DEFAULT_FRONTMATTER_KEYS: FrontmatterKeys = {
	startDateKey: ['start-date'],
	endDateKey: ['end-date'],
	titleKey: ['title'],
};

export const DEFAULT_SETTINGS: TimelinesSettings = {
    timelineTag: 'timeline',
    sortDirection: true,
	notePreviewOnHover: true,
	frontmatterKeys: DEFAULT_FRONTMATTER_KEYS
}

export interface Args {
	tags: string;
	divHeight: number;
	startDate: string;
	endDate: string;
	minDate: string;
	maxDate: string;
	[key: string]: string | number;
}

export const RENDER_TIMELINE: RegExp = /<!--TIMELINE BEGIN tags=['"]([^"]*?)['"]-->([\s\S]*?)<!--TIMELINE END-->/i;
