import {Component} from "@angular/core";
import {SdPrintTemplateBase} from "@simplism/angular";


@Component({
  selector: "app-medium-barcode-print-template",
  template: `
    <main class="printArea" *ngIf="items.length > 0">
      <div *ngFor="let item of items; trackBy: trackByMeFn; ">
        <ng-container *ngIf="item.isExport === true">
          <div style="padding: 5px;">
            <table>
              <tr style="height: 8mm; padding: 5px;">
                <td style="width: 20%">품 &nbsp;&nbsp;&nbsp;&nbsp; 번</td>
                <td style="width: 30%" [colSpan]="2">{{ item.goodName }}</td>
                <td style="width: 20%">LOT NO</td>
                <td style="width: 30%">{{ item.lot }}</td>
              </tr>
              <tr style="height: 8mm; padding: 5px;">
                <td style="width: 20%">규 &nbsp;&nbsp;&nbsp;&nbsp; 격</td>
                <td style="width: 30%; font-size: 11pt;"
                    [colSpan]="2">{{ (item.specification || '') + ' * ' + (item.thick || '') + ' * ' + (item.length || '') }}</td>
                <td style="width: 20%">중 &nbsp;&nbsp;&nbsp;&nbsp; 량</td>
                <td style="width: 30%; text-align: right;">{{ item.weight | number }} Kg</td>
              </tr>
              <tr style="height: 8mm; padding: 5px;">
                <td style="width: 20%; font-size: 10pt">처리면(Corona)</td>
                <td style="width: 15%">내면</td>
                <td style="width: 15%">외면</td>
                <td style="width: 20%">재 &nbsp;&nbsp;&nbsp;&nbsp; 질</td>
                <td style="width: 30%"></td>
              </tr>
            </table>
            <div style="padding-top: 2px;">
              <div style="text-align: center;">
                <sd-barcode [value]="item.lot"
                            [lineWidth]="1.7"
                            [margin]="3"
                            [fontSize]="12"
                            [height]="30"></sd-barcode>
              </div>
              <div
                style="text-align: center; display: inline-block; vertical-align: top; padding-right: 10px;">
                <img [src]="logo" style="text-align: center; width: 14mm; height: 7mm">
              </div>
              <div
                style="text-align: center; display: inline-block; padding-top: 3px; font-size: 14pt; letter-spacing : 0.1pt;  margin: 0;">
                SAMSUNG GRATECH CO., LTD
              </div>
              <div style="text-align: left;">
                <div
                  style="text-align: left; display: inline-block; vertical-align: top; padding-right: 10px;">
                  우편번호 18543<br>
                  458 Mado-Ro, Mado-Myun, Hwasung-si, Gyeonggi-do. Korea <br>
                  &nbsp; TEL:+82-31-356~4806<br>
                  &nbsp; FAX:+82-31-356~4480<br>
                </div>
                <div
                  style="text-align: left; display: inline-block; padding-top: 20px; padding-left: 10%; font-size: 17pt; letter-spacing : 0.1pt;  font-weight: bold;">
                  합격
                </div>
              </div>
            </div>
          </div>
        </ng-container>
        <ng-container *ngIf="item.isExport !== true">
          <div style="padding: 5px;">
            <table>
              <tr style="height: 8mm; padding: 5px;">
                <td style="width: 20%">품 &nbsp;&nbsp;&nbsp;&nbsp; 번</td>
                <td style="width: 30%" [colSpan]="2">{{ item.goodName }}</td>
                <td style="width: 20%">LOT NO</td>
                <td style="width: 30%">{{ item.lot }}</td>
              </tr>
              <tr style="height: 8mm; padding: 5px;">
                <td style="width: 20%">규 &nbsp;&nbsp;&nbsp;&nbsp; 격</td>
                <td style="width: 30%; font-size: 11pt;"
                    [colSpan]="2">{{ (item.specification || '') + ' * ' + (item.thick || '') + ' * ' + (item.length || '') }}</td>
                <td style="width: 20%">중 &nbsp;&nbsp;&nbsp;&nbsp; 량</td>
                <td style="width: 30%; text-align: right;">{{ item.weight | number }} Kg</td>
              </tr>
              <tr style="height: 8mm; padding: 5px;">
                <td style="width: 20%; font-size: 10pt">처리면(Corona)</td>
                <td style="width: 15%">내면</td>
                <td style="width: 15%">외면</td>
                <td style="width: 20%">재 &nbsp;&nbsp;&nbsp;&nbsp; 질</td>
                <td style="width: 30%"></td>
              </tr>
              <tr>
                <td [colSpan]="5">
                  <sd-barcode [value]="item.lot"
                              [lineWidth]="2"
                              [margin]="3"
                              [fontSize]="10"
                              [height]="25"></sd-barcode>
                </td>
              </tr>
              <tr>
                <td style="width: 17%">주 의 사 항</td>
                <td style="width: 83%; text-align: left; font-size: 7pt; line-height: 10px; margin: 2px;" [colSpan]="4">
                  1. 제품을 떨어뜨리거나 굴리지 마십시오.<br>
                  2. 충격을 가하거나 찍힘을 발생시키지 마십시오.<br>
                  3. 직사광선을 피하고 서늘하고 습기가 없는 곳에 보관 하십시오.<br>
                  4. 사용 후 보관시에는 당사 포장지로 재포장하여 보관 하십시오.<br>
                  5. 사용시 코로나 처리면 및 필름의 내,외면을 구분하여 사용하십시오.<br>
                </td>
              </tr>
              <tr style="height: 9mm; font-weight: bold;">
                <td [colSpan]="5">
                  <div
                    style="text-align: center; display: inline-block; vertical-align: top; padding-right: 10px;">
                    <img [src]="logo" style="text-align: center; width: 15mm; height: 7mm">
                  </div>
                  <div
                    style="text-align: center; display: inline-block; font-size: 7pt; line-height: 1.3em; padding-top: 1px; padding-right: 10px;">
                    접착필름 및 특수필름 <br>
                    제조전문회사
                  </div>
                  <div style="text-align: center; display: inline-block; line-height: 0.7em; padding-top: 1px;">
                    <div style="font-size: 10pt; letter-spacing : 0.1pt;  margin: 0; padding: 0">
                      (주) 삼 성 그 라 테 크
                    </div>
                    <div style="font-size: 7pt; margin: 0; padding: 0">
                      www.sample.com
                    </div>
                  </div>

                </td>
              </tr>
              <tr style="height: 2mm; margin: 0; padding: 0;">
                <td [colSpan]="5" style="height: 3mm; font-size: 1px; letter-spacing: -0.5pt">
                  경기도 화성시 마도면 마도로 458 458 Mado-ro, Mado-myun, Hwasung-si Gyeonggi-do TEL : 82-31-356-4806~7 FAX :
                  82-31-356-4480
                </td>
              </tr>
            </table>
          </div>
        </ng-container>
        <div class="endLine"></div>
      </div>
    </main>
  `,
  styles: [`
    @page {
      height: 70mm;
      width: 150mm;
      margin: 0;
      padding: 0;
    }

    .printArea {
      width: 150mm;
      height: 70mm;
      text-align: center
    }

    .printArea > * > * > table {
      border-collapse: collapse;
      border: 1px solid darkolivegreen;
      width: 100%;
      height: 100%;
    }

    .printArea > * > * > table > tr, td {
      text-align: center;
      border: 1pt solid #121212;
      font-size: 12pt;
    }

    .endLine {
      page-break-before: always
    }
  `]
})
export class MediumBarcodePrintTemplate extends SdPrintTemplateBase<{ printItems: IBarcodePrintVM[] }> {

  public items?: IBarcodePrintVM[] = [];

  public logo = require("../assets/logo.png"); //tslint:disable-line:no-require-imports
  public trackByMeFn = (i: number, item: any) => item;

  public constructor() {
    super();
  }

  public async sdOnOpen(param: { printItems: IBarcodePrintVM[] }): Promise<void> {
    this.items = [];
    this.items = param.printItems;
  }
}

export interface IBarcodePrintVM {
  goodName: string | undefined;
  specification: string | undefined;
  thick: number | undefined;
  length: number | undefined;
  weight: number | undefined;
  corona: "내면" | "외면" | undefined;
  material: string | undefined;
  lot: string | undefined;
  isExport: boolean;
}