import {ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnInit, ViewChild} from "@angular/core";
import {BaseChartDirective} from "ng2-charts";
import {SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {DateOnly} from "@simplism/core";
import {MainDbContext} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {ExcelWorkbook} from "@simplism/excel";

@Component({
  selector: "app-equipment-production-personnel-status",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>호기별 생산 일수 및 생산인원</h4>

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
                  <canvas #chart
                          baseChart width="400" height="100"
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
              <sd-dock class="sd-background-white sd-padding-sm-default" *ngIf="items && items.length > 0">
                <table>
                  <thead>
                  <tr>
                    <th [colSpan]="4" class="sd-padding-sm-xs" style="width: 15%">년도</th>
                    <th [colSpan]="6" class="sd-padding-sm-xs"
                        style="width: 30%">{{ lastFilter.year + '년 1/4 ~ 2/4 분기' }}</th>
                    <th [colSpan]="6" class="sd-padding-sm-xs"
                        style="width: 30%">{{ lastFilter.year + '년 3/4 ~ 4/4 분기' }}</th>
                    <th [colSpan]="2" [rowSpan]="2" class="sd-padding-sm-xs"
                        style="width: 10%">호기별 합계
                    </th>
                  </tr>
                  <tr class="test">
                    <th class="sd-padding-sm-xs" style="text-align: center;" [colSpan]="3"> 구분</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 30px;"> 단위</th>
                    <ng-container *ngFor="let month of [1,2,3,4,5,6,7,8,9,10,11,12]; trackBy: trackByMeFn">
                      <th class="sd-padding-xs-sm" style="width: 6%"> {{ month + '월' }}</th>
                    </ng-container>
                  </tr>
                  </thead>
                  <tbody>
                  <tr>
                    <td [rowSpan]="items.length* 3" [width]="30">실<br>중<br>량</td>
                  </tr>
                  <ng-container *ngFor="let input of items; trackBy: trackByMeFn">
                    <tr>
                      <td *ngIf="!!input.equipmentId" [rowSpan]="3">{{ input.equipmentName }}</td>
                      <td *ngIf="!input.equipmentId" [rowSpan]="3" [colSpan]="3">생산량 합계</td>
                      <td *ngIf="!!input.equipmentId" style="background-color: bisque;">생산량</td>
                      <td *ngIf="!!input.equipmentId" style="background-color: bisque;">m</td>
                      <td class="sd-padding-xs-sm" style="background-color: bisque;"
                          *ngFor="let inputItem of input.productionDataInfo; trackBy: trackByMeFn">
                        {{ inputItem.quantity | number }}
                      </td>
                      <td [colSpan]="2" class="sd-padding-xs-sm" style="text-align: right; background-color: bisque;">
                        {{ input.totalQuantity | number }}
                      </td>
                    </tr>
                    <tr *ngIf="!!input.equipmentId">
                      <td>생산일수</td>
                      <td>일</td>
                      <td class="sd-padding-xs-sm"
                          *ngFor="let inputItem of input.productionDataInfo; trackBy: trackByMeFn">
                        {{ inputItem.productionDay | number }}
                      </td>
                      <td class="sd-padding-xs-sm" style="width: 50px;">
                        {{ input.totalProductionDay | number }} 일
                      </td>
                      <td class="sd-padding-xs-sm">
                        {{ input.totalProductionDay | number }} 시간
                      </td>
                    </tr>
                    <tr *ngIf="!!input.equipmentId">
                      <td>투입현황</td>
                      <td>인</td>
                      <td *ngFor="let inputItem of input.productionDataInfo; trackBy: trackByMeFn">
                        <sd-textfield [(value)]="inputItem.inputEmployee" [type]="'number'"></sd-textfield>
                      </td>
                      <td [colSpan]="2" class="sd-padding-xs-sm">

                      </td>
                    </tr>
                  </ng-container>
                  </tbody>
                </table>
              </sd-dock>

            </sd-dock-container>
          </sd-busy-container>
        </sd-dock-container>
      </sd-topbar-container>
    </sd-busy-container>`,
  styles: [/* language=SCSS */ `
    .test {
      border-right: none;
    }

    table {
      border-collapse: collapse;
      border: 1px solid darkolivegreen;
      width: 100%;
      height: 100%;
    }

    thead {
      background: #EEEEEE;
    }

    th, td {
      border: 1px solid darkolivegreen;
      text-align: center;
      height: 30px;
    }
  `]
})
export class EquipmentProductionPersonnelStatusPage implements OnInit {
  public filter: IFilterVM = {
    year: new DateOnly().year
  };

  public pagination = {page: 0, length: 0};

  public yearList = [] as number[];

  public lastFilter?: IFilterVM;

  public items?: IProductionInstructionReportVM[] = [];

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public barChartOptions: any = {
    responsive: true,
    title: {
      text: "호기별 생산량m",
      fontSize: 23,
      display: true
    },
    scales: {
      yAxes: [
        {
          position: "left",
          ticks: {
            beginAtZero: true
          }
        }
      ]
    }
  };

  public barChartLabels: string[] = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
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
    this.filter.year = new DateOnly().year;

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

      if (!this.lastFilter!.year) {
        this._toast.danger("검색기간을 정확히 입력해 주세요.");
        return;
      }

      const year = this.filter.year;

      const headerStyle = {
        alignH: "center",
        background: "CCCCCCCC",
        foreground: "FFFFFFFF",
        bold: true
      };

      const quantityStyle = {
        alignH: "center",
        background: "FFFFE4C4"
      };

      const month: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

      const nowItemsLength = this.items!.length;

      const wb = ExcelWorkbook.create();
      const ws = wb.createWorksheet(`호기별 생산 일수 및 생산인원`);

      //엑셀작업시작
      ws.cell(0, 0).merge(0, month.length + 5);
      ws.cell(0, 0).value = "호기별 생산 일수 및 생산인원(" + year + ")";
      ws.cell(1, 0).merge(1, 3);
      ws.cell(1, 0).value = "년도";
      Object.assign(ws.cell(1, 0).style, headerStyle);
      ws.cell(1, 4).merge(1, 9);
      ws.cell(1, 4).value = year + "년 1/4 ~ 2/4 분기";
      Object.assign(ws.cell(1, 4).style, headerStyle);
      ws.cell(1, 10).merge(1, 15);
      ws.cell(1, 10).value = year + "년 3/4 ~ 4/4 분기";
      Object.assign(ws.cell(1, 10).style, headerStyle);
      ws.cell(2, 0).merge(2, 2);
      ws.cell(2, 0).value = "구분";
      Object.assign(ws.cell(2, 0).style, headerStyle);
      ws.cell(2, 3).value = "단위";
      Object.assign(ws.cell(2, 3).style, headerStyle);

      for (let seq = 1; seq <= month.length; seq++) {
        ws.cell(2, seq + 3).value = seq + "월";
        Object.assign(ws.cell(2, seq + 3).style, headerStyle);
      }
      ws.cell(1, 16).merge(2, 17);
      ws.cell(1, 16).value = "호기별 합계";
      Object.assign(ws.cell(1, 16).style, headerStyle);
      ws.cell(3, 0).merge(3 + (nowItemsLength * 3) - 3, 0);
      ws.cell(3, 0).value = "실중량";

      let nowScrapSeq = 0;
      for (const nowScrapItem of this.items! || []) {

        if (nowScrapItem.equipmentName !== undefined) {
          ws.cell(3 + (3 * nowScrapSeq), 1).merge(3 + 3 * (nowScrapSeq + 1) - 1, 1);
          ws.cell(3 + (3 * nowScrapSeq), 1).value = nowScrapItem.equipmentName;
          ws.cell(3 + 3 * nowScrapSeq, 2).value = "생산량";
          Object.assign(ws.cell(3 + 3 * nowScrapSeq, 2).style, quantityStyle);
          ws.cell(3 + 3 * nowScrapSeq + 1, 2).value = "생산일수";
          ws.cell(3 + 3 * nowScrapSeq + 2, 2).value = "투입현황";
          ws.cell(3 + 3 * nowScrapSeq, 3).value = "m";
          Object.assign(ws.cell(3 + 3 * nowScrapSeq, 3).style, quantityStyle);
          ws.cell(3 + 3 * nowScrapSeq + 1, 3).value = "일";
          ws.cell(3 + 3 * nowScrapSeq + 2, 3).value = "인";

          let scrapSeq = 0;
          for (const nowScrapItem2 of this.items![nowScrapSeq].productionDataInfo || []) {
            nowScrapItem2.quantity === Infinity ? ws.cell(3 + 3 * nowScrapSeq, 4 + scrapSeq).value = "∞"
              : isNaN(nowScrapItem2.quantity!) ? ws.cell(3 + 3 * nowScrapSeq, 4 + scrapSeq).value = undefined
              : ws.cell(3 + 3 * nowScrapSeq, 4 + scrapSeq).value = nowScrapItem2.quantity;
            Object.assign(ws.cell(3 + 3 * nowScrapSeq, 4 + scrapSeq).style, quantityStyle);
            nowScrapItem2.productionDay === Infinity ? ws.cell(3 + 3 * nowScrapSeq + 1, 4 + scrapSeq).value = "∞"
              : isNaN(nowScrapItem2.productionDay!) ? ws.cell(3 + 3 * nowScrapSeq + 1, 4 + scrapSeq).value = undefined
              : ws.cell(3 + 3 * nowScrapSeq + 1, 4 + scrapSeq).value = nowScrapItem2.productionDay;
            nowScrapItem2.inputEmployee === Infinity ? ws.cell(3 + 3 * nowScrapSeq + 2, 4 + scrapSeq).value = "∞"
              : isNaN(nowScrapItem2.inputEmployee!) ? ws.cell(3 + 3 * nowScrapSeq + 2, 4 + scrapSeq).value = undefined
              : ws.cell(3 + 3 * nowScrapSeq + 2, 4 + scrapSeq).value = nowScrapItem2.inputEmployee;
            scrapSeq++;
          }

          ws.cell(3 + 3 * nowScrapSeq, month.length + 4).merge(3 + 3 * nowScrapSeq, month.length + 5);
          nowScrapItem.totalQuantity === Infinity ? ws.cell(3 + 3 * nowScrapSeq, month.length + 4).value = "∞"
            : isNaN(nowScrapItem.totalQuantity!) ? ws.cell(3 + 3 * nowScrapSeq, month.length + 4).value = undefined
            : ws.cell(3 + 3 * nowScrapSeq, month.length + 4).value = nowScrapItem.totalQuantity;
          Object.assign(ws.cell(3 + 3 * nowScrapSeq, month.length + 4).style, quantityStyle);
          ws.cell(3 + 3 * nowScrapSeq + 1, month.length + 4).value = nowScrapItem.totalProductionDay + " 일";
          ws.cell(3 + 3 * nowScrapSeq + 1, month.length + 5).value = (Number(nowScrapItem.totalProductionDay) * 24) + " 시간";
          ws.cell(3 + 3 * nowScrapSeq + 2, month.length + 4).merge(3 + 3 * nowScrapSeq + 2, month.length + 5);
          nowScrapItem.totalInputEmployee === Infinity ? ws.cell(3 + 3 * nowScrapSeq + 2, month.length + 4).value = "∞"
            : isNaN(nowScrapItem.totalInputEmployee!) ? ws.cell(3 + 3 * nowScrapSeq + 2, month.length + 4).value = undefined
            : ws.cell(3 + 3 * nowScrapSeq + 2, month.length + 4).value = nowScrapItem.totalInputEmployee;

        }
        else {
          ws.cell(3 + (3 * nowScrapSeq), 1).merge(3 + (3 * nowScrapSeq), 3);
          ws.cell(3 + (3 * nowScrapSeq), 1).value = "생산량 합계";

          let scrapSeq = 0;
          for (const nowScrapItem2 of this.items![nowScrapSeq].productionDataInfo || []) {
            nowScrapItem2.quantity === Infinity ? ws.cell(3 + (3 * nowScrapSeq), 4 + scrapSeq).value = "∞"
              : isNaN(nowScrapItem2.quantity!) ? ws.cell(3 + (3 * nowScrapSeq), 4 + scrapSeq).value = undefined
              : ws.cell(3 + (3 * nowScrapSeq), 4 + scrapSeq).value = nowScrapItem2.quantity;
            Object.assign(ws.cell(3 + (3 * nowScrapSeq), 4 + scrapSeq).style, quantityStyle);
            scrapSeq++;
          }

          ws.cell(3 + (3 * nowScrapSeq), month.length + 4).merge(3 + (3 * nowScrapSeq), month.length + 5);
          nowScrapItem.totalQuantity === Infinity ? ws.cell(3 + (3 * nowScrapSeq), month.length + 4).value = "∞"
            : isNaN(nowScrapItem.totalQuantity!) ? ws.cell(3 + (3 * nowScrapSeq), month.length + 4).value = undefined
            : ws.cell(3 + (3 * nowScrapSeq), month.length + 4).value = nowScrapItem.totalQuantity;
          Object.assign(ws.cell(3 + (3 * nowScrapSeq), month.length + 4).style, quantityStyle);

        }
        nowScrapSeq++;
      }

      const title = "호기별 생산 일수 및 생산인원(" + year + ").xlsx";
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
    link.download = "호기별 생산 일수 및 생산인원(" + this.lastFilter!.year + ").jpg";
    link.click();
  }

  public async onSearchFormSubmit(): Promise<void> {
    this.lastFilter = Object.clone(this.filter);

    await this._search();
    this._cdr.markForCheck();
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
        for (const items of this.items || []) {
          if (items.equipmentId !== undefined) {
            await db.productionInputEmployee.where(item1 => [sorm.equal(item1.year, this.lastFilter!.year!), sorm.equal(item1.equipmentId, items.equipmentId)]).deleteAsync();

            for (const item of items.productionDataInfo || []) {
              if (!!item.inputEmployee && item.inputEmployee !== 0) {
                await db.productionInputEmployee
                  .insertAsync({
                    companyId: 1,
                    year: this.lastFilter!.year!,
                    month: item.month!,
                    equipmentId: items.equipmentId!,
                    inputEmployeeQuantity: item.inputEmployee!
                  });
              }
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

  private async _search(): Promise<void> {
    if (!this.lastFilter) return;

    this.mainBusyCount++;
    try {
      await this._orm.connectAsync(MainDbContext, async db => {

        this.items = [];
        this.barChartData = [];

        const nowFromDate = new DateOnly(this.lastFilter!.year!, 1, 1);
        const nowToDate = new DateOnly(this.lastFilter!.year!, 12, 31);

        this.items = await this._getStatus(db, nowFromDate!, nowToDate!);

        this.barChartData = [];

        for (const item of this.items || []) {
          this.barChartData.push({
            data: [
              item.productionDataInfo![0].quantity,
              item.productionDataInfo![1].quantity,
              item.productionDataInfo![2].quantity,
              item.productionDataInfo![3].quantity,
              item.productionDataInfo![4].quantity,
              item.productionDataInfo![5].quantity,
              item.productionDataInfo![6].quantity,
              item.productionDataInfo![7].quantity,
              item.productionDataInfo![8].quantity,
              item.productionDataInfo![9].quantity,
              item.productionDataInfo![10].quantity,
              item.productionDataInfo![11].quantity
            ],
            label: item.equipmentName || "생산량 합계"
          });
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

  private async _getStatus(db: MainDbContext, firstDate: DateOnly, lastDate: DateOnly): Promise<any[] | undefined> {
    const result: IProductionInstructionReportVM[] = [];

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

    // 생산량
    let groupByProduction: any[] = [];
    groupByProduction = await db.productionItem
      .include(item => item.production)
      .include(item => item.production!.equipment)
      .where(item => [
        sorm.between(sorm.cast(item.createdAtDateTime, DateOnly), firstDate, lastDate)
      ])
      .groupBy(item => [
        sorm.query("DATEPART(MM, [TBL].createdAtDateTime)", Number),
        item.production!.equipmentId,
        item.production!.equipment!.name
      ])
      .select(item => ({
        month: sorm.query("DATEPART(MM, [TBL].createdAtDateTime)", Number),
        equipmentId: item.production!.equipmentId,
        equipmentName: item.production!.equipment!.name,
        quantity: sorm.sum(sorm.ifNull(item.length, 0))
      }))
      .resultAsync();


    // 리와인더 생산량
    let groupByRewindProduction: any[] = [];
    groupByRewindProduction = await db.rewindProcess
      .include(item => item.equipments)
      .where(item => [
        sorm.equal(item.isCanceled, false),
        sorm.between(sorm.cast(item.modifyDate, DateOnly), firstDate, lastDate)
      ])
      .groupBy(item => [
        sorm.query("DATEPART(MM, [TBL].modifyDate)", Number),
        item.equipmentId,
        item.equipments!.name
      ])
      .select(item => ({
        month: sorm.query("DATEPART(MM, [TBL].modifyDate)", Number),
        equipmentId: item.equipmentId,
        equipmentName: item.equipments!.name,
        quantity: sorm.sum(sorm.ifNull(item.productionQuantity, 0))
      }))
      .resultAsync();

    groupByProduction.push(...groupByRewindProduction);

    // LDPE량
    const groupByLdpe = await db.inputLdpeReturn
      .include(item => item.mixingProcess)
      .include(item => item.mixingProcess!.equipment)
      .where(item => [
        sorm.between(sorm.cast(item.createdAtDateTime, DateOnly), firstDate, lastDate)
      ])
      .groupBy(item => [
        sorm.query("DATEPART(MM, [TBL].createdAtDateTime)", Number),
        item.mixingProcess!.equipmentId,
        item.mixingProcess!.equipment!.name
      ])
      .select(item => ({
        month: sorm.query("DATEPART(MM, [TBL].createdAtDateTime)", Number),
        equipmentId: item.mixingProcess!.equipmentId,
        equipmentName: item.mixingProcess!.equipment!.name,
        quantity: sorm.sum(sorm.ifNull(item.quantity, 0))
      }))
      .resultAsync();

    let groupByInputEmployee: any[] = [];
    groupByInputEmployee = await db.productionInputEmployee
      .where(item => [
        sorm.equal(item.year, firstDate.year)
      ])
      .groupBy(item => [
        item.month,
        item.equipmentId
      ])
      .select(item => ({
        month: item.month,
        equipmentId: item.equipmentId,
        quantity: sorm.sum(sorm.ifNull(item.inputEmployeeQuantity, 0))
      }))
      .resultAsync();

    for (const equipmentItem of equipmentInfo || []) {
      if (groupByProduction.filter(item => item.equipmentId === equipmentItem.equipmentId).length < 1) {
        groupByProduction.push({
          month: undefined,
          equipmentId: equipmentItem.equipmentId!,
          equipmentName: equipmentItem.equipmentName,
          quantity: 0
        });
      }

      if (groupByInputEmployee.filter(item => item.equipmentId === equipmentItem.equipmentId).length < 1) {
        groupByInputEmployee.push({
          month: undefined,
          equipmentId: equipmentItem.equipmentId!,
          quantity: 0
        });
      }
    }

    const groupByEquipments = groupByProduction
      .groupBy(item => ({
        equipmentId: item.equipmentId,
        equipmentName: item.equipmentName
      }))
      .map(item => ({
        equipmentId: item.key.equipmentId,
        equipmentName: item.key.equipmentName,
        totalQuantity: item.values.sum(item1 => item1.quantity)
      }));

    const groupByMonth: any[] = [];
    for (let i = 1; i < 12; i++) {
      const lepeQuatnity = groupByLdpe && groupByLdpe.filter(item => item.month === i).sum(item => item.quantity || 0);

      groupByMonth.push({
        month: i,
        quantity: groupByProduction && (groupByProduction.filter(item => item.month === i).sum(item => item.quantity || 0) + (lepeQuatnity || 0)),
        productionDay: 30,
        inputEmployee: groupByInputEmployee && groupByInputEmployee.filter(item => item.month === i).sum(item => item.quantity || 0)
      });
    }

    for (let seq = 0; seq <= groupByEquipments.length; seq++) {
      if (groupByEquipments[seq]) {
        const lepeQuatnity = groupByLdpe && groupByLdpe.filter(item => item.equipmentId === groupByEquipments[seq].equipmentId).sum(item => item.quantity || 0);

        result.push({
          equipmentId: groupByEquipments[seq].equipmentId,
          equipmentName: groupByEquipments[seq].equipmentName,
          productionDataInfo: [{
            month: undefined,
            quantity: undefined,
            productionDay: undefined,
            inputEmployee: undefined
          }],
          totalQuantity: groupByEquipments[seq].totalQuantity + (lepeQuatnity || 0),
          totalProductionDay: 365,
          totalInputEmployee: groupByInputEmployee[seq] ? groupByInputEmployee[seq].totalQuantity : groupByMonth.sum(item => item.inputEmployee || 0)
        });
      }
      else {
        result.push({
          equipmentId: undefined,
          equipmentName: undefined,
          productionDataInfo: [{
            month: undefined,
            quantity: undefined,
            productionDay: undefined,
            inputEmployee: undefined
          }],
          totalQuantity: groupByMonth.sum(item => item.quantity || 0),
          totalProductionDay: 365,
          totalInputEmployee: groupByInputEmployee[seq] ? groupByInputEmployee[seq].totalQuantity : groupByMonth.sum(item => item.inputEmployee || 0)
        });
      }


      result[seq].productionDataInfo!.shift();

      if (seq !== groupByEquipments!.length) {
        for (let i = 1; i <= 12; i++) {
          const lepeQuatnity = !!groupByEquipments[seq] && groupByLdpe.filter(item => item.equipmentId === groupByEquipments[seq].equipmentId && item.month === i).length > 0 ?
            groupByLdpe.filter(item => item.equipmentId === groupByEquipments[seq].equipmentId && item.month === i).sum(item => item.quantity || 0) : 0;

          result![seq].productionDataInfo!.push({
            month: i,
            quantity: !!groupByEquipments[seq] && groupByProduction.filter(item => item.equipmentId === groupByEquipments[seq].equipmentId && item.month === i).length > 0 ?
              (groupByProduction.filter(item => item.equipmentId === groupByEquipments[seq].equipmentId && item.month === i).sum(item => item.quantity || 0) + lepeQuatnity) : undefined,
            productionDay: new Date(this.lastFilter!.year!, i, 0).getDate(),
            inputEmployee: !!groupByEquipments[seq] && groupByInputEmployee.filter(item => item.equipmentId === groupByEquipments[seq].equipmentId && item.month === i).length > 0 ?
              groupByInputEmployee.filter(item => item.equipmentId === groupByEquipments[seq].equipmentId && item.month === i).sum(item => item.quantity || 0) : undefined
          });
        }
      }
      else {
        for (let i = 1; i <= 12; i++) {
          result[seq].productionDataInfo!.push({
            month: i,
            quantity: groupByMonth.filter(item => item.month === i).length > 0 ?
              groupByMonth.filter(item => item.month === i).single()!.quantity : undefined,
            productionDay: groupByMonth.filter(item => item.month === i).length > 0 ?
              groupByMonth.filter(item => item.month === i).single()!.productionDay : undefined,
            inputEmployee: groupByMonth.filter(item => item.month === i).length > 0 ?
              groupByMonth.filter(item => item.month === i).single()!.inputEmployee : undefined
          });

        }
      }
    }

    return result;
  }

}

interface IFilterVM {
  year?: number;
}

interface IProductionInstructionReportVM {
  equipmentId: number | undefined;
  equipmentName: string | undefined;
  totalQuantity: number | undefined;
  totalProductionDay: number | undefined;
  totalInputEmployee: number | undefined;
  productionDataInfo: INowMonthProductionVM[] | undefined;
}

interface INowMonthProductionVM {
  month: number | undefined;
  quantity: number | undefined;
  productionDay: number | undefined;
  inputEmployee: number | undefined;
}

//TODO: 생산일 수 구하는거 변경해 줘야 함