import type {TimelinesSettings} from './types';
import {DEFAULT_SETTINGS} from './constants';
import {TimelinesSettingTab} from './settings';
import {TimelineProcessor} from './block';
import {MarkdownView, Plugin} from 'obsidian';

export default class TimelinesPlugin extends Plugin {
	settings: TimelinesSettings;

	async onload() {
		// Load message
		await this.loadSettings();
		console.log('Loaded Timelines Plugin');

		// Register timeline block renderer
		this.registerMarkdownCodeBlockProcessor('timeline', async (source, el, ctx) => {
			const proc = new TimelineProcessor();
			await proc.run(source, el, this.settings, this.app.vault.getMarkdownFiles(), this.app.metadataCache, this.app.vault, false);
		});

		// Register vis-timeline block renderer
		this.registerMarkdownCodeBlockProcessor('timeline-vis', async (source, el, ctx) => {
			const proc = new TimelineProcessor();
			await proc.run(source, el, this.settings, this.app.vault.getMarkdownFiles(), this.app.metadataCache, this.app.vault, true);
		});

		this.addCommand({
			id: "render-timeline",
			name: "Render Timeline",
			callback: async () => {
				const proc = new TimelineProcessor();
				let view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (view) {
					await proc.insertTimelineIntoCurrentNote(view, this.settings, this.app.vault.getMarkdownFiles(), this.app.metadataCache, this.app.vault);
				}
			}
		});

		this.addSettingTab(new TimelinesSettingTab(this.app, this));
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
}
