interface String {
    endsWith(suffix: string): boolean;
    includes(search: string, start?: number): boolean;
}

interface StringConstructor {
    fromCodePoint(...codePoints: number[]): string;
}
