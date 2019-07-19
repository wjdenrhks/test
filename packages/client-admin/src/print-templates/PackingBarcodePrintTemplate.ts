import {Component} from "@angular/core";
import {SdPrintTemplateBase} from "@simplism/angular";


@Component({
  selector: "app-packing-barcode-print-template",
  template: `
    <main class="printArea" *ngIf="item">
      <table>
        <tr style="height: 15mm; padding: 5px;">
          <td style="width: 23%">품 목 명</td>
          <td style="width: 77%">{{ item.goodName }}</td>
        </tr>
        <tr style="height: 25mm; padding: 5px;">
          <td style="width: 23%">규 &nbsp;&nbsp; 격</td>
          <td
            style="width: 77%">{{ (item.specification || '') + ' * ' + (item.thick || '') + ' * ' + (item.length || '') }}</td>
        </tr>
        <tr style="height: 25mm; padding: 5px;">
          <td style="width: 23%">PALLET</td>
          <td style="width: 77%">
            <sd-barcode [value]="item.palletBarcode"
                        [lineWidth]="4"
                        [margin]="1.5"
                        [fontSize]="20"
                        [height]="37"></sd-barcode>
          </td>
        </tr>
        <tr style="height: 20mm; padding: 5px;">
          <td style="width: 23%">LOT 정보</td>
          <td style="width: 77%; font-size: 10pt;">
            <div style="display: inline-block; padding-top: 1px;"
                 *ngFor="let type of item.lotList; let i = index; trackBy: trackByMeFn">
              <ng-container *ngIf="i <= 9">
                <div style="display: inline-block; font-size: 14pt">
                  {{ type.lotName + '(' + (type.weight || '') + 'kg / ' + (type.length || '') + 'm)' }}
                </div>
                <div style="display: inline-block;" *ngIf="i !== 9 && (i !== (item.lotList.length - 1))">
                  , &nbsp;
                </div>
                <br>
              </ng-container>
            </div>
          </td>
        </tr>
        <tr style="height: 20mm; padding: 5px;">
          <td style="width: 23%">LOCATION</td>
          <td style="width: 77%">{{ item.location }}</td>
        </tr>
      </table>
      <div style="padding-top: 100px; font-weight: bold; font-size: 40pt">
        바코드 정보
      </div>
    </main>
  `,
  styles: [`
    @page {
      size: A4 landscape;
      page-break-after: always;
    }

    .printArea {
      padding-top: 10%;
      padding-left: 10%;
      padding-right: 10%;
      text-align: center
    }

    .printArea > table {
      border-collapse: collapse;
      border: 1px solid darkolivegreen;
      width: 100%;
      height: 100%;
    }

    .printArea > table > tr, td {
      text-align: center;
      border: 1pt solid #121212;
      font-size: 20pt;
    }
  `]
})
export class PackingBarcodePrintTemplate extends SdPrintTemplateBase<{ printItems: IPackingBarcodePrintVM }> {

  public item?: IPackingBarcodePrintVM;

  public trackByMeFn = (i: number, item: any) => item;

  public constructor() {
    super();
  }

  public async sdOnOpen(param: { printItems: IPackingBarcodePrintVM }): Promise<void> {
    this.item = param.printItems;
  }
}

interface IPackingBarcodePrintVM {
  goodName: string | undefined;
  specification: string | undefined;
  thick: number | undefined;
  length: number | undefined;
  palletBarcode: string | undefined;
  location: string | undefined;

  lotList: IPackingLotListVM[] | undefined;
}

interface IPackingLotListVM {
  lotId: number | undefined;
  lotName: string | undefined;
  weight: number | undefined;
  length: number | undefined;
}