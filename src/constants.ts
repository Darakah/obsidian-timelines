import type {TimelinesSettings} from './types'

export interface FrontmatterKeys {
	startDateKey: string[];
	endDateKey: string[];
	titleKey: string[];
	descriptionKey: string[];
}

const DEFAULT_FRONTMATTER_KEYS: FrontmatterKeys = {
	startDateKey: ['start-date'],
	endDateKey: ['end-date'],
	titleKey: ['title'],
	descriptionKey:['description'],
};

export const DEFAULT_SETTINGS: TimelinesSettings = {
    timelineTag: 'timeline',
    sortDirection: true,
	notePreviewOnHover: true,
	frontmatterKeys: DEFAULT_FRONTMATTER_KEYS,
	era: [' BC',' AD'],
	fontSize: 14,
	scaleTheWidthOfEventBlocks: 1,
	minCardWidth: 180,
	cardHeight: 290,
	coefficentCompressionOfBlocks: 0.4,
	maxNumberOfRowsInblocks: 1,
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
