import {SdModalBase, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from "@angular/core";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
import {AppDataProvider} from "@sample/client-common";
import {LotHistory, MainDbContext} from "@sample/main-database";

@Component({
  selector: "app-lot-search-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="busyCount > 0">
      <sd-dock-container style="min-width: 720px;">
        <sd-dock class="sd-padding-sm-default">
          <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
            <sd-form-item [label]="'품명'">
              <sd-textfield [(value)]="filter.goodName"></sd-textfield>
            </sd-form-item>
            <sd-form-item [label]="'규격'">
              <sd-textfield [(value)]="filter.specification"></sd-textfield>
            </sd-form-item>
            <sd-form-item [label]="'LOT'">
              <sd-textfield [(value)]="filter.lot"></sd-textfield>
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
          <sd-sheet [id]="'lot-search-modal'" [items]="orgItems" [trackBy]="trackByIdFn"
                    [selectable]="'multi'"
                    (selectedItemsChange)="onSelectedItemsChange($event)">
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
            <sd-sheet-column [header]="'LOT'" [width]="200">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.lot }}
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
          <sd-sheet [id]="'lot-search-modal'" [items]="orgItems" [trackBy]="trackByIdFn"
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
            <sd-sheet-column [header]="'LOT'" [width]="200">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.lot }}
                </div>
              </ng-template>
            </sd-sheet-column>
          </sd-sheet>
        </ng-container>

      </sd-dock-container>
    </sd-busy-container>`
})
export class LotSearchModal extends SdModalBase<{ goodId?: number; isMulti?: boolean; useTransfer?: boolean }, any> {
  public filter: {
    goodId?: number;
    goodName?: string;
    specification?: string;
    lot?: string;
  } = {};

  public lastFilter?: {
    goodId?: number;
    goodName?: string;
    specification?: string;
    lot?: string;
  };

  public pagination = {
    page: 0,
    length: 0
  };

  public items: ILotSearchVM[] = [];
  public orgItems: ILotSearchVM[] = [];

  public busyCount = 0;
  public isMulti: boolean | undefined;
  public useTransfer: boolean | undefined;

  public trackByIdFn(item: any): number {
    return item.id;
  }

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _cdr: ChangeDetectorRef,
                     private readonly _appData: AppDataProvider,
                     private readonly _toast: SdToastProvider) {
    super();
  }

  public async sdOnOpen(param: { goodId?: number; isMulti?: boolean; useTransfer?: boolean }): Promise<void> {
    this.busyCount++;

    this.isMulti = param.isMulti;
    this.useTransfer = param.useTransfer;
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

  public onSelectedItemsChange(item: any): void {
    this.items = Object.clone(item);
  }

  public onSelectedItem(): void {
    this.close(this.items);
  }

  public onSelectedItemChange(item: ILotSearchVM): void {
    this.close(item);
  }

  private async _search(): Promise<void> {
    this.busyCount++;

    try {
      await this._orm.connectAsync(MainDbContext, async db => {

        const queryable = this._getSearchQueryable(db);

        const result = await queryable
          .include(item => item.goods)
          .orderBy(item => item.createdAtDateTime)
          .limit(this.pagination.page * 20, 20)
          .select(item => ({
            id: item.id,
            lot: item.lot,
            goodId: item.goodId,
            goodName: item.goods!.name,
            specification: item.goods!.specification,
            warehouseId: item.warehouseId,
            isTransfer: item.transLot
          }))
          .resultAsync();

        this.orgItems = result.map(item => ({
          id: item.id,
          lot: item.lot,
          goodId: item.goodId,
          goodName: item.goodName,
          specification: item.specification,
          warehouseId: item.warehouseId,
          isTransfer: item.isTransfer
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

  private _getSearchQueryable(db: MainDbContext): Queryable<LotHistory> {
    let queryable = db.lotHistory
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);

    queryable = queryable
      .where(item => [
        sorm.null(item.transLot)
      ]);

    if (this.lastFilter!.goodId) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.goodId, this.lastFilter!.goodId)
        ]);
    }

    if (this.lastFilter!.goodName) {
      queryable = queryable
        .include(item => item.goods)
        .where(item => [
          sorm.includes(item.goods!.name, this.lastFilter!.goodName)
        ]);
    }

    if (this.lastFilter!.specification) {
      queryable = queryable
        .include(item => item.goods)
        .where(item => [
          sorm.includes(item.goods!.specification, this.lastFilter!.specification)
        ]);
    }

    if (this.lastFilter!.lot) {
      queryable = queryable
        .where(item => [
          sorm.includes(item.lot, this.lastFilter!.lot)
        ]);
    }

    if (this.useTransfer) {
      queryable = queryable
        .where(item => [
          sorm.null(item.transLotId)
        ]);
    }

    return queryable;
  }
}

interface ILotSearchVM {
  id: number | undefined;
  lot: string | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  warehouseId: number | undefined;
  specification: string | undefined;
  isTransfer: string | undefined;
}
