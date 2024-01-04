//import Gallery from './svelte/Gallery.svelte'
import type { AllNotesData, NoteData, TimelinesSettings, interpretation, IBlock, CardContainer } from './types';
import { Args, FrontmatterKeys, RENDER_TIMELINE } from './constants';
import { FrontMatterCache, MarkdownView, MetadataCache, TFile, Vault} from 'obsidian';
import { ButtonComponent, Notice } from 'obsidian';
import { Timeline } from "vis-timeline/esnext";
import { DataSet } from "vis-data";
import "vis-timeline/styles/vis-timeline-graph2d.css";
import { createDate, FilterMDFiles, getFrontmatterTime, getImgUrl, parseTag, whatMinimumWidthMustBeBlockToFitTheWholeText, getInterpretaionText, replaceEnhancedMarkdownSyntax } from './utils';
import { Transform } from 'stream';
import { settings } from 'cluster';
import { timeLog } from 'console';


export class TimelineProcessor {
	
	async insertTimelineIntoCurrentNote(sourceView: MarkdownView, settings: TimelinesSettings, vaultFiles: TFile[], fileCache: MetadataCache, appVault: Vault) {
		console.log("insertTimelineIntoCurrentNote")
		let editor = sourceView.editor;
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
				await this.run(tagList, div, settings, vaultFiles, fileCache, appVault, 0); //что-то странное!
				div.appendChild(rendered);
				div.appendChild(document.createComment('TIMELINE END'));

				editor.setValue(source.replace(match[0], div.innerHTML));
			}
		}
	};

	async run(source: string, el: HTMLElement, settings: TimelinesSettings, vaultFiles: TFile[], fileCache: MetadataCache, appVault: Vault, timelineType: number) {
		if (timelineType !== 0 && timelineType !== 1 && timelineType !== 2)
			throw new Error("Specified timeline type does not exist");

		let args: Args = {
			tags: '',
			divHeight: 400,
			startDate: '-1000',
			endDate: '3000',
			minDate: '-3000',
			maxDate: '3000'
		};

		// read arguments
		if (timelineType === 1) {
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
			// Parse the tags to search for the proper files
			args.tags = source.trim();
		}

		let tagList: string[] = [];
		args.tags.split(";").forEach(tag => parseTag(tag, tagList));
		tagList.push(settings.timelineTag); //timeline

		// Filter all markdown files to only those containing the tag list
		let fileList = vaultFiles.filter(file => FilterMDFiles(file, tagList, fileCache));

		if (!fileList) {
			// if no files valid for timeline
			return;
		}

		// Keep only the files that have the time info
		let [timelineNotes, timelineDates] = await getTimelineData(fileList, settings, fileCache, appVault);
		
		// Sort events based on setting
		if (settings.sortDirection) {
			// default is ascending
			timelineDates = timelineDates.sort((d1, d2) => d1 - d2);
		} else {
			// else it is descending
			timelineDates = timelineDates.sort((d1, d2) => d2 - d1);
		}

		if (timelineType === 0) {
			let timeline = document.createElement('div');
			timeline.setAttribute('class', 'timeline');

			let eventCount = 0;
			// Build the timeline html element
			for (let date of timelineDates) {
				let noteContainer = timeline.createDiv({ cls: 'timeline-container' });
				let noteHeader = noteContainer.createEl('h2', { text: timelineNotes[date][0].date.replace(/-0*$/g, '').replace(/-0*$/g, '').replace(/-0*$/g, '') });
				let era = settings.era[Number(!noteHeader.textContent.startsWith('-'))];
				let eventContainer = noteContainer.createDiv({ cls: 'timeline-event-list', attr: { 'style': 'display: block' } });
				noteHeader.textContent += ' ' + era;
				console.log(timeline)
				noteHeader.addEventListener('click', event => {
					if (eventContainer.style.getPropertyValue('display') === 'none') {
						eventContainer.style.setProperty('display', 'block');
						return;
					}
					// TODO: Stop Propagation: don't close timeline-card when clicked.
					//  `vis-timeline-graph2d.js` contains a method called `_updateContents` that makes the display
					//  attribute disappear on click via line 7426: `element.innerHTML = '';`
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
					noteCard.createEl('p', { text: eventAtDate.description });
				}
				eventCount++;
			}

			// Replace the selected tags with the timeline html
			el.appendChild(timeline);
			return;
		}
		else if (timelineType === 2) {
			function addYear(data: number, dataEra: number, previousData: number, previousDataEra: number){
				if (data * dataEra > previousData * previousDataEra)
				{
					let txt: string = data.toString()
					if (dataEra === 1)
						txt += ' ' + settings.era[1]
					else
						txt += ' ' + settings.era[0]

					let yearEl = timelineWithInterpretations.createDiv({ cls: 'year-container', text: txt, attr: { style: `font-size: ${settings.fontSize + 4}px`}  })
					el.appendChild(timelineWithInterpretations);
					yearEl.style.width = `${(+el.getBoundingClientRect().width - 110) * settings.scaleTheWidthOfEventBlocks}px`;
				}
			}

			let timelineWithInterpretations = document.createElement('div');
			timelineWithInterpretations.setAttribute('class', 'timeline-with-interpretations');

			let monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

			let buttons: HTMLDivElement[];

			let activPageNumbers: number[] = new Array(timelineDates.length);

			for (let i = 0; i < timelineDates.length; i++)
			{
				activPageNumbers[i] = 0;
				createDataElements(i);
			}

			function createDataElements(i: number)
			{
				let blocks: IBlock[][];

				if (i === 0) 
					addYear(timelineNotes[timelineDates[0]][0].year, timelineNotes[timelineDates[0]][0].era, 10000, -1)
				else
					addYear(timelineNotes[timelineDates[i]][0].year, timelineNotes[timelineDates[i]][0].era, timelineNotes[timelineDates[i-1]][0].year, timelineNotes[timelineDates[i-1]][0].era)
				
				let lastPage: number;
				let page: number;
				
				let b1 = timelineWithInterpretations.createDiv( {cls: 'small-separator', attr: { style: `height: 10px`} } )

				let clousedEvents = timelineWithInterpretations.createDiv( {cls: 'cloused-events', text: `${monthNames[timelineNotes[timelineDates[i]][0].month] + '  ' + timelineNotes[timelineDates[i]][0].day} - ${timelineNotes[timelineDates[i]][0].title}`, attr: { style: `font-size: ${settings.fontSize + 6}px; display: none`} });
				let dotCopy = clousedEvents.createDiv({ cls: 'dot', attr: { style: `top: 24px` } })

				let buttonSliderContainer = timelineWithInterpretations.createDiv({ cls: 'button-slider-container', attr: { style: `width: ${(+el.getBoundingClientRect().width - 110) * settings.scaleTheWidthOfEventBlocks}px;` } })
				let leftButton = buttonSliderContainer.createDiv({ cls: 'left-button ' + timelineDates[0] })
				let numberOfPage = buttonSliderContainer.createDiv({ cls: 'number-of-page', attr: { style: `font-size: ${settings.fontSize + 2}px;` } })
				let rightButton = buttonSliderContainer.createDiv({ cls: 'right-button ' + timelineDates[0] })

				let b2 = timelineWithInterpretations.createDiv( {cls: 'small-separator', attr: { style: `height: 5px`} } )

				let preEventContainerWithInterpretations = timelineWithInterpretations.createDiv({ cls: 'pre-event-container-with-interpretations' })

				drawContent();

				function drawContent()
				{
				blocks = calculateInterpretationsBlocks(timelineNotes[timelineDates[i]][0].title, timelineNotes[timelineDates[i]][0].img, el, timelineNotes[timelineDates[i]][0].interpretations, settings, +el.getBoundingClientRect().width);

				lastPage = Math.floor((blocks.length - 1) / settings.maxNumberOfRowsInblocks);
				page = activPageNumbers[i] < lastPage? activPageNumbers[i] : lastPage;				
				numberOfPage.textContent = `${page + 1} / ${lastPage + 1}`;

				if (lastPage === 0) buttonSliderContainer.style.display = 'none';
				else buttonSliderContainer.style.display = 'inline-flex';

				let dot = preEventContainerWithInterpretations.createDiv({ cls: 'dot', attr: { style: `top: ${(settings.cardHeight) / 2 - 15}px; left: -61px` } })

				let dataContainer = preEventContainerWithInterpretations.createDiv({ cls: 'data-container', text: monthNames[timelineNotes[timelineDates[i]][0].month] + '  ' + timelineNotes[timelineDates[i]][0].day, attr: { style: `font-size: ${settings.fontSize + 6}px; height: ${settings.cardHeight}px`} })
				let eventContainerWithInterpretations = preEventContainerWithInterpretations.createDiv({ cls: 'event-container-with-interpretations' })

				let linkToDrawnEventOrInterpretationBlocks: HTMLDivElement[][];
				[linkToDrawnEventOrInterpretationBlocks, buttons] = createInterpretationsBlocks(blocks, page, eventContainerWithInterpretations, settings); 

				leftButton.onclick = function () {
					if (page === 0)
						return;
					
					page--;
					activPageNumbers[i] = page;
					numberOfPage.textContent = `${page + 1} / ${lastPage + 1}`;

					while (eventContainerWithInterpretations.firstChild) eventContainerWithInterpretations.firstChild.remove();
					blocks = calculateInterpretationsBlocks(timelineNotes[timelineDates[i]][0].title, timelineNotes[timelineDates[i]][0].img, el, timelineNotes[timelineDates[i]][0].interpretations, settings, +el.getBoundingClientRect().width); 
					[linkToDrawnEventOrInterpretationBlocks, buttons] = createInterpretationsBlocks(blocks, page, eventContainerWithInterpretations, settings);
					buttonsAddFunc(preEventContainerWithInterpretations);
				};

				rightButton.onclick = function () {
					if (page === lastPage)
						return;
					
					page++;
					activPageNumbers[i] = page;
					numberOfPage.textContent = `${page + 1} / ${lastPage + 1}`;

					while (eventContainerWithInterpretations.firstChild) eventContainerWithInterpretations.firstChild.remove();
					blocks = calculateInterpretationsBlocks(timelineNotes[timelineDates[i]][0].title, timelineNotes[timelineDates[i]][0].img, el, timelineNotes[timelineDates[i]][0].interpretations, settings, +el.getBoundingClientRect().width); 
					[linkToDrawnEventOrInterpretationBlocks, buttons] = createInterpretationsBlocks(blocks, page, eventContainerWithInterpretations, settings);
					buttonsAddFunc(preEventContainerWithInterpretations);
				};

				buttonsAddFunc(preEventContainerWithInterpretations)

				function buttonsAddFunc(_preEventContainerWithInterpretations: HTMLDivElement) {
					buttons.forEach(function (bu) {
						bu.addEventListener('click',function ()
						{
							while (_preEventContainerWithInterpretations.firstChild) _preEventContainerWithInterpretations.firstChild.remove();
							drawContent();
							// for (let i = 0; i < timelineDates.length; i++)
								// createDataElements(i);
						//page
						})
					})
				}

				dot.onclick = function () {
					preEventContainerWithInterpretations.style.display = "none";
					buttonSliderContainer.style.display = "none";
					clousedEvents.style.display = "flex"
				}

				dotCopy.onclick = function () {
					preEventContainerWithInterpretations.style.display = "block";
					buttonSliderContainer.style.display = "inline-flex";
					clousedEvents.style.display = "none"
				}
				}

				if (i !== timelineDates.length - 1)
					timelineWithInterpretations.createDiv( {cls: 'small-separator', attr: { style: `height: 35px`} } )
			}

			window.addEventListener("resize", () => {
				while (timelineWithInterpretations.firstChild) timelineWithInterpretations.firstChild.remove();
				for (let i = 0; i < timelineDates.length; i++)
					createDataElements(i);
			});

			console.log(timelineWithInterpretations)
			el.appendChild(timelineWithInterpretations);
			return;
		}
		else if (timelineType === 1)
		{
			let timeline = document.createElement('div');
			timeline.setAttribute('class', 'timeline');

			// Create a DataSet
			let items = new DataSet([]);

			timelineDates.forEach(date => {

				// add all events at this ===
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
					noteCard.createEl('p', { text: event.description });

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
						description: event.description,
						start: start,
						className: event.class ?? '',
						type: event.type,
						end: end ?? null,
						path: event.path
					});
				});
			});

			// Configuration for the Timeline
			let options = {
				minHeight: +args.divHeight,
				showCurrentTime: false,
				showTooltips: false,
				template: function (item: any) {

					let eventContainer = document.createElement(settings.notePreviewOnHover ? 'a' : 'div');
					if ("href" in eventContainer) {
						eventContainer.addClass('internal-link');
						eventContainer.href = item.path;
					}
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
}

async function getTimelineData(fileList: TFile[], settings: TimelinesSettings, fileCache: MetadataCache, appVault: Vault): Promise<[NoteData[], number[]]> {
	console.log("getTimelineData")

	const timeline = document.createElement('div');
	timeline.classList.add('timeline');
	const timelineNotes: AllNotesData = [];
	const timelineDates: number[] = [];

	for (const file of fileList) {
		const metadata = fileCache.getFileCache(file);
		const frontmatter = metadata.frontmatter;
		const doc = new DOMParser().parseFromString(await appVault.read(file), 'text/html');
		// If there are no timelineData elements, add a default "dummy" element to capture data from the frontmatter
		const timelineData = doc.getElementsByClassName('ob-timelines').length > 0 ? doc.getElementsByClassName('ob-timelines') : [doc.createElement('div')];
		
		// @ts-ignore
		for (let event of timelineData) {

			if (!(event instanceof HTMLElement)) continue;

			const [startDate, noteTitle, description, noteClass, notePath, type, endDate] = getFrontmatterData(frontmatter, settings.frontmatterKeys, event, file);

			let [successTime, noteId, era, year, month, day, hours, minutes] = getFrontmatterTime(startDate);

			if (!successTime) continue;

			let interpretations: interpretation[] = [];

			const note = {
				date: startDate,
				title: noteTitle,
				description: description ?? frontmatter.description,
				img: getImgUrl(appVault.adapter, event.dataset.img) ?? getImgUrl(appVault.adapter, frontmatter?.image),
				innerHTML: event.innerHTML ?? frontmatter?.html ?? '',
				path: notePath,
				class: noteClass,
				type: type,
				endDate: endDate,
				interpretations: interpretations,
				era: era,
				year: year,
				month: month,
				day: day,
				hours: hours,
				minutes: minutes,
			};

			if (!timelineNotes[noteId]) {
				timelineNotes[noteId] = [note];
				timelineDates.push(noteId);
			} else {
				const insertIndex = settings.sortDirection ? 0 : timelineNotes[noteId].length;
				timelineNotes[noteId].splice(insertIndex, 0, note);
			}
		}
	}

	for (const file of fileList) {
		const metadata = fileCache.getFileCache(file);
		const frontmatter = metadata.frontmatter;
		const doc = new DOMParser().parseFromString(await appVault.read(file), 'text/html');
		const interpretationData = doc.getElementsByClassName('ob-timelines-interpretation');

		if (interpretationData.length > 0){
			// @ts-ignore
			for (let interp of interpretationData) {

				if (!(interp instanceof HTMLElement)) continue;

				addFrontmatterInterpretationsData(frontmatter, settings.frontmatterKeys, interp, file, timelineNotes);
			}
		}
	}

	return [timelineNotes, timelineDates];
}

function getFrontmatterData(frontmatter: FrontMatterCache | null, frontmatterKeys: FrontmatterKeys, event: HTMLElement, file: TFile): [string, string, string, string, string, string, string | null] {
	console.log("getFrontmatterData")
	const startDate = event.dataset.date;
	if (!startDate) {
		// new Notice(`No date found for ${file.name}`);
		return ['', '', '', '', '', '', ''];
	}

	const noteTitle = event.dataset.title ?? findMatchingFrontmatterKey(frontmatter, frontmatterKeys.titleKey) ?? file.name.replace(".md", "");
	const description = frontmatter.desription;
	const noteClass = event.dataset.class ?? frontmatter["color"] ?? '';
	const notePath = '/' + file.path;
	const type = event.dataset.type ?? frontmatter["type"] ?? 'box';
	const endDate = event.dataset.end ?? findMatchingFrontmatterKey(frontmatter, frontmatterKeys.endDateKey) ?? null;
	const interpretations: interpretation[] = [];

	return [startDate, noteTitle, description, noteClass, notePath, type, endDate];
}

function addFrontmatterInterpretationsData(frontmatter: FrontMatterCache | null, frontmatterKeys: FrontmatterKeys, interp: HTMLElement, interpFile: TFile, timelineNotes: AllNotesData){
	console.log("addFrontmatterInterpretationsData");

	const startDate = interp.dataset.date ?? '';
	const eventTitle = interp.dataset.event_title ?? '';
	const interpretationTitle = interp.dataset.title ?? findMatchingFrontmatterKey(frontmatter, frontmatterKeys.titleKey) ?? '';
	const noteClass = interp.dataset.class ?? frontmatter["color"] ?? '';
	const interpretationNumber = Number(interp.dataset.interpretation_number) ?? 0;

	let [successTime, noteId] = getFrontmatterTime(startDate);
	
	if (!successTime || timelineNotes[noteId] === undefined) return;

	for (let note of timelineNotes[noteId])
	{
		if (note.class === noteClass && note.title === eventTitle)
		{
			note.interpretations[interpretationNumber] = {
				numberOfinterpritaoin: interpretationNumber,
				text: replaceEnhancedMarkdownSyntax(getInterpretaionText(interpFile)),
				title: interpretationTitle,
				opened: true,
			}
		}
	}
}

function findMatchingFrontmatterKey(frontmatter: FrontMatterCache | null, keys: string[]) {
	console.log("findMatchingFrontmatterKey")

	for (const key of keys) {
		if (frontmatter && frontmatter[key]) {
			return frontmatter[key];
		}
	}
	console.log(`No matching key found for ${keys}`)
	return null;
}

function calculateInterpretationsBlocks(eventName: string, imagePath: string, el: HTMLElement, interpretations: interpretation[], settings: TimelinesSettings, widthEventElement: number){
	function calcWidth(interpretation: interpretation, fontSize: number, testEl: HTMLElement): number{
		// const q1 = whatMinimumWidthMustBeBlockToFitTheWholeText(interpretation.text, settings.minCardWidth , settings.cardHeight - 50, fontSize, testEl, el)
		// const q2 = whatMinimumWidthMustBeBlockToFitTheWholeText(interpretation.title, settings.minCardWidth - 26 , 50, fontSize + 2, testEl, el)
		const q1 = whatMinimumWidthMustBeBlockToFitTheWholeText(interpretation.text, settings.minCardWidth - 20, settings.cardHeight - 50, fontSize, testEl, el)
		const q2 = whatMinimumWidthMustBeBlockToFitTheWholeText(interpretation.title, settings.minCardWidth - 50, 50 - 10, fontSize + 2, testDiv, el) + 50

		return Math.max(q1, q2);
	}

	function calcNewWidth(interpretation: interpretation, newFontSize: number, testEl: HTMLElement): [number ,number[], number] {
		const _width = calcWidth(interpretation, newFontSize, testEl);
		let widths: number[] = []
		let widthsSumm = _width

		gridOfBloks[rowPosition].forEach(block => {
			let newWidth: number;
			if (!block.eventBlock)
			{
				newWidth = calcWidth(block.interpretation, newFontSize, testEl);
				widthsSumm += newWidth;
				widths.push(newWidth)
			}
			else
			{
				newWidth = settings.cardHeight * 3 / 4;
				widthsSumm += settings.cardHeight;
				widths.push(settings.cardHeight)
			}
		});
		return [_width, widths, widthsSumm]
	}

	const antiCoefficentCompressionOfBlocks = 1 - settings.coefficentCompressionOfBlocks;
	const scaledWidthEventElement = (widthEventElement - 110) * settings.scaleTheWidthOfEventBlocks;

	let activRowWidth = scaledWidthEventElement - settings.cardHeight * 3 / 4;
	let occupiedPart = 0;
	let rowPosition = 0;
	let availableWidth: number
	let width: number;

	if (availableWidth < 0) return;

	let gridOfBloks : IBlock[][] = []
	gridOfBloks.push([ { eventBlock:true, imagePath: imagePath, title: eventName, width: settings.cardHeight * 3 / 4, fontSize: settings.fontSize, opened: true, interpretation: {numberOfinterpritaoin:-1, text:"", title:"",opened:true} } ])

	let testEl = el.createEl('pre');
	let testDiv = el.createDiv();

	interpretations.forEach(interpretation => {
		availableWidth = activRowWidth - occupiedPart;
		if (interpretation.opened)
		{
			width = calcWidth(interpretation, settings.fontSize, testEl);
		}
		else
		{
			width = 50
			//width = 50 * settings.minCardWidth / 275;
		}
		
		if (width < availableWidth)
		{
			gridOfBloks[rowPosition].push( {eventBlock: false, title: interpretation.title, text: interpretation.text, width: width, fontSize: settings.fontSize, opened: interpretation.opened, interpretation: interpretation } )

			occupiedPart += width;
			availableWidth -= width;
		}
		else if ((occupiedPart + width) * antiCoefficentCompressionOfBlocks < activRowWidth && interpretation.opened)
		{
			const resizeScalar = activRowWidth / (occupiedPart + width);
			let newFontSize = Math.floor(settings.fontSize * Math.sqrt(resizeScalar));
			let [_width, widths, widthsSumm] = calcNewWidth(interpretation, newFontSize, testEl);

			if (widthsSumm <= activRowWidth)
			{
				for (let i = 0; i < gridOfBloks[rowPosition].length; i++)
				{
					gridOfBloks[rowPosition][i].fontSize = newFontSize;
					gridOfBloks[rowPosition][i].width = widths[i];
				}

				//gridOfBloks[rowPosition].push( { title: interpretation.title, text: interpretation.text, width: _width, fontSize: newFontSize, opened: true, interpretation: interpretation} );
				gridOfBloks[rowPosition].push( { title: interpretation.title, text: interpretation.text, width: scaledWidthEventElement - widthsSumm + _width, fontSize: newFontSize, opened: true, interpretation: interpretation} );

				gridOfBloks[rowPosition][gridOfBloks[rowPosition].length - 1].width = scaledWidthEventElement - widthsSumm + _width;
				//gridOfBloks[rowPosition][gridOfBloks[rowPosition].length - 1].width = availableWidth;
				rowPosition += 1;
				gridOfBloks.push([])

				if ((rowPosition) % settings.maxNumberOfRowsInblocks === 0)
				{
					gridOfBloks[rowPosition].push({ eventBlock:true, imagePath: imagePath, title: eventName, width: settings.cardHeight * 3 / 4, fontSize: settings.fontSize, opened: true, interpretation: {numberOfinterpritaoin:-1, text:"", title:"",opened:true} });
				
					activRowWidth = scaledWidthEventElement - settings.cardHeight * 3 / 4;
					occupiedPart = 0;
					availableWidth = activRowWidth;
				}
				else
				{
					activRowWidth = scaledWidthEventElement;
					occupiedPart = 0;
					availableWidth = scaledWidthEventElement;
				}
			}
			else
			{
				newFontSize = Math.floor(newFontSize * Math.sqrt(resizeScalar));
				[_width, widths, widthsSumm] = calcNewWidth(interpretation, newFontSize, testEl);

				if (widthsSumm <= activRowWidth)
				{
					for (let i = 0; i < gridOfBloks[rowPosition].length; i++)
					{
						gridOfBloks[rowPosition][i].fontSize = newFontSize;
						gridOfBloks[rowPosition][i].width = widths[i]; //i-1????

					}

					// gridOfBloks[rowPosition].push( { title: interpretation.title, text: interpretation.text, width: _width, fontSize: newFontSize, opened: true, interpretation: interpretation} );
					gridOfBloks[rowPosition].push( { title: interpretation.title, text: interpretation.text, width: availableWidth, fontSize: newFontSize, opened: true, interpretation: interpretation} );
					// gridOfBloks[rowPosition].push( { title: interpretation.title, text: interpretation.text, width: scaledWidthEventElement - widthsSumm + _width, fontSize: newFontSize, opened: true, interpretation: interpretation} );
					//May be bag;
					// gridOfBloks[rowPosition][gridOfBloks[rowPosition].length - 1].width = availableWidth;
					rowPosition += 1;
					gridOfBloks.push([])

					if ((rowPosition) % settings.maxNumberOfRowsInblocks === 0)
					{
						gridOfBloks[rowPosition].push({ eventBlock:true, imagePath: imagePath, title: eventName, width: settings.cardHeight * 3 / 4, fontSize: settings.fontSize, opened: true, interpretation: {numberOfinterpritaoin:-1, text:"", title:"",opened:true} });
					
						activRowWidth = scaledWidthEventElement - settings.cardHeight * 3 / 4;
						occupiedPart = 0;
						availableWidth = activRowWidth;
					}
					else
					{
						activRowWidth = scaledWidthEventElement;
						occupiedPart = 0;
						availableWidth = scaledWidthEventElement;
					}
				}
				else
				{	
					if (gridOfBloks[rowPosition].length === 1 && gridOfBloks[rowPosition][0].eventBlock)
					{
						gridOfBloks[rowPosition].push( { title: interpretation.title, text: interpretation.text, width: availableWidth, fontSize: newFontSize, opened: true, interpretation: interpretation} );

						rowPosition += 1;
						gridOfBloks.push([])

						if ((rowPosition) % settings.maxNumberOfRowsInblocks === 0)
						{
							gridOfBloks[rowPosition].push({ eventBlock:true, imagePath: imagePath, title: eventName, width: settings.cardHeight * 3 / 4, fontSize: settings.fontSize, opened: true, interpretation: {numberOfinterpritaoin:-1, text:"", title:"",opened:true} });
						
							activRowWidth = scaledWidthEventElement - settings.cardHeight * 3 / 4;
							occupiedPart = 0;
							availableWidth = activRowWidth;
						}
						else
						{
							activRowWidth = scaledWidthEventElement;
							occupiedPart = 0;
							availableWidth = scaledWidthEventElement;
						}
					}
					else
					{
						gridOfBloks[rowPosition][gridOfBloks[rowPosition].length - 1].width += availableWidth;
						rowPosition += 1;
						gridOfBloks.push([]);

						if ((rowPosition) % settings.maxNumberOfRowsInblocks === 0)
						{
							const __width = width > scaledWidthEventElement - settings.cardHeight * 3 / 4 ? scaledWidthEventElement - settings.cardHeight * 3 / 4 : width;

							gridOfBloks[rowPosition].push({ eventBlock: true, imagePath: imagePath, title: eventName, width: settings.cardHeight * 3 / 4, fontSize: settings.fontSize, opened: true, interpretation: {numberOfinterpritaoin:-1, text:"", title:"",opened:true} });
							gridOfBloks[rowPosition].push( { title: interpretation.title, text: interpretation.text, width: __width, fontSize: settings.fontSize, opened: true, interpretation: interpretation} )

							activRowWidth = scaledWidthEventElement - settings.cardHeight * 3 / 4;
							occupiedPart = __width;
							availableWidth = activRowWidth - occupiedPart;
						}
						else
						{
							gridOfBloks[rowPosition].push( { title: interpretation.title, text: interpretation.text, width: width > scaledWidthEventElement ? scaledWidthEventElement : width, fontSize: settings.fontSize, opened: true, interpretation: interpretation} )

							occupiedPart = scaledWidthEventElement ? scaledWidthEventElement : width;
							activRowWidth = scaledWidthEventElement;
							availableWidth = activRowWidth - occupiedPart;
						}
					}

				}
			}
		}
		else
		{
			if (gridOfBloks[rowPosition].length === 1 && gridOfBloks[rowPosition][0].eventBlock)
			{
				if (interpretation.opened)
				{
					gridOfBloks[rowPosition].push( { title: interpretation.title, text: interpretation.text, width: availableWidth, fontSize: settings.fontSize, opened: true, interpretation} )
				}
				else
				{
					gridOfBloks[rowPosition].push( { title: interpretation.title, text: interpretation.text, width: availableWidth, fontSize: settings.fontSize, opened: true, interpretation: interpretation} );
				}

				rowPosition += 1;
				gridOfBloks.push([])

				if ((rowPosition) % settings.maxNumberOfRowsInblocks === 0)
				{
					gridOfBloks[rowPosition].push({ eventBlock:true, imagePath: imagePath, title: eventName, width: settings.cardHeight * 3 / 4, fontSize: settings.fontSize, opened: true, interpretation: {numberOfinterpritaoin:-1, text:"", title:"",opened:true} });
				
					activRowWidth = scaledWidthEventElement - settings.cardHeight * 3 / 4;
					occupiedPart = 0;
					availableWidth = activRowWidth;
				}
				else
				{
					activRowWidth = scaledWidthEventElement;
					occupiedPart = 0;
					availableWidth = scaledWidthEventElement;
				}

			}
			else
			{
				gridOfBloks[rowPosition][gridOfBloks[rowPosition].length - 1].width += availableWidth;
				rowPosition += 1;
				gridOfBloks.push([]);

				if ((rowPosition) % settings.maxNumberOfRowsInblocks === 0)
				{
					gridOfBloks[rowPosition].push({ eventBlock:true, imagePath: imagePath, title: eventName, width: settings.cardHeight * 3 / 4, fontSize: settings.fontSize, opened: true, interpretation: {numberOfinterpritaoin:-1, text:"", title:"",opened:true} });
				
					activRowWidth = scaledWidthEventElement - settings.cardHeight * 3 / 4;
					occupiedPart = 0;
					availableWidth = activRowWidth;
				}
				else
				{
					activRowWidth = scaledWidthEventElement;
					occupiedPart = 0;
					availableWidth = scaledWidthEventElement;
				}

				if (interpretation.opened)
				{
					if (width > availableWidth)
					{
						width = availableWidth;
					}

					gridOfBloks[rowPosition].push( { title: interpretation.title, text: interpretation.text, width: width, fontSize: settings.fontSize, opened: true, interpretation} )
				}
				else
				{
					if (width > availableWidth) //may be availableWidth -> activRowWidth
					{
						width = availableWidth;
					}

					gridOfBloks[rowPosition].push( { title: interpretation.title, width: width, fontSize: settings.fontSize, opened: false, interpretation} )
				}

				occupiedPart += width;
				availableWidth = activRowWidth - occupiedPart;
			}

		}
	});

	gridOfBloks[gridOfBloks.length - 1][gridOfBloks[gridOfBloks.length - 1].length - 1].width += availableWidth;

	if (gridOfBloks.length === 1 && gridOfBloks[0].length === 1)
		gridOfBloks[0][0].width = settings.minCardWidth;

	testEl.remove();
	testDiv.remove();

	return gridOfBloks;
}

function createInterpretationsBlocks(blocks: IBlock[][], page: number, eventContainerWitshInterpretations: HTMLDivElement, settings: TimelinesSettings): [HTMLDivElement[][], HTMLDivElement[]] {
	function addButton(element: HTMLDivElement, activInterpretation: interpretation): HTMLDivElement{
		let button = element.createDiv( { cls: 'hide-button' } );
		if (activInterpretation.opened)
		{
			button.createDiv( { cls: 'hide-button-1', attr: { style: 'top: 4px; left: 2px; transform: rotate(135deg);' } } );
			button.createDiv( { cls: 'hide-button-2', attr: { style: 'top: 8px; left: 6px; transform:rotate(315deg);' } } );
		}
		else
		{
			button.createDiv( { cls: 'hide-button-1', attr: { style: 'top: 4px; left: 2px; transform: rotate(315deg);' } } );
			button.createDiv( { cls: 'hide-button-2', attr: { style: 'top: 8px; left: 6px; transform:rotate(135deg);' } } );
		}

		button.addEventListener('click', function () {
			activInterpretation.opened = !activInterpretation.opened;
		});

		return button;
	}

	let linkToDrawnEventOrInterpretationBlocks: HTMLDivElement[][] = [];
	for (let i = 0; i < (settings.maxNumberOfRowsInblocks < (blocks.length - page * settings.maxNumberOfRowsInblocks)? settings.maxNumberOfRowsInblocks : blocks.length - page * settings.maxNumberOfRowsInblocks); i++) {
		linkToDrawnEventOrInterpretationBlocks.push([]);
	}
		
	const startI = page * settings.maxNumberOfRowsInblocks;

	let buttons: HTMLDivElement[] = [];

	for (let i = startI; i < startI + settings.maxNumberOfRowsInblocks; i++)
	{
		if (!blocks[i])
			break;

		let row = eventContainerWitshInterpretations.createDiv( { cls: 'row' } );

		for (let j = 0; j < blocks[i].length; j++)
		{
			const card = row.createDiv( { cls: 'event-or-interpretation-block', attr: { style: `height: ${settings.cardHeight}px; width: ${blocks[i][j].width}px;` } } );
			linkToDrawnEventOrInterpretationBlocks[i - startI].push(card);

			if (blocks[i][j].opened)
			{
				if (blocks[i][j].eventBlock)
				{
					card.createDiv({ cls: 'upper-container', text: blocks[i][j].title, attr: { style: `height: 50px; font-size: ${blocks[i][j].fontSize + 2}px; width: ${blocks[i][j].width - 5}px;`} });
					card.createDiv({ cls: 'bottom-container img-container', attr: { style: `background-image: url(${blocks[i][j].imagePath}); height: ${settings.cardHeight - 50 - 10}px; top: 50px; font-size: ${blocks[i][j].fontSize}px`} });
				}
				else
				{
					buttons.push(addButton(card.createDiv({ cls: 'upper-container', text: blocks[i][j].title, attr: { style: `height: 50px; font-size: ${blocks[i][j].fontSize + 2}px; width: ${blocks[i][j].width - 5}px;`} }), blocks[i][j].interpretation));
					// card.createDiv({ cls: 'bottom-container', text: blocks[i][j].text, attr: { style: `height: ${settings.cardHeight - 50 - 10}px; top: 50px; font-size: ${blocks[i][j].fontSize}px;`} });
					card.createEl('pre', { cls: 'bottom-container', text: blocks[i][j].text, attr: { style: `height: ${settings.cardHeight - 50 - 10}px; top: 0px; font-size: ${blocks[i][j].fontSize}px; background-color: var(--background);`} });
				}
			}	
			else
			{
				buttons.push(addButton(card.createDiv({ cls: 'upper-container', attr: { style: `height: 50px;`} }), blocks[i][j].interpretation));
				card.createDiv({ cls: 'bottom-container cloused-container', text: blocks[i][j].title, attr: { style: `height: ${settings.cardHeight - 50}px; top: 50px; font-size: ${blocks[i][j].fontSize + 2}px;`} });
			}
		}
	}

	for (let i = 0; i < linkToDrawnEventOrInterpretationBlocks.length; i++){
		linkToDrawnEventOrInterpretationBlocks[i][0].addClass("left-side");
	}
	
	for (let j = 0; j < linkToDrawnEventOrInterpretationBlocks[0].length; j++){
		linkToDrawnEventOrInterpretationBlocks[0][j].addClass("top-side");
	}

	linkToDrawnEventOrInterpretationBlocks[0][0].style.borderTopLeftRadius = '20px';
	linkToDrawnEventOrInterpretationBlocks[0][linkToDrawnEventOrInterpretationBlocks[0].length - 1].style.borderTopRightRadius = '20px';
	linkToDrawnEventOrInterpretationBlocks[linkToDrawnEventOrInterpretationBlocks.length - 1][linkToDrawnEventOrInterpretationBlocks[linkToDrawnEventOrInterpretationBlocks.length - 1].length - 1].style.borderBottomRightRadius = '20px';
	linkToDrawnEventOrInterpretationBlocks[linkToDrawnEventOrInterpretationBlocks.length - 1][0].style.borderBottomLeftRadius = '20px';

	return [linkToDrawnEventOrInterpretationBlocks, buttons];
}