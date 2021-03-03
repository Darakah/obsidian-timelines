import type { AllNotesData } from './types'
import type { TFile, MetadataCache } from 'obsidian'

export function getElement(MultiList: AllNotesData, d1: number, d2: number, d3: number) {
    if (MultiList[d1][d2][d3]) {
        return MultiList[d1][d2][d3];
    }
    return "";
};

export function FilterMDFiles(file: TFile, tagList: String[], metadataCache: MetadataCache) {
    var fileCache = metadataCache.getFileCache(file);
    let tags = [];

    if (fileCache && fileCache.tags) {
        tags = fileCache.tags.map(i => i.tag.substring(1,))
    }

    if (fileCache.frontmatter && fileCache.frontmatter.tags) {
        return tagList.every(function (val) { return fileCache.frontmatter.tags.concat(tags).indexOf(val) >= 0; })
    }
    return false;
}