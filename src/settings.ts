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

		new Setting(containerEl)
			.setName("Display Note Preview On Hover")
			.setDesc("When enabled, linked notes will display as a pop up when hovering over an event in the timeline.")
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.notePreviewOnHover);
				toggle.onChange(async (value) => {
					this.plugin.settings.notePreviewOnHover = value;
					await this.plugin.saveSettings();
				});
			})

		containerEl.createEl('h5', { text: "Customize Frontmatter Keys" }).appendChild(
			createEl("p", {
				text: "Specify the front matter keys used to extract start dates, end dates, and titles for the timeline notes. Defaults to 'start-date', 'end-date', and 'title'.",
				cls: "setting-item-description"
			})
		);

		new Setting(containerEl)
			.setName('Start Date Keys')
			.setDesc('Comma-separated list of frontmatter keys for start date. Example: start-date,fc-date')
			.addText(text => text
				.setPlaceholder(this.plugin.settings.frontmatterKeys.startDateKey.join(','))
				.onChange(async (value) => {
					this.plugin.settings.frontmatterKeys.startDateKey = value.split(',');
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('End Date Keys')
			.setDesc('Comma-separated list of frontmatter keys for end date.')
			.addText(text => text
				.setPlaceholder(this.plugin.settings.frontmatterKeys.endDateKey.join(','))
				.onChange(async (value) => {
					this.plugin.settings.frontmatterKeys.endDateKey = value.split(',');
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Title Keys')
			.setDesc('Comma-separated list of frontmatter keys for title.')
			.addText(text => text
				.setPlaceholder(this.plugin.settings.frontmatterKeys.titleKey.join(','))
				.onChange(async (value) => {
					this.plugin.settings.frontmatterKeys.titleKey = value.split(',');
					await this.plugin.saveSettings();
				}));

	}
}
