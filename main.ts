import { ItemView, MarkdownView, WorkspaceLeaf, TFile, TagCache, LinkCache, MetadataCache, App, Modal, Notice, Plugin, PluginSettingTab, Setting, Vault } from 'obsidian';

interface TimelinesSettings {
	DEFAULT_TIMELINE_TAG: string;
	DEFAULT_SORT_DIRECTION: boolean;
}

const DEFAULT_SETTINGS: TimelinesSettings = {
	DEFAULT_TIMELINE_TAG: 'timeline',
	DEFAULT_SORT_DIRECTION: true
}

function getElement(MultiList:[][][],d1: number, d2: number, d3: number) {
	if(MultiList[d1][d2][d3]){
		return MultiList[d1][d2][d3];
	}
	return "";
  };

export default class TimelinesPlugin extends Plugin {
	settings: TimelinesSettings;

	async onload() {
		var _this = this;
        // Load message
        await this.loadSettings();
        console.log('Loaded Comments Plugin');

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

	FilterMDFiles(file: TFile, tag_list: String[]) {
		var fileCache = this.app.metadataCache.getFileCache(file);
		if(fileCache.frontmatter && fileCache.frontmatter.tags){
			return tag_list.every(function(val) {return fileCache.frontmatter.tags.indexOf(val) >= 0;})
		}
		return false;
	}

	async addTimeline() {

		const lines = this.getLines(this.getEditor());
		if (!lines) return;
		// Parse the tags to search for the proper files
		const tag_list = lines.split(";");
		tag_list.push(this.settings.DEFAULT_TIMELINE_TAG)
		// Filter all markdown files to only those containing the tag list
		let file_list = this.app.vault.getMarkdownFiles().filter(file => this.FilterMDFiles(file, tag_list));
		if(!file_list){
			// if no files valid for timeline
			return;
		}
		// Keep only the files that have the time info 
		let timeline = '<div class="timeline">'
		let timeline_notes = [];
		let timeline_dates = [];

		for(let i=0; i<file_list.length; i++){
			// Convert into HTML element 
        	let text = document.createElement('div')
        	text.innerHTML = await this.app.vault.read(file_list[i]);
        	// Use HTML parser to find the desired elements
			let note_info = text.querySelector("span[class='ob-timelines']");
			// if no ob-timelines class
			if(!(note_info instanceof HTMLElement)){
				continue;
			}
			// check if a valid date is specified
			let note_id = +note_info.dataset.date?.split('-').join('');

			if(!Number.isInteger(note_id)){
				continue;
			}
			// if not title is specified use note name
			let note_title = note_info.dataset.title ?? file_list[i].name;

			if(!timeline_notes[note_id]){
				timeline_notes[note_id] = [];
				timeline_notes[note_id][0] = [note_info.dataset.date, note_title, note_info.dataset.img, note_info.innerHTML, file_list[i].path];
				timeline_dates[i] = note_id;
			} else {
				// if note_id already present append to it
				timeline_notes[note_id][timeline_notes[note_id].length] = [note_info.dataset.date, note_title, note_info.dataset.img, note_info.innerHTML, file_list[i].path];	
			}
		}

		if(!timeline_dates){
			// if no valid timeline info provided
			return;
		}

		// Sort events based on setting
		if(this.settings.DEFAULT_SORT_DIRECTION){
			// default is ascending
			timeline_dates = timeline_dates.sort((d1, d2) => d1 - d2)
		} else {
			// else it is descending
			timeline_dates = timeline_dates.sort((d1, d2) => d2 - d1)
		}

		// Build the timeline html element
		for(let i=0; i < timeline_dates.length; i++){
			if(!timeline_dates[i]){
				continue;
			}

			if(i%2 == 0){
				// if its even add it to the left
				timeline += '<div class="timeline-container timeline-left"> <h2> ' + 
				getElement(timeline_notes,timeline_dates[i],0,0) + ' </h2> <div class="timeline-card">' ;
			} else {
				// else add it to the right
				timeline += '<div class="timeline-container timeline-right"> <h2 style="text-align:right"> ' + 
				getElement(timeline_notes,timeline_dates[i],0,0) + ' </h2> <div class="timeline-card">' ;
			}

			if(!timeline_notes[timeline_dates[i]]){
				continue;
			}

			for(let j=0; j < timeline_notes[timeline_dates[i]].length; j++){
				// add an image only if available
				if (getElement(timeline_notes,timeline_dates[i],j,2)){
					timeline += '<div class="thumb" style="background-image: url(' +  
					getElement(timeline_notes,timeline_dates[i],j,2) + ');"></div>'
				}
							
				timeline += '<article> <h3> <a class="internal-link" href="' + getElement(timeline_notes,timeline_dates[i],j,4) + '">' + 
				getElement(timeline_notes,timeline_dates[i],j,1) + ' </a> </h3> </article> <p> ' + 
				getElement(timeline_notes,timeline_dates[i],j,3) + '</p> </div> ';
			} 
			timeline += '</div>';
		}
		timeline += '</div>';

		// Replace the selected tags with the timeline html
		this.setLines(this.getEditor(), [timeline]);
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
		let {containerEl} = this;

		containerEl.empty();
		containerEl.createEl('h2', {text: 'Obsidian Timelines Settings'});

		new Setting(containerEl)
			.setName('Default timeline tag')
			.setDesc("Tag to specify which notes to include in created timelines e.g. timeline for #timeline tag")
			.addText(text => text
				.setPlaceholder(this.plugin.settings.DEFAULT_TIMELINE_TAG)
				.setValue('')
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
	}
}
