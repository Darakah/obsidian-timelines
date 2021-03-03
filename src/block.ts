//import Gallery from './svelte/Gallery.svelte'
import type { TimelinesSettings } from './types';
import type { TFile, MetadataCache, Vault } from 'obsidian'
import { FilterMDFiles, getElement } from './utils'

export class TimelineProcessor {

	async run(source: string, el: HTMLElement, settings: TimelinesSettings, vaultFiles: TFile[], fileCache: MetadataCache, appVault: Vault) {

		let lines = source.trim()
		let elCanvas = el.createDiv({ cls: 'timeline' });
        
		if (!lines) return;
		// Parse the tags to search for the proper files
		let tagList = lines.split(";");
		tagList.push(settings.timelineTag)
		// Filter all markdown files to only those containing the tag list
		let fileList = vaultFiles.filter(file => FilterMDFiles(file, tagList, fileCache));
		if (!fileList) {
			// if no files valid for timeline
			return;
		}
		// Keep only the files that have the time info 
		let timeline = document.createElement('div');
		timeline.setAttribute('class', 'timeline')
		let timelineNotes = [];
		let timelineDates = [];

		for (let i = 0; i < fileList.length; i++) {
			// Create a DOM Parser
			const domparser = new DOMParser()
			const doc = domparser.parseFromString(await appVault.read(fileList[i]), 'text/html')
			let timelineData = doc.getElementsByClassName('ob-timelines')
			if (!(timelineData[0] instanceof HTMLElement)) {
				continue;
			}

			let noteId;
			// check if a valid date is specified
			if (timelineData[0].dataset.date[0] == '-') {
				// if it is a negative year
				noteId = +timelineData[0].dataset.date.substring(1, timelineData[0].dataset.date.length).split('-').join('') * -1;
			} else {
				noteId = +timelineData[0].dataset.date.split('-').join('');
			}
			if (!Number.isInteger(noteId)) {
				continue;
			}
			// if not title is specified use note name
			let noteTitle = timelineData[0].dataset.title ?? fileList[i].name;

			if (!timelineNotes[noteId]) {
				timelineNotes[noteId] = [];
				timelineNotes[noteId][0] = [timelineData[0].dataset.date, noteTitle, timelineData[0].dataset.img, timelineData[0].innerHTML, fileList[i].path];
				timelineDates.push(noteId);
			} else {
				// if note_id already present append to it
				timelineNotes[noteId][timelineNotes[noteId].length] = [timelineData[0].dataset.date, noteTitle, timelineData[0].dataset.img, timelineData[0].innerHTML, fileList[i].path];
			}
		}

		// Sort events based on setting
		if (settings.sortDirection) {
			// default is ascending
			timelineDates = timelineDates.sort((d1, d2) => d1 - d2)
		} else {
			// else it is descending
			timelineDates = timelineDates.sort((d1, d2) => d2 - d1)
		}

		// Build the timeline html element
		for (let i = 0; i < timelineDates.length; i++) {
			let noteContainer = timeline.createDiv({ cls: 'timeline-container' });
			let noteHeader = noteContainer.createEl('h2', { text: getElement(timelineNotes, timelineDates[i], 0, 0).replace(/-0*$/g, '').replace(/-0*$/g, '').replace(/-0*$/g, '') })
			if (i % 2 == 0) {
				// if its even add it to the left
				noteContainer.addClass('timeline-left');

			} else {
				// else add it to the right
				noteContainer.addClass('timeline-right');
				noteHeader.setAttribute('style', 'text-align: right;')
			}

			if (!timelineNotes[timelineDates[i]]) {
				continue;
			}

			for (let j = 0; j < timelineNotes[timelineDates[i]].length; j++) {
				let noteCard = noteContainer.createDiv({ cls: 'timeline-card' })
				// add an image only if available
				if (getElement(timelineNotes, timelineDates[i], j, 2)) {
					noteCard.createDiv({ cls: 'thumb', attr: { style: `background-image: url(${getElement(timelineNotes, timelineDates[i], j, 2)});` } });
				}

				noteCard.createEl('article').createEl('h3').createEl('a', { cls: 'internal-link', attr: { href: `${getElement(timelineNotes, timelineDates[i], j, 4)}` }, text: getElement(timelineNotes, timelineDates[i], j, 1).replace(/([""``''])/g, '\\$1') })
				noteCard.createEl('p', { text: getElement(timelineNotes, timelineDates[i], j, 3).replace(/([""``''])/g, '\\$1') })
			}
		}

		// Replace the selected tags with the timeline html
		el.appendChild(timeline);
	}
}