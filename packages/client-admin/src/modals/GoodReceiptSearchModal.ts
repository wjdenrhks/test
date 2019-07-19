import {SdModalBase, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from "@angular/core";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
import {AppDataProvider} from "@sample/client-common";
import {GoodsReceipt, MainDbContext} from "@sample/main-database";
import {DateOnly} from "@simplism/core";

@Component({
  selector: "app-good-receipt-search-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="busyCount > 0">
      <sd-dock-container style="min-width: 520px;">
        <sd-dock class="sd-padding-sm-default">
          <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
            <sd-form-item [label]="'입고일'">
              <sd-textfield [(value)]="filter.fromDate" [type]="'date'"></sd-textfield>
            </sd-form-item>
            <sd-form-item [label]="'~'">
              <sd-textfield [(value)]="filter.toDate" [type]="'date'"></sd-textfield>
            </sd-form-item>
            <sd-form-item [label]="'거래처'">
              <sd-textfield [(value)]="filter.partnerName"></sd-textfield>
            </sd-form-item>
            <br>
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
        <ng-container *ngIf="isMulti !== false">
          <sd-sheet [id]="'good-receipt-search-modal'" [items]="orgItems" [trackBy]="trackByIdFn"
                    [selectable]="'multi'"
                    (selectedItemsChange)="onSelectedItemsChange($event)">
            <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm" style="text-align: center;">
                  <span>{{ item.id }}</span>
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'입고일'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.dueDate?.toFormatString('yyyy-MM-dd hh:mm') }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'거래처'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.partnerName }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'LOT'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.lotName }}
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
            <sd-sheet-column [header]="'수량'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.quantity }}
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
          <sd-sheet [id]="'good-receipt-search-modal'" [items]="orgItems" [trackBy]="trackByIdFn"
                    [selectable]="true"
                    (selectedItemChange)="onSelectedItemChange($event)">
            <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm" style="text-align: center;">
                  <span>{{ item.id }}</span>
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'입고일'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.dueDate.toFormatString('yyyy-MM-dd hh:mm') }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'거래처'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.partnerName }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'LOT'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.lotName }}
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
            <sd-sheet-column [header]="'수량'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.quantity }}
                </div>
              </ng-template>
            </sd-sheet-column>
          </sd-sheet>
        </ng-container>

      </sd-dock-container>
    </sd-busy-container>`
})
export class GoodReceiptSearchModal extends SdModalBase<{ isMulti?: boolean; isReceiptInspection?: boolean; isQuantityInspection?: boolean }, any> {
  public filter: {
    partnerName?: string;
    fromDate?: DateOnly;
    toDate?: DateOnly;
    goodName?: string;
    specification?: string;
    isReceiptInspection?: boolean;
    isQuantityInspection?: boolean;
  } = {};

  public lastFilter?: {
    partnerName?: string;
    fromDate?: DateOnly;
    toDate?: DateOnly;
    goodName?: string;
    specification?: string;
    isReceiptInspection?: boolean;
    isQuantityInspection?: boolean;
  };

  public pagination = {
    page: 0,
    length: 0
  };

  public items: IGoodsReceiptModalVM[] = [];
  public orgItems: IGoodsReceiptModalVM[] = [];

  public busyCount = 0;
  public isMulti: boolean | undefined;

  public trackByIdFn(item: any): number {
    return item.id;
  }

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _cdr: ChangeDetectorRef,
                     private readonly _appData: AppDataProvider,
                     private readonly _toast: SdToastProvider) {
    super();
  }

  public async sdOnOpen(param: { isMulti?: boolean; isReceiptInspection?: boolean; isQuantityInspection?: boolean }): Promise<void> {
    this.busyCount++;

    this.isMulti = param.isMulti;
    this.filter.isReceiptInspection = param.isReceiptInspection;
    this.filter.isQuantityInspection = param.isQuantityInspection;

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

  public onSelectedItemsChange(item: any): void {
    this.items = Object.clone(item);
  }

  public onSelectedItem(): void {
    this.close(this.items);
  }

  public onSelectedItemChange(item: IGoodsReceiptModalVM): void {
    this.close(item);
  }

  private async _search(): Promise<void> {
    this.busyCount++;

    try {
      await this._orm.connectAsync(MainDbContext, async db => {

        const queryable = this._getSearchQueryable(db);

        const result = await queryable
          .include(item => item.goods)
          .include(item => item.receiptLot)
          .include(item => item.partner)
          .include(item => item.warehouse)
          .include(item => item.type)
          .orderBy(item => item.id)
          .limit(this.pagination.page * 20, 20)
          .select(item => ({
            id: item.id,
            code: item.code,
            dueDate: item.dueDate,
            partnerId: item.partnerId,
            partnerName: item.partner!.name,
            goodId: item.goodId,
            goodName: item.goods!.name,
            specification: item.goods!.specification,
            quantity: item.quantity,
            unitName: item.goods!.unitName,
            typeId: item.typeId,
            typeName: sorm.ifNull(item.type!.name, "반품"),
            warehouseId: item.warehouseId,
            warehouseName: item.warehouse!.name,
            lotId: item.receiptLotId,
            lotName: item.receiptLot!.lot
          }))
          .resultAsync();

        this.orgItems = result.map(item => ({
          id: item.id,
          code: item.code,
          dueDate: item.dueDate,
          partnerId: item.partnerId,
          partnerName: item.partnerName,
          goodId: item.goodId,
          goodName: item.goodName,
          specification: item.specification,
          quantity: item.quantity,
          unitName: item.unitName,
          typeId: item.typeId,
          typeName: item.typeName,
          warehouseId: item.warehouseId,
          warehouseName: item.warehouseName,
          lotId: item.lotId,
          lotName: item.lotName
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

  private _getSearchQueryable(db: MainDbContext): Queryable<GoodsReceipt> {
    let queryable = db.goodsReceipt
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId),
        sorm.equal(item.isDisabled, false)
      ]);

    if (this.lastFilter!.fromDate || this.lastFilter!.toDate) {
      queryable = queryable
        .where(item => [
          sorm.between(item.dueDate, this.lastFilter!.fromDate, this.lastFilter!.toDate!)
        ]);
    }

    if (this.lastFilter!.isReceiptInspection) {
      queryable = queryable
        .where(item => [
          sorm.null(item.qcInspectionId),
          sorm.null(item.receiptInspectionId),
          sorm.notNull(item.typeId)
        ]);
    }

    if (this.lastFilter!.isQuantityInspection) {
      queryable = queryable
        .where(item => [
          sorm.null(item.qcInspectionId),
          sorm.null(item.receiptInspectionId),
          sorm.null(item.typeId)
        ]);
    }

    if (this.lastFilter!.goodName) {
      queryable = queryable
        .include(item => item.goods)
        .where(item => [
          sorm.includes(item.goods!.name, this.lastFilter!.goodName)
        ]);
    }

    if (this.lastFilter!.partnerName) {
      queryable = queryable
        .include(item => item.partner)
        .where(item => [
          sorm.includes(item.partner!.name, this.lastFilter!.partnerName)
        ]);
    }

    if (this.lastFilter!.specification) {
      queryable = queryable
        .include(item => item.goods)
        .where(item => [
          sorm.includes(item.goods!.specification, this.lastFilter!.specification)
        ]);
    }

    return queryable;
  }
}

interface IGoodsReceiptModalVM {
  id: number | undefined;
  code: string | undefined;
  dueDate: DateOnly | undefined;
  partnerId: number | undefined;
  partnerName: string | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  specification: string | undefined;
  quantity: number | undefined;
  unitName: string | undefined;
  typeId: number | undefined;
  typeName: string | undefined;
  warehouseId: number | undefined;
  warehouseName: string | undefined;
  lotId: number | undefined;
  lotName: string | undefined;
}
