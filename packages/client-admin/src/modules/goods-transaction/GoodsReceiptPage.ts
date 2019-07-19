import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnInit} from "@angular/core";
import {DateOnly, DateTime} from "@simplism/core";
import {
  CodeProc,
  GoodsReceipt,
  MainDbContext,
  StockProc
} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {
  SdDomValidatorProvider,
  SdModalProvider,
  SdOrmProvider,
  SdPrintProvider,
  SdToastProvider
} from "@simplism/angular";
import {AppDataProvider} from "@sample/client-common";
import {GoodsSearchModal} from "../../modals/GoodsSearchModal";
import {Queryable} from "@simplism/orm-client";
import {LotSearchModal} from "../../modals/LotSearchModal";
import {SmallBarcodePrintTemplate} from "../../print-templates/SmallBarcodePrintTemplate";
import {ExcelWorkbook} from "@simplism/excel";
import {ShowManualModal} from "../../modals/ShowManualModal";

@Component({
  selector: "app-goods-receipt",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>재고 입고</h4>

          <sd-topbar-menu (click)="onAddItemButtonClick()">
            <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
            행 추가
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onSaveButtonClick()">
            <sd-icon [icon]="'save'" [fixedWidth]="true"></sd-icon>
            저장
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onDownloadButtonClick()">
            <sd-icon [icon]="'download'" [fixedWidth]="true"></sd-icon>
            다운로드
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onShowManualButtonClick()" style="float: right; padding-right: 25px;">
            <sd-icon [icon]="'atlas'" [fixedWidth]="true"></sd-icon>
            메뉴얼 보기
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onBarcodePrintButtonClick()" style="float: right; margin-right: 25px;">
            <sd-icon [icon]="'barcode'" [fixedWidth]="true"></sd-icon>
            바코드 출력
          </sd-topbar-menu>
        </sd-topbar>

        <sd-dock-container>
          <sd-dock class="sd-padding-sm-default sd-background-grey-lightest">
            <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
              <sd-form-item [label]="'입고일'">
                <sd-textfield [(value)]="filter.fromDate" [type]="'date'"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'~'">
                <sd-textfield [(value)]="filter.toDate" [type]="'date'"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'거래처'">
                <sd-textfield [(value)]="filter.partnerName"></sd-textfield>
              </sd-form-item>
              <br>
              <sd-form-item [label]="'정렬기준'">
                <sd-select [(value)]="filter.sort">
                  <sd-select-item [value]="sort.type" *ngFor="let sort of sortTypes; trackBy: trackByMeFn">
                    {{ sort.name }}
                  </sd-select-item>
                </sd-select>
              </sd-form-item>
              <sd-form-item [label]="'기준'">
                <sd-select [(value)]="filter.orderBy">
                  <sd-select-item [value]="false">오름차순</sd-select-item>
                  <sd-select-item [value]="true">내림차순</sd-select-item>
                </sd-select>
              </sd-form-item>
              <sd-form-item [label]="'품목명'">
                <app-good-name-select [(value)]="filter.goodName"></app-good-name-select>
              </sd-form-item>
              <sd-form-item [label]="'규격'">
                <app-goods-specification-select [(value)]="filter.specification"
                                                [goodName]="filter.goodName"></app-goods-specification-select>
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
              <sd-form-item [label]="'취소제외'">
                <sd-checkbox [(value)]="filter.isDisabled"></sd-checkbox>
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
              <sd-sheet #sheet [id]="'goods-receipt'"
                        [items]="items"
                        [trackBy]="trackByIdFn"
                        [selectable]="'multi'"
                        [selectedItems]="printItems"
                        (selectedItemsChange)="onSelectedItemsChange($event)">
                <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      <span *ngIf="item.id">{{ item.viewId }}</span>
                      <a *ngIf="!item.id" (click)="onRemoveItemButtonClick(item)">
                        <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'입고일'" [width]="195">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.dueDate" [type]="'datetime'"
                                  [disabled]="item.id && (!!item.receiptInspectionId || !!item.qcInspectionId)"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'거래처'">
                  <ng-template #item let-item="item">
                    <app-partner-select [(value)]="item.partnerId"
                                        (valueChange)="onChangePartner($event, item)"
                                        [items]="partnerList"
                                        [required]="true" *ngIf="!item.id && !item.shippingPlanId"></app-partner-select>
                    <div class="sd-padding-xs-sm" *ngIf="!!item.id || (!item.id && !!item.shippingPlanId)">
                      {{ item.partnerName }}
                    </div>
                    <!-- <div class="sd-padding-xs-sm">
                       {{ item.partnerName }}
                       <a (click)="partnerSearchModalOpenButtonClick(item)"
                          [attr.sd-invalid]="!item.partnerId">
                         <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                       </a>
                     </div>-->
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'제품'">
                  <ng-template #item let-item="item">
                    <app-good-select *ngIf="!item.id" [isReceipt]="true"
                                     [(value)]="item.goodId" (valueChange)="onChangeGood($event, item)"
                                     [required]="true">
                    </app-good-select>
                    <div class="sd-padding-xs-sm" *ngIf="!!item.id">
                      {{ item.goodName }}
                    </div>
                    <!-- <div class="sd-padding-xs-sm">
                       {{ item.goodName }}
                       <a (click)="goodsReceiptGoodsSearchModalOpenButtonClick(item)"
                          [attr.sd-invalid]="!item.goodId">
                         <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                       </a>
                     </div>-->
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'규격'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.specification }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'중량(수량별)'" [width]="80">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.unitWeight" (valueChange)="onChangeTotalQuantity(item)"
                                  [disabled]="item.id && (!!item.receiptInspectionId || !!item.qcInspectionId)"
                                  [type]="'number'"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'수량'" [width]="80">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.quantity" (valueChange)="onChangeTotalQuantity(item)"
                                  [disabled]="item.id && (!!item.receiptInspectionId || !!item.qcInspectionId)"
                                  [type]="'number'" [required]="true"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'총 입고량'" [width]="140">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right; margin-right: 5px;">
                      <app-input-unit [unit]="item.unitName" [(value)]="item.totalQuantity" [width]="70"
                                      [disabled]="true"></app-input-unit>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'단가'" [width]="100">
                  <ng-template #item let-item="item">
                    <sd-textfield [type]="'number'"
                                  [(value)]="item.unitPrice" (valueChange)="onChangeUnitPrice($event, item)"
                                  [disabled]="item.id && (!!item.receiptInspectionId || !!item.qcInspectionId)"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'합계금액'" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right; margin-right: 5px;">
                      {{ item.totalPrice | number }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'구분'" [width]="90">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.typeId" (valueChange)="onTypeChange(item)"
                               [disabled]="item.id && (!!item.receiptInspectionId || !!item.qcInspectionId)">
                      <sd-select-item [value]="undefined">반품</sd-select-item>
                      <sd-select-item *ngFor="let type of typeList; trackBy: trackByMeFn"
                                      [value]="type.id"
                                      [hidden]="type.isDisabled">
                        {{ type.name }}
                      </sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'창고'">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.warehouseId" [required]="true"
                               [disabled]="item.id && (!!item.receiptInspectionId || !!item.qcInspectionId)">
                      <sd-select-item *ngFor="let warehouse of warehouseList; trackBy: trackByMeFn"
                                      [value]="warehouse.id"
                                      [hidden]="warehouse.isDisabled">
                        {{ warehouse.name }}
                      </sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'이전LOT'">
                  <ng-template #item let-item="item">
                    <div *ngIf="!item.id">
                      <app-lot-select [goodId]="item.goodId" [(value)]="item.previousLotId"
                                      [disabled]="(!item.goodId) || (item.receiptInspectionId || item.qcInspectionId)"></app-lot-select>
                    </div>
                    <div class="sd-padding-xs-sm"
                         *ngIf="!!item.id">
                      {{ item.previousLotName }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'이전LOT(수기)'">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.writePreviousLotName"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'입고LOT'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.receiptLotName }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'검사 ID'" [width]="80">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" *ngIf="!!item.typeId && item.needCanceled === true"
                         style="text-align: center;">
                      <a (click)="onReceiptInspectionButtonClick(item.receiptInspectionId)">
                        {{ item.receiptInspectionId ? "#" + item.receiptInspectionId + " 불합격" : "" }}
                      </a>
                    </div>
                    <div class="sd-padding-xs-sm" *ngIf="!!item.typeId && item.needCanceled !== true"
                         style="text-align: center;">
                      <a (click)="onReceiptInspectionButtonClick(item.receiptInspectionId)">
                        {{ item.receiptInspectionId ? "#" + item.receiptInspectionId : "" }}
                      </a>
                    </div>
                    <div class="sd-padding-xs-sm" *ngIf="!item.typeId && item.needCanceled === true"
                         style="color: #c30000; text-align: center;">
                      <a (click)="onQcInspectionButtonClick(item.qcInspectionId)">
                        {{ item.qcInspectionId ? "#" + item.qcInspectionId + " 불합격" : "" }}
                      </a>
                    </div>
                    <div class="sd-padding-xs-sm" *ngIf="!item.typeId && item.needCanceled !== true"
                         style="text-align: center;">
                      <a (click)="onQcInspectionButtonClick(item.qcInspectionId)">
                        {{ item.qcInspectionId ? "#" + item.qcInspectionId : "" }}
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'등록자'" [width]="90">
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
                <sd-sheet-column [header]="'취소'" [width]="60">
                  <ng-template #item let-item="item">
                    <div style="text-align: center;">
                      <sd-checkbox [(value)]="item.isDisabled" [disabled]="!item.id"></sd-checkbox>
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
export class GoodsReceiptPage implements OnInit {

  public filter: IFilterVM = {
    partnerName: undefined,
    sort: "[TBL].id",
    orderBy: false,
    fromDate: undefined,
    toDate: undefined,
    goodName: undefined,
    specification: undefined,
    lot: undefined,
    warehouseId: undefined,
    isDisabled: false
  };

  public lastFilter?: IFilterVM;

  public sortTypes?: {
    name: string;
    type: string;
  }[];

  public pagination = {page: 0, length: 0};

  public items: IReceiptVM[] = [];
  public orgItems: IReceiptVM[] = [];
  public printItems: IReceiptVM[] = [];

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public equipmentList: {
    id: number;
    name: string;
    isDisabled: boolean;
  }[] = [];

  public typeList: {
    id: number;
    name: string;
    isDisabled: boolean;
  }[] = [];

  public partnerList: {
    id: number;
    name: string;
    isDisabled: boolean;
  }[] = [];

  public warehouseList: {
    id: number;
    name: string;
    rating: "A" | "B" | "C" | "공통";
    isDisabled: boolean;
  }[] = [];

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _appData: AppDataProvider,
                     private readonly _elRef: ElementRef<HTMLElement>,
                     private readonly _print: SdPrintProvider,
                     private readonly _domValidator: SdDomValidatorProvider,
                     private readonly _modal: SdModalProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _cdr: ChangeDetectorRef) {
  }

  public async ngOnInit(): Promise<void> {
    this.mainBusyCount++;

    this.sortTypes = [
      {name: "ID", type: "[TBL].id"},
      {name: "입고일", type: "[TBL].dueDate"},
      {name: "품명/규격", type: "[goods].[name]"},
      {name: "거래처", type: "[partner].[name]"}
    ];

    await this._orm.connectAsync(MainDbContext, async db => {
      this.equipmentList = await db.equipment
        .where(item => [
          sorm.equal(item.companyId, this._appData.authInfo!.companyId),
          sorm.equal(item.isDisabled, false)
        ])
        .select(item => ({
          id: item.id!,
          name: item.name,
          isDisabled: item.isDisabled
        }))
        .resultAsync();

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

      this.typeList = await db.baseType
        .where(item => [
          sorm.equal(item.companyId, this._appData.authInfo!.companyId),
          sorm.equal(item.isDisabled, false),
          sorm.equal(item.type, "입고구분")
        ])
        .select(item => ({
          id: item.id!,
          name: item.name,
          isDisabled: item.isDisabled
        }))
        .resultAsync();

      this.partnerList = await db.partner
        .where(item => [
          sorm.equal(item.companyId, this._appData.authInfo!.companyId),
          sorm.equal(item.isDisabled, false)
        ])
        .select(item => ({
          id: item.id!,
          name: item.name,
          isDisabled: item.isDisabled
        }))
        .resultAsync();
    });

    await this.onSearchFormSubmit();
    this.mainBusyCount--;
    this._cdr.markForCheck();
  }

  public async onShowManualButtonClick(): Promise<void> {
    const result = await this._modal.show(ShowManualModal, "재고 입고 메뉴얼", {type: "goods-receipt"});
    if (!result) return;

    this._cdr.markForCheck();
  }


  public onAddItemButtonClick(): void {
    const type = this.typeList ? this.typeList.length > 0 ? this.typeList[0] : undefined : undefined;

    this.items.insert(0, {
      id: undefined,
      code: undefined,
      dueDate: new DateTime(),
      partnerId: undefined,
      partnerName: undefined,
      goodType: undefined,
      goodId: undefined,
      goodName: undefined,
      specification: undefined,
      thick: undefined,
      length: undefined,
      unitWeight: undefined,
      quantity: undefined,
      totalPrice: undefined,
      totalQuantity: undefined,
      unitName: undefined,
      unitPrice: undefined,
      prevTypeId: undefined,
      prevTypeName: undefined,
      typeId: type ? type.id : undefined,
      typeName: type ? type.name : undefined,
      remark: undefined,
      warehouseId: undefined,
      warehouseName: undefined,
      writePreviousLotName: undefined,
      previousLotId: undefined,
      previousLotName: undefined,
      receiptLotId: undefined,
      receiptLotName: undefined,
      receiptInspectionId: undefined,
      qcInspectionId: undefined,
      needCanceled: false,
      isDisabled: false,
      createdByEmployeeId: undefined,
      createdByEmployeeName: undefined,
      createdAtDateTime: undefined
    });
  }

  public onRemoveItemButtonClick(item: IReceiptVM): void {
    this.items.remove(item);
  }

  public async onChangeTotalQuantity(item: IReceiptVM): Promise<void> {
    item.totalQuantity = (item.unitWeight || 1) * (item.quantity || 0);
  }

  public onChangeUnitPrice(unitPrice: number | undefined, item: IReceiptVM): void {
    item.totalPrice = (item.quantity || 0) * (unitPrice || 0);
    this._cdr.markForCheck();
  }

  /*
    public async partnerSearchModalOpenButtonClick(item: IReciptVM): Promise<void> {
      const result = await this._modal.show(PartnerSearchModal, "거래처 검색", {isMulti: false});
      if (!result) return;

      item.partnerId = result.id;
      item.partnerName = result.name;

      this._cdr.markForCheck();
    }
  */

  public async onChangePartner(partnerId: number, item: IReceiptVM): Promise<void> {
    if (partnerId) {
      item.partnerName = this.partnerList!.filter(item1 => item1.id === partnerId).single()!.name;
    }
    else {
      item.partnerName = undefined;
    }
    this._cdr.markForCheck();
  }

  public async goodsReceiptGoodsSearchModalOpenButtonClick(item: IReceiptVM): Promise<void> {
    const result = await this._modal.show(GoodsSearchModal, "품목 검색", {isMulti: false});
    if (!result) return;

    item.goodType = result.type;
    item.goodId = result.id;
    item.goodName = result.name;
    item.specification = result.specification;
    item.thick = result.thick;
    item.length = result.length;
    item.unitPrice = result.unitPrice;
    item.unitName = result.unitName;

    this._cdr.markForCheck();
  }

  public async onChangeGood(goodId: number, item: IReceiptVM): Promise<void> {
    if (goodId) {
      await this._orm.connectAsync(MainDbContext, async db => {
        const result = await db.goods
          .where(item1 => [
            sorm.equal(item1.id, goodId)
          ])
          .select(item1 => ({
            id: item1.id,
            type: item1.type,
            name: item1.name,
            specification: item1.specification,
            thick: item1.thick,
            length: item1.length,
            unitPrice: item1.unitPrice,
            unitName: item1.unitName
          }))
          .singleAsync();

        item.goodType = result!.type;
        item.goodId = result!.id;
        item.goodName = result!.name;
        item.specification = result!.specification;
        item.thick = result!.thick;
        item.length = result!.length;
        item.unitPrice = result!.unitPrice;
        item.unitName = result!.unitName;
      });
    }
    else {
      item.goodType = undefined;
      item.goodId = undefined;
      item.goodName = undefined;
      item.thick = undefined;
      item.length = undefined;
      item.specification = undefined;
      item.unitPrice = undefined;
      item.unitName = undefined;
    }
    this._cdr.markForCheck();
  }

  public async onTypeChange(item: IReceiptVM): Promise<void> {
    item.previousLotId = !item.typeId ? item.previousLotId : undefined;
    item.previousLotName = !item.typeId ? item.previousLotName : undefined;
  }

  public async PreviousLotSearchModalOpenButtonClick(item: IReceiptVM): Promise<void> {
    const result = await this._modal.show(LotSearchModal, "이전 LOT 검색", {isMulti: false, goodId: item.goodId});
    if (!result) return;

    item.previousLotId = result.id;
    item.previousLotName = result.lot;
    item.goodId = result.goodId;

    this._cdr.markForCheck();
  }

  public async onBarcodePrintButtonClick(): Promise<void> {
    if (this.printItems.length < 1) {
      this._toast.danger("출력할 바코드를 선택해 주세요.");
      return;
    }

    if (!confirm("출력 바코드는 총 " + this.printItems.length + "개 입니다. \n진행하시겟습니까?")) return;

    const printList: any[] = [];
    for (const printItem of this.printItems) {
      printList.push({
        goodName: printItem.goodName,
        specification: printItem.specification,
        thick: printItem.thick,
        length: printItem.totalQuantity,
        lot: printItem.receiptLotName
      });
    }

    await this._print.print(SmallBarcodePrintTemplate, {printList});
    this._cdr.markForCheck();
  }

  public onReceiptInspectionButtonClick(id: number): void {
    window.open(location.pathname + "#" + `/home/inspection/receipt-inspection;id=${JSON.stringify(id)}`, "_blank", "left= 500, top= 200 width= 1000, height= 700");
  }

  public onQcInspectionButtonClick(id: number): void {
    window.open(location.pathname + "#" + `/home/inspection/qc-inspection;id=${JSON.stringify(id)}`, "_blank", "left= 500, top= 200 width= 1000, height= 700");
  }

  public onSelectedItemsChange(items: any[]): void {
    this.printItems = items.filter(item => !!item.id);
  }

  public async onDownloadButtonClick(): Promise<void> {
    await this._download();
    this._cdr.markForCheck();
  }

  private async _download(): Promise<void> {
    this.viewBusyCount++;
    try {
      const items: any[] = [];
      await this._orm.connectAsync(MainDbContext, async db => {

        const queryable = this._getSearchQueryable(db);

        const result = await queryable
          .wrap(GoodsReceipt)
          .include(item => item.partner)
          .include(item => item.goods)
          .include(item => item.warehouse)
          .include(item => item.previousLot)
          .include(item => item.receiptLot)
          .include(item => item.employee)
          .include(item => item.type)
          .select(item => ({
            id: item.id,
            code: item.code,
            dueDate: item.dueDate,
            partnerId: item.partnerId,
            partnerName: item.partner!.name,
            goodType: item.goods!.type,
            goodId: item.goodId,
            goodName: item.goods!.name,
            specification: item.goods!.specification,
            unitWeight: item.unitWeight,
            quantity: item.quantity,
            totalQuantity: sorm.formula(sorm.ifNull(item.quantity, 0), "*", sorm.ifNull(item.unitWeight, 1)),
            unitName: item.goods!.unitName,
            unitPrice: item.unitPrice,
            prevTypeId: item.typeId,
            prevTypeName: item.type!.name,
            typeId: item.typeId,
            typeName: item.type!.name,
            remark: item.remark,
            warehouseId: item.warehouseId,
            warehouseName: item.warehouse!.name,
            previousLotId: item.previousLotId,
            previousLotName: item.previousLot!.lot,
            writePreviousLotName: item.writePreviousLot,
            receiptLotId: item.receiptLotId,
            receiptLotName: item.receiptLot!.lot,
            receiptInspectionId: item.receiptInspectionId,
            qcInspectionId: item.qcInspectionId,
            needCanceled: item.needCanceled,
            isDisabled: item.isDisabled,
            createdByEmployeeId: item.createdByEmployeeId,
            createdByEmployeeName: item.employee!.name,
            createdAtDateTime: item.createdAtDateTime
          }))
          .orderBy(item => item.isDisabled, false)
          .resultAsync();

        if (!result || result.length < 1) {
          throw new Error("검색 값이 없습니다.\n검색 조건을 변경 후 진행해 주세요.");
        }

        if (result && result.length > 2000) {
          throw new Error("검색 값이 너무 많습니다.\n검색 조건을 변경 후 진행해해 주세요.");
        }

        for (const resultItem of result || []) {
          items.push({
            "입고일": resultItem.dueDate,
            "거래처": resultItem.partnerName,
            "제품": resultItem.goodName,
            "규격": resultItem.specification,
            "중량(수량별)": resultItem.unitWeight,
            "수량": resultItem.quantity,
            "총 입고량": resultItem.totalQuantity,
            "단위": resultItem.unitName,
            "단가": resultItem.unitPrice,
            "구분": resultItem.typeName,
            "창고": resultItem.warehouseName,
            "이전LOT": resultItem.previousLotName,
            "이전LOT(수기)": resultItem.writePreviousLotName,
            "입고LOT": resultItem.receiptLotName,
            "검사ID": resultItem.typeId ? resultItem.receiptInspectionId : resultItem.qcInspectionId,
            "등록자": resultItem.createdByEmployeeName,
            "등록시간": resultItem.createdAtDateTime,
            "취소": resultItem.isDisabled ? "O" : ""
          });
        }
      });

      const wb = ExcelWorkbook.create();
      wb.json = {"재고입고": items};
      await wb.downloadAsync("재고입고.xlsx");
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

    if (diffTargets.some(item => !item.partnerId)) {
      this._toast.danger("거래처는 반드시 선택해야 합니다.");
      return;
    }

    if (diffTargets.some(item => !item.goodId)) {
      this._toast.danger("제품은 반드시 선택해야 합니다.");
      return;
    }

    this.viewBusyCount++;

    try {
      this._domValidator.validate(this._elRef!.nativeElement);

      Object.validatesArray(
        diffTargets,
        `재고 입고`,
        {
          id: {displayName: "ID", type: Number},
          quantity: {displayName: "수량", type: Number, notnull: true},
          isDisabled: {displayName: "사용중지", type: Boolean, notnull: true}
        }
      );

      await this._orm.connectAsync(MainDbContext, async db => {
        for (const diff of diffs) {
          // INSERT
          if (!diff.target!.id) {
            const documentCode = await CodeProc.getDocumentCode(db, this._appData.authInfo!.companyId, this._appData.authInfo!.employeeId, diff.target!.goodId!, undefined, "입고", undefined, undefined);
            const code = diff.target!.goodType === "원재료" ? "G0" : diff.target!.goodType === "부자재" ? "H0" : "F0";
            const lotName = await CodeProc.getLotCode2(db, this._appData.authInfo!.companyId, this._appData.authInfo!.employeeId, diff.target!.warehouseId!, diff.target!.goodId!, diff.target!.goodName!, code);

            const newProductionInstruction = await db.goodsReceipt
              .insertAsync({
                companyId: this._appData.authInfo!.companyId,
                code: documentCode,
                codeSeq: Number(documentCode.substr(-5, 5)),
                dueDate: diff.target!.dueDate!,
                partnerId: diff.target!.partnerId!,
                goodId: diff.target!.goodId!,
                unitWeight: diff.target!.unitWeight,
                quantity: diff.target!.quantity!,
                unitPrice: diff.target!.unitPrice,
                typeId: diff.target!.typeId,
                remark: diff.target!.remark,
                warehouseId: diff.target!.warehouseId!,
                previousLotId: diff.target!.previousLotId,
                writePreviousLot: diff.target!.writePreviousLotName,
                receiptLotId: lotName.lotId!,
                createdByEmployeeId: this._appData.authInfo!.employeeId,
                createdAtDateTime: new DateTime(),
                needCanceled: false,
                isDisabled: diff.target!.isDisabled
              });
            diff.target!.id = newProductionInstruction.id;
            diff.target!.createdByEmployeeName = this._appData.authInfo!.employeeName;
            diff.target!.createdAtDateTime = new DateTime();
            diff.target!.receiptLotId = newProductionInstruction.receiptLotId;
            diff.target!.receiptLotName = lotName.lotName;

            await db.lotHistory
              .where(item => [
                sorm.equal(item.id, lotName!.lotId)
              ])
              .updateAsync(
                () => ({
                  weight: diff.target!.unitWeight
                })
              );

            const quantity = (diff.target!.unitWeight || 1) * diff.target!.quantity!;
            await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, quantity, lotName.lotId, diff.target!.warehouseId, "+", "공통");
            await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, quantity, "+");

          }
          // UPDATE
          else {
            await db.goodsReceipt
              .where(item => [
                sorm.equal(item.id, diff.target!.id)
              ])
              .updateAsync(
                () => ({
                  dueDate: diff.target!.dueDate!,
                  partnerId: diff.target!.partnerId!,
                  goodId: diff.target!.goodId!,
                  unitWeight: diff.target!.unitWeight,
                  quantity: diff.target!.quantity!,
                  typeId: diff.target!.typeId,
                  unitPrice: diff.target!.unitPrice,
                  writePreviousLot: diff.target!.writePreviousLotName,
                  previousLotId: diff.target!.previousLotId,
                  remark: diff.target!.remark,
                  warehouseId: diff.target!.warehouseId!,
                  isDisabled: diff.target!.isDisabled
                })
              );

            await db.lotHistory
              .where(item => [
                sorm.equal(item.id, diff.target!.receiptLotId)
              ])
              .updateAsync(
                () => ({
                  weight: diff.target!.unitWeight
                })
              );

            const targetDisable = diff.target!.isDisabled;
            const sourceDisable = diff.source!.isDisabled;

            const sourceQuantity = (diff.source!.unitWeight || 1) * diff.source!.quantity!;
            const targetQuantity = (diff.target!.unitWeight || 1) * diff.target!.quantity!;

            // 취소 o -> 취소 x
            if (sourceDisable && !targetDisable) {
              await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, sourceQuantity, diff.target!.receiptLotId, diff.target!.warehouseId, "+", "공통");
              await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, sourceQuantity, "+");
            }
            // 취소 x -> 취소 o
            else if (!sourceDisable && targetDisable) {
              await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, sourceQuantity, diff.target!.receiptLotId, diff.target!.warehouseId, "-", "공통");
              await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, sourceQuantity, "-");
            }
            // 취소 x -> 취소 x
            else if (!sourceDisable && !targetDisable) {
              await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, sourceQuantity, diff.target!.receiptLotId, diff.source!.warehouseId, "-", "공통");
              await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, targetQuantity, diff.target!.receiptLotId, diff.target!.warehouseId, "+", "공통");
              await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, sourceQuantity, "-");
              await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, targetQuantity, "+");
            }

          }
        }
      });

      this.orgItems = Object.clone(this.items);
      this._toast.success("저장되었습니다.");
      await this._search();
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
        let sortQuery = " " + this.lastFilter!.sort;
        const sortType = " " + (this.lastFilter!.orderBy === true ? "DESC" : "ASC");

        if (this.lastFilter!.sort!.includes("goods")) {
          sortQuery = " " + this.lastFilter!.sort + " " + sortType + ", [goods].[specification] ";
        }

        this.items = await queryable
          .include(item => item.partner)
          .include(item => item.goods)
          .include(item => item.warehouse)
          .include(item => item.previousLot)
          .include(item => item.receiptLot)
          .include(item => item.employee)
          .include(item => item.type)
          .select(item => ({
            viewId: sorm.query("ROW_NUMBER() OVER (ORDER BY" + sortQuery + sortType + ")", Number),
            id: item.id,
            code: item.code,
            dueDate: item.dueDate,
            partnerId: item.partnerId,
            partnerName: item.partner!.name,
            goodType: item.goods!.type,
            goodId: item.goodId,
            goodName: item.goods!.name,
            specification: item.goods!.specification,
            thick: item.goods!.thick,
            length: item.goods!.length,
            unitWeight: item.unitWeight,
            quantity: item.quantity,
            totalQuantity: sorm.formula(sorm.ifNull(item.quantity, 0), "*", sorm.ifNull(item.unitWeight, 1)),
            unitName: item.goods!.unitName,
            unitPrice: item.unitPrice,
            totalPrice: sorm.formula(sorm.ifNull(item.unitPrice, 0), "*", sorm.ifNull(item.quantity, 0)),
            prevTypeId: item.typeId,
            prevTypeName: item.type!.name,
            typeId: item.typeId,
            typeName: item.type!.name,
            remark: item.remark,
            warehouseId: item.warehouseId,
            warehouseName: item.warehouse!.name,
            previousLotId: item.previousLotId,
            previousLotName: item.previousLot!.lot,
            writePreviousLotName: item.writePreviousLot,
            receiptLotId: item.receiptLotId,
            receiptLotName: item.receiptLot!.lot,
            receiptInspectionId: item.receiptInspectionId,
            qcInspectionId: item.qcInspectionId,
            needCanceled: item.needCanceled,
            isDisabled: item.isDisabled,
            createdByEmployeeId: item.createdByEmployeeId,
            createdByEmployeeName: item.employee!.name,
            createdAtDateTime: item.createdAtDateTime
          }))
          .orderBy(item => item.viewId)
          .limit(this.pagination.page * 50, 50)
          .wrap()
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

  private _getSearchQueryable(db: MainDbContext): Queryable<GoodsReceipt> {
    let queryable = db.goodsReceipt
      .include(item => item.goods)
      .include(item => item.partner)
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);

    if (this.lastFilter!.fromDate || this.lastFilter!.toDate) {
      queryable = queryable
        .where(item => [
          sorm.between(item.dueDate, this.lastFilter!.fromDate, this.lastFilter!.toDate!)
        ]);
    }

    if (this.lastFilter!.lot) {
      queryable = queryable
        .include(item => item.receiptLot)
        .where(item => [
          sorm.includes(item.receiptLot!.lot, this.lastFilter!.lot)
        ]);
    }

    if (this.lastFilter!.goodName) {
      queryable = queryable
        .where(item => [
          sorm.includes(item.goods!.name, this.lastFilter!.goodName)
        ]);
    }

    if (this.lastFilter!.partnerName) {
      queryable = queryable
        .where(item => [
          sorm.includes(item.partner!.name, this.lastFilter!.partnerName)
        ]);
    }

    if (this.lastFilter!.warehouseId) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.warehouseId, this.lastFilter!.warehouseId)
        ]);
    }

    if (this.lastFilter!.specification) {
      queryable = queryable
        .include(item => item.goods)
        .where(item => [
          sorm.includes(item.goods!.specification, this.lastFilter!.specification)
        ]);
    }

    if (!!this.lastFilter!.isDisabled) {
      queryable = queryable.where(item => [
        sorm.equal(item.isDisabled, false)
      ]);
    }

    return queryable;
  }
}

