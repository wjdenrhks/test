import {SdModalBase, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from "@angular/core";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
import {AppDataProvider} from "@sample/client-common";
import {MainDbContext, ProductionInfo} from "@sample/main-database";
import {GoodsInspection} from "../../../main-database/src";
import {IQualityListVM} from "../modules/base-info/ProductionInfoPage";

@Component({
  selector: "app-goods-inspection-copy-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="busyCount > 0">
      <sd-dock-container style="min-width: 750px; min-height: 500px;">
        <sd-dock class="sd-padding-sm-default">
          <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
            <sd-form-item [label]="'제품명'">
              <sd-textfield [(value)]="filter.goodName"></sd-textfield>
            </sd-form-item>
            <sd-form-item [label]="'규격'">
              <sd-textfield [(value)]="filter.specification"></sd-textfield>
            </sd-form-item>
            <sd-form-item>
              <sd-button [type]="'submit'">
                <sd-icon [icon]="'search'" [fixedWidth]="true"></sd-icon>
                조회
              </sd-button>
            </sd-form-item>
          </sd-form>
        </sd-dock>

        <sd-dock class="sd-padding-sm-default">
          <sd-pagination [page]="pagination.page" [length]="pagination.length"
                         (pageChange)="onPageClick($event)"></sd-pagination>
        </sd-dock>

        <sd-dock-container style="min-height: 500px;">
          <sd-sheet [id]="'good-inspection-copy-modal'"
                    [items]="items"
                    [trackBy]="trackByIdFn"
                    [(selectedItem)]="selectedItem"
                    [selectable]="true"
                    (selectedItemChange)="onSelectedItemChange($event)">
            <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm" style="text-align: center;">
                  <span>{{ item.id }}</span>
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'제품명'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.goodName }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'규격'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.specification }}
                </div>
              </ng-template>
            </sd-sheet-column>
          </sd-sheet>

          <sd-dock [position]="'bottom'" style="height: 250px;" *ngIf="selectedItem">
            <sd-busy-container [busy]="selectedItemBusyCount > 0">
              <sd-dock-container class="sd-background-default">
                <sd-dock class="sd-padding-xs-sm">
                  <h5 style="display: inline-block; padding-right: 1.4em;">QC 검사 항목</h5>
                </sd-dock>

                <sd-pane>
                  <sd-sheet [id]="'quality-check-modal'"
                            [items]="selectedItem.qualityCheckList"
                            [trackBy]="trackByIdFn"
                            [(selectedItem)]="selectedChart"
                            [selectable]="true">
                    <sd-sheet-column [header]="'검수 항목'">
                      <ng-template #item let-item="item">
                        <div class="sd-padding-xs-sm">
                          {{ item.name }}
                        </div>
                      </ng-template>
                    </sd-sheet-column>
                    <sd-sheet-column [header]="'시험방법'" [width]="100">
                      <ng-template #item let-item="item">
                        <div class="sd-padding-sm-xs" style="text-align: center;">
                          {{ item.testType }}
                        </div>
                      </ng-template>
                    </sd-sheet-column>
                    <sd-sheet-column [header]="'단위'" [width]="100">
                      <ng-template #item let-item="item">
                        <div class="sd-padding-sm-xs" style="text-align: center;">
                          {{ item.unit }}
                        </div>
                      </ng-template>
                    </sd-sheet-column>
                    <sd-sheet-column [header]="'규격'" [width]="100">
                      <ng-template #item let-item="item">
                        <div class="sd-padding-sm-xs" style="text-align: center;">
                          {{ item.specification }}
                        </div>
                      </ng-template>
                    </sd-sheet-column>
                    <sd-sheet-column [header]="'사용여부'" [width]="60">
                      <ng-template #item let-item="item">
                        <div style="text-align: center;">
                          <sd-checkbox [(value)]="item.isCheck" [disabled]="true"></sd-checkbox>
                        </div>
                      </ng-template>
                    </sd-sheet-column>
                    <sd-sheet-column [header]="'Xbar R 차트 기준'" [width]="110">
                      <ng-template #item let-item="item">
                        <div style="text-align: center;">
                          <sd-checkbox [(value)]="item.isUsingChart" [disabled]="true"></sd-checkbox>
                        </div>
                      </ng-template>
                    </sd-sheet-column>
                  </sd-sheet>
                </sd-pane>
                <sd-dock [position]="'right'"
                         [id]="'production-modal'"
                         *ngIf="selectedChart && selectedChart.isCheck && selectedChart.chartInfo">
                  <div style="display: inline-block">
                    <sd-form style="margin-top: 10px; margin-bottom: 10px; margin-left: 10px;">
                      <sd-form-item [label]="'최소값'">
                        <sd-textfield [(value)]="selectedChart.chartInfo.min" [disabled]="true"></sd-textfield>
                      </sd-form-item>
                      <sd-form-item [label]="'평균값'">
                        <sd-textfield [(value)]="selectedChart.chartInfo.avg" [disabled]="true"></sd-textfield>
                      </sd-form-item>
                      <sd-form-item [label]="'최대값'">
                        <sd-textfield [(value)]="selectedChart.chartInfo.max" [disabled]="true"></sd-textfield>
                      </sd-form-item>
                    </sd-form>
                  </div>
                  <div style="display: inline-block">
                    <sd-form style="margin-top: 10px; margin-bottom: 10px; margin-left: 10px;">
                      <sd-form-item [label]="'표준편차 최소값'">
                        <sd-textfield [(value)]="selectedChart.chartInfo.standardDeviationMin"
                                      [disabled]="true"></sd-textfield>
                      </sd-form-item>
                      <sd-form-item [label]="'표준편차 평균값'">
                        <sd-textfield [(value)]="selectedChart.chartInfo.standardDeviationAvg"
                                      [disabled]="true"></sd-textfield>
                      </sd-form-item>
                      <sd-form-item [label]="'표준편차 최대값'">
                        <sd-textfield [(value)]="selectedChart.chartInfo.standardDeviationMax"
                                      [disabled]="true"></sd-textfield>
                      </sd-form-item>
                    </sd-form>
                  </div>
                </sd-dock>
              </sd-dock-container>
            </sd-busy-container>
          </sd-dock>
        </sd-dock-container>

        <sd-dock [position]="'bottom'"
                 style="text-align: right; padding-right: 20px; padding-top: 5px; padding-bottom: 5px;">
          <sd-form [inline]="true" (submit)="onSelectedItem()">
            <sd-form-item>
              <sd-button [type]="'submit'">
                <sd-icon [icon]="'save'" [fixedWidth]="true"></sd-icon>
                선택
              </sd-button>
            </sd-form-item>
          </sd-form>
        </sd-dock>

      </sd-dock-container>
    </sd-busy-container>`
})
export class GoodsInspectionCopyModal extends SdModalBase<{ goodId?: number; goodsGroupId?: number }, IProductionInspectionCopyVM> {
  public filter: {
    goodId?: number;
    goodName?: string;
    specification?: string;
  } = {};

  public lastFilter?: {
    goodId?: number;
    goodName?: string;
    specification?: string;
  };

  public pagination = {
    page: 0,
    length: 0
  };

  public items: IProductionInspectionCopyVM[] = [];

  public busyCount = 0;

  public selectedItem?: IProductionInspectionCopyVM;
  public selectedChart?: IQualityListVM;

  public selectedItemBusyCount = 0;

  public trackByIdFn(item: any): number {
    return item.id;
  }

  public trackByMeFn = (i: number, item: any) => item;

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _cdr: ChangeDetectorRef,
                     private readonly _appData: AppDataProvider,
                     private readonly _toast: SdToastProvider) {
    super();
  }

  public async sdOnOpen(param: { goodId?: number; goodsGroupId?: number }): Promise<void> {
    this.busyCount++;


    this.filter.goodId = param.goodId;
    await this.onSearchFormSubmit();

    this.busyCount--;
    this._cdr.markForCheck();
  }

  public async onSearchFormSubmit(): Promise<void> {
    this.pagination.page = 0;
    this.lastFilter = Object.clone(this.filter);
    await this._search();
  }

  public async onPageClick(page: number): Promise<void> {
    this.pagination.page = page;
    await this._search();
  }

  public async onSelectedItemChange(item: IProductionInspectionCopyVM): Promise<void> {
    await this._selectItem(item);
    this._cdr.markForCheck();
  }

  private async _selectItem(item: IProductionInspectionCopyVM): Promise<void> {
    this.selectedItem = item;

    if (!!item.id) {
      this.selectedItemBusyCount++;

      await this._orm.connectAsync(MainDbContext, async db => {
        // 검사 항목 가져오기
        const result = await db.baseType
          .where(item1 => [
            sorm.equal(item1.companyId, this._appData.authInfo!.companyId),
            sorm.equal(item1.type, "검사항목"),
            sorm.equal(item1.isDisabled, false)
          ])
          .join(
            GoodsInspection,
            "goodsInspectionInfo",
            (qb, en) => qb
              .include(item1 => item1.inspection)
              .where(item1 => [
                sorm.equal(item1.goodsId, item.goodId),
                sorm.equal(item1.inspectionId, en.id)
              ])
              .select(item1 => ({
                id: item1.id,
                inspectionTypeId: item1.inspectionId,
                inspectionTypeName: item1.inspection!.name,
                testType: item1.testType,
                unit: item1.unit,
                specification: item1.specification,
                isCheck: true,
                isUsingChart: item1.isUsingChart,
                min: item1.min,
                avg: item1.avg,
                max: item1.max,
                standardDeviationMin: item1.standardDeviationMin,
                standardDeviationAvg: item1.standardDeviationAvg,
                standardDeviationMax: item1.standardDeviationMax
              })),
            true
          )
          .select(item1 => ({
            id: item1.id,
            name: item1.name,
            isCheck: sorm.cast(sorm.notNull(item1.goodsInspectionInfo!.id), Boolean),
            isUsingChart: sorm.cast(sorm.ifNull(item1.goodsInspectionInfo!.isUsingChart, false), Boolean),
            testType: item1.goodsInspectionInfo!.testType,
            unit: item1.goodsInspectionInfo!.unit,
            specification: item1.goodsInspectionInfo!.specification,
            chartInfo: item1.goodsInspectionInfo
          }))
          .resultAsync();

        item.qualityCheckList = [];
        this.selectedChart = undefined;

        for (const inspectionItem of result || []) {
          item.qualityCheckList!.push({
            id: inspectionItem.id,
            name: inspectionItem.name,
            testType: inspectionItem.testType,
            unit: inspectionItem.unit,
            specification: inspectionItem.specification,
            isCheck: inspectionItem.isCheck,
            isUsingChart: inspectionItem.isUsingChart,
            chartInfo: inspectionItem.chartInfo
          });
        }

      });

      this.selectedItemBusyCount--;
    }
  }

  public onSelectedItem(): void {
    this.close(this.selectedItem);
  }

  private async _search(): Promise<void> {
    this.busyCount++;

    try {
      await this._orm.connectAsync(MainDbContext, async db => {

        const queryable = this._getSearchQueryable(db);

        this.items = await queryable
          .orderBy(item => item.id)
          .limit(this.pagination.page * 10, 10)
          .include(item => item.goods)
          .select(item => ({
            id: item.id,
            goodId: item.goodId,
            goodName: item.goods!.name,
            specification: item.goods!.specification,

            qualityCheckList: undefined
          }))
          .resultAsync();


        const totalCount = await queryable.countAsync();
        this.pagination.length = Math.ceil(totalCount / 10);
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }
    finally {
      this.busyCount--;
      this._cdr.markForCheck();

    }
  }

  private _getSearchQueryable(db: MainDbContext): Queryable<ProductionInfo> {
    let queryable = db.productionInfo
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId),
        sorm.equal(item.isDisabled, false)
      ]);

    if (this.lastFilter!.goodId) {
      queryable = queryable
        .where(item => [
          sorm.notEqual(item.goodId, this.lastFilter!.goodId)
        ]);
    }

    if (this.lastFilter!.specification) {
      queryable = queryable
        .include(item => item.goods)
        .where(item => [
          sorm.includes(item.goods!.specification, this.lastFilter!.specification)
        ]);
    }

    if (this.lastFilter!.goodName) {
      queryable = queryable
        .include(item => item.goods)
        .where(item => [
          sorm.includes(item.goods!.name, this.lastFilter!.goodName)
        ]);
    }

    return queryable;
  }
}

interface IProductionInspectionCopyVM {
  id: number | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  specification: string | undefined;

  qualityCheckList: IQualityListVM[] | undefined;
}