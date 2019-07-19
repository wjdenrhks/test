import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnInit} from "@angular/core";
import {DateOnly, DateTime} from "@simplism/core";
import {SdDomValidatorProvider, SdModalProvider, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {StockSearchModal} from "../../modals/StockSearchModal";
import {ShippingPlanSearchModal} from "../../modals/ShippingPlanSearchModal";
import {
  CodeProc,
  GoodsIssue,
  GoodsIssueGoods,
  MainDbContext,
  QuantityCheckInspectionItem,
  StockProc
} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {Queryable} from "@simplism/orm-client";
import {AppDataProvider} from "@sample/client-common";
import {InspectionReportModal} from "../../modals/InspectionReportModal";
import {PackingBarcodeSearchModal} from "../../modals/PackingBarcodeSearchModal";
import {ShowManualModal} from "../../modals/ShowManualModal";
import {ExcelWorkbook} from "@simplism/excel";

@Component({
  selector: "app-shipping-register",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>출하 등록</h4>
          <sd-topbar-menu (click)="onAddItemButtonClick()">
            <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
            행 추가
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onSaveButtonClick()">
            <sd-icon [icon]="'save'" [fixedWidth]="true"></sd-icon>
            저장
          </sd-topbar-menu>
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
              <sd-form-item [label]="'취소제외'">
                <sd-checkbox [(value)]="filter.isCanceled"></sd-checkbox>
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
              <sd-sheet #sheet [id]="'shipping-register'"
                        [items]="items"
                        [trackBy]="trackByIdFn"
                        [(selectedItem)]="selectedItem"
                        (selectedItemChange)="onSelectedItemChange()"
                        [selectable]="true">
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
                <sd-sheet-column [header]="'출하일'" [width]="130">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.shippingDate" [type]="'date'" [required]="true"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'출하계획'" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.shippingPlanId ? "#" + item.shippingPlanId : "" }}
                      <a (click)="shippingPlanSearchModalOpenButtonClick(item)"
                         [attr.sd-invalid]="!item.shippingPlanId">
                        <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'구분'">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.type">
                      <sd-select-item [value]="undefined">미지정</sd-select-item>
                      <sd-select-item [value]="'출하'">출하</sd-select-item>
                      <sd-select-item [value]="'리와인더'">리와인더</sd-select-item>
                      <sd-select-item [value]="'외주 임가공'">외주 임가공</sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'거래처'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.partnerName }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'출하품목'">
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
                <sd-sheet-column [header]="'지시수량'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right;">
                      {{ item.orderQuantity | number }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'출하수량'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right;">
                      {{ item.shippingQuantity | number }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'성적서 출력'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-sm-sm" style="text-align: center;" *ngIf="!!item.goodId">
                      <sd-icon [icon]="'print'" [fixedWidth]="true" (click)="onInspectionReportPrint(item)"></sd-icon>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'등록자'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.createdByEmployeeName }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'등록일'" [width]="130">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.createdAtDateTime?.toFormatString("yyyy-MM-dd HH:mm") }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'취소'" [width]="60">
                  <ng-template #item let-item="item">
                    <div style="text-align: center;">
                      <sd-checkbox [(value)]="item.isCanceled" [disabled]="!item.id"
                                   (valueChange)="onCanceledChange(item)"></sd-checkbox>
                    </div>
                  </ng-template>
                </sd-sheet-column>
              </sd-sheet>

              <sd-dock [position]="'bottom'" style="height: 40%" *ngIf="selectedItem"
                       [id]="'shipping-register-item'">
                <sd-dock-container class="sd-background-default">
                  <sd-dock class="sd-padding-xs-sm">
                    <h5 style="display: inline-block; padding-right: 1.4em;">출하 항목</h5>
                    <sd-button [size]="'sm'" (click)="onAddShippingPaletteGoodButtonClick()"
                               [inline]="true" [disabled]="!!selectedItem && !!selectedItem.id">
                      <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
                      팔레트 바코드 추가
                    </sd-button>
                    &nbsp;
                    <sd-button [size]="'sm'" (click)="onAddShippingGoodButtonClick()" [inline]="true"
                               [disabled]="!!selectedItem && !!selectedItem.id">
                      <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
                      행 추가
                    </sd-button>
                    <sd-form [inline]="true" (submit)="onSearchShippingItemLotSubmit()" style="float: right;">
                      <sd-form-item [label]="'LOT'" style="padding-top: 2px; padding-bottom: 3px; padding-right: 25px;">
                        <sd-textfield [(value)]="shippingItemLot"
                                      [disabled]="!!selectedItem && !!selectedItem.id"></sd-textfield>
                      </sd-form-item>
                    </sd-form>
                  </sd-dock>

                  <sd-pane>
                    <sd-sheet [id]="'shipping-register-item'"
                              [items]="selectedItem.shippingItemList"
                              [trackBy]="trackByIdFn">
                      <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm" style="text-align: center;">
                            <span *ngIf="item.id">{{ item.id }}</span>
                            <a *ngIf="!item.id" (click)="onRemoveItemShippingGoodButtonClick(item)">
                              <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                            </a>
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
                      <sd-sheet-column [header]="'LOT'">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm">
                            {{ item.lotName }}
                            <a (click)="shippingItemSearchModalOpenButtonClick(item)">
                              <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                            </a>
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'등급'" [width]="60">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm" style="text-align: center;">
                            {{ item.rating }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'길이'" [width]="100">
                        <ng-template #item let-item="item">
                          <sd-textfield [(value)]="item.quantity" (valueChange)="onChangePrice(item)"
                                        [type]="'number'" [required]="true"></sd-textfield>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'단위'" [width]="80">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm" style="text-align: center;">
                            {{ item.unitName }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'폭'" [width]="100">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm" style="text-align: right;">
                            {{ item.specification }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'두께'" [width]="100">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm">
                            {{ item.think | number }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'단가'">
                        <ng-template #item let-item="item">
                          <sd-textfield [(value)]="item.unitPrice" (valueChange)="onChangePrice(item)"
                                        [type]="'number'"></sd-textfield>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'금액'" [width]="130">
                        <ng-template #item let-item="item">
                          <sd-textfield [(value)]="item.totalPrice" [type]="'number'" [disabled]="true"></sd-textfield>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'비고'">
                        <ng-template #item let-item="item">
                          <sd-textfield [(value)]="item.remark"></sd-textfield>
                        </ng-template>
                      </sd-sheet-column>
                      <!--  <sd-sheet-column [header]="'취소'" [width]="60">
                          <ng-template #item let-item="item">
                            <div style="text-align: center;">
                              <sd-checkbox [(value)]="item.isCanceled"
                                           [disabled]="!item.id || (!!item.id && !!selectedItem!.isCanceled)"></sd-checkbox>
                            </div>
                          </ng-template>
                        </sd-sheet-column>-->
                    </sd-sheet>
                  </sd-pane>
                </sd-dock-container>
              </sd-dock>
            </sd-dock-container>
          </sd-busy-container>
        </sd-dock-container>
      </sd-topbar-container>
    </sd-busy-container>`
})
export class ShippingRegisterPage implements OnInit {

  public filter: IFilterVM = {
    id: undefined,
    fromDate: undefined,
    toDate: undefined,
    partnerId: undefined,
    partnerName: undefined,
    goodName: undefined,
    specification: undefined,
    lot: undefined,
    isCanceled: false
  };
  public lastFilter?: IFilterVM;

  public pagination = {page: 0, length: 0};

  public items: IShippingVM[] = [];
  public orgItems: IShippingVM[] = [];

  public selectedItem?: IShippingVM;

  public shippingItemLot?: string;

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _appData: AppDataProvider,
                     private readonly _elRef: ElementRef<HTMLElement>,
                     private readonly _domValidator: SdDomValidatorProvider,
                     private readonly _modal: SdModalProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _cdr: ChangeDetectorRef) {
  }

  public async ngOnInit(): Promise<void> {
    this.mainBusyCount++;
    await this.onSearchFormSubmit();
    this.mainBusyCount--;

    this._cdr.markForCheck();
  }

  public async onShowManualButtonClick(): Promise<void> {
    const result = await this._modal.show(ShowManualModal, "출하 등록 메뉴얼", {type: "shipping-register"});
    if (!result) return;

    this._cdr.markForCheck();
  }

  public onAddItemButtonClick(): void {
    this.items.insert(0, {
      id: undefined,
      type: "출하",
      shippingDate: new DateOnly(),
      shippingPlanId: undefined,
      partnerId: undefined,
      partnerName: undefined,
      goodId: undefined,
      goodName: undefined,
      specification: undefined,
      orderQuantity: undefined,
      shippingQuantity: undefined,
      createdAtDateTime: undefined,
      createdByEmployeeId: undefined,
      createdByEmployeeName: undefined,
      isCanceled: false,

      shippingItemList: undefined
    });

    this.shippingItemLot = undefined;
    this._cdr.markForCheck();
  }

  public onRemoveItemButtonClick(item: IShippingVM): void {
    this.items.remove(item);

    if (this.selectedItem === item) {
      this.selectedItem = undefined;
    }
  }

  public onSelectedItemChange(): void {
    this.shippingItemLot = undefined;
    this._cdr.markForCheck();
  }

  public async onAddShippingGoodButtonClick(): Promise<void> {
    this.selectedItem!.shippingItemList = this.selectedItem!.shippingItemList || [];

    if (!this.selectedItem!.shippingPlanId) {
      this._toast.danger("출하계획을 먼저 선택해 주세요.");
      return;
    }
    const result = await this._modal.show(StockSearchModal, "재고 제품(LOT) 검색", {
      isMulti: true,
      goodId: this.selectedItem!.goodId,
      isShippingRegister: true
    });
    if (!result) return;

    for (const shippingGoodItem of result || []) {
      if (!this.selectedItem!.shippingItemList!.some(item => !item.id && (item.lotId === shippingGoodItem.lotId))) {
        this.selectedItem!.shippingItemList!.insert(0, {
          id: undefined,
          goodId: shippingGoodItem.goodId,
          goodName: shippingGoodItem.goodName,
          unitName: shippingGoodItem.unitName,
          think: shippingGoodItem.thick,
          length: shippingGoodItem.lengh,
          specification: shippingGoodItem.specification,
          packingLotId: shippingGoodItem.packingLotId,
          packingLotName: shippingGoodItem.packingLotName,
          lotId: shippingGoodItem.lotId,
          lotName: shippingGoodItem.lotName,
          rating: shippingGoodItem.rating,
          unitPrice: shippingGoodItem.unitPrice,
          totalPrice: (shippingGoodItem.unitPrice || 0) * (shippingGoodItem.quantity || 0),
          inspectionRating: shippingGoodItem.inspectionRating,
          warehouseId: shippingGoodItem.warehouseId,
          warehouseName: shippingGoodItem.warehouseName,
          quantity: shippingGoodItem.quantity,
          remark: undefined,
          isCanceled: false
        });
      }
      this._cdr.markForCheck();
    }
  }

  public async onAddShippingPaletteGoodButtonClick(): Promise<void> {
    this.selectedItem!.shippingItemList = this.selectedItem!.shippingItemList || [];

    if (!this.selectedItem!.shippingPlanId) {
      this._toast.danger("출하계획을 먼저 선택해 주세요.");
      return;
    }
    const result = await this._modal.show(PackingBarcodeSearchModal, "팔레트 바코드 검색", undefined);
    if (!result) return;

    if (!result.packingLotList!.some(item => item.goodId === this.selectedItem!.goodId)) {
      this._toast.danger("선택한 팔레트 바코드에 출고 품목과 일치하는 항목이 없습니다.");
      return;
    }
    for (const shippingGoodItem of result.packingLotList || []) {
      if (!this.selectedItem!.shippingItemList!.some(item => !item.id && item.lotId === shippingGoodItem.lotId)
        && (shippingGoodItem.goodId === this.selectedItem!.goodId)) {
        this.selectedItem!.shippingItemList!.insert(0, {
          id: undefined,
          goodId: shippingGoodItem.goodId,
          goodName: shippingGoodItem.goodName,
          unitName: shippingGoodItem.unitName,
          think: shippingGoodItem.thick,
          length: shippingGoodItem.length,
          specification: shippingGoodItem.specification,
          unitPrice: shippingGoodItem.unitPrice,
          totalPrice: (shippingGoodItem.quantity || 0) * (shippingGoodItem.unitPrice || 0),
          packingLotId: undefined,
          packingLotName: undefined,
          lotId: shippingGoodItem.lotId,
          lotName: shippingGoodItem.lotName,
          rating: shippingGoodItem.rating,
          inspectionRating: shippingGoodItem.inspectionRating,
          warehouseId: shippingGoodItem.warehouseId,
          warehouseName: shippingGoodItem.warehouseName,
          quantity: shippingGoodItem.quantity,
          remark: undefined,
          isCanceled: false
        });
      }
    }
    this._cdr.markForCheck();
  }

  public onRemoveItemShippingGoodButtonClick(item: IShippingItemListVM): void {
    this.selectedItem!.shippingItemList!.remove(item);
  }

  public async shippingPlanSearchModalOpenButtonClick(item: IShippingVM): Promise<void> {
    const result = await this._modal.show(ShippingPlanSearchModal, "출하계획 검색", {
      isMulti: false,
      isShippingRegister: true
    });

    if (!result) return;

    if (!this.items.some(item1 => item1.shippingPlanId === result.id)) {
      item.shippingPlanId = result.id;
      item.partnerId = result.partnerId;
      item.partnerName = result.partnerName;
      item.goodId = result.goodId;
      item.goodName = result.goodName;
      item.orderQuantity = result.planQuantity;
      item.specification = result.specification;

      this._cdr.markForCheck();
    }
    else {
      this._toast.danger("이미 추가 된 출하계획 입니다.");
      return;
    }
  }

  public async shippingItemSearchModalOpenButtonClick(item: IShippingItemListVM): Promise<void> {
    const result = await this._modal.show(StockSearchModal, "재고 제품(LOT) 검색", {
      isMulti: false,
      goodId: this.selectedItem!.goodId,
      isShippingRegister: true
    });
    if (!result) return;

    if (this.selectedItem!.shippingItemList && this.selectedItem!.shippingItemList!.filter(item1 =>
      item1.lotName === result.lotName && item1.warehouseId === result.warehouseId).length < 1) {

      item.goodId = result.goodId;
      item.goodName = result.goodName;
      item.unitName = result.unitName;
      item.think = result.thick;
      item.length = result.length;
      item.quantity = result.quantity;
      item.specification = result.specification;
      item.packingLotId = result.packingLotId;
      item.packingLotName = result.packingLotName;
      item.lotId = result.lotId;
      item.lotName = result.lotName;
      item.unitPrice = result.unitPrice;
      item.rating = result.rating;
      item.totalPrice = (result.unitPrice || 0) * (result.quantity || 0);
      item.inspectionRating = result.inspectionRating;
      item.warehouseId = result.warehouseId;
      item.warehouseName = result.warehouseName;
    }
    this._cdr.markForCheck();
  }

  public async onSearchShippingItemLotSubmit(): Promise<void> {
    this.selectedItem!.shippingItemList = this.selectedItem!.shippingItemList || [];
    if (!this.selectedItem!.shippingPlanId) {
      this._toast.danger("출하계획을 먼저 선택해 주세요.");
      return;
    }

    if (!this.shippingItemLot) {
      this._toast.danger("LOT가 입려되지 않았습니다.");
      return;
    }

    const lot = this.shippingItemLot.trim();
    // 포장바코드일 경우
    if (lot.includes("PB")) {
      const result = await this._getPackingInfo(lot!);

      if (result && result.length > 0) {
        if (!result.some(item => item.goodId === this.selectedItem!.goodId)) {
          this._toast.danger("해당 팔레트 바코드에 출고 품목과 일치하는 항목이 없습니다.");
          return;
        }
        for (const shippingGoodItem of result || []) {
          if (!this.selectedItem!.shippingItemList!.some(item => !item.id && (item.lotId === shippingGoodItem.lotId))
            && (shippingGoodItem.goodId === this.selectedItem!.goodId)) {
            this.selectedItem!.shippingItemList!.insert(0, {
              id: undefined,
              goodId: shippingGoodItem.goodId,
              goodName: shippingGoodItem.goodName,
              unitName: shippingGoodItem.unitName,
              think: shippingGoodItem.thick,
              length: shippingGoodItem.length,
              specification: shippingGoodItem.specification,
              unitPrice: shippingGoodItem.unitPrice,
              totalPrice: (shippingGoodItem.quantity || 0) * (shippingGoodItem.unitPrice || 0),
              packingLotId: undefined,
              packingLotName: undefined,
              lotId: shippingGoodItem.lotId,
              lotName: shippingGoodItem.lotName,
              rating: shippingGoodItem.rating,
              inspectionRating: shippingGoodItem.inspectionRating,
              warehouseId: shippingGoodItem.warehouseId,
              warehouseName: shippingGoodItem.warehouseName,
              quantity: shippingGoodItem.quantity,
              remark: undefined,
              isCanceled: false
            });
          }
        }
      }
      else {
        this._toast.danger(lot + " : 포장 바코드를 찾을 수 없습니다.");
        return;
      }
    }
    //일반 LOT일 경우
    else {
      const result = await this._getLotInfo(lot!);
      if (result && result.length > 0) {
        for (const shippingGoodItem of result || []) {
          if (shippingGoodItem.goodId === this.selectedItem!.goodId) {
            if (!this.selectedItem!.shippingItemList!.some(item => !item.id && (item.lotId === shippingGoodItem.lotId))) {
              this.selectedItem!.shippingItemList!.insert(0, {
                id: undefined,
                goodId: shippingGoodItem.goodId,
                goodName: shippingGoodItem.goodName,
                unitName: shippingGoodItem.unitName,
                think: shippingGoodItem.thick,
                length: shippingGoodItem.lengh,
                specification: shippingGoodItem.specification,
                packingLotId: shippingGoodItem.packingLotId,
                packingLotName: shippingGoodItem.packingLotName,
                lotId: shippingGoodItem.lotId,
                lotName: shippingGoodItem.lotName,
                rating: shippingGoodItem.rating,
                unitPrice: shippingGoodItem.unitPrice,
                totalPrice: (shippingGoodItem.unitPrice || 0) * (shippingGoodItem.quantity || 0),
                inspectionRating: shippingGoodItem.inspectionRating,
                warehouseId: shippingGoodItem.warehouseId,
                warehouseName: shippingGoodItem.warehouseName,
                quantity: shippingGoodItem.quantity,
                remark: undefined,
                isCanceled: false
              });
            }
          }
          else {
            this._toast.danger("출하계획 품목(" + shippingGoodItem!.goodName + ")과 \n검색 LOT 품목(" + this.selectedItem!.goodName + ")이 일치하지 않습니다.");
            return;
          }
          this._cdr.markForCheck();
        }
      }
      else {
        this._toast.danger("LOT : " + lot + " 재고를 찾을 수 없습니다.\n확인 후 다시 진행해 주세요.");
        return;
      }
    }
    this._cdr.markForCheck();
  }

  private async _getPackingInfo(paletteBarcode: string): Promise<any[] | undefined> {
    let result: any[] = [];

    await this._orm.connectAsync(MainDbContext, async db => {
      result = await db.packingItem
        .include(item => item.packing)
        .where(item => [
          sorm.equal(item.packing!.paletteBarcode, paletteBarcode)
        ])
        .orderBy(item => item.id)
        .include(item => item.goods)
        .include(item => item.lot)
        .include(item => item.stock)
        .include(item => item.stock!.warehouse)
        .join(
          QuantityCheckInspectionItem,
          "inspectionInfo",
          (qb, en) => qb
            .where(item => [
              sorm.equal(item.lotId, en.stock!.lotId)
            ])
            .select(item => ({
              rating: item.rating
            })),
          true
        )
        .select(item => ({
          id: item.id,
          seq: item.seq,
          stockId: item.stockId,
          quantity: sorm.ifNull(item.stock!.quantity, 0),
          rating: item.stock!.rating,
          inspectionRating: item.inspectionInfo!.rating,
          warehouseId: item.stock!.warehouseId,
          warehouseName: item.stock!.warehouse!.name,
          warehouseRating: item.stock!.warehouse!.rating,
          goodId: item.goodId,
          goodName: item.goods!.name,
          specification: item.goods!.specification,
          unitPrice: item.goods!.unitPrice,
          thick: item.lot!.thick,
          length: item.lot!.length,
          width: item.lot!.width,
          weight: item.lot!.weight,
          unitName: item.goods!.unitName,
          lotId: item.lotId,
          lotName: item.lot!.lot,
          isDisabled: item.isDisabled
        }))
        .resultAsync();
    });
    return result;
  }

  private async _getLotInfo(lot: string): Promise<any[] | undefined> {
    let result: any[] = [];
    await this._orm.connectAsync(MainDbContext, async db => {
      result = await db.stock
        .include(item => item.lot)
        .where(item => [
          sorm.equal(item.lot!.isNotStock, false),
          sorm.equal(item.lot!.lot, lot)
        ])
        .include(item => item.productionItem)
        .include(item => item.paletteBarcode)
        .include(item => item.goods)
        .include(item => item.warehouse)
        .join(
          QuantityCheckInspectionItem,
          "inspectionInfo",
          (qb, en) => qb
            .where(item => [
              sorm.equal(item.lotId, en.lotId)
            ])
            .select(item => ({
              rating: item.rating
            })),
          true
        )
        .select(item => ({
          id: item.id,
          packingLotId: item.paletteBarcodeId,
          packingLot: item.paletteBarcode!.paletteBarcode,
          productionItemId: item.productionItem!.id,
          lotId: item.lotId,
          lotName: item.lot!.lot,
          goodId: item.goodsId,
          goodName: item.goods!.name,
          goodCategory: item.goods!.category,
          goodThick: item.goods!.thick,
          goodLength: item.goods!.length,
          specification: item.goods!.specification,
          thick: sorm.ifNull(item.lot!.thick, 0),
          length: sorm.ifNull(item.lot!.length, 0),
          weight: sorm.ifNull(item.lot!.weight, 0),
          unitName: item.goods!.unitName,
          unitPrice: item.goods!.unitPrice,
          quantity: item.quantity,
          rating: item.rating,
          inspectionRating: item.inspectionInfo!.rating,
          warehouseId: item.warehouseId,
          warehouseName: item.warehouse!.name,
          warehouseRating: item.warehouse!.rating
        }))
        .resultAsync();
    });
    return result;
  }

  public async onInspectionReportPrint(item: IShippingVM): Promise<void> {

    if (!item.shippingPlanId) {
      this._toast.danger("출하계획을 선택해 주세요");
      return;
    }

    if (!item.shippingItemList || item.shippingItemList.length < 1) {
      this._toast.danger("출고항목을 추가해 주세요");
      return;
    }

    const result = await this._modal.show(InspectionReportModal, "검사성적서", {shippingItems: item});
    if (!result) return;

    this._cdr.markForCheck();
  }

  public async onCanceledChange(item: IShippingVM): Promise<void> {

    if (item.isCanceled) {
      for (const shippingItem of item.shippingItemList || []) {
        shippingItem.isCanceled = true;
      }
    }
    else {
      for (const shippingItem of item.shippingItemList || []) {
        shippingItem.isCanceled = !shippingItem.isCanceled;
      }
    }

    this._cdr.markForCheck();
  }

  public onChangePrice(item: IShippingItemListVM): void {
    item.totalPrice = (item.quantity || 0) * (item.unitPrice || 0);

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
        items = await queryable
          .include(item => item.partner)
          .include(item => item.employee)
          .include(item => item.lastEmployee)
          .include(item => item.goods)
          /*  .include(item => item.goodsIssueGoods)
            .include(item => item.goodsIssueGoods![0].lot)
            .include(item => item.goodsIssueGoods![0].packingLot)
            .include(item => item.goodsIssueGoods![0].goods)
            .include(item => item.goodsIssueGoods![0].warehouse)*/
          .join(
            GoodsIssueGoods,
            "goodsIssueGoodsInfo",
            (qb, en) => qb
              .where(item => [
                sorm.equal(item.goodsIssueId, en.id),
                sorm.equal(item.isDisabled, false)
              ])
              .select(item => ({
                quantity: sorm.sum(sorm.ifNull(item.quantity, 0))
              })),
            true
          )
          /*.join(
            QuantityCheckInspectionItem,
            "inspectionInfo",
            (qb, en) => qb
              .where(item => [
                sorm.equal(item.lotId, en.goodsIssueGoods![0].lotId),
                sorm.equal(item.isDisabled, false)
              ])
              .select(item => ({
                id: item.id,
                rating: item.rating
              })),
            true
          )*/
          .select(item => ({
            id: item.id,
            type: item.issueType,
            shippingDate: sorm.cast(item.issueDate, DateOnly),
            shippingPlanId: item.issuePlanId,
            partnerId: item.partnerId,
            partnerName: item.partner!.name,
            goodId: item.goodId,
            goodName: item.goods!.name,
            specification: item.goods!.specification,
            orderQuantity: item.orderQuantity,
            shippingQuantity: sorm.ifNull(item.goodsIssueGoodsInfo!.quantity, 0),
            createdAtDateTime: item.createdAtDateTime,
            createdByEmployeeId: item.createdByEmployeeId,
            createdByEmployeeName: item.employee!.name,
            isCanceled: item.isDisabled

            /* shippingItemList: item.goodsIssueGoods && item.goodsIssueGoods.map(item1 => ({
               id: item1.id,
               goodId: item1.goodsId,
               goodName: item1.goods!.name,
               specification: item1.goods!.specification,
               unitName: item1.goods!.unitName,
               think: item1.lot!.thick,
               length: item1.lot!.length,
               packingLotId: item1.packingLotId,
               packingLotName: item1.packingLot!.paletteBarcode,
               lotId: item1.lotId,
               lotName: item1.lot!.lot,
               rating: item1.lot!.goodsRating,
               unitPrice: item1.unitPrice,
               totalPrice: item1.totalPrice,
               inspectionRating: item.inspectionInfo!.rating,
               warehouseId: item1.warehouseId,
               warehouseName: item1.warehouse!.name,
               quantity: item1.quantity,
               remark: item1.remark,
               isCanceled: item1.isDisabled
             })) || undefined*/
          }))
          .orderBy(item => item.shippingDate, false)
          .orderBy(item => item.isCanceled, false)
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
      const ws = wb.createWorksheet(`출하`);
      ws.cell(0, 0).value = "출하일";
      ws.cell(0, 1).value = "구분";
      ws.cell(0, 2).value = "거래처";
      ws.cell(0, 3).value = "출하품목";
      ws.cell(0, 4).value = "규격";
      ws.cell(0, 5).value = "지시수량";
      ws.cell(0, 6).value = "출하수량";
      ws.cell(0, 7).value = "등록일";
      ws.cell(0, 8).value = "등록자";
      ws.cell(0, 9).value = "취소";
      /* ws.cell(0, 6).value = "LOT";
       ws.cell(0, 7).value = "등급";
       ws.cell(0, 8).value = "길이";
       ws.cell(0, 9).value = "단위";
       ws.cell(0, 10).value = "폭";
       ws.cell(0, 11).value = "두께";
       ws.cell(0, 12).value = "단가";
       ws.cell(0, 13).value = "금액";
       ws.cell(0, 14).value = "비고";
       ws.cell(0, 15).value = "등록일";
       ws.cell(0, 16).value = "등록자";*/

      for (let i = 0; i <= 9; i++) {
        Object.assign(ws.cell(0, i).style, headerStyle);
      }

      for (let i = 0; i < items.length; i++) {
        const shippingItem = items[i];
        ws.cell(i + 1, 0).value = shippingItem.shippingDate;
        ws.cell(i + 1, 1).value = shippingItem.type;
        ws.cell(i + 1, 2).value = shippingItem.partnerName;
        ws.cell(i + 1, 3).value = shippingItem.goodName;
        ws.cell(i + 1, 4).value = shippingItem.specification;
        ws.cell(i + 1, 5).value = shippingItem.orderQuantity;
        ws.cell(i + 1, 6).value = shippingItem.shippingQuantity;
        ws.cell(i + 1, 7).value = shippingItem.createdByEmployeeName;
        ws.cell(i + 1, 8).value = shippingItem.createdAtDateTime;
        ws.cell(i + 1, 9).value = shippingItem.isCanceled ? "o" : "";
      }
      const title = "출하등록 정보.xlsx";

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

    if (diffTargets.some(item => !item.shippingPlanId)) {
      this._toast.danger("출고계획이 선택되지 않은 행이 있습니다.");
      return;
    }

    if (diffTargets.some(item => !item.shippingItemList || item.shippingItemList.length < 1)) {
      this._toast.danger("출고항목을 선택해 주세요.");
      return;
    }

    for (const diffTargetItem of diffTargets) {

      if (!diffTargetItem.goodId) {
        this._toast.danger("출고제품을 선택해 주세요.");
        return;
      }

      if (diffTargetItem.shippingItemList && (!diffTargetItem.id && diffTargetItem.shippingItemList.some(item => !item.inspectionRating))) {
        if (!confirm("QC검사가 이루어지지 않은 항목이 있습니다.\n출고를 진행하시겠습니까?")) return;
      }

      if (diffTargetItem.shippingItemList && (!diffTargetItem.id && diffTargetItem.shippingItemList.some(item => item.rating !== "A"))) {
        if (!confirm("A등급이 아닌 항목이 있습니다.\n출고를 진행하시겠습니까?")) return;
      }
      /* for (const diff of diffTargetItem.shippingItemList || []) {
         if (!diffTargetItem.id && !diff.inspectionRating) {
           if (!confirm("QC검사가 이루어지지 않은 항목이 있습니다.\n출고를 진행하시겠습니까?")) return;
         }
         if (!diffTargetItem.id && diff.rating !== "A") {
           if (!confirm("A등급이 아닌 항목이 있습니다.\n출고를 진행하시겠습니까?")) return;
         }
       }*/

    }

    this.viewBusyCount++;

    try {
      this._domValidator.validate(this._elRef!.nativeElement);

      Object.validatesArray(
        diffTargets,
        `출하등록`,
        {
          id: {displayName: "ID", type: Number},
          shippingDate: {displayName: "출하일", notnull: true},
          shippingPlanId: {displayName: "출하계획", notnull: true}
        }
      );

      for (const diffItem of diffTargets || []) {
        if (diffItem.shippingItemList) {
          Object.validatesArray(
            diffItem.shippingItemList,
            `출하등록`,
            {
              id: {displayName: "ID", type: Number},
              quantity: {displayName: "수량", type: Number, notnull: true}
            }
          );
        }
      }

      await this._orm.connectAsync(MainDbContext, async db => {
        for (const diff of diffs) {
          // INSERT
          if (!diff.target!.id) {
            const documentCode = await CodeProc.getDocumentCode(db, this._appData.authInfo!.companyId, this._appData.authInfo!.employeeId, diff.target!.goodId!, undefined, "출고", undefined, undefined);

            const newShipping = await db.goodsIssue
              .insertAsync({
                companyId: this._appData.authInfo!.companyId,
                issueType: diff.target!.type,
                issueDate: diff.target!.shippingDate!,
                issuePlanId: diff.target!.shippingPlanId!,
                code: documentCode,
                codeSeq: Number(documentCode.substr(-5, 5)),
                partnerId: diff.target!.partnerId!,
                goodId: diff.target!.goodId!,
                orderQuantity: diff.target!.orderQuantity!,
                issueQuantity: diff.target!.shippingItemList!.sum(item => item.quantity)!,
                createdByEmployeeId: this._appData.authInfo!.employeeId,
                createdAtDateTime: new DateTime(),
                isDisabled: diff.target!.isCanceled
              });
            diff.target!.id = newShipping.id;
            diff.target!.createdByEmployeeName = this._appData.authInfo!.employeeName;
            diff.target!.createdAtDateTime = new DateTime();

            for (const shippingItem of diff.target!.shippingItemList || []) {
              const newGoodsIssuePlanItem = await db.goodsIssueGoods
                .insertAsync({
                  companyId: this._appData.authInfo!.companyId,
                  goodsIssueId: diff.target!.id!,
                  goodsId: diff.target!.goodId!,
                  packingLotId: shippingItem.packingLotId,
                  lotId: shippingItem.lotId,
                  warehouseId: shippingItem.warehouseId,
                  unitPrice: shippingItem.unitPrice!,
                  totalPrice: shippingItem.totalPrice!,
                  quantity: shippingItem.quantity!,
                  remark: shippingItem.remark,
                  createdAtDateTime: new DateTime(),
                  createdByEmployeeId: this._appData.authInfo!.employeeId,
                  isDisabled: shippingItem.isCanceled
                });
              shippingItem.id = newGoodsIssuePlanItem.id;

              await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, shippingItem.quantity!, shippingItem.lotId!, shippingItem.warehouseId, "-", shippingItem.rating!);
            }

            const totalShippingGoodsQuantity = diff.target!.shippingItemList!.sum(item => item.quantity)!;
            await db.goodsIssuePlan
              .where(item => [
                sorm.equal(item.id, diff.target!.shippingPlanId)
              ])
              .updateAsync(
                () => ({
                  realIssueQuantity: totalShippingGoodsQuantity,
                  isClosed: true
                })
              );

            //출고지시와 비고하여 가용재고 처리
            await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, (diff.target!.orderQuantity! - totalShippingGoodsQuantity), "+");
          }
          // UPDATE
          else {
            if (diff.target!.isCanceled) {
              await db.goodsIssuePlan
                .where(item => [
                  sorm.equal(item.id, diff.target!.shippingPlanId)
                ])
                .updateAsync(
                  () => ({
                    realIssueQuantity: 0,
                    isClosed: false
                  })
                );
            }

            await db.goodsIssue
              .where(item => [
                sorm.equal(item.id, diff.target!.id)
              ])
              .updateAsync(
                () => ({
                  issueDate: diff.target!.shippingDate,
                  issueType: diff.target!.type,
                  lastModifiedAtDateTime: new DateTime(),
                  lastModifiedEmployeeId: this._appData!.authInfo!.employeeId,
                  isDisabled: diff.target!.isCanceled
                })
              );

            const isShippingItemChanged = (diff.source!.shippingItemList || []).diffs(diff.target!.shippingItemList || [], {keyProps: ["id"]});

            for (const shippingItem of isShippingItemChanged || []) {
              if (!shippingItem.target!.id) {
                const newGoodsIssueItem = await db.goodsIssueGoods
                  .insertAsync({
                    companyId: this._appData.authInfo!.companyId,
                    goodsIssueId: diff.target!.id!,
                    goodsId: diff.target!.goodId!,
                    packingLotId: shippingItem.target!.packingLotId,
                    lotId: shippingItem.target!.lotId,
                    warehouseId: shippingItem.target!.warehouseId,
                    quantity: shippingItem.target!.quantity!,
                    unitPrice: shippingItem.target!.unitPrice!,
                    totalPrice: shippingItem.target!.totalPrice!,
                    remark: shippingItem.target!.remark,
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: this._appData.authInfo!.employeeId,
                    isDisabled: shippingItem.target!.isCanceled
                  });
                shippingItem.target!.id = newGoodsIssueItem.id;
              }
              else {
                await db.goodsIssueGoods
                  .where(item => [
                    sorm.equal(item.id, shippingItem.target!.id)
                  ])
                  .updateAsync(
                    () => ({
                      quantity: shippingItem.target!.quantity,
                      remark: shippingItem.target!.remark,
                      unitPrice: shippingItem.target!.unitPrice!,
                      totalPrice: shippingItem.target!.totalPrice!,
                      isDisabled: shippingItem.target!.isCanceled
                    })
                  );
              }

              const targetDisable = shippingItem.target!.isCanceled;
              const sourceDisable = shippingItem.source!.isCanceled;

              //취소 x => 취소 x
              if (!sourceDisable && !targetDisable) {
                await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, shippingItem.source!.quantity, shippingItem.target!.lotId, shippingItem.target!.warehouseId, "+", shippingItem.target!.rating);
                await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, shippingItem.target!.quantity, shippingItem.target!.lotId, shippingItem.target!.warehouseId, "-", shippingItem.target!.rating);
              }
              //취소 x => 취소 o
              else if (!sourceDisable && targetDisable) {
                await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, shippingItem.source!.quantity, shippingItem.target!.lotId, shippingItem.target!.warehouseId, "+", shippingItem.target!.rating);
              }
              //취소 o => 취소 x
              else if (sourceDisable && !targetDisable) {
                await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, shippingItem.source!.quantity, shippingItem.target!.lotId, shippingItem.target!.warehouseId, "-", shippingItem.target!.rating);
              }
            }

            const sourceTotalShippingGoodsQuantity = diff.source!.shippingItemList!.filter(item => !item.isCanceled).sum(item => item.quantity) || 0;
            const targetTotalShippingGoodsQuantity = diff.target!.shippingItemList!.filter(item => !item.isCanceled).sum(item => item.quantity) || 0;

            await db.goodsIssuePlan
              .where(item => [
                sorm.equal(item.id, diff.target!.shippingPlanId)
              ])
              .updateAsync(
                () => ({
                  realIssueQuantity: targetTotalShippingGoodsQuantity
                })
              );

            await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, sourceTotalShippingGoodsQuantity, "+");
            await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, targetTotalShippingGoodsQuantity, "-");
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

        this.items = await queryable
          .orderBy(item => item.id)
          .limit(this.pagination.page * 50, 50)
          .wrap(GoodsIssue)
          .include(item => item.partner)
          .include(item => item.employee)
          .include(item => item.lastEmployee)
          .include(item => item.goods)
          .include(item => item.goodsIssueGoods)
          .include(item => item.goodsIssueGoods![0].lot)
          .include(item => item.goodsIssueGoods![0].packingLot)
          .include(item => item.goodsIssueGoods![0].goods)
          .include(item => item.goodsIssueGoods![0].warehouse)
          .join(
            GoodsIssueGoods,
            "goodsIssueGoodsInfo",
            (qb, en) => qb
              .where(item => [
                sorm.equal(item.goodsIssueId, en.id),
                sorm.equal(item.isDisabled, false)
              ])
              .select(item => ({
                quantity: sorm.sum(sorm.ifNull(item.quantity, 0))
              })),
            true
          )
          .join(
            QuantityCheckInspectionItem,
            "inspectionInfo",
            (qb, en) => qb
              .where(item => [
                sorm.equal(item.lotId, en.goodsIssueGoods![0].lotId),
                sorm.equal(item.isDisabled, false)
              ])
              .select(item => ({
                id: item.id,
                rating: item.rating
              })),
            true
          )
          .select(item => ({
            id: item.id,
            type: item.issueType,
            shippingDate: sorm.cast(item.issueDate, DateOnly),
            shippingPlanId: item.issuePlanId,
            partnerId: item.partnerId,
            partnerName: item.partner!.name,
            goodId: item.goodId,
            goodName: item.goods!.name,
            specification: item.goods!.specification,
            orderQuantity: item.orderQuantity,
            shippingQuantity: sorm.ifNull(item.goodsIssueGoodsInfo!.quantity, 0),
            createdAtDateTime: item.createdAtDateTime,
            createdByEmployeeId: item.createdByEmployeeId,
            createdByEmployeeName: item.employee!.name,
            isCanceled: item.isDisabled,

            shippingItemList: item.goodsIssueGoods && item.goodsIssueGoods.map(item1 => ({
              id: item1.id,
              goodId: item1.goodsId,
              goodName: item1.goods!.name,
              specification: item1.goods!.specification,
              unitName: item1.goods!.unitName,
              think: item1.lot!.thick,
              length: item1.lot!.length,
              packingLotId: item1.packingLotId,
              packingLotName: item1.packingLot!.paletteBarcode,
              lotId: item1.lotId,
              lotName: item1.lot!.lot,
              rating: item1.lot!.goodsRating,
              unitPrice: item1.unitPrice,
              totalPrice: item1.totalPrice,
              inspectionRating: item.inspectionInfo!.rating,
              warehouseId: item1.warehouseId,
              warehouseName: item1.warehouse!.name,
              quantity: item1.quantity,
              remark: item1.remark,
              isCanceled: item1.isDisabled
            })) || undefined
          }))
          .resultAsync();

        this.orgItems = Object.clone(this.items);
        this.selectedItem = undefined;

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

  private _getSearchQueryable(db: MainDbContext): Queryable<GoodsIssue> {
    let queryable = db.goodsIssue
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);

    if (this.lastFilter!.fromDate || this.lastFilter!.toDate) {
      queryable = queryable
        .where(item => [
          sorm.between(item.issueDate, this.lastFilter!.fromDate, this.lastFilter!.toDate!)
        ]);
    }

    if (this.lastFilter!.partnerId) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.partnerId, this.lastFilter!.partnerId)
        ]);
    }

    if (this.lastFilter!.partnerName) {
      queryable = queryable
        .include(item => item.partner)
        .where(item => [
          sorm.includes(item.partner!.name, this.lastFilter!.partnerName)
        ]);
    }

    if (this.lastFilter!.lot) {
      queryable = queryable
        .include(item => item.goodsIssueGoods)
        .include(item => item.goodsIssueGoods![0].lot)
        .where(item => [
          sorm.includes(item.goodsIssueGoods![0].lot!.lot, this.lastFilter!.lot)
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

    if (!!this.lastFilter!.isCanceled) {
      queryable = queryable.where(item => [
        sorm.equal(item.isDisabled, false)
      ]);
    }

    return queryable;
  }
}

interface IFilterVM {
  id?: number;
  fromDate?: DateOnly;
  toDate?: DateOnly;
  partnerId?: number;
  partnerName?: string;
  goodName?: string;
  specification?: string;
  lot?: string;
  isCanceled: boolean;
}

export interface IShippingVM {
  id: number | undefined;
  type: "출하" | "리와인더" | "외주 임가공" | undefined;
  shippingDate: DateOnly | undefined;
  shippingPlanId: number | undefined;
  partnerId: number | undefined;
  partnerName: string | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  specification: string | undefined;
  orderQuantity: number | undefined;
  shippingQuantity: number | undefined;
  createdAtDateTime: DateTime | undefined;
  createdByEmployeeId: number | undefined;
  createdByEmployeeName: string | undefined;
  isCanceled: boolean;

  shippingItemList: IShippingItemListVM[] | undefined;
}

export interface IShippingItemListVM {
  id: number | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  specification: string | undefined;
  unitName: string | undefined;
  think: number | undefined;
  length: number | undefined;
  packingLotId: number | undefined;
  packingLotName: string | undefined;
  lotId: number | undefined;
  lotName: string | undefined;
  unitPrice: number | undefined;
  totalPrice: number | undefined;
  rating: "A" | "B" | "C" | "공통" | undefined;
  inspectionRating: "A" | "B" | "C" | "공통" | undefined;
  warehouseId: number | undefined;
  warehouseName: string | undefined;
  quantity: number | undefined;
  remark: string | undefined;
  isCanceled: boolean;
}