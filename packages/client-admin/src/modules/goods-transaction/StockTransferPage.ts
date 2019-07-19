import {ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnInit} from "@angular/core";
import {DateOnly, DateTime} from "@simplism/core";
import {MainDbContext, StockProc, StockTransfer} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {SdModalProvider, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {AppDataProvider} from "@sample/client-common";
import {StockSearchModal} from "../../modals/StockSearchModal";
import {Queryable} from "@simplism/orm-client";
import {PackingBarcodeSearchModal} from "../../modals/PackingBarcodeSearchModal";
import {ShowManualModal} from "../../modals/ShowManualModal";

@Component({
  selector: "app-stock-transfer",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>재고이동</h4>
          <sd-topbar-menu (click)="onAddPaletteItemButtonClick()">
            <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
            팔레트 바코드 추가
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onAddItemButtonClick()">
            <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
            행 추가
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onSaveButtonClick()">
            <sd-icon [icon]="'save'" [fixedWidth]="true"></sd-icon>
            저장
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onShowManualButtonClick()" style="float: right; padding-right: 25px;">
            <sd-icon [icon]="'atlas'" [fixedWidth]="true"></sd-icon>
            메뉴얼 보기
          </sd-topbar-menu>
          <!-- 
       <sd-topbar-menu *ngIf="lastFilter && (items && orgItems.length > 0)" (click)="onDownloadButtonClick()">
         <sd-icon [icon]="'download'" [fixedWidth]="true"></sd-icon>
         다운로드
       </sd-topbar-menu>-->
        </sd-topbar>

        <sd-dock-container>
          <sd-dock class="sd-padding-sm-default sd-background-grey-lightest">
            <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
              <sd-form-item [label]="'이동일'">
                <sd-textfield [(value)]="filter.fromDate" [type]="'date'"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'~'">
                <sd-textfield [(value)]="filter.toDate" [type]="'date'"></sd-textfield>
              </sd-form-item>
              <br>
              <sd-form-item [label]="'품목명'">
                <app-good-name-select [(value)]="filter.goodName"></app-good-name-select>
              </sd-form-item>
              <sd-form-item [label]="'규격'">
                <app-goods-specification-select [(value)]="filter.specification"
                                                [goodName]="filter.goodName"></app-goods-specification-select>
              </sd-form-item>
              <sd-form-item [label]="'이동창고'">
                <sd-select [(value)]="filter.movingWarehouseName">
                  <sd-select-item [value]="undefined">전체</sd-select-item>
                  <sd-select-item *ngFor="let warehouse of warehouseList; trackBy: trackByMeFn"
                                  [value]="warehouse.id"
                                  [hidden]="warehouse.isDisabled">
                    {{ warehouse.name }}
                  </sd-select-item>
                </sd-select>
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
              <sd-sheet #sheet [id]="'stock-transfer'"
                        [items]="items"
                        [trackBy]="trackByIdFn">
                <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      <span *ngIf="item.id">{{ item.id }}</span>
                      <a *ngIf="!item.id" (click)="onRemoveItemButtonClick(item)">
                        <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'이동일'" [width]="130">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.moveDate" [type]="'date'"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'LOT'" [width]="210">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.lotName }}
                      <a (click)="stockTransferGoodsSearchModalOpenButtonClick(item)"
                         [attr.sd-invalid]="!item.lotId">
                        <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'등급'" [width]="80">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.goodRating }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'제품'">
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
                <sd-sheet-column [header]="'출발창고'" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.fromWarehouseName }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'이동창고'" [width]="100">
                  <ng-template #item let-item="item" style="text-align: center;">
                    <sd-select [(value)]="item.toWarehouseId" (valueChange)="onChangeToWarehouse(item, $event)"
                               [required]="true"
                               [disabled]="!!item.id">
                      <sd-select-item *ngFor="let warehouse of warehouseList; trackBy: trackByMeFn"
                                      [value]="warehouse.id"
                                      [hidden]="warehouse.isDisabled">
                        {{ warehouse.name }}
                      </sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'창고등급'" [width]="80">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.toWarehouseRating }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'수량'" [width]="100">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.quantity"
                                  [type]="'number'"
                                  [required]="true">
                    </sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'단위'" [width]="60">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.unitName }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'비고'">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.remark"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'등록자'" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.createdByEmployeeName }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'등록시간'" [width]="130">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.createdAtDateTime?.toFormatString("yyyy-MM-dd HH:mm") }}
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
export class StockTransferPage implements OnInit {

  public filter: IFilterVM = {
    fromDate: new DateOnly().setDay(1),
    toDate: new DateOnly(),
    movingWarehouseName: undefined,
    goodName: undefined,
    specification: undefined
  };

  public lastFilter?: IFilterVM;

  public pagination = {page: 0, length: 0};

  public items: IStockTransferVM[] = [];
  public orgItems: IStockTransferVM[] = [];

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public warehouseList: {
    id: number;
    name: string;
    rating: "A" | "B" | "C" | "공통" | undefined;
    isDisabled: boolean;
  }[] = [];

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _appData: AppDataProvider,
                     private readonly _modal: SdModalProvider,
                     private readonly _toast: SdToastProvider,
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
    });

    await this.onSearchFormSubmit();
    this.mainBusyCount--;

    this._cdr.markForCheck();
  }

  public async onShowManualButtonClick(): Promise<void> {
    const result = await this._modal.show(ShowManualModal, "재고이동 메뉴얼", {type: "stock-transfer"});
    if (!result) return;

    this._cdr.markForCheck();
  }

  public onAddItemButtonClick(): void {
    this.items.insert(0, {
      id: undefined,
      moveDate: new DateOnly(),
      lotId: undefined,
      lotName: undefined,
      goodId: undefined,
      goodName: undefined,
      specification: undefined,
      unitName: undefined,
      goodRating: undefined,
      fromWarehouseId: undefined,
      fromWarehouseName: undefined,
      fromWarehouseRating: undefined,
      fromWarehouseQuantity: undefined,
      toWarehouseId: undefined,
      toWarehouseName: undefined,
      toWarehouseRating: undefined,
      quantity: undefined,
      remark: undefined,
      createdAtDateTime: undefined,
      createdByEmployeeId: undefined,
      createdByEmployeeName: undefined
    });
  }

  public async onAddPaletteItemButtonClick(): Promise<void> {
    const result = await this._modal.show(PackingBarcodeSearchModal, "팔레트 바코드 검색", undefined);
    if (!result) return;

    for (const lotItem of result.packingLotList || []) {
      if (!this.items.some(item => !item.id && item.lotId === lotItem.lotId)) {
        this.items.insert(0, {
          id: undefined,
          moveDate: new DateOnly(),
          lotId: lotItem.lotId,
          lotName: lotItem.lotName,
          goodId: lotItem.goodId,
          goodName: lotItem.goodName,
          specification: lotItem.specification,
          unitName: lotItem.unitName,
          goodRating: lotItem.rating,
          fromWarehouseId: lotItem.warehouseId,
          fromWarehouseName: lotItem.warehouseName,
          fromWarehouseRating: lotItem.warehouseRating,
          fromWarehouseQuantity: lotItem.quantity,
          toWarehouseId: undefined,
          toWarehouseName: undefined,
          toWarehouseRating: undefined,
          quantity: lotItem.quantity,
          remark: undefined,
          createdAtDateTime: undefined,
          createdByEmployeeId: undefined,
          createdByEmployeeName: undefined
        });
      }
    }

    this._cdr.markForCheck();
  }

  public onRemoveItemButtonClick(item: IStockTransferVM): void {
    this.items.remove(item);
  }

  public async stockTransferGoodsSearchModalOpenButtonClick(item: IStockTransferVM): Promise<void> {
    const result = await this._modal.show(StockSearchModal, "품목 검색", {isMulti: false});
    if (!result) return;

    item.lotId = result.lotId;
    item.lotName = result.lotName;
    item.goodId = result.goodId;
    item.goodName = result.goodName;
    item.goodRating = result.rating;
    item.specification = result.specification;
    item.unitName = result.unitName;
    item.quantity = result.quantity;
    item.fromWarehouseId = result.warehouseId;
    item.fromWarehouseName = result.warehouseName;
    item.fromWarehouseRating = result.warehouseRating;
    item.fromWarehouseQuantity = result.quantity;

    this._cdr.markForCheck();
  }

  public async onChangeToWarehouse(item: IStockTransferVM, selectWarehouse: any): Promise<void> {

    item.toWarehouseName = this.warehouseList.filter(item1 => item1.id === selectWarehouse).single()!.name;
    item.toWarehouseRating = this.warehouseList.filter(item1 => item1.id === selectWarehouse).single()!.rating;

    this._cdr.markForCheck();
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

  @HostListener("document:keydown", ["$event"])
  public async onDocumentKeydown(event: KeyboardEvent): Promise<void> {
    if ((event.key === "s" || event.key === "S") && event.ctrlKey) {
      event.preventDefault();
      await this._save();
      this._cdr.markForCheck();
    }
  }

  public async onSaveButtonClick(): Promise<void> {
    await this._save();
    this._cdr.markForCheck();
  }

  private async _save(): Promise<void> {
    const diffs = this.orgItems.diffs(this.items, {keyProps: ["id"]}).reverse();
    const diffTargets = this.orgItems.diffs(this.items, {keyProps: ["id"]}).map(item => item.target!);

    if (diffTargets.length < 1) {
      this._toast.info("변경사항이 없습니다.");
      if (process.env.NODE_ENV === "test") console.log("변경사항이 없습니다.");
      return;
    }

    if (diffTargets.some(item => !item.moveDate)) {
      this._toast.danger("이동일은 반드시 입력해야 합니다.");
      return;
    }

    if (diffTargets.some(item => !item.lotId || !item.goodId)) {
      this._toast.danger("이동 품목은 반드시 선택해야 합니다.");
      return;
    }

    if (diffTargets.some(item => !item.toWarehouseId)) {
      this._toast.danger("이동창고는 반드시 선택해야 합니다.");
      return;
    }

    if (diffTargets.some(item => !item.quantity)) {
      this._toast.danger("이동수량을 입력해야 합니다.");
      return;
    }

    if (diffTargets.some(item => item.goodRating !== item.toWarehouseRating)) {
      this._toast.danger("이동 창고 등급과 제품 등급이 일치하지 않습니다");
      return;
    }

    if (diffTargets.some(item => item.fromWarehouseId === item.toWarehouseId)) {
      this._toast.danger("출발창고와 이동창고는 동일할 수 없습니다.");
      return;
    }

    this.viewBusyCount++;

    try {

      await this._orm.connectAsync(MainDbContext, async db => {
        for (const diff of diffs) {
          // INSERT
          if (!diff.target!.id) {

            const newStockTransfer = await db.stockTransfer
              .insertAsync({
                companyId: this._appData.authInfo!.companyId,
                dueDate: diff.target!.moveDate!,
                lotId: diff.target!.lotId,
                goodsId: diff.target!.goodId!,
                goodsRating: diff.target!.goodRating!,
                fromWarehouseId: diff.target!.fromWarehouseId!,
                toWarehouseId: diff.target!.toWarehouseId!,
                quantity: diff.target!.quantity!,
                createdByEmployeeId: this._appData.authInfo!.employeeId,
                createdAtDateTime: new DateTime()
              });
            diff.target!.id = newStockTransfer.id;
            diff.target!.createdByEmployeeName = this._appData.authInfo!.employeeName;
            diff.target!.createdAtDateTime = new DateTime();

            await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, diff.target!.quantity, diff.target!.lotId, diff.target!.fromWarehouseId, "-", diff.target!.goodRating);
            await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, diff.target!.quantity, diff.target!.lotId, diff.target!.toWarehouseId, "+", diff.target!.goodRating);

          }
          // UPDATE
          else {
            await db.stockTransfer
              .where(item => [
                sorm.equal(item.id, diff.target!.id)
              ])
              .updateAsync(
                () => ({
                  dueDate: diff.target!.moveDate!,
                  quantity: diff.target!.quantity!,
                  remark: diff.target!.remark
                })
              );

            await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, diff.source!.quantity, diff.target!.lotId, diff.target!.fromWarehouseId, "+", diff.target!.goodRating);
            await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, diff.target!.quantity, diff.target!.lotId, diff.target!.fromWarehouseId, "-", diff.target!.goodRating);
            await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, diff.source!.quantity, diff.target!.lotId, diff.target!.toWarehouseId, "-", diff.target!.goodRating);
            await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, diff.target!.quantity, diff.target!.lotId, diff.target!.toWarehouseId, "+", diff.target!.goodRating);


          }
        }
      });

      this.orgItems = Object.clone(this.items);
      this._toast.success("저장되었습니다.");
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.viewBusyCount--;
  }


  private async _search(): Promise<void> {
    if (!this.lastFilter) return;

    this.mainBusyCount++;
    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        const queryable = this._getSearchQueryable(db);

        this.items = await queryable
          .orderBy(item => item.id)
          .limit(this.pagination.page * 50, 50)
          .wrap(StockTransfer)
          .include(item => item.lot)
          .include(item => item.goods)
          .include(item => item.fromWarehouse)
          .include(item => item.toWarehouse)
          .include(item => item.employee)
          .select(item => ({
            id: item.id,
            moveDate: item.dueDate,
            lotId: item.lotId,
            lotName: item.lot!.lot,
            goodId: item.goodsId,
            goodName: item.goods!.name,
            specification: item.goods!.specification,
            unitName: item.goods!.unitName,
            goodRating: item.goodsRating,
            fromWarehouseId: item.fromWarehouseId,
            fromWarehouseName: item.fromWarehouse!.name,
            fromWarehouseRating: item.fromWarehouse!.rating,
            fromWarehouseQuantity: undefined,
            toWarehouseId: item.toWarehouseId,
            toWarehouseName: item.toWarehouse!.name,
            toWarehouseRating: item.toWarehouse!.rating,
            quantity: item.quantity,
            remark: item.remark,
            createdAtDateTime: item.createdAtDateTime,
            createdByEmployeeId: item.createdByEmployeeId,
            createdByEmployeeName: item.employee!.name
          }))
          .resultAsync();

        this.orgItems = Object.clone(this.items);

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

  private _getSearchQueryable(db: MainDbContext): Queryable<StockTransfer> {
    let queryable = db.stockTransfer
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);

    if (this.lastFilter!.fromDate || this.lastFilter!.toDate) {
      queryable = queryable
        .where(item => [
          sorm.between(item.dueDate, this.lastFilter!.fromDate, this.lastFilter!.toDate!)
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

    if (this.lastFilter!.movingWarehouseName) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.toWarehouseId, this.lastFilter!.movingWarehouseName)
        ]);
    }

    return queryable;
  }
}

interface IFilterVM {
  fromDate?: DateOnly;
  toDate?: DateOnly;
  movingWarehouseName?: number;
  goodName?: string;
  specification?: string;
}

interface IStockTransferVM {
  id: number | undefined;
  moveDate: DateOnly | undefined;
  lotId: number | undefined;
  lotName: string | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  specification: string | undefined;
  unitName: string | undefined;
  goodRating: "A" | "B" | "C" | "공통" | undefined;
  fromWarehouseId: number | undefined;
  fromWarehouseName: string | undefined;
  fromWarehouseRating: "A" | "B" | "C" | "공통" | undefined;
  fromWarehouseQuantity: number | undefined;
  toWarehouseId: number | undefined;
  toWarehouseName: string | undefined;
  toWarehouseRating: "A" | "B" | "C" | "공통" | undefined;
  quantity: number | undefined;
  remark: string | undefined;
  createdAtDateTime: DateTime | undefined;
  createdByEmployeeId: number | undefined;
  createdByEmployeeName: string | undefined;
}
