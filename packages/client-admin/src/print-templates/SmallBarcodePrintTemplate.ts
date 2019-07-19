import {Component} from "@angular/core";
import {SdPrintTemplateBase} from "@simplism/angular";

@Component({
  selector: "app-small-barcode-print-template",
  template: `
    <main class="printArea">
      <div *ngFor="let item of items ;  let i = index; trackBy: trackByMeFn">
        <ng-container *ngFor="let seq of printSeq; ">
          <div *ngIf="i === 0" style="padding: 5px;">
            <table>
              <tr>
                <td style="width: 30%">품 목 명</td>
                <td style="width: 70%; font-size: 12pt;">{{ item.goodName }}</td>
              </tr>
              <tr>
                <td style="width: 30%">규 &nbsp;&nbsp; 격</td>
                <td
                  style="width: 70%; font-size: 11pt;">{{ (item.specification || '') + ' * ' + (item.thick || '') + ' * ' + (item.length || '') }}</td>
              </tr>
              <tr>
                <td style="width: 30%">L O T</td>
                <td style="width: 70%; font-size: 11pt;">{{ item.lot }}</td>
              </tr>
            </table>
            <div style="padding-top: 5px;">
              <sd-barcode [value]="item.lot"
                          [lineWidth]="1.2"
                          [margin]="0.8"
                          [fontSize]="10"
                          [height]="25"></sd-barcode>
            </div>
          </div>
          <div *ngIf="i !== 0" style="padding: 5px;">
            <table>
              <tr>
                <td style="width: 30%">품 목 명</td>
                <td style="width: 70%; font-size: 12pt;">{{ item.goodName }}</td>
              </tr>
              <tr>
                <td style="width: 30%">규 &nbsp;&nbsp; 격</td>
                <td
                  style="width: 70%; font-size: 11pt;">{{ (item.specification || '') + ' * ' + (item.thick || '') + ' * ' + (item.length || '') }}</td>
              </tr>
              <tr>
                <td style="width: 30%">L O T</td>
                <td style="width: 70%; font-size: 11pt;">{{ item.lot }}</td>
              </tr>
            </table>
            <div style="padding-top: 5px;">
              <sd-barcode [value]="item.lot"
                          [lineWidth]="1.2"
                          [margin]="0.8"
                          [fontSize]="10"
                          [height]="25"></sd-barcode>
            </div>
          </div>
          <div class="endLine"></div>
        </ng-container>
      </div>
    </main>
  `,
  styles: [`
    @page {
      height: 40mm;
      width: 80mm;
      margin: 0;
      padding: 0;
    }

    .printArea {
      width: 80mm;
      height: 40mm;
      text-align: center
    }

    .printArea > * > * > table {
      border-collapse: collapse;
      border: 1px solid darkolivegreen;
      width: 100%;
      height: 100%;
    }

    .printArea > * > * > table > tr, td {
      height: 6mm;
      text-align: center;
      padding: 4px;
      border: 1pt solid #121212;
      font-size: 10pt;
    }

    .endLine {
      page-break-before: always;
    }
  `]
})
export class SmallBarcodePrintTemplate extends SdPrintTemplateBase<{ printList: any[]; printSeq?: number }> {

  public items?: ISmallBarcodePrintVM[] = [];
  public printSeq: number[] | undefined;

  public trackByMeFn = (i: number, item: any) => item;

  public seq = 2;

  public constructor() {
    super();
  }

  public async sdOnOpen(param: { printList: any[]; printSeq?: number }): Promise<void> {
    this.items = [];
    this.items = param.printList;

    const maxSeq = param.printSeq || 1;
    this.printSeq = [];

    for (let i = 1; i <= maxSeq; i++) {
      this.printSeq.push(i);
    }
  }
}

interface ISmallBarcodePrintVM {
  goodName: string | undefined;
  specification: string | undefined;
  thick: number | undefined;
  length: number | undefined;
  lot: string | undefined;
}