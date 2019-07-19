import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from "@angular/core";
import {DateOnly} from "@simplism/core";
import {SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {MainDbContext} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {ExcelWorkbook} from "@simplism/excel";

@Component({
  selector: "app-production-loss-status",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>생산량 대비 LOSS 현황</h4>

          <sd-topbar-menu *ngIf="lastFilter && items" (click)="onDownloadButtonClick()">
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
                  <ng-container *ngFor="let productionItem of items; trackBy: trackByMeFn">
                    <tr *ngIf="productionItem.inputInfo.length > 0">
                      <td [rowSpan]=productionItem.inputInfo.length+1 [width]="30">투<br>입<br>량</td>
                    </tr>
                    <tr *ngFor="let input of productionItem.inputInfo; let i = index; trackBy: trackByMeFn">
                      <ng-container *ngIf="i === (productionItem.inputInfo.length-1)">
                        <td *ngIf="!input.equipmentId"
                            style="background-color: #EEEEEE; border-bottom: 2px solid black;">투입량 합계
                        </td>
                        <td style="background-color: #EEEEEE; border-bottom: 2px solid black;">{{ input.unitName }}</td>
                        <td class="sd-padding-xs-sm" *ngFor="let inputItem of input.month; trackBy: trackByMeFn"
                            style="background-color: #EEEEEE; border-bottom: 2px solid black;">
                          {{ inputItem.quantity | number }}
                        </td>
                        <td class="sd-padding-xs-sm" style="background-color: #f0e239; border-bottom: 2px solid black;">
                          {{ input.totalQuantity | number }}
                        </td>
                      </ng-container>

                      <ng-container *ngIf="i !== (productionItem.inputInfo.length-1)">
                        <td *ngIf="!!input.equipmentId">{{ input.equipmentName }}</td>
                        <td>{{ input.unitName }}</td>
                        <td class="sd-padding-xs-sm" *ngFor="let inputItem of input.month; trackBy: trackByMeFn">
                          {{ inputItem.quantity | number }}
                        </td>
                        <td class="sd-padding-xs-sm">
                          {{ input.totalQuantity | number }}
                        </td>
                      </ng-container>
                    </tr>
                    <tr *ngIf="productionItem.productionWeight.length > 0">
                      <td [rowSpan]=productionItem.productionWeight.length+1 [width]="30">실<br>중<br>량</td>
                    </tr>
                    <tr *ngFor="let production of productionItem.productionWeight">
                      <td *ngIf="!!production.equipmentId">{{ production.equipmentName }}</td>
                      <td *ngIf="!production.equipmentId">생산량 합계</td>
                      <td>{{ production.unitName }}</td>
                      <td class="sd-padding-xs-sm"
                          *ngFor="let productionItem of production.month; trackBy: trackByMeFn">
                        {{ productionItem.quantity | number }}
                      </td>
                      <td class="sd-padding-xs-sm">
                        {{ production.totalQuantity | number }}
                      </td>
                    </tr>
                    <tr *ngIf="productionItem.productionMiter.length > 0">
                      <td [rowSpan]=productionItem.productionMiter.length+1 [width]="30">생<br>산<br>량</td>
                    </tr>
                    <tr *ngFor="let production of productionItem.productionMiter">
                      <td *ngIf="!!production.equipmentId">{{ production.equipmentName }}</td>
                      <td *ngIf="!production.equipmentId">생산량 합계</td>
                      <td>{{ production.unitName }}</td>
                      <td class="sd-padding-xs-sm"
                          *ngFor="let productionItem of production.month; trackBy: trackByMeFn">
                        {{ productionItem.quantity | number }}
                      </td>
                      <td class="sd-padding-xs-sm">
                        {{ production.totalQuantity | number }}
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
export class ProductionLossStatusPage implements OnInit {

  public filter: IFilterVM = {
    year: undefined
  };

  public pagination = {page: 0, length: 0};

  public yearList = [] as number[];


  public lastFilter?: IFilterVM;

  public items?: IProductionLossStatusVM[] = [];

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;


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
    return;
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

      const sumStyle = {
        background: "CCCCCCCC",
        foreground: "FFFFFFFF",
        bold: true
      };

      const month: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const year = this.filter.year;

      const wb = ExcelWorkbook.create();
      const ws = wb.createWorksheet(`생산량 대비 LOSS 현황`);

      ws.cell(0, 0).merge(0, month.length + 3);
      ws.cell(0, 0).value = "생산량 대비 LOSS 현황(" + year + ")";
      ws.cell(1, 0).merge(1, 2);
      ws.cell(1, 0).value = "년도";
      Object.assign(ws.cell(1, 0).style, headerStyle);
      ws.cell(1, 3).merge(1, 8);
      ws.cell(1, 3).value = year + "년 1/4 ~ 2/4 분기";
      Object.assign(ws.cell(1, 3).style, headerStyle);
      ws.cell(1, 9).merge(1, 15);
      ws.cell(1, 9).value = year + "년 3/4 ~ 4/4 분기";
      Object.assign(ws.cell(1, 9).style, headerStyle);
      ws.cell(2, 0).merge(2, 1);
      ws.cell(2, 0).value = "구분";
      Object.assign(ws.cell(2, 0).style, headerStyle);
      ws.cell(2, 2).value = "단위";
      Object.assign(ws.cell(2, 2).style, headerStyle);
      for (let i = 1; i <= month.length; i++) {
        ws.cell(2, 2 + i).value = i + "월";
        Object.assign(ws.cell(2, 2 + i).style, headerStyle);
        if (i === month.length) {
          ws.cell(2, 2 + i + 1).value = "소계";
          Object.assign(ws.cell(2, 2 + i + 1).style, headerStyle);
        }
      }

      //투입량 합계
      const rowLength = this.items![0].inputInfo!.length;
      ws.cell(3, 0).merge(rowLength + 2, 0);
      ws.cell(3, 0).value = "투입량";
      let nowInputInfoSeq = 1;
      for (const nowScrapItem of this.items![0].inputInfo || []) {
        if (nowScrapItem.equipmentName !== undefined) {
          ws.cell(nowInputInfoSeq + 2, 1).value = nowScrapItem.equipmentName;
        }
        else {
          ws.cell(nowInputInfoSeq + 2, 1).value = "투입량 합계";
        }
        ws.cell(nowInputInfoSeq + 2, 2).value = nowScrapItem.unitName;

        let nowInputInfoSeq2 = 1;
        for (const nowScrapItem2 of this.items![0].inputInfo![nowInputInfoSeq - 1].month || []) {
          nowScrapItem2.quantity === Infinity ? ws.cell(nowInputInfoSeq + 2, nowInputInfoSeq2 + 2).value = "∞"
            : isNaN(nowScrapItem2.quantity!) ? ws.cell(nowInputInfoSeq + 2, nowInputInfoSeq2 + 2).value = undefined
            : ws.cell(nowInputInfoSeq + 2, nowInputInfoSeq2 + 2).value = nowScrapItem2.quantity;
          nowInputInfoSeq2++;
        }
        nowScrapItem.totalQuantity === Infinity ? ws.cell(nowInputInfoSeq + 2, month.length + 3).value = "∞"
          : isNaN(nowScrapItem.totalQuantity!) ? ws.cell(nowInputInfoSeq + 2, month.length + 3).value = undefined
          : ws.cell(nowInputInfoSeq + 2, month.length + 3).value = nowScrapItem.totalQuantity;
        nowInputInfoSeq++;
      }


      //실중량 합계
      const rowLength2 = rowLength + this.items![0].productionWeight!.length;
      ws.cell(rowLength + 3, 0).merge(rowLength2 + 2, 0);
      ws.cell(rowLength + 3, 0).value = "실중량";
      let nowProductionWeightSeq = 1;
      for (const nowScrapItem of this.items![0].productionWeight || []) {
        if (nowScrapItem.equipmentName !== undefined) {
          ws.cell(nowProductionWeightSeq + rowLength + 2, 1).value = nowScrapItem.equipmentName;
        }
        else {
          ws.cell(nowProductionWeightSeq + rowLength + 2, 1).value = "실중량 합계";
        }
        ws.cell(nowProductionWeightSeq + rowLength + 2, 2).value = nowScrapItem.unitName;
        let nowProductionWeightSeq2 = 1;
        for (const nowScrapItem2 of this.items![0].productionWeight![nowProductionWeightSeq - 1].month || []) {
          nowScrapItem2.quantity === Infinity ? ws.cell(nowProductionWeightSeq + rowLength + 2, nowProductionWeightSeq2 + 2).value = "∞"
            : isNaN(nowScrapItem2.quantity!) ? ws.cell(nowProductionWeightSeq + rowLength + 2, nowProductionWeightSeq2 + 2).value = undefined
            : ws.cell(nowProductionWeightSeq + rowLength + 2, nowProductionWeightSeq2 + 2).value = nowScrapItem2.quantity;
          nowProductionWeightSeq2++;
        }
        nowScrapItem.totalQuantity === Infinity ? ws.cell(nowProductionWeightSeq + rowLength + 2, month.length + 3).value = "∞"
          : isNaN(nowScrapItem.totalQuantity!) ? ws.cell(nowProductionWeightSeq + rowLength + 2, month.length + 3).value = undefined
          : ws.cell(nowProductionWeightSeq + rowLength + 2, month.length + 3).value = nowScrapItem.totalQuantity;
        nowProductionWeightSeq++;
      }

      //생산량 합계
      const rowLength3 = rowLength2 + this.items![0].productionMiter!.length;
      ws.cell(rowLength2 + 3, 0).merge(rowLength3 + 2, 0);
      ws.cell(rowLength2 + 3, 0).value = "생산량";
      let nowProductionMiterSeq = 1;
      for (const nowScrapItem of this.items![0].productionMiter || []) {
        if (nowScrapItem.equipmentName !== undefined) {
          ws.cell(nowProductionMiterSeq + rowLength2 + 2, 1).value = nowScrapItem.equipmentName;
        }
        else {
          ws.cell(nowProductionMiterSeq + rowLength2 + 2, 1).value = "생산량 합계";
        }
        ws.cell(nowProductionMiterSeq + rowLength2 + 2, 2).value = nowScrapItem.unitName;
        let nowProductionMiterSeq2 = 1;
        for (const nowScrapItem2 of this.items![0].productionMiter![nowProductionMiterSeq - 1].month || []) {
          nowScrapItem2.quantity === Infinity ? ws.cell(nowProductionMiterSeq + rowLength2 + 2, nowProductionMiterSeq2 + 2).value = "∞"
            : isNaN(nowScrapItem2.quantity!) ? ws.cell(nowProductionMiterSeq + rowLength2 + 2, nowProductionMiterSeq2 + 2).value = undefined
            : ws.cell(nowProductionMiterSeq + rowLength2 + 2, nowProductionMiterSeq2 + 2).value = nowScrapItem2.quantity;
          nowProductionMiterSeq2++;
        }
        nowScrapItem.totalQuantity === Infinity ? ws.cell(nowProductionMiterSeq + rowLength2 + 2, month.length + 3).value = "∞"
          : isNaN(nowScrapItem.totalQuantity!) ? ws.cell(nowProductionMiterSeq + rowLength2 + 2, month.length + 3).value = undefined
          : ws.cell(nowProductionMiterSeq + rowLength2 + 2, month.length + 3).value = nowScrapItem.totalQuantity;
        nowProductionMiterSeq++;
      }

      //합계 Style
      for (let i = 1; i <= month.length + 3; i++) {
        Object.assign(ws.cell(rowLength + 2, i).style, sumStyle);
        Object.assign(ws.cell(rowLength2 + 2, i).style, sumStyle);
        Object.assign(ws.cell(rowLength3 + 2, i).style, sumStyle);
      }

      const title = "생산량 대비 LOSS 현황(" + year + ").xlsx";

      await wb.downloadAsync(title);

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

        this.items = [];

        const firstDate = new DateOnly(this.lastFilter!.year!, 1, 1);
        const lastDate = new DateOnly(this.lastFilter!.year!, 12, 31);

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

        for (const equipmentItem of equipmentInfo || []) {
          if (groupByInputHistory.filter(item => item.equipmentId === equipmentItem.equipmentId).length < 1) {
            groupByInputHistory.push({
              month: undefined,
              equipmentId: equipmentItem.equipmentId!,
              equipmentName: equipmentItem.equipmentName,
              quantity: 0
            });
          }
        }

        const totalInputEquipmentQuantity = groupByInputHistory
          .groupBy(item => ({
            equipmentId: item.equipmentId,
            equipmentName: item.equipmentName
          }))
          .map(item => ({
            equipmentId: item.key.equipmentId,
            equipmentName: item.key.equipmentName,
            totalQuantity: item.values.sum(item1 => item1.quantity)
          }));

        const groupByInputHistoryDate: any[] = [];
        for (let i = 1; i < 12; i++) {
          groupByInputHistoryDate.push({
            month: i,
            quantity: groupByInputHistory && groupByInputHistory.filter(item => item.month === i).sum(item => item.quantity || 0)
          });
        }
        // 기간별 실중량,생산량 구하기
        const groupByProduction = await db.productionItem
          .include(item => item.production)
          .include(item => item.production!.equipment)
          .include(item => item.weightMeasurement)
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
            quantity: sorm.sum(sorm.ifNull(item.weightMeasurement!.realWeight, item.weight)),
            length: sorm.sum(sorm.ifNull(item.length, 0))
          }))
          .resultAsync();

        const groupByRewind = await db.rewindProcess
          .include(item => item.equipments)
          .where(item => [
            sorm.between(sorm.cast(item.modifyDate, DateOnly), firstDate, lastDate)
          ])
          .groupBy(item => [
            sorm.query("DATEPART(MM, [TBL].createdAtDateTime)", Number),
            item.equipmentId,
            item.equipments!.name
          ])
          .select(item => ({
            month: sorm.query("DATEPART(MM, [TBL].createdAtDateTime)", Number),
            equipmentId: item.equipmentId,
            equipmentName: item.equipments!.name,
            quantity: sorm.sum(sorm.ifNull(item.productionWeight, 0)),
            length: sorm.sum(sorm.ifNull(item.productionQuantity, 0))
          }))
          .resultAsync();

        groupByProduction.push(...groupByRewind);

        for (const equipmentItem of equipmentInfo || []) {
          if (groupByProduction.filter(item => item.equipmentId === equipmentItem.equipmentId).length < 1) {
            groupByProduction.push({
              month: undefined,
              equipmentId: equipmentItem.equipmentId!,
              equipmentName: equipmentItem.equipmentName,
              quantity: 0,
              length: 0
            });
          }
        }

        const totalProductionEquipmentQuantity = groupByProduction
          .groupBy(item => ({
            equipmentId: item.equipmentId,
            equipmentName: item.equipmentName
          }))
          .map(item => ({
            equipmentId: item.key.equipmentId,
            equipmentName: item.key.equipmentName,
            totalQuantity: item.values.sum(item1 => item1.quantity),
            totalLength: item.values.sum(item1 => item1.length)
          }));


        const groupByProductionDate: any[] = [];
        for (let i = 1; i < 12; i++) {
          groupByProductionDate.push({
            month: i,
            quantity: groupByProduction && groupByProduction.filter(item => item.month === i).sum(item => item.quantity || 0),
            length: groupByProduction && groupByProduction.filter(item => item.month === i).sum(item => item.length || 0)
          });
        }

        const inputList: IProductionInfoVM[] = [];

        if (groupByInputHistory) {
          for (let seq = 0; seq <= totalInputEquipmentQuantity.length; seq++) {
            inputList.push({
              type: "투입량",
              unitName: "kg",
              equipmentId: totalInputEquipmentQuantity[seq] ? totalInputEquipmentQuantity[seq].equipmentId : undefined,
              equipmentName: totalInputEquipmentQuantity[seq] ? totalInputEquipmentQuantity[seq].equipmentName : undefined,
              month: [{
                equipmentId: totalInputEquipmentQuantity[seq] ? totalInputEquipmentQuantity[seq].equipmentId : undefined,
                quantity: undefined,
                month: undefined
              }],
              totalQuantity: totalInputEquipmentQuantity[seq] ? totalInputEquipmentQuantity[seq].totalQuantity : groupByInputHistoryDate.sum(item => item.quantity || 0)
            });

            inputList![seq].month!.shift();

            if (seq !== totalInputEquipmentQuantity!.length) {
              for (let i = 1; i <= 12; i++) {
                inputList![seq].month!.push({
                  equipmentId: groupByInputHistory[seq].equipmentId,
                  month: i,
                  quantity: !!totalInputEquipmentQuantity[seq] && groupByInputHistory.filter(item => item.equipmentId === totalInputEquipmentQuantity[seq].equipmentId && item.month === i).length > 0 ?
                    groupByInputHistory.filter(item => item.equipmentId === totalInputEquipmentQuantity[seq].equipmentId && item.month === i).sum(item => item.quantity || 0) : undefined
                });
              }
            }
            else {
              for (let i = 1; i <= 12; i++) {
                inputList[seq].month!.push({
                  equipmentId: undefined,
                  month: i,
                  quantity: groupByInputHistoryDate.filter(item => item.month === i).length > 0 ?
                    groupByInputHistoryDate.filter(item => item.month === i).single()!.quantity : undefined
                });

              }
            }
          }
        }

        const productionWeigthList: IProductionInfoVM[] = [];
        const productionMiterList: IProductionInfoVM[] = [];

        if (groupByProduction) {
          for (let seq = 0; seq <= totalProductionEquipmentQuantity.length; seq++) {
            productionWeigthList.push({
              type: "실중량",
              unitName: "kg",
              equipmentId: totalProductionEquipmentQuantity[seq] ? totalProductionEquipmentQuantity[seq].equipmentId : undefined,
              equipmentName: totalProductionEquipmentQuantity[seq] ? totalProductionEquipmentQuantity[seq].equipmentName : undefined,
              month: [{
                equipmentId: totalProductionEquipmentQuantity[seq] ? totalProductionEquipmentQuantity[seq].equipmentId : undefined,
                quantity: undefined,
                month: undefined
              }],
              totalQuantity: totalProductionEquipmentQuantity[seq] ? totalProductionEquipmentQuantity[seq].totalQuantity : groupByProductionDate.sum(item => item.quantity || 0)
            });

            productionMiterList.push({
              type: "생산량",
              unitName: "m",
              equipmentId: totalProductionEquipmentQuantity[seq] ? totalProductionEquipmentQuantity[seq].equipmentId : undefined,
              equipmentName: totalProductionEquipmentQuantity[seq] ? totalProductionEquipmentQuantity[seq].equipmentName : undefined,
              month: [{
                equipmentId: totalProductionEquipmentQuantity[seq] ? totalProductionEquipmentQuantity[seq].equipmentId : undefined,
                quantity: undefined,
                month: undefined
              }],
              totalQuantity: totalProductionEquipmentQuantity[seq] ? totalProductionEquipmentQuantity[seq].totalLength : groupByProductionDate.sum(item => item.length || 0)
            });

            productionWeigthList![seq].month!.shift();
            productionMiterList![seq].month!.shift();

            if (seq !== totalProductionEquipmentQuantity!.length) {
              for (let i = 1; i <= 12; i++) {
                productionWeigthList![seq].month!.push({
                  equipmentId: groupByProduction[seq].equipmentId,
                  month: i,
                  quantity: groupByProduction.filter(item => item.equipmentId === totalProductionEquipmentQuantity[seq].equipmentId && item.month === i).length > 0 ?
                    groupByProduction.filter(item => item.equipmentId === totalProductionEquipmentQuantity[seq].equipmentId && item.month === i).sum(item => item.quantity || 0) : undefined
                });

                productionMiterList![seq].month!.push({
                  equipmentId: groupByProduction[seq].equipmentId,
                  month: i,
                  quantity: groupByProduction.filter(item => item.equipmentId === totalProductionEquipmentQuantity[seq].equipmentId && item.month === i).length > 0 ?
                    groupByProduction.filter(item => item.equipmentId === totalProductionEquipmentQuantity[seq].equipmentId && item.month === i).sum(item => item.length || 0) : undefined
                });
              }
            }
            else {
              for (let i = 1; i <= 12; i++) {
                productionWeigthList[seq].month!.push({
                  equipmentId: undefined,
                  month: i,
                  quantity: groupByProductionDate.filter(item => item.month === i).length > 0 ?
                    groupByProductionDate.filter(item => item.month === i).single()!.quantity : undefined
                });

                productionMiterList[seq].month!.push({
                  equipmentId: undefined,
                  month: i,
                  quantity: groupByProductionDate.filter(item => item.month === i).length > 0 ?
                    groupByProductionDate.filter(item => item.month === i).single()!.length : undefined
                });
              }
            }
          }
        }

        this.items.push({
          inputInfo: inputList,
          productionWeight: productionWeigthList,
          productionMiter: productionMiterList
        });

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

interface IProductionLossStatusVM {
  inputInfo: IProductionInfoVM[] | undefined;
  productionWeight: IProductionInfoVM[] | undefined;
  productionMiter: IProductionInfoVM[] | undefined;
}

interface IProductionInfoVM {
  type: "투입량" | "실중량" | "생산량" | "Loss량" | "LOSS율" | "스크랩량";
  equipmentId: number | undefined;
  equipmentName: string | undefined;
  unitName: string;
  month: IProductionDayInfoVM[] | undefined;
  totalQuantity: number | undefined;
}

interface IProductionDayInfoVM {
  equipmentId: number | undefined;
  month: number | undefined;
  quantity: number | undefined;
}

//TODO: LOSS량, LOSS율, 스크랩량, PE박리량 구해야함