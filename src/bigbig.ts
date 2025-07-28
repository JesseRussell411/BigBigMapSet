/**
 * Extension of {@link Map} with no size limit.
 */
export class BigMap<K, V> extends Map<K, V> {
    /** Where the entries are actually stored. The base {@link Map} this {@link BigMap} extends is left empty. */
    private readonly chunks: Map<K, V>[] = [];

    public get [Symbol.toStringTag]() {
        return "BigMap";
    }

    public clear(): void {
        this.chunks.length = 0;
    }

    public constructor(entries?: Iterable<readonly [K, V]>) {
        super();

        if (entries instanceof BigMap) {
            // clone
            for (const chunk of entries.chunks) {
                this.chunks.push(new Map(chunk))
            }
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
        for (let i = 0; i < this.chunks.length; i++) {
            const chunk = this.chunks[i]!;

            if (chunk.delete(key)) {
                // delete chunk if empty
                if (chunk.size === 0) {
                    this.chunks.splice(i, 1);
                    // deleting from chunks messes up iteration
                    // but it's fine because the function is exiting now anyway.
                }
                return true;
            }
        }
        return false;
    }

    public set(key: K, value: V): this {
        if (this.chunks.length > 0) {
            const finalIndex = this.chunks.length - 1;

            // replace entry if found in any chunk other than the final one
            for (let i = 0; i < finalIndex; i++) {
                const chunk = this.chunks[i]!;
                if (chunk.has(key)) {
                    chunk.set(key, value);
                    return this;
                }
            }

            // try to add the entry to the final chunk
            const finalChunk = this.chunks[finalIndex]!;
            try {
                finalChunk.set(key, value);
                return this;
            } catch (e) {
                if (e instanceof RangeError) {
                    // final chunk is out of space
                } else throw e;
            }
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
    /** Where the values are actually stored. The base {@link Set} this {@link BigSet} extends is left empty. */
    private readonly chunks: Set<V>[] = [];

    public get [Symbol.toStringTag]() {
        return "BigSet";
    }

    public clear(): void {
        this.chunks.length = 0;
    }

    public constructor(values?: Iterable<V>) {
        super();

        if (values instanceof BigSet) {
            // clone
            for (const chunk of values.chunks) {
                this.chunks.push(new Set(chunk));
            }
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
        for (let i = 0; i < this.chunks.length; i++) {
            const chunk = this.chunks[i]!;

            if (chunk.delete(value)) {
                // delete chunk if empty
                if (chunk.size === 0) {
                    this.chunks.splice(i, 1);
                    // deleting from chunks messes up iteration
                    // but it's fine because the function is exiting now anyway.
                }
                return true;
            }
        }
        return false;
    }

    public add(value: V): this {
        if (this.chunks.length > 0) {
            const finalIndex = this.chunks.length - 1;

            // check if found in any chunk other than the final one
            for (let i = 0; i < finalIndex; i++) {
                const chunk = this.chunks[i]!;
                if (chunk.has(value)) {
                    chunk.add(value); // just in case
                    return this;
                }
            }

            // try to add the value to the final chunk
            const finalChunk = this.chunks[finalIndex]!;
            try {
                finalChunk.add(value);
                return this;
            } catch (e) {
                if (e instanceof RangeError) {
                    // final chunk is out of space
                } else throw e;
            }
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
