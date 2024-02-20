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

		new Setting(containerEl)
			.setName('Era Suffix')
			.setDesc('Set custom eras for timelines such as "BC" or "AD"')
			.addText(text => text
				.setPlaceholder(this.plugin.settings.era.join(','))
				.setValue(this.plugin.settings.era)
				.onChange(async (value) => {
					this.plugin.settings.era = value.split(',');
					await this.plugin.saveSettings();
				}));

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
	
		containerEl.createEl('h5', { text: "Timelines with interpretations settings" }).appendChild(
			createEl("p", {
				text: "Customization that will be completed only with timeline with interpretations",
				cls: "setting-item-description"
			})
		);

		new Setting(containerEl)
			.setName('Default font size')
			.setDesc("Default font size (can be changed during plugin operation). The default value is 14px.")
			.addSlider((slider) => slider
				.setLimits(5, 30, 1)
				.setValue(this.plugin.settings.fontSize).setDynamicTooltip().onChange(async (value) => {
				this.plugin.settings.fontSize = value;
				await this.plugin.saveSettings();
			}))

			new Setting(containerEl)
			.setName("Scale Of The Event Element")
			.setDesc("Scales the width of the blocks that hold event and/or interpretation cards")
			.addSlider((slider) => slider
				.setLimits(0.5, 5, 0.1)
				.setValue(this.plugin.settings.scaleTheWidthOfEventBlocks).setDynamicTooltip().onChange(async (value) => {
				this.plugin.settings.scaleTheWidthOfEventBlocks = value;
				await this.plugin.saveSettings();
			}))

		new Setting(containerEl)
			.setName('Card Height')
			.setDesc("Set the card height. The default value is 290px.")
			.addSlider((slider) => slider
				.setLimits(100, 800, 5)
				.setValue(this.plugin.settings.cardHeight).setDynamicTooltip().onChange(async (value) => {
				this.plugin.settings.cardHeight = value;
				await this.plugin.saveSettings();
			}))

		new Setting(containerEl)
			.setName('Min Card Width')
			.setDesc("Set the minimum card width. The default value is 180px.")
			.addSlider((slider) => slider
				.setLimits(100, 800, 5)
				.setValue(this.plugin.settings.minCardWidth).setDynamicTooltip().onChange(async (value) => {
				this.plugin.settings.minCardWidth = value;
				await this.plugin.saveSettings();
			}))

		new Setting(containerEl)
			.setName('Coefficent Compression Of Blocks')
			.setDesc("When building interpretation blocks, some automatic text change is used, the more this coefficient, the more blocks the plugin tries to fit on one row. This setting is only needed for interpretation timeline. The default value is 0.4")
			.addSlider((slider) => slider
				.setLimits(0, 1, 0.05)
				.setValue(this.plugin.settings.coefficentCompressionOfBlocks).setDynamicTooltip().onChange(async (value) => {
				this.plugin.settings.coefficentCompressionOfBlocks = value;
				await this.plugin.saveSettings();
			}))

		new Setting(containerEl)
			.setName("Max Number Of Rows In blocks")
			.setDesc("Max number of rows in blocks with intapritations for one even. The default value is 1.")
			.addSlider((slider) => slider
				.setLimits(1, 10, 1)
				.setValue(this.plugin.settings.maxNumberOfRowsInblocks).setDynamicTooltip().onChange(async (value) => {
				this.plugin.settings.maxNumberOfRowsInblocks = value;
				await this.plugin.saveSettings();
			}))

	}
}