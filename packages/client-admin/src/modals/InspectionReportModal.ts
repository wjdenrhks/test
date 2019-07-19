import {Component} from "@angular/core";
import {
  SdModalBase,
  SdOrmProvider,
  SdPrintProvider, SdToastProvider
} from "@simplism/angular";
import {DateOnly} from "@simplism/core";
import {PurchasePrintTemplate} from "../print-templates/PurchasePrintTemplate";
import {IShippingVM} from "../modules/shipment/ShippingRegisterPage";
import {MainDbContext} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";


@Component({
  selector: "app-inspection-report-modal",
  template: `
    <sd-dock-container *ngIf="items">
      <sd-pane class="printArea" style="min-width: 800px; min-height: 700px;">
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
                <sd-textfield [(value)]="items.testDate" [type]="'date'"></sd-textfield>
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
                <sd-textfield [(value)]="inspectionItem.value"></sd-textfield>
              </td>
            </tr>
          </table>
        </div>
      </sd-pane>
      <sd-dock [position]="'bottom'">
        <sd-button [type]="'submit'" [theme]="'primary'" (click)="onPrintButton()" [disabled]="!items.testDate">
          <sd-icon [icon]="'print'"></sd-icon>
          성적서 출력
        </sd-button>
      </sd-dock>
    </sd-dock-container>
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
export class InspectionReportModal extends SdModalBase<{ shippingItems: IShippingVM }, any> {

  public logo = require("../assets/logo.png"); //tslint:disable-line:no-require-imports

  public items?: IInspectionReportVM;
  public inspectionItem?: IInspectionInfoVM;

  public trackByIdFn = (i: number, item: any) => item.id || item;

  public constructor(private readonly _print: SdPrintProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _orm: SdOrmProvider) {
    super();
  }

  public async sdOnOpen(param: { shippingItems: IShippingVM }): Promise<void> {
    const result = param.shippingItems;
    const shippingDate = new DateOnly(result.shippingDate!.year, result.shippingDate!.month, result.shippingDate!.day);

    const lotList: any[] = [];

    //LotName별로 정렬
    param.shippingItems.shippingItemList = param.shippingItems.shippingItemList!.orderBy(item => item.lotName);

    param.shippingItems.shippingItemList.forEach((item, index) => {
      if (index !== 0 && !!param.shippingItems.shippingItemList![index - 1]) {

        const nowLot = item.lotName!.split("-");
        const prevLot = param.shippingItems.shippingItemList![index - 1].lotName!.split("-");

        //연속 된 LOT인 경우
        if ((nowLot[0] === prevLot[0] && (Number(nowLot[1]) - Number(prevLot[1]) === 1))) {
          const listSeq = lotList.length - 1;

          const isNotFirst = String(lotList[listSeq].lot).indexOf("~");
          const lastSeq = isNotFirst > -1 ?
            "~" + (String(lotList[listSeq].lot).split("~"))[1] : "";

          if (lastSeq === "") {
            lotList[listSeq].lot = lotList[listSeq].lot + "~" + nowLot[1];
          }
          else {
            const replaceSeq = "~" + nowLot[1];
            lotList[listSeq].lot = String(lotList[listSeq].lot).replace(lastSeq, replaceSeq);
          }
        }
        else {
          if (lotList.length < 3) {
            lotList.push({
              id: item.id,
              lot: item.lotName
            });
          }
        }
      }
      else {
        lotList.push({
          id: item.id,
          lot: item.lotName
        });
      }
    });

    const inspectionInfoList = await this._getInspectionInfo(result.goodId!, param.shippingItems.shippingItemList[0]!.lotId!);

    if (!inspectionInfoList || inspectionInfoList.length < 1) {
      this._toast.danger("해당 품목의 검사 항목이 지정되어 있지 않습니다.\n");
      this.close();
    }

    if (inspectionInfoList && inspectionInfoList.length > 0) {
      this.items = {
        shippingId: result.id,
        shippingDate,
        testDate: inspectionInfoList[0].testDate,
        goodId: result.goodId,
        goodName: result.goodName,
        barcode: lotList,
        inspectionInfo: inspectionInfoList
      };
    }
  }

  public async onPrintButton(): Promise<void> {
    await this._print.print(PurchasePrintTemplate, this.items);
  }

  private async _getInspectionInfo(goodId: number, lotId: number): Promise<any> {
    let result: any[] = [];

    await this._orm.connectAsync(MainDbContext, async db => {
      // 품목 별 검사정보
      result = await db.goodsInspection
        .where(item => [
          sorm.equal(item.goodsId, goodId)
        ])
        .include(item => item.inspection)
        .select(item => ({
          id: item.inspectionId,
          name: item.inspection!.name,
          testType: item.testType,
          unit: item.unit,
          specification: item.specification
        }))
        .orderBy(item => item.id, false)
        .limit(0, 10)
        .resultAsync();

      //첫번째 LOT의 검사 결과 값
      const goodInspectionInfo = await db.quantityCheckInspectionItem
        .where(item => [
          sorm.equal(item.lotId, lotId)
        ])
        .include(item => item.inspectionInfo)
        .include(item => item.inspectionInfo![0].inspection)
        .select(item => ({
          inspectionId: item.inspectionInfo![0].inspectionId,
          testDate: item.testDate,
          inspectionValue: item.inspectionInfo![0].inspectionValue
        }))
        .orderBy(item => item.inspectionId, false)
        .resultAsync();

      if (result) {
        result.forEach(item => {
          item.value = goodInspectionInfo.filter(item1 => item1.inspectionId === item.id).length > 0
            ? goodInspectionInfo.filter(item1 => item1.inspectionId === item.id)[0].inspectionValue : undefined;
          item.testDate = goodInspectionInfo.filter(item1 => item1.inspectionId === item.id).length > 0
            ? goodInspectionInfo.filter(item1 => item1.inspectionId === item.id)[0].testDate : undefined;
        });
      }
    });
    return result;
  }
}

export interface IInspectionReportVM {
  shippingId: number | undefined;
  shippingDate: DateOnly | undefined;
  testDate: DateOnly | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  barcode: ILotListVM[] | undefined;
  inspectionInfo: IInspectionInfoVM[] | undefined;
}

export interface IInspectionInfoVM {
  name: string | undefined;
  testDate: DateOnly | undefined;
  testType: string | undefined;
  unit: string | undefined;
  specification: string | undefined;
  value: number | string | undefined;
}

interface ILotListVM {
  id: number | undefined;
  lot: string | undefined;
}