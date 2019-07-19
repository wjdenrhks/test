import {SdModalBase, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from "@angular/core";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
import {AppDataProvider} from "@sample/client-common";
import {GoodsIssuePlan, MainDbContext} from "@sample/main-database";
import {DateOnly} from "@simplism/core";

@Component({
  selector: "app-production-instruction-search-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="busyCount > 0">
      <sd-dock-container style="min-width: 520px;">
        <sd-dock class="sd-padding-sm-default">
          <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
            <sd-form-item [label]="'년'">
              <sd-select [(value)]="filter.year">
                <sd-select-item [value]="undefined">전체</sd-select-item>
                <sd-select-item *ngFor="let year of yearList; trackBy: trackByMeFn"
                                [value]="year">
                  {{ year }}
                </sd-select-item>
              </sd-select>
            </sd-form-item>
            <sd-form-item [label]="'월'">
              <sd-select [(value)]="filter.month">
                <sd-select-item [value]="undefined">전체</sd-select-item>
                <sd-select-item *ngFor="let month of monthList; trackBy: trackByMeFn"
                                [value]="month">
                  {{ month }}
                </sd-select-item>
              </sd-select>
            </sd-form-item>
            <sd-form-item [label]="'주'">
              <sd-select [(value)]="filter.week">
                <sd-select-item [value]="undefined">전체</sd-select-item>
                <sd-select-item *ngFor="let week of weekList; trackBy: trackByMeFn"
                                [value]="week">
                  {{ week }}
                </sd-select-item>
              </sd-select>
            </sd-form-item>
            <br>
            <sd-form-item [label]="'제품명'">
              <sd-textfield [(value)]="filter.goodName"></sd-textfield>
            </sd-form-item>
            <sd-form-item [label]="'규격'">
              <sd-textfield [(value)]="filter.specification"></sd-textfield>
            </sd-form-item>
            <sd-form-item [label]="'거래처'">
              <sd-textfield [(value)]="filter.partnerName"></sd-textfield>
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
          <sd-sheet [id]="'shipping-plan-search-modal'" [items]="orgItems" [trackBy]="trackByIdFn"
                    [selectable]="'multi'"
                    (selectedItemsChange)="onSelectedItemsChange($event)">
            <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm" style="text-align: center;">
                  <span>{{ item.id }}</span>
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'계획(년/월)'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs" style="text-align: center;">
                  {{ item.year + " \/ " + item.month }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'주'" [width]="70">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs" style="text-align: center;">
                  {{ item.week }}
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
            <sd-sheet-column [header]="'거래처'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.partnerName }}
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
            <sd-sheet-column [header]="'생산량'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.quantity }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'단위'" [width]="70">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs" style="text-align: center;">
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
            <sd-sheet-column [header]="'계획(년/월)'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs" style="text-align: center;">
                  {{ item.year + " / " + item.month }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'주'" [width]="70">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs" style="text-align: center;">
                  {{ item.week }}
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
            <sd-sheet-column [header]="'거래처'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs">
                  {{ item.partnerName }}
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
            <sd-sheet-column [header]="'생산계획 수량'">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs" style="text-align: right;">
                  {{ item.productionQuantity | number }}
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'단위'" [width]="70">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs" style="text-align: center;">
                  {{ item.unitName }}
                </div>
              </ng-template>
            </sd-sheet-column>
          </sd-sheet>
        </ng-container>

      </sd-dock-container>
    </sd-busy-container>`
})
export class ShippingPlanSearchModal extends SdModalBase<{ isMulti?: boolean; isProductionInstruction?: boolean; isShippingRegister?: boolean }, any> {
  public filter: {
    year?: number;
    month?: number;
    week?: number;
    partnerName?: string;
    goodName?: string;
    specification?: string;
    isShippingRegister?: boolean;
    isProductionInstruction?: boolean;
  } = {};

  public lastFilter?: {
    year?: number;
    month?: number;
    week?: number;
    partnerName?: string;
    goodName?: string;
    specification?: string;
    isShippingRegister?: boolean;
    isProductionInstruction?: boolean;
  };

  public pagination = {
    page: 0,
    length: 0
  };

  public items: IShippingPlanModalVM[] = [];
  public orgItems: IShippingPlanModalVM[] = [];

  public busyCount = 0;
  public isMulti: boolean | undefined;

  public yearList = [] as number[];
  public monthList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  public weekList = [1, 2, 3, 4, 5];

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

  public async sdOnOpen(param: { isMulti?: boolean; isProductionInstruction?: boolean; isShippingRegister?: boolean }): Promise<void> {
    this.busyCount++;

    this.isMulti = param.isMulti;
    this.filter.isShippingRegister = param.isShippingRegister;
    this.filter.isProductionInstruction = param.isProductionInstruction;

    this.filter.year = new DateOnly().year;
    this.filter.month = new DateOnly().month;

    for (let i = 2018; i <= this.filter.year + 1; i++) {
      this.yearList.push(i);
    }

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

  public onSelectedItemChange(item: IShippingPlanModalVM): void {
    this.close(item);
  }

  private async _search(): Promise<void> {
    this.busyCount++;

    try {
      await this._orm.connectAsync(MainDbContext, async db => {

        const queryable = this._getSearchQueryable(db);

        const result = await queryable
          .include(item => item.goods)
          .include(item => item.partner)
          .orderBy(item => item.id)
          .limit(this.pagination.page * 20, 20)
          .select(item => ({
            id: item.id,
            year: item.planYear,
            month: item.planMonth,
            day: item.planDay,
            week: item.week,
            partnerId: item.partnerId,
            partnerName: item.partner!.name,
            partnerErpSync: item.partner!.erpSyncCode,
            type: item.type,
            goodId: item.goodId,
            goodName: item.goods!.name,
            goodErpSync: item.goods!.erpSyncCode,
            length: item.goods!.length,
            thick: item.goods!.thick,
            weight: item.goods!.weight,
            unitName: item.goods!.unitName,
            specification: item.goods!.specification,
            planQuantity: item.planQuantity,
            stockQuantity: item.stockQuantity,
            productionQuantity: item.productionQuantity,
            isCanceled: item.isDisabled
          }))
          .resultAsync();

        this.orgItems = result.map(item => ({
          id: item.id,
          year: item.year,
          month: item.month,
          day: item.day,
          week: item.week,
          partnerId: item.partnerId,
          partnerName: item.partnerName,
          partnerErpSync: item.partnerErpSync,
          type: item.type,
          goodId: item.goodId,
          goodName: item.goodName,
          goodErpSync: item.goodErpSync,
          length: item.length,
          weight: item.weight,
          thick: item.thick,
          unitName: item.unitName,
          specification: item.specification,
          planQuantity: item.planQuantity,
          stockQuantity: item.stockQuantity,
          productionQuantity: item.productionQuantity,
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

  private _getSearchQueryable(db: MainDbContext): Queryable<GoodsIssuePlan> {
    let queryable = db.goodsIssuePlan
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId),
        sorm.equal(item.isDisabled, false),
        sorm.notEqual(item.isClosed, true)
      ]);

    if (this.lastFilter!.isProductionInstruction) {
      queryable = queryable
        .where(item => [
          sorm.null(item.isProductionInstruction)
        ]);
    }

    if (this.lastFilter!.isShippingRegister) {
      queryable = queryable
        .where(item => [
          sorm.notEqual(item.isClosed, true)
        ]);
    }

    return queryable;
  }
}

interface IShippingPlanModalVM {
  id: number | undefined;
  year: number | undefined;
  month: number | undefined;
  day: number | undefined;
  week: number | undefined;
  partnerId: number | undefined;
  partnerName: string | undefined;
  partnerErpSync: number | undefined;
  type: "내수용" | "수출용";
  goodId: number | undefined;
  goodName: string | undefined;
  goodErpSync: number | undefined;
  specification: string | undefined;
  length: number | undefined;
  weight: number | undefined;
  thick: number | undefined;
  unitName: string | undefined;
  planQuantity: number | undefined;
  stockQuantity: number | undefined;
  productionQuantity: number | undefined;
  isCanceled: boolean;
}
