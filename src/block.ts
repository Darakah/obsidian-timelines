//import Gallery from './svelte/Gallery.svelte'
import type { TimelinesSettings, AllNotesData } from './types';
import { RENDER_TIMELINE } from './constants';
import type { TFile, MarkdownView, MetadataCache, Vault } from 'obsidian';
import { Timeline } from "vis-timeline/esnext";
import { DataSet } from "vis-data";
import "vis-timeline/styles/vis-timeline-graph2d.css";
import { FilterMDFiles, createDate, getImgUrl, parseTag } from './utils';

export class TimelineProcessor {

	async insertTimelineIntoCurrentNote(sourceView: MarkdownView, settings: TimelinesSettings, vaultFiles: TFile[], fileCache: MetadataCache, appVault: Vault) {
		let editor = sourceView.sourceMode.cmEditor;
		if (editor) {
			const source = editor.getValue();
			let match = RENDER_TIMELINE.exec(source);
			if (match) {
				let tagList = match[1];

				let div = document.createElement('div');
				let rendered = document.createElement('div');
				rendered.addClass('timeline-rendered');
				rendered.setText(new Date().toString());

				div.appendChild(document.createComment(`TIMELINE BEGIN tags='${match[1]}'`));
				await this.run(tagList, div, settings, vaultFiles, fileCache, appVault, false);
				div.appendChild(rendered);
				div.appendChild(document.createComment('TIMELINE END'));

				editor.setValue(source.replace(match[0], div.innerHTML));
			}
		}
	};

