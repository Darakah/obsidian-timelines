import type { TFile, MetadataCache, DataAdapter } from 'obsidian';
import { getAllTags } from 'obsidian';

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
