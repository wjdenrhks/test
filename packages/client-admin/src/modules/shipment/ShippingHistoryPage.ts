import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from "@angular/core";
import {DateOnly} from "@simplism/core";
import {GoodsIssueGoods, MainDbContext, Stock} from "@sample/main-database";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
import {AppDataProvider} from "@sample/client-common";
import {SdOrmProvider, SdToastProvider} from "@simplism/angular";

@Component({
  selector: "app-shipping-history",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>출하 이력 조회</h4>
        </sd-topbar>

        <sd-dock-container>
          <sd-dock class="sd-padding-sm-default sd-background-grey-lightest">
            <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
              <sd-form-item [label]="'출하일'">
                <sd-textfield [(value)]="filter.fromDate" [type]="'date'"></sd-textfield>
              </sd-form-item>
              ~
              <sd-form-item>
                <sd-textfield [(value)]="filter.toDate" [type]="'date'"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'거래처'">
                <app-partner-select [(value)]="filter.partnerId"></app-partner-select>
              </sd-form-item>
              <br>
              <sd-form-item [label]="'제품명'">
                <app-good-name-select [(value)]="filter.goodName"></app-good-name-select>
              </sd-form-item>
              <sd-form-item [label]="'규격'">
                <app-goods-specification-select [(value)]="filter.specification"
                                                [goodName]="filter.goodName"></app-goods-specification-select>
              </sd-form-item>
              <sd-form-item [label]="'LOT'">
                <sd-textfield [(value)]="filter.lot"></sd-textfield>
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
              <sd-sheet #sheet [id]="'shipping-history'"
                        [items]="items"
                        [trackBy]="trackByIdFn">
                <sd-sheet-column header="거래처.매출처,매입처">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.partnerName }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header=".LOT">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.lotName }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header=".제품구분" [width]="110">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.goodType }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header=".계열">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.category }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="폭.(mm)" [width]="60">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.specification }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="두께.(g)" [width]="60">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.thick }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="길이.(m)" [width]="60">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.lenght | number }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="재고수량.(m,kg,pcs)" [width]="120">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right;">
                      {{ item.stockQuantity | number }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="합/부 판정.A,B,C" [width]="80">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.goodRating }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header=".출고구분" [width]="60">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;" *ngIf="item.id">
                      {{ item.shippingType }}
                    </div>
                    <div class="sd-padding-xs-sm" style="text-align: right; font-size: 13pt; font-weight: bold;"
                         *ngIf="!item.id">
                      계
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="발주.발주수량" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right;" *ngIf="item.id">
                      {{ item.shippingPlanQuantity | number }}
                    </div>
                    <div class="sd-padding-xs-sm" style="text-align: right; font-size: 12pt; font-weight: bold;"
                         *ngIf="!item.id">
                      {{ item.shippingPlanQuantity | number }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="출고관리.출고수량" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right;" *ngIf="item.id">
                      {{ item.quantity | number }}
                    </div>
                    <div class="sd-padding-xs-sm" style="text-align: right; font-size: 12pt; font-weight: bold;"
                         *ngIf="!item.id">
                      {{ item.quantity | number }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="출고관리.단가" [width]="130">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right;" *ngIf="item.id">
                      {{ item.unitPrice | number }}
                    </div>
                    <div class="sd-padding-xs-sm" style="text-align: right; font-size: 12pt; font-weight: bold;"
                         *ngIf="!item.id">
                      {{ item.unitPrice | number }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="출고관리.금액" [width]="130">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right;" *ngIf="item.id">
                      {{ item.totalPrice | number }}
                    </div>
                    <div class="sd-padding-xs-sm" style="text-align: right; font-size: 12pt; font-weight: bold;"
                         *ngIf="!item.id">
                      {{ item.totalPrice | number }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="출고관리.출고일" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.dueDate }}
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
export class ShippingHistoryPage implements OnInit {

  public filter: IFilterVM = {
    fromDate: undefined,
    toDate: undefined,
    partnerName: undefined,
    partnerId: undefined,
    goodName: undefined,
    specification: undefined,
    lot: undefined
  };
  public lastFilter?: IFilterVM;

  public pagination = {page: 0, length: 0};

  public items: IShippingHistoryVM[] = [];

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public trackByIdFn = (i: number, item: any) => item.id || item;

  public constructor(private readonly _cdr: ChangeDetectorRef,
                     private readonly _orm: SdOrmProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _appData: AppDataProvider) {
  }

  public async ngOnInit(): Promise<void> {
    this.mainBusyCount++;
    await this.onSearchFormSubmit();
    this.mainBusyCount--;
    this._cdr.markForCheck();
  }

  public async onDownloadButtonClick(): Promise<void> {
    alert("개발 중 입니다.");
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

        const result = queryable
          .include(item => item.goodsIssue)
          .include(item => item.goodsIssue!.goodsIssuePlan)
          .include(item => item.goodsIssue!.partner)
          .include(item => item.goods)
          .include(item => item.lot)
          .join(
            Stock,
            "stockInfo",
            (qb, en) => qb
              .where(item => [
                sorm.equal(item.goodsId, en.goodsId)
              ])
              .select(item => ({
                quantity: sorm.sum(sorm.ifNull(item.quantity, 0))
              })),
            true
          )
          .select(item => ({
            id: item.id,
            dueDate: item.goodsIssue!.issueDate,
            partnerName: item.goodsIssue!.partner!.name,
            shippingType: item.goodsIssue!.issueType,
            shippingPlanQuantity: item.goodsIssue!.goodsIssuePlan!.planQuantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            category: item.goods!.category,
            goodType: item.goods!.type,
            goodName: item.goods!.name,
            specification: sorm.ifNull(item.lot!.width, item.goods!.specification),
            thick: sorm.ifNull(item.lot!.thick, item.goods!.thick),
            lotId: item.lotId,
            lotName: item.lot!.lot,
            goodRating: item.lot!.goodsRating,
            stockQuantity: item.stockInfo!.quantity,
            length: sorm.ifNull(item.lot!.length, item.goods!.length),
            quantity: item.quantity
          }));

        this.items = await result
          .orderBy(item => item.id)
          .limit(this.pagination.page * 50, 50)
          .wrap()
          .resultAsync();

        this.items.push({
          id: undefined,
          dueDate: undefined,
          partnerName: undefined,
          shippingType: undefined,
          shippingPlanQuantity: this.items.sum(item => item.shippingPlanQuantity || 0),
          unitPrice: this.items.sum(item => item.unitPrice || 0),
          totalPrice: this.items.sum(item => item.totalPrice || 0),
          category: undefined,
          goodType: undefined,
          goodName: undefined,
          specification: undefined,
          thick: undefined,
          lotId: undefined,
          lotName: undefined,
          goodRating: undefined,
          stockQuantity: undefined,
          length: undefined,
          quantity: this.items.sum(item => item.quantity || 0)
        });

        const totalCount = await queryable.countAsync();
        this.pagination.length = Math.ceil(totalCount / 50);
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.mainBusyCount--;
  }

  private _getSearchQueryable(db: MainDbContext): Queryable<GoodsIssueGoods> {
    let queryable = db.goodsIssueGoods
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId),
        sorm.equal(item.isDisabled, false)
      ]);

    if (this.lastFilter!.fromDate || this.lastFilter!.toDate) {
      queryable = queryable
        .include(item => item.goodsIssue)
        .where(item => [
          sorm.between(item.goodsIssue!.issueDate, this.lastFilter!.fromDate, this.lastFilter!.toDate!)
        ]);
    }

    if (this.lastFilter!.partnerId) {
      queryable = queryable
        .include(item => item.goodsIssue)
        .include(item => item.goodsIssue!.partner)
        .where(item => [
          sorm.equal(item.goodsIssue!.partnerId, this.lastFilter!.partnerId)
        ]);
    }

    if (this.lastFilter!.partnerName) {
      queryable = queryable
        .include(item => item.goodsIssue)
        .include(item => item.goodsIssue!.partner)
        .where(item => [
          sorm.includes(item.goodsIssue!.partner!.name, this.lastFilter!.partnerName)
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

interface IFilterVM {
  fromDate?: DateOnly;
  toDate?: DateOnly;
  partnerId?: number;
  partnerName?: string;
  goodName?: string;
  specification?: string;
  lot?: string;
}

interface IShippingHistoryVM {
  id: number | undefined;
  dueDate: DateOnly | undefined;
  partnerName: string | undefined;
  shippingType: "출하" | "리와인더" | "외주 임가공" | undefined;
  shippingPlanQuantity: number | undefined;
  unitPrice: number | undefined;
  totalPrice: number | undefined;
  stockQuantity: number | undefined;
  category: string | undefined;
  goodType: string | undefined;
  goodName: string | undefined;
  specification: string | undefined;
  thick: number | undefined;
  lotId: number | undefined;
  lotName: string | undefined;
  goodRating: "A" | "B" | "C" | "공통" | undefined;
  length: number | undefined;
  quantity: number | undefined;
}
