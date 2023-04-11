// Filename: settings.ts
import {App, PluginSettingTab, Setting} from 'obsidian'
import TimelinesPlugin from './main'

export class TimelinesSettingTab extends PluginSettingTab {
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
			.setDesc("Tag to specify which notes to include in created timelines e.g. timeline for #timeline tag.")
			.addText(text => text
				.setPlaceholder(this.plugin.settings.timelineTag)
				.onChange(async (value) => {
					this.plugin.settings.timelineTag = value;
					await this.plugin.saveSettings();
				}));


		new Setting(containerEl)
			.setName('Chronological Direction')
			.setDesc('When enabled, events will be sorted from old to new. Turn this setting off to sort from new to old.')
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.sortDirection);
				toggle.onChange(async (value) => {
					this.plugin.settings.sortDirection = value;
					await this.plugin.saveSettings();
				});
			})
	}
}
