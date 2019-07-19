import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit
} from "@angular/core";
import {DateOnly, DateTime} from "@simplism/core";
import {
  SdDomValidatorProvider, SdLocalStorageProvider,
  SdModalProvider,
  SdOrmProvider,
  SdPrintProvider, SdSocketProvider,
  SdToastProvider
} from "@simplism/angular";
import {AppDataProvider, WeightChangedEvent} from "@sample/client-common";
import {ProductionSearchModal} from "../../modals/ProductionSearchModal";
import {MainDbContext, ProductionWeight} from "@sample/main-database";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
import {IBarcodePrintVM, MediumBarcodePrintTemplate} from "../../print-templates/MediumBarcodePrintTemplate";
import {ShowManualModal} from "../../modals/ShowManualModal";

@Component({
  selector: "app-weight-measurement",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>중량 측정</h4>
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
        </sd-topbar>

        <sd-dock-container>
          <sd-dock class="sd-padding-sm-default sd-background-grey-lightest">
            <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
              <sd-form-item [label]="'생산일'">
                <sd-textfield [(value)]="filter.fromDate" [type]="'date'"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'~'">
                <sd-textfield [(value)]="filter.toDate" [type]="'date'"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'생산지시'">
                <sd-textfield [(value)]="filter.productionOrderCode"></sd-textfield>
              </sd-form-item>
              <!--  <sd-form-item [label]="'설비'">
                  <sd-select [(value)]="filter.equipmentId">
                    <sd-select-item [value]="undefined">전체</sd-select-item>
                    <sd-select-item *ngFor="let equipment of equipmentList; trackBy: trackByMeFn"
                                    [value]="equipment.id"
                                    [hidden]="equipment.isDisabled">
                      {{ equipment.name }}
                    </sd-select-item>
                  </sd-select>
                </sd-form-item>-->
              <br>
              <sd-form-item [label]="'LOT'">
                <sd-textfield [(value)]="filter.lotName"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'품목명'">
                <app-good-name-select [(value)]="filter.goodName"></app-good-name-select>
              </sd-form-item>
              <sd-form-item [label]="'규격'">
                <app-goods-specification-select [(value)]="filter.specification"
                                                [goodName]="filter.goodName"></app-goods-specification-select>
              </sd-form-item>
              <sd-form-item>
                <sd-button [type]="'submit'" [theme]="'primary'">
                  <sd-icon [icon]="'search'" [fixedWidth]="true"></sd-icon>
                  조회
                </sd-button>
              </sd-form-item>
            </sd-form>
            <sd-form [inline]="true" (submit)="onSearchLotSubmit()" style="float: right;">
              <sd-form-item [label]="'LOT'" style="padding-top: 35px; padding-right: 15px;">
                <sd-textfield [(value)]="filter.detailLotName"></sd-textfield>
              </sd-form-item>
            </sd-form>
          </sd-dock>

          <sd-dock class="sd-padding-sm-default">
            <sd-pagination [page]="pagination.page" [length]="pagination.length"
                           (pageChange)="onPageClick($event)"></sd-pagination>
          </sd-dock>

          <sd-busy-container [busy]="mainBusyCount > 0">
            <sd-dock-container>
              <sd-sheet #sheet [id]="'weight-measurement'"
                        [items]="items"
                        [trackBy]="trackByIdFn"
                        [(selectedItem)]="selectedItem"
                        (selectedItemChange)="onChangeSelected(selectedItem)"
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
                <sd-sheet-column [header]="'생산지시 ID'" [width]="80">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.productionOrderId }}
                      <a (click)="productionSearchModalOpenButtonClick(item)"
                         [attr.sd-invalid]="!item.productionOrderId">
                        <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'Order No'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.productionOrderCode }}
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
                <sd-sheet-column [header]="'제품'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.goodName }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'규격'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right;">
                      {{ item.goodSpecification }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'길이'" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right;">
                      {{ item.length | number }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'단위'" [width]="80">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.unitName }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'등급'" [width]="70">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.rating" (valueChange)="onRatingChange(item)" [disabled]="true">
                      <sd-select-item [value]="'A'">A</sd-select-item>
                      <sd-select-item [value]="'B'">B</sd-select-item>
                      <sd-select-item [value]="'C'">C</sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'불량구분'">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.defectType" (valueChange)="onRatingChange(item)"
                               [disabled]=true>
                      <sd-select-item [value]="defect" *ngFor="let defect of defectTypeList; trackBy: trackByMeFn">
                        {{ defect }}
                      </sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'중량'" [width]="80">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right;">
                      {{ item.weight | number }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'측정중량'" [width]="100">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.realWeight" (valueChange)="onRatingChange(item)"
                                  [type]="'number'" [required]="true"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'측정일'" [width]="130">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.dueDate" [type]="'date'"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'작업자'" [width]="90">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.createdByEmployeeName }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'등록일'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.createdAtDateTime?.toFormatString("yyyy-MM-dd HH:mm") }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'바코드출력'" [width]="110">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-sm-sm" style="text-align: center;">
                      <sd-icon [icon]="'print'" [fixedWidth]="true" *ngIf="!!item.id"
                               (click)="onBarcodePrintButtonClick(item)"></sd-icon>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'취소'" [width]="70">
                  <ng-template #item let-item="item">
                    <div style="text-align: center;">
                      <sd-checkbox [(value)]="item.isCanceled" [disabled]="!item.id"></sd-checkbox>
                    </div>
                  </ng-template>
                </sd-sheet-column>
              </sd-sheet>

              <sd-dock [position]="'bottom'" style="height: 40%" *ngIf="selectedItem"
                       [id]="'weight-measurement-detail'">
                <sd-dock-container class="sd-background-default">
                  <sd-dock class="sd-padding-xs-sm">
                    <h3 style="display: inline-block; padding-right: 1.4em;">중량 측정</h3>

                  </sd-dock>

                  <sd-pane>
                    <div style="margin-left: 5%; margin-top: 2%; zoom: 150%">
                      <sd-form [inline]="true" (submit)="onBottomBarcodePrintButtonClick(this.selectedItem)">
                        <sd-form-item [label]="'LOT'">
                          <sd-textfield [(value)]="selectedItem.detail.lot" [disabled]="true"></sd-textfield>
                        </sd-form-item>
                        <sd-form-item [label]="'길이'">
                          <sd-textfield [(value)]="selectedItem.detail.length" [type]="'number'"
                                        [disabled]="true"></sd-textfield>
                        </sd-form-item>
                        <br>
                        <sd-form-item [label]="'중량계'">
                          <sd-select [(value)]="selectedItem.detail.weightId">
                            <sd-select-item [value]="undefined">미지정</sd-select-item>
                            <sd-select-item [value]="1">1</sd-select-item>
                            <sd-select-item [value]="2">2</sd-select-item>
                            <sd-select-item [value]="3">3</sd-select-item>
                          </sd-select>
                        </sd-form-item>
                        <sd-form-item [label]="'중량'">
                          <sd-textfield [(value)]="selectedItem.detail.weight" [type]="'number'"
                                        (valueChange)="onRatingItemChange(selectedItem)"></sd-textfield>
                        </sd-form-item>
                        <sd-form-item [label]="'등급'">
                          <sd-select [(value)]="selectedItem.detail.rating" [disabled]="true"
                                     (valueChange)="onRatingItemChange(selectedItem)">
                            <sd-select-item [value]="'A'">A</sd-select-item>
                            <sd-select-item [value]="'B'">B</sd-select-item>
                            <sd-select-item [value]="'C'">C</sd-select-item>
                          </sd-select>
                        </sd-form-item>
                        <sd-form-item [label]="'불량구분'">
                          <sd-select [(value)]="selectedItem.detail.defectType"
                                     (valueChange)="onRatingItemChange(selectedItem)"
                                     [disabled]="true">
                            <sd-select-item [value]="defect"
                                            *ngFor="let defect of defectTypeList; trackBy: trackByMeFn">
                              {{ defect }}
                            </sd-select-item>
                          </sd-select>
                        </sd-form-item>
                        <sd-form-item>
                          <sd-button [type]="'submit'" [theme]="'primary'">
                            <sd-icon [icon]="'print'"></sd-icon>
                            바코드 출력
                          </sd-button>
                        </sd-form-item>
                      </sd-form>
                    </div>
                  </sd-pane>
                </sd-dock-container>
              </sd-dock>

            </sd-dock-container>
          </sd-busy-container>

        </sd-dock-container>
      </sd-topbar-container>
    </sd-busy-container>`
})
export class WeightMeasurementPage implements OnInit, OnDestroy {

  public filter: IFilterVM = {
    productionOrderCode: undefined,
    fromDate: undefined,
    toDate: undefined,
    goodName: undefined,
    lotName: undefined,
    specification: undefined,
    isCanceled: false
  };

  public lastFilter?: IFilterVM;

  public pagination = {page: 0, length: 0};

  public items: IWeightMeasurementVM[] = [];
  public orgItems: IWeightMeasurementVM[] = [];

  public selectedItem?: IWeightMeasurementVM;

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public equipmentList: {
    id: number;
    name: string;
    isDisabled: boolean;
  }[] = [];

  public defectTypeList: string[] = [];

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  private _weightChangedEventListenerId?: number;

  public constructor(private readonly _modal: SdModalProvider,
                     private readonly _localStorage: SdLocalStorageProvider,
                     private readonly _orm: SdOrmProvider,
                     private readonly _print: SdPrintProvider,
                     private readonly _elRef: ElementRef<HTMLElement>,
                     private readonly _domValidator: SdDomValidatorProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _appData: AppDataProvider,
                     private readonly _cdr: ChangeDetectorRef,
                     private readonly _socket: SdSocketProvider) {
  }

  public async ngOnInit(): Promise<void> {
    this.defectTypeList = [
      "주름",
      "펑크",
      "알갱이",
      "접힘",
      "젤",
      "칼빠짐",
      "미터부족",
      "기포",
      "두께편차",
      "PE뜯김",
      "라인줄",
      "수축",
      "접착",
      "중량",
      "코로나"
    ].filterExists();

    this._weightChangedEventListenerId = await this._socket.addEventListenerAsync(WeightChangedEvent, undefined, async data => {
      for (const key of Object.keys(data)) {
        const weight = Number(data[key]);
        const weightId = Number(key.slice(1, 4));
        this.applyWeightInfo(weightId, weight);
      }
      this._cdr.markForCheck();
    });
  }

  public async ngOnDestroy(): Promise<void> {
    if (this._weightChangedEventListenerId) {
      await this._socket.removeEventListenerAsync(this._weightChangedEventListenerId);
    }
  }

  public async onShowManualButtonClick(): Promise<void> {
    const result = await this._modal.show(ShowManualModal, "중량측정 메뉴얼", {type: "weight-measurement"});
    if (!result) return;

    this._cdr.markForCheck();
  }

  public async onAddItemButtonClick(): Promise<void> {
    const result = await this._modal.show(ProductionSearchModal, "생산항목 검색", {isMulti: true, isWeightMeasurement: true});
    if (!result) return;

    if (result) {
      for (const productionItem of result || []) {
        if (this.items!.filter(item => item.productionItemId === productionItem.id).length < 1) {
          this.items.insert(0, {
            id: undefined,
            weightId: this._localStorage.get("lastWeightId") ? this._localStorage.get("lastWeightId").weightId : undefined,
            productionOrderId: productionItem.productionOrderId,
            productionOrderCode: productionItem.productionOrderCode,
            productionItemId: productionItem.id,
            goodId: productionItem.goodId,
            goodName: productionItem.goodName,
            goodSpecification: productionItem.goodSpecification,
            unitName: productionItem.unitName,
            specification: productionItem.specification,
            lotId: productionItem.lotId,
            lotName: productionItem.lotName,
            rating: productionItem.rating === "공통" ? undefined : productionItem.rating,
            length: productionItem.length,
            thick: productionItem.thick,
            weight: productionItem.weight,
            partnerId: productionItem.partnerId,
            isExport: undefined,
            defectType: productionItem.defectType,
            realWeight: undefined,
            dueDate: new DateOnly(),
            createdByEmployeeId: undefined,
            createdByEmployeeName: undefined,
            createdAtDateTime: undefined,
            isCanceled: false,

            detail: {
              weightId: this._localStorage.get("lastWeightId") ? this._localStorage.get("lastWeightId").weightId : undefined,
              lot: productionItem.lotName,
              length: productionItem.length,
              weight: undefined,
              rating: productionItem.rating === "공통" ? undefined : productionItem.rating,
              defectType: productionItem.defectType
            }
          });
        }
      }
    }

    this._cdr.markForCheck();
  }

  public onRemoveItemButtonClick(item: IWeightMeasurementVM): void {
    this.items.remove(item);

    if (this.selectedItem === item) {
      this.selectedItem = undefined;
    }
  }


  public async onSearchLotSubmit(): Promise<void> {
    if (!this.filter!.detailLotName) {
      this._toast.danger("LOT를 입력해 주세요");
      return;
    }

    const lot = this.filter!.detailLotName!.trim();
    const result = await this._getWeightInfo(lot!);

    if (result && result.length > 0) {
      this.items = result;
      this.orgItems = Object.clone(this.items);

      this.selectedItem = this.items[0];
    }
    else {
      const newItem = await this._newWeightInfo(lot!);
      if (newItem && newItem.length > 0) {
        const selectItem = newItem[0];

        if (this.items!.filter(item => item.productionItemId === selectItem.id).length < 1) {
          this.items.insert(0, {
            id: undefined,
            weightId: this._localStorage.get("lastWeightId") ? this._localStorage.get("lastWeightId").weightId : undefined,
            productionOrderId: selectItem.productionOrderId,
            productionOrderCode: selectItem.productionOrderCode,
            productionItemId: selectItem.id,
            goodId: selectItem.goodId,
            goodName: selectItem.goodName,
            goodSpecification: selectItem.goodSpecification,
            unitName: selectItem.unitName,
            specification: selectItem.specification,
            lotId: selectItem.lotId,
            lotName: selectItem.lotName,
            rating: selectItem.rating === "공통" ? undefined : selectItem.rating,
            thick: selectItem.thick,
            length: selectItem.length,
            weight: selectItem.weight,
            partnerId: selectItem.partnerId,
            isExport: selectItem.isExport,
            defectType: selectItem.defectType,
            realWeight: undefined,
            dueDate: new DateOnly(),
            createdByEmployeeId: undefined,
            createdByEmployeeName: undefined,
            createdAtDateTime: undefined,
            isCanceled: false,

            detail: {
              weightId: this._localStorage.get("lastWeightId") ? this._localStorage.get("lastWeightId").weightId : undefined,
              lot: selectItem.lotName,
              length: selectItem.length,
              weight: undefined,
              rating: selectItem.rating === "공통" ? undefined : selectItem.rating,
              defectType: selectItem.defectType
            }
          });
          this.selectedItem = this.items[0];
        }
        this.filter.detailLotName = undefined;
      }
      else {
        this._toast.danger("생산되지 않은 LOT입니다.");
        return;
      }
    }

    this.filter!.detailLotName = undefined;
    this._cdr.markForCheck();
  }

  private async _getWeightInfo(lot: string): Promise<any[] | undefined> {
    let result: any[] = [];
    await this._orm.connectAsync(MainDbContext, async db => {
      result = await db.productionWeight
        .include(item => item.lot)
        .include(item => item.productionItem)
        .include(item => item.productionItem!.production)
        .include(item => item.productionItem!.production!.instruction)
        .include(item => item.productionItem!.production!.instruction!.partners)
        .include(item => item.goods)
        .include(item => item.createdByEmployee)
        .where(item => [
          sorm.equal(item.lot!.lot, lot)
        ])
        .select(item => ({
          id: item.id,
          weightId: this._localStorage.get("lastWeightId"),
          productionOrderId: item.productionItem!.production!.instructionId,
          productionOrderCode: item.productionItem!.production!.productionOrderCode,
          productionItemId: item.productionItemId,
          goodId: item.goodId,
          goodName: item.goods!.name,
          goodSpecification: item.goods!.specification,
          unitName: item.goods!.unitName,
          specification: sorm.ifNull(item.lot!.width, item.goods!.specification),
          thick: sorm.ifNull(item.lot!.thick, item.goods!.thick),
          lotId: item.lotId,
          lotName: item.lot!.lot,
          rating: item.productionItem!.rating,
          defectType: item.productionItem!.defectType,
          length: item.productionItem!.length,
          weight: item.productionItem!.weight,
          realWeight: item.realWeight,
          dueDate: item.dueDate,
          createdByEmployeeId: item.createdByEmployeeId,
          createdByEmployeeName: item.createdByEmployee!.name,
          createdAtDateTime: item.createdAtDateTime,
          isExport: item.productionItem!.production!.instruction!.partners!.isExport,
          isCanceled: item.isDisabled,

          detail: {
            weightId: undefined,
            lot: item.lot!.lot,
            length: item.productionItem!.length,
            weight: item.realWeight,
            rating: item.productionItem!.rating,
            defectType: item.productionItem!.defectType
          }
        }))
        .resultAsync();
    });
    return result;
  }

  private async _newWeightInfo(lot: string): Promise<any | undefined> {
    let returnItem: any[] = [];
    await this._orm.connectAsync(MainDbContext, async db => {
      const result = await db.productionItem
        .include(item => item.production)
        .include(item => item.production!.instruction)
        .include(item => item.production!.instruction!.partners)
        .include(item => item.goods)
        .include(item => item.createdByEmployee)
        .include(item => item.lot)
        .where(item => [
          sorm.equal(item.lot!.lot, lot)
        ])
        .select(item => ({
          id: item.id,
          seq: sorm.query("ROW_NUMBER() OVER (ORDER BY [lot].[lot] ASC)", Number),
          productionOrderId: item.productionId,
          productionOrderCode: item.production!.instruction!.productionInstructionCode,
          partnerId: item.production!.instruction!.partnerId,
          isExport: item.production!.instruction!.partners!.isExport,
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
        .resultAsync();

      returnItem = result.map(item => ({
        id: item.id,
        seq: item.seq,
        productionOrderId: item.productionOrderId,
        productionOrderCode: item.productionOrderCode,
        partnerId: item.partnerId,
        isExport: item.isExport,
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
    });
    return returnItem;
  }

  public async onBarcodePrintButtonClick(item: IWeightMeasurementVM): Promise<void> {
    if (!item.id || !item.realWeight) {
      this._toast.danger("중량값이 올바르지 않습니다.");
      return;
    }

    const printItem: IBarcodePrintVM[] = [];
    await this._orm.connectAsync(MainDbContext, async db => {
      const partnerResult = await db.partner
        .where(item1 => [
          sorm.equal(item1.id, item.partnerId
          )])
        .select(item1 => ({
          isExport: item1.isExport
        }))
        .singleAsync();

      item.isExport = partnerResult!.isExport;

      const barcodePrintItem: IBarcodePrintVM = {
        goodName: item.goodName,
        specification: item.specification,
        thick: item.thick,
        length: item.length,
        weight: Number(item.realWeight!.toFixed(2)),
        corona: undefined,
        material: undefined,
        lot: item.lotName,
        isExport: item.isExport!
      };
      printItem.push(barcodePrintItem!);
    });

    await this._print.print(MediumBarcodePrintTemplate, {printItems: printItem});
    this._cdr.markForCheck();
  }

  public async onRatingChange(item: any): Promise<void> {
    if (item.rating === "A") {
      item.defectType = undefined;
    }

    this.selectedItem!.detail!.weight = item.realWeight;
    this.selectedItem!.detail!.defectType = item.defectType;
    this.selectedItem!.detail!.rating = item.rating;
  }

  public onRatingItemChange(selected: any): void {
    if (selected.detail.rating === "A") {
      selected.detail.defectType = undefined;
    }
    selected.realWeight = selected.detail.weight;
    selected.rating = selected.detail.rating;
    selected.defectType = selected.detail.defectType;
  }

  public onChangeSelected(item: IWeightMeasurementVM): void {
    if (item && item.detail) {
      item.detail!.weightId = this._localStorage.get("lastWeightId") ? this._localStorage.get("lastWeightId").weightId : undefined;
      this._cdr.markForCheck();
    }
  }

  /* public onWeightIdChange(weightId: number, item: IWeightMeasurementVM): void {
     if (this.items.some(item1 => item !== item1 && item1.weightId === weightId)) {
       this._toast.danger("이미 해당 중량계로 선택 된 항목이 있습니다.");
       setTimeout(() => {
         item.weightId = undefined;
         this._cdr.markForCheck();
       });
       return;
     }
   }*/

  public applyWeightInfo(id: number, weight: number): void {
    const currItem = this.selectedItem;
    if (currItem) {
      currItem.realWeight = weight;
      currItem.detail!.weight = weight;
      this._cdr.markForCheck();
    }
  }

  public async productionSearchModalOpenButtonClick(item: IWeightMeasurementVM): Promise<void> {
    const result = await this._modal.show(ProductionSearchModal, "생산항목 검색", {
      isMulti: false,
      isWeightMeasurement: true
    });
    if (!result) return;

    if (this.items!.filter(item1 => item1.productionItemId === result.id).length < 1) {

      item.productionOrderId = result.productionOrderId;
      item.productionOrderCode = result.productionOrderCode;
      item.productionItemId = result.id;
      item.goodId = result.goodId;
      item.goodName = result.goodName;
      item.goodSpecification = result.goodSpecification;
      item.unitName = result.unitName;
      item.weight = result.weight;
      item.specification = result.specification;
      item.thick = result.thick;
      item.lotId = result.lotId;
      item.lotName = result.lotName;
      item.rating = result.rating === "공통" ? undefined : result.rating;
      item.length = result.length;
      item.realWeight = undefined;
      item.dueDate = new DateOnly();
      item.partnerId = result.partnerId;

      item.detail!.weightId = this._localStorage.get("lastWeightId") ? this._localStorage.get("lastWeightId").weightId : undefined;
      item.detail!.lot = result.lotName;
      item.detail!.length = result.length;
      item.detail!.weight = undefined;
      item.detail!.defectType = undefined;
      item.detail!.rating = result.rating === "공통" ? undefined : result.rating;
    }
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

  public async onBottomBarcodePrintButtonClick(selectItem: IWeightMeasurementVM): Promise<void> {
    if (!selectItem.realWeight) {
      this._toast.danger("측정중량을 입력해 주세요");
      return;
    }

    await this._orm.connectAsync(MainDbContext, async db => {
      // INSERT
      if (!selectItem.id) {
        const newBomInfo = await db.productionWeight
          .insertAsync({
            companyId: this._appData.authInfo!.companyId,
            dueDate: selectItem.dueDate!,
            productionItemId: selectItem.productionItemId!,
            goodId: selectItem.goodId!,
            lotId: selectItem.lotId!,
            realWeight: selectItem.realWeight,
            createdByEmployeeId: this._appData.authInfo!.employeeId,
            createdAtDateTime: new DateTime(),
            isDisabled: false
          });
        selectItem.id = newBomInfo.id;

        await db.productionItem
          .where(item => [
            sorm.equal(item.id, selectItem.productionItemId)]
          )
          .updateAsync(() => ({
            weightMeasurementId: selectItem.id!
          }));

        await db.lotHistory
          .where(item => [
            sorm.equal(item.id, selectItem.lotId!)
          ])
          .updateAsync(
            () => ({
              weight: selectItem.realWeight
            })
          );

        this._localStorage.set("lastWeightId", {
          weightId: selectItem.detail!.weightId
        });
      }
      else {
        if (selectItem.isCanceled) {
          await db.productionWeight.where(item => [sorm.equal(item.id, selectItem.id)]).deleteAsync();
        }
        else {
          await db.productionWeight
            .where(item => [
              sorm.equal(item.id, selectItem.id)
            ])
            .updateAsync(
              () => ({
                dueDate: selectItem.dueDate,
                realWeight: selectItem.realWeight
              })
            );

          await db.lotHistory
            .where(item => [
              sorm.equal(item.id, selectItem.lotId!)
            ])
            .updateAsync(
              () => ({
                weight: selectItem.realWeight
              })
            );
        }
      }
    });

    await this.onBarcodePrintButtonClick(selectItem);

    this._cdr.markForCheck();
  }

  private async _save(): Promise<void> {
    const diffTargets = this.orgItems.diffs(this.items, {keyProps: ["id"]}).map(item => item.target!);

    if (diffTargets.length < 1) {
      this._toast.info("변경사항이 없습니다.");
      if (process.env.NODE_ENV === "test") console.log("변경사항이 없습니다.");
      return;
    }

    this.viewBusyCount++;

    try {
      this._domValidator.validate(this._elRef!.nativeElement);

      Object.validatesArray(
        diffTargets,
        `중량 측정`,
        {
          id: {displayName: "ID", type: Number},
          realWeight: {displayName: "중량", notnull: true},
          isCanceled: {displayName: "사용중지", type: Boolean, notnull: true}
        }
      );

      await this._orm.connectAsync(MainDbContext, async db => {
          for (const diffItem of diffTargets) {
            // INSERT
            if (!diffItem.id) {
              const newBomInfo = await db.productionWeight
                .insertAsync({
                  companyId: this._appData.authInfo!.companyId,
                  dueDate: diffItem.dueDate!,
                  productionItemId: diffItem.productionItemId!,
                  goodId: diffItem.goodId!,
                  lotId: diffItem.lotId!,
                  realWeight: diffItem.realWeight,
                  createdByEmployeeId: this._appData.authInfo!.employeeId,
                  createdAtDateTime: new DateTime(),
                  isDisabled: false
                });
              diffItem.id = newBomInfo.id;

              await db.productionItem
                .where(item => [
                  sorm.equal(item.id, diffItem.productionItemId)]
                )
                .updateAsync(() => ({
                  weightMeasurementId: diffItem.id!,
                  weight: diffItem.realWeight
                }));

              await db.lotHistory
                .where(item => [
                  sorm.equal(item.id, diffItem.lotId!)
                ])
                .updateAsync(
                  () => ({
                    weight: diffItem.realWeight
                  })
                );
            }
            else {
              if (diffItem.isCanceled) {
                await db.productionWeight.where(item => [sorm.equal(item.id, diffItem.id)]).deleteAsync();
              }
              else {
                await db.productionWeight
                  .where(item => [
                    sorm.equal(item.id, diffItem.id)
                  ])
                  .updateAsync(
                    () => ({
                      dueDate: diffItem.dueDate,
                      realWeight: diffItem.realWeight
                    })
                  );

                await db.productionItem
                  .where(item => [
                    sorm.equal(item.id, diffItem.productionItemId)]
                  )
                  .updateAsync(() => ({
                    weight: diffItem.realWeight
                  }));

                await db.lotHistory
                  .where(item => [
                    sorm.equal(item.id, diffItem.lotId!)
                  ])
                  .updateAsync(
                    () => ({
                      weight: diffItem.realWeight
                    })
                  );
              }
            }
          }
        }
      );

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
          .wrap(ProductionWeight)
          .include(item => item.productionItem)
          .include(item => item.productionItem!.production)
          .include(item => item.productionItem!.production!.instruction)
          .include(item => item.productionItem!.production!.instruction!.partners)
          .include(item => item.goods)
          .include(item => item.lot)
          .include(item => item.createdByEmployee)
          .select(item => ({
            id: item.id,
            weightId: this._localStorage.get("lastWeightId"),
            productionOrderId: item.productionItem!.production!.instructionId,
            productionOrderCode: item.productionItem!.production!.productionOrderCode,
            productionItemId: item.productionItemId,
            goodId: item.goodId,
            goodName: item.goods!.name,
            goodSpecification: item.goods!.specification,
            unitName: item.goods!.unitName,
            specification: sorm.ifNull(item.lot!.width, item.goods!.specification),
            thick: sorm.ifNull(item.lot!.thick, item.goods!.thick),
            lotId: item.lotId,
            lotName: item.lot!.lot,
            rating: item.productionItem!.rating,
            defectType: item.productionItem!.defectType,
            length: item.productionItem!.length,
            weight: item.productionItem!.weight,
            realWeight: item.realWeight,
            dueDate: item.dueDate,
            createdByEmployeeId: item.createdByEmployeeId,
            createdByEmployeeName: item.createdByEmployee!.name,
            createdAtDateTime: item.createdAtDateTime,
            partnerId: item.productionItem!.production!.instruction!.partnerId,
            isExport: item.productionItem!.production!.instruction!.partners!.isExport,
            isCanceled: item.isDisabled,

            detail: {
              weightId: undefined,
              lot: item.lot!.lot,
              length: item.productionItem!.length,
              weight: item.realWeight,
              rating: item.productionItem!.rating,
              defectType: item.productionItem!.defectType
            }
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

    this._cdr.markForCheck();
  }

  private _getSearchQueryable(db: MainDbContext): Queryable<ProductionWeight> {
    let queryable = db.productionWeight
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);

    if (this.lastFilter!.fromDate || this.lastFilter!.toDate) {
      queryable = queryable
        .include(item => item.productionItem)
        .where(item => [
          sorm.between(item.productionItem!.createdAtDateTime, this.lastFilter!.fromDate, this.lastFilter!.toDate!)
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

    if (this.lastFilter!.lotName) {
      queryable = queryable
        .include(item => item.lot)
        .where(item => [
          sorm.includes(item.lot!.lot, this.lastFilter!.lotName)
        ]);
    }

    if (this.lastFilter!.productionOrderCode) {
      queryable = queryable
        .include(item => item.productionItem)
        .include(item => item.productionItem!.production)
        .where(item => [
          sorm.includes(item.productionItem!.production!.productionOrderCode, this.lastFilter!.productionOrderCode)
        ]);
    }

    if (this.lastFilter!.isCanceled) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.isDisabled, false)
        ]);
    }

    return queryable;
  }
}

interface IFilterVM {
  productionOrderCode?: string;
  fromDate?: DateOnly;
  toDate?: DateOnly;
  lotName?: string;
  detailLotName?: string;
  goodName?: string;
  specification?: string;
  isCanceled: boolean;
}

interface IWeightMeasurementVM {
  id: number | undefined;
  weightId: number | undefined;
  productionOrderId: number | undefined;
  productionOrderCode: string | undefined;
  productionItemId: number | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  goodSpecification: string | undefined;
  unitName: string | undefined;
  specification: string | undefined;
  thick: number | undefined;
  lotId: number | undefined;
  lotName: string | undefined;
  rating: "A" | "B" | "C" | "공통" | undefined;
  defectType: "주름" | "펑크" | "알갱이" | "접힘" | "젤" | "칼빠짐" | "미터부족" | "기포" | "두께편차" | "PE뜯김" | "라인줄" | "수축" | "접착" | "중량" | "코로나" | undefined;
  length: number | undefined;
  weight: number | undefined;
  realWeight: number | undefined;
  dueDate: DateOnly | undefined;
  createdAtDateTime: DateTime | undefined;
  createdByEmployeeId: number | undefined;
  createdByEmployeeName: string | undefined;
  partnerId: number | undefined;
  isExport: boolean | undefined;
  isCanceled: boolean;

  detail: IDetailVM | undefined;
}

interface IDetailVM {
  lot: string | undefined;
  weightId: number | undefined;
  length: number | undefined;
  weight: number | undefined;
  rating: "A" | "B" | "C" | "공통" | undefined;
  defectType: "주름" | "펑크" | "알갱이" | "접힘" | "젤" | "칼빠짐" | "미터부족" | "기포" | "두께편차" | "PE뜯김" | "라인줄" | "수축" | "접착" | "중량" | "코로나" | undefined;
}