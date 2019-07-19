import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild} from "@angular/core";
import {DateOnly} from "@simplism/core";
import {
  MainDbContext
} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {BaseChartDirective} from "ng2-charts";
import {ExcelWorkbook} from "@simplism/excel";

@Component({
  selector: "app-quarterly-production-status",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>분기별 생산 현황</h4>
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
                <!--<div style="text-align: center; font-size: 22pt; padding: 10px; margin: 10px;">
                  {{ lastFilter?.year + ' 1/4 분기 ~ ' + lastFilter!.year + ' 4/4분기 생산현황' }}
                </div>-->
                <div style="display: block" *ngIf="items && barChartData && barChartData.length > 0">
                  <canvas #chart
                          baseChart width="400" height="100"
                          [datasets]="barChartData"
                          [labels]="barChartLabels"
                          [options]="barChartOptions"
                          [colors]="lineChartColors"
                          [legend]="barChartLegend"
                          [chartType]="barChartType"
                          (chartHover)="chartHovered($event)"
                          (chartClick)="chartClicked($event)"></canvas>
                </div>
              </sd-dock>
              <br>
              <sd-dock class="sd-background-white sd-padding-sm-default"
                       *ngIf="items && barChartData && barChartData.length > 0 && items">
                <table>
                  <thead>
                  <tr>
                    <th [colSpan]="2" class="sd-padding-sm-xs" style="width: 10%">년도</th>
                    <th [colSpan]="6" class="sd-padding-sm-xs"
                        style="width: 42%">{{ lastFilter.year + '년 1/4 ~ 2/4 분기' }}</th>
                    <th [colSpan]="7" class="sd-padding-sm-xs"
                        style="width: 42%">{{ lastFilter.year + '년 3/4 ~ 4/4 분기' }}</th>
                  </tr>
                  <tr class="test">
                    <th class="sd-padding-sm-xs" style="text-align: center;"> 구분</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 60px;"> 단위</th>
                    <ng-container *ngFor="let month of [1,2,3,4,5,6,7,8,9,10,11,12]">
                      <th class="sd-padding-xs-sm" style="width: 6%"> {{ month + '월' }}</th>
                    </ng-container>
                  </tr>
                  </thead>
                  <tbody>
                  <tr>
                    <td>투입량 합계</td>
                    <td>kg</td>
                    <td class="sd-padding-xs-sm" *ngFor="let inputItem of items.inputInfo">
                      {{ inputItem.quantity | number }}
                    </td>
                  </tr>
                  <tr>
                    <td>생산량 합계</td>
                    <td>kg</td>
                    <td class="sd-padding-xs-sm" *ngFor="let productionWeight of items.productionWeightInfo">
                      {{ productionWeight.quantity | number }}
                    </td>
                  </tr>
                  <tr>
                    <td>생산량 합계</td>
                    <td>m</td>
                    <td class="sd-padding-xs-sm" *ngFor="let productionMiterInfo of items.productionMiterInfo">
                      {{ productionMiterInfo.quantity | number }}
                    </td>
                  </tr>
                  <tr>
                    <td>LOSS량 합계</td>
                    <td>KG</td>
                    <td class="sd-padding-xs-sm" *ngFor="let lossQuantityInfo of items.lossQuantityInfo">
                      {{ lossQuantityInfo.quantity | number }}
                    </td>
                  </tr>
                  <tr>
                    <td>LOSS량 합계</td>
                    <td>%</td>
                    <td class="sd-padding-xs-sm" *ngFor="let lossPercentInfo of items.lossPercentInfo">
                      {{ lossPercentInfo.quantity | number }}
                    </td>
                  </tr>
                  </tbody>
                  <!-- <tbody *ngFor="let scrapItem of items">
                   <tr *ngFor="let scrapItem of items>
                   <tr>
                     <td class="sd-padding-xs-sm" *ngIf="!!scrapItem.seq">{{ scrapItem.seq }}</td>
                     <td class="sd-padding-xs-sm" style="width: 100px;"
                         *ngIf="!!scrapItem.seq">{{ scrapItem.goodName }}</td>
                     <td class="sd-padding-xs-sm" [colSpan]="2" *ngIf="!scrapItem.seq">소계</td>
                     <td class="sd-padding-xs-sm" *ngFor="let goodScrap of scrapItem.day">
                       {{ goodScrap.quantity | number }}
                     </td>
                     <td class="sd-padding-xs-sm">
                       {{ scrapItem.totalQuantity | number }}
                     </td>
                   </tr>
                   </tbody>-->
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
      height: 30px;
      border: 1px solid darkolivegreen;
      text-align: center;
    }
  `]
})
export class QuarterlyProductionStatusPage implements OnInit {
  public filter: IFilterVM = {
    year: undefined
  };

  public pagination = {page: 0, length: 0};

  public yearList = [] as number[];


  public lastFilter?: IFilterVM;

  public items?: IProductionInstructionReportVM;

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public barChartOptions: any = {
    responsive: true,
    title: {
      display: true,
      text: undefined,
      fontSize: 22
    },
    elements: {
      line: {
        tension: 0
      }
    },
    scales: {
      yAxes: [
        {
          position: "left",
          ticks: {
            beginAtZero: true
          }
        },
        {
          id: "productionMiter",
          position: "right"
        }
      ]
    }
  };

  public barChartLabels: string[] = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
  public barChartType = "bar";
  public barChartLegend = true;
  public lineChartColors: any[] = [
    { // grey
      backgroundColor: "rgba(0,124,219,0.7)",
      borderColor: "rgba(148,159,177,1)",
      pointBackgroundColor: "rgba(148,159,177,1)",
      pointBorderColor: "#fff",
      pointHoverBackgroundColor: "#fff",
      pointHoverBorderColor: "rgba(148,159,177,0.8)"
    },
    { // dark grey
      backgroundColor: "rgba(209,191,0,0.5)",
      borderColor: "rgba(77,83,96,1)",
      pointBackgroundColor: "rgba(77,83,96,1)",
      pointBorderColor: "#fff",
      pointHoverBackgroundColor: "#fff",
      pointHoverBorderColor: "rgba(77,83,96,1)"
    },
    { // grey
      backgroundColor: "rgba(0,0,0,0.0)",
      borderColor: "rgba(148,159,177,1)",
      pointBackgroundColor: "rgba(148,159,177,1)",
      pointBorderColor: "#fff",
      pointHoverBackgroundColor: "#fff",
      pointHoverBorderColor: "rgba(148,159,177,0.8)"
    }
  ];
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

      if (!this.lastFilter!.year) {
        this._toast.danger("검색기간을 정확히 입력해 주세요.");
        return;
      }

      const headerStyle = {
        alignH: "center",
        background: "CCCCCCCC",
        foreground: "FFFFFFFF",
        bold: true
      };

      const month: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const year = this.filter.year;

      const wb = ExcelWorkbook.create();
      const ws = wb.createWorksheet(`분기별 생산 현황`);

      //엑셀 작업 시작
      ws.cell(0, 0).merge(0, month.length + 1);
      ws.cell(0, 0).value = "분기별 생산 현황(" + year + ")";
      ws.cell(1, 0).merge(1, 1);
      ws.cell(1, 0).value = "년도";
      Object.assign(ws.cell(1, 0).style, headerStyle);
      ws.cell(1, 2).merge(1, 7);
      ws.cell(1, 2).value = year + "년 1/4 ~ 2/4 분기";
      Object.assign(ws.cell(1, 2).style, headerStyle);
      ws.cell(1, 8).merge(1, 13);
      ws.cell(1, 8).value = year + "년 3/4 ~ 4/4 분기";
      Object.assign(ws.cell(1, 8).style, headerStyle);

      for (let seq = 1; seq <= month.length; seq++) {
        if (seq === 1) {
          ws.cell(2, 0).value = "구분";
          ws.cell(2, 1).value = "단위";
          Object.assign(ws.cell(2, 0).style, headerStyle);
          Object.assign(ws.cell(2, 1).style, headerStyle);
        }
        ws.cell(2, seq + 1).value = seq + "월";
        Object.assign(ws.cell(2, seq + 1).style, headerStyle);
      }

      let nowInputInfoSeq = 0;
      for (const nowScrapItem of this.items!.inputInfo || []) {
        if (nowInputInfoSeq === 0) {
          ws.cell(3, 0).value = "투입량 합계";
          ws.cell(3, 1).value = "kg";
        }
        nowScrapItem.quantity === Infinity ? ws.cell(3, nowInputInfoSeq + 2).value = "∞"
          : isNaN(nowScrapItem.quantity!) ? ws.cell(3, nowInputInfoSeq + 2).value = undefined
          : ws.cell(3, nowInputInfoSeq + 2).value = nowScrapItem.quantity;
        nowInputInfoSeq++;
      }

      let nowProductionWeightInfoSeq = 0;
      for (const nowScrapItem of this.items!.productionWeightInfo || []) {
        if (nowProductionWeightInfoSeq === 0) {
          ws.cell(4, 0).value = "생산량 합계";
          ws.cell(4, 1).value = "kg";
        }
        nowScrapItem.quantity === Infinity ? ws.cell(4, nowProductionWeightInfoSeq + 2).value = "∞"
          : isNaN(nowScrapItem.quantity!) ? ws.cell(4, nowProductionWeightInfoSeq + 2).value = undefined
          : ws.cell(4, nowProductionWeightInfoSeq + 2).value = nowScrapItem.quantity;
        nowProductionWeightInfoSeq++;
      }

      let nowProductionMiterInfoSeq = 0;
      for (const nowScrapItem of this.items!.productionMiterInfo || []) {
        if (nowProductionMiterInfoSeq === 0) {
          ws.cell(5, 0).value = "생산량 합계";
          ws.cell(5, 1).value = "m";
        }
        nowScrapItem.quantity === Infinity ? ws.cell(5, nowProductionMiterInfoSeq + 2).value = "∞"
          : isNaN(nowScrapItem.quantity!) ? ws.cell(5, nowProductionMiterInfoSeq + 2).value = undefined
          : ws.cell(5, nowProductionMiterInfoSeq + 2).value = nowScrapItem.quantity;
        nowProductionMiterInfoSeq++;
      }

      let nowLossQuantityInfoSeq = 0;
      for (const nowScrapItem of this.items!.lossQuantityInfo || []) {
        if (nowLossQuantityInfoSeq === 0) {
          ws.cell(6, 0).value = "LOSS량 합계";
          ws.cell(6, 1).value = "KG";
        }
        nowScrapItem.quantity === Infinity ? ws.cell(6, nowLossQuantityInfoSeq + 2).value = "∞"
          : isNaN(nowScrapItem.quantity!) ? ws.cell(6, nowLossQuantityInfoSeq + 2).value = undefined
          : ws.cell(6, nowLossQuantityInfoSeq + 2).value = nowScrapItem.quantity;
        nowLossQuantityInfoSeq++;
      }

      let nowLossPercentInfoSeq = 0;
      for (const nowScrapItem of this.items!.lossPercentInfo || []) {
        if (nowLossPercentInfoSeq === 0) {
          ws.cell(7, 0).value = "LOSS량 합계";
          ws.cell(7, 1).value = "%";
        }
        nowScrapItem.quantity === Infinity ? ws.cell(7, nowLossPercentInfoSeq + 2).value = "∞"
          : isNaN(nowScrapItem.quantity!) ? ws.cell(7, nowLossPercentInfoSeq + 2).value = undefined
          : ws.cell(7, nowLossPercentInfoSeq + 2).value = nowScrapItem.quantity;
        nowLossPercentInfoSeq++;
      }

      const title = "분기별 생산 현황(" + year + ").xlsx";

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
        const firstDate = new DateOnly(this.lastFilter!.year!, 1, 1);
        const lastDate = new DateOnly(this.lastFilter!.year!, 12, 31);

        this.items = {
          inputInfo: [],
          productionWeightInfo: [],
          productionMiterInfo: [],
          lossPercentInfo: [],
          lossQuantityInfo: []
        };

        this.barChartData = [];
        this.barChartOptions.title.text = this.lastFilter!.year + " 1/4 분기 ~ " + this.lastFilter!.year + " 4/4분기 생산현황";

        // 기간별 투입량 구하기
        const groupByInputHistory = await db.inputHistory
          .where(item => [
            sorm.between(sorm.cast(item.createdAtDateTime, DateOnly), firstDate, lastDate)
          ])
          .groupBy(item => [
            sorm.query("DATEPART(MM, [TBL].createdAtDateTime)", Number)
          ])
          .select(item => ({
            month: sorm.query("DATEPART(MM, [TBL].createdAtDateTime)", Number),
            quantity: sorm.sum(item.quantity)
          }))
          .resultAsync();

        // 기간별 투입량 구하기 (리와인더)
        const groupByInputHistoryOfRewind = await db.rewindProcess
          .where(item => [
            sorm.equal(item.isCanceled, false),
            sorm.between(item.planDate, firstDate, lastDate)
          ])
          .groupBy(item => [
            sorm.query("DATEPART(MM, [TBL].planDate)", Number)
          ])
          .select(item => ({
            month: sorm.query("DATEPART(MM, [TBL].planDate)", Number),
            quantity: sorm.sum(sorm.ifNull(item.inputQuantity, 0))
          }))
          .resultAsync();

        groupByInputHistory.push(...groupByInputHistoryOfRewind);

        // 기간별 생산량 구하기
        const groupByProduction = await db.productionItem
          .include(item => item.weightMeasurement)
          .where(item => [
            sorm.between(sorm.cast(item.createdAtDateTime, DateOnly), firstDate, lastDate)
          ])
          .groupBy(item => [
            sorm.query("DATEPART(MM, [TBL].createdAtDateTime)", Number)
          ])
          .select(item => ({
            month: sorm.query("DATEPART(MM, [TBL].createdAtDateTime)", Number),
            weight: sorm.sum(sorm.ifNull(item.weightMeasurement!.realWeight, item.weight)),
            length: sorm.sum(sorm.ifNull(item.length, 0))
          }))
          .resultAsync();

        // 기간별 생산량 구하기(리와인더)
        const groupByRewind = await db.rewindProcess
          .where(item => [
            sorm.between(sorm.cast(item.modifyDate, DateOnly), firstDate, lastDate)
          ])
          .groupBy(item => [
            sorm.query("DATEPART(MM, [TBL].modifyDate)", Number)
          ])
          .select(item => ({
            month: sorm.query("DATEPART(MM, [TBL].modifyDate)", Number),
            weight: sorm.sum(sorm.ifNull(item.productionWeight, 0)),
            length: sorm.sum(sorm.ifNull(item.productionQuantity, 0))
          }))
          .resultAsync();

        groupByProduction.push(...groupByRewind);

        // LDPE량
        const groupByLdpe = await db.inputLdpeReturn
          .include(item => item.mixingProcess)
          .include(item => item.mixingProcess!.equipment)
          .where(item => [
            sorm.between(sorm.cast(item.createdAtDateTime, DateOnly), firstDate, lastDate)
          ])
          .groupBy(item => [
            sorm.query("DATEPART(MM, [TBL].createdAtDateTime)", Number)
          ])
          .select(item => ({
            month: sorm.query("DATEPART(MM, [TBL].createdAtDateTime)", Number),
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
            sorm.query("DATEPART(MM, [TBL].createdAtDateTime)", Number)
          ])
          .select(item => ({
            month: sorm.query("DATEPART(MM, [TBL].createdAtDateTime)", Number),
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
            sorm.query("DATEPART(MM, [TBL].createdAtDateTime)", Number)
          ])
          .select(item => ({
            month: sorm.query("DATEPART(MM, [TBL].createdAtDateTime)", Number),
            weight: sorm.sum(sorm.ifNull(item.weight, 0))
          }))
          .resultAsync();

        //TODO: 리와인더의 스크랩 량도 포함되어야 한다면 로직 삽입

        for (let i = 1; i <= 12; i++) {
          const inputQuantity = groupByInputHistory.some(item => item.month === i) ? groupByInputHistory.filter(item => item.month === i).sum(item => item.quantity || 0) : 0;
          const productionQuantity = groupByProduction.some(item => item.month === i) ? groupByProduction.filter(item => item.month === i).sum(item => item.weight || 0) : 0;
          const ldpeQuantity = groupByLdpe.some(item => item.month === i) ? groupByLdpe.filter(item => item.month === i).sum(item => item.quantity || 0) : 0;
          const scrapQuantity = groupByRepairScrap.some(item => item.month === i) ? groupByRepairScrap.filter(item => item.month === i).sum(item => item.weight || 0) : 0;
          const returnQuantity = groupByGeneralReturn.some(item => item.month === i) ? groupByGeneralReturn.filter(item => item.month === i).sum(item => item.quantity || 0) : 0;

          const invisible = inputQuantity! - productionQuantity! - scrapQuantity! - returnQuantity!;

          this.items.inputInfo!.push({
            month: i,
            quantity: inputQuantity
          });

          this.items.productionWeightInfo!.push({
            month: i,
            quantity: productionQuantity! + ldpeQuantity!
          });

          this.items.productionMiterInfo!.push({
            month: i,
            quantity: groupByProduction.some(item => item.month === i) ? groupByProduction.filter(item => item.month === i).sum(item => item.length || 0) : undefined
          });

          this.items.lossQuantityInfo!.push({
            month: i,
            quantity: scrapQuantity! + invisible!
          });

          this.items.lossPercentInfo!.push({
            month: i,
            quantity: isNaN((productionQuantity! + ldpeQuantity!) / inputQuantity!) || isFinite((productionQuantity! + ldpeQuantity!) / inputQuantity!) ? 0 : ((productionQuantity! + ldpeQuantity!) / inputQuantity!) * 100
          });
        }

        this.barChartData.push({
          data: [
            this.items.inputInfo![0].quantity,
            this.items.inputInfo![1].quantity,
            this.items.inputInfo![2].quantity,
            this.items.inputInfo![3].quantity,
            this.items.inputInfo![4].quantity,
            this.items.inputInfo![5].quantity,
            this.items.inputInfo![6].quantity,
            this.items.inputInfo![7].quantity,
            this.items.inputInfo![8].quantity,
            this.items.inputInfo![9].quantity,
            this.items.inputInfo![10].quantity,
            this.items.inputInfo![11].quantity
          ],
          label: "투입량 합계 kg"
        });

        this.barChartData.push({
          data: [
            this.items.productionWeightInfo![0].quantity,
            this.items.productionWeightInfo![1].quantity,
            this.items.productionWeightInfo![2].quantity,
            this.items.productionWeightInfo![3].quantity,
            this.items.productionWeightInfo![4].quantity,
            this.items.productionWeightInfo![5].quantity,
            this.items.productionWeightInfo![6].quantity,
            this.items.productionWeightInfo![7].quantity,
            this.items.productionWeightInfo![8].quantity,
            this.items.productionWeightInfo![9].quantity,
            this.items.productionWeightInfo![10].quantity,
            this.items.productionWeightInfo![11].quantity
          ],
          label: "생산량 합계 kg"
        });

        this.barChartData.push({
          type: "line",
          yAxisID: "productionMiter",
          spanGaps: true,
          data: [
            this.items.productionMiterInfo![0].quantity,
            this.items.productionMiterInfo![1].quantity,
            this.items.productionMiterInfo![2].quantity,
            this.items.productionMiterInfo![3].quantity,
            this.items.productionMiterInfo![4].quantity,
            this.items.productionMiterInfo![5].quantity,
            this.items.productionMiterInfo![6].quantity,
            this.items.productionMiterInfo![7].quantity,
            this.items.productionMiterInfo![8].quantity,
            this.items.productionMiterInfo![9].quantity,
            this.items.productionMiterInfo![10].quantity,
            this.items.productionMiterInfo![11].quantity
          ],
          label: "생산량 합계 m"
        });

        if (this.chartDirective) {
          this.chartDirective.options.title.text = this.lastFilter!.year + " 1/4 분기 ~ " + this.lastFilter!.year + " 4/4분기 생산현황";
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

}

interface IFilterVM {
  year?: number;
}

interface IProductionInstructionReportVM {
  inputInfo: INowMonthProductionVM[] | undefined;
  productionWeightInfo: INowMonthProductionVM[] | undefined;
  productionMiterInfo: INowMonthProductionVM[] | undefined;
  lossQuantityInfo: INowMonthProductionVM[] | undefined;
  lossPercentInfo: INowMonthProductionVM[] | undefined;
}

interface INowMonthProductionVM {
  month: number | undefined;
  quantity: number | undefined;
}