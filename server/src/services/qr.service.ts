import QRCode, {
	QRCodeToBufferOptions,
	QRCodeToDataURLOptions,
	QRCodeToStringOptions,
} from 'qrcode';

export interface QRCommonOptions {
	width?: number;
	margin?: number;
	color?: {
		dark?: string;
		light?: string;
	};
}

export class QRGeneratorService {
	private readonly defaults: Required<QRCommonOptions>;

	constructor(defaults?: QRCommonOptions) {
		this.defaults = {
			width: defaults?.width ?? 256,
			margin: defaults?.margin ?? 4,
			color: {
				dark: defaults?.color?.dark ?? '#000000',
				light: defaults?.color?.light ?? '#FFFFFF',
			},
		};
	}

	async toDataURL(text: string, options?: QRCommonOptions & Omit<QRCodeToDataURLOptions, 'type'>): Promise<string> {
		this.validateText(text);
		return QRCode.toDataURL(text, this.mergeOptions(options));
	}

	async toPNG(text: string, options?: QRCommonOptions & Omit<QRCodeToBufferOptions, 'type'>): Promise<Buffer> {
		this.validateText(text);
		return QRCode.toBuffer(text, { ...this.mergeOptions(options), type: 'png' });
	}

	async toSVG(text: string, options?: QRCommonOptions & Omit<QRCodeToStringOptions, 'type'>): Promise<string> {
		this.validateText(text);
		return QRCode.toString(text, { ...this.mergeOptions(options) as QRCodeToStringOptions, type: 'svg' });
	}

	async toASCII(text: string, options?: QRCommonOptions & Omit<QRCodeToStringOptions, 'type'>): Promise<string> {
		this.validateText(text);
		return QRCode.toString(text, { ...this.mergeOptions(options) as QRCodeToStringOptions, type: 'terminal' });
	}

	private mergeOptions<T extends QRCodeToBufferOptions | QRCodeToDataURLOptions | QRCodeToStringOptions>(
		options?: QRCommonOptions & Partial<T>
	): T {
		return {
			width: options?.width ?? this.defaults.width,
			margin: options?.margin ?? this.defaults.margin,
			color: {
				dark: options?.color?.dark ?? this.defaults.color.dark,
				light: options?.color?.light ?? this.defaults.color.light,
			},
			...(options as Partial<T>),
		} as T;
	}

	private validateText(text: string) {
		if (!text || typeof text !== 'string' || !text.trim()) {
			throw new Error('QRGeneratorService: `text` must be a non-empty string.');
		}
	}
}