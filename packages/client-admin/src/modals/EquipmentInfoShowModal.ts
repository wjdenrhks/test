import {SdModalBase, SdOrmProvider} from "@simplism/angular";
import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild} from "@angular/core";
import "chart.js";
import {MainDbContext} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {DateTime} from "@simplism/core";
import {BaseChartDirective} from "ng2-charts";

@Component({
  selector: "app-equipment-info-show-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-dock-container style="min-width: 350px; max-width: 950px; height: 550px;">
      <sd-busy-container [busy]="busyCount > 0">
        <sd-dock-container>
          <sd-dock [position]="'top'" class="sd-padding-xs-sm">
            <h1> LOT: {{ lot }}</h1>
          </sd-dock>
          <sd-dock [position]="'bottom'" style="padding-top: 15px;">
            <div style="display: block" *ngIf="lineChartData && lineChartData.length > 0">
              <canvas baseChart width="800" height="230"
                      [datasets]="lineChartData"
                      [labels]="lineChartLabels"
                      [options]="lineChartOptions"
                      [colors]="lineChartColors"
                      [legend]="lineChartLegend"
                      [chartType]="lineChartType"
                      (chartHover)="chartHovered($event)"
                      (chartClick)="chartClicked($event)"></canvas>
            </div>
          </sd-dock>
          <sd-pane *ngIf="lineChartData && lineChartData.length > 0" style="min-width: 950px;">
            <sd-dock-container>
              <sd-dock [position]="'left'" class="sd-padding-xl-xl" style="width: 50%;">
                <table>
                  <thead>
                  <tr>
                    <th class="sd-padding-sm-xs" style="min-width: 45px;">NO</th>
                    <th class="sd-padding-sm-xs" style="min-width: 250px;">시간</th>
                    <th class="sd-padding-sm-xs" style="min-width: 60px;">수치</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr *ngFor="let item of testItems trackBy: trackByMeFn">
                    <td class="sd-padding-xs-sm">
                      {{ item.id }}
                    </td>
                    <td class="sd-padding-xs-sm">
                      {{ item.label }}
                    </td>
                    <td class="sd-padding-xs-sm">
                      {{ item.date | number }}
                    </td>
                  </tr>
                  </tbody>
                </table>
              </sd-dock>
              <sd-pane class="sd-padding-sm-xl" *ngIf="goodInfo">
                <h3>구분 : {{ goodInfo.type }} </h3>
                <h3>분류 : {{ goodInfo.category }} </h3>
                <h3>제품명 : {{ goodInfo.name }} </h3>
                <h3>규격 : {{ goodInfo.specification }} </h3>
                <h3>최대값 : {{ goodInfo.max }} </h3>
                <h3>최소값 : {{ goodInfo.min }} </h3>
                <h3>평균값 : {{ goodInfo.avg }} </h3>
              </sd-pane>
            </sd-dock-container>
          </sd-pane>
        </sd-dock-container>
      </sd-busy-container>
    </sd-dock-container>`,
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
      max-height: 50px;
      border: 1px solid darkolivegreen;
      text-align: center;
    }
  `]
})
export class EquipmentInfoShowModal extends SdModalBase<{ equipmentId: number; productionItemId?: number; rewindId?: number; type: string }, any> {
  public trackByMeFn = (i: number, item: any) => item;

  // lineChart
  public lineChartData: any[] = [];

  @ViewChild("chart", {read: BaseChartDirective})
  public chartDirective?: BaseChartDirective;

  public lineChartLabels: string[] = [];
  public labelItems: string[] = [];
  public testItems?: IEquipmentInfoVM[] = [];
  public lot?: string;

  public goodInfo?: IGoodInfoVM;

  public lineChartOptions: any = {
    responsive: true,
    scales: {
      yAxes: [] = []
    }
  };

  public lineChartColors: any[] = [
    { // grey
      backgroundColor: "rgba(148,159,177,0.2)",
      borderColor: "rgba(255,000,000,1)",
      pointBackgroundColor: "#fff942",
      pointBorderColor: "#feff0a",
      pointHoverBackgroundColor: "#fffa66",
      pointHoverBorderColor: "rgba(148,159,177,0.8)"
    }
  ];
  public lineChartLegend = false;
  public lineChartType = "line";

  public busyCount = 0;

  // events
  public chartClicked(e: any): void {
    console.log(e);
  }

  public chartHovered(e: any): void {
    console.log(e);
  }

  public constructor(private readonly _cdr: ChangeDetectorRef,
                     private readonly _orm: SdOrmProvider) {
    super();
  }

