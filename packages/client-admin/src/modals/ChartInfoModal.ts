import {SdModalBase} from "@simplism/angular";
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild} from "@angular/core";
import {DateOnly} from "@simplism/core";
import {BaseChartDirective} from "ng2-charts";
import {IChartVM} from "../modules/inspection/FirstMiddleLastInspectionPage";


@Component({
  selector: "app-chart-info-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-dock-container style="min-width: 500px;">
      <sd-busy-container [busy]="busyCount > 0">
        <sd-dock-container>
          <sd-dock>
            <div style="display: block" *ngIf="items && barChartData && barChartData.length > 0">
              <canvas #chart
                      baseChart width="500" height="200"
                      [datasets]="barChartData"
                      [labels]="barChartLabels"
                      [options]="barChartOptions"
                      [legend]="barChartLegend"
                      [colors]="lineChartColors"
                      [chartType]="barChartType"
                      (chartHover)="chartHovered($event)"
                      (chartClick)="chartClicked($event)"></canvas>
            </div>

            <div style="display: block; padding-top: 30px;" *ngIf="items && barRChartData && barRChartData.length > 0">
              <canvas #chart
                      baseChart width="500" height="200"
                      [datasets]="barRChartData"
                      [labels]="barRChartLabels"
                      [options]="barRChartOptions"
                      [legend]="barChartLegend"
                      [colors]="lineChartColors"
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
export class ChartInfoModal extends SdModalBase<{ dataList: IChartVM[] }, any> {
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
    elements: {
      line: {
        tension: 0
      }
    }
  };

  public barRChartOptions: any = {
    responsive: true,
    elements: {
      line: {
        tension: 0
      }
    }
  };

  public barChartLabels: number[] = [];
  public barRChartLabels: number[] = [];
  public barChartType = "line";
  public barChartLegend = true;
  public barChartData: any[] = [];
  public barRChartData: any[] = [];
  public lineChartColors: any[] = [];

  @ViewChild("chart", {read: BaseChartDirective})
  public chartDirective?: BaseChartDirective;

  // events
  public chartClicked(e: any): void {
    console.log(e);
  }

  public chartHovered(e: any): void {
    console.log(e);
  }

  public constructor(private readonly _cdr: ChangeDetectorRef) {
    super();
  }

  public async sdOnOpen(param: { dataList: IChartVM[] }): Promise<void> {
    const chartY: number[] = [];
    const chartZ: number[] = [];

    const chartListData = Object.clone(param.dataList);

    for (const item of chartListData) {
      const sum = item.inspectionItemList!.sum(item1 => Number(item1.inspectionValue) || 0);
      const listAvg = sum! / item.inspectionItemList!.length;
      const test = item.inspectionItemList!.sum(item1 => Math.pow(Number(Number(item1.inspectionValue!) - listAvg), 2));
      const dispersion = test! / (item.inspectionItemList!.length - 1);
      const standardDeviation = Math.sqrt(dispersion).toFixed(2);

      this.barChartLabels.push(item.instructionId!);
      this.barRChartLabels.push(item.instructionId!);
      chartY.push(listAvg);
      chartZ.push(Number(standardDeviation!));
    }
    this.barChartData.push({
      data: chartY
    });
    this.barRChartData.push({
      data: chartZ
    });

    this.barChartOptions = {
      title: {
        text: "X-Bar R 관리도",
        fontSize: 23,
        display: true
      },
      legend: {
        display: false
      },
      annotation: {
        annotations: [
          {
            drawTime: "beforeDatasetsDraw",
            id: "hline",
            type: "line",
            mode: "horizontal",
            scaleID: "y-axis-0",
            value: chartListData![0].inspectionItemList![0].max,
            borderColor: "red",
            borderWidth: 1,
            label: {
              backgroundColor: "grey",
              content: "max",
              enabled: true
            }
          },
          {
            drawTime: "beforeDatasetsDraw",
            id: "hline1",
            type: "line",
            mode: "horizontal",
            scaleID: "y-axis-0",
            value: chartListData![0].inspectionItemList![0].avg,
            borderColor: "red",
            borderWidth: 1,
            label: {
              backgroundColor: "grey",
              content: "avg",
              enabled: true
            }
          },
          {
            drawTime: "afterDatasetsDraw",
            id: "hline2",
            type: "line",
            mode: "horizontal",
            scaleID: "y-axis-0",
            value: chartListData![0].inspectionItemList![0].min,
            borderColor: "red",
            borderWidth: 1,
            label: {
              backgroundColor: "grey",
              content: "min",
              enabled: true
            }
          }
        ]
      }
    };

    this.barRChartOptions = {
      legend: {
        display: false
      },
      annotation: {
        annotations: [
          {
            drawTime: "beforeDatasetsDraw",
            id: "hline",
            type: "line",
            mode: "horizontal",
            scaleID: "y-axis-0",
            value: chartListData![0].inspectionItemList![0].standardDeviationMax,
            borderColor: "red",
            borderWidth: 1,
            label: {
              backgroundColor: "grey",
              content: "max",
              enabled: true
            }
          },
          {
            drawTime: "beforeDatasetsDraw",
            id: "hline1",
            type: "line",
            mode: "horizontal",
            scaleID: "y-axis-0",
            value: chartListData![0].inspectionItemList![0].standardDeviationAvg,
            borderColor: "red",
            borderWidth: 1,
            label: {
              backgroundColor: "grey",
              content: "avg",
              enabled: true
            }
          },
          {
            drawTime: "afterDatasetsDraw",
            id: "hline2",
            type: "line",
            mode: "horizontal",
            scaleID: "y-axis-0",
            value: chartListData![0].inspectionItemList![0].standardDeviationMin,
            borderColor: "red",
            borderWidth: 1,
            label: {
              backgroundColor: "grey",
              content: "min",
              enabled: true
            }
          }
        ]
      }
    };

    this.lineChartColors.push({
      backgroundColor: "rgba(0,0,0,0)",
      borderColor: "rgba(148,159,177,1)",
      pointBackgroundColor: "rgba(148,159,177,1)",
      pointBorderColor: "#fff",
      pointHoverBackgroundColor: "#fff",
      pointHoverBorderColor: "rgba(148,159,177,0.8)"
    });

    this._cdr.markForCheck();
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
