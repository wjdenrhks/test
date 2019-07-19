import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from "@angular/core";
import {GoodsReceipt, MainDbContext, ProductionItem, Stock} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {SdModalProvider, SdOrmProvider, SdPrintProvider, SdToastProvider} from "@simplism/angular";
import {AppDataProvider} from "@sample/client-common";
import {DateOnly, JsonConvert} from "@simplism/core";
import {Queryable} from "@simplism/orm-client";
import {ActivatedRoute} from "@angular/router";
import {IBarcodePrintVM, MediumBarcodePrintTemplate} from "../../print-templates/MediumBarcodePrintTemplate";
import {StockAdjustmentModal} from "../../modals/StockAdjustmentModal";
import {ShowManualModal} from "../../modals/ShowManualModal";
import {ExcelWorkbook} from "@simplism/excel";

@Component({
  selector: "app-stock-warehouse-current",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>창고별 제품 현황</h4>
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
              <sd-form-item [label]="'검색일'">
                <sd-textfield [(value)]="filter.fromDate" [type]="'date'"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'~'">
                <sd-textfield [(value)]="filter.toDate" [type]="'date'"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'창고'">
                <sd-select [(value)]="filter.warehouseId">
                  <sd-select-item [value]="undefined">전체</sd-select-item>
                  <sd-select-item *ngFor="let warehouse of warehouseList; trackBy: trackByMeFn"
                                  [value]="warehouse.id"
                                  [hidden]="warehouse.isDisabled">
                    {{ warehouse.name }}
                  </sd-select-item>
                </sd-select>
              </sd-form-item>
              <br>
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
              <sd-form-item [label]="'LOT'">
                <sd-textfield [(value)]="filter.lot"></sd-textfield>
              </sd-form-item>
              <sd-form-item>
                <sd-checkbox [(value)]="filter.inconsistency">등급 불일치</sd-checkbox>
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
              <sd-sheet #sheet [id]="'stock-warehouse-current'"
                        [items]="items"
                        [trackBy]="trackByIdFn">
                <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      <span *ngIf="item.id">{{ item.id }}</span>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'재고'" [width]="60">
                  <ng-template #item let-item="item" style="text-align: center;">
                    <sd-button [size]="'sm'"
                               style="padding-left: 20%"
                               (click)="onStockAdjustment(item)">
                      <div *ngIf="!!item.id">조정</div>
                    </sd-button>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'구분(창고명칭)'" [width]="90">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.warehouseTypeName }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'로케이션'" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.warehouseName }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'계열별'" [width]="80">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.goodType }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'분류'" [width]="80">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.goodCategory }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'LOT'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.lotName }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'일자'" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.stockDate }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'거래처'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.partnerName }}
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
                    <div class="sd-padding-xs-sm">
                      {{ item.specification }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'중량'" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right;">
                      {{ item.weight | number }}
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
                <sd-sheet-column [header]="'현재고'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right;" *ngIf="!!item.id">
                      {{ item.realStockQuantity | number }}
                    </div>
                    <div class="sd-padding-xs-sm" style="text-align: right;font-size: 12pt; font-weight: bold;"
                         *ngIf="!item.id">
                      {{ item.realStockQuantity | number }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'금액'" [width]="130">
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
                <sd-sheet-column [header]="'등급 불일치'" [width]="150">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="color: red;" *ngIf="item.inconsistency">
                      <a (click)="onStockTransferButtonClick()">
                        {{ "창고 - " + item.warehouseRating + " / " + item.goodName + " - " + item.goodRating }}
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'바코드 재출력'" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;" *ngIf="!!item.id">
                      <a (click)="onBarcodePrintButtonClick(item)">
                        출력
                      </a>
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
export class StockWarehouseCurrentPage implements OnInit {

  public filter: IFilterVM = {
    fromDate: undefined,
    toDate: undefined,
    goodName: undefined,
    lot: undefined,
    specification: undefined,
    warehouseId: undefined,
    inconsistency: false,
    isRealStock: false
  };

  public lastFilter?: IFilterVM;

  public pagination = {page: 0, length: 0};

  public items: IStockWarehouseCurrentVM[] = [];
  public orgItems: IStockWarehouseCurrentVM[] = [];

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public warehouseList: {
    id: number;
    name: string;
    isDisabled: boolean;
  }[] = [];

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
                     private readonly _print: SdPrintProvider,
                     private readonly _modal: SdModalProvider,
                     private readonly _appData: AppDataProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _activatedRoute: ActivatedRoute,
                     private readonly _cdr: ChangeDetectorRef) {
  }

  public async ngOnInit(): Promise<void> {
    this.mainBusyCount++;
    await this._orm.connectAsync(MainDbContext, async db => {
      this.warehouseList = await db.warehouse
        .where(item => [
          sorm.equal(item.companyId, this._appData.authInfo!.companyId),
          sorm.equal(item.isDisabled, false)
        ])
        .select(item => ({
          id: item.id!,
          name: item.name,
          rating: item.rating,
          isDisabled: item.isDisabled
        }))
        .resultAsync();

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
    this._activatedRoute.params.subscribe(async params => {
      if (params && params.id) {

        this.lastFilter = Object.clone(this.filter);

        if (params.id) {
          this.lastFilter.lot = JsonConvert.parse(params.id);
        }
        await this._search();
        this._cdr.markForCheck();

        location.href = location.href.slice(0, location.href.indexOf(";"));
      }
    });

    this.mainBusyCount--;
    this._cdr.markForCheck();
  }

  public async onShowManualButtonClick(): Promise<void> {
    const result = await this._modal.show(ShowManualModal, "창고별 제품 현황 메뉴얼", {type: "stock-warehouse-currnet"});
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

  public async onBarcodePrintButtonClick(item: IStockWarehouseCurrentVM): Promise<void> {
    const result: IBarcodePrintVM = {
      goodName: item.goodName,
      specification: item.width,
      thick: item.thick,
      length: item.length,
      weight: item.weight,
      corona: undefined,
      material: undefined,
      lot: item.lotName,
      isExport: item.isExport!
    };

    const printItem: IBarcodePrintVM[] = [];
    printItem.push(result);

    await this._print.print(MediumBarcodePrintTemplate, {printItems: printItem});
    this._cdr.markForCheck();
  }

  public onStockTransferButtonClick(): void {
    window.open(location.pathname + "#" + `/home/goods-transaction/stock-transfer;}`, "_blank", "left= 500, top= 200 width= 1000, height= 700");
  }

  public async onStockAdjustment(item: IStockWarehouseCurrentVM): Promise<void> {
    const result = await this._modal.show(StockAdjustmentModal, "재고조정 [품목명 / 규격] : " + item.goodName + " / " + item.specification, item);
    if (!result) return;

    await this.onSearchFormSubmit();
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
        items = await queryable
          .include(item => item.goods)
          .include(item => item.lot)
          .include(item => item.warehouse)
          .include(item => item.warehouse!.type)
          .join(
            ProductionItem,
            "productionInfo",
            (qb, en) => qb
              .include(item => item.production)
              .include(item => item.production!.instruction)
              .include(item => item.production!.instruction!.partners)
              .where(item => [
                sorm.equal(item.lotId, en.lotId)
              ])
              .select(item => ({
                partnerId: item.production!.instruction!.partnerId,
                partnerName: item.production!.instruction!.partners!.name,
                isExport: item.production!.instruction!.partners!.isExport
              })),
            true
          )
          .join(
            GoodsReceipt,
            "goodsReceiptInfo",
            (qb, en) => qb
              .include(item => item.partner)
              .where(item => [
                sorm.equal(item.receiptLotId, en.lotId)
              ])
              .select(item => ({
                unitPrice: sorm.ifNull(item.unitPrice, 0),
                partnerId: item.partnerId,
                partnerName: item.partner!.name,
                isExport: item.partner!.isExport
              })),
            true
          )
          .groupBy(item => [
            item.id,
            item.warehouseId,
            item.warehouse!.name,
            item.warehouse!.typeId,
            item.warehouse!.type!.name,
            item.warehouse!.rating,
            item.lot!.lot,
            item.lotId,
            item.goodsId,
            item.rating,
            item.stockDate,
            item.goods!.name,
            item.goods!.specification,
            item.goods!.thick,
            item.lot!.width,
            item.lot!.length,
            item.lot!.weight,
            item.lot!.thick,
            item.goods!.type,
            item.goods!.category,
            item.goods!.unitPrice,
            item.goodsReceiptInfo!.unitPrice,
            item.goodsReceiptInfo!.partnerId,
            item.goodsReceiptInfo!.partnerName,
            item.goodsReceiptInfo!.isExport,
            item.productionInfo!.partnerId,
            item.productionInfo!.partnerName,
            item.productionInfo!.isExport
          ])
          .select(item => ({
            id: sorm.query("ROW_NUMBER() OVER (ORDER BY [warehouse].name, [goods].type, [goods].category, [goods].name, [lot].lot)", Number),
            stockId: item.id,
            warehouseId: item.warehouseId,
            warehouseTypeId: item.warehouse!.typeId,
            warehouseTypeName: item.warehouse!.type!.name,
            warehouseName: item.warehouse!.name,
            warehouseRating: item.warehouse!.rating,
            lotId: item.lotId,
            lotName: item.lot!.lot,
            goodType: item.goods!.type,
            goodCategory: item.goods!.category,
            partnerId: sorm.ifNull(item.productionInfo!.partnerId, item.goodsReceiptInfo!.partnerId),
            partnerName: sorm.ifNull(item.productionInfo!.partnerName, item.goodsReceiptInfo!.partnerName),
            isExport: sorm.ifNull(item.productionInfo!.isExport, item.goodsReceiptInfo!.isExport),
            goodId: item.goodsId,
            goodName: item.goods!.name,
            goodRating: item.rating,
            specification: item.goods!.specification,
            width: sorm.ifNull(item.lot!.width, item.goods!.specification),
            thick: sorm.ifNull(item.lot!.thick, item.goods!.thick),
            length: item.lot!.length,
            weight: item.lot!.weight,
            unitPrice: sorm.case<number | undefined>(
              sorm.notNull(item.goodsReceiptInfo!.unitPrice), sorm.ifNull(item.goodsReceiptInfo!.unitPrice, 0)
            ).else(item.goods!.unitPrice),
            totalPrice: sorm.query("NULL", Number),
            realStockQuantity: sorm.ifNull(sorm.sum(item.quantity), 0),
            inconsistency: sorm.cast(sorm.and([sorm.notEqual(sorm.ifNull(sorm.sum(item.quantity), 0), 0), sorm.notEqual(item.rating, item.warehouse!.rating)]), Boolean),
            stockDate: item.stockDate
          }))
          .wrap()
          .orderBy(item => item.warehouseName)
          .orderBy(item => item.goodType)
          .orderBy(item => item.goodCategory)
          .orderBy(item => item.goodName)
          .orderBy(item => item.lotName)
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
      const ws = wb.createWorksheet(`창고별 재고 현황`);
      ws.cell(0, 0).value = "창고명칭";
      ws.cell(0, 1).value = "로케이션";
      ws.cell(0, 2).value = "계열";
      ws.cell(0, 3).value = "분류";
      ws.cell(0, 4).value = "LOT";
      ws.cell(0, 5).value = "일자";
      ws.cell(0, 6).value = "거래처";
      ws.cell(0, 7).value = "제품명";
      ws.cell(0, 8).value = "규격";
      ws.cell(0, 9).value = "중량";
      ws.cell(0, 10).value = "단가";
      ws.cell(0, 11).value = "현재고";
      ws.cell(0, 12).value = "금액";
      ws.cell(0, 13).value = "등급 불일치";

      for (let i = 0; i <= 13; i++) {
        Object.assign(ws.cell(0, i).style, headerStyle);
      }

      for (let i = 0; i < items.length; i++) {
        const warehouseCurrentItem = items[i];

        if (warehouseCurrentItem.goodType === "재단") {

          try {
            const specification = (warehouseCurrentItem.specification && warehouseCurrentItem.specification.match(/[0-9]*g/))
              ? eval(warehouseCurrentItem.specification.match(/[0-9* ]*g/)![0]) //tslint:disable-line:no-eval
              : 1;
            warehouseCurrentItem.length = specification * warehouseCurrentItem.realStockQuantity!;
          }
          catch (err) {
            warehouseCurrentItem.length = warehouseCurrentItem.realStockQuantity!;
          }
        }

        warehouseCurrentItem.totalPrice = (warehouseCurrentItem.unitPrice || 0) * (warehouseCurrentItem.realStockQuantity || 0);

        ws.cell(i + 1, 0).value = (warehouseCurrentItem.warehouseTypeName);
        ws.cell(i + 1, 1).value = warehouseCurrentItem.warehouseName;
        ws.cell(i + 1, 2).value = warehouseCurrentItem.goodType;
        ws.cell(i + 1, 3).value = warehouseCurrentItem.goodCategory;
        ws.cell(i + 1, 4).value = warehouseCurrentItem.lotName;
        ws.cell(i + 1, 5).value = warehouseCurrentItem.stockDate;
        ws.cell(i + 1, 6).value = warehouseCurrentItem.partnerName;
        ws.cell(i + 1, 7).value = warehouseCurrentItem.goodName;
        ws.cell(i + 1, 8).value = warehouseCurrentItem.specification;
        ws.cell(i + 1, 9).value = warehouseCurrentItem.weight;
        ws.cell(i + 1, 10).value = warehouseCurrentItem.unitPrice;
        ws.cell(i + 1, 11).value = warehouseCurrentItem.realStockQuantity;
        ws.cell(i + 1, 12).value = warehouseCurrentItem.totalPrice;
        ws.cell(i + 1, 13).value = "창고 - " + warehouseCurrentItem.warehouseRating + " / " + warehouseCurrentItem.goodName + " - " + warehouseCurrentItem.goodRating;
      }
      const title = "창고 별 재고 현황.xlsx";

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
          .include(item => item.lot)
          .include(item => item.warehouse)
          .include(item => item.warehouse!.type)
          .join(
            ProductionItem,
            "productionInfo",
            (qb, en) => qb
              .include(item => item.production)
              .include(item => item.production!.instruction)
              .include(item => item.production!.instruction!.partners)
              .where(item => [
                sorm.equal(item.lotId, en.lotId)
              ])
              .select(item => ({
                partnerId: item.production!.instruction!.partnerId,
                partnerName: item.production!.instruction!.partners!.name,
                isExport: item.production!.instruction!.partners!.isExport
              })),
            true
          )
          .join(
            GoodsReceipt,
            "goodsReceiptInfo",
            (qb, en) => qb
              .include(item => item.partner)
              .where(item => [
                sorm.equal(item.receiptLotId, en.lotId)
              ])
              .select(item => ({
                unitPrice: sorm.ifNull(item.unitPrice, 0),
                partnerId: item.partnerId,
                partnerName: item.partner!.name,
                isExport: item.partner!.isExport
              })),
            true
          )
          .groupBy(item => [
            item.id,
            item.warehouseId,
            item.warehouse!.typeId,
            item.warehouse!.type!.name,
            item.warehouse!.name,
            item.warehouse!.rating,
            item.lot!.lot,
            item.lotId,
            item.goodsId,
            item.rating,
            item.stockDate,
            item.goods!.name,
            item.goods!.specification,
            item.goods!.thick,
            item.lot!.width,
            item.lot!.length,
            item.lot!.weight,
            item.lot!.thick,
            item.lot!.createdAtDateTime,
            item.goods!.type,
            item.goods!.category,
            item.goods!.unitPrice,
            item.goodsReceiptInfo!.unitPrice,
            item.goodsReceiptInfo!.partnerId,
            item.goodsReceiptInfo!.partnerName,
            item.goodsReceiptInfo!.isExport,
            item.productionInfo!.partnerId,
            item.productionInfo!.partnerName,
            item.productionInfo!.isExport
          ])
          .select(item => ({
            id: sorm.query("ROW_NUMBER() OVER (ORDER BY [goods].type, [goods].category, [goods].name, [TBL].lotId, [warehouse].name)", Number),
            stockId: item.id,
            warehouseId: item.warehouseId,
            warehouseName: item.warehouse!.name,
            warehouseTypeId: item.warehouse!.typeId,
            warehouseTypeName: item.warehouse!.type!.name,
            warehouseRating: item.warehouse!.rating,
            lotId: item.lotId,
            lotName: item.lot!.lot,
            goodType: item.goods!.type,
            goodCategory: item.goods!.category,
            partnerId: sorm.ifNull(item.productionInfo!.partnerId, item.goodsReceiptInfo!.partnerId),
            partnerName: sorm.ifNull(item.productionInfo!.partnerName, item.goodsReceiptInfo!.partnerName),
            isExport: sorm.ifNull(item.productionInfo!.isExport, item.goodsReceiptInfo!.isExport),
            goodId: item.goodsId,
            goodName: item.goods!.name,
            goodRating: item.rating,
            specification: item.goods!.specification,
            width: sorm.ifNull(item.lot!.width, item.goods!.specification),
            thick: sorm.ifNull(item.lot!.thick, item.goods!.thick),
            length: item.lot!.length,
            weight: item.lot!.weight,
            unitPrice: sorm.case<number | undefined>(
              sorm.notNull(item.goodsReceiptInfo!.unitPrice), sorm.ifNull(item.goodsReceiptInfo!.unitPrice, 0)
            ).else(item.goods!.unitPrice),
            totalPrice: sorm.query("NULL", Number),
            realStockQuantity: sorm.ifNull(sorm.sum(item.quantity), 0),
            inconsistency: sorm.cast(sorm.and([sorm.notEqual(sorm.ifNull(sorm.sum(item.quantity), 0), 0), sorm.notEqual(item.rating, item.warehouse!.rating)]), Boolean),
            stockDate: item.stockDate
          }))
          .wrap();

        if (this.lastFilter!.inconsistency) {
          result = result
            .where(item => [
              sorm.equal(item.inconsistency, true)
            ]);
          // this.items = this.items.filter(item => item.inconsistency);
        }

        this.items = await result
          .orderBy(item => item.id)
          .limit(this.pagination.page * 50, 50)
          .resultAsync();

        for (const stockItem of this.items) {

          if (stockItem.goodType === "재단") {
            try {
              const specification = (stockItem.specification && stockItem.specification.match(/[0-9]*g/))
                ? eval(stockItem.specification.match(/[0-9* ]*g/)![0]) //tslint:disable-line:no-eval
                : 1;
              stockItem.length = specification * stockItem.realStockQuantity!;
            }
            catch (err) {
              stockItem.length = stockItem.realStockQuantity!;
            }
          }

          stockItem.totalPrice = (stockItem.unitPrice || 0) * (stockItem.realStockQuantity || 0);
        }

        this.items.push({
          id: undefined,
          stockId: undefined,
          warehouseId: undefined,
          warehouseTypeId: undefined,
          warehouseTypeName: undefined,
          warehouseName: undefined,
          warehouseRating: undefined,
          lotId: undefined,
          lotName: undefined,
          goodType: undefined,
          goodCategory: undefined,
          partnerId: undefined,
          partnerName: undefined,
          isExport: undefined,
          goodId: undefined,
          goodName: undefined,
          goodRating: undefined,
          specification: undefined,
          width: undefined,
          thick: undefined,
          length: undefined,
          weight: undefined,
          unitPrice: undefined,
          totalPrice: this.items!.sum(item => item.totalPrice || 0),
          realStockQuantity: this.items!.sum(item => item.realStockQuantity || 0),
          inconsistency: undefined,
          stockDate: undefined
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

    if (this.lastFilter!.fromDate || this.lastFilter!.toDate) {
      queryable = queryable
        .where(item => [
          sorm.between(item.stockDate!, this.lastFilter!.fromDate, this.lastFilter!.toDate!)
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

    if (this.lastFilter!.warehouseId) {
      queryable = queryable
        .include(item => item.goods)
        .where(item => [
          sorm.equal(item.warehouseId, this.lastFilter!.warehouseId)
        ]);
    }

    return queryable;
  }
}

interface IFilterVM {
  type?: string | undefined;
  category?: string | undefined;
  fromDate?: DateOnly;
  toDate?: DateOnly;
  goodName?: string;
  lot?: string;
  specification?: string;
  warehouseId?: number;
  inconsistency: boolean;
  isRealStock: boolean;
}

export interface IStockWarehouseCurrentVM {
  id: number | undefined;
  stockId: number | undefined;
  warehouseId: number | undefined;
  warehouseTypeId: number | undefined;
  warehouseTypeName: string | undefined;
  warehouseName: string | undefined;
  warehouseRating: "A" | "B" | "C" | "공통" | undefined;
  lotId: number | undefined;
  lotName: string | undefined;
  partnerId: number | undefined;
  partnerName: string | undefined;
  isExport: boolean | undefined;
  goodType: string | undefined;
  goodCategory: string | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  goodRating: "A" | "B" | "C" | "공통" | undefined;
  specification: string | undefined;
  thick: number | undefined;
  width: string | undefined;
  length: number | undefined;
  weight: number | undefined;
  unitPrice: number | undefined;
  totalPrice: number | undefined;
  realStockQuantity: number | undefined;
  inconsistency: boolean | undefined;
  stockDate: DateOnly | undefined;
}
