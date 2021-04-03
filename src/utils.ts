import type { AllNotesData } from './types';
import type { TFile, MetadataCache } from 'obsidian';
import { getAllTags } from 'obsidian';

export function FilterMDFiles(file: TFile, tagList: String[], metadataCache: MetadataCache) {
    if (!tagList) {
        return true;
    }

    let tags = getAllTags(metadataCache.getFileCache(file)).map(e => e.slice(1, e.length));

    if (tags && tags.length > 0) {
        return tagList.every(val => { return tags.indexOf(val as string) >= 0; });
    }

    return false;
}