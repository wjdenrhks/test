import {Component} from "@angular/core";
import {SdPrintTemplateBase} from "@simplism/angular";
import {IInspectionReportVM} from "../modals/InspectionReportModal";

@Component({
  selector: "app-purchase-print-template",
  template: `
    <main class="printArea" *ngIf="items">
      <div style="display: inline-block;">
        <div
          style="text-align: center; display: inline-block; vertical-align: top; padding-bottom: 70px; padding-right: 10px;">
          <img [src]="logo" style="text-align: center; width: 100px;">
        </div>
        <div style="text-align: center; display: inline-block;">
          <h1>(주) 삼성그라테크 </h1>
          <h3>(SAMSUNG GRA TECH.CO.LTD)</h3>
          <h4>본사 : 경기도 화성시 마도면 마도로 458</h4>
          <h4>전화 : (031) 356-4806</h4>
          <h4>팩스 : (031) 356-4480</h4>
          <br>
        </div>
      </div>
      <div style="font-size: 30px; font-weight: bold; padding-bottom: 15px;"> 試 驗 成 績 書</div>
      <div style="width: 40%; height: 5px; text-align: center; margin-left: 30%;
           border-right: none; border-left: none; border-bottom:1px solid; border-top: 1px solid">
      </div>
      <br>
      <div>
        <table>
          <tr>
            <td style="width: 25%">제품명</td>
            <td style="width: 160px;"> {{ items.goodName }}</td>
            <td style="width: 25%">출하일</td>
            <td style="width: 25%"> {{ items.shippingDate?.toFormatString("yyyy-MM-dd") }} </td>
          </tr>
          <tr>
            <td>LOT NO</td>
            <td>
              <ng-container *ngIf="items && items.barcode">
                <div *ngFor="let lot of items.barcode">
                  {{ lot.lot }}
                </div>
              </ng-container>
            </td>
            <td>시험일자</td>
            <td>
              {{ items.testDate?.toFormatString("yyyy-MM-dd") }}
            </td>
          </tr>
        </table>
      </div>
      <div id="test" style="padding-top: 20px;">
        <table>
          <thead>
          <tr>
            <th style="width: 25%">검사항목</th>
            <th style="width: 13%">시험방법</th>
            <th style="width: 12%">단위</th>
            <th style="width: 25%">규격</th>
            <th style="width: 25%">측정치</th>
          </tr>
          </thead>
          <tr *ngFor="let inspectionItem of items.inspectionInfo; trackBy: trackByIdFn">
            <td>{{ inspectionItem.name }}</td>
            <td></td>
            <td></td>
            <td></td>
            <td>
              {{ inspectionItem.value }}
            </td>
          </tr>
        </table>
      </div>
    </main>
  `,
  styles: [`
    @page {
      size: A4;
    }

    .printArea {
      text-align: center;
      font-size: 15px;
      padding-top: 5%;
      padding-left: 10%;
      padding-right: 10%;
    }

    .printArea > * > table {
      border-collapse: collapse;
      border: 1px solid darkolivegreen;
      width: 100%;
      height: 100%;
    }

    .printArea > * > table > tr, td {
      border: 1px solid darkolivegreen;
    }

    .printArea > .test > table > thead > tr, th {
      border: 1px solid darkolivegreen;

    }
  `]
})
export class PurchasePrintTemplate extends SdPrintTemplateBase<any> {

  public items?: IInspectionReportVM;
  public logo = require("../assets/logo.png"); //tslint:disable-line:no-require-imports

  public trackByIdFn = (i: number, item: any) => item.id || item;

  public constructor() {
    super();
  }

  public async sdOnOpen(param: IInspectionReportVM): Promise<void> {
    this.items = Object.clone(param);
  }
}