import {SdModalBase, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from "@angular/core";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
import {AppDataProvider} from "@sample/client-common";
import {MainDbContext, Production} from "@sample/main-database";
import {DateOnly, DateTime} from "@simplism/core";

@Component({
  selector: "app-production-search-modal",
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
          <sd-sheet [id]="'production-search-modal'" [items]="orgItems" [trackBy]="trackByIdFn"
                    [selectable]="'multi'"
                    (selectedItemsChange)="onSelectedItemsChange($event)">
            <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm" style="text-align: center;">
                  <span>{{ item.id }}</span>
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'생산지시 ID'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm">
                  {{ item.productionOrderId }}
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
            <sd-sheet-column [header]="'지시수량'" [width]="90">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.orderQuantity | number }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'상태'" [width]="90">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs" style="text-align: center;">
                  {{ item.status }}
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
          <sd-sheet [id]="'production-search-modal'" [items]="orgItems" [trackBy]="trackByIdFn"
                    [selectable]="true"
                    (selectedItemChange)="onSelectedItemChange($event)">
            <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm" style="text-align: center;">
                  <span>{{ item.id }}</span>
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'생산지시 ID'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm">
                  {{ item.productionOrderId }}
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
            <sd-sheet-column [header]="'지시수량'" [width]="90">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.orderQuantity | number }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'상태'" [width]="90">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs" style="text-align: center;">
                  {{ item.status }}
                </div>
              </ng-template>
            </sd-sheet-column>
          </sd-sheet>
        </ng-container>

      </sd-dock-container>
    </sd-busy-container>`
})
export class QualityCheckProductionSearchModal extends SdModalBase<{ isMulti?: boolean; isInspectionSearch?: boolean }, any> {
  public filter: {
    fromDate?: DateOnly;
    toDate?: DateOnly;
    equipmentId?: number;
    goodName?: string;
    specification?: string;
    isInspectionSearch?: boolean;
  } = {};

  public lastFilter?: {
    fromDate?: DateOnly;
    toDate?: DateOnly;
    equipmentId?: number;
    goodName?: string;
    specification?: string;
    isInspectionSearch?: boolean;
  };

  public pagination = {
    page: 0,
    length: 0
  };

  public items: IQualityCheckProductionModalVM[] = [];
  public orgItems: IQualityCheckProductionModalVM[] = [];

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

  public async sdOnOpen(param: { isMulti?: boolean; isInspectionSearch?: boolean }): Promise<void> {
    this.busyCount++;

    this.isMulti = param.isMulti;
    this.filter.isInspectionSearch = param.isInspectionSearch;

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

  public onSelectedItemChange(item: IQualityCheckProductionModalVM): void {
    this.close(item);
  }

  private async _search(): Promise<void> {
    this.busyCount++;

    try {
      await this._orm.connectAsync(MainDbContext, async db => {

        const queryable = this._getSearchQueryable(db);

        const result = await queryable
          .include(item => item.instruction)
          .include(item => item.goods)
          .include(item => item.equipment)
          .include(item => item.createdByEmployee)
          .orderBy(item => item.id)
          .limit(this.pagination.page * 20, 20)
          .select(item => ({
            id: item.id,
            productionOrderId: item.instructionId,
            productionOrderCode: item.instruction!.productionInstructionCode,
            goodId: item.goodId,
            goodName: item.goods!.name,
            unitName: item.goods!.unitName,
            specification: item.goods!.specification,
            equipmentId: item.equipmentId,
            equipmentName: item.equipment!.name,
            orderQuantity: item.instruction!.productQuantity,
            status: item.status,
            inspectionId: item.inspectionId,
            createdByEmployeeId: item.createdByEmployeeId,
            createdByEmployeeName: item.createdByEmployee!.name,
            createdAtDateTime: item.createdAtDateTime,
            isCanceled: item.isCanceled,

            productionList: undefined
          }))
          .resultAsync();

        this.orgItems = result.map(item => ({
          id: item.id,
          productionOrderId: item.productionOrderId,
          productionOrderCode: item.productionOrderCode,
          goodId: item.goodId,
          goodName: item.goodName,
          unitName: item.unitName,
          specification: item.specification,
          equipmentId: item.equipmentId,
          equipmentName: item.equipmentName,
          orderQuantity: item.orderQuantity,
          status: item.status,
          inspectionId: item.inspectionId,
          createdByEmployeeId: item.createdByEmployeeId,
          createdByEmployeeName: item.createdByEmployeeName,
          createdAtDateTime: item.createdAtDateTime,
          isCanceled: item.isCanceled,

          productionList: item.productionList
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

  private _getSearchQueryable(db: MainDbContext): Queryable<Production> {
    let queryable = db.production
      .include(item => item.productionItem)
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId),
        sorm.equal(item.isCanceled, false)
      ]);

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

    if (this.lastFilter!.isInspectionSearch) {
      queryable = queryable
        .where(item => [
          sorm.null(item.inspectionId)
        ]);
    }

    return queryable;
  }
}

interface IQualityCheckProductionModalVM {
  id: number | undefined;
  productionOrderId: number | undefined;
  productionOrderCode: string | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  unitName: string | undefined;
  specification: string | undefined;
  equipmentId: number | undefined;
  equipmentName: string | undefined;
  orderQuantity: number | undefined;
  status: string | undefined;
  inspectionId: number | undefined;
  createdAtDateTime: DateTime | undefined;
  createdByEmployeeId: number | undefined;
  createdByEmployeeName: string | undefined;
  isCanceled: boolean;

  productionList: IProductionItemVM[] | undefined;
}

interface IProductionItemVM {
  id: number | undefined;
  lotId: number | undefined;
  lotName: string | undefined;
  weight: number | undefined;
  realWeight: number | undefined;
  length: number | undefined;
  width: string | undefined;
  outSide: number | undefined;
  inside: number | undefined;
  theMinimum: number | undefined;
  theBest: number | undefined;
  average: number | undefined;
  md: number | undefined;
  td: number | undefined;
  rating: string | undefined;
}