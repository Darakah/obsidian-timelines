# obsidian-timelines
Create a timeline view of all notes with the specified combination of tags

## Adding a timeline

`tag1;tag2;tag3` -> select these -> cmd/ctrl + P `add timeline` command

## Marking a note as part of a timeline
1. Add the timeline tag specified in the settings to the YAML tag list 
`tags: [timeline]`

2. Add timeline info to a note as follows (it is hidden when in preview mode to keep notes clean)
```
<span class='ob-timelines' data-date='2025-10-21-24' data-title='Title of Event' 
data-img = 'IMAGE_URL.png'> Description of the event to be added! </span> 
```

## Example
![example](./example_1.png)
