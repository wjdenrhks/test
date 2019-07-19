import {SdModalBase, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from "@angular/core";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
import {AppDataProvider} from "@sample/client-common";
import {MainDbContext} from "@sample/main-database";
import {DateOnly} from "@simplism/core";
import {ProductionInstruction} from "../../../main-database/src";

@Component({
  selector: "app-production-instruction-search-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="busyCount > 0">
      <sd-dock-container style="min-width: 800px;">
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
        <ng-container *ngIf="isMulti !== false">
          <sd-sheet [id]="'production-instruction-search-modal'" [items]="orgItems" [trackBy]="trackByIdFn"
                    [selectable]="'multi'"
                    (selectedItemsChange)="onSelectedItemsChange($event)">
            <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm" style="text-align: center;">
                  <span>{{ item.id }}</span>
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'생산예정일'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs" style="text-align: center;">
                  {{ item.orderDate }}
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
            <sd-sheet-column [header]="'롤길이'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.rollLength | number }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'생산량'" [width]="90">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.productQuantity | number }}
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
          <sd-sheet [id]="'production-instruction-search-modal'" [items]="orgItems" [trackBy]="trackByIdFn"
                    [selectable]="true"
                    (selectedItemChange)="onSelectedItemChange($event)">
            <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm" style="text-align: center;">
                  <span>{{ item.id }}</span>
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'생산예정일'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs" style="text-align: center;">
                  {{ item.orderDate }}
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
            <sd-sheet-column [header]="'롤길이'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.rollLength | number }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'생산량'" [width]="90">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.productQuantity | number }}
                </div>
              </ng-template>
            </sd-sheet-column>
          </sd-sheet>
        </ng-container>

      </sd-dock-container>
    </sd-busy-container>`
})
export class ProductionInstructionSearchModal extends SdModalBase<{ isMulti?: boolean; isCombinationSearch?: boolean; isProductionSearch?: boolean; id?: number }, any> {
  public filter: {
    id?: number;
    goodName?: string;
    specification?: string;
    isCombinationSearch?: boolean;
    isProductionSearch?: boolean;
  } = {};

  public lastFilter?: {
    id?: number;
    goodName?: string;
    specification?: string;
    isCombinationSearch?: boolean;
    isProductionSearch?: boolean;
  };

  public pagination = {
    page: 0,
    length: 0
  };

  public items: IProductionInstructionSearchVM[] = [];
  public orgItems: IProductionInstructionSearchVM[] = [];

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

  public async sdOnOpen(param: { isMulti?: boolean; isCombinationSearch?: boolean; isProductionSearch?: boolean; id?: number }): Promise<void> {
    this.busyCount++;

    this.isMulti = param.isMulti;
    this.filter.id = param.id;
    this.filter.isCombinationSearch = param.isCombinationSearch;
    this.filter.isProductionSearch = param.isProductionSearch;

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

  public onSelectedItemChange(item: IProductionInstructionSearchVM): void {
    this.close(item);
  }

  private async _search(): Promise<void> {
    this.busyCount++;

    try {
      await this._orm.connectAsync(MainDbContext, async db => {

        const queryable = this._getSearchQueryable(db);

        const result = await queryable
          .include(item => item.goods)
          .include(item => item.equipment)
          .orderBy(item => item.id)
          .limit(this.pagination.page * 20, 20)
          .select(item => ({
            id: item.id,
            orderCode: item.productionInstructionCode,
            orderDate: item.orderDate,
            rollWeight: item.rollWeight,
            capa: item.capa,
            goodId: item.goodId,
            goodName: item.goods!.name,
            thickness: item.goods!.thick,
            unitId: item.goods!.unitId,
            unitName: item.goods!.unitName,
            bomListId: item.bomId,
            specification: item.goods!.specification,
            equipmentId: item.equipmentId,
            equipmentName: item.equipment!.name,
            equipmentCode: item.equipment!.code,
            equipmentProductCode: item.equipment!.equipmentCode,
            rollLength: item.rollLength,
            productQuantity: item.productQuantity,
            isCanceled: item.isCanceled
          }))
          .resultAsync();

        this.orgItems = result.map(item => ({
          id: item.id,
          orderCode: item.orderCode,
          orderDate: item.orderDate,
          rollWeight: item.rollWeight,
          capa: item.capa,
          goodId: item.goodId,
          goodName: item.goodName,
          thickness: item.thickness,
          unitId: item.unitId,
          unitName: item.unitName,
          bomListId: item.bomListId,
          specification: item.specification,
          equipmentId: item.equipmentId,
          equipmentName: item.equipmentName,
          equipmentCode: item.equipmentCode,
          equipmentProductCode: item.equipmentProductCode,
          rollLength: item.rollLength,
          productQuantity: item.productQuantity,
          isCanceled: item.isCanceled
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

  private _getSearchQueryable(db: MainDbContext): Queryable<ProductionInstruction> {
    let queryable = db.productionInstruction
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId),
        sorm.equal(item.isCanceled, false)
      ]);

    if (this.lastFilter!.id) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.id, this.lastFilter!.id)
        ]);
    }

    if (this.lastFilter!.isCombinationSearch) {
      queryable = queryable
        .where(item => [
          sorm.null(item.isCombination)
        ]);
    }

    if (this.lastFilter!.isProductionSearch) {
      queryable = queryable
        .where(item => [
          sorm.null(item.isProduction)
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

    return queryable;
  }
}

interface IProductionInstructionSearchVM {
  id: number | undefined;
  orderCode: string | undefined;
  orderDate: DateOnly | undefined;
  capa: number | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  rollWeight: number | undefined;
  thickness: number | undefined;
  unitId: number | undefined;
  unitName: string | undefined;
  bomListId: number | undefined;
  specification: string | undefined;
  equipmentId: number | undefined;
  equipmentName: string | undefined;
  equipmentCode: string | undefined;
  equipmentProductCode: string | undefined;
  rollLength: number | undefined;
  productQuantity: number | undefined;
  isCanceled: boolean;
}
