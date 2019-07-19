import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild
} from "@angular/core";
import {DateOnly} from "@simplism/core";
import {
  MainDbContext
} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {BaseChartDirective} from "ng2-charts";
import {ExcelWorkbook} from "@simplism/excel";

@Component({
  selector: "app-equipment-input-material-status",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>호기 별 원재료 투입 현황</h4>
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
                    <th [colSpan]="3" class="sd-padding-sm-xs" style="width: 10%">년도</th>
                    <th [colSpan]="6" class="sd-padding-sm-xs"
                        style="width: 36%">{{ lastFilter.year + '년 1/4 ~ 2/4 분기' }}</th>
                    <th [colSpan]="7" class="sd-padding-sm-xs"
                        style="width: 42%">{{ lastFilter.year + '년 3/4 ~ 4/4 분기' }}</th>
                  </tr>
                  <tr class="test">
                    <th class="sd-padding-sm-xs" style="text-align: center;" [colSpan]="2"> 구분</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 60px;"> 단위</th>
                    <ng-container *ngFor="let month of [1,2,3,4,5,6,7,8,9,10,11,12]; trackBy: trackByMeFn">
                      <th class="sd-padding-xs-sm" style="width: 6%"> {{ month + '월' }}</th>
                    </ng-container>
                    <th class="sd-padding-xs-sm" style="text-align: center;"> 소계</th>
                  </tr>
                  </thead>
                  <tbody>
                  <ng-container>
                    <tr *ngIf="!!items[0].equipmentId">
                      <td [rowSpan]=items.length [width]="30">투<br>입<br>량</td>
                    </tr>
                    <tr *ngFor="let input of items; trackBy: trackByMeFn">
                      <td *ngIf="!!input.equipmentId">{{ input.equipmentName }}</td>
                      <td *ngIf="!input.equipmentId" [colSpan]="2">투입량 합계</td>
                      <td>Kg</td>
                      <td class="sd-padding-xs-sm" *ngFor="let inputItem of input.inputDataInfo; trackBy: trackByMeFn">
                        {{ inputItem.quantity | number }}
                      </td>
                      <td class="sd-padding-xs-sm">
                        {{ input.totalQuantity | number }}
                      </td>
                    </tr>
                  </ng-container>
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
      border: 1px solid darkolivegreen;
      text-align: center;
    }
  `]
})
export class EquipmentInputMaterialStatusPage implements OnInit {
  public filter: IFilterVM = {
    year: undefined
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
      text: "호기별 원료 투입량(Kg)",
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

      const lowLength = this.items!.length;

      const wb = ExcelWorkbook.create();
      const ws = wb.createWorksheet(`호기별 원재료 투입 현황`);

      ws.cell(0, 0).merge(0, month.length + 3);
      ws.cell(0, 0).value = "호기별 원재료 투입 현황(" + year + ")";
      ws.cell(1, 0).merge(1, 2);
      ws.cell(1, 0).value = "년도";
      Object.assign(ws.cell(1, 0).style, headerStyle);
      ws.cell(1, 3).merge(1, 8);
      ws.cell(1, 3).value = year + "년 1/4 ~ 2/4 분기";
      Object.assign(ws.cell(1, 3).style, headerStyle);
      ws.cell(1, 9).merge(1, 15);
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
        if (seq === month.length) {
          ws.cell(2, seq + 3).value = "소계";
          Object.assign(ws.cell(2, seq + 3).style, headerStyle);
        }

      }
      ws.cell(3, 0).merge(lowLength + 1, 0);
      ws.cell(3, 0).value = "투입량";

      let nowScrapSeq = 0;
      for (const nowScrapItem of this.items! || []) {
        if (nowScrapItem.equipmentName === undefined) {
          ws.cell(nowScrapSeq + 3, 0).merge(nowScrapSeq + 3, 1);
          ws.cell(nowScrapSeq + 3, 0).value = "투입량 합계";
          ws.cell(nowScrapSeq + 3, 2).value = "kg";
        }
        else {
          ws.cell(nowScrapSeq + 3, 1).value = nowScrapItem.equipmentName;
          ws.cell(nowScrapSeq + 3, 2).value = "kg";
        }
        let scrapSeq = 0;
        for (const nowScrapItem2 of this.items![nowScrapSeq].inputDataInfo || []) {
          nowScrapItem2.quantity === Infinity ? ws.cell(nowScrapSeq + 3, scrapSeq + 3).value = "∞"
            : isNaN(nowScrapItem2.quantity!) ? ws.cell(nowScrapSeq + 3, scrapSeq + 3).value = undefined
            : ws.cell(nowScrapSeq + 3, scrapSeq + 3).value = nowScrapItem2.quantity;
          scrapSeq++;
        }
        nowScrapItem.totalQuantity === Infinity ? ws.cell(nowScrapSeq + 3, scrapSeq + 3).value = "∞"
          : isNaN(nowScrapItem.totalQuantity!) ? ws.cell(nowScrapSeq + 3, scrapSeq + 3).value = undefined
          : ws.cell(nowScrapSeq + 3, scrapSeq + 3).value = nowScrapItem.totalQuantity;
        nowScrapSeq++;
      }

      const title = "호기별 원재료 투입 현황(" + year + ").xlsx";
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
    link.download = "호기별 원재료 투입 현황(" + this.lastFilter!.year + ").jpg";
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

        this.items = [];
        this.barChartData = [];

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

        // 기간별 투입량 구하기
        const groupByDateInputHistory = await db.inputHistory
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

        groupByDateInputHistory.push(...groupByInputHistoryOfRewind);

        for (const equipmentItem of equipmentInfo || []) {
          if (groupByDateInputHistory.filter(item => item.equipmentId === equipmentItem.equipmentId).length < 1) {
            groupByDateInputHistory.push({
              month: undefined,
              equipmentId: equipmentItem.equipmentId!,
              equipmentName: equipmentItem.equipmentName,
              quantity: 0
            });
          }
        }

        const groupByEquipments = groupByDateInputHistory
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
          groupByMonth.push({
            month: i,
            quantity: groupByDateInputHistory && groupByDateInputHistory.filter(item => item.month === i).sum(item => item.quantity || 0)
          });
        }

        this.barChartData = [];

        for (let seq = 0; seq <= groupByEquipments.length; seq++) {
          this.items.push({
            equipmentId: groupByEquipments[seq] ? groupByEquipments[seq].equipmentId : undefined,
            equipmentName: groupByEquipments[seq] ? groupByEquipments[seq].equipmentName : undefined,
            inputDataInfo: [{
              month: undefined,
              quantity: undefined
            }],
            totalQuantity: groupByEquipments[seq] ? groupByEquipments[seq].totalQuantity : groupByMonth.sum(item => item.quantity || 0)
          });

          this.items[seq].inputDataInfo!.shift();

          if (seq !== groupByEquipments!.length) {
            for (let i = 1; i <= 12; i++) {
              this.items![seq].inputDataInfo!.push({
                month: i,
                quantity: !!groupByEquipments[seq] && groupByDateInputHistory.filter(item => item.equipmentId === groupByEquipments[seq].equipmentId && item.month === i).length > 0 ?
                  groupByDateInputHistory.filter(item => item.equipmentId === groupByEquipments[seq].equipmentId && item.month === i).sum(item => item.quantity || 0) : undefined
              });
            }
          }
          else {
            for (let i = 1; i <= 12; i++) {
              this.items[seq].inputDataInfo!.push({
                month: i,
                quantity: groupByMonth.filter(item => item.month === i).length > 0 ?
                  groupByMonth.filter(item => item.month === i).single()!.quantity : undefined
              });

            }
          }
        }

        this.items = this.items.orderBy(item => item.equipmentName);

        for (const item of this.items || []) {
          this.barChartData.push({
            data: [
              item.inputDataInfo![0].quantity,
              item.inputDataInfo![1].quantity,
              item.inputDataInfo![2].quantity,
              item.inputDataInfo![3].quantity,
              item.inputDataInfo![4].quantity,
              item.inputDataInfo![5].quantity,
              item.inputDataInfo![6].quantity,
              item.inputDataInfo![7].quantity,
              item.inputDataInfo![8].quantity,
              item.inputDataInfo![9].quantity,
              item.inputDataInfo![10].quantity,
              item.inputDataInfo![11].quantity
            ],
            label: item.equipmentName || "투입량 합계"
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

}

interface IFilterVM {
  year?: number;
}

interface IProductionInstructionReportVM {
  equipmentId: number | undefined;
  equipmentName: string | undefined;
  totalQuantity: number | undefined;
  inputDataInfo: INowMonthProductionVM[] | undefined;
}

interface INowMonthProductionVM {
  month: number | undefined;
  quantity: number | undefined;
}