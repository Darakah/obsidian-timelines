import {FrontmatterKeys} from "./constants";

export interface TimelinesSettings {
	timelineTag: string;
	sortDirection: boolean;
	notePreviewOnHover: boolean;
	frontmatterKeys: FrontmatterKeys;
}

export interface TimelineArgs {
	[key: string]: string
}

export interface CardContainer {
	date: string;
	title: string;
	img: string;
	innerHTML: string;
	path: string;
	endDate: string;
	type: string;
	class: string;
}

export type NoteData = CardContainer[];
export type AllNotesData = NoteData[];
