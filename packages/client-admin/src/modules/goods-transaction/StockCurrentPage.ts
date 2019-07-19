import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from "@angular/core";
import {AvailableStock, MainDbContext, Stock} from "@sample/main-database";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
import {SdModalProvider, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {AppDataProvider} from "@sample/client-common";
import {ShowManualModal} from "../../modals/ShowManualModal";
import {ExcelWorkbook} from "@simplism/excel";


@Component({
  selector: "app-stock-current",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>제품 별 재고 현황</h4>
          <sd-topbar-menu (click)="onDownloadButtonClick()" *ngIf="this.items && this.items.length > 0">
            <sd-icon [icon]="'download'" [fixedWidth]="true"></sd-icon>
            다운로드
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onShowManualButtonClick()" style="float: right; padding-right: 25px;">
            <sd-icon [icon]="'atlas'" [fixedWidth]="true"></sd-icon>
            메뉴얼 보기
          </sd-topbar-menu>
        </sd-topbar>

        <sd-dock-container>
          <sd-dock class="sd-padding-sm-default sd-background-grey-lightest">
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
                <app-good-name-select [(value)]="filter.goodName"></app-good-name-select>
              </sd-form-item>
              <sd-form-item [label]="'규격'">
                <app-goods-specification-select [(value)]="filter.specification"
                                                [goodName]="filter.goodName"></app-goods-specification-select>
              </sd-form-item>
              <sd-form-item>
                <sd-checkbox [(value)]="filter.adequateStockUnder">적정재고 이하</sd-checkbox>
              </sd-form-item>
              <sd-form-item>
                <sd-button [type]="'submit'" [theme]="'primary'">
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

          <sd-busy-container [busy]="mainBusyCount > 0">
            <sd-dock-container>
              <sd-sheet #sheet [id]="'stock-current'"
                        [items]="items"
                        [trackBy]="trackByIdFn">
                <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      <span *ngIf="item.id">{{ item.id }}</span>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'분류'" [width]="80">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.goodType }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'구분'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
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
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.specification }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'생산롤 재고'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right;" *ngIf="item && item.goodType ==='제품'">
                      {{ item.rollQuantity | number }}
                    </div>
                    <div class="sd-padding-xs-sm" style="text-align: right;" *ngIf="item && item.goodType !=='제품'">
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'현재고'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right;">
                      {{ item.realStockQuantity | number }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'가용재고'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right;">
                      {{ item.availableStockQuantity | number }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'안전(적정)재고'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right;">
                      {{ item.adequateStockQuantity | number }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'과부족(현재고)'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right;">
                      {{ item.currentExcessiveQuantity | number }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'과부족(안전재고)'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right;">
                      {{ item.adequateExcessiveQuantity | number }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'단가'" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right;" *ngIf="!!item.id">
                      {{ item.unitPrice | number }}
                    </div>
                    <div class="sd-padding-xs-sm" style="text-align: right; font-size: 13pt; font-weight: bold;"
                         *ngIf="!item.id">
                      계
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'합계금액'" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right;" *ngIf="!!item.id">
                      {{ item.totalPrice | number }}
                    </div>
                    <div class="sd-padding-xs-sm" style="text-align: right; font-size: 12pt; font-weight: bold;"
                         *ngIf="!item.id">
                      {{ item.totalPrice | number }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
              </sd-sheet>
            </sd-dock-container>
          </sd-busy-container>
        </sd-dock-container>
      </sd-topbar-container>
    </sd-busy-container>`
})
export class StockCurrentPage implements OnInit {

  public filter: IFilterVM = {
    goodName: undefined,
    specification: undefined,
    adequateStockUnder: false
  };

  public lastFilter?: IFilterVM;

  public pagination = {page: 0, length: 0};

  public items: IStockCurrentVM[] = [];
  public orgItems: IStockCurrentVM[] = [];

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public types: {
    name: string | undefined;
    category: {
      name: string | undefined;
    }[];
  }[] = [];

  public categories: {
    name: string | undefined;
  }[] = [];

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _modal: SdModalProvider,
                     private readonly _appData: AppDataProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _cdr: ChangeDetectorRef) {
  }


  public async ngOnInit(): Promise<void> {
    this.mainBusyCount++;

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

    await this.onSearchFormSubmit();
    this.mainBusyCount--;

    this._cdr.markForCheck();
  }

  public async onShowManualButtonClick(): Promise<void> {
    const result = await this._modal.show(ShowManualModal, "제품 별 재고 현황 메뉴얼", {type: "stock-current"});
    if (!result) return;

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

  public async onDownloadButtonClick(): Promise<void> {
    await this._download();
    this._cdr.markForCheck();
  }

  private async _download(): Promise<void> {
    this.viewBusyCount++;
    try {
      let items: any[] = [];
      await this._orm.connectAsync(MainDbContext, async db => {

        const queryable = this._getSearchQueryable(db);
        let result = queryable
          .include(item => item.goods)
          .join(
            AvailableStock,
            "availableStockInfo",
            (qb, en) => qb
              .where(item => [
                sorm.equal(item.goodId, en.goodsId)
              ])
              .select(item => ({
                quantity: sorm.ifNull(item.quantity, 0)
              })),
            true
          )
          .groupBy(item => [
            item.goodsId,
            item.goods!.name,
            item.goods!.specification,
            item.goods!.type,
            item.goods!.category,
            item.goods!.adequateStock,
            item.availableStockInfo!.quantity
          ])
          .select(item => ({
            id: sorm.query("ROW_NUMBER() OVER (ORDER BY [goods].type, [goods].category DESC, [goods].name)", Number),
            goodType: item.goods!.type,
            goodCategory: item.goods!.category,
            goodId: item.goodsId,
            goodName: item.goods!.name,
            specification: item.goods!.specification,
            rollQuantity: sorm.case<number>(
              sorm.equal(item.goods!.type, "제품"), sorm.ifNull(sorm.count(item.lotId), 0)
            ).else(0),
            realStockQuantity: sorm.sum(item.quantity),
            saleQuantity: sorm.query("NULL", Number),
            availableStockQuantity: sorm.ifNull(item.availableStockInfo!.quantity, 0),
            adequateStockQuantity: sorm.ifNull(item.goods!.adequateStock, 0),
            currentExcessiveQuantity: sorm.formula(
              sorm.ifNull(sorm.sum(item.quantity), 0),
              "-",
              sorm.ifNull(item.goods!.adequateStock, 0)),
            adequateExcessiveQuantity: sorm.formula(
              sorm.ifNull(item.availableStockInfo!.quantity, 0),
              "-",
              sorm.ifNull(item.goods!.adequateStock, 0))
          }))
          .wrap();

        if (this.lastFilter!.adequateStockUnder) {
          result = result
            .where(item => [
              sorm.lessThen(sorm.ifNull(item.currentExcessiveQuantity, 0), 0)
            ]);
          // this.items = this.items.filter(item => (item.currentExcessiveQuantity || 0) < 0);
        }

        items = await result
          .orderBy(item => item.id)
          .resultAsync();

        if (items && items.length > 2000) {
          throw new Error("검색 결과가 너무 많습니다.\n2000개 이하의 검색 결과만 excel로 저장할 수 있습니다.");
        }
      });

      const headerStyle = {
        alignH: "center",
        background: "FF673AB7",
        foreground: "FFFFFFFF",
        bold: true
      };

      const wb = ExcelWorkbook.create();
      const ws = wb.createWorksheet(`제품 별 재고 현황`);
      ws.cell(0, 0).value = "분류";
      ws.cell(0, 1).value = "구분";
      ws.cell(0, 2).value = "제품명";
      ws.cell(0, 3).value = "규격";
      ws.cell(0, 4).value = "생산롤 재고";
      ws.cell(0, 5).value = "현재고";
      ws.cell(0, 6).value = "가용재고";
      ws.cell(0, 7).value = "안전(적정)재고";
      ws.cell(0, 8).value = "과부족(현재고)";
      ws.cell(0, 9).value = "과부족(안전재고";


      for (let i = 0; i <= 9; i++) {
        Object.assign(ws.cell(0, i).style, headerStyle);
      }

      for (let i = 0; i < items.length; i++) {
        const shippingItem = items[i];
        ws.cell(i + 1, 0).value = shippingItem.goodType;
        ws.cell(i + 1, 1).value = shippingItem.goodCategory;
        ws.cell(i + 1, 2).value = shippingItem.goodName;
        ws.cell(i + 1, 3).value = shippingItem.specification;
        ws.cell(i + 1, 4).value = shippingItem.rollQuantity;
        ws.cell(i + 1, 5).value = shippingItem.realStockQuantity;
        ws.cell(i + 1, 6).value = shippingItem.availableStockQuantity;
        ws.cell(i + 1, 7).value = shippingItem.adequateStockQuantity;
        ws.cell(i + 1, 8).value = shippingItem.currentExcessiveQuantity;
        ws.cell(i + 1, 9).value = shippingItem.adequateExcessiveQuantity;
      }
      const title = "제품 별 재고 현황.xlsx";

      await wb.downloadAsync(title);
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.viewBusyCount--;
  }

  public async onSearchFormSubmit(): Promise<void> {
    this.pagination.page = 0;
    this.lastFilter = Object.clone(this.filter);
    await this._search();
    this._cdr.markForCheck();
  }

  public async onPageClick(page: number): Promise<void> {
    this.pagination.page = page;
    await this._search();
    this._cdr.markForCheck();
  }

  private async _search(): Promise<void> {
    if (!this.lastFilter) return;

    this.mainBusyCount++;
    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        const queryable = this._getSearchQueryable(db);

        let result = queryable
          .include(item => item.goods)
          .join(
            AvailableStock,
            "availableStockInfo",
            (qb, en) => qb
              .where(item => [
                sorm.equal(item.goodId, en.goodsId)
              ])
              .select(item => ({
                quantity: sorm.ifNull(item.quantity, 0)
              })),
            true
          )
          .groupBy(item => [
            item.goodsId,
            item.goods!.name,
            item.goods!.specification,
            item.goods!.type,
            item.goods!.category,
            item.goods!.adequateStock,
            item.goods!.unitPrice,
            item.availableStockInfo!.quantity
          ])
          .select(item => ({
            id: sorm.query("ROW_NUMBER() OVER (ORDER BY [goods].type, [goods].category DESC, [goods].name)", Number),
            goodType: item.goods!.type,
            goodCategory: item.goods!.category,
            goodId: item.goodsId,
            goodName: item.goods!.name,
            specification: item.goods!.specification,
            unitPrice: item.goods!.unitPrice,
            totalPrice: sorm.sum(sorm.ifNull(item.goods!.unitPrice, 0)),
            rollQuantity: sorm.case<number>(
              sorm.equal(item.goods!.type, "제품"), sorm.ifNull(sorm.count(item.lotId), 0)
            ).else(0),
            realStockQuantity: sorm.sum(item.quantity),
            saleQuantity: sorm.query("NULL", Number),
            availableStockQuantity: sorm.ifNull(item.availableStockInfo!.quantity, 0),
            adequateStockQuantity: sorm.ifNull(item.goods!.adequateStock, 0),
            currentExcessiveQuantity: sorm.formula(
              sorm.ifNull(sorm.sum(item.quantity), 0),
              "-",
              sorm.ifNull(item.goods!.adequateStock, 0)),
            adequateExcessiveQuantity: sorm.formula(
              sorm.ifNull(item.availableStockInfo!.quantity, 0),
              "-",
              sorm.ifNull(item.goods!.adequateStock, 0))
          }))
          .wrap();

        if (this.lastFilter!.adequateStockUnder) {
          result = result
            .where(item => [
              sorm.lessThen(sorm.ifNull(item.currentExcessiveQuantity, 0), 0)
            ]);
          // this.items = this.items.filter(item => (item.currentExcessiveQuantity || 0) < 0);
        }

        this.items = await result
          .orderBy(item => item.id)
          .limit(this.pagination.page * 50, 50)
          .resultAsync();

        this.items.push({
          id: undefined,
          goodType: undefined,
          goodCategory: undefined,
          goodId: undefined,
          goodName: undefined,
          specification: undefined,
          unitPrice: undefined,
          totalPrice: this.items!.sum(item => item.totalPrice || 0),
          rollQuantity: undefined,
          realStockQuantity: undefined,
          availableStockQuantity: undefined,
          adequateStockQuantity: undefined,
          currentExcessiveQuantity: undefined,
          adequateExcessiveQuantity: undefined
        });

        this.orgItems = Object.clone(this.items);

        const totalCount = await result.countAsync();
        this.pagination.length = Math.ceil(totalCount / 50);
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.mainBusyCount--;
  }

  private _getSearchQueryable(db: MainDbContext): Queryable<Stock> {
    let queryable = db.stock
      .include(item => item.lot)
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId),
        sorm.equal(item.lot!.isNotStock, false)
      ]);

    if (this.lastFilter!.goodName) {
      queryable = queryable
        .include(item => item.goods)
        .where(item => [
          sorm.includes(item.goods!.name, this.lastFilter!.goodName)
        ]);
    }

    if (this.lastFilter!.type) {
      queryable = queryable
        .include(item => item.goods)
        .where(item => [
          sorm.equal(item.goods!.type, this.lastFilter!.type)
        ]);
    }

    if (this.lastFilter!.category) {
      queryable = queryable
        .include(item => item.goods)
        .where(item => [
          sorm.equal(item.goods!.category, this.lastFilter!.category)
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

interface IFilterVM {
  type?: string | undefined;
  category?: string | undefined;
  goodName?: string;
  specification?: string;
  adequateStockUnder: boolean;
}

interface IStockCurrentVM {
  id: number | undefined;
  goodType: string | undefined;
  goodCategory: string | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  specification: string | undefined;
  unitPrice: number | undefined;
  totalPrice: number | undefined;
  rollQuantity: number | undefined;
  realStockQuantity: number | undefined;
  availableStockQuantity: number | undefined;
  adequateStockQuantity: number | undefined;
  currentExcessiveQuantity: number | undefined;
  adequateExcessiveQuantity: number | undefined;
}
