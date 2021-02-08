# obsidian Timelines
![GitHub release)](https://img.shields.io/github/v/release/Darakah/obsidian-timelines)
![GitHub all releases](https://img.shields.io/github/downloads/Darakah/obsidian-timelines/total)

Generate a chronological timeline of all notes with the specified set of tags. 

## Inserting a Timeline

1. Write inside a note (where you want the timeline to be inserted) the list of tags (separated by a `;` semi-column) for the notes to be included in the timeline. e.g. `tag1;tag2;tag3` 
2. Select the written tag list
3. ctrl/cmd + P -> Choose `add timeline` command
4. The `tag1;tag2;tag3` selected string will be replaced with html that will render the timeline. 

## Example
![example](https://raw.githubusercontent.com/Darakah/obsidian-timelines/main/images/exp_2.png)

## Timeline Tagging a note
For a note to be included in a timeline the following must be valid:
1. The `timeline` tag must be included in the YAML info of that note
```html
---
tags: [timeline, tag1, tag2, tag3]
---
```
2. The note must have all the specified tags to be included in the search (must also be in the YAML info). This note example above will be included if all of the following searches (assuming its timeline span info is valid): `tag1` , `tag1;tag2` , `tag1;tag2;tag3` (and all other combinations) 
3. Note must contain a timeline info span (it is not hidden in preview to keep note clean) containing the information to be presented (at least the date must be valid all other fields are optional, a non-valid date will cause the note to be ignored when the timeline is being built)

```html
<span class='ob-timelines' data-date='1444-10-00-00' data-title='TITLE' data-img = 'URL'> D
  E S C R I P T I O N </span> 
```

The note will be ignored in the following cases:
- no `timeline` tag in the YAML (or the modified tag from the settings)
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

- Title:
  - Optional
  - If a title is not specified the name of the note will be used

- Description:
  - Optional
  - If a description is not specified an empty section will be shown

- Background Image:
  - If an image is not specified no image will be shown (just text)
  - If an invalid url is given (an empty black section will be seen for that note card)
  - Currently only `http` & `absolute local path` are will render, in the current obsidian release of `v0.10.13` obsidian links for background images are blocked from rendering, hopefully it is promised that this will be removed in the upcuming `v0.10.14` release. 






