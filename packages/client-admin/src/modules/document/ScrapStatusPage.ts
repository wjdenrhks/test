import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from "@angular/core";
import {SdModalProvider, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {AppDataProvider} from "@sample/client-common";
import {MainDbContext} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {DateOnly} from "@simplism/core";
import {ShowScrapInfoModal} from "../../modals/ShowScrapInfoModal";
import {ExcelWorkbook} from "@simplism/excel";

@Component({
  selector: "app-scrap-status",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>스크랩 발생현황</h4>
          <sd-topbar-menu (click)="onDownloadButtonClick()" *ngIf="items">
            <sd-icon [icon]="'download'" [fixedWidth]="true"></sd-icon>
            다운로드
          </sd-topbar-menu>
        </sd-topbar>
        <sd-dock-container>
          <sd-dock class="sd-padding-sm-default sd-background-grey-lightest">
            <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
              <sd-form-item [label]="'기간'">
                <sd-textfield [(value)]="filter.fromDate" [type]="'date'"></sd-textfield>
              </sd-form-item>
              ~
              <sd-form-item>
                <sd-textfield [(value)]="filter.toDate" [type]="'date'"></sd-textfield>
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
              <sd-dock>
                <div style="display: block" *ngIf="items && barChartData && barChartData.length > 0">
                  <canvas baseChart width="400" height="100"
                          [datasets]="barChartData"
                          [labels]="barChartLabels"
                          [options]="barChartOptions"
                          [legend]="barChartLegend"
                          [chartType]="barChartType"
                          (chartHover)="chartHovered($event)"
                          (chartClick)="chartClicked($event)"></canvas>
                </div>
              </sd-dock>
              <br>
              <sd-dock *ngIf="items && barChartData && barChartData.length > 0 && items.nowProduction">
                <div class="sd-padding-xs-sm" style="padding-left: 2%;">
                  <h1> 스크랩 현황 </h1>
                </div>
                <sd-sheet #sheet [id]="'now-scrap-status'"
                          [items]="items.nowProduction"
                          [trackBy]="trackByIdFn">
                  <sd-sheet-column [header]="'호기'" [width]="110">
                    <ng-template #item let-item="item">
                      <div class="sd-padding-xs-sm" style="text-align: center;">
                        {{ item.equipmentName }}
                      </div>
                    </ng-template>
                  </sd-sheet-column>
                  <sd-sheet-column *ngFor="let type of items.scrapList; let i = index; trackBy: trackByMeFn"
                                   [header]="type.name" [width]="90">
                    <ng-template #item let-item="item">
                      <div class="sd-padding-xs-sm" style="text-align: right;">
                        <a *ngIf="item.equipmentName !== '합계' && !!item.typeInfo[i]"
                           (click)="searchScrapType(item.equipmentId, item.typeInfo[i].id)">
                          {{ item.typeInfo[i].quantity | number }}
                        </a>
                        <div *ngIf="item.equipmentName !== '합계' && !item.typeInfo[i]">
                          {{ item.totalQuantity | number }}
                        </div>
                        <div *ngIf="item.equipmentName === '합계'  && !!item.typeInfo[i]" style="font-weight: bold;">
                          {{ item.typeInfo[i].quantity | number }}
                        </div>
                        <div *ngIf="item.equipmentName === '합계' && !item.typeInfo[i]" style="font-weight: bold;">
                          {{ item.totalQuantity | number }}
                        </div>
                      </div>
                    </ng-template>
                  </sd-sheet-column>
                </sd-sheet>
              </sd-dock>
              <sd-dock *ngIf="items && barChartData && barChartData.length > 0 && items.prevProduction"
                       style="padding-top: 1% ">
                <div class="sd-padding-xs-sm" style="padding-left: 2%;">
                  <h1> 전년 동기 스크랩 현황 </h1>
                </div>
                <sd-sheet #sheet [id]="'prev-scrap-status'"
                          [items]="items.prevProduction"
                          [trackBy]="trackByIdFn">
                  <sd-sheet-column [header]="'호기'" [width]="110">
                    <ng-template #item let-item="item">
                      <div class="sd-padding-xs-sm" style="text-align: center;">
                        {{ item.equipmentName }}
                      </div>
                    </ng-template>
                  </sd-sheet-column>
                  <sd-sheet-column *ngFor="let type of items.scrapList; let i = index; trackBy: trackByMeFn"
                                   [header]="type.name" [width]="90">
                    <ng-template #item let-item="item">
                      <div class="sd-padding-xs-sm" style="text-align: right;">
                        <a
                          *ngIf="(item.equipmentId !== 99 && item.equipmentId !== 999 && item.equipmentId !== 9999) && !!item.typeInfo[i]"
                          (click)="searchScrapType(item.equipmentId, item.typeInfo[i].id)">
                          {{ item.typeInfo[i].quantity | number }}
                        </a>
                        <div
                          *ngIf="(item.equipmentId !== 99 && item.equipmentId !== 999 && item.equipmentId !== 9999)  && !item.typeInfo[i]">
                          {{ item.totalQuantity | number }}
                        </div>
                        <div *ngIf="item.equipmentId === 99 && !!item.typeInfo[i]" style="font-weight: bold;">
                          {{ item.typeInfo[i].quantity | number }}
                        </div>
                        <div *ngIf="item.equipmentId === 99 && !item.typeInfo[i]" style="font-weight: bold;">
                          {{ item.totalQuantity | number }}
                        </div>
                        <div *ngIf="item.equipmentId === 999  && !!item.typeInfo[i]" style="font-weight: bold;">
                          {{ item.typeInfo[i].quantity | number }}
                        </div>
                        <div *ngIf="item.equipmentId === 999  && !item.typeInfo[i]" style="font-weight: bold;">
                          {{ item.totalQuantity | number }}
                        </div>
                        <div *ngIf="item.equipmentId === 9999  && !!item.typeInfo[i]" style="font-weight: bold;">
                          {{ item.typeInfo[i].quantity ? ((item.typeInfo[i].quantity | number) + '%') : '0%' }}
                        </div>
                        <div *ngIf="item.equipmentId === 9999  && !item.typeInfo[i]" style="font-weight: bold;">
                          {{ item.totalQuantity ? ((item.totalQuantity | number) + '%') : '0%' }}
                        </div>
                      </div>
                    </ng-template>
                  </sd-sheet-column>
                </sd-sheet>
              </sd-dock>

            </sd-dock-container>
          </sd-busy-container>
        </sd-dock-container>
      </sd-topbar-container>
    </sd-busy-container>`
})
export class ScrapStatusPage implements OnInit {

  public filter: IFilterVM = {
    fromDate: undefined,
    toDate: undefined
  };
  public lastFilter?: IFilterVM;

  public items?: IScrapStatusReportVM;
  public lastItems?: IScrapStatusReportVM;

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public barChartOptions: any = {
    scales: {
      yAxes: [{
        ticks: {
          beginAtZero: true
        }
      }]
    },
    scaleShowVerticalLines: false,
    responsive: true
  };
  public barChartLabels: string[] = [];
  public barChartType = "bar";
  public barChartLegend = true;

  public barChartData: any[] = [];

  // events
  public chartClicked(e: any): void {
    console.log(e);
  }

  public chartHovered(e: any): void {
    console.log(e);
  }

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _modal: SdModalProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _appData: AppDataProvider,
                     private readonly _cdr: ChangeDetectorRef) {
  }

  public async ngOnInit(): Promise<void> {

    const year = new DateOnly().year;
    const month = new DateOnly().month;

    this.filter.fromDate = new DateOnly().setYear(year).setMonth(month).setDay(1);
    this.filter.toDate = new DateOnly().setYear(year).setMonth(month);

    await this.onSearchFormSubmit();
    this._cdr.markForCheck();
  }

  public async onDownloadButtonClick(): Promise<void> {
    await this._download();
    this._cdr.markForCheck();
  }

  private async _download(): Promise<void> {
    this.viewBusyCount++;
    try {

      if (!this.lastFilter!.fromDate || !this.lastFilter!.toDate) {
        this._toast.danger("검색기간을 정확히 입력해 주세요.");
        return;
      }

      const headerStyle = {
        alignH: "center",
        background: "CCCCCCCC",
        foreground: "FFFFFFFF",
        bold: true
      };

      const wb = ExcelWorkbook.create();
      const ws = wb.createWorksheet(`스크랩 발생현황`);

      const scrapListLength = this.items!.scrapList!.length;

      ws.cell(0, 0).merge(0, scrapListLength);
      ws.cell(0, 0).value = "스크랩 발생현황 (기준 " + this.lastFilter!.fromDate!.toFormatString("yyyy-MM-dd") + " ~ " + this.lastFilter!.toDate!.toFormatString("yyyy-MM-dd") + ")";

      ws.cell(1, 0).value = "호기";
      let seq = 1;
      for (const scrapItem of this.items!.scrapList || []) {
        ws.cell(1, seq).value = (seq === scrapListLength ? "합계" : scrapItem.name);
        seq++;
      }

      let nowScrapSeq = 0;
      let lastSeq: number;
      ws.cell(nowScrapSeq + 2, 0).value = "합계";
      for (const nowScrapItem of this.items!.nowProduction || []) {
        ws.cell(nowScrapSeq + 2, 0).value = nowScrapItem.equipmentName;

        let scrapSeq = 1;
        for (let scrapItem = 0; scrapItem < scrapListLength; scrapItem++) {
          if (nowScrapItem.equipmentName !== "합계") {
            if (!!nowScrapItem.typeInfo![scrapItem]) {
              ws.cell(nowScrapSeq + 2, scrapSeq).value = nowScrapItem.typeInfo![scrapItem] ? nowScrapItem.typeInfo![scrapItem].quantity : 0;
            }
            else {
              ws.cell(nowScrapSeq + 2, scrapSeq).value = nowScrapItem.totalQuantity || 0;
            }
          }
          else {
            if (!!nowScrapItem.typeInfo![scrapItem]) {
              ws.cell(nowScrapSeq + 2, scrapSeq).value = nowScrapItem.typeInfo![scrapItem] ? nowScrapItem.typeInfo![scrapItem].quantity : 0;
            }
            else {
              ws.cell(nowScrapSeq + 2, scrapSeq).value = nowScrapItem.totalQuantity || 0;
            }
          }
          scrapSeq++;
        }
        nowScrapSeq++;
        lastSeq = nowScrapSeq + 1;
      }

      lastSeq = (lastSeq!) + 2;

      ws.cell(lastSeq, 0).merge(lastSeq, scrapListLength);
      ws.cell(lastSeq, 0).value = "전년 동기 스크랩 현황";

      lastSeq = (lastSeq!) + 1;

      ws.cell(lastSeq, 0).value = "호기";
      let prevHeadSeq = 1;
      for (const scrapItem of this.items!.scrapList || []) {
        ws.cell(lastSeq, prevHeadSeq).value = (prevHeadSeq === scrapListLength ? "합계" : scrapItem.name);
        prevHeadSeq++;
      }

      for (let i = 0; i <= scrapListLength; i++) {
        Object.assign(ws.cell(1, i).style, headerStyle);
        Object.assign(ws.cell(lastSeq, i).style, headerStyle);
      }

      lastSeq = lastSeq + 1;

      let prevScrapSeq = 0;
      ws.cell(prevScrapSeq + lastSeq, 0).value = "합계";
      for (const nowScrapItem of this.items!.prevProduction || []) {
        ws.cell(prevScrapSeq + lastSeq, 0).value = nowScrapItem.equipmentName;

        let scrapSeq = 1;
        for (let scrapItem = 0; scrapItem < scrapListLength; scrapItem++) {
          if (nowScrapItem.equipmentName !== "합계") {
            if (nowScrapItem.equipmentName === "증감률") {
              if (!!nowScrapItem.typeInfo![scrapItem]) {
                ws.cell(prevScrapSeq + lastSeq, scrapSeq).value = nowScrapItem.typeInfo![scrapItem] ? nowScrapItem.typeInfo![scrapItem].quantity + "%" : "0%";
              }
              else {
                ws.cell(prevScrapSeq + lastSeq, scrapSeq).value = (nowScrapItem.totalQuantity || 0) + "%";
              }
            }
            else {
              if (!!nowScrapItem.typeInfo![scrapItem]) {
                ws.cell(prevScrapSeq + lastSeq, scrapSeq).value = nowScrapItem.typeInfo![scrapItem] ? nowScrapItem.typeInfo![scrapItem].quantity : 0;
              }
              else {
                ws.cell(prevScrapSeq + lastSeq, scrapSeq).value = nowScrapItem.totalQuantity || 0;
              }
            }
          }
          else {
            if (!!nowScrapItem.typeInfo![scrapItem]) {
              ws.cell(prevScrapSeq + lastSeq, scrapSeq).value = nowScrapItem.typeInfo![scrapItem] ? nowScrapItem.typeInfo![scrapItem].quantity : 0;
            }
            else {
              ws.cell(prevScrapSeq + lastSeq, scrapSeq).value = nowScrapItem.totalQuantity || 0;
            }
          }
          scrapSeq++;
        }
        prevScrapSeq++;
      }

      const title = "스크랩 발생현황(" + this.lastFilter!.fromDate!.toFormatString("yyyy-MM-dd") + " ~ " + this.lastFilter!.toDate!.toFormatString("yyyy-MM-dd") + ").xlsx";

      await wb.downloadAsync(title);
      await this._chartDownload();
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.viewBusyCount--;
  }

  public async _chartDownload(): Promise<void> {
    const link = document.createElement("a");

    const viewCanvas = document.getElementsByTagName("canvas")[0];
    const copyCanvas = document.createElement("canvas");

    copyCanvas.width = viewCanvas.width;
    copyCanvas.height = viewCanvas.height;

    const destCtx = copyCanvas.getContext("2d");

    //create a rectangle with the desired color
    destCtx!.fillStyle = "#FFFFFF";
    destCtx!.fillRect(0, 0, viewCanvas.width, viewCanvas.height);

    //draw the original canvas onto the destination canvas
    destCtx!.drawImage(viewCanvas, 0, 0);

    //finally use the destinationCanvas.toDataURL() method to get the desired output;
    copyCanvas.toDataURL();

    link.href = copyCanvas.toDataURL();
    link.download = "생산일보 현황(" + this.lastFilter!.fromDate!.toFormatString("yyyy-MM-dd") + " ~ " + this.lastFilter!.toDate!.toFormatString("yyyy-MM-dd") + ").jpg";
    link.click();
  }

  public async searchScrapType(equipmentId: number, type: any): Promise<void> {
    if (!this.lastFilter!.fromDate || !this.lastFilter!.toDate) {
      this._toast.danger("검색 기간을 정확히 입력한 경우에만 검색이 가능합니다.");
      return;
    }

    const result = await this._modal.show(ShowScrapInfoModal, "스크랩 이력", {
      equipmentId,
      typeId: type,
      searchFromDate: this.lastFilter!.fromDate!,
      searchToDate: this.lastFilter!.toDate!
    });
    if (!result) return;

    this._cdr.markForCheck();
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

        this.barChartLabels = [];
        this.items = {
          nowProduction: [],
          prevProduction: [],
          scrapList: []
        };

        this.barChartData = [];

        if (!this.lastFilter!.fromDate || !this.lastFilter!.toDate) {
          this._toast.danger("검색기간을 정확히 입력해 주세요");
          return;
        }

        const nowFromDate = this.lastFilter!.fromDate;
        const nowToDate = this.lastFilter!.toDate;

        const lastFromDate = this.lastFilter!.fromDate!.addYears(-1);
        const lastToDate = this.lastFilter!.toDate!.addYears(-1);

        // 스크랩 유형
        const typeList = await db.baseType
          .where(item => [
            sorm.equal(item.type, "스크랩유형"),
            sorm.equal(item.isDisabled, false)
          ])
          .select(item => ({
            id: item.id,
            name: item.name
          }))
          .resultAsync();

        for (const type of typeList || []) {
          this.barChartLabels.push(type.name);
          this.items.scrapList!.push({
            id: type.id,
            name: type.name,
            quantity: undefined
          });
        }

        this.items.scrapList!.push({
          id: undefined,
          name: "합계",
          quantity: undefined
        });

        const nowList = await this._getStatus(db, nowFromDate!, nowToDate!, typeList, true);
        this.items!.nowProduction = Object.clone(nowList);

        const prevList = await this._getStatus(db, lastFromDate!, lastToDate!, typeList, false);
        this.items!.prevProduction = Object.clone(prevList);

        this._cdr.markForCheck();
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.mainBusyCount--;
  }

  private async _getStatus(db: MainDbContext, fromDate: DateOnly, toDate: DateOnly, typeList: any[], now: boolean): Promise<IEquipmentTotalVM[]> {
    // 검색기간 스크랩 발생형환
    let scrapList: IEquipmentTotalVM[];
    scrapList = await db.scrap
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId),
        sorm.between(item.occurrenceDate, fromDate, toDate)
      ])
      .include(item => item.production)
      .include(item => item.production!.equipment)
      .groupBy(item => [
        item.production!.equipmentId,
        item.production!.equipment!.name
      ])
      .select(item => ({
        equipmentId: item.production!.equipmentId,
        equipmentName: item.production!.equipment!.name,
        totalQuantity: sorm.sum(sorm.ifNull(item.weight, 0)),
        typeInfo: undefined
      }))
      .orderBy(item => item.equipmentName)
      .resultAsync();

    const equipmentInfo = await db.equipment
      .orderBy(item => item.name)
      .where(item => [
        sorm.equal(item.isDisabled, false),
        sorm.equal(item.isCount, true)
      ])
      .select(item => ({
        equipmentId: item.id,
        equipmentName: item.name
      }))
      .resultAsync();

    for (const equipmentItem of equipmentInfo) {
      if (scrapList.filter(item => item.equipmentId === equipmentItem.equipmentId).length < 1) {
        scrapList.push({
          equipmentId: equipmentItem.equipmentId,
          equipmentName: equipmentItem.equipmentName,
          totalQuantity: 0,
          typeInfo: undefined
        });
      }
    }

    for (const listItem of scrapList || []) {
      listItem.typeInfo = listItem.typeInfo || [];
      const scrapInfo = await this._getTypeInfo(fromDate, toDate);
      for (const type of typeList || []) {
        const quantity = scrapInfo && scrapInfo.filter(item => item.equipmentId === listItem.equipmentId && item.typeId === type.id).sum(item => item.quantity || 0);
        listItem.typeInfo!.push({
          id: type.id,
          name: type.name,
          quantity
        });
      }
      listItem.totalQuantity = scrapInfo && scrapInfo.filter(item => item.equipmentId === listItem.equipmentId).sum(item => item.quantity || 0);
    }

    scrapList = scrapList.orderBy(item => item.equipmentName);

    for (const productionItem of scrapList || []) {
      const dataList: number[] = [];
      let seq = 0;

      productionItem.typeInfo!.forEach(item => {
        dataList[seq++] = item.quantity || 0;
      });

      if (now) {
        this.barChartData.push({
          data: dataList,
          label: productionItem.equipmentName
        });
      }
    }

    const totalTypeList: IScrapTypeInfoVM[] = [];
    for (const typeItem of typeList) {
      let totalTypeQuantity = 0;
      for (const scrapItem of scrapList) {
        if (scrapItem.typeInfo && scrapItem.typeInfo.filter(item1 => item1.id === typeItem.id)) {
          totalTypeQuantity = totalTypeQuantity + (scrapItem.typeInfo.filter(item1 => item1.id === typeItem.id).sum(item1 => item1.quantity || 0) || 0);
        }
      }

      totalTypeList.push({
        id: typeItem.id,
        name: typeItem.name,
        quantity: totalTypeQuantity
      });
    }

    const increase = Object.clone(totalTypeList);
    const increaseRate = Object.clone(totalTypeList);

    scrapList.push({
      equipmentId: 99,
      equipmentName: "합계",
      typeInfo: totalTypeList,
      totalQuantity: scrapList.sum(item => item.totalQuantity || 0)
    });

    //증가대비증감 구하기
    if (!now) {
      increase.forEach(item => {
        const result = this.items!.nowProduction!.filter(item1 => item1.equipmentId === 99).single();
        item.quantity = (result!.typeInfo!.filter(item1 => item1.id === item.id).single()!.quantity || 0) - (item.quantity || 0);
      });

      increaseRate.forEach(item => {
        const result = this.items!.nowProduction!.filter(item1 => item1.equipmentId === 99).single();
        const nowQuantity = result!.typeInfo!.filter(item1 => item1.id === item.id).single()!.quantity || 0;
        const prevQuantity = item.quantity || 0;

        item.quantity = ((nowQuantity - prevQuantity) / Math.abs(prevQuantity)) * 100;
        item.quantity = isNaN(item.quantity) || item.quantity === Infinity || item.quantity === -Infinity ? 0 : Number(item.quantity.toFixed(2));
      });

      scrapList.push({
        equipmentId: 999,
        equipmentName: "증가대비증감",
        typeInfo: increase,
        totalQuantity: increase.sum(item => item.quantity || 0)
      });

      const nowScrapTotalQuantity = this.items!.nowProduction!.filter(item => item.equipmentId === 99).single()!.totalQuantity || 0;
      const prevScrapTotalQuantity = scrapList.filter(item => item.equipmentId === 99).single()!.totalQuantity || 0;

      let increaseTotalRate = ((nowScrapTotalQuantity - prevScrapTotalQuantity) / Math.abs(prevScrapTotalQuantity)) * 100;
      increaseTotalRate = isNaN(increaseTotalRate) || increaseTotalRate === Infinity || increaseTotalRate === -Infinity ? 0 : Number(increaseTotalRate.toFixed(2));

      scrapList.push({
        equipmentId: 9999,
        equipmentName: "증감률",
        typeInfo: increaseRate,
        totalQuantity: increaseTotalRate
      });
    }

    return scrapList;
  }

  /*  private async _getTypeInfo(equipmentId: number, type: number, fromDate: DateOnly, toDate: DateOnly): Promise<number | undefined> {
      return await this._orm.connectAsync(MainDbContext, async db => {
        const result = await db.scrap
          .where(item => [
            sorm.equal(item.companyId, this._appData.authInfo!.companyId)
          ])
          .include(item => item.production)
          .where(item => [
            sorm.and([
              sorm.between(item.occurrenceDate, fromDate, toDate),
              sorm.equal(item.production!.equipmentId, equipmentId),
              sorm.equal(item.typeId, type)
            ])
          ])
          .select(item => ({
            quantity: sorm.sum(sorm.ifNull(item.weight, 0))
          }))
          .singleAsync();
        return result ? result.quantity : undefined;
      });
    }*/

  private async _getTypeInfo(fromDate: DateOnly, toDate: DateOnly): Promise<any[] | undefined> {
    return await this._orm.connectAsync(MainDbContext, async db => {
      return await db.scrap
        .include(item => item.production)
        .where(item => [
          sorm.equal(item.companyId, this._appData.authInfo!.companyId),
          sorm.between(item.occurrenceDate, fromDate, toDate)
        ])
        .groupBy(item => [
          item.production!.equipmentId,
          item.typeId
        ])
        .select(item => ({
          equipmentId: item.production!.equipmentId,
          typeId: item.typeId,
          quantity: sorm.sum(sorm.ifNull(item.weight, 0))
        }))
        .resultAsync();
    });
  }
}

interface IFilterVM {
  fromDate?: DateOnly;
  toDate?: DateOnly;
}

interface IScrapStatusReportVM {
  nowProduction: IEquipmentTotalVM[] | undefined;
  prevProduction: IEquipmentTotalVM[] | undefined;
  scrapList: IScrapTypeInfoVM[] | undefined;
}

interface IEquipmentTotalVM {
  equipmentId: number | undefined;
  equipmentName: string | undefined;
  typeInfo: IScrapTypeInfoVM[] | undefined;
  totalQuantity: number | undefined;
}

interface IScrapTypeInfoVM {
  id: number | undefined;
  name: string | undefined;
  quantity: number | undefined;
}