import {SdModalBase, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from "@angular/core";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
import {AppDataProvider} from "@sample/client-common";
import {MainDbContext, ProductionItem} from "@sample/main-database";
import {DateOnly} from "@simplism/core";

@Component({
  selector: "app-production-search-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="busyCount > 0">
      <sd-dock-container style="min-width: 800px;">
        <sd-dock class="sd-padding-sm-default">
          <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
            <sd-form-item [label]="'생산지시No'">
              <sd-textfield [(value)]="filter.productionOrderCode"></sd-textfield>
            </sd-form-item>
            <sd-form-item [label]="'LOT'">
              <sd-textfield [(value)]="filter.lot"></sd-textfield>
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
          <sd-sheet [id]="'production-search-modal'" [items]="orgItems" [trackBy]="trackByIdFn"
                    [selectable]="'multi'"
                    (selectedItemsChange)="onSelectedItemsChange($event)">
            <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm" style="text-align: center;">
                  <span>{{ item.seq }}</span>
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'생산지시 No'" [width]="120">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm" style="text-align: center;">
                  {{ item.productionOrderCode }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'LOT'" [width]="120">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs" style="text-align: center;">
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
            <sd-sheet-column [header]="'규격'" [width]="100">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.goodSpecification }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'길이'" [width]="100">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs" style="text-align: right;">
                  {{ item.length | number }}
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
                  <span>{{ item.seq }}</span>
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'생산지시 No'" [width]="120">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm" style="text-align: center;">
                  {{ item.productionOrderCode }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'LOT'" [width]="120">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs" style="text-align: center;">
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
                  {{ item.goodSpecification }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'길이'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs" style="text-align: right;">
                  {{ item.length | number }}
                </div>
              </ng-template>
            </sd-sheet-column>
          </sd-sheet>
        </ng-container>

      </sd-dock-container>
    </sd-busy-container>`
})
export class ProductionSearchModal extends SdModalBase<{ isMulti?: boolean; isWeightMeasurement?: boolean; isRewind?: boolean }, any> {
  public filter: {
    fromDate?: DateOnly;
    toDate?: DateOnly;
    productionOrderCode?: string;
    lot?: string;
    goodName?: string;
    specification?: string;
    isWeightMeasurement?: boolean;
    isRewind?: boolean;
  } = {};

  public lastFilter?: {
    fromDate?: DateOnly;
    toDate?: DateOnly;
    productionOrderCode?: string;
    lot?: string;
    goodName?: string;
    specification?: string;
    isWeightMeasurement?: boolean;
    isRewind?: boolean;
  };

  public pagination = {
    page: 0,
    length: 0
  };

  public items: IProductionModalVM[] = [];
  public orgItems: IProductionModalVM[] = [];

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

  public async sdOnOpen(param: { isMulti?: boolean; isWeightMeasurement?: boolean; isRewind?: boolean }): Promise<void> {
    this.busyCount++;

    this.isMulti = param.isMulti;
    this.filter!.isWeightMeasurement = param.isWeightMeasurement;
    this.filter!.isRewind = param.isRewind;

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

  public onSelectedItemChange(item: IProductionModalVM): void {
    this.close(item);
  }

  private async _search(): Promise<void> {
    this.busyCount++;

    try {
      await this._orm.connectAsync(MainDbContext, async db => {

        const queryable = this._getSearchQueryable(db);

        const result = await queryable
          .include(item => item.production)
          .include(item => item.production!.instruction)
          .include(item => item.goods)
          .include(item => item.createdByEmployee)
          .include(item => item.lot)
          .select(item => ({
            id: item.id,
            seq: sorm.query("ROW_NUMBER() OVER (ORDER BY [TBL].lotId ASC)", Number),
            productionOrderId: item.productionId,
            productionOrderCode: item.production!.instruction!.productionInstructionCode,
            partnerId: item.production!.instruction!.partnerId,
            goodId: item.goodId,
            goodName: item.goods!.name,
            goodCategory: item.goods!.category,
            goodSpecification: item.goods!.specification,
            goodThick: item.goods!.thick,
            goodLength: item.goods!.length,
            rating: item.rating,
            unitName: item.goods!.unitName,
            specification: sorm.ifNull(item.width, item.goods!.specification),
            length: item.length,
            weight: item.weight,
            thick: sorm.ifNull(item.thickness, item.goods!.thick),
            defectType: item.defectType,
            lotId: item.lotId,
            lotName: item.lot!.lot
          }))
          .wrap()
          .orderBy(item => item.seq)
          .limit(this.pagination.page * 20, 20)
          .resultAsync();

        this.orgItems = result.map(item => ({
          id: item.id,
          seq: item.seq,
          partnerId: item.partnerId,
          productionOrderId: item.productionOrderId,
          productionOrderCode: item.productionOrderCode,
          goodId: item.goodId,
          goodCategory: item.goodCategory,
          goodName: item.goodName,
          goodSpecification: item.goodSpecification,
          goodThick: item.goodThick,
          goodLength: item.goodLength,
          rating: item.rating,
          unitName: item.unitName,
          length: item.length,
          weight: item.weight,
          thick: item.thick,
          specification: item.specification,
          defectType: item.defectType,
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

  private _getSearchQueryable(db: MainDbContext): Queryable<ProductionItem> {
    let queryable = db.productionItem
      .include(item => item.production)
      .include(item => item.lot)
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId),
        sorm.equal(item.production!.isCanceled, false)
      ]);

    if (this.lastFilter!.isWeightMeasurement) {
      queryable = queryable
        .where(item => [
          sorm.null(item.weightMeasurementId)
        ]);
    }

    if (this.lastFilter!.isRewind) {
      queryable = queryable
        .where(item => [
          sorm.null(item.rewindId)
        ]);
    }

    if (this.lastFilter!.productionOrderCode) {
      queryable = queryable
        .include(item => item.production!.instruction)
        .where(item => [
          sorm.includes(item.production!.instruction!.productionInstructionCode, this.lastFilter!.productionOrderCode)
        ]);
    }

    if (this.lastFilter!.lot) {
      queryable = queryable
        .include(item => item.lot)
        .where(item => [
          sorm.includes(item.lot!.lot, this.lastFilter!.lot)
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

interface IProductionModalVM {
  id: number | undefined;
  seq: number | undefined;
  partnerId: number | undefined;
  productionOrderId: number | undefined;
  productionOrderCode: string | undefined;
  goodId: number | undefined;
  goodCategory: string | undefined;
  goodName: string | undefined;
  goodSpecification: string | undefined;
  goodThick: number | undefined;
  goodLength: number | undefined;
  rating: "A" | "B" | "C" | "공통" | undefined;
  length: number | undefined;
  weight: number | undefined;
  thick: number | undefined;
  defectType: "주름" | "펑크" | "알갱이" | "접힘" | "젤" | "칼빠짐" | "미터부족" | "기포" | "두께편차" | "PE뜯김" | "라인줄" | "수축" | "접착" | "중량" | "코로나" | undefined;
  unitName: string | undefined;
  specification: string | undefined;
  lotId: number | undefined;
  lotName: string | undefined;
}