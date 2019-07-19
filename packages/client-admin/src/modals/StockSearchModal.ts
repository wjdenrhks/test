import {SdModalBase, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from "@angular/core";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
import {AppDataProvider} from "@sample/client-common";
import {MainDbContext, QuantityCheckInspectionItem, Stock} from "@sample/main-database";

@Component({
  selector: "app-stock-search-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="busyCount > 0">
      <sd-dock-container style="min-width: 720px;">
        <sd-dock class="sd-padding-sm-default">
          <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
            <sd-form-item [label]="'창고'">
              <sd-select [(value)]="filter.warehouseId">
                <sd-select-item [value]="undefined">전체</sd-select-item>
                <sd-select-item *ngFor="let warehouse of warehouseList; trackBy: trackByMeFn"
                                [value]="warehouse.id"
                                [hidden]="warehouse.isDisabled">
                  {{ warehouse.name }}
                </sd-select-item>
              </sd-select>
            </sd-form-item>
            <sd-form-item [label]="'구분'">
              <sd-select [(value)]="filter.goodType" (valueChange)="onTypeChange($event)">
                <sd-select-item [value]="undefined">전체</sd-select-item>
                <sd-select-item [value]="type.name" *ngFor="let type of types; trackBy: trackByMeFn">
                  {{ type.name }}
                </sd-select-item>
              </sd-select>
            </sd-form-item>
            <sd-form-item [label]="'분류'">
              <sd-select [(value)]="filter.goodCategory">
                <sd-select-item [value]="undefined">전체</sd-select-item>
                <sd-select-item [value]="category.name"
                                *ngFor="let category of categories; trackBy: trackByMeFn">
                  {{ category.name }}
                </sd-select-item>
              </sd-select>
            </sd-form-item>
            <br>
            <sd-form-item [label]="'제품명'">
              <sd-textfield [(value)]="filter.name"></sd-textfield>
            </sd-form-item>
            <sd-form-item [label]="'규격'">
              <sd-textfield [(value)]="filter.specification"></sd-textfield>
            </sd-form-item>
            <sd-form-item [label]="'제품 LOT'">
              <sd-textfield [(value)]="filter.productLot"></sd-textfield>
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

        <ng-container *ngIf="isMulti !== false">
          <sd-sheet [id]="'stock-search-modal'" [items]="orgItems" [trackBy]="trackByIdFn"
                    [selectable]="'multi'"
                    (selectedItemsChange)="onSelectedItemsChange($event)">
            <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm" style="text-align: center;">
                  <span>{{ item.id }}</span>
                </div>
              </ng-template>
            </sd-sheet-column>
            <!--<sd-sheet-column [header]="'포장 LOT'" *ngIf="!filter.isPackingSearch">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.packingLot }}
                </div>
              </ng-template>
            </sd-sheet-column>-->
            <sd-sheet-column [header]="'LOT'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.lotName }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'제품'">
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
            <sd-sheet-column [header]="'단위'" [width]="100">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs" style="text-align: center;">
                  {{ item.unitName }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'수량'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs" style="text-align: right;">
                  {{ item.quantity | number }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'창고'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs" style="text-align: center;">
                  {{ item.warehouseName }}
                </div>
              </ng-template>
            </sd-sheet-column>
          </sd-sheet>
          <sd-dock [position]="'bottom'"
                   style="text-align: right; padding-right: 20px; padding-top: 5px; margin-top: 5px; margin-bottom: 5px;">
            <sd-form [inline]="true" (submit)="onSelectedItem()">
              <sd-form-item>
                <sd-button [type]="'submit'">
                  <sd-icon [icon]="'save'" [fixedWidth]="true"></sd-icon>
                  저장
                </sd-button>
              </sd-form-item>
            </sd-form>
          </sd-dock>
        </ng-container>
        <ng-container *ngIf="isMulti === false">
          <sd-sheet [id]="'stock-search-modal'" [items]="orgItems" [trackBy]="trackByIdFn"
                    [selectable]="true"
                    (selectedItemChange)="onSelectedItemChange($event)">
            <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm" style="text-align: center;">
                  <span>{{ item.id }}</span>
                </div>
              </ng-template>
            </sd-sheet-column>
            <!--<sd-sheet-column [header]="'포장 LOT'" *ngIf="!filter.isPackingSearch">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.packingLot }}
                </div>
              </ng-template>
            </sd-sheet-column>-->
            <sd-sheet-column [header]="'LOT'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.lotName }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'제품'">
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
            <sd-sheet-column [header]="'단위'" [width]="100">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs" style="text-align: center;">
                  {{ item.unitName }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'수량'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs" style="text-align: right;">
                  {{ item.quantity | number }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'창고'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs" style="text-align: center;">
                  {{ item.warehouseName }}
                </div>
              </ng-template>
            </sd-sheet-column>
          </sd-sheet>
        </ng-container>

      </sd-dock-container>
    </sd-busy-container>`
})
export class StockSearchModal extends SdModalBase<{ goodId?: number; isMulti?: boolean; isPackingSearch?: boolean; isShippingRegister?: boolean; isRewind?: boolean }, any> {
  public filter: {
    packingLot?: string;
    productLot?: string;
    goodType?: string;
    goodCategory?: string;
    goodId?: number;
    name?: string;
    specification?: string;
    warehouseId?: number;
    isPackingSearch?: boolean;
    isShippingRegister?: boolean;
    isRewind?: boolean;
  } = {};

  public lastFilter?: {
    packingLot?: string;
    productLot?: string;
    goodType?: string;
    goodCategory?: string;
    goodId?: number;
    name?: string;
    specification?: string;
    warehouseId?: number;
    isPackingSearch?: boolean;
    isShippingRegister?: boolean;
    isRewind?: boolean;
  };

  public pagination = {
    page: 0,
    length: 0
  };

  public items: IStockModalVM[] = [];
  public orgItems: IStockModalVM[] = [];

  public busyCount = 0;
  public isDisabled?: boolean;
  public isMulti: boolean | undefined;

  public warehouseList: {
    id: number;
    name: string;
    isDisabled: boolean;
  }[] = [];

  public types: {
    name: string | undefined;
    category: {
      name: string | undefined;
    }[];
  }[] = [];

  public categories: {
    name: string | undefined;
  }[] = [];

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

  public async sdOnOpen(param: { goodId?: number; isMulti?: boolean; isPackingSearch?: boolean; isShippingRegister?: boolean; isRewind?: boolean }): Promise<void> {
    this.busyCount++;

    this.isMulti = param.isMulti;

    if (!!param.goodId) {
      this.filter.goodId = param.goodId;
    }

    this.filter.isPackingSearch = param.isPackingSearch;
    this.filter.isShippingRegister = param.isShippingRegister;
    this.filter.isRewind = param.isRewind;

    await this._orm.connectAsync(MainDbContext, async db => {

      this.warehouseList = await db.warehouse
        .where(item => [
          sorm.equal(item.companyId, this._appData.authInfo!.companyId),
          sorm.equal(item.isDisabled, false)
        ])
        .select(item => ({
          id: item.id!,
          name: item.name,
          isDisabled: item.isDisabled
        }))
        .resultAsync();

      const result = await db.goods
        .where(item => [
          sorm.equal(item.companyId, this._appData.authInfo!.companyId),
          sorm.notNull(item.type),
          sorm.equal(item.isDisabled, false)
        ])
        .groupBy(item => [
          item.type,
          item.category
        ])
        .select(item => ({
          type: item.type,
          category: item.category
        }))
        .resultAsync();

      this.types = result
        .groupBy(item => ({
          type: item.type
        }))
        .map(item => ({
          name: item.key.type,
          category: item.values.filter(item1 => !!item1.category).map(item1 => ({
            name: item1.category
          }))
        }));
    });

    await this.onSearchFormSubmit();

    this.busyCount--;
    this._cdr.markForCheck();
  }

  public onTypeChange(name?: string): void {
    this.filter.goodCategory = undefined;

    if (name) {
      this.categories = this.types.filter(item => item.name === name).single()!.category;
    }
    else {
      this.categories = [];
    }
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

  public onSelectedItemsChange(item: any): void {
    this.items = Object.clone(item);
  }

  public onSelectedItem(): void {
    this.close(this.items);
  }

  public onSelectedItemChange(item: IStockModalVM): void {
    this.close(item);
  }

  private async _search(): Promise<void> {
    this.busyCount++;

    try {
      await this._orm.connectAsync(MainDbContext, async db => {

        const queryable = this._getSearchQueryable(db);

        const result = await queryable
          .orderBy(item => item.lotId)
          .limit(this.pagination.page * 20, 20)
          .include(item => item.productionItem)
          .include(item => item.paletteBarcode)
          .include(item => item.goods)
          .include(item => item.warehouse)
          .include(item => item.lot)
          .join(
            QuantityCheckInspectionItem,
            "inspectionInfo",
            (qb, en) => qb
              .where(item => [
                sorm.equal(item.lotId, en.lotId)
              ])
              .select(item => ({
                rating: item.rating
              })),
            true
          )
          .select(item => ({
            id: item.id,
            packingLotId: item.paletteBarcodeId,
            packingLot: item.paletteBarcode!.paletteBarcode,
            productionItemId: item.productionItem!.id,
            lotId: item.lotId,
            lotName: item.lot!.lot,
            goodId: item.goodsId,
            goodName: item.goods!.name,
            goodCategory: item.goods!.category,
            goodThick: item.goods!.thick,
            goodLength: item.goods!.length,
            specification: item.goods!.specification,
            width: sorm.ifNull(item.lot!.width, item.goods!.specification),
            thick: sorm.ifNull(item.lot!.thick, item.goods!.thick),
            length: sorm.ifNull(item.lot!.length, 0),
            weight: sorm.ifNull(item.lot!.weight, 0),
            unitName: item.goods!.unitName,
            unitPrice: item.goods!.unitPrice,
            quantity: item.quantity,
            rating: item.rating,
            inspectionRating: item.inspectionInfo!.rating,
            warehouseId: item.warehouseId,
            warehouseName: item.warehouse!.name,
            warehouseRating: item.warehouse!.rating
          }))
          .resultAsync();

        this.orgItems = result.map(item => ({
          id: item.id,
          packingLotId: item.packingLotId,
          packingLot: item.packingLot,
          productionItemId: item.productionItemId,
          lotId: item.lotId,
          lotName: item.lotName,
          goodId: item.goodId,
          goodName: item.goodName,
          goodCategory: item.goodCategory,
          goodThick: item.goodThick,
          goodLength: item.goodLength,
          width: item.width,
          thick: item.thick,
          length: item.length,
          specification: item.specification,
          unitName: item.unitName,
          unitPrice: item.unitPrice,
          weight: item.weight,
          quantity: item.quantity,
          rating: item.rating,
          inspectionRating: item.inspectionRating,
          warehouseId: item.warehouseId,
          warehouseName: item.warehouseName,
          warehouseRating: item.warehouseRating
        }));

        const totalCount = await queryable.countAsync();
        this.pagination.length = Math.ceil(totalCount / 20);
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

  private _getSearchQueryable(db: MainDbContext): Queryable<Stock> {
    let queryable = db.stock
      .include(item => item.lot)
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);

    if (this.lastFilter!.isPackingSearch) {
      queryable = queryable
        .where(item => [
          sorm.null(item.paletteBarcodeId)
        ]);
    }

    if (this.lastFilter!.isRewind) {
      queryable = queryable
        .include(item => item.lot)
        .where(item => [
          sorm.greaterThen(item.quantity, 0),
          sorm.notNull(item.productionItemId)
        ]);
    }


    /* if (this.lastFilter!.isShippingRegister) {
       queryable = queryable
         .where(item => [
           sorm.equal(item.rating, "A")
         ]);
     }*/

    if (this.lastFilter!.isShippingRegister) {
      queryable = queryable
        .where(item => [
          sorm.greaterThen(item.quantity, 0)
        ]);
    }

    if (this.lastFilter!.productLot) {
      queryable = queryable
        .include(item => item.lot)
        .where(item => [
          sorm.equal(item.lot!.lot, this.lastFilter!.productLot)
        ]);
    }

    if (this.lastFilter!.packingLot) {
      queryable = queryable
        .include(item => item.lot)
        .where(item => [
          sorm.equal(item.paletteBarcode!.paletteBarcode, this.lastFilter!.packingLot)
        ]);
    }

    if (this.lastFilter!.goodType) {
      queryable = queryable
        .include(item => item.goods)
        .where(item => [
          sorm.equal(item.goods!.type, this.lastFilter!.goodType)
        ]);
    }

    if (this.lastFilter!.goodCategory) {
      queryable = queryable
        .include(item => item.goods)
        .where(item => [
          sorm.equal(item.goods!.category, this.lastFilter!.goodCategory)
        ]);
    }

    if (this.lastFilter!.goodId) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.goodsId, this.lastFilter!.goodId)
        ]);
    }

    if (this.lastFilter!.name) {
      queryable = queryable
        .include(item => item.goods)
        .where(item => [
          sorm.includes(item.goods!.name, this.lastFilter!.name!)
        ]);
    }

    if (this.lastFilter!.specification) {
      queryable = queryable
        .include(item => item.goods)
        .where(item => [
          sorm.includes(item.goods!.specification, this.lastFilter!.specification!)
        ]);
    }

    if (this.lastFilter!.warehouseId) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.warehouseId, this.lastFilter!.warehouseId!)
        ]);
    }

    return queryable;
  }
}

interface IStockModalVM {
  id: number | undefined;
  packingLotId: number | undefined;
  packingLot: string | undefined;
  productionItemId: number | undefined;
  lotId: number | undefined;
  lotName: string | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  goodThick: number | undefined;
  goodLength: number | undefined;
  goodCategory: string | undefined;
  specification: string | undefined;
  width: string | undefined;
  thick: number | undefined;
  length: number | undefined;
  weight: number | undefined;
  unitName: string | undefined;
  unitPrice: number | undefined;
  quantity: number | undefined;
  rating: "A" | "B" | "C" | "공통";
  inspectionRating: "A" | "B" | "C" | "공통" | undefined;
  warehouseId: number | undefined;
  warehouseName: string | undefined;
  warehouseRating: "A" | "B" | "C" | "공통";
}

