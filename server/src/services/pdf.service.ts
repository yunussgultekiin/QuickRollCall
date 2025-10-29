import PDFDocument = require('pdfkit');
import { SessionData } from '../cache/session.service';

type PdfDoc = InstanceType<typeof PDFDocument>;

type ColumnAlignment = 'left' | 'center' | 'right';

type ColumnKey = 'index' | 'userId' | 'name' | 'surname' | 'timestamp';

interface ColumnConfig {
	key: ColumnKey;
	label: string;
	width: number;
	align: ColumnAlignment;
}

const DEFAULT_MARGIN = 50;
const HEADER_FONT_SIZE = 20;
const DETAILS_FONT_SIZE = 12;
const TABLE_HEADER_FONT_SIZE = 11;
const TABLE_CELL_FONT_SIZE = 10;
const CELL_PADDING_X = 6;
const CELL_PADDING_Y = 4;

export class PdfService {
	createDoc(): PdfDoc {
		return new PDFDocument({ margin: DEFAULT_MARGIN, size: 'A4' }) as PdfDoc;
	}

	buildAttendance(doc: PdfDoc, session: SessionData) {
		try {
			const baseTitle = session.name?.trim()?.length ? session.name.trim() : 'Attendance';
			(doc as any).info = {
				...(doc as any).info,
				Title: baseTitle,
				Author: 'Quick Roll Call',
				Subject: 'Session Attendance Export',
			};
		} catch {
			// Non-critical metadata updates should not block PDF creation.
		}

		doc.font('Helvetica-Bold').fontSize(HEADER_FONT_SIZE).fillColor('#1f2937').text('Quick Roll Call', { align: 'center' });
		doc.moveDown(0.6);

		doc.font('Helvetica').fontSize(DETAILS_FONT_SIZE).fillColor('#111827');

		const sessionName = session.name?.trim();
		if (sessionName) doc.text(`Session: ${sessionName}`);

		if (session.durationMinutes) doc.text(`Duration: ${session.durationMinutes} min`);

		const createdAt = this.formatDate(session.createdAt);
		if (createdAt) doc.text(`Created At: ${createdAt}`);

		const closedAt = this.formatDate(session.closedAt);
		if (closedAt) doc.text(`Closed At: ${closedAt}`);

		doc.moveDown(0.8);

			const columns: ColumnConfig[] = [
				{ key: 'index', label: 'No', width: 40, align: 'center' },
				{ key: 'userId', label: 'User ID', width: 90, align: 'center' },
				{ key: 'name', label: 'Name', width: 120, align: 'left' },
				{ key: 'surname', label: 'Surname', width: 120, align: 'left' },
				{ key: 'timestamp', label: 'Timestamp', width: 125, align: 'center' },
			];

		const tableWidth = columns.reduce((sum, column) => sum + column.width, 0);
		const leftBoundary = doc.page.margins.left ?? DEFAULT_MARGIN;
		const bottomBoundary = () => (doc.page?.height ?? 0) - (doc.page?.margins?.bottom ?? DEFAULT_MARGIN);

				const toEpoch = (value?: string | number | Date | null) => {
					if (!value) return Number.NaN;
					const parsed = value instanceof Date ? value : new Date(value);
					return parsed.getTime();
				};

				const attendance = (session.attendance ?? [])
					.slice()
					.sort((a, b) => {
						const aTime = toEpoch(a.timestamp);
						const bTime = toEpoch(b.timestamp);

						const aInvalid = Number.isNaN(aTime);
						const bInvalid = Number.isNaN(bTime);

						if (aInvalid && bInvalid) return 0;
						if (aInvalid) return 1;
						if (bInvalid) return -1;
						return aTime - bTime;
					});

		const ensureSpace = (height: number, onAddPage?: () => void) => {
			const bottomLimit = bottomBoundary();
			if (doc.y + height > bottomLimit) {
				doc.addPage();
				onAddPage?.();
			}
		};

		const drawTableHeader = () => {
			const headerHeight = TABLE_HEADER_FONT_SIZE + CELL_PADDING_Y * 2 + 2;
			const headerY = doc.y;

			doc.save();
			doc.rect(leftBoundary, headerY, tableWidth, headerHeight).fill('#e2e8f0');
			doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(TABLE_HEADER_FONT_SIZE);

			let columnX = leftBoundary;
			columns.forEach((column) => {
				doc.text(column.label, columnX + CELL_PADDING_X, headerY + CELL_PADDING_Y, {
					width: column.width - CELL_PADDING_X * 2,
					align: column.align,
				});
				columnX += column.width;
			});
			doc.restore();

			doc.y = headerY + headerHeight;
			doc.moveDown(0.15);

			doc.save();
			doc.strokeColor('#94a3b8').lineWidth(0.6);
			doc.moveTo(leftBoundary, doc.y).lineTo(leftBoundary + tableWidth, doc.y).stroke();
			doc.restore();

			doc.moveDown(0.2);
			doc.font('Helvetica').fontSize(TABLE_CELL_FONT_SIZE).fillColor('#111827');
		};

		const renderRow = (values: Record<ColumnKey, string>, rowIndex: number) => {
			doc.font('Helvetica').fontSize(TABLE_CELL_FONT_SIZE).fillColor('#111827');

			const columnHeights = columns.map((column) =>
				doc.heightOfString(values[column.key], {
					width: column.width - CELL_PADDING_X * 2,
					align: column.align,
				}),
			);

			const contentHeight = Math.max(...columnHeights, CELL_PADDING_Y);
			const rowHeight = contentHeight + CELL_PADDING_Y * 2;

			ensureSpace(rowHeight + CELL_PADDING_Y, drawTableHeader);

			const rowY = doc.y;

			if (rowIndex % 2 === 1) {
				doc.save();
				doc.fillOpacity(0.05);
				doc.rect(leftBoundary, rowY - 1, tableWidth, rowHeight + 2).fill('#0f172a');
				doc.restore();
			}

			let columnX = leftBoundary;
			columns.forEach((column) => {
				doc.text(values[column.key], columnX + CELL_PADDING_X, rowY + CELL_PADDING_Y, {
					width: column.width - CELL_PADDING_X * 2,
					align: column.align,
				});
				columnX += column.width;
			});

			doc.y = rowY + rowHeight;
			doc.moveDown(0.1);

			doc.save();
			doc.strokeColor('#e2e8f0').lineWidth(0.4);
			doc.moveTo(leftBoundary, doc.y).lineTo(leftBoundary + tableWidth, doc.y).stroke();
			doc.restore();

			doc.moveDown(0.15);
		};

		ensureSpace(TABLE_HEADER_FONT_SIZE + CELL_PADDING_Y * 4);
		drawTableHeader();

		if (attendance.length === 0) {
			ensureSpace(40);
				doc.font('Helvetica').fontSize(DETAILS_FONT_SIZE).fillColor('#111827');
				doc.text('No attendance records.', { align: 'center' });
		} else {
			attendance.forEach((record, index) => {
				const rowValues: Record<ColumnKey, string> = {
					index: String(index + 1),
					userId: this.prepareCellValue(record.userId),
					name: this.prepareCellValue(record.name),
					surname: this.prepareCellValue(record.surname),
					timestamp: this.formatDate(record.timestamp) ?? '-',
				};

				renderRow(rowValues, index);
			});
		}

		doc.moveDown(0.6);
		doc.font('Helvetica-Bold').fontSize(11).fillColor('#1f2937');
		doc.text(`Total attendees: ${attendance.length}`, { align: 'right' });

			const generated = this.formatDate(new Date());
		if (generated) {
			doc.font('Helvetica').fontSize(9).fillColor('#475569');
			doc.text(`Generated: ${generated}`, { align: 'right' });
		}
	}

	private formatDate(value?: string | number | Date | null): string | undefined {
		if (!value) return undefined;
		try {
			const date = value instanceof Date ? value : new Date(value);
			if (Number.isNaN(date.getTime())) return undefined;
				return new Intl.DateTimeFormat('en-US', {
				dateStyle: 'medium',
				timeStyle: 'short',
			}).format(date);
		} catch {
			return undefined;
		}
	}

	private prepareCellValue(value?: string | null): string {
		const trimmed = value?.trim();
		return trimmed && trimmed.length > 0 ? trimmed : '-';
	}
}

export default new PdfService();