interface IFilterVM {
  id?: number;
  sort?: string;
  orderBy: boolean;
  partnerName?: string;
  fromDate?: DateOnly;
  toDate?: DateOnly;
  goodName?: string;
  specification?: string;
  lot?: string;
  warehouseId?: number;
  isDisabled: boolean;
}

interface IReceiptVM {
  id: number | undefined;
  code: string | undefined;
  dueDate: DateTime | undefined;
  partnerId: number | undefined;
  partnerName: string | undefined;
  goodType: string | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  specification: string | undefined;
  thick: number | undefined;
  length: number | undefined;
  unitWeight: number | undefined;
  quantity: number | undefined;
  totalQuantity: number | undefined;
  unitName: string | undefined;
  unitPrice: number | undefined;
  totalPrice: number | undefined;
  prevTypeId: number | undefined;
  prevTypeName: string | undefined;
  writePreviousLotName: string | undefined;
  typeId: number | undefined;
  typeName: string | undefined;
  remark: string | undefined;
  warehouseId: number | undefined;
  warehouseName: string | undefined;
  previousLotId: number | undefined;
  previousLotName: string | undefined;
  receiptLotId: number | undefined;
  receiptLotName: string | undefined;
  receiptInspectionId: number | undefined;
  qcInspectionId: number | undefined;
  needCanceled: boolean | undefined;
  isDisabled: boolean;
  createdByEmployeeId: number | undefined;
  createdByEmployeeName: string | undefined;
  createdAtDateTime: DateTime | undefined;
}