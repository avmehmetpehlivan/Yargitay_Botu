import type { Content } from 'pdfmake/interfaces';
import type { Decision } from '../shared/types/Decision';
import { formatDateTR } from '../shared/utils/dateUtils';

export function buildTableOfContents(decisions: Decision[]): Content {
  const rows: Content[][] = decisions.map((d, i) => [
    { text: `${i + 1}.`, style: 'tocIndex', noWrap: true },
    { text: d.chamber, style: 'tocChamber' },
    { text: d.esasNo, style: 'tocEsas' },
    { text: d.kararNo, style: 'tocDate' },
    { text: formatDateTR(d.date), style: 'tocDate', noWrap: true },
    { text: '', linkToDestination: `decision-${d.id}`, style: 'tocPage' },
  ]);

  return {
    stack: [
      { text: 'İçindekiler', style: 'tocHeader' },
      {
        table: {
          widths: [20, '*', 90, 90, 60, 20],
          body: [
            [
              { text: '#', style: 'tocColHeader' },
              { text: 'Daire', style: 'tocColHeader' },
              { text: 'Esas No', style: 'tocColHeader' },
              { text: 'Karar No', style: 'tocColHeader' },
              { text: 'Tarih', style: 'tocColHeader' },
              { text: '', style: 'tocColHeader' },
            ],
            ...rows,
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0,
          hLineColor: () => '#e2e8f0',
          paddingTop: () => 5,
          paddingBottom: () => 5,
        },
      },
    ],
    margin: [0, 0, 0, 20],
  };
}
