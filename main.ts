import { time } from 'console';
import { ItemView, MarkdownView, WorkspaceLeaf, TFile, TagCache, LinkCache, MetadataCache, App, Modal, Notice, Plugin, PluginSettingTab, Setting, Vault } from 'obsidian';

interface TimelinesSettings {
	DEFAULT_TIMELINE_TAG: string;
	DEFAULT_SORT_DIRECTION: boolean;
}

const DEFAULT_SETTINGS: TimelinesSettings = {
	DEFAULT_TIMELINE_TAG: 'timeline',
	DEFAULT_SORT_DIRECTION: true
}

interface CardContainer {
	date: string;
	title: string;
	img: string;
	innerHTML: string;
	path: string;
}

type NoteData = CardContainer[];
type AllNotesData = NoteData[];

function getElement(MultiList: AllNotesData, d1: number, d2: number, d3: number) {
	if (MultiList[d1][d2][d3]) {
		return MultiList[d1][d2][d3];
	}
	return "";
};

export default class TimelinesPlugin extends Plugin {
	settings: TimelinesSettings;

	async onload() {
		// Load message
		await this.loadSettings();
		console.log('Loaded Timelines Plugin');

		this.addSettingTab(new TimelinesSettingTab(this.app, this));

		this.addCommand({
			id: "create-timeline",
			name: "Create Timeline",
			callback: () => this.addTimeline()
		});
	}

	onunload() {
		console.log('unloading plugin');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	FilterMDFiles(file: TFile, tagList: String[]) {
		var fileCache = this.app.metadataCache.getFileCache(file);
		if (fileCache.frontmatter && fileCache.frontmatter.tags) {
			return tagList.every(function (val) { return fileCache.frontmatter.tags.indexOf(val) >= 0; })
		}
		return false;
	}

	async addTimeline() {

		const lines = this.getLines(this.getEditor());
		if (!lines) return;
		// Parse the tags to search for the proper files
		const tagList = lines.split(";");
		tagList.push(this.settings.DEFAULT_TIMELINE_TAG)
		// Filter all markdown files to only those containing the tag list
		let fileList = this.app.vault.getMarkdownFiles().filter(file => this.FilterMDFiles(file, tagList));
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
			const doc = domparser.parseFromString(await this.app.vault.read(fileList[i]), 'text/html')
			let timelineData = doc.getElementsByClassName('ob-timelines')
			if (!(timelineData[0] instanceof HTMLElement)) {
				continue;
			}

			// check if a valid date is specified
			let noteId = +timelineData[0].dataset.date?.split('-').join('');

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
		if (this.settings.DEFAULT_SORT_DIRECTION) {
			// default is ascending
			timelineDates = timelineDates.sort((d1, d2) => d1 - d2)
		} else {
			// else it is descending
			timelineDates = timelineDates.sort((d1, d2) => d2 - d1)
		}

		// Build the timeline html element
		for (let i = 0; i < timelineDates.length; i++) {
			let noteContainer = timeline.createDiv({ cls: 'timeline-container' });
			let noteHeader = noteContainer.createEl('h2')
			if (i % 2 == 0) {
				// if its even add it to the left
				noteContainer.addClass('timeline-left');

			} else {
				// else add it to the right
				noteContainer.addClass('timeline-right');
				noteHeader.setAttribute('style', 'text-align: right;')
			}
			noteHeader.setText(getElement(timelineNotes, timelineDates[i], 0, 0).replace(/-0*$/g, '').replace(/-0*$/g, '').replace(/-0*$/g, ''))

			if (!timelineNotes[timelineDates[i]]) {
				continue;
			}

			for (let j = 0; j < timelineNotes[timelineDates[i]].length; j++) {
				let noteCard = noteContainer.createDiv({ cls: 'timeline-card' })
				// add an image only if available
				if (getElement(timelineNotes, timelineDates[i], j, 2)) {
					noteCard.createDiv({ cls: 'thumb', attr: { style: `background-image: url(${getElement(timelineNotes, timelineDates[i], j, 2)});` } });
				}

				noteCard.createEl('article').createEl('h3').createEl('a', { cls: 'internal-link', attr: { href: `${getElement(timelineNotes, timelineDates[i], j, 4)}` } }).setText(getElement(timelineNotes, timelineDates[i], j, 1).replace(/([""``''])/g, '\\$1'))
				noteCard.createEl('p').setText(getElement(timelineNotes, timelineDates[i], j, 3).replace(/([""``''])/g, '\\$1'))
			}
		}

		// Replace the selected tags with the timeline html
		this.setLines(this.getEditor(), [timeline.outerHTML]);
	}

	getEditor(): CodeMirror.Editor {
		let view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) return;

		let cm = view.sourceMode.cmEditor;
		return cm;
	}

	getLines(editor: CodeMirror.Editor): string {
		if (!editor) return;
		const selection = editor.getSelection();
		return selection;
	}

	setLines(editor: CodeMirror.Editor, lines: string[]) {
		const selection = editor.getSelection();
		if (selection != "") {
			editor.replaceSelection(lines.join("\n"));
		} else {
			editor.setValue(lines.join("\n"));
		}
	}
}

class TimelinesSettingTab extends PluginSettingTab {
	plugin: TimelinesPlugin;

	constructor(app: App, plugin: TimelinesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;

		containerEl.empty();
		containerEl.createEl('h2', { text: 'Obsidian Timelines Settings' });

		new Setting(containerEl)
			.setName('Default timeline tag')
			.setDesc("Tag to specify which notes to include in created timelines e.g. timeline for #timeline tag")
			.addText(text => text
				.setPlaceholder(this.plugin.settings.DEFAULT_TIMELINE_TAG)
				.onChange(async (value) => {
					this.plugin.settings.DEFAULT_TIMELINE_TAG = value;
					await this.plugin.saveSettings();
				}));


		new Setting(containerEl)
			.setName('Chronological Direction')
			.setDesc('Default: OLD -> NEW. Turn this setting off: NEW -> OLD')
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.DEFAULT_SORT_DIRECTION);
				toggle.onChange(async (value) => {
					this.plugin.settings.DEFAULT_SORT_DIRECTION = value;
					await this.plugin.saveSettings();
				});
			})
	}
}
