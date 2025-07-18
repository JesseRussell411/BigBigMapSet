/**
 * Extension of {@link Map} with no size limit.
 */
export class BigMap<K, V> extends Map<K, V> {
    /** The maximum size of a {@link Map} in the current runtime. {@link Number.MAX_SAFE_INTEGER} indicates unknown (use try-catch and cache discovered maximum size for later with this field) */
    private static maxChunkSize: number = Number.MAX_SAFE_INTEGER;

    /** Where the entries are actually stored. The base {@link Map} this {@link BigMap} extends is left empty. */
    private readonly chunks: Map<K, V>[] = [];
    /** Rough indication of how many entries have been deleted, and not yet replaced, in all chunks except the final one. Not guarantied to be accurate; use as a suggestion for optimization and better entry packing, not a rule. */
    private buriedDeletions: number = 0;

    public clear(): void {
        this.chunks.length = 0;
        this.buriedDeletions = 0;
    }

    public constructor(entries?: Iterable<readonly [K, V]>) {
        super();

        if (entries instanceof BigMap) {
            // clone
            for (const chunk of entries.chunks) {
                this.chunks.push(new Map(chunk))
            }
            this.buriedDeletions = entries.buriedDeletions;
        } else if (entries instanceof Map) {
            // clone
            this.chunks.push(new Map(entries));
        } else if (entries !== undefined) {
            for(const [key, value] of entries) {
                this.set(key, value);
                // TODO check performance and optimize?
            }
        }
    }

    public get size(): number {
        // TODO? cache
        let result = 0;
        for (const chunk of this.chunks) {
            result += chunk.size;
        }
        return result;
    }

    public get(key: K): V | undefined {
        // TODO check performance difference between has and !== undefined
        for (const chunk of this.chunks) {
            if (chunk.has(key)) {
                return chunk.get(key);
            }
        }
        return undefined;
    }
    
    public has(key: K): boolean {
        for (const chunk of this.chunks) {
            if (chunk.has(key)) {
                return true;
            }
        }
        return false;
    }

    public delete(key: K): boolean {
        const finalIndex = this.chunks.length - 1;

        for (let i = 0; i <= finalIndex; i++) {
            const chunk = this.chunks[i]!;

            if (chunk.delete(key)) {
                if (chunk.size === 0) {
                    this.chunks.splice(i, 1);
                    // deleting from chunks messes up iteration
                    // but it's fine because the function is exiting now anyway.
                } else if (i < finalIndex) {
                    this.buriedDeletions++;
                }
                return true;
            }
        }
        return false;
    }

    /**
     * Tries to add the key and value to the chunk.
     * 
     * Assumes that the key does not already exist in the chunk.
     * 
     * @returns Whether the key and value was successfully added to the chunk; else, the chunk is full.
     */
    private trySet(chunk: Map<K, V>, key: K, value: V): boolean {
        try {
            if (chunk.size < BigMap.maxChunkSize) {
                chunk.set(key, value);
                return true;
            }
        } catch (e) {
            if (e instanceof RangeError) {
                // cache max size for later
                // because error handling is really slow
                // and comparisons are really fast
                BigMap.maxChunkSize = chunk.size;
            } else throw e;
        }
        return false;
    }

    public set(key: K, value: V): this {
        const finalIndex = this.chunks.length - 1;

        // replace value if found in any chunk other than the final one
        for (let i = 0; i < finalIndex; i++) {
            const chunk = this.chunks[i]!;
            if (chunk.has(key)) {
                chunk.set(key, value);
                return this;
            }
        }

        const finalChunk = this.chunks[finalIndex]!

        // check for buried deletions
        if (this.buriedDeletions > 0) {
            // replace value if found in final chunk
            if (finalChunk.has(key)) {
                finalChunk.set(key, value);
                return this;
            }

            // try to add entry to each buried chunk
            // there might be free spaces in them according to he check above
            for (let i = 0; i < finalIndex; i++) {
                const chunk = this.chunks[i]!;

                if (this.trySet(chunk, key, value)) {
                    // entry added
                    // definitely not replaced
                    // because we already try replacing existing entries

                    // one less buried deletion
                    this.buriedDeletions--;
                    return this;
                }
            }

            // definitely no buried deletions, even though there's recorded to be some
            // (occurs if the chunk with the deletions was dropped)
            this.buriedDeletions = 0;
        }

        // try to add entry to final chunk
        if (this.trySet(finalChunk, key, value)) {
            return this;
        }

        // out of space. make new chunk
        const newChunk = new Map<K, V>();
        newChunk.set(key, value);
        this.chunks.push(newChunk);
        return this;
    }

    public *entries() {
        for (const chunk of this.chunks) {
            yield* chunk.entries();
        }
        return undefined;
    }

    public *keys() {
        for (const chunk of this.chunks) {
            yield* chunk.keys();
        }
        return undefined;
    }

    public *values() {
        for (const chunk of this.chunks) {
            yield* chunk.values();
        }
        return undefined;
    }

    public foreach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any) {
        if (arguments.length > 1) {
            for (const chunk of this.chunks) {
                chunk.forEach(callbackfn, thisArg);
            }
        } else {
            for (const chunk of this.chunks) {
                chunk.forEach(callbackfn);
            }
        }
    }

    public *[Symbol.iterator]() {
        for (const chunk of this.chunks) {
            yield* chunk;
        }
        return undefined;
    }
}

