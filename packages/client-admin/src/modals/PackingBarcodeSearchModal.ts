import {SdModalBase, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from "@angular/core";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
import {AppDataProvider} from "@sample/client-common";
import {MainDbContext, QuantityCheckInspectionItem} from "@sample/main-database";
import {Packing} from "../../../main-database/src";

@Component({
  selector: "app-packing-barcode-search-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="busyCount > 0">
      <sd-dock-container style="min-width: 700px; min-height: 350px;">
        <sd-dock class="sd-padding-sm-default">
          <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
            <sd-form-item [label]="'팔레트 바코드'">
              <sd-textfield [(value)]="filter.paletteBarcode"></sd-textfield>
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

        <sd-dock-container>
          <sd-pane>
            <sd-sheet [id]="'packing-search-modal'"
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
              <sd-sheet-column [header]="'팔레트 바코드'">
                <ng-template #item let-item="item">
                  <div class="sd-padding-sm-xs">
                    {{ item.paletteBarcode }}
                  </div>
                </ng-template>
              </sd-sheet-column>
            </sd-sheet>
          </sd-pane>

          <sd-dock [position]="'bottom'" style="height: 160px;"
                   *ngIf="selectedItem"
                   [id]="'packing-list-modal-item'">
            <sd-busy-container [busy]="selectedItemBusyCount > 0">
              <sd-dock-container class="sd-background-default">
                <sd-dock class="sd-padding-xs-sm">
                  <h5 style="display: inline-block; padding-right: 1.4em;">LOT 리스트</h5>
                </sd-dock>
                <sd-sheet [id]="'packing-list-modal-item'"
                          [items]="selectedItem.packingLotList"
                          [trackBy]="trackByMeFn">
                  <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                    <ng-template #item let-item="item">
                      <div class="sd-padding-xs-sm" style="text-align: center;">
                        {{ item.seq }}
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
                  <sd-sheet-column [header]="'품목명'">
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
                  <sd-sheet-column [header]="'수량'" [width]="80">
                    <ng-template #item let-item="item">
                      <div class="sd-padding-xs-sm" style="text-align: right;">
                        {{ item.quantity | number }}
                      </div>
                    </ng-template>
                  </sd-sheet-column>
                </sd-sheet>
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
export class PackingBarcodeSearchModal extends SdModalBase<undefined, IPackingModalVM> {
  public filter: {
    paletteBarcode?: string;
  } = {};

  public lastFilter?: {
    paletteBarcode?: string;
  };

  public pagination = {
    page: 0,
    length: 0
  };

  public items: IPackingModalVM[] = [];

  public busyCount = 0;

  public selectedItem?: IPackingModalVM;
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

  public async sdOnOpen(): Promise<void> {
    this.busyCount++;

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

  public async onSelectedItemChange(item: IPackingModalVM): Promise<void> {
    await this._selectItem(item);
    this._cdr.markForCheck();
  }

  private async _selectItem(item: IPackingModalVM): Promise<void> {
    this.selectedItem = item;

    /*if (!!item.id) {
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
            unitName: item1.goods!.unitName
          }))
          .resultAsync();

        item.outSideList = item.outSideList || [];
      });

      this.selectedItemBusyCount--;
    }*/
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
          .include(item => item.packingItems)
          .include(item => item.packingItems![0].goods)
          .include(item => item.packingItems![0].lot)
          .include(item => item.packingItems![0].stock)
          .include(item => item.packingItems![0].stock!.warehouse)
          .join(
            QuantityCheckInspectionItem,
            "inspectionInfo",
            (qb, en) => qb
              .where(item => [
                sorm.equal(item.lotId, en.packingItems![0].stock!.lotId)
              ])
              .select(item => ({
                rating: item.rating
              })),
            true
          )
          .select(item => ({
            id: item.id,
            paletteBarcode: item.paletteBarcode,
            isDisabled: item.isDisabled,

            packingLotList: item.packingItems && item.packingItems.map(item1 => ({
              id: item1.id,
              seq: sorm.query("ROW_NUMBER() OVER (ORDER BY [packingItems].lotId ASC)", Number),
              stockId: item1.stockId,
              quantity: sorm.ifNull(item1.stock!.quantity, 0),
              rating: item1.stock!.rating,
              inspectionRating: item.inspectionInfo!.rating,
              warehouseId: item1.stock!.warehouseId,
              warehouseName: item1.stock!.warehouse!.name,
              warehouseRating: item1.stock!.warehouse!.rating,
              goodId: item1.goodId,
              goodName: item1.goods!.name,
              specification: item1.goods!.specification,
              unitPrice: item1.goods!.unitPrice,
              thick: item1.lot!.thick,
              length: item1.lot!.length,
              width: item1.lot!.width,
              weight: item1.lot!.weight,
              unitName: item1.goods!.unitName,
              lotId: item1.lotId,
              lotName: item1.lot!.lot,
              isDisabled: item1.isDisabled
            })) || undefined
          }))
          .orderBy(item => item.id)
          .orderBy(item => item.packingLotList![0].seq)
          .limit(this.pagination.page * 50, 50)
          .wrap()
          .resultAsync();


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

  private _getSearchQueryable(db: MainDbContext): Queryable<Packing> {
    let queryable = db.packing
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);

    if (this.lastFilter!.paletteBarcode) {
      queryable = queryable
        .where(item => [
          sorm.includes(item.paletteBarcode, this.lastFilter!.paletteBarcode)
        ]);
    }

    return queryable;
  }
}

interface IPackingModalVM {
  id: number | undefined;
  paletteBarcode: string | undefined;
  isDisabled: boolean;

  packingLotList: IPackingLotListVM[] | undefined;
}

interface IPackingLotListVM {
  id: number | undefined;
  seq: number | undefined;
  stockId: number | undefined;
  lotId: number | undefined;
  lotName: string | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  specification: string | undefined;
  unitName: string | undefined;
  unitPrice: number | undefined;
  thick: number | undefined;
  length: number | undefined;
  weight: number | undefined;
  width: string | undefined;
  quantity: number | undefined;
  rating: "A" | "B" | "C" | "공통";
  inspectionRating: "A" | "B" | "C" | "공통" | undefined;
  warehouseId: number | undefined;
  warehouseName: string | undefined;
  warehouseRating: "A" | "B" | "C" | "공통";
  isDisabled: boolean;
}