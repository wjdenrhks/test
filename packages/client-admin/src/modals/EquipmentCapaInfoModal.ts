import {SdModalBase, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild} from "@angular/core";
import {sorm} from "@simplism/orm-query";
import {MainDbContext} from "@sample/main-database";
import {DateOnly} from "@simplism/core";
import {BaseChartDirective} from "ng2-charts";

@Component({
  selector: "app-equipment-capa-info-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-dock-container style="min-width: 700px;">
      <sd-dock class="sd-padding-sm-default">
        <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
          <sd-form-item [label]="'생산예정일'">
            <sd-textfield [(value)]="filter.fromDate" [type]="'date'"></sd-textfield>
          </sd-form-item>
          <sd-form-item [label]="'~'">
            <sd-textfield [(value)]="filter.toDate" [type]="'date'"></sd-textfield>
          </sd-form-item>
          <sd-form-item>
            <sd-button [type]="'submit'">
              <sd-icon [icon]="'search'" [fixedWidth]="true"></sd-icon>
              조회
            </sd-button>
          </sd-form-item>
        </sd-form>
      </sd-dock>
      <sd-busy-container [busy]="busyCount > 0">
        <sd-dock-container>
          <sd-dock>
            <div style="display: block" *ngIf="items && barChartData && barChartData.length > 0">
              <canvas #chart
                      baseChart width="700" height="500"
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
        </sd-dock-container>
      </sd-busy-container>
    </sd-dock-container>
  `
})
export class EquipmentCapaInfoModal extends SdModalBase<undefined, any> {
  public filter: {
    fromDate?: DateOnly;
    toDate?: DateOnly;
    equipmentId?: number;
    goodId?: number;
    goodName?: string;
    searchDate?: DateOnly;
  } = {};

  public lastFilter?: {
    fromDate?: DateOnly;
    toDate?: DateOnly;
    day?: number;
    equipmentId?: number;
    goodId?: number;
    goodName?: string;
    searchDate?: DateOnly;
  };

  public items?: IEquipmentCapaInfoVM[] = [];

  public busyCount = 0;

  public trackByIdFn(item: any): number {
    return item.id;
  }

  public barChartOptions: any = {
    responsive: true,
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

  public barChartLabels: string[] = [];
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
    super();
  }

  public async sdOnOpen(): Promise<void> {
    const year = new DateOnly().year;
    const month = new DateOnly().month;
    const lastDay = (new Date(Number(year), Number(month), 0)).getDate();
    this.filter.fromDate = new DateOnly().setDay(1);
    this.filter.toDate = new DateOnly().setDay(lastDay);

    await this.onSearchFormSubmit();
    this._cdr.markForCheck();
  }

  public async onSearchFormSubmit(): Promise<void> {
    this.lastFilter = Object.clone(this.filter);

    await this._search();
    this._cdr.markForCheck();
  }

  private async _search(): Promise<void> {
    if (!this.lastFilter) return;

    if (!this.lastFilter!.fromDate || !this.lastFilter!.toDate) {
      this._toast.danger("기간을 선택해 주세요.");
      return;
    }

    this.busyCount++;
    try {
      await this._orm.connectAsync(MainDbContext, async db => {

        const firstDate = this.lastFilter!.fromDate;
        const lastDate = this.lastFilter!.toDate;

        this.items = [];
        this.barChartData = [];

        // 기간별 생산지시 수량 구하기
        const groupByProductionInstruction = await db.productionInstruction
          .where(item => [
            sorm.equal(item.isCanceled, false),
            sorm.between(sorm.cast(item.createdAtDateTime, DateOnly), firstDate, lastDate)
          ])
          .include(item => item.equipment)
          .include(item => item.goods)
          .groupBy(item => [
            item.equipmentId,
            item.equipment!.name,
            item.goodId,
            item.goods!.name
          ])
          .select(item => ({
            goodId: item.goodId,
            goodName: item.goods!.name,
            equipmentId: item.equipmentId,
            equipmentName: item.equipment!.name,
            quantity: sorm.sum(item.productQuantity)
          }))
          .resultAsync();

        const groupByEquipment = groupByProductionInstruction
          .groupBy(item => ({
            equipmentId: item.equipmentId,
            equipmentName: item.equipmentName
          }))
          .map(item => ({
            equipmentId: item.key.equipmentId,
            equipmentName: item.key.equipmentName,
            goodsList: item.values && item.values.map(item1 => ({
              goodId: item1.goodId,
              goodName: item1.goodName,
              quantity: item1.quantity
            })),
            totalQuantity: item.values.sum(item1 => item1.quantity)
          }));

        const groupByGoods = groupByProductionInstruction
          .groupBy(item => ({
            goodId: item.goodId,
            goodName: item.goodName
          }))
          .map(item => ({
            goodId: item.key.goodId,
            goodName: item.key.goodName,
            equipmentList: item.values && item.values.map(item1 => ({
              equipmentId: item1.equipmentId,
              equipmentName: item1.equipmentName,
              quantity: item1.quantity
            })),
            totalQuantity: item.values.sum(item1 => item1.quantity)
          }));

        const groupByMonth: any[] = [];

        for (const item of groupByEquipment || []) {
          groupByMonth.push({
            equipmentId: item.equipmentId,
            equipmentName: item.equipmentName,
            quantity: groupByProductionInstruction && groupByProductionInstruction.filter(item1 => item1.equipmentId === item.equipmentId).sum(item1 => item1.quantity || 0)
          });
        }

        this.barChartData = [];
        this.barChartLabels = [];

        for (const equipmentItem of groupByEquipment) {
          this.barChartLabels.push(equipmentItem.equipmentName);
        }

        for (let seq = 0; seq <= groupByGoods.length; seq++) {

          if (groupByGoods[seq]) {
            this.items.push({
              goodId: groupByGoods[seq].goodId,
              goodName: groupByGoods[seq].goodName,
              info: groupByGoods[seq].equipmentList.map(item => ({
                equipmentId: item.equipmentId,
                equipmentName: item.equipmentName,
                quantity: groupByProductionInstruction.some(item1 => item1.goodId === groupByGoods[seq].goodId && item1.equipmentId === item.equipmentId) ?
                  groupByProductionInstruction.filter(item1 => item1.goodId === groupByGoods[seq].goodId && item1.equipmentId === item.equipmentId).single()!.quantity : 0
              })),
              totalQuantity: groupByGoods[seq].totalQuantity
            });
          }
          else {
            this.items.push({
              goodId: undefined,
              goodName: undefined,
              info: groupByMonth.map(item => ({
                equipmentId: item.equipmentId,
                equipmentName: item.equipmentName,
                quantity: item.quantity
              })) || undefined,
              totalQuantity: groupByMonth.sum(item => item.quantity || 0)
            });
          }
        }

        for (const productionItem of this.items || []) {
          const dataList: number[] = [];
          let seq = 0;

          groupByEquipment.forEach(item => {
            dataList[seq++] = productionItem.info!.some(item1 => item1.equipmentId === item.equipmentId) ?
              productionItem.info!.filter(item1 => item1.equipmentId === item.equipmentId).single()!.quantity! : 0;
          });

          this.barChartData.push({
            data: dataList,
            label: productionItem.goodName || "총 생산지시 수량"
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

    this.busyCount--;
  }

}

interface IEquipmentCapaInfoVM {
  goodId: number | undefined;
  goodName: string | undefined;
  totalQuantity: number | undefined;
  info: ITestInfoVM[] | undefined;
}

interface ITestInfoVM {
  equipmentId: number | undefined;
  equipmentName: string | undefined;
  quantity: number | undefined;
}