	async run(source: string, el: HTMLElement, settings: TimelinesSettings, vaultFiles: TFile[], fileCache: MetadataCache, appVault: Vault, visTimeline: boolean) {

		let args = {
			tags: '',
			divHeight: 400,
			startDate: '-1000',
			endDate: '3000',
			minDate: '-3000',
			maxDate: '3000'
		};

		// read arguments
		if (visTimeline) {
			source.split('\n').map(e => {
				e = e.trim();
				if (e) {
					let param = e.split('=');
					if (param[1]) {
						args[param[0]] = param[1]?.trim();
					}
				}
			});
		} else {
			let lines = source.trim();
			// Parse the tags to search for the proper files
			args.tags = lines;
		}

		let tagList: string[] = [];
		args.tags.split(";").forEach(tag => parseTag(tag, tagList));
		tagList.push(settings.timelineTag);

		// Filter all markdown files to only those containing the tag list
		let fileList = vaultFiles.filter(file => FilterMDFiles(file, tagList, fileCache));
		if (!fileList) {
			// if no files valid for timeline
			return;
		}
		// Keep only the files that have the time info
		let timeline = document.createElement('div');
		timeline.setAttribute('class', 'timeline');
		let timelineNotes = [] as AllNotesData;
		let timelineDates = [];

		for (let file of fileList) {
			// Create a DOM Parser
			const domparser = new DOMParser();
			const doc = domparser.parseFromString(await appVault.read(file), 'text/html');
			let timelineData = doc.getElementsByClassName('ob-timelines');
			for (let event of timelineData as any) {
				if (!(event instanceof HTMLElement)) {
					continue;
				}

				let noteId;
				// check if a valid date is specified
				if (event.dataset.date[0] == '-') {
					// if it is a negative year
					noteId = +event.dataset.date.substring(1, event.dataset.date.length).split('-').join('') * -1;
				} else {
					noteId = +event.dataset.date.split('-').join('');
				}
				if (!Number.isInteger(noteId)) {
					continue;
				}
				// if not title is specified use note name
				let noteTitle = event.dataset.title ?? file.name.replace(/\.md$/g, '');
				let noteClass = event.dataset.class ?? "";
				let notePath = event.dataset.path ?? '/' + file.path;
				let type = event.dataset.type ?? "box";
				let endDate = event.dataset.end ?? null;
				let era = event.dataset.era ?? null;

				if (!timelineNotes[noteId]) {
					timelineNotes[noteId] = [];
					timelineNotes[noteId][0] = {
						date: event.dataset.date,
						title: noteTitle,
						img: getImgUrl(appVault.adapter, event.dataset.img),
						innerHTML: event.innerHTML,
						path: notePath,
						class: noteClass,
						type: type,
						endDate: endDate,
						era: era
					};
					timelineDates.push(noteId);
				} else {
					// if note_id already present append to it
					timelineNotes[noteId][timelineNotes[noteId].length] = {
						date: event.dataset.date,
						title: noteTitle,
						img: getImgUrl(appVault.adapter, event.dataset.img),
						innerHTML: event.innerHTML,
						path: notePath,
						class: noteClass,
						type: type,
						endDate: endDate,
						era: era
					};
				}
			}
		}

		// Sort events based on setting
		if (settings.sortDirection) {
			// default is ascending
			timelineDates = timelineDates.sort((d1, d2) => d1 - d2);
		} else {
			// else it is descending
			timelineDates = timelineDates.sort((d1, d2) => d2 - d1);
		}

		if (!visTimeline) {

			let eventCount = 0;
			// Build the timeline html element
			for (let date of timelineDates) {
				let noteContainer = timeline.createDiv({ cls: 'timeline-container' });
				let dateText = timelineNotes[date][0].date.replace(/-0*$/g, '').replace(/-0*$/g, '').replace(/-0*$/g, '');
				if (timelineNotes[date][0].era) {
					dateText = dateText.concat(' ' + timelineNotes[date][0].era)
				}
				let noteHeader = noteContainer.createEl('h2', { text: dateText });
				let eventContainer = noteContainer.createDiv({ cls: 'timeline-event-list', attr: { 'style': 'display: block' } });

				noteHeader.addEventListener('click', event => {
					if (eventContainer.style.getPropertyValue('display') === 'none') {
						eventContainer.style.setProperty('display', 'block');
						return;
					}
					eventContainer.style.setProperty('display', 'none');
				});

				if (eventCount % 2 == 0) {
					// if its even add it to the left
					noteContainer.addClass('timeline-left');

				} else {
					// else add it to the right
					noteContainer.addClass('timeline-right');
					noteHeader.setAttribute('style', 'text-align: right;');
				}

				if (!timelineNotes[date]) {
					continue;
				}

				for (let eventAtDate of timelineNotes[date]) {
					let noteCard = eventContainer.createDiv({ cls: 'timeline-card' });
					// add an image only if available
					if (eventAtDate.img) {
						noteCard.createDiv({ cls: 'thumb', attr: { style: `background-image: url(${eventAtDate.img});` } });
					}
					if (eventAtDate.class) {
						noteCard.addClass(eventAtDate.class);
					}

					noteCard.createEl('article').createEl('h3').createEl('a',
						{
							cls: 'internal-link',
							attr: { href: `${eventAtDate.path}` },
							text: eventAtDate.title
						});
					noteCard.createEl('p', { text: eventAtDate.innerHTML });
				}
				eventCount++;
			}

			// Replace the selected tags with the timeline html
			el.appendChild(timeline);
			return;
		}

		// Create a DataSet
		let items = new DataSet([]);

		timelineDates.forEach(date => {

			// add all events at this date
			Object.values(timelineNotes[date]).forEach(event => {
				// Create Event Card
				let noteCard = document.createElement('div');
				noteCard.className = 'timeline-card';
				// add an image only if available
				if (event.img) {
					noteCard.createDiv({ cls: 'thumb', attr: { style: `background-image: url(${event.img});` } });
				}
				if (event.class) {
					noteCard.addClass(event.class);
				}

				noteCard.createEl('article').createEl('h3').createEl('a', {
					cls: 'internal-link',
					attr: { href: `${event.path}` },
					text: event.title
				});
				noteCard.createEl('p', { text: event.innerHTML });

				let startDate = event.date?.replace(/(.*)-\d*$/g, '$1');
				let start, end;
				if (startDate[0] == '-') {
					// handle negative year
					let startComp = startDate.substring(1, startDate.length).split('-');
					start = new Date(+`-${startComp[0]}`, +startComp[1], +startComp[2]);
				} else {
					start = new Date(startDate);
				}

				let endDate = event.endDate?.replace(/(.*)-\d*$/g, '$1');
				if (endDate && endDate[0] == '-') {
					// handle negative year
					let endComp = endDate.substring(1, endDate.length).split('-');
					end = new Date(+`-${endComp[0]}`, +endComp[1], +endComp[2]);
				} else {
					end = new Date(endDate);
				}

				if (start.toString() === 'Invalid Date') {
					return;
				}

				if ((event.type === "range" || event.type === "background") && end.toString() === 'Invalid Date') {
					return;
				}

				// Add Event data
				items.add({
					id: items.length + 1,
					content: event.title ?? '',
					title: noteCard.outerHTML,
					start: start,
					className: event.class ?? '',
					type: event.type,
					end: end ?? null
				});
			});
		});

		// Configuration for the Timeline
		let options = {
			minHeight: +args.divHeight,
			showCurrentTime: false,
			showTooltips: false,
			template: function (item: any) {

				let eventContainer = document.createElement('div');
				eventContainer.setText(item.content);
				let eventCard = eventContainer.createDiv();
				eventCard.outerHTML = item.title;
				eventContainer.addEventListener('click', event => {
					let el = (eventContainer.getElementsByClassName('timeline-card')[0] as HTMLElement);
					el.style.setProperty('display', 'block');
					el.style.setProperty('top', `-${el.clientHeight + 10}px`);
				});
				return eventContainer;
			},
			start: createDate(args.startDate),
			end: createDate(args.endDate),
			min: createDate(args.minDate),
			max: createDate(args.maxDate)
		};

		// Create a Timeline
		timeline.setAttribute('class', 'timeline-vis');
		new Timeline(timeline, items, options);

		// Replace the selected tags with the timeline html
		el.appendChild(timeline);
	}
}
