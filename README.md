# obsidian Timelines
![GitHub release)](https://img.shields.io/github/v/release/Darakah/obsidian-timelines)
![GitHub all releases](https://img.shields.io/github/downloads/Darakah/obsidian-timelines/total)

Generate a chronological timeline of all notes with the specified set of tags. 

## Example - Vertical Timeline
![example](https://raw.githubusercontent.com/Darakah/obsidian-timelines/main/images/exp_2.png)

## Example - Horizantal Timeline
![example](https://raw.githubusercontent.com/Darakah/obsidian-timelines/main/images/TimelineVis.png)

## Inserting a Timeline



Before inserting a timeline, each note that is to be included must possess the following:
1. the `timeline` tag either in its YAML (a note without a timeline tag is ignored when building a timeline)
2. a `timeline info block` which contains the timeline information needed to display the note (explanation of the different parameters can be found below in the README):

```html
<span class='ob-timelines' data-date='1444-10-00-00' data-title='TITLE' data-img = 'URL' data-class = "customCardCSS"> D
  E S C R I P T I O N </span> 
```
3. Write the following render block where a timeline is to be inserted. 

![example](https://raw.githubusercontent.com/Darakah/obsidian-timelines/main/images/example_1.png)

the render block takes a single input which is the list of tags by which to filter timeline tagged notes (e.g. in the above example block, ONLY notes with all three tags `timeline`, `test` and `now`).

## Timeline Tagging a note
For a note to be included in a timeline the following must be valid:
1. The `timeline` tag must be included in that note
```html
---
tags: [timeline, test, me, now]
---
```
2. The note must have all the specified tags to be included in the search. This note example above will be included if all of the following searches (assuming its timeline span info is valid): `test` , `test;me` , `test;me;now` (and all other combinations) 
3. Note must contain a timeline info span (it is not hidden in preview to keep note clean) containing the information to be presented (at least the date must be valid all other fields are optional, a non-valid date will cause the note to be ignored when the timeline is being built)

The note will be ignored in the following cases:
- no `timeline` tag (or the modified tag from the settings)
- Note does not contain all the tags from the search list
- No timeline span info block
- Class name is wrong `ob-timelines` must be specified
- The used date is not VALID, must be in the following format YEAR-MONTH-DAY-MINUTES (check info section below for more details)

## Timeline Properties

### Timeline Span block
- Hidden in preview by default in order to keep the note clean

### Date
- The most important and essential info, if it is not valid the note will be ignored

- Valid date format: 
  - `YEAR-MONTH-DAY-HOUR`
  - Only integers (numbers) are allowed in the date other then the 4 seperators `-` used to distinguish the different groups
  - The length of each element i.e. `YEAR` can be of any length for example `1234124314`
  - The same applies to MONTH, DAY and HOUR. this means **if your input time is not valid the plugin will not check that**. Why this choice? If this plugin is used for a fantasy setup where the # of month are not only 12 for example.
  - ALL 4 GROUPS must be specified however if they don't exist / not want to be shown replace them with a zero. For example if an event only has the year and the month it can be written as follows `2300-02-00-00` this will be rendered on the timeline as `2300-02` (the trailing zeros will be removed). For only a year `2300-00-00-00` -> `2300`
  - IMPORTANT: the sorting is based on the date being converted to an integer after parsing out the `-` this means to get the proper sorting, if minutes are not added you need to replace with `00` (the maximum number of integer for that date category.

### Title:
  - Optional
  - If a title is not specified the name of the note will be used

### Description:
  - Optional
  - If a description is not specified an empty section will be shown

### Background Image:
  - Optional
  - If an image is not specified no image will be shown (just text)
  - If an invalid url is given (an empty black section will be seen for that note card)
  - Currently only `http` & `absolute local path` will render, in the current obsidian release of `v0.10.13` obsidian links for background images are blocked from rendering, hopefully it is promised that this will be removed in the upcuming release. 

### CSS Class:
  - Optional
  - Adds the applied css class to the note card associated with this span info block


## Release Notes

### v0.2.1 
- Remove escaping of `quotes / double quotes and ticks` from title and text (no longer needed)
- Additional optional span attrictute `css class` allowing to custumize each card of the timeline
- `Multiple Events per note` are now allowed. All spans on a single note will be displayed on the timeline (previously only first span was presented i.e. 1 card event per note)

PR Contribution by https://github.com/ebullient

### v0.2.0
- Added `timeline` render block:
  - Keeps the note clean by hiding the html text (which can get messy with large timelines)
  - Automatic updates of the timeline everytime the note is opened anew (had to re-insert the timeline in previous version to update it)

- Tags searched will include both `inline` & `YAML` tags

- Removed the `Add Timeline` command as it is no longer needed with the addition of the render block


## Support

[![Github Sponsorship](https://raw.githubusercontent.com/Darakah/Darakah/e0fe245eaef23cb4a5f19fe9a09a9df0c0cdc8e1/icons/github_sponsor_btn.svg)](https://github.com/sponsors/Darakah) [<img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="BuyMeACoffee" width="100">](https://www.buymeacoffee.com/darakah)

