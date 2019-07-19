import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild
} from "@angular/core";
import {DateOnly, DateTime, JsonConvert} from "@simplism/core";
import {
  MainDbContext,
  QuantityCheckInspection
} from "@sample/main-database";
import {SdDomValidatorProvider, SdModalProvider, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {sorm} from "@simplism/orm-query";
import {QualityCheckProductionSearchModal} from "../../modals/QualityCheckProductionSearchModal";
import {GoodReceiptSearchModal} from "../../modals/GoodReceiptSearchModal";
import {AppDataProvider} from "@sample/client-common";
import {Queryable} from "@simplism/orm-client";
import {ActivatedRoute} from "@angular/router";
import {ShowManualModal} from "../../modals/ShowManualModal";

@Component({
  selector: "app-qc-inspection",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>QC 검사</h4>

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
              <sd-form-item [label]="'검사일'">
                <sd-textfield [(value)]="filter.fromDate" [type]="'date'"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'~'">
                <sd-textfield [(value)]="filter.toDate" [type]="'date'"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'구분'">
                <sd-select [(value)]="filter.type">
                  <sd-select-item [value]="undefined">전체</sd-select-item>
                  <sd-select-item [value]="'일반'">일반</sd-select-item>
                  <sd-select-item [value]="'반품'">반품</sd-select-item>
                </sd-select>
              </sd-form-item>
              <br>
              <sd-form-item [label]="'품목명'">
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
              <sd-sheet #sheet [id]="'qc-inspection'"
                        [items]="items"
                        [trackBy]="trackByIdFn"
                        [(selectedItem)]="selectedItem"
                        (selectedItemChange)="onSelectedItemChanged($event)"
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
                <sd-sheet-column [header]="'검사일'" [width]="130">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.testDate" [type]="'date'"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'구분'" [width]="80">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.type }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'호기'" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.equipmentName }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'생산지시'" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.productionOrderId ? "#" + item.productionOrderId : "" }}
                      <a (click)="productionOrderSearchModalOpenButtonClick(item)">
                        <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'입고ID'" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.receiptId ? "#" + item.receiptId : "" }}
                      <a (click)="goodsReceiptSearchModalOpenButtonClick(item)">
                        <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                      </a>
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
                <sd-sheet-column [header]="'비고'">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.remark"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'등록자'">
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

              <sd-dock [position]="'bottom'" style="height: 40%"
                       *ngIf="selectedItem && (!selectedItem.receiptId || !selectedItem.productionOrderId)"
                       [id]="'inspection-item'">
                <sd-busy-container [busy]="selectedItemBusyCount > 0">
                  <sd-dock-container class="sd-background-default">
                    <sd-dock class="sd-padding-xs-sm">
                      <h5 style="display: inline-block; padding-right: 1.4em;">QC검사 항목</h5>
                      <sd-button [size]="'sm'" (click)="onAutoJudgmentButtonClick(selectedItem.inspectionItemList)"
                                 [inline]="true" [disabled]="!selectedItem.inspectionItemList">
                        <sd-icon [icon]="'sync-alt'" [fixedWidth]="true"></sd-icon>
                        자동 판정
                      </sd-button>
                    </sd-dock>

                    <sd-pane>
                      <sd-sheet [id]="'inspection-item'"
                                [items]="selectedItem.inspectionItemList"
                                [trackBy]="trackByIdFn">
                        <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              <span *ngIf="item.seq">{{ item.seq }}</span>
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'검사일'" [width]="130">
                          <ng-template #item let-item="item">
                            <sd-textfield [(value)]="item.testDate" [type]="'date'" [required]="true"></sd-textfield>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'호기'" [width]="100">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              {{ item.equipmentName }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'작업조'" [width]="80">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              {{ item.workingGroup }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'생산일'" [width]="130">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              {{ item.productionDate?.toFormatString("yyyy-MM-dd") }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'LOT'">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="color: red;"
                                 *ngIf="!!item.isNotStockItem && item.isNotStockItem === 0">
                                {{ item.lotName }}
                            </div>
                            <div class="sd-padding-xs-sm"  style="color: darkorange;"
                                 *ngIf="!!item.isNotStockItem && item.isNotStockItem === 1">
                                {{ item.lotName }}
                            </div>
                            <div class="sd-padding-xs-sm" style="color: black;"
                                 *ngIf="item.isNotStockItem === undefined">
                                {{ item.lotName }}
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
                        <ng-container
                          *ngIf="selectedItem.inspectionTypeList && selectedItem.inspectionTypeList.length > 0">
                          <sd-sheet-column
                            *ngFor="let inspection of selectedItem.inspectionTypeList; let i = index; trackBy: trackByMeFn"
                            [header]="inspection.inspectionTypeName">
                            <ng-template #item let-item1="item">
                              <sd-textfield [(value)]="item1.inspectionInfo[i].inspectionValue"></sd-textfield>
                            </ng-template>
                          </sd-sheet-column>
                        </ng-container>
                        <sd-sheet-column [header]="'검수관'">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm">
                              {{ item.coronerEmployeeName }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'등급'">
                          <ng-template #item let-item="item">
                            <sd-select [(value)]="item.rating" (valueChange)="onChangeAutoInfo($event, item)"
                                       [class.rating-red]="item.isAutoInspection">
                              <sd-select-item [value]="'A'">A</sd-select-item>
                              <sd-select-item [value]="'B'">B</sd-select-item>
                              <sd-select-item [value]="'C'">C</sd-select-item>
                              <sd-select-item [value]="'공통'">공통</sd-select-item>
                            </sd-select>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'판정'" *ngIf="!!selectedItem.receiptId">
                          <ng-template #item let-item="item">
                            <sd-select [(value)]="item.isPass">
                              <sd-select-item [value]="'합격'">합격</sd-select-item>
                              <sd-select-item [value]="'불합격'">불합격</sd-select-item>
                            </sd-select>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'판정인'">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm">
                              {{ item.judgmentEmployeeName }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'기타'">
                          <ng-template #item let-item="item">
                            <sd-textfield [(value)]="item.remark"></sd-textfield>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'생산종료 시간'" [width]="135">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              {{ item.lastProductionDate?.toFormatString('yyyy-MM-dd HH:mm:ss') }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'등록시간'" [width]="135">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              {{ item.createdAtDateTime?.toFormatString('yyyy-MM-dd HH:mm:ss') }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                      </sd-sheet>
                    </sd-pane>
                  </sd-dock-container>
                </sd-busy-container>
              </sd-dock>

            </sd-dock-container>
          </sd-busy-container>
        </sd-dock-container>
      </sd-topbar-container>
    </sd-busy-container>`,
  styles: [ /* language=SCSS */ `
    :host /deep/ sd-select.rating-red > sd-dropdown > ._sd-dropdown-control > ._sd-select-content {
      color: red;
    }

    :host /deep/ sd-select.rating-green > sd-dropdown > ._sd-dropdown-control > ._sd-select-content {
      color: darkgreen;
    }
  `]
})
export class QcInspectionPage implements OnInit {

  public filter: IFilterVM = {
    id: undefined,
    fromDate: undefined,
    toDate: undefined,
    goodName: undefined,
    specification: undefined,
    lot: undefined,
    type: undefined,
    isCanceled: false
  };

  public lastFilter?: IFilterVM;

  public pagination = {page: 0, length: 0};

  public items: IQcInspectionVM[] = [];
  public orgItems: IQcInspectionVM[] = [];

  public selectedItem?: IQcInspectionVM;

  public viewBusyCount = 0;
  public mainBusyCount = 0;
  public selectedItemBusyCount = 0;

  @ViewChild("aa", {read: ElementRef})
  public aa?: ElementRef<HTMLElement>;

  @ViewChild("bb", {read: ElementRef})
  public bb?: ElementRef<HTMLElement>;

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _appData: AppDataProvider,
                     private readonly _modal: SdModalProvider,
                     private readonly _elRef: ElementRef<HTMLElement>,
                     private readonly _domValidator: SdDomValidatorProvider,
                     private readonly _activatedRoute: ActivatedRoute,
                     private readonly _toast: SdToastProvider,
                     private readonly _cdr: ChangeDetectorRef) {
  }

  public async ngOnInit(): Promise<void> {
    this.mainBusyCount++;

    this._activatedRoute.params.subscribe(async params => {
      if (params && params.id) {

        this.lastFilter = Object.clone(this.filter);
        if (params.id) {
          this.filter.id = JsonConvert.parse(params.id);
          this.lastFilter.id = JsonConvert.parse(params.id);
        }
        location.href = location.href.slice(0, location.href.indexOf(";"));
      }
    });

    await this.onSearchFormSubmit();
    this.mainBusyCount--;

    this._cdr.markForCheck();
  }

  public async onShowManualButtonClick(): Promise<void> {
    const result = await this._modal.show(ShowManualModal, "QC검사 메뉴얼", {type: "qc-inspection"});
    if (!result) return;

    this._cdr.markForCheck();
  }

  public onAddItemButtonClick(): void {
    this.items.insert(0, {
      id: undefined,
      testDate: new DateOnly(),
      type: undefined,
      equipmentId: undefined,
      equipmentName: undefined,
      productionOrderId: undefined,
      productionId: undefined,
      receiptId: undefined,
      goodId: undefined,
      goodName: undefined,
      specification: undefined,
      remark: undefined,
      createdAtDateTime: undefined,
      createdByEmployeeId: undefined,
      createdByEmployeeName: undefined,
      isCanceled: false,
      inspectionItemList: undefined,
      inspectionTypeList: undefined
    });
  }

  public onRemoveItemButtonClick(item: IQcInspectionVM): void {
    this.items.remove(item);

    if (this.selectedItem === item) {
      this.selectedItem = undefined;
    }
  }

  public async productionOrderSearchModalOpenButtonClick(item: IQcInspectionVM): Promise<void> {
    const result = await this._modal.show(QualityCheckProductionSearchModal, "생산 검색", {
      isMulti: false,
      isInspectionSearch: true
    });
    if (!result) return;

    item.type = "일반";
    item.equipmentId = result.equipmentId;
    item.equipmentName = result.equipmentName;
    item.productionOrderId = result.productionOrderId;
    item.productionId = result.id;
    item.goodId = result.goodId;
    item.goodName = result.goodName;
    item.specification = result.specification;

    if (item.receiptId) {
      item.receiptId = undefined;
    }

    item.inspectionItemList = [];
    await this.onSelectedItemChanged(item);
    this._cdr.markForCheck();
  }

  public async goodsReceiptSearchModalOpenButtonClick(item: IQcInspectionVM): Promise<void> {
    const result = await this._modal.show(GoodReceiptSearchModal, "입고 검색", {
      isMulti: false,
      isQuantityInspection: true
    });
    if (!result) return;

    const goodInspectionInfo = await this._getGoodsInspectionInfo(result.goodId, true);

    if (!goodInspectionInfo || goodInspectionInfo.length < 1) {
      this._toast.danger("해당 제품의 QC검사 항목이 설정되어 있지 않습니다");
      return;
    }

    item.inspectionTypeList = goodInspectionInfo;

    item.type = "반품";
    item.receiptId = result.id;
    item.goodId = result.goodId;
    item.goodName = result.goodName;
    item.specification = result.specification;

    this._cdr.markForCheck();

    if (item.productionOrderId) {
      item.productionId = undefined;
      item.productionOrderId = undefined;
      item.equipmentId = undefined;
      item.equipmentName = undefined;
    }

    item.inspectionItemList = [];
    item.inspectionItemList!.insert(0, {
      id: 1,
      seq: 1,
      productionItemId: undefined,
      testDate: new DateOnly(),
      equipmentName: undefined,
      workingGroup: undefined,
      productionDate: undefined,
      warehouseId: result.warehouseId,
      lotId: result.lotId,
      lotName: result.lotName,
      goodId: result.goodId,
      goodName: result.goodName,
      inspectionInfo: item.inspectionTypeList,
      specification: result.specification,
      width: undefined,
      coronerEmployeeId: undefined,
      coronerEmployeeName: undefined,
      isAutoInspection: undefined,
      isNotStockItem: undefined,
      rating: "공통",
      isPass: undefined,
      judgmentEmployeeId: undefined,
      judgmentEmployeeName: undefined,
      lastProductionDate: undefined,
      createdAtDateTime: undefined,
      remark: undefined,
      isCanceled: false
    });

    this._cdr.markForCheck();
  }

  public async onSelectedItemChanged(item: IQcInspectionVM): Promise<void> {
    await this._selectItem(item);
    this._cdr.markForCheck();
  }

  private async _selectItem(selectedItem: IQcInspectionVM): Promise<void> {
    if (selectedItem && (selectedItem.productionOrderId || selectedItem.receiptId)) {
      this.selectedItem = selectedItem;

      this.mainBusyCount++;

      const isReceipt = !!selectedItem.receiptId;
      const isInspectionType = await this._getGoodsInspectionInfo(this.selectedItem.goodId!, isReceipt);

      if (!isInspectionType || isInspectionType.length < 1) {
        this._toast.danger("해당 제품의 QC검사 항목이 설정되어 있지 않습니다");
        return;
      }

      this.selectedItem!.inspectionTypeList = isInspectionType || [];
      this.selectedItem!.inspectionItemList = this.selectedItem!.inspectionItemList || [];

      const result = this.selectedItem!.productionOrderId ?
        await this._getBuildGoodInfo(this.selectedItem!.productionId!) : this.selectedItem.id ?
          await this._getReceiptBuildGoodInfo(this.selectedItem!.receiptId!) : undefined;

      if (result && result.length > 0) {
        for (const productionItem of result) {
          if (!this.selectedItem!.inspectionItemList!.some(item => item.productionItemId === productionItem.productionItemId)) {
            this.selectedItem!.inspectionItemList!.insert(0, {
              id: productionItem.id,
              seq: productionItem.seq,
              productionItemId: productionItem.productionItemId,
              testDate: productionItem.testDate,
              equipmentName: productionItem.equipmentName,
              workingGroup: productionItem.workingGroup,
              productionDate: productionItem.productionDate,
              warehouseId: productionItem.warehouseId,
              lotId: productionItem.lotId,
              lotName: productionItem.lotName,
              inspectionInfo: productionItem.inspectionInfo ? productionItem.inspectionInfo : Object.clone(isInspectionType),
              goodId: productionItem.goodId,
              goodName: productionItem.goodName,
              specification: productionItem.specification,
              width: productionItem.width,
              coronerEmployeeId: productionItem.coronerEmployeeId,
              coronerEmployeeName: productionItem.coronerEmployeeName,
              rating: productionItem.rating,
              isPass: productionItem.isPass,
              judgmentEmployeeId: productionItem.judgmentEmployeeId,
              judgmentEmployeeName: productionItem.judgmentEmployeeName,
              remark: productionItem.remark,
              isAutoInspection: productionItem.isAutoInspection,
              isNotStockItem: productionItem.isNotStockItem,
              lastProductionDate: productionItem.lastProductionDate,
              createdAtDateTime: productionItem.createdAtDateTime,
              isCanceled: false
            });
          }
        }
      }
    }
    this.mainBusyCount--;
    this._cdr.markForCheck();
  }

  //품질검사 항목 설정되어 있는지 확인
  private async _getGoodsInspectionInfo(goodId: number, isReceipt: boolean): Promise<IInspectionInfoVM[] | undefined> {
    let result: any[] = [];
    await this._orm.connectAsync(MainDbContext, async db => {
      result = await db.goodsInspection
        .include(item => item.inspection)
        .where(item => [
          sorm.equal(item.companyId, this._appData.authInfo!.companyId),
          sorm.equal(item.goodsId, goodId)
        ])
        .select(item => ({
          id: item.id,
          inspectionTypeId: item.inspectionId,
          inspectionTypeName: item.inspection!.name,
          inspectionValue: undefined,
          min: item.min,
          avg: item.avg,
          max: item.max,
          standardDeviationMin: item.standardDeviationMin,
          standardDeviationAvg: item.standardDeviationAvg,
          standardDeviationMax: item.standardDeviationMax,
          isUsingChart: item.isUsingChart
        }))
        .resultAsync();
    });

    return result;
  }

  public async _getBuildGoodInfo(productionId: number): Promise<any[]> {
    let result: any[] = [];
    await this._orm.connectAsync(MainDbContext, async db => {

      result = await db.productionItem
        .include(item => item.lot)
        .where(item => [
          sorm.equal(item.productionId, productionId),
          sorm.equal(item.lot!.isTesting, false)
        ])
        .include(item => item.lot)
        .include(item => item.goods)
        .include(item => item.weightMeasurement)
        .include(item => item.production)
        .include(item => item.production!.instruction)
        .include(item => item.production!.instruction!.equipment)
        .include(item => item.inspection)
        .include(item => item.inspection!.coronerEmployee)
        .include(item => item.inspection!.judgmentEmployee)
        .select(item => ({
          id: item.inspection!.id,
          seq: sorm.query("ROW_NUMBER() OVER (ORDER BY [TBL].id ASC)", Number),
          productionItemId: item.id,
          testDate: sorm.ifNull(item.inspection!.testDate, new DateOnly()),
          equipmentName: item.production!.instruction!.equipment!.name,
          workingGroup: item.productionGroup,
          productionDate: item.createdAtDateTime,
          warehouseId: 1,
          lotId: item.lotId,
          lotName: item.lot!.lot,
          goodId: item.goodId,
          goodName: item.goods!.name,
          isPass: item.inspection!.isPass,
          specification: item.goods!.specification,
          width: sorm.ifNull(item.inspection!.width, undefined),
          coronerEmployeeId: sorm.ifNull(item.inspection!.coronerEmployeeId, undefined),
          coronerEmployeeName: sorm.ifNull(item.inspection!.coronerEmployee!.name, ""),
          rating: item.inspection!.rating,
          isAutoInspection: item.inspection!.isAutoInspection,
          isNotStockItem: sorm.case<boolean | undefined>(
            sorm.equal(item.lot!.isTesting, true), true
          ).case(
            sorm.equal(item.lot!.isNotStock, true), false
          ).else(undefined),
          judgmentEmployeeId: sorm.ifNull(item.inspection!.judgmentEmployeeId, undefined),
          judgmentEmployeeName: sorm.ifNull(item.inspection!.judgmentEmployee!.name, ""),
          lastProductionDate: item.lastProductionDateTime,
          createdAtDateTime: item.inspection!.createdAtDateTime,
          remark: sorm.ifNull(item.inspection!.remark, undefined)
        }))
        .orderBy(item => item.seq, true)
        .resultAsync();

      for (const listItem of result) {
        listItem.inspectionInfo = [];
        const test: any[] = [];
        if (this.selectedItem!.inspectionTypeList && this.selectedItem!.inspectionTypeList!.length > 0) {
          for (const inspectionItem of this.selectedItem!.inspectionTypeList!) {
            const temp = await db.inspectionItem
              .include(item => item.quantityCheckInspectionItem)
              .include(item => item.inspection)
              .where(item => [
                sorm.equal(item.quantityCheckInspectionItem!.productionItemId, listItem.productionItemId),
                sorm.equal(item.inspection!.id, inspectionItem.inspectionTypeId)
              ])
              .select(item => ({
                id: item.id,
                inspectionTypeId: item.inspectionId,
                inspectionTypeName: item.inspection!.name,
                inspectionValue: item.inspectionValue,
                isAutoInspection: item.quantityCheckInspectionItem!.isAutoInspection,
                min: item.min,
                avg: item.avg,
                max: item.max,
                standardDeviationMin: item.standardDeviationMin,
                standardDeviationAvg: item.standardDeviationAvg,
                standardDeviationMax: item.standardDeviationMax,
                isUsingChart: item.isUsingChart
              }))
              .singleAsync();

            if (temp) {
              test.push(temp);
            }
            else {
              test.push({
                id: undefined,
                inspectionTypeId: inspectionItem.inspectionTypeId,
                inspectionTypeName: inspectionItem.inspectionTypeName,
                inspectionValue: undefined,
                isAutoInspection: undefined,
                min: inspectionItem.min,
                avg: inspectionItem.avg,
                max: inspectionItem.max,
                standardDeviationMin: inspectionItem.standardDeviationMin,
                standardDeviationAvg: inspectionItem.standardDeviationAvg,
                standardDeviationMax: inspectionItem.standardDeviationMax,
                isUsingChart: inspectionItem.isUsingChart
              });
            }
          }

          listItem.inspectionInfo = test;
        }
      }

    });

    return result;
  }

  public async _getReceiptBuildGoodInfo(receiptId: number): Promise<any[]> {
    let result: any[] = [];
    await this._orm.connectAsync(MainDbContext, async db => {

      result = await db.quantityCheckInspectionItem
        .include(item => item.quantityCheckInspection)
        .where(item => [
          sorm.equal(item.quantityCheckInspection!.receiptId, receiptId)
        ])
        .include(item => item.coronerEmployee)
        .include(item => item.judgmentEmployee)
        .include(item => item.goods)
        .include(item => item.lot)
        .select(item => ({
          id: item.id,
          seq: item.id,
          receiptId: item.quantityCheckInspection!.receiptId,
          productionItemId: undefined,
          testDate: item.testDate,
          equipmentName: undefined,
          workingGroup: undefined,
          productionDate: undefined,
          warehouseId: 1,
          lotId: item.lotId,
          lotName: item.lot!.lot,
          goodId: item.goodsId,
          goodName: item.goods!.name,
          specification: item.goods!.specification,
          width: item.width,
          rating: item.rating,
          isPass: item.isPass,
          judgmentEmployeeId: item.judgmentEmployeeId,
          judgmentEmployeeName: item.judgmentEmployee!.name,
          isAutoInspection: item.isAutoInspection,
          isNotStockItem: sorm.case<boolean | undefined>(
            sorm.equal(item.lot!.isTesting, true),
            sorm.equal(item.lot!.isNotStock, false)
          ).else(undefined),
          remark: item.remark,
          coronerEmployeeId: item.coronerEmployeeId,
          coronerEmployeeName: item.coronerEmployee!.name,
          isCanceled: item.isDisabled
        }))
        .orderBy(item => item.id, true)
        .resultAsync();

      for (const listItem of result) {
        listItem.inspectionInfo = [];
        const test: any[] = [];
        if (this.selectedItem!.inspectionTypeList && this.selectedItem!.inspectionTypeList!.length > 0) {
          for (const inspectionItem of this.selectedItem!.inspectionTypeList!) {
            const temp = await db.inspectionItem
              .include(item => item.quantityCheckInspectionItem)
              .include(item => item.quantityCheckInspectionItem!.quantityCheckInspection)
              .include(item => item.inspection)
              .where(item => [
                sorm.equal(item.quantityCheckInspectionItem!.quantityCheckInspection!.receiptId, listItem.receiptId),
                sorm.equal(item.inspection!.id, inspectionItem.inspectionTypeId)
              ])
              .select(item => ({
                id: item.id,
                inspectionTypeId: item.inspection!.id,
                inspectionTypeName: item.inspection!.name,
                inspectionValue: item.inspectionValue,
                min: inspectionItem.min,
                avg: inspectionItem.avg,
                max: inspectionItem.max,
                isAutoInspection: item.quantityCheckInspectionItem!.isAutoInspection,
                standardDeviationMin: inspectionItem.standardDeviationMin,
                standardDeviationAvg: inspectionItem.standardDeviationAvg,
                standardDeviationMax: inspectionItem.standardDeviationMax,
                isUsingChart: inspectionItem.isUsingChart
              }))
              .singleAsync();

            if (temp) {
              test.push(temp);
            }
            else {
              test.push({
                id: undefined,
                inspectionTypeId: inspectionItem.inspectionTypeId,
                inspectionTypeName: inspectionItem.inspectionTypeName,
                inspectionValue: undefined,
                min: undefined,
                avg: undefined,
                max: undefined,
                isAutoInspection: undefined,
                standardDeviationMin: undefined,
                standardDeviationAvg: undefined,
                standardDeviationMax: undefined,
                isUsingChart: undefined
              });
            }
          }

          listItem.inspectionInfo = test;
        }
      }

    });

    return result;
  }

  public onChangeAutoInfo(check: any, item: IInspectionListVM): void {
    if (check) {
      item.isAutoInspection = false;
    }
    this._cdr.markForCheck();
  }

  public async onAutoJudgmentButtonClick(item: IInspectionListVM[]): Promise<void> {
    let lastSeq: number | undefined;

    if (!item.some(item1 => !item1.rating)) {
      this._toast.danger("등급을 선택해 주세요.");
      return;
    }

    item.forEach((item1, index) => {
      if (!!item1.rating) {
        lastSeq = index;
      }
    });

    const judgmentList = item.slice();

    judgmentList.forEach((item1, index) => {
      if (!item1.rating && index < lastSeq!) {
        let tempRating: "A" | "B" | "C" | "공통" | undefined;

        for (let seq = index + 1; seq < judgmentList.length; seq++) {
          if (judgmentList[seq].rating) {
            tempRating = judgmentList[seq].rating;
            seq = judgmentList.length;
          }
        }
        if (!tempRating) {
          for (let seq = index - 1; seq >= 0; seq--) {
            if (judgmentList[seq].rating) {
              tempRating = judgmentList[seq].rating;
              seq = -1;
            }
          }
        }

        item1.rating = tempRating;
        item1.isAutoInspection = true;
      }
    });

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
    const diffTargets = this.orgItems.diffs(this.items, {keyProps: ["id"]}).map(item => item.target!);

    if (diffTargets.length < 1) {
      this._toast.info("변경사항이 없습니다.");
      if (process.env.NODE_ENV === "test") console.log("변경사항이 없습니다.");
      return;
    }

    if (diffTargets.some(item => !item.productionOrderId && !item.receiptId)) {
      this._toast.danger("저장하지 않을 항목은 삭제해 주세요.");
      return;
    }

    for (const diffs of diffTargets || []) {
      if (diffs.inspectionItemList && diffs.inspectionItemList.some(item => !item.rating)) {
        if (!confirm("판정이 진행되지 않은 항목이 있습니다. 진행하시겠습니까? \n(판정이 없는 항목은 저장되지 않습니다)")) return;
      }
    }

    this.viewBusyCount++;

    try {
      this._domValidator.validate(this._elRef!.nativeElement);

      for (const diffItem of diffTargets) {
        if (diffItem.inspectionItemList) {
          Object.validatesArray(
            diffItem.inspectionItemList,
            `출하계획`,
            {
              testDate: {displayName: "검사일", notnull: true}
            }
          );
        }
      }

      await this._orm.connectAsync(MainDbContext, async db => {
        for (const diffItem of diffTargets) {
          // INSERT
          if (!diffItem.id) {
            const newShippingPlan = await db.quantityCheckInspection
              .insertAsync({
                companyId: this._appData.authInfo!.companyId,
                testDate: diffItem.testDate,
                type: diffItem.type!,
                productionInstructionId: diffItem.productionOrderId,
                productionId: diffItem.productionId,
                receiptId: diffItem.receiptId,
                goodsId: diffItem.goodId!,
                remark: diffItem.remark,
                createdByEmployeeId: this._appData.authInfo!.employeeId,
                createdAtDateTime: new DateTime(),
                isDisabled: diffItem.isCanceled
              });
            diffItem.id = newShippingPlan.id;
            diffItem.createdByEmployeeName = this._appData.authInfo!.employeeName;
            diffItem.createdAtDateTime = new DateTime();

            if (diffItem.type === "일반") {
              await db.production
                .where(item => [
                  sorm.equal(item.id, diffItem.productionId)
                ])
                .updateAsync(
                  () => ({
                    inspectionId: diffItem.id
                  })
                );
            }
            else {
              await db.goodsReceipt
                .where(item => [
                  sorm.equal(item.id, diffItem.receiptId)
                ])
                .updateAsync(
                  () => ({
                    qcInspectionId: diffItem.id
                  })
                );
            }

            for (const inspectionItem of diffItem.inspectionItemList || []) {
              if (!!inspectionItem.rating) {
                const newQuantityCheckItem = await db.quantityCheckInspectionItem
                  .insertAsync({
                    companyId: this._appData.authInfo!.companyId,
                    testDate: inspectionItem.testDate!,
                    instructionId: diffItem.id!,
                    productionItemId: inspectionItem.productionItemId,
                    lotId: inspectionItem.lotId,
                    goodsId: inspectionItem.goodId!,
                    width: inspectionItem.width,
                    coronerEmployeeId: this._appData.authInfo!.employeeId,
                    rating: inspectionItem.rating,
                    isPass: inspectionItem.isPass,
                    judgmentEmployeeId: this._appData.authInfo!.employeeId,
                    isAutoInspection: inspectionItem.isAutoInspection,
                    remark: inspectionItem.remark,
                    createdAtDateTime: new DateTime(),
                    isDisabled: false
                  });
                inspectionItem.id = newQuantityCheckItem.id;
                inspectionItem.coronerEmployeeId = this._appData.authInfo!.employeeId;
                inspectionItem.judgmentEmployeeId = this._appData.authInfo!.employeeId;

                for (const inspectionTypeItem of inspectionItem.inspectionInfo || []) {
                  const newInspectionItem = await db.inspectionItem
                    .insertAsync({
                      companyId: this._appData.authInfo!.companyId,
                      quantityCheckInspectionItemId: inspectionItem.id!,
                      inspectionId: inspectionTypeItem.inspectionTypeId!,
                      goodId: inspectionItem.goodId!,
                      inspectionValue: inspectionTypeItem.inspectionValue,
                      min: inspectionTypeItem.min,
                      avg: inspectionTypeItem.avg,
                      max: inspectionTypeItem.max,
                      standardDeviationMin: inspectionTypeItem.standardDeviationMin,
                      standardDeviationAvg: inspectionTypeItem.standardDeviationAvg,
                      standardDeviationMax: inspectionTypeItem.standardDeviationMax,
                      isUsingChart: inspectionTypeItem.isUsingChart
                    });
                  inspectionTypeItem.id = newInspectionItem.id;
                }

                if (diffItem.type === "일반") {
                  await db.productionItem
                    .where(item => [
                      sorm.equal(item.id, inspectionItem.productionItemId)
                    ])
                    .updateAsync(
                      () => ({
                        inspectionId: inspectionItem.id
                      })
                    );
                }
                else {
                  if (inspectionItem.isPass === "불합격") {
                    await db.goodsReceipt
                      .where(item => [
                        sorm.equal(item.id, diffItem.receiptId)
                      ])
                      .updateAsync(
                        () => ({
                          needCanceled: true
                        })
                      );
                  }
                }

                await this._getChangeStockInfo(db, inspectionItem.lotId!, inspectionItem.rating!, inspectionItem.warehouseId!);
              }
            }
          }
          // UPDATE
          else {
            await db.quantityCheckInspection
              .where(item => [
                sorm.equal(item.id, diffItem.id)
              ])
              .updateAsync(
                () => ({
                  testDate: diffItem.testDate,
                  remark: diffItem.remark,
                  isDisabled: diffItem.isCanceled
                })
              );

            for (const inspectionItem of diffItem.inspectionItemList || []) {
              if (!!inspectionItem.rating) {
                if (!inspectionItem.id) {
                  const newQuantityCheckItem = await db.quantityCheckInspectionItem
                    .insertAsync({
                      companyId: this._appData.authInfo!.companyId,
                      testDate: inspectionItem.testDate!,
                      instructionId: diffItem.id!,
                      productionItemId: inspectionItem.productionItemId,
                      lotId: inspectionItem.lotId,
                      goodsId: inspectionItem.goodId!,
                      width: inspectionItem.width,
                      coronerEmployeeId: this._appData.authInfo!.employeeId,
                      rating: inspectionItem.rating,
                      isPass: inspectionItem.isPass,
                      judgmentEmployeeId: this._appData.authInfo!.employeeId,
                      isAutoInspection: inspectionItem.isAutoInspection,
                      remark: inspectionItem.remark,
                      createdAtDateTime: new DateTime(),
                      isDisabled: false
                    });
                  inspectionItem.id = newQuantityCheckItem.id;
                  inspectionItem.coronerEmployeeId = this._appData.authInfo!.employeeId;
                  inspectionItem.judgmentEmployeeId = this._appData.authInfo!.employeeId;

                  if (diffItem.type === "일반") {
                    await db.productionItem
                      .where(item => [
                        sorm.equal(item.id, inspectionItem.productionItemId)
                      ])
                      .updateAsync(
                        () => ({
                          inspectionId: inspectionItem.id
                        })
                      );
                  }
                  else {
                    if (inspectionItem.isPass === "불합격") {
                      await db.goodsReceipt
                        .where(item => [
                          sorm.equal(item.id, diffItem.receiptId)
                        ])
                        .updateAsync(
                          () => ({
                            needCanceled: true
                          })
                        );
                    }
                  }
                }
                else {
                  await db.quantityCheckInspectionItem
                    .where(item => [
                      sorm.equal(item.id, inspectionItem.id)
                    ])
                    .updateAsync(
                      () => ({
                        testDate: inspectionItem.testDate!,
                        width: inspectionItem.width,
                        coronerEmployeeId: this._appData.authInfo!.employeeId,
                        rating: inspectionItem.rating,
                        isAutoInspection: inspectionItem.isAutoInspection,
                        judgmentEmployeeId: this._appData.authInfo!.employeeId,
                        remark: inspectionItem.remark,
                        isDisabled: false
                      })
                    );
                }

                for (const inspectionTypeItem of inspectionItem.inspectionInfo || []) {
                  if (!inspectionTypeItem.id) {
                    const newInspectionItem = await db.inspectionItem
                      .insertAsync({
                        companyId: this._appData.authInfo!.companyId,
                        quantityCheckInspectionItemId: inspectionItem.id!,
                        inspectionId: inspectionTypeItem.inspectionTypeId!,
                        goodId: inspectionItem.goodId!,
                        inspectionValue: inspectionTypeItem.inspectionValue,
                        min: inspectionTypeItem.min,
                        avg: inspectionTypeItem.avg,
                        max: inspectionTypeItem.max,
                        standardDeviationMin: inspectionTypeItem.standardDeviationMin,
                        standardDeviationAvg: inspectionTypeItem.standardDeviationAvg,
                        standardDeviationMax: inspectionTypeItem.standardDeviationMax,
                        isUsingChart: inspectionTypeItem.isUsingChart
                      });
                    inspectionTypeItem.id = newInspectionItem.id;
                  }
                  else {
                    await db.inspectionItem
                      .where(item => [
                        sorm.equal(item.id, inspectionTypeItem.id)
                      ])
                      .updateAsync(
                        () => ({
                          inspectionValue: inspectionTypeItem.inspectionValue
                        })
                      );
                  }

                }
                await this._getChangeStockInfo(db, inspectionItem.lotId!, inspectionItem.rating!, inspectionItem.warehouseId!);
              }
            }
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

  private async _getChangeStockInfo(db: MainDbContext, lotId: number, rating: "A" | "B" | "C" | "공통", warehouseId: number): Promise<void> {
    await db.stock
      .include(item => item.lot)
      .where(item => [
        sorm.equal(item.lot!.isNotStock, false),
        sorm.equal(item.lotId, lotId),
        sorm.equal(item.warehouseId, warehouseId)
      ])
      .updateAsync(
        () => ({
          rating
        })
      );

    await db.lotHistory
      .where(item => [
        sorm.equal(item.id, lotId)
      ])
      .updateAsync(
        () => ({
          goodsRating: rating
        })
      );
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
          .wrap(QuantityCheckInspection)
          .include(item => item.employee)
          .include(item => item.goods)
          .include(item => item.productionInstruction)
          .include(item => item.productionInstruction!.equipment)
          .include(item => item.inspectionDetails)
          .include(item => item.inspectionDetails![0].productionItem)
          .include(item => item.inspectionDetails![0].lot)
          .include(item => item.inspectionDetails![0].goods)
          .include(item => item.inspectionDetails![0].coronerEmployee)
          .include(item => item.inspectionDetails![0].judgmentEmployee)
          .include(item => item.inspectionDetails![0].inspectionInfo)
          .include(item => item.inspectionDetails![0].inspectionInfo![0].inspection)
          .select(item => ({
            id: item.id,
            testDate: item.testDate,
            type: item.type,
            equipmentId: item.productionInstruction!.equipmentId,
            equipmentName: item.productionInstruction!.equipment!.name,
            productionId: item.productionId,
            productionOrderId: item.productionInstructionId,
            receiptId: item.receiptId,
            goodId: item.goodsId,
            goodName: item.goods!.name,
            specification: item.goods!.specification,
            remark: item.remark,
            createdAtDateTime: item.createdAtDateTime,
            createdByEmployeeId: item.createdByEmployeeId,
            createdByEmployeeName: item.employee!.name,
            isCanceled: item.isDisabled,

            inspectionItemList: undefined,
            inspectionTypeList: undefined
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

  private _getSearchQueryable(db: MainDbContext): Queryable<QuantityCheckInspection> {
    let queryable = db.quantityCheckInspection
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);

    if (this.lastFilter!.id) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.id, this.lastFilter!.id)
        ]);
    }

    if (this.lastFilter!.fromDate || this.lastFilter!.toDate) {
      queryable = queryable
        .where(item => [
          sorm.between(item.testDate!, this.lastFilter!.fromDate, this.lastFilter!.toDate!)
        ]);
    }

    if (this.lastFilter!.type) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.type, this.lastFilter!.type)
        ]);
    }

    if (this.lastFilter!.lot) {
      queryable = queryable
        .include(item => item.inspectionDetails)
        .include(item => item.inspectionDetails![0].lot)
        .where(item => [
          sorm.includes(item.inspectionDetails![0].lot!.lot, this.lastFilter!.lot)
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

    queryable = queryable.where(item => [
      sorm.equal(item.isDisabled, this.lastFilter!.isCanceled)
    ]);

    return queryable;
  }
}

interface IFilterVM {
  id?: number;
  fromDate?: DateOnly;
  toDate?: DateOnly;
  goodName?: string;
  specification?: string;
  lot?: string;
  type?: "일반" | "반품";
  isCanceled: boolean;
}

interface IQcInspectionVM {
  id: number | undefined;
  testDate: DateOnly | undefined;
  type: "일반" | "반품" | undefined;
  equipmentId: number | undefined;
  equipmentName: string | undefined;
  productionOrderId: number | undefined;
  productionId: number | undefined;
  receiptId: number | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  specification: string | undefined;
  remark: string | undefined;
  createdAtDateTime: DateTime | undefined;
  createdByEmployeeId: number | undefined;
  createdByEmployeeName: string | undefined;
  isCanceled: boolean;

  inspectionTypeList: IInspectionInfoVM[] | undefined;
  inspectionItemList: IInspectionListVM[] | undefined;
}

//하위 QC검사 항목에서 입력할 검사 항목들 만들어 주기 위해서 필요


interface IInspectionListVM {
  id: number | undefined;
  seq: number | undefined;
  productionItemId: number | undefined;
  testDate: DateOnly | undefined;
  equipmentName: string | undefined;
  workingGroup: string | undefined;
  productionDate: DateTime | undefined;
  warehouseId: number | undefined;
  lotId: number | undefined;
  lotName: string | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  specification: string | undefined;
  inspectionInfo: IInspectionInfoVM[] | undefined;
  width: number | undefined;
  rating: "A" | "B" | "C" | "공통" | undefined;
  isPass: "합격" | "불합격" | undefined;
  judgmentEmployeeId: number | undefined;
  judgmentEmployeeName: string | undefined;
  remark: string | undefined;
  isAutoInspection: boolean | undefined;
  isNotStockItem: boolean | undefined;
  lastProductionDate: DateTime | undefined;
  createdAtDateTime: DateTime | undefined;
  coronerEmployeeId: number | undefined;
  coronerEmployeeName: string | undefined;
  isCanceled: boolean;
}

interface IInspectionInfoVM {
  id: number | undefined;
  inspectionTypeId: number | undefined;
  inspectionTypeName: string | undefined;
  inspectionValue: string | undefined;
  min: number | undefined;
  avg: number | undefined;
  max: number | undefined;
  standardDeviationMin: number | undefined;
  standardDeviationAvg: number | undefined;
  standardDeviationMax: number | undefined;
  isUsingChart: boolean;
}

//TODO: 현재 생산창고 코드는 1로 하드코딩임