export interface TimelinesSettings {
	timelineTag: string;
	sortDirection: boolean;
}

export interface CardContainer {
	date: string;
	title: string;
	img: string;
	innerHTML: string;
	path: string;
}

export type NoteData = CardContainer[];
export type AllNotesData = NoteData[];