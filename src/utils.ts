import { match } from 'assert';
import type {DataAdapter, MetadataCache, TFile} from 'obsidian';
import {getAllTags} from 'obsidian';

export function parseTag(tag: string, tagList: string[]) {
	tag = tag.trim();

	// Skip empty tags
	if (tag.length === 0) {
		return;
	}

	// Parse all subtags out of the given tag.
	// I.e., #hello/i/am would yield [#hello/i/am, #hello/i, #hello]. */
	tagList.push(tag);
	while (tag.contains("/")) {
		tag = tag.substring(0, tag.lastIndexOf("/"));
		tagList.push(tag);
	}
}

export function FilterMDFiles(file: TFile, tagList: String[], metadataCache: MetadataCache) {
	if (!tagList || tagList.length === 0) {
		return true;
	}

	let tags = getAllTags(metadataCache.getFileCache(file)).map(e => e.slice(1, e.length));

	if (tags && tags.length > 0) {
		let filetags: string[] = [];
		tags.forEach(tag => parseTag(tag, filetags));
		return tagList.every(val => { return filetags.indexOf(val as string) >= 0; });
	}

	return false;
}

/**
 * Create date of passed string
 * @date - string date in the format YYYY-MM-DD-HH
 */
export function createDate(date: string): Date {
	let dateComp = date.split(',');
	// cannot simply replace '-' as need to support negative years
	return new Date(+(dateComp[0] ?? 0), +(dateComp[1] ?? 0), +(dateComp[2] ?? 0), +(dateComp[3] ?? 0));
}

/**
 * Return URL for specified image path
 * @param path - image path
 */
export function getImgUrl(vaultAdaptor: DataAdapter, path: string): string {

	if (!path) {
		return null;
	}

	let regex = new RegExp('^https:\/\/');
	if (path.match(regex)) {
		return path;
	}

	return vaultAdaptor.getResourcePath(path);
}

export function whatMinimumWidthMustBeBlockToFitTheWholeText(text: string, startWidth: number, height: number, fontSize: number, testElement: HTMLElement | HTMLDivElement, el: HTMLElement): number{
	let difference = 0;
	testElement.style.fontSize = fontSize + 'px';
	testElement.textContent = text;
	
	let count = 0 ;
	
	do{
		if (testElement.scrollHeight !== 0)
			startWidth += difference * startWidth / (testElement.scrollHeight);
		else
			startWidth = 0;

		testElement.style.width = startWidth + 'px';

		el.appendChild(testElement);

		difference = testElement.scrollHeight - height

		count++
	}while(testElement.scrollHeight > height && count < 30);
	
	return startWidth;
}

export function getFrontmatterTime(time: string): [isSuccess: boolean, noteId: number, era: number, year: number, month: number, day: number, hours: number, minutes: number]
{
	let era, year, month, day, hours, minutes, noteId;
	time = time.trim();

	if (/^\d\d\d\d\-\d\d\-\d\d\-\d\d:\d\d$/.test(time)) {
		era = 1;
		[year, month, day, time] = time.split('-');
		[hours, minutes] = time.split(':');
		[year, month, day, hours, minutes] = [year, month, day, hours, minutes].map(Number)
	}
	else if (/^\d\d\d\d\-\d\d\-\d\d$/.test(time)){
		era = 1;
		[year, month, day] = time.split('-');
		[year, month, day] = [year, month, day].map(Number)
	}
	else if (/^-\d\d\d\d\-\d\d\-\d\d\-\d\d:\d\d$/.test(time))
	{
		era = -1;
		[year, month, day, time] = time.substring(1).split('-');
		[hours, minutes] = time.split(':');
		[year, month, day, hours, minutes] = [year, month, day, hours, minutes].map(Number)
	}
	else if (/^-\d\d\d\d\-\d\d\-\d\d$/.test(time)){
		era = -1;
		[year, month, day] = time.substring(1).split('-');
		[year, month, day] = [year, month, day].map(Number)
	}
	else
	{
		return [false, undefined, undefined, undefined, undefined, undefined, undefined, undefined];
	}

	noteId = year*100000000 + month*1000000 + day * 10000;
	if (hours !== undefined)
		noteId += hours*100 + minutes;

	return [true, noteId,era, year, month, day, hours, minutes]
}

export function getInterpretaionText(file: TFile): string{
	const fs = require('fs');
	// @ts-ignore
	let readedFile = fs.readFileSync(file.vault.adapter.basePath + '/' + file.path, 'utf8').split('\n');

	return readedFile.join('\n');
}

export function replaceEnhancedMarkdownSyntax(text: string): string {	
	text = text.replace(/---[^]+?---/gs, '').replace(/<[^]+?>/gs, '').replace(/(```)/g, '').replace(/(\*\*(.+?)\*\*|__(.+?)__|`(.+?)`|\*(.+?)\*|_(.+?)_|\~\~(.+?)\~\~)/g, (match, p1, p2, p3, p4, p5, p6, p7) => p2 || p3 || p4 || p5 || p6 || p7).replace(/^(#{1,6})\s(.*)$/gm, (match, p1, p2) => p2).replace(/^\s*[\r\n]+|[\r\n]+\s*$/gm, '');
  
	return text;
}