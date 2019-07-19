import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild} from "@angular/core";
import {BaseChartDirective} from "ng2-charts";
import {SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {DateOnly} from "@simplism/core";
import {MainDbContext} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {ExcelWorkbook} from "@simplism/excel";

@Component({
  selector: "app-group-loss-status",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>그룹 별 LOSS 현황</h4>
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
              <sd-form-item [label]="'그릅'">
                <sd-select [(value)]="filter.group">
                  <sd-select-item [value]="'호기'">호기</sd-select-item>
                  <sd-select-item [value]="'Grade'"> Grade</sd-select-item>
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
                <div style="padding-top: 10px; padding-bottom: 10px;">
                  <table>
                    <thead>
                    <tr>
                      <th [colSpan]="3" class="sd-padding-sm-xs" style="width: 10%">년도</th>
                      <th [colSpan]="6" class="sd-padding-sm-xs"
                          style="width: 39%">{{ lastFilter.year + '년 1/4 ~ 2/4 분기' }}</th>
                      <th [colSpan]="6" class="sd-padding-sm-xs"
                          style="width: 39%">{{ lastFilter.year + '년 3/4 ~ 4/4 분기' }}</th>
                    </tr>
                    <tr class="test">
                      <th class="sd-padding-sm-xs" style="text-align: center;" [colSpan]="2"> 구분</th>
                      <th class="sd-padding-sm-xs" style="text-align: center; width: 60px;"> 단위</th>
                      <ng-container *ngFor="let month of [1,2,3,4,5,6,7,8,9,10,11,12]">
                        <th class="sd-padding-xs-sm" style="width: 6%"> {{ month + '월' }}</th>
                      </ng-container>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                      <td [rowSpan]=items.length [width]="30">실<br>중<br>량</td>
                    </tr>
                    <tr *ngFor="let input of items">
                      <td *ngIf="!!input.equipmentId">{{ input.equipmentName }}</td>
                      <td *ngIf="!input.equipmentId" [colSpan]="2">생산량 합계</td>
                      <td>Kg</td>
                      <td class="sd-padding-xs-sm" style="text-align: right;"
                          *ngFor="let inputItem of input.productionDataInfo">
                        {{ inputItem.quantity | number }}
                      </td>
                    </tr>
                    </tbody>
                  </table>
                </div>
                <div style="padding-top: 10px; padding-bottom: 10px;">
                  <table>
                    <thead>
                    <tr>
                      <th [colSpan]="3" class="sd-padding-sm-xs" style="width: 10%">년도</th>
                      <th [colSpan]="6" class="sd-padding-sm-xs"
                          style="width: 39%">{{ '전년도 1/4 ~ 2/4 분기' }}</th>
                      <th [colSpan]="6" class="sd-padding-sm-xs"
                          style="width: 39%">{{ '전년도 3/4 ~ 4/4 분기' }}</th>
                    </tr>
                    <tr class="test">
                      <th class="sd-padding-sm-xs" style="text-align: center;" [colSpan]="2"> 구분</th>
                      <th class="sd-padding-sm-xs" style="text-align: center; width: 60px;"> 단위</th>
                      <ng-container *ngFor="let month of [1,2,3,4,5,6,7,8,9,10,11,12]">
                        <th class="sd-padding-xs-sm" style="width: 6%"> {{ month + '월' }}</th>
                      </ng-container>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                      <td [rowSpan]=prevItems.length [width]="30">실<br>중<br>량</td>
                    </tr>
                    <tr *ngFor="let input of prevItems">
                      <td *ngIf="!!input.equipmentId">{{ input.equipmentName }}</td>
                      <td *ngIf="!input.equipmentId" [colSpan]="2">생산량 합계</td>
                      <td>Kg</td>
                      <td class="sd-padding-xs-sm" style="text-align: right;"
                          *ngFor="let inputItem of input.productionDataInfo">
                        {{ inputItem.quantity | number }}
                      </td>
                    </tr>
                    </tbody>
                  </table>
                </div>
                <div style="padding-top: 10px; padding-bottom: 10px;">
                  <table>
                    <thead>
                    <tr>
                      <th [colSpan]="3" class="sd-padding-sm-xs" style="width: 10%">년도</th>
                      <th [colSpan]="6" class="sd-padding-sm-xs"
                          style="width: 39%">전년동기대비증감
                      </th>
                      <th [colSpan]="6" class="sd-padding-sm-xs"
                          style="width: 39%">전년동기대비증감
                      </th>
                    </tr>
                    <tr class="test">
                      <th class="sd-padding-sm-xs" style="text-align: center;" [colSpan]="2"> 구분</th>
                      <th class="sd-padding-sm-xs" style="text-align: center; width: 60px;"> 단위</th>
                      <ng-container *ngFor="let month of [1,2,3,4,5,6,7,8,9,10,11,12]">
                        <th class="sd-padding-xs-sm" style="width: 6%"> {{ month + '월' }}</th>
                      </ng-container>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                      <td [rowSpan]=increaseItems.length [width]="30">실<br>중<br>량</td>
                    </tr>
                    <tr *ngFor="let input of increaseItems">
                      <td *ngIf="!!input.equipmentId">{{ input.equipmentName }}</td>
                      <td *ngIf="!input.equipmentId" [colSpan]="2">생산량 합계</td>
                      <td>Kg</td>
                      <td class="sd-padding-xs-sm" style="text-align: right;"
                          *ngFor="let inputItem of input.productionDataInfo">
                        {{ inputItem.quantity | number }}
                      </td>
                    </tr>
                    </tbody>
                  </table>
                </div>

              </sd-dock>

            </sd-dock-container>
          </sd-busy-container>
        </sd-dock-container>
      </sd-topbar-container>
    </sd-busy-container> `,
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
export class GroupLossStatusPage implements OnInit {
  public filter: IFilterVM = {
    year: undefined,
    group: "호기"
  };

  public pagination = {page: 0, length: 0};

  public yearList = [] as number[];

  public lastFilter?: IFilterVM;

  public items?: IProductionInstructionReportVM[] = [];
  public prevItems?: IProductionInstructionReportVM[] = [];
  public increaseItems?: IProductionInstructionReportVM[] = [];

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public barChartOptions: any = {
    responsive: true,
    title: {
      text: "호기별 Loss량",
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

      if (!this.lastFilter!.year || !this.lastFilter!.group) {
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

      const month: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

      const nowLowLength = this.items!.length;
      const prevLowLength = this.prevItems!.length;
      const increaseLowLength = this.increaseItems!.length;

      const wb = ExcelWorkbook.create();
      const ws = wb.createWorksheet(`그룹별 LOSS 현황`);

      //엑셀 작업 시작
      ws.cell(0, 0).merge(0, month.length + 2);
      ws.cell(0, 0).value = "그룹별 LOSS 현황(" + year + ")";
      ws.cell(1, 0).merge(1, 2);
      ws.cell(1, 0).value = "년도";
      Object.assign(ws.cell(1, 0).style, headerStyle);
      ws.cell(1, 3).merge(1, 8);
      ws.cell(1, 3).value = year + "년 1/4 ~ 2/4 분기";
      Object.assign(ws.cell(1, 3).style, headerStyle);
      ws.cell(1, 9).merge(1, 14);
      ws.cell(1, 9).value = year + "년 3/4 ~ 4/4 분기";
      Object.assign(ws.cell(1, 9).style, headerStyle);

      for (let seq = 1; seq <= month.length; seq++) {
        if (seq === 1) {
          ws.cell(2, 0).merge(2, 1);
          ws.cell(2, 0).value = "구분";
          ws.cell(2, 2).value = "단위";
          Object.assign(ws.cell(2, 0).style, headerStyle);
          Object.assign(ws.cell(2, 2).style, headerStyle);
        }
        ws.cell(2, seq + 2).value = seq + "월";
        Object.assign(ws.cell(2, seq + 2).style, headerStyle);
      }
      ws.cell(3, 0).merge(nowLowLength + 1, 0);
      ws.cell(3, 0).value = "실중량";

      let nowScrapSeq = 0; //상, 하 length
      for (const nowScrapItem of this.items! || []) {
        if (nowScrapItem.equipmentName === undefined) {
          ws.cell(nowScrapSeq + 3, 0).merge(nowScrapSeq + 3, 1);
          ws.cell(nowScrapSeq + 3, 0).value = "생산량 합계";
          ws.cell(nowScrapSeq + 3, 2).value = "kg";
        }
        else {
          ws.cell(nowScrapSeq + 3, 1).value = nowScrapItem.equipmentName;
          ws.cell(nowScrapSeq + 3, 2).value = "kg";
        }
        let scrapSeq = 0;
        for (const nowScrapItem2 of this.items![nowScrapSeq].productionDataInfo || []) {
          nowScrapItem2.quantity === Infinity ? ws.cell(nowScrapSeq + 3, scrapSeq + 3).value = "∞"
            : isNaN(nowScrapItem2.quantity!) ? ws.cell(nowScrapSeq + 3, scrapSeq + 3).value = undefined
            : ws.cell(nowScrapSeq + 3, scrapSeq + 3).value = nowScrapItem2.quantity;
          scrapSeq++;
        }
        nowScrapSeq++;
      }

      //전년도 시작
      ws.cell(nowLowLength + 3, 0).merge(nowLowLength + 3, 2);
      ws.cell(nowLowLength + 3, 0).value = "년도";
      Object.assign(ws.cell(nowLowLength + 3, 0).style, headerStyle);
      ws.cell(nowLowLength + 3, 3).merge(nowLowLength + 3, 8);
      ws.cell(nowLowLength + 3, 3).value = "전년도 1/4 ~ 2/4 분기";
      Object.assign(ws.cell(nowLowLength + 3, 3).style, headerStyle);
      ws.cell(nowLowLength + 3, 9).merge(nowLowLength + 3, 14);
      ws.cell(nowLowLength + 3, 9).value = "전년도 3/4 ~ 4/4 분기";
      Object.assign(ws.cell(nowLowLength + 3, 9).style, headerStyle);
      for (let seq = 1; seq <= month.length; seq++) {
        if (seq === 1) {
          ws.cell(nowLowLength + 4, 0).merge(nowLowLength + 4, 1);
          ws.cell(nowLowLength + 4, 0).value = "구분";
          ws.cell(nowLowLength + 4, 2).value = "단위";
          Object.assign(ws.cell(nowLowLength + 4, 0).style, headerStyle);
          Object.assign(ws.cell(nowLowLength + 4, 2).style, headerStyle);
        }
        ws.cell(nowLowLength + 4, seq + 2).value = seq + "월";
        Object.assign(ws.cell(nowLowLength + 4, seq + 2).style, headerStyle);
      }
      ws.cell(nowLowLength + 5, 0).merge(nowLowLength + prevLowLength + 3, 0);
      ws.cell(nowLowLength + 5, 0).value = "실중량";

      let prevScrapSeq = 0; //상, 하 length
      for (const nowScrapItem of this.prevItems! || []) {
        if (nowScrapItem.equipmentName === undefined) {
          ws.cell(prevScrapSeq + nowLowLength + 5, 0).merge(prevScrapSeq + nowLowLength + 5, 1);
          ws.cell(prevScrapSeq + nowLowLength + 5, 0).value = "생산량 합계";
          ws.cell(prevScrapSeq + nowLowLength + 5, 2).value = "kg";
        }
        else {
          ws.cell(prevScrapSeq + nowLowLength + 5, 1).value = nowScrapItem.equipmentName;
          ws.cell(prevScrapSeq + nowLowLength + 5, 2).value = "kg";
        }
        let scrapSeq = 0;
        for (const nowScrapItem2 of this.prevItems![prevScrapSeq].productionDataInfo || []) {
          nowScrapItem2.quantity === Infinity ? ws.cell(prevScrapSeq + nowLowLength + 5, scrapSeq + 3).value = "∞"
            : isNaN(nowScrapItem2.quantity!) ? ws.cell(prevScrapSeq + nowLowLength + 5, scrapSeq + 3).value = undefined
            : ws.cell(prevScrapSeq + nowLowLength + 5, scrapSeq + 3).value = nowScrapItem2.quantity;
          scrapSeq++;
        }
        prevScrapSeq++;
      }

      //전년동기대비증감 시작
      ws.cell(nowLowLength + prevLowLength + 5, 0).merge(nowLowLength + prevLowLength + 5, 2);
      ws.cell(nowLowLength + prevLowLength + 5, 0).value = "년도";
      Object.assign(ws.cell(nowLowLength + prevLowLength + 5, 0).style, headerStyle);
      ws.cell(nowLowLength + prevLowLength + 5, 3).merge(nowLowLength + prevLowLength + 5, 8);
      ws.cell(nowLowLength + prevLowLength + 5, 3).value = "전년동기대비증감";
      Object.assign(ws.cell(nowLowLength + prevLowLength + 5, 3).style, headerStyle);
      ws.cell(nowLowLength + prevLowLength + 5, 9).merge(nowLowLength + prevLowLength + 5, 14);
      ws.cell(nowLowLength + prevLowLength + 5, 9).value = "전년동기대비증감";
      Object.assign(ws.cell(nowLowLength + prevLowLength + 5, 9).style, headerStyle);
      for (let seq = 1; seq <= month.length; seq++) {
        if (seq === 1) {
          ws.cell(nowLowLength + prevLowLength + 6, 0).merge(nowLowLength + prevLowLength + 6, 1);
          ws.cell(nowLowLength + prevLowLength + 6, 0).value = "구분";
          ws.cell(nowLowLength + prevLowLength + 6, 2).value = "단위";
          Object.assign(ws.cell(nowLowLength + prevLowLength + 6, 0).style, headerStyle);
          Object.assign(ws.cell(nowLowLength + prevLowLength + 6, 2).style, headerStyle);
        }
        ws.cell(nowLowLength + prevLowLength + 6, seq + 2).value = seq + "월";
        Object.assign(ws.cell(nowLowLength + prevLowLength + 6, seq + 2).style, headerStyle);
      }
      ws.cell(nowLowLength + prevLowLength + 7, 0).merge(nowLowLength + prevLowLength + increaseLowLength + 5, 0);
      ws.cell(nowLowLength + prevLowLength + 7, 0).value = "실중량";

      let increaseScrapSeq = 0; //상, 하 length
      for (const nowScrapItem of this.increaseItems! || []) {
        if (nowScrapItem.equipmentName === undefined) {
          ws.cell(increaseScrapSeq + nowLowLength + prevLowLength + 7, 0).merge(increaseScrapSeq + nowLowLength + prevLowLength + 7, 1);
          ws.cell(increaseScrapSeq + nowLowLength + prevLowLength + 7, 0).value = "생산량 합계";
          ws.cell(increaseScrapSeq + nowLowLength + prevLowLength + 7, 2).value = "kg";
        }
        else {
          ws.cell(increaseScrapSeq + nowLowLength + prevLowLength + 7, 1).value = nowScrapItem.equipmentName;
          ws.cell(increaseScrapSeq + nowLowLength + prevLowLength + 7, 2).value = "kg";
        }
        let scrapSeq = 0;
        for (const nowScrapItem2 of this.increaseItems![increaseScrapSeq].productionDataInfo || []) {
          nowScrapItem2.quantity === Infinity ? ws.cell(increaseScrapSeq + nowLowLength + prevLowLength + 7, scrapSeq + 3).value = "∞"
            : isNaN(nowScrapItem2.quantity!) ? ws.cell(increaseScrapSeq + nowLowLength + prevLowLength + 7, scrapSeq + 3).value = undefined
            : ws.cell(increaseScrapSeq + nowLowLength + prevLowLength + 7, scrapSeq + 3).value = nowScrapItem2.quantity;
          scrapSeq++;
        }
        increaseScrapSeq++;
      }

      const title = "그룹별 LOSS 현황(" + year + ").xlsx";
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
    link.download = "분기별 생산 현황(" + this.lastFilter!.year + ").jpg";
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
        this.barChartData = [];


        const nowFromDate = new DateOnly(this.lastFilter!.year!, 1, 1);
        const nowToDate = new DateOnly(this.lastFilter!.year!, 12, 31);

        const lastFromDate = nowFromDate.addYears(-1);
        const lastToDate = nowToDate.addYears(-1);

        this.items = await this._getStatus(db, nowFromDate!, nowToDate!);
        this.prevItems = await this._getStatus(db, lastFromDate!, lastToDate!);

        this.increaseItems = [];
        for (const item of this.items || []) {
          this.increaseItems.push({
            equipmentId: item.equipmentId,
            equipmentName: item.equipmentName,
            totalQuantity: (item.totalQuantity || 0) - (this.prevItems!.filter(item1 => item1.equipmentId === item.equipmentId).single()!.totalQuantity || 0),
            productionDataInfo: item.productionDataInfo && item.productionDataInfo.map((item1, index) => ({
              month: item1.month,
              quantity: (item1.quantity || 0) - (this.prevItems!.filter(item2 => item2.equipmentId === item.equipmentId).single()!.productionDataInfo![index].quantity || 0)
            }))
          });
        }

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

    // 기간별 투입량 구하기
    const groupByInputHistory = await db.inputHistory
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
        quantity: sorm.sum(item.quantity)
      }))
      .resultAsync();

    // 기간별 투입량 구하기 (리와인더)
    const groupByInputHistoryOfRewind = await db.rewindProcess
      .include(item => item.equipments)
      .where(item => [
        sorm.equal(item.isCanceled, false),
        sorm.between(item.planDate, firstDate, lastDate)
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

    // 기간별 실 생산량
    const groupByProduction = await db.productionItem
      .include(item => item.weightMeasurement)
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
        quantity: sorm.sum(sorm.ifNull(item.weightMeasurement!.realWeight, item.weight))
      }))
      .resultAsync();

    // 기간별 리와인더 생산량
    const groupByRewind = await db.rewindProcess
      .include(item => item.equipments)
      .where(item => [
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

    groupByProduction.push(...groupByRewind);

    // LDPE량(추가 생산량)
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

    // 일반자재 반납(PE 박리)
    const groupByGeneralReturn = await db.inputGeneralReturn
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

    // 스크랩량
    const groupByRepairScrap = await db.scrap
      .include(item => item.production)
      .include(item => item.production!.equipment)
      .where(item => [
        sorm.or([
          sorm.equal(item.rating, "재생 가능"),
          sorm.equal(item.rating, "재생 불가")
        ]),
        sorm.between(item.occurrenceDate, firstDate, lastDate)
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
        quantity: sorm.sum(sorm.ifNull(item.weight, 0))
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
      const inputQuantity = groupByInputHistory && groupByInputHistory.filter(item => item.month === i).sum(item => item.quantity || 0);
      const scrapQuantity = groupByRepairScrap && groupByRepairScrap.filter(item => item.month === i).sum(item => item.quantity || 0);
      const returnQuantity = groupByGeneralReturn && groupByGeneralReturn.filter(item => item.month === i).sum(item => item.quantity || 0);
      const ldpeQuatnity = groupByLdpe && groupByLdpe.filter(item => item.month === i).sum(item => item.quantity || 0);
      const productionQuantity = groupByProduction && groupByProduction.filter(item => item.month === i).sum(item => item.quantity || 0);
      const uvQuantity = (inputQuantity || 0) - ((productionQuantity || 0) + (ldpeQuatnity || 0)) - (scrapQuantity || 0) - (returnQuantity || 0);

      groupByMonth.push({
        month: i,
        quantity: (scrapQuantity || 0) + uvQuantity
      });
    }

    for (let seq = 0; seq <= groupByEquipments.length; seq++) {

      if (groupByEquipments[seq]) {
        const inputQuantity = groupByInputHistory && groupByInputHistory.some(item => item.equipmentId === groupByEquipments[seq].equipmentId)
          ? groupByInputHistory.filter(item => item.equipmentId === groupByEquipments[seq].equipmentId).sum(item => item.quantity || 0) : 0;
        const scrapQuantity = groupByRepairScrap && groupByRepairScrap.some(item => item.equipmentId === groupByEquipments[seq].equipmentId)
          ? groupByRepairScrap.filter(item => item.equipmentId === groupByEquipments[seq].equipmentId).sum(item => item.quantity || 0) : 0;
        const returnQuantity = groupByGeneralReturn && groupByGeneralReturn.some(item => item.equipmentId === groupByEquipments[seq].equipmentId)
          ? groupByGeneralReturn.filter(item => item.equipmentId === groupByEquipments[seq].equipmentId).sum(item => item.quantity || 0) : 0;
        const ldpeQuatnity = groupByLdpe && groupByLdpe.some(item => item.equipmentId === groupByEquipments[seq].equipmentId)
          ? groupByLdpe.filter(item => item.equipmentId === groupByEquipments[seq].equipmentId).sum(item => item.quantity || 0) : 0;
        const productionQuantity = groupByProduction && groupByProduction.some(item => item.equipmentId === groupByEquipments[seq].equipmentId)
          ? groupByProduction.filter(item => item.equipmentId === groupByEquipments[seq].equipmentId).sum(item => item.quantity || 0) : 0;
        const uvQuantity = (inputQuantity || 0) - ((productionQuantity || 0) + (ldpeQuatnity || 0)) - (scrapQuantity || 0) - (returnQuantity || 0);

        result.push({
          equipmentId: groupByEquipments[seq].equipmentId,
          equipmentName: groupByEquipments[seq].equipmentName,
          productionDataInfo: [{
            month: undefined,
            quantity: undefined
          }],
          totalQuantity: (scrapQuantity || 0) + uvQuantity
        });
      }
      else {
        result.push({
          equipmentId: undefined,
          equipmentName: undefined,
          productionDataInfo: [{
            month: undefined,
            quantity: undefined
          }],
          totalQuantity: groupByMonth.sum(item => item.quantity || 0)
        });
      }


      result[seq].productionDataInfo!.shift();

      if (seq !== groupByEquipments!.length) {
        for (let i = 1; i <= 12; i++) {
          const inputQuantity = !!groupByEquipments[seq] && groupByInputHistory.some(item => item.equipmentId === groupByEquipments[seq].equipmentId && item.month === i)
            ? groupByInputHistory.filter(item => item.equipmentId === groupByEquipments[seq].equipmentId && item.month === i).sum(item => item.quantity || 0) : 0;
          const scrapQuantity = !!groupByEquipments[seq] && groupByRepairScrap.some(item => item.equipmentId === groupByEquipments[seq].equipmentId && item.month === i)
            ? groupByRepairScrap.filter(item => item.equipmentId === groupByEquipments[seq].equipmentId && item.month === i).sum(item => item.quantity || 0) : 0;
          const returnQuantity = !!groupByEquipments[seq] && groupByGeneralReturn.some(item => item.equipmentId === groupByEquipments[seq].equipmentId && item.month === i)
            ? groupByGeneralReturn.filter(item => item.equipmentId === groupByEquipments[seq].equipmentId && item.month === i).sum(item => item.quantity || 0) : 0;
          const ldpeQuatnity = !!groupByEquipments[seq] && groupByLdpe.some(item => item.equipmentId === groupByEquipments[seq].equipmentId && item.month === i)
            ? groupByLdpe.filter(item => item.equipmentId === groupByEquipments[seq].equipmentId && item.month === i).sum(item => item.quantity || 0) : 0;
          const productionQuantity = !!groupByEquipments[seq] && groupByProduction.some(item => item.equipmentId === groupByEquipments[seq].equipmentId && item.month === i)
            ? groupByProduction.filter(item => item.equipmentId === groupByEquipments[seq].equipmentId && item.month === i).sum(item => item.quantity || 0) : 0;
          const uvQuantity = (inputQuantity || 0) - ((productionQuantity || 0) + (ldpeQuatnity || 0)) - (scrapQuantity || 0) - (returnQuantity || 0);

          result![seq].productionDataInfo!.push({
            month: i,
            quantity: !!groupByEquipments[seq] && ((scrapQuantity || 0) + uvQuantity)
          });
        }
      }
      else {
        for (let i = 1; i <= 12; i++) {
          result[seq].productionDataInfo!.push({
            month: i,
            quantity: groupByMonth.filter(item => item.month === i).length > 0 ?
              groupByMonth.filter(item => item.month === i).single()!.quantity : undefined
          });

        }
      }
    }

    return result;
  }

}

interface IFilterVM {
  year?: number;
  group?: "호기" | "Grade";
}

interface IProductionInstructionReportVM {
  equipmentId: number | undefined;
  equipmentName: string | undefined;
  totalQuantity: number | undefined;
  productionDataInfo: INowMonthProductionVM[] | undefined;
}

interface INowMonthProductionVM {
  month: number | undefined;
  quantity: number | undefined;
}

//TODO: Grade별 Loss 구하는거 추가 해줘야함