import {SdModalBase, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from "@angular/core";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
import {AppDataProvider} from "@sample/client-common";
import {MainDbContext, ProductionInfo} from "@sample/main-database";
import {IProductionGoodsVM} from "../modules/base-info/ProductionInfoPage";

@Component({
  selector: "app-goods-inspection-copy-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="busyCount > 0">
      <sd-dock-container style="min-width: 670px; min-height: 500px;">
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
                    (selectedItemChange)="onSelectedItemChange($event, selectedItem)">
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

          <sd-dock [position]="'bottom'" *ngIf="selectedItem"
                   style="height: 250px;">
            <sd-dock-container class="sd-background-default">
              <sd-pane>
                <sd-dock-container>
                  <sd-pane>
                    <sd-sheet [id]="'production-goods-modal'"
                              [items]="selectedItem.productionGoods"
                              [trackBy]="trackByMeFn">
                      <sd-sheet-column [header]="'구분'" [width]="80">
                        <ng-template #item let-item="item">
                          <sd-select [(value)]="item.type">
                            <sd-select-item [value]="'재생'">재생</sd-select-item>
                            <sd-select-item [value]="'판매'">판매</sd-select-item>
                          </sd-select>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'제품구분'">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm">
                            {{ item.goodType }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'분류'">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm">
                            {{ item.goodCategory }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'제품명'">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm">
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
                    </sd-sheet>
                  </sd-pane>
                </sd-dock-container>
              </sd-pane>

            </sd-dock-container>
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
export class GoodsProductionCopyModal extends SdModalBase<{ goodId?: number; goodsGroupId?: number }, IGoodProductionCopyVM> {
  public filter: {
    goodId?: number;
    goodsGroupId?: number;
    goodName?: string;
    specification?: string;
  } = {};

  public lastFilter?: {
    goodId?: number;
    goodsGroupId?: number;
    goodName?: string;
    specification?: string;
  };

  public pagination = {
    page: 0,
    length: 0
  };

  public items: IGoodProductionCopyVM[] = [];

  public busyCount = 0;

  public selectedItem?: IGoodProductionCopyVM;

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
    this.filter.goodsGroupId = param.goodsGroupId;
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

  public async onSelectedItemChange(isSelected: boolean, item: IGoodProductionCopyVM): Promise<void> {
    if (isSelected) {
      await this._selectItem(item);
    }
    else {
      this.selectedItem = undefined;
    }
    this._cdr.markForCheck();
  }

  private async _selectItem(item: IGoodProductionCopyVM): Promise<void> {
    this.selectedItem = item;

    if (!!item.id) {
      this.selectedItemBusyCount++;

      await this._orm.connectAsync(MainDbContext, async db => {
        // BOM 구성 가져오기
        item.productionGoods = await db.goodsProductionGoods
          .include(item1 => item1.productionGoods)
          .where(item1 => [
            sorm.equal(item1.companyId, this._appData.authInfo!.companyId),
            sorm.equal(item1.productionInfoId, this.selectedItem!.id)
          ])
          .select(item1 => ({
            id: item1.id,
            type: item1.type,
            goodId: item1.productionGoodId,
            goodType: item1.productionGoods!.type,
            goodCategory: item1.productionGoods!.category,
            goodName: item1.productionGoods!.name,
            specification: item1.productionGoods!.specification
          }))
          .resultAsync();
      });

      this._cdr.markForCheck();
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
          .select(item => ({
            id: item.id,
            goodId: item.goodId,
            goodName: item.goods!.name,
            specification: item.goods!.specification,

            productionGoods: undefined
          }))
          .orderBy(item => item.id)
          .limit(this.pagination.page * 10, 10)
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
        sorm.equal(item.isProductionGoods, true),
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

interface IGoodProductionCopyVM {
  id: number | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  specification: string | undefined;

  productionGoods: IProductionGoodsVM[] | undefined;
}