  public async sdOnOpen(param: { equipmentId: number; productionItemId?: number; rewindId?: number; type: string }): Promise<void> {


    await this._orm.connectAsync(MainDbContext, async db => {
      let productionItemInfo: any | undefined;
      if (param.productionItemId) {
        productionItemInfo = await db.productionItem
          .include(item => item.lot)
          .include(item => item.goods)
          .where(item => [
            sorm.equal(item.id, param.productionItemId)
          ])
          .select(item => ({
            firstModifyDate: item.firstProductionDateTime,
            lastModifyDate: item.modifyDateTime,
            lotSeq: item.lotSeq,
            lot: item.lot!.lot,
            goodId: item.goodId,
            goodName: item.goods!.name,
            specification: item.goods!.specification,
            type: item.goods!.type,
            category: item.goods!.category
          }))
          .singleAsync();
      }
      else {
        productionItemInfo = await db.rewindProcess
          .include(item => item.rewindLot)
          .include(item => item.changeGoods)
          .include(item => item.goods)
          .where(item => [
            sorm.equal(item.id, param.rewindId)
          ])
          .select(item => ({
            firstModifyDate: item.firstModifyDate,
            lastModifyDate: item.lastModifyDate,
            lot: item.rewindLot!.lot,
            goodId: sorm.ifNull(item.changeGoodId, item.goodId),
            goodName: sorm.ifNull(item.changeGoods!.name, item.goods!.name),
            specification: sorm.ifNull(item.changeGoods!.specification, item.goods!.specification),
            type: sorm.ifNull(item.changeGoods!.type, item.goods!.type),
            category: sorm.ifNull(item.changeGoods!.category, item.goods!.category)
          }))
          .singleAsync();
      }

      this.lot = productionItemInfo!.lot;
      this.goodInfo = {
        id: productionItemInfo!.goodId,
        name: productionItemInfo!.goodName,
        specification: productionItemInfo!.specification,
        type: productionItemInfo!.type,
        category: productionItemInfo!.category,
        min: undefined,
        max: undefined,
        avg: undefined
      };

      const equipmentCode = await db.equipment
        .where(item => [
          sorm.equal(item.id, param.equipmentId)
        ])
        .select(item => ({
          code: item.equipmentCode
        }))
        .singleAsync();

      const firstDateStr = productionItemInfo && productionItemInfo.firstModifyDate ? "AND (CTIME >= '" + productionItemInfo.firstModifyDate.toFormatString("yyyy-MM-dd HH:mm:ss") + "')" :
        "AND (CTIME >= '" + new DateTime().toFormatString("yyyy-MM-dd HH:mm:ss") + "')";
      const lastDateStr = productionItemInfo && productionItemInfo.lastModifyDate ? "AND (CTIME <= '" + productionItemInfo.lastModifyDate.toFormatString("yyyy-MM-dd HH:mm:ss") + "')" :
        `AND (CTIME <= '${new DateTime().toFormatString("yyyy-MM-dd HH:mm:ss")}')`;

      let result: any[] = [];
      if (equipmentCode) {
        if (param.type === "line") {
          result = (await db.executeAsync([
            `SELECT CONVERT(VARCHAR, CTIME, 20) as time,
       VALUE as value
FROM SSGT_MES.dbo.EQ_LINESPEED
WHERE EQ_CODE = '${equipmentCode.code}'
  ${firstDateStr} ${lastDateStr}
  ORDER BY CTIME
  `]));
          /* // min, max를 주고 싶을 경우
           this.lineChartOptions.scales.yAxes.push({
             ticks: {
               min: 0,
               max: 100
             }
           });*/
        }
        else if (param.type === "tension") {
          const lcCode = productionItemInfo!.lotSeq! % 2 === 0 ? "L002" : "L001";

          result = (await db.executeAsync([
            `SELECT CONVERT(VARCHAR, CTIME, 20) as time,
       VALUE as value
FROM SSGT_MES.dbo.EQ_TENSION
WHERE EQ_CODE = '${equipmentCode.code}' AND LC_CODE = '${lcCode}'
  ${firstDateStr} ${lastDateStr}
  `]));
        }
        else if (param.type === "insideRpm") {
          result = (await db.executeAsync([
            `SELECT CONVERT(VARCHAR, CTIME, 20) as time,
       VALUE as value
FROM SSGT_MES.dbo.EQ_PRESSUREOUT
WHERE EQ_CODE = '${equipmentCode.code}' AND DATA_CODE = 'PRESSUREOUT3'
  ${firstDateStr} ${lastDateStr}
  ORDER BY CTIME
  `]));
        }
        else if (param.type === "middleRpm") {
          result = (await db.executeAsync([
            `SELECT CONVERT(VARCHAR, CTIME, 20) as time,
       VALUE as value
FROM SSGT_MES.dbo.EQ_PRESSUREOUT
WHERE EQ_CODE = '${equipmentCode.code}' AND DATA_CODE = 'PRESSUREOUT2'
  ${firstDateStr} ${lastDateStr}
  ORDER BY CTIME
  `]));
        }
        else if (param.type === "outSideRpm") {
          result = (await db.executeAsync([
            `SELECT CONVERT(VARCHAR, CTIME, 20) as time,
       VALUE as value
FROM SSGT_MES.dbo.EQ_PRESSUREOUT
WHERE EQ_CODE = '${equipmentCode.code}' AND DATA_CODE = 'PRESSUREOUT1'
  ${firstDateStr} ${lastDateStr}
  ORDER BY CTIME
  `]));
        }
        else if (param.type === "outTemperature") {
          result = (await db.executeAsync([
            `SELECT CONVERT(VARCHAR, CTIME, 20) as time,
       VALUE as value
FROM SSGT_MES.dbo.EQ_TEMPERATURE 
WHERE EQ_CODE = '${equipmentCode.code}' AND DATA_CODE = 'TEMP1'
  ${firstDateStr} ${lastDateStr}
  ORDER BY CTIME
  `]));
        }
        else if (param.type === "middleTemperature") {
          result = (await db.executeAsync([
            `SELECT CONVERT(VARCHAR, CTIME, 20) as time,
       VALUE as value
FROM SSGT_MES.dbo.EQ_TEMPERATURE 
WHERE EQ_CODE = '${equipmentCode.code}' AND DATA_CODE = 'TEMP2'
  ${firstDateStr} ${lastDateStr}
  ORDER BY CTIME
  `]));
        }
        else if (param.type === "insideTemperature") {
          result = (await db.executeAsync([
            `SELECT CONVERT(VARCHAR, CTIME, 20) as time,
       VALUE as value
FROM SSGT_MES.dbo.EQ_TEMPERATURE 
WHERE EQ_CODE = '${equipmentCode.code}' AND DATA_CODE = 'TEMP3'
  ${firstDateStr} ${lastDateStr}
  ORDER BY CTIME
  `]));
        }
        else if (param.type === "insidePressure") {
          result = (await db.executeAsync([
            `SELECT CONVERT(VARCHAR, CTIME, 20) as time,
       VALUE as value
FROM SSGT_MES.dbo.EQ_PRESSURE
WHERE EQ_CODE = '${equipmentCode.code}' AND DATA_CODE = 'PRESSURE3'
  ${firstDateStr} ${lastDateStr}
  ORDER BY CTIME
  `]));
        }
        else if (param.type === "middlePressure") {
          result = (await db.executeAsync([
            `SELECT CONVERT(VARCHAR, CTIME, 20) as time,
       VALUE as value
FROM SSGT_MES.dbo.EQ_PRESSURE
WHERE EQ_CODE = '${equipmentCode.code}' AND DATA_CODE = 'PRESSURE2'
  ${firstDateStr} ${lastDateStr}
  ORDER BY CTIME
  `]));
        }
        else if (param.type === "outSidePressure") {
          result = (await db.executeAsync([
            `SELECT CONVERT(VARCHAR, CTIME, 20) as time,
       VALUE as value
FROM SSGT_MES.dbo.EQ_PRESSURE
WHERE EQ_CODE = '${equipmentCode.code}' AND DATA_CODE = 'PRESSURE1'
  ${firstDateStr} ${lastDateStr}
  ORDER BY CTIME
  `]));
        }
      }

      let equipmentInfo: {
        value: number | undefined;
        time: any;
      }[];

      equipmentInfo = result && result.length > 0 ? result[0] : undefined;

      this.lineChartData = [];
      this.lineChartLabels = [];
      this.labelItems = [];
      this.testItems = [];

      if (equipmentInfo && equipmentInfo.length > 0) {
        const dataList: number[] = [];
        let seq = 0;

        equipmentInfo.forEach((item, index) => {
          dataList[seq++] = item.value || 0;
          const date = item.time.toString();
          this.labelItems.push(date);
          this.lineChartLabels.push(date.split(" ")[1]);
          this.testItems!.push({
            id: index + 1,
            label: date,
            date: item.value || 0
          });
        });

        this.goodInfo.max = Number(equipmentInfo!.max(item => item.value || 0)).toFixed(1);
        this.goodInfo.min = Number(equipmentInfo!.min(item => item.value || 0)).toFixed(1);
        const totalQuantity = equipmentInfo!.sum(item => Number(item.value) || 0) || 0;

        this.goodInfo.avg = isNaN(totalQuantity / equipmentInfo!.length) ?
          "0" : (totalQuantity / equipmentInfo!.length).toFixed(1);

        this.lineChartData.push({
          fill: false,
          data: dataList
        });
      }
      this._cdr.markForCheck();


      if (this.chartDirective) {
        this.chartDirective["refresh"]();
      }
    });
  }
}

interface IEquipmentInfoVM {
  id: number | undefined;
  label: string | undefined;
  date: number | undefined;
}

interface IGoodInfoVM {
  id: number | undefined;
  name: string | undefined;
  specification: string | undefined;
  type: string | undefined;
  category: string | undefined;
  min: string | undefined;
  max: string | undefined;
  avg: string | undefined;
}