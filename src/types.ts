import {FrontmatterKeys} from "./constants";

export interface TimelinesSettings {
	era: any;
	timelineTag: string;
	sortDirection: boolean;
	notePreviewOnHover: boolean;
	fontSize: number;
	frontmatterKeys: FrontmatterKeys;
	scaleTheWidthOfEventBlocks: number,
	minCardWidth: number,
	cardHeight: number,
	coefficentCompressionOfBlocks: number,
	maxNumberOfRowsInblocks: number,
}

export interface TimelineArgs {
	[key: string]: string
}

export interface CardContainer {
	date: string;
	title: string;
	description: string;
	img: string;
	innerHTML: string;
	path: string;
	endDate: string;
	type: string;
	class: string;
	interpretations: interpretation[];
	era: number;
	year: number;
	month: number;
	day: number
	hours: number;
	minutes: number;
}

export type NoteData = CardContainer[];
export type AllNotesData = NoteData[];

export interface interpretation {
	numberOfinterpritaoin: number,
	title: string,
	text: string,
	opened: boolean,
}

export interface IBlock {
	eventBlock?: boolean,
	imagePath?: string,
	title: string,
	text?: string,
	width: number,
	fontSize: number,
	opened: boolean,
	interpretation: interpretation,
}