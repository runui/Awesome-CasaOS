export const platforms = ['zimaos', 'casaos'] as const;
export type Platform = (typeof platforms)[number];
export const platformNames: Record<Platform, string> = { zimaos: 'ZimaOS', casaos: 'CasaOS' };

export function isPlatform(value: unknown): value is Platform {
	return platforms.some((platform) => platform === value);
}

export function sourceLabel(source: { platform: Platform; label: string }): string {
	return `${platformNames[source.platform]} · ${source.label}`;
}
