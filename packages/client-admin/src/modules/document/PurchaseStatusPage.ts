import {ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnInit} from "@angular/core";
import {SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {DateOnly} from "@simplism/core";
import {GoodsIssue, MainDbContext} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {ExcelWorkbook} from "@simplism/excel";

@Component({
  selector: "app-purchase-status",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>발주 현황</h4>

          <sd-topbar-menu (click)="onSaveButtonClick()">
            <sd-icon [icon]="'save'" [fixedWidth]="true"></sd-icon>
            저장
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onDownloadButtonClick()" *ngIf="items">
            <sd-icon [icon]="'download'" [fixedWidth]="true"></sd-icon>
            다운로드
          </sd-topbar-menu>
        </sd-topbar>

        <sd-dock-container>
          <sd-dock class="sd-padding-sm-default sd-background-grey-lightest">
            <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
              <sd-form-item [label]="'년'">
                <sd-select [(value)]="filter.year">
                  <sd-select-item *ngFor="let year of yearList; trackBy: trackByMeFn"
                                  [value]="year">
                    {{ year }}
                  </sd-select-item>
                </sd-select>
              </sd-form-item>
              <sd-form-item [label]="'월'">
                <sd-select [(value)]="filter.month">
                  <sd-select-item *ngFor="let month of monthList; trackBy: trackByMeFn"
                                  [value]="month">
                    {{ month }}
                  </sd-select-item>
                </sd-select>
              </sd-form-item>
              <sd-form-item>
                <sd-button [type]="'submit'" [theme]="'primary'">
                  <sd-icon [icon]="'search'" [fixedWidth]="true"></sd-icon>
                  조회
                </sd-button>
              </sd-form-item>
            </sd-form>
          </sd-dock>

          <sd-busy-container [busy]="mainBusyCount > 0">
            <sd-dock-container>
              <sd-dock class="sd-background-white sd-padding-sm-default" *ngIf="items">
                <div style="padding-left: 10px; padding-top: 10px; padding-bottom: 10px; font-size: 15pt;"> 발주현황</div>
                <table class="_test">
                  <thead>
                  <tr>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 40%" [colSpan]="4"> 발주현황</th>
                    <th class="sd-padding-sm-xs"
                        style="text-align: center; width: 10%;"
                        *ngIf="lastFilter!.month < 10"> {{ '0' + lastFilter!.month + '/01 ~ ' + '0' + lastFilter!.month + '/' + lastFilter.lastDay }}</th>
                    <th class="sd-padding-sm-xs"
                        style="text-align: center; width: 10%;"
                        *ngIf="lastFilter!.month >= 10"> {{ lastFilter!.month + '/01 ~ ' + lastFilter!.month + '/' + lastFilter.lastDay }}</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 30%" [colSpan]="3"> 실적율</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 20%" [colSpan]="2"> 출고유형</th>
                  </tr>
                  <tr>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 10%;"> 주차</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 10%;"> 계획수량</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 10%;"> 확정수량</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 10%;"> 예상수량</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 10%;"> 출고 누적수량</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 10%;">실적율</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 10%;">계획대비 추가수량</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 10%;">계획대비 추가 발주율</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 10%;">재고 출고</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 10%;">생산품 출고</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr *ngFor="let item of items.purchaseInfo; trackBy: trackByMeFn">
                    <td class="sd-padding-xs-sm" *ngIf="!!item.week"> {{ item.week + '주차'}}</td>
                    <td class="sd-padding-xs-sm" *ngIf="!item.week">합계</td>
                    <td class="sd-padding-xs-sm"> {{ item.planQuantity | number }}</td>
                    <td class="sd-padding-xs-sm"> {{ item.confirmationQuantity | number }}</td>
                    <td class="sd-padding-xs-sm"> {{ item.predictionQuantity | number }}</td>
                    <td class="sd-padding-xs-sm"> {{ item.shippingQuantity | number }}</td>
                    <td class="sd-padding-xs-sm"> {{ item.performanceRatio | number }}</td>
                    <td class="sd-padding-xs-sm"> {{ item.additionalQuantity | number }}</td>
                    <td class="sd-padding-xs-sm"> {{ item.additionalPercent | number }}</td>
                    <td class="sd-padding-xs-sm"> {{ item.stockQuantity | number }}</td>
                    <td class="sd-padding-xs-sm"> {{ item.productionQuantity | number }}</td>
                  </tr>
                  </tbody>
                </table>

                <div style="padding-left: 10px; padding-top: 15px; padding-bottom: 10px; font-size: 15pt;"> 납기준수율</div>
                <table class="_test">
                  <thead>
                  <tr>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 5%;"> 주차</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 7%;"> 발주수량</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 5%;"> 출하일</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 7%;"> 출하수량</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 7%;"> 납기경과일<br>(평균)</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 7%;"> 납기준수율<br>(1일=1%)</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 7%;">미납수량<br>(합계)</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 7%;">미납율<br>(평균)</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 24%;">미납사유</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 24%;">비고</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr *ngFor="let item of items.paymentPeriod; trackBy: trackByMeFn">
                    <td class="sd-padding-xs-sm" *ngIf="!!item.week"> {{ item.week + '주차'}}</td>
                    <td class="sd-padding-xs-sm" *ngIf="!item.week">합계</td>
                    <td class="sd-padding-xs-sm"> {{ item.purchaseQuantity | number }}</td>
                    <td class="sd-padding-xs-sm"> {{ item.purchaseQuantity | number }}</td>
                    <td class="sd-padding-xs-sm"> {{ item.shippingQuantity | number }}</td>
                    <td class="sd-padding-xs-sm"> {{ item.elapseDate | number }}</td>
                    <td class="sd-padding-xs-sm"> {{ item.complianceRate | number }}</td>
                    <td class="sd-padding-xs-sm"> {{ item.unpaidQuantity | number }}</td>
                    <td class="sd-padding-xs-sm"> {{ item.rateOfUnpaidRate | number }}</td>
                    <td>
                      <sd-textfield [(value)]="item.reason"></sd-textfield>
                    </td>
                    <td>
                      <sd-textfield [(value)]="item.remark"></sd-textfield>
                    </td>

                  </tr>
                  </tbody>
                </table>

                <div style="padding-left: 10px; padding-top: 15px; padding-bottom: 10px; font-size: 15pt;"> 내수수출품</div>
                <table class="_test">
                  <thead>
                  <tr>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 10%;"> 주차</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 20%;">계획수량</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 20%;">실적수량</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 20%;">내수수량</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 20%;">수출수량</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 10%;">비율(%)</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr *ngFor="let item of items.exportInfo; trackBy: trackByMeFn">
                    <td class="sd-padding-xs-sm" *ngIf="!!item.week"> {{ item.week + '주차'}}</td>
                    <td class="sd-padding-xs-sm" *ngIf="!item.week">합계</td>
                    <td class="sd-padding-xs-sm"> {{ item.planQuantity | number }}</td>
                    <td class="sd-padding-xs-sm"> {{ item.shippingQuantity | number }}</td>
                    <td class="sd-padding-xs-sm"> {{ item.inQuantity | number }}</td>
                    <td class="sd-padding-xs-sm"> {{ item.exportQuantity | number }}</td>
                    <td class="sd-padding-xs-sm"> {{ item.percent | number }}</td>
                  </tr>
                  </tbody>
                </table>
              </sd-dock>

            </sd-dock-container>
          </sd-busy-container>
        </sd-dock-container>
      </sd-topbar-container>
    </sd-busy-container>`,
  styles: [/* language=SCSS */ `
    ._test {
      border-collapse: collapse;
      border: 1px solid darkolivegreen;
      text-align: center;
      width: 100%;
      height: 100%;
    }

    thead {
      background: #EEEEEE;
    }

    th, td {
      border: 1px solid darkolivegreen;
      height: 40px;
      text-align: center;
    }
  `]
})
export class PurchaseStatusPage implements OnInit {

  public filter: IFilterVM = {
    year: undefined,
    month: undefined,
    lastDay: undefined
  };

  public lastFilter?: IFilterVM;

  public items?: IPurchaseStatusVM;

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public yearList = [] as number[];
  public monthList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _cdr: ChangeDetectorRef) {
  }

  public async ngOnInit(): Promise<void> {
    this.filter.year = new DateOnly().year;
    this.filter.month = new DateOnly().month;

    for (let i = 2018; i <= this.filter.year + 1; i++) {
      this.yearList.push(i);
    }
    this.mainBusyCount++;

    await this.onSearchFormSubmit();
    this.mainBusyCount--;

    this._cdr.markForCheck();
  }

  public async onDownloadButtonClick(): Promise<void> {
    await this._download();
    this._cdr.markForCheck();
  }

  private async _download(): Promise<void> {
    this.viewBusyCount++;
    try {

      if (!this.lastFilter!.year || !this.lastFilter!.month || !this.lastFilter!.lastDay) {
        this._toast.danger("검색기간을 정확히 입력해 주세요.");
        return;
      }

      const year = this.lastFilter!.year;
      const month = this.lastFilter!.month;
      const lastDay = this.lastFilter!.lastDay;

      const formatDate = (new DateOnly(Number(year), Number(month) + 1, 0)).toFormatString("yyyy-MM");

      const headerStyle = {
        alignH: "center",
        background: "CCCCCCCC",
        foreground: "FFFFFFFF",
        bold: true
      };

      let formatDate2;
      month! < 10 ? formatDate2 = '0' + month + '/01 ~ ' + '0' + month + '/' + lastDay
        : formatDate2 = month + '/01 ~ ' + month + '/' + lastDay;

      const wb = ExcelWorkbook.create();
      const ws = wb.createWorksheet(`발주 현황`);
      ws.cell(0, 0).merge(0, 9);
      ws.cell(0, 0).value = "발주 현황";
      ws.cell(1, 0).merge(1, 3);
      ws.cell(1, 0).value = "발주 현황";
      Object.assign(ws.cell(1, 0).style, headerStyle);
      ws.cell(1, 4).value = formatDate2;
      Object.assign(ws.cell(1, 4).style, headerStyle);
      ws.cell(1, 5).merge(1, 7);
      ws.cell(1, 5).value = "실적율";
      Object.assign(ws.cell(1, 5).style, headerStyle);
      ws.cell(1, 8).merge(1, 9);
      ws.cell(1, 8).value = "출고유형";
      Object.assign(ws.cell(1, 8).style, headerStyle);
      ws.cell(2, 0).value = "주차";
      ws.cell(2, 1).value = "계획수량";
      ws.cell(2, 2).value = "확정수량";
      ws.cell(2, 3).value = "예상수량";
      ws.cell(2, 4).value = "출고 누적수량";
      ws.cell(2, 5).value = "실적율";
      ws.cell(2, 6).value = "계획대비 추가수량";
      ws.cell(2, 7).value = "계획대비 추가 발주율";
      ws.cell(2, 8).value = "재고 출고";
      ws.cell(2, 9).value = "생산품 출고";
      for (let i = 0; i <= 9; i++) {
        Object.assign(ws.cell(2, i).style, headerStyle);
      }

      let purchaseInfoLength = this.items!.purchaseInfo!.length;
      let purchaseInfoSeq = 0;
      for (const nowScrapItem of this.items!.purchaseInfo || []) {
        nowScrapItem.week === undefined ? ws.cell(3 + purchaseInfoSeq, 0).value = "합계"
          : ws.cell(3 + purchaseInfoSeq, 0).value = nowScrapItem.week + "주차";
        nowScrapItem.planQuantity === Infinity ? ws.cell(3 + purchaseInfoSeq, 1).value = "∞"
          : isNaN(nowScrapItem.planQuantity!) ? ws.cell(3 + purchaseInfoSeq, 1).value = undefined
          : ws.cell(3 + purchaseInfoSeq, 1).value = nowScrapItem.planQuantity;
        nowScrapItem.confirmationQuantity === Infinity ? ws.cell(3 + purchaseInfoSeq, 2).value = "∞"
          : isNaN(nowScrapItem.confirmationQuantity!) ? ws.cell(3 + purchaseInfoSeq, 2).value = undefined
          : ws.cell(3 + purchaseInfoSeq, 2).value = nowScrapItem.confirmationQuantity;
        nowScrapItem.predictionQuantity === Infinity ? ws.cell(3 + purchaseInfoSeq, 3).value = "∞"
          : isNaN(nowScrapItem.predictionQuantity!) ? ws.cell(3 + purchaseInfoSeq, 3).value = undefined
          : ws.cell(3 + purchaseInfoSeq, 3).value = nowScrapItem.predictionQuantity;
        nowScrapItem.shippingQuantity === Infinity ? ws.cell(3 + purchaseInfoSeq, 4).value = "∞"
          : isNaN(nowScrapItem.shippingQuantity!) ? ws.cell(3 + purchaseInfoSeq, 4).value = undefined
          : ws.cell(3 + purchaseInfoSeq, 4).value = nowScrapItem.shippingQuantity;
        nowScrapItem.performanceRatio === Infinity ? ws.cell(3 + purchaseInfoSeq, 5).value = "∞"
          : isNaN(nowScrapItem.performanceRatio!) ? ws.cell(3 + purchaseInfoSeq, 5).value = undefined
          : ws.cell(3 + purchaseInfoSeq, 5).value = nowScrapItem.performanceRatio;
        nowScrapItem.additionalQuantity === Infinity ? ws.cell(3 + purchaseInfoSeq, 6).value = "∞"
          : isNaN(nowScrapItem.additionalQuantity!) ? ws.cell(3 + purchaseInfoSeq, 6).value = undefined
          : ws.cell(3 + purchaseInfoSeq, 6).value = nowScrapItem.additionalQuantity;
        nowScrapItem.additionalPercent === Infinity ? ws.cell(3 + purchaseInfoSeq, 7).value = "∞"
          : isNaN(nowScrapItem.additionalPercent!) ? ws.cell(3 + purchaseInfoSeq, 7).value = undefined
          : ws.cell(3 + purchaseInfoSeq, 7).value = nowScrapItem.additionalPercent;
        nowScrapItem.stockQuantity === Infinity ? ws.cell(3 + purchaseInfoSeq, 8).value = "∞"
          : isNaN(nowScrapItem.stockQuantity!) ? ws.cell(3 + purchaseInfoSeq, 8).value = undefined
          : ws.cell(3 + purchaseInfoSeq, 8).value = nowScrapItem.stockQuantity;
        nowScrapItem.productionQuantity === Infinity ? ws.cell(3 + purchaseInfoSeq, 9).value = "∞"
          : isNaN(nowScrapItem.productionQuantity!) ? ws.cell(3 + purchaseInfoSeq, 9).value = undefined
          : ws.cell(3 + purchaseInfoSeq, 9).value = nowScrapItem.productionQuantity;
        purchaseInfoSeq++;
      }

      ws.cell(3 + purchaseInfoLength, 0).merge(3 + purchaseInfoLength, 9);
      ws.cell(3 + purchaseInfoLength, 0).value = "납기준수율";
      ws.cell(4 + purchaseInfoLength, 0).value = "주차";
      ws.cell(4 + purchaseInfoLength, 1).value = "발주수량";
      ws.cell(4 + purchaseInfoLength, 2).value = "출하일";
      ws.cell(4 + purchaseInfoLength, 3).value = "출하수량";
      ws.cell(4 + purchaseInfoLength, 4).value = "납기경과일(평균)";
      ws.cell(4 + purchaseInfoLength, 5).value = "납기준수율(1일=1%)";
      ws.cell(4 + purchaseInfoLength, 6).value = "미납수량(합계)";
      ws.cell(4 + purchaseInfoLength, 7).value = "미납율(평균)";
      ws.cell(4 + purchaseInfoLength, 8).value = "미납사유";
      ws.cell(4 + purchaseInfoLength, 9).value = "비고";
      for (let i = 0; i <= 9; i++) {
        Object.assign(ws.cell(4 + purchaseInfoLength, i).style, headerStyle);
      }

      let paymentPeriodLength = this.items!.paymentPeriod!.length;
      let paymentPeriodSeq = 0;
      for (const nowScrapItem of this.items!.paymentPeriod || []) {
        nowScrapItem.week === undefined ? ws.cell(5 + purchaseInfoLength + paymentPeriodSeq, 0).value = "합계"
          : ws.cell(5 + purchaseInfoLength + paymentPeriodSeq, 0).value = nowScrapItem.week + "주차";
        nowScrapItem.purchaseQuantity === Infinity ? ws.cell(5 + purchaseInfoLength + paymentPeriodSeq, 1).value = "∞"
          : isNaN(nowScrapItem.purchaseQuantity!) ? ws.cell(5 + purchaseInfoLength + paymentPeriodSeq, 1).value = undefined
          : ws.cell(5 + purchaseInfoLength + paymentPeriodSeq, 1).value = nowScrapItem.purchaseQuantity;
        nowScrapItem.purchaseQuantity === Infinity ? ws.cell(5 + purchaseInfoLength + paymentPeriodSeq, 2).value = "∞"
          : isNaN(nowScrapItem.purchaseQuantity!) ? ws.cell(5 + purchaseInfoLength + paymentPeriodSeq, 2).value = undefined
          : ws.cell(5 + purchaseInfoLength + paymentPeriodSeq, 2).value = nowScrapItem.purchaseQuantity;
        nowScrapItem.shippingQuantity === Infinity ? ws.cell(5 + purchaseInfoLength + paymentPeriodSeq, 3).value = "∞"
          : isNaN(nowScrapItem.shippingQuantity!) ? ws.cell(5 + purchaseInfoLength + paymentPeriodSeq, 3).value = undefined
          : ws.cell(5 + purchaseInfoLength + paymentPeriodSeq, 3).value = nowScrapItem.shippingQuantity;
        nowScrapItem.elapseDate === Infinity ? ws.cell(5 + purchaseInfoLength + paymentPeriodSeq, 4).value = "∞"
          : isNaN(nowScrapItem.elapseDate!) ? ws.cell(5 + purchaseInfoLength + paymentPeriodSeq, 4).value = undefined
          : ws.cell(5 + purchaseInfoLength + paymentPeriodSeq, 4).value = nowScrapItem.elapseDate;
        nowScrapItem.complianceRate === Infinity ? ws.cell(5 + purchaseInfoLength + paymentPeriodSeq, 5).value = "∞"
          : isNaN(nowScrapItem.complianceRate!) ? ws.cell(5 + purchaseInfoLength + paymentPeriodSeq, 5).value = undefined
          : ws.cell(5 + purchaseInfoLength + paymentPeriodSeq, 5).value = nowScrapItem.complianceRate;
        nowScrapItem.unpaidQuantity === Infinity ? ws.cell(5 + purchaseInfoLength + paymentPeriodSeq, 6).value = "∞"
          : isNaN(nowScrapItem.unpaidQuantity!) ? ws.cell(5 + purchaseInfoLength + paymentPeriodSeq, 6).value = undefined
          : ws.cell(5 + purchaseInfoLength + paymentPeriodSeq, 6).value = nowScrapItem.unpaidQuantity;
        nowScrapItem.rateOfUnpaidRate === Infinity ? ws.cell(5 + purchaseInfoLength + paymentPeriodSeq, 7).value = "∞"
          : isNaN(nowScrapItem.rateOfUnpaidRate!) ? ws.cell(5 + purchaseInfoLength + paymentPeriodSeq, 7).value = undefined
          : ws.cell(5 + purchaseInfoLength + paymentPeriodSeq, 7).value = nowScrapItem.rateOfUnpaidRate;
        ws.cell(5 + purchaseInfoLength + paymentPeriodSeq, 8).value = nowScrapItem.reason;
        ws.cell(5 + purchaseInfoLength + paymentPeriodSeq, 9).value = nowScrapItem.remark;
        paymentPeriodSeq++;
      }

      ws.cell(5 + purchaseInfoLength + paymentPeriodLength, 0).merge(5 + purchaseInfoLength + paymentPeriodLength, 9);
      ws.cell(5 + purchaseInfoLength + paymentPeriodLength, 0).value = "내수수출품";
      ws.cell(6 + purchaseInfoLength + paymentPeriodLength, 0).value = "주차";
      ws.cell(6 + purchaseInfoLength + paymentPeriodLength, 1).merge(6 + purchaseInfoLength + paymentPeriodLength, 2);
      ws.cell(6 + purchaseInfoLength + paymentPeriodLength, 1).value = "계획수량";
      ws.cell(6 + purchaseInfoLength + paymentPeriodLength, 3).merge(6 + purchaseInfoLength + paymentPeriodLength, 4);
      ws.cell(6 + purchaseInfoLength + paymentPeriodLength, 3).value = "실적수량";
      ws.cell(6 + purchaseInfoLength + paymentPeriodLength, 5).merge(6 + purchaseInfoLength + paymentPeriodLength, 6);
      ws.cell(6 + purchaseInfoLength + paymentPeriodLength, 5).value = "내수수량";
      ws.cell(6 + purchaseInfoLength + paymentPeriodLength, 7).merge(6 + purchaseInfoLength + paymentPeriodLength, 8);
      ws.cell(6 + purchaseInfoLength + paymentPeriodLength, 7).value = "수출수량";
      ws.cell(6 + purchaseInfoLength + paymentPeriodLength, 9).value = "비율";
      for (let i = 1; i <= 10; i += 2) {
        if (i === 1) {
          Object.assign(ws.cell(6 + purchaseInfoLength + paymentPeriodLength, 0).style, headerStyle);
        }
        Object.assign(ws.cell(6 + purchaseInfoLength + paymentPeriodLength, i).style, headerStyle);
      }

      let exportInfoSeq = 0;
      for (const nowScrapItem of this.items!.exportInfo || []) {
        nowScrapItem.week === undefined ? ws.cell(7 + purchaseInfoLength + paymentPeriodLength + exportInfoSeq, 0).value = "합계"
          : ws.cell(7 + purchaseInfoLength + paymentPeriodLength + exportInfoSeq, 0).value = nowScrapItem.week + "주차";
        ws.cell(7 + purchaseInfoLength + paymentPeriodLength + exportInfoSeq, 1).merge(7 + purchaseInfoLength + paymentPeriodLength + exportInfoSeq, 2);
        nowScrapItem.planQuantity === Infinity ? ws.cell(7 + purchaseInfoLength + paymentPeriodLength + exportInfoSeq, 1).value = "∞"
          : isNaN(nowScrapItem.planQuantity!) ? ws.cell(7 + purchaseInfoLength + paymentPeriodLength + exportInfoSeq, 1).value = undefined
          : ws.cell(7 + purchaseInfoLength + paymentPeriodLength + exportInfoSeq, 1).value = nowScrapItem.planQuantity;
        ws.cell(7 + purchaseInfoLength + paymentPeriodLength + exportInfoSeq, 3).merge(7 + purchaseInfoLength + paymentPeriodLength + exportInfoSeq, 4);
        nowScrapItem.shippingQuantity === Infinity ? ws.cell(7 + purchaseInfoLength + paymentPeriodLength + exportInfoSeq, 3).value = "∞"
          : isNaN(nowScrapItem.shippingQuantity!) ? ws.cell(7 + purchaseInfoLength + paymentPeriodLength + exportInfoSeq, 3).value = undefined
          : ws.cell(7 + purchaseInfoLength + paymentPeriodLength + exportInfoSeq, 3).value = nowScrapItem.shippingQuantity;
        ws.cell(7 + purchaseInfoLength + paymentPeriodLength + exportInfoSeq, 5).merge(7 + purchaseInfoLength + paymentPeriodLength + exportInfoSeq, 6);
        nowScrapItem.inQuantity === Infinity ? ws.cell(7 + purchaseInfoLength + paymentPeriodLength + exportInfoSeq, 5).value = "∞"
          : isNaN(nowScrapItem.inQuantity!) ? ws.cell(7 + purchaseInfoLength + paymentPeriodLength + exportInfoSeq, 5).value = undefined
          : ws.cell(7 + purchaseInfoLength + paymentPeriodLength + exportInfoSeq, 5).value = nowScrapItem.inQuantity;
        ws.cell(7 + purchaseInfoLength + paymentPeriodLength + exportInfoSeq, 7).merge(7 + purchaseInfoLength + paymentPeriodLength + exportInfoSeq, 8);
        nowScrapItem.exportQuantity === Infinity ? ws.cell(7 + purchaseInfoLength + paymentPeriodLength + exportInfoSeq, 7).value = "∞"
          : isNaN(nowScrapItem.exportQuantity!) ? ws.cell(7 + purchaseInfoLength + paymentPeriodLength + exportInfoSeq, 7).value = undefined
          : ws.cell(7 + purchaseInfoLength + paymentPeriodLength + exportInfoSeq, 7).value = nowScrapItem.exportQuantity;
        nowScrapItem.percent === Infinity ? ws.cell(7 + purchaseInfoLength + paymentPeriodLength + exportInfoSeq, 9).value = "∞"
          : isNaN(nowScrapItem.percent!) ? ws.cell(7 + purchaseInfoLength + paymentPeriodLength + exportInfoSeq, 9).value = undefined
          : ws.cell(7 + purchaseInfoLength + paymentPeriodLength + exportInfoSeq, 9).value = nowScrapItem.percent;
        exportInfoSeq++;
      }

      const title = "발주 현황(" + formatDate + ").xlsx";
      await wb.downloadAsync(title);

    }

    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.viewBusyCount--;
  }

  @HostListener("document:keydown", ["$event"])
  public async onDocumentKeydown(event: KeyboardEvent): Promise<void> {
    if ((event.key === "s" || event.key === "S") && event.ctrlKey) {
      event.preventDefault();
      await this._save();
      this._cdr.markForCheck();
    }
  }

  public async onSaveButtonClick(): Promise<void> {
    await this._save();
    this._cdr.markForCheck();
  }

  private async _save(): Promise<void> {

    this.viewBusyCount++;

    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        if (this.items!.paymentPeriod) {
          await db.goodsIssueReport.where(item1 => [sorm.equal(item1.year, this.lastFilter!.year!), sorm.equal(item1.month, this.lastFilter!.month!)]).deleteAsync();
          for (const item of this.items!.paymentPeriod || []) {
            if (item.reason || item.remark) {
              await db.goodsIssueReport
                .insertAsync({
                  companyId: 1,
                  year: this.lastFilter!.year!,
                  month: this.lastFilter!.month!,
                  week: item.week!,
                  noPaymentRemark: item.reason,
                  remark: item.remark
                });
            }
          }
        }
      });

      this._toast.success("저장되었습니다.");
      await this.onSearchFormSubmit();
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.viewBusyCount--;
  }

  public async onSearchFormSubmit(): Promise<void> {
    this.lastFilter = Object.clone(this.filter);
    await this._search();
    this._cdr.markForCheck();
  }

  private async _search(): Promise<void> {
    if (!this.lastFilter) return;

    this.mainBusyCount++;
    try {
      await this._orm.connectAsync(MainDbContext, async db => {

          const lastDay = (new Date(Number(this.lastFilter!.year), Number(this.lastFilter!.month), 0)).getDate();

          this.lastFilter!.lastDay = lastDay;

          const firstDate = new DateOnly(this.lastFilter!.year!, this.lastFilter!.month!, 1);
          const lastDate = new DateOnly(this.lastFilter!.year!, this.lastFilter!.month!, lastDay!);

          // 먼저 해당 월에 총 몇 주 까지 있는지부터 구함
          const lastWeek = ((await db.executeAsync([`SELECT (DATEPART(week, CAST('${lastDate}' AS DATETIME))) -
       (DatePart(week, Cast(Left('${lastDate}', 7) + '-01' as DATETIME))) + 1 AS week`]))[0])[0].week;

          let testList: any;

          const purchaseInfo = await db.goodsIssuePlan
            .where(item => [
              sorm.equal(item.planYear, this.lastFilter!.year),
              sorm.equal(item.planMonth, this.lastFilter!.month),
              sorm.or([
                sorm.equal(item.planType, "확정"),
                sorm.equal(item.planType, "예상")
              ]),
              sorm.equal(item.isDisabled, false)
            ])
            .groupBy(item => [
              sorm.query(`(DATEPART(week, CAST([TBL].planDate AS DATETIME))) -
         (DatePart(week, Cast(Left([TBL].planDate, 7) + '-01' as DateTime))) + 1`, Number),
              item.planType
            ])
            .select(item => ({
              week: sorm.query(`(DATEPART(week, CAST([TBL].planDate AS DATETIME))) -
         (DatePart(week, Cast(Left([TBL].planDate, 7) + '-01' as DateTime))) + 1`, Number),
              planType: item.planType,
              planQuantity: sorm.sum(sorm.ifNull(item.planQuantity, 0)),
              productionQuantity: sorm.sum(sorm.ifNull(item.productionQuantity, 0)),
              stockQuantity: sorm.sum(sorm.ifNull(item.stockQuantity, 0))
            }))
            .resultAsync();

          const shippingInfo = await db.goodsIssueGoods
            .include(item => item.goodsIssue)
            .include(item => item.goodsIssue!.partner)
            .where(item => [
              sorm.between(sorm.cast(item.createdAtDateTime, DateOnly), firstDate, lastDate),
              sorm.equal(item.isDisabled, false)
            ])
            .groupBy(item => [
              sorm.query(`(DATEPART(week, CAST([TBL].createdAtDateTime AS DATETIME))) -
         (DatePart(week, Cast(Left([TBL].createdAtDateTime, 7) + '-01' as DateTime))) + 1`, Number),
              item.goodsIssue!.partner!.isExport
            ])
            .select(item => ({
              week: sorm.query(`(DATEPART(week, CAST([TBL].createdAtDateTime AS DATETIME))) -
         (DatePart(week, Cast(Left([TBL].createdAtDateTime, 7) + '-01' as DateTime))) + 1`, Number),
              isExport: item.goodsIssue!.partner!.isExport,
              quantity: sorm.sum(sorm.ifNull(item.quantity, 0))
            }))
            .resultAsync();

          const paymentPeriodInfo = await db.goodsIssuePlan
            .where(item => [
              sorm.equal(item.planYear, this.lastFilter!.year),
              sorm.equal(item.planMonth, this.lastFilter!.month),
              sorm.or([
                sorm.equal(item.planType, "확정"),
                sorm.equal(item.planType, "예상")
              ]),
              sorm.equal(item.isDisabled, false)
            ])
            .join(
              GoodsIssue,
              "goodsIssueInfo",
              (qb, en) => qb
                .where(item => [
                  sorm.equal(item.issuePlanId, en.id),
                  sorm.equal(item.isDisabled, false)
                ])
                .select(item => ({
                  id: item.id,
                  issueDate: item.issueDate,
                  quantity: item.issueQuantity
                })),
              true
            )
            .groupBy(item => [
              sorm.query(`(DATEPART(week, CAST([TBL].planDate AS DATETIME))) -
         (DatePart(week, Cast(Left([TBL].planDate, 7) + '-01' as DateTime))) + 1`, Number),
              sorm.query(`DATEDIFF(dd, [TBL].[planDate], [goodsIssueInfo].[issueDate])`, Number),
              item.planDate,
              item.goodsIssueInfo!.id,
              item.goodsIssueInfo!.issueDate
            ])
            .select(item => ({
              week: sorm.query(`(DATEPART(week, CAST([TBL].planDate AS DATETIME))) -
         (DatePart(week, Cast(Left([TBL].planDate, 7) + '-01' as DateTime))) + 1`, Number),
              elapseDate: sorm.query(`DATEDIFF(dd, [TBL].[planDate], [goodsIssueInfo].[issueDate])`, Number),
              planDate: item.planDate,
              planQuantity: sorm.sum(sorm.ifNull(item.planQuantity, 0)),
              issueDate: item.goodsIssueInfo!.issueDate,
              issueQuantity: sorm.sum(sorm.ifNull(item.goodsIssueInfo!.quantity, 0))
            }))
            .resultAsync();

          testList = {
            purchaseInfo: [],
            exportInfo: [],
            paymentPeriod: []
          };

          const goodsIssueReaonInfo = await this._getGoodsIssueReason();

          for (let seq = 1; seq <= lastWeek + 1; seq++) {
            if (seq <= lastWeek) {
              const shippingItem = shippingInfo.some(item => item.week === seq) ? shippingInfo.filter(item => item.week === seq).sum(item => item.quantity || 0) : 0;

              if (!purchaseInfo.some(item => item.week === seq)) {
                testList.purchaseInfo.push({
                  week: seq,
                  planQuantity: 0,
                  confirmationQuantity: 0,
                  predictionQuantity: 0,
                  shippingQuantity: shippingItem,
                  performanceRatio: 0,
                  additionalQuantity: shippingItem,
                  additionalPercent: 0,
                  productionQuantity: 0,
                  stockQuantity: 0
                });
              }
              else {
                const selectedItem = purchaseInfo.filter(item => item.week === seq);
                const shippingItemQuantity = shippingItem || 0;

                testList.purchaseInfo.push({
                  week: seq,
                  planQuantity: selectedItem.sum(item => item.planQuantity || 0),
                  confirmationQuantity: selectedItem.filter(item => item.planType === "확정").sum(item => item.planQuantity || 0) || 0,
                  predictionQuantity: selectedItem.filter(item => item.planType === "예상").sum(item => item.planQuantity || 0) || 0,
                  shippingQuantity: shippingItemQuantity,
                  performanceRatio: isNaN(shippingItemQuantity / (selectedItem.sum(item => item.planQuantity || 0) || 0)) ? 0 : (shippingItemQuantity / (selectedItem.sum(item => item.planQuantity || 0) || 0)) * 100,
                  additionalQuantity: shippingItemQuantity - (selectedItem.sum(item => item.planQuantity || 0) || 0),
                  additionalPercent: 0,
                  productionQuantity: selectedItem.sum(item => item.productionQuantity || 0),
                  stockQuantity: selectedItem.sum(item => item.stockQuantity || 0)
                });
              }

              const shippingInQuantity = shippingInfo.some(item => item.week === seq && item.isExport === false) ? shippingInfo.filter(item => item.week === seq && item.isExport === false).sum(item => item.quantity || 0) : 0;
              const shippingExportQuantity = shippingInfo.some(item => item.week === seq && item.isExport === true) ? shippingInfo.filter(item => item.week === seq && item.isExport === true).sum(item => item.quantity || 0) : 0;
              testList.exportInfo.push({
                week: seq,
                planQuantity: purchaseInfo.filter(item => item.week === seq).sum(item => item.planQuantity || 0) || 0,
                shippingQuantity: shippingItem,
                inQuantity: shippingInQuantity,
                exportQuantity: shippingExportQuantity,
                percent: isNaN(shippingExportQuantity! / shippingInQuantity!) ? 0 : (shippingExportQuantity! / shippingInQuantity!) * 100
              });

              const purchaseQuantity = paymentPeriodInfo.filter(item => item.week === seq).sum(item => item.planQuantity || 0) || 0;
              const shippingQuantity = paymentPeriodInfo.filter(item => item.week === seq).sum(item => item.issueQuantity || 0) || 0;

              const totalElapseDate = isNaN((paymentPeriodInfo.filter(item => item.week === seq).sum(item => item.elapseDate || 0) || 0) / (paymentPeriodInfo.filter(item => item.week === seq).length || 0))
                ? 0 : (paymentPeriodInfo.filter(item => item.week === seq).sum(item => item.elapseDate || 0) || 0) / (paymentPeriodInfo.filter(item => item.week === seq).length || 0);


              testList.paymentPeriod.push({
                week: seq,
                purchaseQuantity,
                shippingQuantity,
                elapseDate: totalElapseDate,
                complianceRate: shippingExportQuantity,
                unpaidQuantity: shippingQuantity - purchaseQuantity,
                rateOfUnpaidRate: isNaN(shippingQuantity! / purchaseQuantity!) ? 0 : (shippingQuantity! / purchaseQuantity!) * 100,
                reason: goodsIssueReaonInfo.some(item => item.week === seq) ? goodsIssueReaonInfo.filter(item => item.week === seq)[0].reason : undefined,
                remark: goodsIssueReaonInfo.some(item => item.week === seq) ? goodsIssueReaonInfo.filter(item => item.week === seq)[0].remark : undefined
              });
            }
            //합계
            else {
              const shippingItemQuantity = shippingInfo.sum(item => item.quantity || 0) || 0;

              testList.purchaseInfo.push({
                week: undefined,
                planQuantity: purchaseInfo.sum(item => item.planQuantity || 0),
                confirmationQuantity: purchaseInfo.filter(item => item.planType === "확정").sum(item => item.planQuantity || 0) || 0,
                predictionQuantity: purchaseInfo.filter(item => item.planType === "예상").sum(item => item.planQuantity || 0) || 0,
                shippingQuantity: shippingItemQuantity,
                performanceRatio: isNaN(shippingItemQuantity / (purchaseInfo.sum(item => item.planQuantity || 0) || 0)) ? 0 : (shippingItemQuantity / (purchaseInfo.sum(item => item.planQuantity || 0) || 0)) * 100,
                additionalQuantity: shippingItemQuantity - (purchaseInfo.sum(item => item.planQuantity || 0) || 0),
                additionalPercent: 0,
                productionQuantity: purchaseInfo.sum(item => item.productionQuantity || 0),
                stockQuantity: purchaseInfo.sum(item => item.stockQuantity || 0)
              });

              const shippingInQuantity = shippingInfo.some(item => item.isExport === false) ? shippingInfo.filter(item => item.isExport === false).sum(item => item.quantity || 0) : 0;
              const shippingExportQuantity = shippingInfo.some(item => item.isExport === true) ? shippingInfo.filter(item => item.isExport === true).sum(item => item.quantity || 0) : 0;

              testList.exportInfo.push({
                week: undefined,
                planQuantity: purchaseInfo.sum(item => item.planQuantity || 0) || 0,
                shippingQuantity: shippingItemQuantity,
                inQuantity: shippingInQuantity,
                exportQuantity: shippingExportQuantity,
                percent: isNaN(shippingExportQuantity! / shippingInQuantity!) ? 0 : (shippingExportQuantity! / shippingInQuantity!) * 100
              });

              const purchaseQuantity = paymentPeriodInfo.sum(item => item.planQuantity || 0) || 0;
              const shippingQuantity = paymentPeriodInfo.sum(item => item.issueQuantity || 0) || 0;
              const totalElapseDate = isNaN((paymentPeriodInfo.sum(item => item.elapseDate || 0) || 0) / (paymentPeriodInfo.length || 0))
                ? 0 : (paymentPeriodInfo.sum(item => item.elapseDate || 0) || 0) / (paymentPeriodInfo.length || 0);

              testList.paymentPeriod.push({
                week: undefined,
                purchaseQuantity,
                shippingQuantity,
                elapseDate: totalElapseDate,
                complianceRate: shippingExportQuantity,
                unpaidQuantity: shippingQuantity - purchaseQuantity,
                rateOfUnpaidRate: isNaN(shippingQuantity! / purchaseQuantity!) ? 0 : ((shippingQuantity! / purchaseQuantity!) * 100).toFixed(2),
                reason: undefined,
                remark: undefined
              });
            }
          }

          this.items = Object.clone(testList);

          this._cdr.markForCheck();
        }
      );
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.mainBusyCount--;
  }

  public async _getGoodsIssueReason(): Promise<any[]> {
    return await this._orm.connectAsync(MainDbContext, async db => {
      return await db.goodsIssueReport
        .where(item1 => [
          sorm.equal(item1.year, this.lastFilter!.year!),
          sorm.equal(item1.month, this.lastFilter!.month!)
        ])
        .select(item => ({
          week: item.week,
          reason: item.noPaymentRemark,
          remark: item.remark
        }))
        .resultAsync();
    });
  }
}

interface IFilterVM {
  year?: number;
  month?: number;
  lastDay?: number;
}

interface IPurchaseStatusVM {
  purchaseInfo: IPurchaseOrderVM[] | undefined;
  exportInfo: IExportVM[] | undefined;
  paymentPeriod: IPaymentPeriodComplianceRateVM[] | undefined;
}

interface IPurchaseOrderVM {
  week: number | undefined;
  planQuantity: number | undefined;
  confirmationQuantity: number | undefined;
  predictionQuantity: number | undefined;
  shippingQuantity: number | undefined;
  performanceRatio: number | undefined;
  additionalQuantity: number | undefined;
  additionalPercent: number | undefined;
  stockQuantity: number | undefined;
  productionQuantity: number | undefined;
}

interface IExportVM {
  week: number | undefined;
  planQuantity: number | undefined;
  shippingQuantity: number | undefined;
  inQuantity: number | undefined;
  exportQuantity: number | undefined;
  percent: number | undefined;
}

interface IPaymentPeriodComplianceRateVM {
  week: number | undefined;
  purchaseQuantity: number | undefined;
  shippingQuantity: number | undefined;
  elapseDate: number | undefined; // 납기경과일
  complianceRate: number | undefined;  //납기준수율
  unpaidQuantity: number | undefined; //미납수량
  rateOfUnpaidRate: number | undefined; //미납율
  reason: string | undefined;
  remark: string | undefined;
}

