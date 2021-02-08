# obsidian Timelines
![GitHub release)](https://img.shields.io/github/v/release/Darakah/obsidian-timelines)
![GitHub all releases](https://img.shields.io/github/downloads/Darakah/obsidian-timelines/total)

Generate a chronological timeline of all notes with the specified set of tags. 

## Inserting a Timeline

1. Write inside a note (where you want the timeline to be inserted) the list of tags (separated by a `;` semi-column) for the notes to be included in the timeline. e.g. `tag1;tag2;tag3` 
2. Select the written tag list
3. ctrl/cmd + P -> Choose `add timeline` command
4. The `tag1;tag2;tag3` selected string will be replaced with html code that will render the timeline. 

## Example
![example](./example_1.png)

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
<span class='ob-timelines' data-date='1444-10-00-00' data-title='TITLE' data-img = 'URL'>Description</span> 
```

The note will be ignored in the following cases:
- no `timeline` tag in the YAML (or the modified tag from the settings)
- Note does not contain all the tags from the search list
- No timeline span info block
- Class name is wrong `ob-timelines` must be specified
- The used date is not VALID, must be in the following format YEAR-MONTH-DAY-MINUTES (check info section below for more details)


