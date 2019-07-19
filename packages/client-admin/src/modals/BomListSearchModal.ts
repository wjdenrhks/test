import {SdModalBase, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from "@angular/core";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
import {AppDataProvider} from "@sample/client-common";
import {MainDbContext} from "@sample/main-database";
import {IGoodsBuildListVM} from "../modules/base-info/GoodsBuildPage";
import {GoodsBuildList} from "../../../main-database/src";

@Component({
  selector: "app-bom-list-search-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="busyCount > 0">
      <sd-dock-container style="min-width: 1250px; min-height: 600px;">
        <sd-dock class="sd-padding-sm-default">
          <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
            <sd-form-item [label]="'BOM명칭'">
              <sd-textfield [(value)]="filter.buildName"></sd-textfield>
            </sd-form-item>
            <sd-form-item [label]="'제품명'" *ngIf="!filter.isGroup">
              <sd-textfield [(value)]="filter.goodName"></sd-textfield>
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

        <sd-dock-container style="min-height: 400px;">
          <sd-sheet [id]="'bom-list-search-modal'"
                    [items]="items"
                    [trackBy]="trackByIdFn"
                    [(selectedItem)]="selectedItem"
                    [selectable]="true"
                    (selectedItemChange)="onSelectedItemChange($event, selectedItem)">
            <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm" style="text-align: center;">
                  <span>{{ item.id }}</span>
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'BOM명칭'">
              <ng-template #item let-item="item">
                <sd-textfield [(value)]="item.name" [required]="true"></sd-textfield>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'제품명'" *ngIf="!filter.isGroup">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.goodName }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'규격'" *ngIf="!filter.isGroup">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.specification }}
                </div>
              </ng-template>
            </sd-sheet-column>
          </sd-sheet>

          <sd-dock [position]="'bottom'" style="height: 200px;"
                   *ngIf="selectedItem">
            <sd-busy-container [busy]="selectedItemBusyCount > 0">
              <sd-dock-container class="sd-background-default">
                <sd-pane>
                  <sd-dock-container class="sd-background-default">
                    <sd-dock class="sd-padding-xs-sm">
                      <h5 style="display: inline-block; padding-right: 1.4em;">외층</h5>
                    </sd-dock>
                    <sd-pane>
                      <sd-sheet [id]="'goods-build-goods-outSide'"
                                [items]="selectedItem.outSideList"
                                [trackBy]="trackByMeFn">
                        <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              {{ item.seq }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'자재명'">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm">
                              {{ item.goodName }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'총 중량'" [width]="60">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              {{ item.totalWeight | number }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'배합비'" [width]="70">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              {{ item.mixPercent | number }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'중량'" [width]="60">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              {{ item.weight | number }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                      </sd-sheet>
                    </sd-pane>
                  </sd-dock-container>
                </sd-pane>

                <sd-dock [position]="'right'" style="width: 400px;">
                  <sd-dock-container class="sd-background-default">
                    <sd-dock class="sd-padding-xs-sm">
                      <h5 style="display: inline-block; padding-right: 1.4em;">내층</h5>
                    </sd-dock>
                    <sd-pane>
                      <sd-sheet [id]="'goods-build-goods-inside'"
                                [items]="selectedItem.inSideList"
                                [trackBy]="trackByMeFn">
                        <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              {{ item.seq }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'자재명'">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm">
                              {{ item.goodName }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'총 중량'" [width]="60">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              {{ item.totalWeight | number }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'배합비'" [width]="70">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              {{ item.mixPercent | number }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'중량'" [width]="60">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              {{ item.weight | number }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                      </sd-sheet>
                    </sd-pane>
                  </sd-dock-container>
                </sd-dock>

                <sd-dock [position]="'right'" style="width: 430px;">
                  <sd-dock-container class="sd-background-default">
                    <sd-dock class="sd-padding-xs-sm">
                      <h5 style="display: inline-block; padding-right: 1.4em;">중층</h5>
                    </sd-dock>
                    <sd-pane>
                      <sd-sheet [id]="'goods-build-goods-middle'"
                                [items]="selectedItem.middleList"
                                [trackBy]="trackByMeFn">
                        <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              {{ item.seq }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'자재명'">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm">
                              {{ item.goodName }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'총 중량'" [width]="60">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              {{ item.totalWeight | number }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'배합비'" [width]="70">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              {{ item.mixPercent | number }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'중량'" [width]="60">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              {{ item.weight | number }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                      </sd-sheet>
                    </sd-pane>
                  </sd-dock-container>
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
export class BomListSearchModal extends SdModalBase<{ goodId?: number; isGroup?: boolean }, IGoodsBuildListVM> {
  public filter: {
    goodId?: number;
    buildName?: string;
    groupName?: string;
    goodName?: string;
    isGroup?: boolean;
  } = {};

  public lastFilter?: {
    goodId?: number;
    buildName?: string;
    groupName?: string;
    goodName?: string;
    isGroup?: boolean;
  };

  public pagination = {
    page: 0,
    length: 0
  };

  public items: IGoodsBuildListVM[] = [];

  public busyCount = 0;

  public selectedItem?: IGoodsBuildListVM;
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

  public async sdOnOpen(param: { goodId?: number; isGroup?: boolean }): Promise<void> {
    this.busyCount++;

    this.filter.goodId = param.goodId;
    this.filter.isGroup = param.isGroup;
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

  public async onSelectedItemChange(isSelected: boolean, item: IGoodsBuildListVM): Promise<void> {
    if (isSelected) {
      await this._selectItem(item);
    }
    else {
      this.selectedItem = undefined;
    }
    this._cdr.markForCheck();
  }

  private async _selectItem(item: IGoodsBuildListVM): Promise<void> {
    this.selectedItem = item;

    if (!!item.id) {
      this.selectedItemBusyCount++;

      await this._orm.connectAsync(MainDbContext, async db => {
        // BOM 구성 가져오기
        const result = await db.goodsBuildGoods
          .include(item1 => item1.goods)
          .where(item1 => [
            sorm.equal(item1.companyId, this._appData.authInfo!.companyId),
            sorm.equal(item1.bomListId, this.selectedItem!.id)
          ])
          .select(item1 => ({
            id: item1.id,
            type: item1.type,
            seq: item1.typeSeq,
            goodId: item1.goodsId,
            goodName: item1.goods!.name,
            specification: item1.goods!.specification,
            mixPercent: sorm.cast(item1.mixPercent, Number),
            weight: sorm.cast(item1.weight, Number),
            totalWeight: sorm.cast(item1.totalWeight, Number),
            unitName: item1.goods!.unitName
          }))
          .resultAsync();

        item.outSideList = item.outSideList || [];

        for (const outSideItem of result.filter(item1 => item1.type === "외층") || []) {
          if (item.outSideList.filter(item1 => item1.goodId === outSideItem.goodId).length < 1) {
            item.outSideList!.push({
              id: outSideItem.id,
              type: "외층",
              seq: outSideItem.seq,
              goodId: outSideItem.goodId,
              goodName: outSideItem.goodName,
              specification: outSideItem.specification,
              mixPercent: outSideItem.mixPercent,
              weight: outSideItem.weight,
              totalWeight: outSideItem.totalWeight,
              unit: outSideItem.unitName,
              isDeleted: false
            });
          }
        }

        item.middleList = item.middleList || [];

        for (const middleItem of result.filter(item1 => item1.type === "중층") || []) {
          if (item.middleList.filter(item1 => item1.goodId === middleItem.goodId).length < 1) {
            item.middleList!.push({
              id: middleItem.id,
              type: "중층",
              seq: middleItem.seq,
              goodId: middleItem.goodId,
              goodName: middleItem.goodName,
              specification: middleItem.specification,
              mixPercent: middleItem.mixPercent,
              weight: middleItem.weight,
              totalWeight: middleItem.totalWeight,
              unit: middleItem.unitName,
              isDeleted: false
            });
          }
        }

        item.inSideList = item.inSideList || [];

        for (const inSideItem of result.filter(item1 => item1.type === "내층") || []) {
          if (item.inSideList.filter(item1 => item1.goodId === inSideItem.goodId).length < 1) {
            item.inSideList!.push({
              id: inSideItem.id,
              type: "내층",
              seq: inSideItem.seq,
              goodId: inSideItem.goodId,
              goodName: inSideItem.goodName,
              specification: inSideItem.specification,
              mixPercent: inSideItem.mixPercent,
              weight: inSideItem.weight,
              totalWeight: inSideItem.totalWeight,
              unit: inSideItem.unitName,
              isDeleted: false
            });
          }
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
          .include(item => item.goods)
          .orderBy(item => item.id)
          .limit(this.pagination.page * 15, 15)
          .select(item => ({
            id: item.id,
            name: item.name,
            goodId: item.goodId,
            goodName: item.goods!.name,
            specification: item.goods!.specification,
            totalWeight: sorm.ifNull(item.totalWeight, 0),
            seq: item.seq,
            isStander: item.isStander,
            isDisabled: item.isDisabled,
            createdAtDateTime: item.createdAtDateTime,

            inSideList: undefined,
            inSideTotalWeight: undefined,
            inSideTotalPercent: undefined,
            middleList: undefined,
            middleTotalWeight: undefined,
            middleTotalPercent: undefined,
            outSideList: undefined,
            outSideTotalWeight: undefined,
            outSideTotalPercent: undefined
          }))
          .resultAsync();


        const totalCount = await queryable.countAsync();
        this.pagination.length = Math.ceil(totalCount / 15);

        this.selectedItem = undefined;
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

  private _getSearchQueryable(db: MainDbContext): Queryable<GoodsBuildList> {
    let queryable = db.goodsBuildList
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId),
        sorm.equal(item.isDisabled, false)
      ]);

    if (this.lastFilter!.isGroup) {
      queryable = queryable
        .where(item => [
          sorm.notNull(item.groupName)
        ]);
    }
    else {
      queryable = queryable
        .where(item => [
          sorm.notNull(item.goodId)
        ]);
    }

    if (this.lastFilter!.goodId) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.goodId, this.lastFilter!.goodId)
        ]);
    }

    if (this.lastFilter!.buildName) {
      queryable = queryable
        .where(item => [
          sorm.includes(item.name, this.lastFilter!.buildName)
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
