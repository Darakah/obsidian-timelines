import { ItemView, MarkdownView, WorkspaceLeaf, TFile, TagCache, LinkCache, MetadataCache, App, Modal, Notice, Plugin, PluginSettingTab, Setting, Vault } from 'obsidian';

interface MyPluginSettings {
	DEFAULT_TIMELINE_TAG: string;
	DEFAULT_SORT_DIRECTION: boolean;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	DEFAULT_TIMELINE_TAG: 'timeline',
	DEFAULT_SORT_DIRECTION: true
}

// Create element of specified type
function element(name: string) {
    return document.createElement(name);
}

// Append node to target
function append(target: any, node: any) {
    target.appendChild(node);
}

// Set node attribute to value
function attr(node: any, attribute: string, value: string) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		var _this = this;
        // Load message
        await this.loadSettings();
        console.log('Loaded Comments Plugin');

        this.addSettingTab(new SampleSettingTab(this.app, this));

        this.addCommand({
            id: "create-timeline",
            name: "Create Timeline",
            callback: () => (this as any).addTimeline()
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

	addTimeline() {
		const lines = this.getLines(this.getEditor());
		if (!lines) return;
		// Parse the tags to search for the proper files
		const tag_list = lines.split(";");
		console.log(tag_list);
		// Filter all markdown files to only those containing the tag list
		var file_list = this.app.vault.getMarkdownFiles().filter(file => this.FilterMDFiles(file, tag_list));
		// Keep only the files that have the time info 
		var timeline = '<div class="timeline">'
		var timeline_notes = [];
		var timeline_dates = [];

		let i, j;
		for(i=0; i<file_list.length; i++){

			var text = (file_list[i] as any).cachedData;
        	// Convert into HTML element 
        	var tmp = element("div")
        	tmp.innerHTML = text;
        	// Use HTML parser to find the desired elements
        	// Get the ob-timelines span
        	var note_info = tmp.querySelector("span[class='ob-timelines']");
			var note_date = (note_info as any).dataset.date;
			var note_img = (note_info as any).dataset.img;
			var note_title = (note_info as any).dataset.title;
			var note_innerHTML = (note_info as any).innerHTML;
			var note_id = +note_date.split('-').join('');

			if(timeline_notes[note_id] != undefined){
				timeline_notes[note_id][timeline_notes[note_id].length] = [note_date, note_title, note_img, note_innerHTML];
			} else {
				timeline_notes[note_id] = [];
				timeline_notes[note_id][0] = [note_date, note_title, note_img, note_innerHTML];
				timeline_dates[i] = note_id;
			}
		}

		if(this.settings.DEFAULT_SORT_DIRECTION){
			// default is ascending
			timeline_dates = timeline_dates.sort((d1, d2) => d1 - d2)
		} else {
			// else it is descending
			timeline_dates = timeline_dates.sort((d1, d2) => d2 - d1)
		}

		// Sort the events by ascending or descending
		for(i=0; i < timeline_dates.length; i++){
			if(i%2 == 0){

				// if its even add it to the left
				timeline += '<div class="timeline-container timeline-left"> <div class="timeline-content"> <h2> ' + 
				(timeline_notes[timeline_dates[i]] as any)[0][0] + ' </h2> <hr>';

				for(j=0; j < timeline_notes[timeline_dates[i]].length; j++){
						// if its even add it to the left
						timeline += ' <h3> ' + (timeline_notes[timeline_dates[i]] as any)[j][1] + '</h3> <p> ' + 
						(timeline_notes[timeline_dates[i]] as any)[j][3] + '</p> <hr>';
					} 
				timeline += '</div> </div>';

			} else {
					// else add it to the right
					timeline += '<div class="timeline-container timeline-right"> <div class="timeline-content"> <h2> ' + 
					(timeline_notes[timeline_dates[i]] as any)[0][0] + ' </h2> <hr>';

					for(j=0; j < timeline_notes[timeline_dates[i]].length; j++){
							// if its even add it to the left
							timeline += ' <h3> ' + (timeline_notes[timeline_dates[i]] as any)[j][1] + '</h3> <p> ' + 
							(timeline_notes[timeline_dates[i]] as any)[j][3] + '</p> <hr>';
						} 
					timeline += '</div> </div>';
			}
		}
		timeline += '</div>';

		// Build the html by going through the previously created list
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

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
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
			}));
	}
}