/**
 * Extension of {@link Set} with no size limit.
 */
export class BigSet<V> extends Set<V> {
    /** The maximum size of a {@link Set} in the current runtime. {@link Number.MAX_SAFE_INTEGER} indicates unknown (use try-catch and cache discovered maximum size for later with this field) */
    private static maxChunkSize: number = Number.MAX_SAFE_INTEGER;

    /** Where the values are actually stored. The base {@link Set} this {@link BigSet} extends is left empty. */
    private readonly chunks: Set<V>[] = [];
    /** Rough indication of how many values have been deleted, and not yet replaced, in all chunks except the final one. Not guarantied to be accurate; use as a suggestion for optimization and better value packing, not a rule. */
    private buriedDeletions: number = 0;

    public clear(): void {
        this.chunks.length = 0;
        this.buriedDeletions = 0;
    }

    public constructor(values?: Iterable<V>) {
        super();

        if (values instanceof BigSet) {
            // clone
            for (const chunk of values.chunks) {
                this.chunks.push(new Set(chunk));
            }
            this.buriedDeletions = values.buriedDeletions;
        } else if (values instanceof Set) {
            // clone
            this.chunks.push(new Set(values));
        } else if (values !== undefined) {
            for(const value of values) {
                this.add(value);
                // TODO check performance and optimize?
            }
        }
    }

    public get size(): number {
        // TODO? cache
        let result = 0;
        for (const chunk of this.chunks) {
            result += chunk.size;
        }
        return result;
    }

    public has(value: V): boolean {
        for (const chunk of this.chunks) {
            if (chunk.has(value)) {
                return true;
            }
        }
        return false;
    }

    public delete(value: V): boolean {
        const finalIndex = this.chunks.length - 1;

        for (let i = 0; i <= finalIndex; i++) {
            const chunk = this.chunks[i]!;

            if (chunk.delete(value)) {
                if (chunk.size === 0) {
                    this.chunks.splice(i, 1);
                    // deleting from chunks messes up iteration
                    // but it's fine because the function is exiting now anyway.
                } else if (i < finalIndex) {
                    this.buriedDeletions++;
                }
                return true;
            }
        }
        return false;
    }

    /**
     * Tries to add the value to the chunk.
     * 
     * Assumes that the value does not already exist in the chunk.
     * 
     * @returns Whether the value was successfully added to the chunk; else, the chunk is full.
     */
    private tryAdd(chunk: Set<V>, value: V): boolean {
        try {
            if (chunk.size < BigSet.maxChunkSize) {
                chunk.add(value);
                return true;
            }
        } catch (e) {
            if (e instanceof RangeError) {
                // cache max size for later
                // because error handling is really slow
                // and comparisons are really fast
                BigSet.maxChunkSize = chunk.size;
            } else throw e;
        }
        return false;
    }

    public set(value: V): this {
        const finalIndex = this.chunks.length - 1;

        // check if value already exists in any chunk other than the final one
        for (let i = 0; i < finalIndex; i++) {
            const chunk = this.chunks[i]!;
            if (chunk.has(value)) {
                return this;
            }
        }

        const finalChunk = this.chunks[finalIndex]!

        // check for buried deletions
        if (this.buriedDeletions > 0) {
            // check if value already exists in final chunk
            if (finalChunk.has(value)) {
                return this;
            }

            // try to add entry to each buried chunk
            // there might be free spaces in them according to he check above
            for (let i = 0; i < finalIndex; i++) {
                const chunk = this.chunks[i]!;

                if (this.tryAdd(chunk, value)) {
                    // value added
                    // definitely not replaced
                    // because we already checked for existing values

                    // one less buried deletion
                    this.buriedDeletions--;
                    return this;
                }
            }

            // definitely no buried deletions, even though there's recorded to be some
            // (occurs if the chunk with the deletions was dropped)
            this.buriedDeletions = 0;
        }

        // try to add entry to final chunk
        if (this.tryAdd(finalChunk, value)) {
            return this;
        }

        // out of space. make new chunk
        const newChunk = new Set<V>();
        newChunk.add(value);
        this.chunks.push(newChunk);
        return this;
    }

    public *entries() {
        for (const chunk of this.chunks) {
            yield* chunk.entries();
        }
        return undefined;
    }

    public *keys() {
        for (const chunk of this.chunks) {
            yield* chunk.keys();
        }
        return undefined;
    }

    public *values() {
        for (const chunk of this.chunks) {
            yield* chunk.values();
        }
        return undefined;
    }

    public foreach(callbackfn: (value: V, value2: V, set: Set<V>) => void, thisArg?: any) {
        if (arguments.length > 1) {
            for (const chunk of this.chunks) {
                chunk.forEach(callbackfn, thisArg);
            }
        } else {
            for (const chunk of this.chunks) {
                chunk.forEach(callbackfn);
            }
        }
    }

    public *[Symbol.iterator]() {
        for (const chunk of this.chunks) {
            yield* chunk;
        }
        return undefined;
    }
}
