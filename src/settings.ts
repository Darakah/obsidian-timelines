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
			.setDesc("Tag to specify which notes to include in created timelines e.g. timeline for #timeline tag")
			.addText(text => text
				.setPlaceholder(this.plugin.settings.timelineTag)
				.onChange(async (value) => {
					this.plugin.settings.timelineTag = value;
					await this.plugin.saveSettings();
				}));


		new Setting(containerEl)
			.setName('Chronological Direction')
			.setDesc('Default: OLD -> NEW. Turn this setting off: NEW -> OLD')
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.sortDirection);
				toggle.onChange(async (value) => {
					this.plugin.settings.sortDirection = value;
					await this.plugin.saveSettings();
				});
			})

		new Setting(containerEl)
			.setName("Use frontmatter for event metadata")
			.setDesc("When enabled, the plugin will use the frontmatter for event metadata.")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.useFrontmatter);
				toggle.onChange(async (value) => {
					this.plugin.settings.useFrontmatter = value;
					await this.plugin.saveSettings();
			});
		})
	}
}
