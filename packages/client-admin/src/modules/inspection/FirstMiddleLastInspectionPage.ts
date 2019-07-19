import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from "@angular/core";
import {DateOnly, DateTime} from "@simplism/core";
import {GoodsInspection, MainDbContext, QuantityCheckInspection} from "@sample/main-database";
import {SdModalProvider, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {sorm} from "@simplism/orm-query";
import {AppDataProvider} from "@sample/client-common";
import {Queryable} from "@simplism/orm-client";
import "chart.js";
import "chartjs-plugin-annotation";
import {ChartInfoModal} from "../../modals/ChartInfoModal";
import {ShowManualModal} from "../../modals/ShowManualModal";

@Component({
  selector: "app-first-middle-last-inspection",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>Xbar-R 차트 관리</h4>

          <sd-topbar-menu (click)="onShowManualButtonClick()" style="float: right; padding-right: 25px;">
            <sd-icon [icon]="'atlas'" [fixedWidth]="true"></sd-icon>
            메뉴얼 보기
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onShowChartButtonClick()" style="float: right; margin-right: 20px;">
            <sd-icon [icon]="'chart-bar'" [fixedWidth]="true"></sd-icon>
            Xbar-R 차트
          </sd-topbar-menu>
        </sd-topbar>

        <sd-dock-container>
          <sd-dock class="sd-padding-sm-default sd-background-grey-lightest">
            <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
              <sd-form-item [label]="'검사일'">
                <sd-textfield [(value)]="filter.fromDate" [type]="'date'"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'~'">
                <sd-textfield [(value)]="filter.toDate" [type]="'date'"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'품목'">
                <app-good-select [(value)]="filter.goodId" (valueChange)="onChangeGoods($event)"></app-good-select>
              </sd-form-item>
              <sd-form-item [label]="'구분'">
                <sd-select [(value)]="filter.inspectionType" style="min-width: 100px;">
                  <sd-select-item *ngFor="let inspection of inspectionTypeList; trackBy: trackByMeFn"
                                  [value]="inspection">
                    {{ inspection.name }}
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
            <div style="display: inline-block; padding-left: 15px; font-size: 7pt">
              * 반드시 품목, 구분을 선택해야 차트를 확인 할 수 있습니다.
            </div>
          </sd-dock>

          <sd-dock class="sd-padding-sm-default">
            <sd-pagination [page]="pagination.page" [length]="pagination.length"
                           (pageChange)="onPageClick($event)"></sd-pagination>
          </sd-dock>

          <sd-busy-container [busy]="mainBusyCount > 0">
            <sd-dock-container>
              <sd-sheet #sheet [id]="'inspection-chart'"
                        [items]="items"
                        [trackBy]="trackByIdFn"
                        [(selectedItem)]="selectedItem"
                        [selectable]="true">
                <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      <span *ngIf="item.id">{{ item.id }}</span>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'생산지시ID'" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.instructionId }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'제품'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.goodName }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'규격'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.specification }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'검사항목'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.inspectionType }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'등록자'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.createdByEmployeeName }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'등록일'" [width]="130">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.createdAtDateTime?.toFormatString("yyyy-MM-dd") }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
              </sd-sheet>

              <sd-dock [position]="'bottom'" style="height: 40%" *ngIf="selectedItem"
                       [id]="'inspection-chart-item'">
                <sd-dock-container class="sd-background-default">
                  <sd-dock class="sd-padding-xs-sm">
                    <h5 style="display: inline-block; padding-right: 1.4em;">판정 기록</h5>
                  </sd-dock>

                  <sd-pane>
                    <sd-sheet [id]="'inspection-chart-item'"
                              [items]="selectedItem.inspectionItemList"
                              [trackBy]="trackByIdFn">
                      <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm" style="text-align: center;">
                            <span *ngIf="item.id">{{ item.id }}</span>
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'LOT'">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm">
                            {{ item.lotName }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'검사값'">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm">
                            {{ item.inspectionValue }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'최소값'">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm">
                            {{ item.min | number }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'최대값'">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm">
                            {{ item.max | number }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'평균값'">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm">
                            {{ item.avg | number }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'표준편차 최소값'">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm">
                            {{ item.standardDeviationMin | number }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'표준편차 평균값'">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm">
                            {{ item.standardDeviationAvg | number }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'표준편차 최대값'">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm">
                            {{ item.standardDeviationMax | number }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                    </sd-sheet>
                  </sd-pane>
                </sd-dock-container>
              </sd-dock>

            </sd-dock-container>
          </sd-busy-container>
        </sd-dock-container>
      </sd-topbar-container>
    </sd-busy-container>`
})
export class FirstMiddleLastInspectionPage implements OnInit {

  public filter: IFilterVM = {
    id: undefined,
    goodId: undefined,
    fromDate: undefined,
    toDate: undefined,
    productionOrderId: undefined,
    goodName: undefined,
    specification: undefined,
    inspectionType: {
      id: undefined,
      name: undefined
    }
  };

  public lastFilter?: IFilterVM;

  public pagination = {page: 0, length: 0};

  public items: IChartVM[] = [];
  public orgItems: IChartVM[] = [];

  public selectedItem?: IChartVM;

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public inspectionTypeList: {
    id: number;
    name: string;
  }[] = [];

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _appData: AppDataProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _modal: SdModalProvider,
                     private readonly _cdr: ChangeDetectorRef) {
  }

  public async ngOnInit(): Promise<void> {
    //품목을 반드시 선택해야 함
    //품목을 선택하면 차트를 확인 할 수 있는 생산정보 > 검사 항목이 나타남
  }

  public async onShowManualButtonClick(): Promise<void> {
    const result = await this._modal.show(ShowManualModal, "Xbar-R 차트 메뉴얼", {type: "first-middle-last-inspection"});
    if (!result) return;

    this._cdr.markForCheck();
  }

  public async onChangeGoods(): Promise<void> {
    this.inspectionTypeList = [];

    await this._orm.connectAsync(MainDbContext, async db => {
      this.inspectionTypeList = await db.goodsInspection
        .include(item => item.inspection)
        .where(item => [
          sorm.equal(item.companyId, this._appData.authInfo!.companyId),
          sorm.equal(item.goodsId, this.filter.goodId)
        ])
        .select(item => ({
          id: item.inspection!.id!,
          name: item.inspection!.name!
        }))
        .resultAsync();
    });

    this.filter.inspectionType = undefined;

    this._cdr.markForCheck();
  }

  public async onShowChartButtonClick(): Promise<void> {
    if (!this.lastFilter || !this.lastFilter!.goodId || !this.lastFilter!.inspectionType) {
      this._toast.danger("품목과 검사유형을 반드시 선택해야 합니다.");
      return;
    }

    for (const item of this.items || []) {
      if (item.inspectionItemList && item.inspectionItemList.some(item1 => isNaN(Number(item1.inspectionValue)) === true)) {
        this._toast.danger("검사항목 값이 숫자인 경우만 이용할 수 있습니다.");
        return;
      }
    }

    //Chart1 X축 : 생산지시 ID
    const chartX: number[] = [];
    const chartY: number[] = [];
    const chartZ: number[] = [];

    const chartListData = Object.clone(this.items);

    for (const item of chartListData) {
      const sum = item.inspectionItemList!.sum(item1 => Number(item1.inspectionValue) || 0);
      const listAvg = sum! / item.inspectionItemList!.length;
      const test = item.inspectionItemList!.sum(item1 => Math.pow(Number(Number(item1.inspectionValue!) - listAvg), 2));
      const dispersion = test! / (item.inspectionItemList!.length - 1);
      const standardDeviation = Math.sqrt(dispersion).toFixed(2);

      chartX.push(item.instructionId!);
      chartY.push(listAvg);
      chartZ.push(Number(standardDeviation!));
    }

    //Chart2 X축 : 생산지시 ID
    //Chart1 Y축 : 생산지시 별 검사값 평균
    //Chart2 X축 : 표준편차

    const result = await this._modal.show(ChartInfoModal, "Xbar-R차트", {dataList: this.items});

    if (!result) return;
  }

  public async onSearchFormSubmit(): Promise<void> {
    this.pagination.page = 0;

    if (!this.filter!.goodId) {
      this._toast.danger("품목을 선택해야 합니다.");
      return;
    }

    if (!this.filter.inspectionType || (this.filter.inspectionType && !this.filter!.inspectionType!.id)) {
      this._toast.danger("구분을 선택해야 합니다.");
      return;
    }

    this.lastFilter = Object.clone(this.filter);
    await this._search();
    this._cdr.markForCheck();
  }

  public async onPageClick(page: number): Promise<void> {
    this.pagination.page = page;
    await this._search();
    this._cdr.markForCheck();
  }

  private async _search(): Promise<void> {
    if (!this.lastFilter) return;

    this.mainBusyCount++;
    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        const queryable = this._getSearchQueryable(db);

        this.items = await queryable
          .include(item => item.employee)
          .include(item => item.goods)
          .include(item => item.productionInstruction)
          .include(item => item.inspectionDetails)
          .include(item => item.inspectionDetails![0].inspectionInfo)
          .include(item => item.inspectionDetails![0].lot)
          .join(
            GoodsInspection,
            "inspectionInfo",
            (qb, en) => qb
              .where(item => [
                sorm.equal(item.goodsId, en.goodsId),
                sorm.equal(item.inspectionId, en.inspectionDetails![0].inspectionInfo![0].inspectionId)
              ])
              .select(item => ({
                min: item.min,
                avg: item.avg,
                max: item.max,
                standardDeviationMin: item.standardDeviationMin,
                standardDeviationAvg: item.standardDeviationAvg,
                standardDeviationMax: item.standardDeviationMax
              })),
            true
          )
          .select(item => ({
            id: item.id,
            instructionId: item.productionInstructionId,
            instructionCode: item.productionInstruction!.productionInstructionCode,
            goodId: item.goodsId,
            goodName: item.goods!.name,
            specification: item.goods!.specification,
            inspectionType: this.lastFilter!.inspectionType!.name,
            createdByEmployeeId: item.createdByEmployeeId,
            createdByEmployeeName: item.employee!.name,
            createdAtDateTime: item.createdAtDateTime,

            inspectionItemList: item.inspectionDetails && item.inspectionDetails.map(item1 => ({
              id: item1.id,
              lotName: item1.lot!.lot,
              inspectionValue: item1.inspectionInfo![0].inspectionValue,
              min: item.inspectionInfo!.min,
              avg: item.inspectionInfo!.avg,
              max: item.inspectionInfo!.max,
              standardDeviationMin: item.inspectionInfo!.standardDeviationMin,
              standardDeviationAvg: item.inspectionInfo!.standardDeviationAvg,
              standardDeviationMax: item.inspectionInfo!.standardDeviationMax
            })) || undefined
          }))
          .orderBy(item => item.id)
          .limit(this.pagination.page * 50, 50)
          .resultAsync();

        this.orgItems = Object.clone(this.items);
        this.selectedItem = undefined;

        const totalCount = await queryable.countAsync();
        this.pagination.length = Math.ceil(totalCount / 50);
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.mainBusyCount--;
  }

  private _getSearchQueryable(db: MainDbContext): Queryable<QuantityCheckInspection> {
    let queryable = db.quantityCheckInspection
      .include(item => item.inspectionDetails)
      .include(item => item.inspectionDetails![0].inspectionInfo)
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId),
        sorm.equal(item.type, "일반"),
        sorm.equal(item.isDisabled, false),
        sorm.equal(item.inspectionDetails![0].isDisabled, false),
        sorm.notNull(item.inspectionDetails![0].inspectionInfo![0].inspectionValue)
      ]);

    if (this.lastFilter!.fromDate || this.lastFilter!.toDate) {
      queryable = queryable
        .where(item => [
          sorm.between(item.testDate!, this.lastFilter!.fromDate, this.lastFilter!.toDate!)
        ]);
    }

    if (this.lastFilter!.inspectionType) {
      queryable = queryable
        .include(item => item.inspectionDetails![0].inspectionInfo)
        .where(item => [
          sorm.equal(item.inspectionDetails![0].inspectionInfo![0].inspectionId, this.lastFilter!.inspectionType!.id)
        ]);
    }

    if (this.lastFilter!.goodId) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.goodsId, this.lastFilter!.goodId)
        ]);
    }

    if (this.lastFilter!.goodName) {
      queryable = queryable
        .include(item => item.goods)
        .where(item => [
          sorm.equal(item.goods!.name, this.lastFilter!.goodName)
        ]);
    }

    if (this.lastFilter!.specification) {
      queryable = queryable
        .include(item => item.goods)
        .where(item => [
          sorm.equal(item.goods!.specification, this.lastFilter!.specification)
        ]);
    }

    return queryable;
  }

}

interface IFilterVM {
  id?: number;
  goodId?: number;
  fromDate?: DateOnly;
  toDate?: DateOnly;
  productionOrderId?: number;
  inspectionType?: { id: number | undefined; name: string | undefined };
  goodName?: string;
  specification?: string;
}

export interface IChartVM {
  id: number | undefined;
  instructionId: number | undefined;
  instructionCode: string | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  specification: string | undefined;
  inspectionType: string | undefined;
  createdByEmployeeId: number | undefined;
  createdByEmployeeName: string | undefined;
  createdAtDateTime: DateTime | undefined;
  inspectionItemList: IChartInfoVM[] | undefined;
}

export interface IChartInfoVM {
  id: number | undefined;
  lotName: string | undefined;
  inspectionValue: string | undefined;
  min: number | undefined;
  avg: number | undefined;
  max: number | undefined;
  standardDeviationMin: number | undefined;
  standardDeviationAvg: number | undefined;
  standardDeviationMax: number | undefined;
}