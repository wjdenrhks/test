import {SdModalBase, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from "@angular/core";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
import {AppDataProvider} from "@sample/client-common";
import {Goods, MainDbContext} from "@sample/main-database";
import {IGoodsVM} from "../modules/base-info/GoodsPage";

@Component({
  selector: "app-goods-search-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="busyCount > 0">
      <sd-dock-container style="min-width: 720px;">
        <sd-dock class="sd-padding-sm-default">
          <sd-form [inline]="true" (submit)="onSearchFormSubmit()">

            <sd-form-item [label]="'구분'">
              <sd-select [(value)]="filter.type" (valueChange)="onTypeChange($event)">
                <sd-select-item [value]="undefined">전체</sd-select-item>
                <sd-select-item [value]="type.name" *ngFor="let type of types; trackBy: trackByMeFn">
                  {{ type.name }}
                </sd-select-item>
              </sd-select>
            </sd-form-item>
            <sd-form-item [label]="'분류'">
              <sd-select [(value)]="filter.category">
                <sd-select-item [value]="undefined">전체</sd-select-item>
                <sd-select-item [value]="category.name"
                                *ngFor="let category of categories; trackBy: trackByMeFn">
                  {{ category.name }}
                </sd-select-item>
              </sd-select>
            </sd-form-item>
            <sd-form-item [label]="'제품명'">
              <sd-textfield [(value)]="filter.name"></sd-textfield>
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
          <sd-sheet [id]="'goods-search-modal'" [items]="orgItems" [trackBy]="trackByIdFn"
                    [selectable]="'multi'"
                    (selectedItemsChange)="onSelectedItemsChange($event)">
            <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm" style="text-align: center;">
                  <span>{{ item.id }}</span>
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'구분'" [width]="100">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.type }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'분류'" [width]="100">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.category }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'명칭'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.name }}
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
            <sd-sheet-column [header]="'무게'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.weight }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'단위'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.unitName }}
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
          <sd-sheet [id]="'goods-search-modal'" [items]="orgItems" [trackBy]="trackByIdFn"
                    [selectable]="true"
                    (selectedItemChange)="onSelectedItemChange($event)">
            <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm" style="text-align: center;">
                  <span>{{ item.id }}</span>
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'구분'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.type }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'분류'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.category }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'명칭'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.name }}
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
            <sd-sheet-column [header]="'무게'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.weight }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'단위'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.unitName }}
                </div>
              </ng-template>
            </sd-sheet-column>
          </sd-sheet>
        </ng-container>

      </sd-dock-container>
    </sd-busy-container>`
})
export class GoodsSearchModal extends SdModalBase<{ goodId?: number; isMulti?: boolean; isAll?: boolean; isMaterial?: boolean; type?: string }, any> {
  public filter: {
    type?: string;
    category?: string;
    goodId?: number;
    name?: string;
    specification?: string;
    isAll?: boolean;
  } = {};

  public lastFilter?: {
    type?: string;
    category?: string;
    goodId?: number;
    name?: string;
    specification?: string;
    isAll?: boolean;
  };

  public pagination = {
    page: 0,
    length: 0
  };

  public types: {
    name: string | undefined;
    category: {
      name: string | undefined;
    }[];
  }[] = [];

  public categories: {
    name: string | undefined;
  }[] = [];

  public items: IGoodsVM[] = [];
  public orgItems: IGoodsVM[] = [];

  public busyCount = 0;
  public isDisabled?: boolean;
  public isMaterial: boolean | undefined;
  public isMulti: boolean | undefined;

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

  public async sdOnOpen(param: { goodId?: number; isMulti?: boolean; isAll?: boolean; isMaterial?: boolean; type?: string }): Promise<void> {
    this.busyCount++;

    this.isMulti = param.isMulti;
    this.isMaterial = param.isMaterial;

    this.filter.goodId = param.goodId;
    this.filter.isAll = param.isAll;

    await this._orm.connectAsync(MainDbContext, async db => {
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

    this.filter.type = param.type;

    if (this.isMaterial) {
      this.filter.type = "원재료";
    }

    await this.onSearchFormSubmit();

    this.busyCount--;
    this._cdr.markForCheck();
  }

  public onTypeChange(name?: string): void {
    this.filter.category = undefined;

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

  public onSelectedItemChange(item: IGoodsVM): void {
    this.close(item);
  }

  private async _search(): Promise<void> {
    this.busyCount++;

    try {
      await this._orm.connectAsync(MainDbContext, async db => {

        const queryable = this._getSearchQueryable(db);

        const result = await queryable
          .orderBy(item => item.id)
          .limit(this.pagination.page * 20, 20)
          .select(item => ({
            viewId: item.id,
            id: item.id,
            name: item.name,
            specification: item.specification,
            type: item.type,
            category: item.category,
            thick: item.thick,
            weight: item.weight,
            unitId: item.unitId,
            unitName: item.unitName,
            unitPrice: item.unitPrice,
            stockQuantity: item.stockQuantity,
            lossQuantity: item.lossQuantity,
            length: item.length,
            adequateStock: item.adequateStock,
            adequateStockRate: item.adequateStockRate,
            remark: item.remark,
            erpSyncCode: item.erpSyncCode,
            isDisabled: item.isDisabled
          }))
          .resultAsync();

        this.orgItems = result.map(item => ({
          viewId: item.viewId,
          id: item.id,
          name: item.name,
          specification: item.specification,
          type: item.type,
          category: item.category,
          thick: item.thick,
          weight: item.weight,
          unitId: item.unitId,
          unitName: item.unitName,
          unitPrice: item.unitPrice,
          stockQuantity: item.stockQuantity,
          lossQuantity: item.lossQuantity,
          length: item.length,
          adequateStock: item.adequateStock,
          adequateStockRate: item.adequateStockRate,
          remark: item.remark,
          erpSyncCode: item.erpSyncCode,
          isDisabled: item.isDisabled
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

  private _getSearchQueryable(db: MainDbContext): Queryable<Goods> {
    let queryable = db.goods
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId),
        sorm.equal(item.isDisabled, false)
      ]);

    if (!this.lastFilter!.isAll) {
      queryable = queryable.where(item => [
        sorm.equal(item.isDisabled, false)
      ]);
    }

    if (this.lastFilter!.type) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.type, this.lastFilter!.type)
        ]);
    }

    if (this.lastFilter!.category) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.category, this.lastFilter!.category)
        ]);
    }

    if (this.lastFilter!.goodId) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.id, this.lastFilter!.goodId)
        ]);
    }

    if (this.lastFilter!.name) {
      queryable = queryable.where(item => [
        sorm.includes(item.name, this.lastFilter!.name!)
      ]);
    }

    if (this.lastFilter!.specification) {
      queryable = queryable.where(item => [
        sorm.includes(item.specification, this.lastFilter!.specification!)
      ]);
    }

    return queryable;
  }
}

