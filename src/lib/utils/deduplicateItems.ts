// deduplicateItems.ts

/**
 * Removes duplicates from an array of objects based on a unique identifier.
 * @param items - The array of items to deduplicate.
 * @param idKey - The key of the unique identifier.
 * @returns A new array with duplicates removed.
 */
function deduplicateItems<T>(items: T[], idKey: keyof T): T[] {
    const seen = new Set();
    return items.filter(item => {
        const id = item[idKey];
        if (seen.has(id)) {
            return false;
        } else {
            seen.add(id);
            return true;
        }
    });
}

export default deduplicateItems;