import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild} from "@angular/core";
import {DateOnly} from "@simplism/core";
import {SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {MainDbContext} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {BaseChartDirective} from "ng2-charts";
import {ExcelWorkbook} from "@simplism/excel";

@Component({
  selector: "app-production-instruction-report",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>생산일보 현황</h4>
          <sd-topbar-menu (click)="onDownloadButtonClick()" *ngIf="items">
            <sd-icon [icon]="'download'" [fixedWidth]="true"></sd-icon>
            다운로드
          </sd-topbar-menu>
        </sd-topbar>
        <sd-dock-container>
          <sd-dock class="sd-padding-sm-default sd-background-grey-lightest">
            <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
              <sd-form-item [label]="'생산일'">
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
              <sd-dock *ngIf="items && barChartData && barChartData.length > 0">
                <div class="sd-padding-xs-sm" style="padding-left: 2%;">
                  <h1> {{ '생산 현황 (기준 ' + lastFilter.fromDate?.toFormatString('yyyy-MM-dd') + ' ~ ' + lastFilter.toDate?.toFormatString('yyyy-MM-dd') + ')' }}</h1>
                </div>
                <sd-sheet #sheet [id]="'production-instruction'"
                          [items]="items"
                          [trackBy]="trackByIdFn">
                  <sd-sheet-column [header]="'호기'" [width]="100">
                    <ng-template #item let-item="item">
                      <div class="sd-padding-xs-sm" style="text-align: center;">
                        {{ item.equipmentName ? item.equipmentName : '합계' }}
                      </div>
                    </ng-template>
                  </sd-sheet-column>
                  <sd-sheet-column [header]="'배합량'">
                    <ng-template #item let-item="item">
                      <div class="sd-padding-xs-sm" style="text-align: right;">
                        {{ item.equipmentInfo[0].quantity | number }}
                      </div>
                    </ng-template>
                  </sd-sheet-column>
                  <sd-sheet-column [header]="'생산중량'">
                    <ng-template #item let-item="item">
                      <div class="sd-padding-xs-sm" style="text-align: right;">
                        {{ item.equipmentInfo[1]?.quantity | number }}
                      </div>
                    </ng-template>
                  </sd-sheet-column>
                  <sd-sheet-column [header]="'생산량'">
                    <ng-template #item let-item="item">
                      <div class="sd-padding-xs-sm" style="text-align: right;">
                        {{ item.equipmentInfo[2]?.quantity | number }}
                      </div>
                    </ng-template>
                  </sd-sheet-column>
                  <sd-sheet-column [header]="'재생가능 스크랩'">
                    <ng-template #item let-item="item">
                      <div class="sd-padding-xs-sm" style="text-align: right;">
                        {{ item.equipmentInfo[3]?.quantity | number }}
                      </div>
                    </ng-template>
                  </sd-sheet-column>
                  <sd-sheet-column [header]="'재생 불가능 스크랩'">
                    <ng-template #item let-item="item">
                      <div class="sd-padding-xs-sm" style="text-align: right;">
                        {{ item.equipmentInfo[4]?.quantity | number }}
                      </div>
                    </ng-template>
                  </sd-sheet-column>
                  <sd-sheet-column [header]="'LOSS량'">
                    <ng-template #item let-item="item">
                      <div class="sd-padding-xs-sm" style="text-align: right;">
                        {{ item.equipmentInfo[5]?.quantity | number }}
                      </div>
                    </ng-template>
                  </sd-sheet-column>
                  <sd-sheet-column [header]="'LOSS율'">
                    <ng-template #item let-item="item">
                      <div class="sd-padding-xs-sm" style="text-align: right;">
                        {{ item.equipmentInfo[6]?.quantity | number }}
                      </div>
                    </ng-template>
                  </sd-sheet-column>
                  <sd-sheet-column [header]="'언비저블'">
                    <ng-template #item let-item="item">
                      <div class="sd-padding-xs-sm" style="text-align: right;">
                        {{ item.equipmentInfo[7]?.quantity | number }}
                      </div>
                    </ng-template>
                  </sd-sheet-column>
                  <sd-sheet-column [header]="'LDPE 자재 출고분'">
                    <ng-template #item let-item="item">
                      <div class="sd-padding-xs-sm" style="text-align: right;">
                        {{ item.equipmentInfo[8]?.quantity | number }}
                      </div>
                    </ng-template>
                  </sd-sheet-column>
                </sd-sheet>
              </sd-dock>

              <sd-dock *ngIf="lastItems" style="padding-top: 1% ">
                <div class="sd-padding-xs-sm" style="padding-left: 2%;">
                  <h1> 전년 동기 생산 현황 </h1>
                </div>
                <sd-sheet #sheet [id]="'last-production-instrucion'"
                          [items]="lastItems"
                          [trackBy]="trackByIdFn">
                  <sd-sheet-column [header]="'호기'" [width]="100">
                    <ng-template #item let-item="item">
                      <div class="sd-padding-xs-sm" style="text-align: center;">
                        {{ item.equipmentName ? item.equipmentName : '합계' }}
                      </div>
                    </ng-template>
                  </sd-sheet-column>
                  <sd-sheet-column [header]="'배합량'">
                    <ng-template #item let-item="item">
                      <div class="sd-padding-xs-sm" style="text-align: right;">
                        {{ item.equipmentInfo[0].quantity | number }}
                      </div>
                    </ng-template>
                  </sd-sheet-column>
                  <sd-sheet-column [header]="'생산중량'">
                    <ng-template #item let-item="item">
                      <div class="sd-padding-xs-sm" style="text-align: right;">
                        {{ item.equipmentInfo[1]?.quantity | number }}
                      </div>
                    </ng-template>
                  </sd-sheet-column>
                  <sd-sheet-column [header]="'생산량'">
                    <ng-template #item let-item="item">
                      <div class="sd-padding-xs-sm" style="text-align: right;">
                        {{ item.equipmentInfo[2]?.quantity | number }}
                      </div>
                    </ng-template>
                  </sd-sheet-column>
                  <sd-sheet-column [header]="'재생가능 스크랩'">
                    <ng-template #item let-item="item">
                      <div class="sd-padding-xs-sm" style="text-align: right;">
                        {{ item.equipmentInfo[3]?.quantity | number }}
                      </div>
                    </ng-template>
                  </sd-sheet-column>
                  <sd-sheet-column [header]="'재생 불가능 스크랩'">
                    <ng-template #item let-item="item">
                      <div class="sd-padding-xs-sm" style="text-align: right;">
                        {{ item.equipmentInfo[4]?.quantity | number }}
                      </div>
                    </ng-template>
                  </sd-sheet-column>
                  <sd-sheet-column [header]="'LOSS량'">
                    <ng-template #item let-item="item">
                      <div class="sd-padding-xs-sm" style="text-align: right;">
                        {{ item.equipmentInfo[5]?.quantity | number }}
                      </div>
                    </ng-template>
                  </sd-sheet-column>
                  <sd-sheet-column [header]="'LOSS율'">
                    <ng-template #item let-item="item">
                      <div class="sd-padding-xs-sm" style="text-align: right;">
                        {{ item.equipmentInfo[6]?.quantity | number }}
                      </div>
                    </ng-template>
                  </sd-sheet-column>
                  <sd-sheet-column [header]="'언비저블'">
                    <ng-template #item let-item="item">
                      <div class="sd-padding-xs-sm" style="text-align: right;">
                        {{ item.equipmentInfo[7]?.quantity | number }}
                      </div>
                    </ng-template>
                  </sd-sheet-column>
                  <sd-sheet-column [header]="'LDPE 자재 출고분'">
                    <ng-template #item let-item="item">
                      <div class="sd-padding-xs-sm" style="text-align: right;">
                        {{ item.equipmentInfo[8]?.quantity | number }}
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
export class ProductionInstructionReportPage implements OnInit {

  public filter: IFilterVM = {
    fromDate: undefined,
    toDate: undefined
  };
  public lastFilter?: IFilterVM;

  public items?: IProductionStatusVM[];
  public lastItems?: IProductionStatusVM[];

  public types: string[] = [];

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public barChartOptions: any = {
    scaleShowVerticalLines: false,
    responsive: true
  };

  public barChartLabels: string[] = ["배합량", "생산중량", "재생가능 스크랩", "재생 불가능 스크랩", "LOSS량", "LOSS 율", "언비저블", "LDPE"];
  public barChartType = "bar";
  public barChartLegend = true;

  public barChartData: any[] = [];

  @ViewChild("chart", {read: BaseChartDirective})
  public chartDirective?: BaseChartDirective;

  // events
  public chartClicked(e: any): void {
    console.log(e);
  }

  public chartHovered(e: any): void {
    console.log(e);
  }

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _cdr: ChangeDetectorRef) {
  }

  public async ngOnInit(): Promise<void> {

    const year = new DateOnly().year;
    const month = new DateOnly().month;
    const lastDay = (new Date(Number(year), Number(month), 0)).getDate();

    this.filter.fromDate = new DateOnly().setYear(year).setMonth(month).setDay(1);
    this.filter.toDate = new DateOnly().setYear(year).setMonth(month).setDay(lastDay);

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
      const ws = wb.createWorksheet(`생산일보 현황`);

      //TODO : 첫 행 높이 조절 할 수 있으면 조절
      ws.cell(0, 0).merge(0, 9);
      ws.cell(0, 0).value = "생산 현황 (기준 " + this.lastFilter!.fromDate!.toFormatString("yyyy-MM-dd") + " ~ " + this.lastFilter!.toDate!.toFormatString("yyyy-MM-dd") + ")";

      ws.cell(1, 0).value = "호기";
      ws.cell(1, 1).value = "배합량";
      ws.cell(1, 2).value = "생산중량";
      ws.cell(1, 3).value = "생산량";
      ws.cell(1, 4).value = "재생가능 스크랩";
      ws.cell(1, 5).value = "재생 불가능 스크랩";
      ws.cell(1, 6).value = "LOSS량";
      ws.cell(1, 7).value = "LOSS률";
      ws.cell(1, 8).value = "언비저블";
      ws.cell(1, 9).value = "LDPE 자재 출고분";

      for (let i = 0; i <= 9; i++) {
        Object.assign(ws.cell(1, i).style, headerStyle);
      }

      let lastSeq: number;

      for (let i = 0; i < this.items!.length; i++) {
        const item = this.items![i];
        ws.cell(i + 2, 0).value = item.equipmentName ? item.equipmentName : "합계";
        ws.cell(i + 2, 1).value = item.equipmentInfo![0] ? item.equipmentInfo![0].quantity : 0;
        ws.cell(i + 2, 2).value = item.equipmentInfo![1] ? item.equipmentInfo![1].quantity : 0;
        ws.cell(i + 2, 3).value = item.equipmentInfo![2] ? item.equipmentInfo![2].quantity : 0;
        ws.cell(i + 2, 4).value = item.equipmentInfo![3] ? item.equipmentInfo![3].quantity : 0;
        ws.cell(i + 2, 5).value = item.equipmentInfo![4] ? item.equipmentInfo![4].quantity : 0;
        ws.cell(i + 2, 6).value = item.equipmentInfo![5] ? item.equipmentInfo![5].quantity : 0;
        ws.cell(i + 2, 7).value = item.equipmentInfo![6] ? item.equipmentInfo![6].quantity : 0;
        ws.cell(i + 2, 8).value = item.equipmentInfo![7] ? item.equipmentInfo![7].quantity : 0;
        ws.cell(i + 2, 9).value = item.equipmentInfo![8] ? item.equipmentInfo![8].quantity : 0;

        lastSeq = i + 1;
      }

      lastSeq = (lastSeq!) + 2;

      ws.cell(lastSeq, 0).merge(lastSeq, 9);
      ws.cell(lastSeq, 0).value = "전년 동기 생산 현황";

      lastSeq = (lastSeq!) + 1;

      ws.cell(lastSeq, 0).value = "호기";
      ws.cell(lastSeq, 1).value = "배합량";
      ws.cell(lastSeq, 2).value = "생산중량";
      ws.cell(lastSeq, 3).value = "생산량";
      ws.cell(lastSeq, 4).value = "재생가능 스크랩";
      ws.cell(lastSeq, 5).value = "재생 불가능 스크랩";
      ws.cell(lastSeq, 6).value = "LOSS량";
      ws.cell(lastSeq, 7).value = "LOSS률";
      ws.cell(lastSeq, 8).value = "언비저블";
      ws.cell(lastSeq, 9).value = "LDPE 자재 출고분";

      for (let i = 0; i <= 9; i++) {
        Object.assign(ws.cell(lastSeq, i).style, headerStyle);
      }

      lastSeq = lastSeq + 1;

      for (let i = 0; i < this.lastItems!.length; i++) {
        const item = this.lastItems![i];
        ws.cell(i + lastSeq, 0).value = item.equipmentName ? item.equipmentName : "합계";
        ws.cell(i + lastSeq, 1).value = item.equipmentInfo![0] ? item.equipmentInfo![0].quantity : 0;
        ws.cell(i + lastSeq, 2).value = item.equipmentInfo![1] ? item.equipmentInfo![1].quantity : 0;
        ws.cell(i + lastSeq, 3).value = item.equipmentInfo![2] ? item.equipmentInfo![2].quantity : 0;
        ws.cell(i + lastSeq, 4).value = item.equipmentInfo![3] ? item.equipmentInfo![3].quantity : 0;
        ws.cell(i + lastSeq, 5).value = item.equipmentInfo![4] ? item.equipmentInfo![4].quantity : 0;
        ws.cell(i + lastSeq, 6).value = item.equipmentInfo![5] ? item.equipmentInfo![5].quantity : 0;
        ws.cell(i + lastSeq, 7).value = item.equipmentInfo![6] ? item.equipmentInfo![6].quantity : 0;
        ws.cell(i + lastSeq, 8).value = item.equipmentInfo![7] ? item.equipmentInfo![7].quantity : 0;
        ws.cell(i + lastSeq, 9).value = item.equipmentInfo![8] ? item.equipmentInfo![8].quantity : 0;
      }

      const title = "생산일보 현황(" + this.lastFilter!.fromDate!.toFormatString("yyyy-MM-dd") + " ~ " + this.lastFilter!.toDate!.toFormatString("yyyy-MM-dd") + ").xlsx";

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

        this.items = [];
        this.lastItems = [];
        this.barChartData = [];

        if (!this.lastFilter!.fromDate || !this.lastFilter!.toDate) {
          this._toast.danger("검색기간을 정확히 입력해 주세요");
          return;
        }

        const nowFromDate = this.lastFilter!.fromDate;
        const nowToDate = this.lastFilter!.toDate;

        const lastFromDate = this.lastFilter!.fromDate!.addYears(-1);
        const lastToDate = this.lastFilter!.toDate!.addYears(-1);

        this.items = await this._getStatus(db, nowFromDate!, nowToDate!);
        this.lastItems = await this._getStatus(db, lastFromDate!, lastToDate!);
        //TODO: 증가대비증감/ 증감율 구해야함

        for (const item of this.items || []) {
          const dataList = [] as number[];

          if (item) {
            for (const dataItem of item!.equipmentInfo!) {
              if (dataItem.type !== "생산량") {
                dataList.push(dataItem.quantity!);
              }
            }

            if (!!item.equipmentName) {
              this.barChartData.push({
                data: dataList,
                label: item.equipmentName
              });
            }
          }
        }

        if (this.chartDirective) {
          this.chartDirective.datasets = this.barChartData;
          this.chartDirective["refresh"]();
        }
        this._cdr.markForCheck();
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.mainBusyCount--;
  }

  private async _getStatus(db: MainDbContext, fromDate: DateOnly, toDate: DateOnly): Promise<any[] | undefined> {

    const result: IProductionStatusVM[] = [];

    // 설비 정보
    const equipmentInfo = await db.equipment
      .where(item => [
        sorm.equal(item.isDisabled, false),
        sorm.equal(item.isCount, true)
      ])
      .select(item => ({
        equipmentId: item.id,
        equipmentName: item.name
      }))
      .resultAsync();

    //투입량
    const groupByInputHistory = await db.inputHistory
      .include(item => item.mixingProcess)
      .include(item => item.mixingProcess!.equipment)
      .where(item => [
        sorm.between(sorm.cast(item.createdAtDateTime, DateOnly), fromDate, toDate)
      ])
      .groupBy(item => [
        item.mixingProcess!.equipmentId,
        item.mixingProcess!.equipment!.name
      ])
      .select(item => ({
        equipmentId: item.mixingProcess!.equipmentId,
        equipmentName: item.mixingProcess!.equipment!.name,
        quantity: sorm.sum(item.quantity)
      }))
      .resultAsync();

    // 기간별 투입량 구하기 (리와인더)
    const groupByInputHistoryOfRewind = await db.rewindProcess
      .include(item => item.equipments)
      .where(item => [
        sorm.equal(item.isCanceled, false),
        sorm.between(item.planDate, fromDate, toDate)
      ])
      .groupBy(item => [
        sorm.query("DATEPART(MM, [TBL].planDate)", Number),
        item.equipmentId,
        item.equipments!.name
      ])
      .select(item => ({
        month: sorm.query("DATEPART(MM, [TBL].planDate)", Number),
        equipmentId: item.equipmentId,
        equipmentName: item.equipments!.name,
        quantity: sorm.sum(sorm.ifNull(item.inputQuantity, 0))
      }))
      .resultAsync();

    groupByInputHistory.push(...groupByInputHistoryOfRewind);

    //생산중량, 생산량(A)  <- 테스트 생산을 제외 한 모든 생산 항목
    const groupByProduction = await db.productionItem
      .include(item => item.lot)
      .include(item => item.production)
      .include(item => item.production!.instruction)
      .include(item => item.production!.equipment)
      .include(item => item.weightMeasurement)
      .where(item => [
        sorm.between(sorm.cast(item.createdAtDateTime, DateOnly), fromDate, toDate),
        sorm.equal(item.lot!.isTesting, false)
      ])
      .groupBy(item => [
        item.production!.equipmentId,
        item.production!.equipment!.name
      ])
      .select(item => ({
        equipmentId: item.production!.equipmentId,
        equipmentName: item.production!.equipment!.name,
        quantity: sorm.sum(sorm.ifNull(item.weightMeasurement!.realWeight, item.weight)),
        length: sorm.sum(sorm.ifNull(item.length, 0))
      }))
      .resultAsync();

    //생산량 LOSS(B) <- productionItem 중  테스트 생산 제외 AND 재고 제외 처리 된 생산 항목 제외
    const groupByIsNotStockProduction = await db.productionItem
      .include(item => item.lot)
      .include(item => item.production)
      .include(item => item.production!.instruction)
      .include(item => item.production!.equipment)
      .include(item => item.weightMeasurement)
      .where(item => [
        sorm.between(sorm.cast(item.createdAtDateTime, DateOnly), fromDate, toDate),
        sorm.and([
          sorm.equal(item.lot!.isTesting, false),
          sorm.equal(item.lot!.isNotStock, true)
        ])
      ])
      .groupBy(item => [
        item.production!.equipmentId,
        item.production!.equipment!.name
      ])
      .select(item => ({
        equipmentId: item.production!.equipmentId,
        equipmentName: item.production!.equipment!.name,
        quantity: sorm.sum(sorm.ifNull(item.weightMeasurement!.realWeight, item.weight)),
        length: sorm.sum(sorm.ifNull(item.length, 0))
      }))
      .resultAsync();

    //테스트 생산량(C) <- productionItem 중 테스트 생산 항목들만
    const groupByTestProduction = await db.productionItem
      .include(item => item.lot)
      .include(item => item.production)
      .include(item => item.production!.instruction)
      .include(item => item.production!.equipment)
      .include(item => item.weightMeasurement)
      .where(item => [
        sorm.between(sorm.cast(item.createdAtDateTime, DateOnly), fromDate, toDate),
        sorm.equal(item.lot!.isTesting, true)
      ])
      .groupBy(item => [
        item.production!.equipmentId,
        item.production!.equipment!.name
      ])
      .select(item => ({
        equipmentId: item.production!.equipmentId,
        equipmentName: item.production!.equipment!.name,
        quantity: sorm.sum(sorm.ifNull(item.weightMeasurement!.realWeight, item.weight)),
        length: sorm.sum(sorm.ifNull(item.length, 0))
      }))
      .resultAsync();

    //리와인더
    const groupByRewind = await db.rewindProcess
      .include(item => item.equipments)
      .where(item => [
        sorm.between(sorm.cast(item.modifyDate, DateOnly), fromDate, toDate)
      ])
      .groupBy(item => [
        item.equipmentId,
        item.equipments!.name
      ])
      .select(item => ({
        equipmentId: item.equipmentId,
        equipmentName: item.equipments!.name,
        quantity: sorm.sum(sorm.ifNull(item.productionWeight, 0)),
        length: sorm.sum(sorm.ifNull(item.productionQuantity, 0))
      }))
      .resultAsync();

    groupByProduction.push(...groupByRewind);

    // LDPE량 => 배합처리 화면에서 LDPE 반납한 량
    const groupByLdpe = await db.inputLdpeReturn
      .include(item => item.mixingProcess)
      .include(item => item.mixingProcess!.equipment)
      .where(item => [
        sorm.between(sorm.cast(item.createdAtDateTime, DateOnly), fromDate, toDate)
      ])
      .groupBy(item => [
        item.mixingProcess!.equipmentId,
        item.mixingProcess!.equipment!.name
      ])
      .select(item => ({
        equipmentId: item.mixingProcess!.equipmentId,
        equipmentName: item.mixingProcess!.equipment!.name,
        quantity: sorm.sum(sorm.ifNull(item.quantity, 0))
      }))
      .resultAsync();

    // 일반자재 반납 => 배합처리 화면에서 일반자재 반납한 량
    const groupByGeneralReturn = await db.inputGeneralReturn
      .include(item => item.mixingProcess)
      .include(item => item.mixingProcess!.equipment)
      .where(item => [
        sorm.between(sorm.cast(item.createdAtDateTime, DateOnly), fromDate, toDate)
      ])
      .groupBy(item => [
        item.mixingProcess!.equipmentId,
        item.mixingProcess!.equipment!.name
      ])
      .select(item => ({
        equipmentId: item.mixingProcess!.equipmentId,
        equipmentName: item.mixingProcess!.equipment!.name,
        quantity: sorm.sum(sorm.ifNull(item.quantity, 0))
      }))
      .resultAsync();

    // 재생가능 스크랩 => 공정관리 > 생산실적 등록 > 스크랩 등록 에서 '재생 가능'으로 등록 된 스크랩 량
    const groupByRepairScrap = await db.scrap
      .include(item => item.production)
      .include(item => item.production!.equipment)
      .where(item => [
        sorm.equal(item.rating, "재생 가능"),
        sorm.between(item.occurrenceDate, fromDate, toDate)
      ])
      .groupBy(item => [
        item.production!.equipmentId,
        item.production!.equipment!.name
      ])
      .select(item => ({
        equipmentId: item.production!.equipmentId,
        equipmentName: item.production!.equipment!.name,
        weight: sorm.sum(sorm.ifNull(item.weight, 0))
      }))
      .resultAsync();

    //재생 불가능 스크랩 => 공정관리 > 생산실적 등록 > 스크랩 등록 에서 '재생 불가능'으로 등록 된 스크랩 량
    const groupByNotRepairScrap = await db.scrap
      .include(item => item.production)
      .include(item => item.production!.equipment)
      .where(item => [
        sorm.equal(item.rating, "재생 불가"),
        sorm.between(item.occurrenceDate, fromDate, toDate)
      ])
      .groupBy(item => [
        item.production!.equipmentId,
        item.production!.equipment!.name
      ])
      .select(item => ({
        equipmentId: item.production!.equipmentId,
        equipmentName: item.production!.equipment!.name,
        weight: sorm.sum(sorm.ifNull(item.weight, 0))
      }))
      .resultAsync();

    //밀어내기량 => 공정관리 > 밀어내기에서 발생한 량
    const groupByPushProcess = await db.pushProcessItem
      .include(item => item.pushProcess)
      .include(item => item.pushProcess!.equipment)
      .where(item => [
        sorm.between(sorm.cast(item.createdAtDateTime, DateOnly), fromDate, toDate)
      ])
      .groupBy(item => [
        item.pushProcess!.equipmentId,
        item.pushProcess!.equipment!.name
      ])
      .select(item => ({
        equipmentId: item.pushProcess!.equipmentId,
        equipmentName: item.pushProcess!.equipment!.name,
        quantity: sorm.sum(sorm.ifNull(item.weight, 0))
      }))
      .resultAsync();

    if (equipmentInfo) {
      this.barChartData = [];

      for (let seq = 0; seq <= equipmentInfo.length; seq++) {
        result.push({
          equipmentId: equipmentInfo[seq] ? equipmentInfo[seq].equipmentId : undefined,
          equipmentName: equipmentInfo[seq] ? equipmentInfo[seq].equipmentName : undefined,
          equipmentInfo: [{
            type: undefined,
            quantity: undefined
          }]
        });

        result![seq].equipmentInfo!.shift();

        if (seq !== equipmentInfo!.length) {

          //배합량
          const inputQuantity = groupByInputHistory && groupByInputHistory.filter(item => item.equipmentId === equipmentInfo[seq].equipmentId) ?
            (groupByInputHistory.filter(item => item.equipmentId === equipmentInfo[seq].equipmentId).sum(item => item.quantity || 0) || 0) : 0;
          result![seq].equipmentInfo!.push({
            type: "배합량",
            quantity: inputQuantity || 0
          });

          //생산중량(A) (리와인더 포함)
          const productionWeight = groupByProduction && groupByProduction.filter(item => item.equipmentId === equipmentInfo[seq].equipmentId) ?
            groupByProduction.filter(item => item.equipmentId === equipmentInfo[seq].equipmentId).sum(item => item.quantity || 0) : 0;

          //생산 LOSS량(무게)
          const productionIsNotStockWeight = groupByIsNotStockProduction && groupByIsNotStockProduction.filter(item => item.equipmentId === equipmentInfo[seq].equipmentId) ?
            groupByIsNotStockProduction.filter(item => item.equipmentId === equipmentInfo[seq].equipmentId).sum(item => item.quantity || 0) : 0;

          //LDPE량
          const ldpeWeight = groupByLdpe && groupByLdpe.filter(item => item.equipmentId === equipmentInfo[seq].equipmentId) ?
            groupByLdpe.filter(item => item.equipmentId === equipmentInfo[seq].equipmentId).sum(item => item.quantity || 0) : 0;

          //생산중량 : (생산중량 - 생산 LOSS량) + LDPE량
          const realProductionWeight = (((productionWeight || 0) - (productionIsNotStockWeight || 0)) + (ldpeWeight || 0));
          result![seq].equipmentInfo!.push({
            type: "생산중량",
            quantity: realProductionWeight
          });

          //생산길이(A) (리와인더 포함)
          const productionLength = groupByProduction && groupByProduction.filter(item => item.equipmentId === equipmentInfo[seq].equipmentId) ?
            groupByProduction.filter(item => item.equipmentId === equipmentInfo[seq].equipmentId).sum(item => item.length || 0) : 0;

          //생산 LOSS량(길이)
          const productionIsNotLength = groupByIsNotStockProduction && groupByIsNotStockProduction.filter(item => item.equipmentId === equipmentInfo[seq].equipmentId) ?
            groupByIsNotStockProduction.filter(item => item.equipmentId === equipmentInfo[seq].equipmentId).sum(item => item.length || 0) : 0;

          result![seq].equipmentInfo!.push({
            type: "생산량",
            quantity: (productionLength || 0) - (productionIsNotLength || 0)
          });

          const repairScrap = groupByRepairScrap && groupByRepairScrap.filter(item => item.equipmentId === equipmentInfo[seq].equipmentId) ?
            groupByRepairScrap.filter(item => item.equipmentId === equipmentInfo[seq].equipmentId).sum(item => item.weight || 0) : 0;
          result![seq].equipmentInfo!.push({
            type: "재생가능 스크랩",
            quantity: repairScrap || 0
          });

          const noRepairScrap = groupByNotRepairScrap && groupByNotRepairScrap.filter(item => item.equipmentId === equipmentInfo[seq].equipmentId) ?
            groupByNotRepairScrap.filter(item => item.equipmentId === equipmentInfo[seq].equipmentId).sum(item => item.weight || 0) : 0;
          result![seq].equipmentInfo!.push({
            type: "재생 불가능 스크랩",
            quantity: noRepairScrap || 0
          });

          // 자재 반납
          const generalReturnWeight = groupByGeneralReturn && groupByGeneralReturn.filter(item => item.equipmentId === equipmentInfo[seq].equipmentId) ?
            groupByGeneralReturn.filter(item => item.equipmentId === equipmentInfo[seq].equipmentId).sum(item => item.quantity || 0) : 0;

          //밀어내기량
          const pushQuantity = groupByPushProcess && groupByPushProcess.filter(item => item.equipmentId === equipmentInfo[seq].equipmentId) ?
            groupByPushProcess.filter(item => item.equipmentId === equipmentInfo[seq].equipmentId).sum(item => item.quantity || 0) : 0;

          // 테스트 생산량
          const productionTestQuantity = groupByTestProduction && groupByTestProduction.filter(item => item.equipmentId === equipmentInfo[seq].equipmentId) ?
            groupByTestProduction.filter(item => item.equipmentId === equipmentInfo[seq].equipmentId).sum(item => item.quantity || 0) : 0;

          //언비져블: 투입량 - ((테스트생산량 + 생산중량) + LDPE량) - (재생가능스크랩 + 재생불가능스크랩) - 자재반납
          const uvQuantity = inputQuantity - (((productionTestQuantity || 0) + (productionWeight || 0)) + (ldpeWeight || 0)) - ((repairScrap || 0) + (noRepairScrap || 0)) - (generalReturnWeight || 0);

          //LOSS량: (재생가능스크랩 + 재생불가능스크랩) + 밀어내기 + 언비져블)
          const lossQuantity = ((repairScrap || 0) + (noRepairScrap || 0)) + (pushQuantity || 0) + (uvQuantity || 0);
          result![seq].equipmentInfo!.push({
            type: "LOSS량",
            quantity: lossQuantity || 0
          });

          //LOSS율: (생산중량 / (투입량 - 테스트생산량))
          const lossPercent = isNaN(realProductionWeight / (inputQuantity - (productionTestQuantity || 0)))
          || (realProductionWeight / (inputQuantity - (productionTestQuantity || 0))) === Infinity
          || (realProductionWeight / (inputQuantity - (productionTestQuantity || 0))) === -Infinity
            ? 0 : (realProductionWeight / (inputQuantity - (productionTestQuantity || 0)))!;
          result![seq].equipmentInfo!.push({
            type: "LOSS율",
            quantity: (lossPercent * 100) || 0
          });

          result![seq].equipmentInfo!.push({
            type: "언비저블",
            quantity: uvQuantity || 0
          });

          result![seq].equipmentInfo!.push({
            type: "LDPE 자재 출고분",
            quantity: ldpeWeight || 0
          });
        }
        // 모든 설비 내용 합계
        else {
          const inputQuantity = groupByInputHistory && groupByInputHistory.length > 0 ? (groupByInputHistory.sum(item => item.quantity || 0) || 0) : 0;
          result![seq].equipmentInfo!.push({
            type: "배합량",
            quantity: inputQuantity || 0
          });

          const productionWeight = groupByProduction && groupByProduction.length > 0 ? groupByProduction.sum(item => item.quantity || 0) : 0;
          const productionIsNotStockWeight = groupByIsNotStockProduction && groupByIsNotStockProduction.length > 0 ? groupByIsNotStockProduction.sum(item => item.quantity || 0) : 0;
          const ldpeWeight = groupByLdpe && groupByLdpe.length > 0 ? groupByLdpe.sum(item => item.quantity || 0) : 0;

          const realProductionWeight = (((productionWeight || 0) - (productionIsNotStockWeight || 0)) + (ldpeWeight || 0));

          result![seq].equipmentInfo!.push({
            type: "생산중량",
            quantity: realProductionWeight
          });

          const productionLength = groupByProduction && groupByProduction.length > 0 ? groupByProduction.sum(item => item.length || 0) : 0;
          const productionIsNotLength = groupByIsNotStockProduction && groupByIsNotStockProduction.length > 0 ? groupByIsNotStockProduction.sum(item => item.length || 0) : 0;
          result![seq].equipmentInfo!.push({
            type: "생산량",
            quantity: (productionLength || 0) - (productionIsNotLength || 0)
          });

          const repairScrap = groupByRepairScrap && groupByRepairScrap.length > 0 ? groupByRepairScrap.sum(item => item.weight || 0) : 0;
          result![seq].equipmentInfo!.push({
            type: "재생가능 스크랩",
            quantity: repairScrap
          });

          const noRepairScrap = groupByNotRepairScrap && groupByNotRepairScrap.length > 0 ? groupByNotRepairScrap.sum(item => item.weight || 0) : 0;
          result![seq].equipmentInfo!.push({
            type: "재생 불가능 스크랩",
            quantity: noRepairScrap || 0
          });

          const generalReturnWeight = groupByGeneralReturn && groupByGeneralReturn.length > 0 ? groupByGeneralReturn.sum(item => item.quantity || 0) : 0;
          const pushQuantity = groupByPushProcess && groupByPushProcess.length > 0 ? groupByPushProcess.sum(item => item.quantity || 0) : 0;
          const productionTestQuantity = groupByTestProduction && groupByTestProduction.length > 0 ? groupByTestProduction.sum(item => item.quantity || 0) : 0;


          const uvQuantity = (inputQuantity || 0) - (((productionTestQuantity || 0) + (productionWeight || 0)) + (ldpeWeight || 0)) - ((repairScrap || 0) + (noRepairScrap || 0)) - (generalReturnWeight || 0);

          const lossQuantity = ((repairScrap || 0) + (noRepairScrap || 0)) + (pushQuantity || 0) + (uvQuantity || 0);

          result![seq].equipmentInfo!.push({
            type: "LOSS량",
            quantity: lossQuantity || 0
          });

          const lossPercent = isNaN(realProductionWeight / (inputQuantity - (productionTestQuantity || 0)))
          || (realProductionWeight / (inputQuantity - (productionTestQuantity || 0))) === Infinity
          || (realProductionWeight / (inputQuantity - (productionTestQuantity || 0))) === -Infinity
            ? 0 : (realProductionWeight / (inputQuantity - (productionTestQuantity || 0)))!;

          result![seq].equipmentInfo!.push({
            type: "LOSS율",
            quantity: lossPercent * 100 || 0
          });

          result![seq].equipmentInfo!.push({
            type: "언비저블",
            quantity: uvQuantity || 0
          });

          result![seq].equipmentInfo!.push({
            type: "LDPE 자재 출고분",
            quantity: ldpeWeight || 0
          });
        }
      }
    }

    return result;
  }
}

interface IFilterVM {
  fromDate?: DateOnly;
  toDate?: DateOnly;
}

interface IProductionStatusVM {
  equipmentId: number | undefined;
  equipmentName: string | undefined;
  equipmentInfo: IProductionEquipmentInfoVM[] | undefined;
}

interface IProductionEquipmentInfoVM {
  type: "배합량" | "생산중량" | "생산량" | "재생가능 스크랩" | "재생 불가능 스크랩" | "LOSS량" | "LOSS율" | "언비저블" | "LDPE 자재 출고분" | undefined;
  quantity: number | undefined;
}