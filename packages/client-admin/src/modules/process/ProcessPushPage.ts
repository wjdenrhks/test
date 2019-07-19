import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnInit} from "@angular/core";
import {DateTime} from "@simplism/core";
import {SdDomValidatorProvider, SdModalProvider, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {AppDataProvider} from "@sample/client-common";
import {CodeProc, MainDbContext, PushProcess, PushProcessItem, StockProc} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {StockSearchModal} from "../../modals/StockSearchModal";
import {GoodsSearchModal} from "../../modals/GoodsSearchModal";
import {Queryable} from "@simplism/orm-client";
import {ProductionInfoGoodsSearchModal} from "../../modals/ProductionInfoGoodsSearchModal";
import {ShowManualModal} from "../../modals/ShowManualModal";

@Component({
  selector: "app-process-push",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>밀어내기</h4>

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
          <!--  <sd-topbar-menu (click)="onBarcodePrintButtonClick()" style="float: right; margin-right: 100px;">
              <sd-icon [icon]="'barcode'" [fixedWidth]="true"></sd-icon>
              바코드 출력
            </sd-topbar-menu>-->
        </sd-topbar>

        <sd-dock-container>
          <sd-dock class="sd-padding-sm-default sd-background-grey-lightest">
            <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
              <sd-form-item [label]="'구분'">
                <sd-select [(value)]="filter.type">
                  <sd-select-item [value]="undefined">전체</sd-select-item>
                  <sd-select-item [value]="'시작'">시작</sd-select-item>
                  <sd-select-item [value]="'종료'">종료</sd-select-item>
                </sd-select>
              </sd-form-item>
              <sd-form-item [label]="'처리'">
                <sd-select [(value)]="filter.productionType">
                  <sd-select-item [value]="undefined">전체</sd-select-item>
                  <sd-select-item [value]="'재생'">재생</sd-select-item>
                  <sd-select-item [value]="'판매'">판매</sd-select-item>
                  <sd-select-item [value]="'폐기'">폐기</sd-select-item>
                </sd-select>
              </sd-form-item>
              <sd-form-item [label]="'품목명'">
                <app-good-name-select [(value)]="filter.goodName"></app-good-name-select>
              </sd-form-item>
              <sd-form-item [label]="'규격'">
                <app-goods-specification-select [(value)]="filter.specification" [goodName]="filter.goodName"></app-goods-specification-select>
              </sd-form-item>
              <sd-form-item [label]="'투입 LOT'">
                <sd-textfield [(value)]="filter.inputLot"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'산출 LOT'">
                <sd-textfield [(value)]="filter.productionLot"></sd-textfield>
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
              <sd-sheet #sheet [id]="'process-push'"
                        [items]="items"
                        [trackBy]="trackByIdFn"
                        [(selectedItem)]="selectedItem"
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
                <sd-sheet-column [header]="'작업시간'" [width]="200">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.dueDate"
                                  [type]="'datetime'" [required]="true"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'구분'" [width]="70">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.type" [disabled]="true">
                      <sd-select-item [value]="'시작'">시작</sd-select-item>
                      <sd-select-item [value]="'종료'">종료</sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'구분(종료)'" [width]="70">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      <a (click)="onAddFinishItemButtonClick(item)"
                         *ngIf="!!item.id && item.type === '시작' && !item.finishId"> 종료
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'투입품목'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.inputGoodName }}
                      <a (click)="inputGoodsSearchModalOpenButtonClick(item)">
                        <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'규격'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.inputGoodSpecification }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'투입LOT'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.inputLotName }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'투입중량'">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.inputWeight" [type]="'number'"
                                  [disabled]="item.id && !item.inputLotId"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'산출중량'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right;">
                      {{ item.productionTotalWeight | number }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'호기'">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.equipmentId" (valueChange)="onChangeEquipment(item)"
                               [required]="true" [disabled]="(!item.id && item.type === '종료')  || !!item.id">
                      <sd-select-item *ngFor="let equipment of equipmentList; trackBy: trackByMeFn"
                                      [value]="equipment.id"
                                      [hidden]="equipment.isDisabled">
                        {{ equipment.name }}
                      </sd-select-item>
                    </sd-select>
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

              <sd-dock [position]="'bottom'" style="height: 40%" *ngIf="selectedItem"
                       [id]="'process-push-item'">
                <sd-dock-container class="sd-background-default">
                  <sd-dock class="sd-padding-xs-sm">
                    <h5 style="display: inline-block; padding-right: 1.4em;">산출품목</h5>
                    <sd-button [size]="'sm'" (click)="onAddPushProcessItemButtonClick()" [inline]="true">
                      <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
                      행 추가
                    </sd-button>
                  </sd-dock>

                  <sd-pane>
                    <sd-sheet [id]="'process-push-item'"
                              [items]="selectedItem.processPushItems"
                              [trackBy]="trackByIdFn">
                      <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm" style="text-align: center;">
                            <span *ngIf="item.id">{{ item.id }}</span>
                            <a *ngIf="!item.id" (click)="onRemoveProcessPushGoodButtonClick(item)">
                              <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                            </a>
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'산출구분'">
                        <ng-template #item let-item="item">
                          <sd-select [(value)]="item.productionType" (valueChange)="onTypeChange(item)"
                                     [required]="true" [disabled]="!!item.id">
                            <sd-select-item [value]="'재생'">재생</sd-select-item>
                            <sd-select-item [value]="'판매'">판매</sd-select-item>
                            <sd-select-item [value]="'폐기'">폐기</sd-select-item>
                          </sd-select>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'산출품목'">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm">
                            {{ item.productionGoodsName }}
                            <a (click)="productionGoodsSearchModalOpenButtonClick(item)"
                               [attr.sd-invalid]="item.productionType !=='폐기' && !item.productionGoodsId">
                              <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                            </a>
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
                      <sd-sheet-column [header]="'산출LOT'">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm">
                            {{ item.productionLotName }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'산출중량'">
                        <ng-template #item let-item="item">
                          <sd-textfield [(value)]="item.productionWeight" [type]="'number'"
                                        [required]="true"></sd-textfield>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'창고'">
                        <ng-template #item let-item="item">
                          <sd-select [(value)]="item.warehouseId"
                                     [required]="item.productionType !=='폐기'"
                                     [disabled]="!!item.id || item.productionType === '폐기'">
                            <sd-select-item *ngFor="let warehouse of warehouseList; trackBy: trackByMeFn"
                                            [value]="warehouse.id"
                                            [hidden]="warehouse.isDisabled">
                              {{ warehouse.name }}
                            </sd-select-item>
                          </sd-select>
                        </ng-template>
                      </sd-sheet-column>
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
export class ProcessPushPage implements OnInit {

  public filter: IFilterVM = {
    type: undefined,
    productionType: undefined,
    goodName: undefined,
    specification: undefined,
    inputLot: undefined,
    productionLot: undefined
  };

  public lastFilter?: IFilterVM;

  public pagination = {page: 0, length: 0};

  public items: IProcessPushVM[] = [];
  public orgItems: IProcessPushVM[] = [];

  public selectedItem?: IProcessPushVM;

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public equipmentList: {
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
                     private readonly _modal: SdModalProvider,
                     private readonly _elRef: ElementRef<HTMLElement>,
                     private readonly _domValidator: SdDomValidatorProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _cdr: ChangeDetectorRef) {
  }

  public async ngOnInit(): Promise<void> {
    this.mainBusyCount++;

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

    });

    await this.onSearchFormSubmit();
    this.mainBusyCount--;

    this._cdr.markForCheck();
  }

  public async onShowManualButtonClick(): Promise<void> {
    const result = await this._modal.show(ShowManualModal, "밀어내기 메뉴얼", {type: "process-push"});
    if (!result) return;

    this._cdr.markForCheck();
  }

  public onAddItemButtonClick(): void {
    this.items.insert(0, {
      id: undefined,
      dueDate: new DateTime(),
      type: "시작",
      inputGoodId: undefined,
      inputGoodName: undefined,
      inputGoodSpecification: undefined,
      inputGoodRating: undefined,
      inputLotId: undefined,
      inputLotName: undefined,
      inputWeight: undefined,
      inputWarehouseId: undefined,
      startId: undefined,
      finishId: undefined,
      productionTotalWeight: undefined,
      equipmentId: undefined,
      equipmentName: undefined,
      createdByEmployeeId: undefined,
      createdByEmployeeName: undefined,
      createdAtDateTime: undefined,

      processPushItems: undefined
    });
  }

  public onRemoveItemButtonClick(item: IProcessPushVM): void {
    this.items.remove(item);
  }

  public onAddFinishItemButtonClick(item: IProcessPushVM): void {
    if (!this.items.some(item1 => item1.startId === item.id)) {
      this.items.insert(0, {
        id: undefined,
        dueDate: new DateTime(),
        type: "종료",
        inputGoodId: undefined,
        inputGoodName: undefined,
        inputGoodSpecification: undefined,
        inputGoodRating: undefined,
        inputLotId: undefined,
        inputLotName: undefined,
        inputWeight: undefined,
        inputWarehouseId: undefined,
        startId: item.id,
        finishId: undefined,
        productionTotalWeight: undefined,
        equipmentId: item.equipmentId,
        equipmentName: item.equipmentName,
        createdByEmployeeId: undefined,
        createdByEmployeeName: undefined,
        createdAtDateTime: undefined,

        processPushItems: undefined
      });
    }
  }

  public async onAddPushProcessItemButtonClick(): Promise<void> {
    this.selectedItem!.processPushItems = this.selectedItem!.processPushItems || [];

    let result: any | undefined;
    if (this.selectedItem!.inputGoodId) {
      result = await this._modal.show(ProductionInfoGoodsSearchModal, "산출 제품(LOT) 검색", {
        isMulti: true,
        goodId: this.selectedItem!.inputGoodId
      });
    }
    else {
      result = await this._modal.show(GoodsSearchModal, "산출 제품(LOT) 검색", {
        isMulti: true
      });
    }

    if (!result) return;

    for (const productionGoods of result || []) {
      this.selectedItem!.processPushItems!.insert(0, {
        id: undefined,
        productionType: "재생",
        productionGoodsId: productionGoods.id,
        productionGoodsName: productionGoods.name,
        specification: productionGoods.specification,
        productionLotId: undefined,
        productionLotName: undefined,
        productionGoodRating: "공통",
        productionWeight: undefined,
        warehouseId: undefined,
        warehouseName: undefined
      });
      this._cdr.markForCheck();
    }
  }

  public onRemoveProcessPushGoodButtonClick(item: IProcessPushItemVM): void {
    this.selectedItem!.processPushItems!.remove(item);
  }

  public async inputGoodsSearchModalOpenButtonClick(item: IProcessPushVM): Promise<void> {
    const result = await this._modal.show(StockSearchModal, "투입 제품(LOT) 검색", {
      isMulti: false,
      isPackingSearch: true
    });
    if (!result) return;

    item.inputGoodId = result.goodId;
    item.inputGoodName = result.goodName;
    item.inputGoodSpecification = result.specification;
    item.inputGoodRating = result.rating;
    item.inputLotId = result.lotId;
    item.inputLotName = result.lotName;
    item.inputWarehouseId = result.warehouseId;

    this._cdr.markForCheck();
  }

  public async productionGoodsSearchModalOpenButtonClick(item: IProcessPushItemVM): Promise<void> {
    let result: any | undefined;
    if (this.selectedItem!.inputGoodId) {
      result = await this._modal.show(ProductionInfoGoodsSearchModal, "산출 제품(LOT) 검색", {
        isMulti: true,
        goodId: this.selectedItem!.inputGoodId
      });
    }
    else {
      result = await this._modal.show(GoodsSearchModal, "산출 제품(LOT) 검색", {
        isMulti: true
      });
    }

    if (!result) return;

    item.productionGoodsId = result.id;
    item.productionGoodsName = result.name;
    item.specification = result.specification;

    this._cdr.markForCheck();
  }

  public async onTypeChange(item: IProcessPushItemVM): Promise<void> {
    if (item.productionType === "폐기") {
      item.warehouseId = undefined;
      item.warehouseName = undefined;
    }

    this._cdr.markForCheck();
  }

  // 해당 설비의 종료가 이루어 지지 않았으면 행 추가 불가 (종료되지 않은 밀어내기가 존재합니다.)
  public async onChangeEquipment(item: IProcessPushVM): Promise<void> {
    let result: any[] | undefined;
    await this._orm.connectAsync(MainDbContext, async db => {
      result = await db.pushProcess
        .where(item1 => [
          sorm.equal(item1.equipmentId, item.equipmentId),
          sorm.and([
            sorm.equal(item1.type, "시작"),
            sorm.null(item1.finishId)
          ])
        ])
        .select(item1 => ({
          id: item1.id
        }))
        .resultAsync();
    });

    if (result && result.length > 0) {
      item.equipmentId = undefined;
      item.equipmentName = undefined;
      this._cdr.markForCheck();

      this._toast.danger("해당 설비의 밀어내기 종료를 먼저 진행해 주세요.\n밀어내기 ID : " + result[0].id);
      return;
    }

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

    if (diffTargets.some(item => !item.equipmentId)) {
      this._toast.danger("작업호기는 반드시 입력해야 합니다.");
      return;
    }

    if (diffTargets.filter(item => item.inputGoodId && !item.inputWeight).length > 0) {
      this._toast.danger("투입품목을 선택하면 투입 중량도 입력해야 합니다.");
      return;
    }

    /*for (const diffItem of diffTargets) {
      if (!diffItem.processPushItems || diffItem.processPushItems.length < 1) {
        this._toast.danger("산출품목 리스트가 비어있습니다.");
        return;
      }
    }*/

    this.viewBusyCount++;

    try {
      this._domValidator.validate(this._elRef!.nativeElement);

      Object.validatesArray(
        diffTargets,
        `밀어내기`,
        {
          id: {displayName: "ID", type: Number},
          equipmentId: {displayName: "호기", notnull: true}
        }
      );

      for (const diffItem of diffTargets || []) {
        if (diffItem.processPushItems) {
          Object.validatesArray(
            diffItem.processPushItems,
            `밀어내기`,
            {
              id: {displayName: "ID", type: Number},
              productionWeight: {displayName: "산출중량", notnull: true}
            }
          );
        }
      }

      await this._orm.connectAsync(MainDbContext, async db => {
        for (const diff of diffs) {
          // INSERT
          if (!diff.target!.id) {
            const newProcessPush = await db.pushProcess
              .insertAsync({
                companyId: this._appData.authInfo!.companyId,
                dueDate: diff.target!.dueDate!,
                type: diff.target!.type!,
                inputGoodsId: diff.target!.inputGoodId,
                inputLotId: diff.target!.inputLotId,
                inputWeight: diff.target!.inputWeight,
                inputWarehouseId: diff.target!.inputWarehouseId,
                startId: diff.target!.startId,
                finishId: diff.target!.finishId,
                equipmentId: diff.target!.equipmentId!,
                createdAtDateTime: new DateTime(),
                createdByEmployeeId: this._appData.authInfo!.employeeId
              });
            diff.target!.id = newProcessPush.id;
            diff.target!.createdByEmployeeName = this._appData.authInfo!.employeeName;
            diff.target!.createdAtDateTime = new DateTime();

            if (diff.target!.inputLotId) {
              await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.target!.inputGoodId!, diff.target!.inputWeight, diff.target!.inputLotId, diff.target!.inputWarehouseId, "-", diff.target!.inputGoodRating!);
              await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.target!.inputGoodId!, diff.target!.inputWeight, "-");
            }

            if (diff.target!.type === "종료") {
              await db.pushProcess
                .where(item => [
                  sorm.equal(item.id, diff.target!.startId)
                ])
                .updateAsync(
                  () => ({
                    finishId: diff.target!.id
                  })
                );

              const startPussInfo = await db.pushProcess
                .where(item => [
                  sorm.equal(item.id, diff.target!.startId)
                ])
                .select(item => ({
                  id: item.id,
                  date: item.dueDate
                }))
                .singleAsync();

              const startPussItemQuantity = await db.pushProcessItem
                .where(item => [
                  sorm.equal(item.pushProcessId, startPussInfo!.id)
                ])
                .select(item => ({
                  totalQuantity: sorm.sum(sorm.ifNull(item.weight, 0))
                }))
                .singleAsync();

              const lastPussItemQuantity = (diff.target!.processPushItems && diff.target!.processPushItems!.sum(item => item.productionWeight || 0)) || 0;
              const totalQuantity = (startPussItemQuantity ? startPussItemQuantity!.totalQuantity : 0)! + lastPussItemQuantity;

              const startDate = startPussInfo!.date;
              const lastDate = diff.target!.dueDate;

              const productionInfo = await db.production
                .where(item => [
                  sorm.notNull(item.firstModifiedAtDateTime),
                  sorm.between(item.firstModifiedAtDateTime!, sorm.cast(startDate, DateTime), lastDate),
                  sorm.equal(item.equipmentId, diff.target!.equipmentId),
                  sorm.equal(item.isCanceled, false)
                ])
                .select(item => ({
                  id: item.id
                }))
                .resultAsync();

              if (productionInfo && productionInfo.length > 0) {
                const lossQuantity = isNaN(totalQuantity / productionInfo.length) ? 0 : Number((totalQuantity / productionInfo.length).toFixed(2));

                if (lossQuantity !== 0) {
                  for (const productionItem of productionInfo) {
                    await db.production
                      .where(item => [
                        sorm.equal(item.id, productionItem.id)
                      ])
                      .updateAsync(
                        () => ({
                          pushLoss: lossQuantity
                        })
                      );
                  }
                }
              }
            }

            for (const processPushItem of diff.target!.processPushItems || []) {

              // const documentCode = await CodeProc.getDocumentCode(db, this._appData.authInfo!.companyId, this._appData.authInfo!.employeeId, processPushItem.productionGoodsId!, "산출", undefined, undefined);
              const lotInfo = processPushItem.productionType !== "폐기" ?
                processPushItem.productionType === "재생" ?  await CodeProc.getLotCode2(db, this._appData.authInfo!.companyId, this._appData.authInfo!.employeeId, processPushItem.warehouseId!,
                processPushItem.productionGoodsId!, processPushItem.productionGoodsName!, "L1") :
                  await CodeProc.getLotCode2(db, this._appData.authInfo!.companyId, this._appData.authInfo!.employeeId, processPushItem.warehouseId!,
                processPushItem.productionGoodsId!, processPushItem.productionGoodsName!, "L3") : undefined;

              const newProcessPushItem = await db.pushProcessItem
                .insertAsync({
                  companyId: this._appData.authInfo!.companyId,
                  pushProcessId: newProcessPush.id!,
                  productionType: processPushItem.productionType,
                  goodId: processPushItem.productionGoodsId!,
                  lotId: lotInfo ? lotInfo!.lotId! : undefined,
                  weight: processPushItem.productionWeight,
                  warehouseId: processPushItem.warehouseId,
                  createdAtDateTime: new DateTime(),
                  createdByEmployeeId: this._appData.authInfo!.employeeId
                });
              processPushItem.id = newProcessPushItem.id;
              processPushItem.productionLotName = lotInfo ? lotInfo.lotName : undefined;

              if (processPushItem.productionType !== "폐기") {
                await StockProc.modifyStock(db, this._appData.authInfo!.companyId, processPushItem.productionGoodsId!, processPushItem.productionWeight, lotInfo!.lotId!, processPushItem.warehouseId, "+", processPushItem.productionGoodRating!);
                await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, processPushItem.productionGoodsId!, processPushItem.productionWeight, "+");
              }
            }
          }
          // UPDATE
          else {
            await db.pushProcess
              .where(item => [
                sorm.equal(item.id, diff.target!.id)
              ])
              .updateAsync(
                () => ({
                  dueDate: diff.target!.dueDate,
                  type: diff.target!.type!,
                  startId: diff.target!.startId,
                  finishId: diff.target!.finishId,
                  inputWeight: diff.target!.inputWeight,
                  modifyAtDateTime: new DateTime(),
                  modifyByEmployeeId: this._appData!.authInfo!.employeeId
                })
              );

            if (diff.target!.inputWeight) {
              await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.target!.inputGoodId!, diff.source!.inputWeight, diff.target!.inputLotId, diff.target!.inputWarehouseId, "+", diff.target!.inputGoodRating!);
              await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.target!.inputGoodId!, diff.source!.inputWeight, "+");
              await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.target!.inputGoodId!, diff.target!.inputWeight, diff.target!.inputLotId, diff.target!.inputWarehouseId, "-", diff.target!.inputGoodRating!);
              await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.target!.inputGoodId!, diff.target!.inputWeight, "-");
            }

            const isProcessPushChanged = (diff.source!.processPushItems || []).diffs(diff.target!.processPushItems || [], {keyProps: ["id"]});

            if (isProcessPushChanged) {
              if (diff.target!.type === "시작") {
                if (diff.target!.finishId) {
                  const finishPussInfo = await db.pushProcess
                    .where(item => [
                      sorm.equal(item.id, diff.target!.finishId)
                    ])
                    .select(item => ({
                        id: item.id,
                        dueDate: item.dueDate
                      })
                    ).singleAsync();

                  const startPussItemQuantity = await db.pushProcessItem
                    .where(item => [
                      sorm.equal(item.pushProcessId, finishPussInfo!.id)
                    ])
                    .select(item => ({
                      totalQuantity: sorm.sum(sorm.ifNull(item.weight, 0))
                    }))
                    .singleAsync();
                  const lastPussItemQuantity = (diff.target!.processPushItems && diff.target!.processPushItems!.sum(item => item.productionWeight || 0)) || 0;
                  const totalQuantity = (startPussItemQuantity ? startPussItemQuantity!.totalQuantity : 0)! + lastPussItemQuantity!;

                  const startDate = diff.target!.dueDate;
                  const lastDate = finishPussInfo!.dueDate;

                  const productionInfo = await db.production
                    .where(item => [
                      sorm.notNull(item.firstModifiedAtDateTime),
                      sorm.between(item.firstModifiedAtDateTime!, startDate, lastDate),
                      sorm.equal(item.equipmentId, diff.target!.equipmentId),
                      sorm.equal(item.isCanceled, false)
                    ])
                    .select(item => ({
                      id: item.id
                    }))
                    .resultAsync();

                  if (productionInfo && productionInfo.length > 0) {
                    const lossQuantity = isNaN(totalQuantity / productionInfo.length) ? 0 : Number((totalQuantity / productionInfo.length).toFixed(2));

                    if (lossQuantity !== 0) {
                      for (const productionItem of productionInfo) {
                        await db.production
                          .where(item => [
                            sorm.equal(item.id, productionItem.id)
                          ])
                          .updateAsync(
                            () => ({
                              pushLoss: lossQuantity
                            })
                          );
                      }
                    }
                  }
                }
              }
              else {
                const startPussInfo = await db.pushProcess
                  .where(item => [
                    sorm.equal(item.id, diff.target!.startId)
                  ])
                  .select(item => ({
                      id: item.id,
                      dueDate: item.dueDate
                    })
                  ).singleAsync();

                const startPussItemQuantity = await db.pushProcessItem
                  .where(item => [
                    sorm.equal(item.pushProcessId, startPussInfo!.id)
                  ])
                  .select(item => ({
                    totalQuantity: sorm.sum(sorm.ifNull(item.weight, 0))
                  }))
                  .singleAsync();
                const lastPussItemQuantity = (diff.target!.processPushItems && diff.target!.processPushItems!.sum(item => item.productionWeight || 0) || 0);
                const totalQuantity = (startPussItemQuantity ? startPussItemQuantity!.totalQuantity : 0)! + lastPussItemQuantity;

                const startDate = startPussInfo!.dueDate;
                const lastDate = diff.target!.dueDate;

                const productionInfo = await db.production
                  .where(item => [
                    sorm.notNull(item.firstModifiedAtDateTime),
                    sorm.between(item.firstModifiedAtDateTime!, startDate, lastDate),
                    sorm.equal(item.equipmentId, diff.target!.equipmentId),
                    sorm.equal(item.isCanceled, false)
                  ])
                  .select(item => ({
                    id: item.id
                  }))
                  .resultAsync();

                if (productionInfo && productionInfo.length > 0) {
                  const lossQuantity = isNaN(totalQuantity / productionInfo.length) ? 0 : Number((totalQuantity / productionInfo.length).toFixed(2));

                  if (lossQuantity !== 0) {
                    for (const productionItem of productionInfo) {
                      await db.production
                        .where(item => [
                          sorm.equal(item.id, productionItem.id)
                        ])
                        .updateAsync(
                          () => ({
                            pushLoss: lossQuantity
                          })
                        );
                    }
                  }
                }
              }

            }

            for (const processPushItem of isProcessPushChanged || []) {
              if (!processPushItem.target!.id) {
                // const documentCode = await CodeProc.getDocumentCode(db, this._appData.authInfo!.companyId, this._appData.authInfo!.employeeId, processPushItem.target!.productionGoodsId!, "산출", undefined, undefined);
                const lotInfo = processPushItem.target!.productionType !== "폐기" ?
                  processPushItem.target!.productionType === "재생" ?  await CodeProc.getLotCode2(db, this._appData.authInfo!.companyId, this._appData.authInfo!.employeeId, processPushItem.target!.warehouseId!,
                    processPushItem.target!.productionGoodsId!, processPushItem.target!.productionGoodsName!, "L1") :
                    await CodeProc.getLotCode2(db, this._appData.authInfo!.companyId, this._appData.authInfo!.employeeId, processPushItem.target!.warehouseId!,
                      processPushItem.target!.productionGoodsId!, processPushItem.target!.productionGoodsName!, "L3") : undefined;

                const newProcessPushItem = await db.pushProcessItem
                  .insertAsync({
                    companyId: this._appData.authInfo!.companyId,
                    pushProcessId: diff.target!.id!,
                    productionType: processPushItem.target!.productionType,
                    goodId: processPushItem.target!.productionGoodsId!,
                    lotId: lotInfo ? lotInfo.lotId! : undefined,
                    weight: processPushItem.target!.productionWeight,
                    warehouseId: processPushItem.target!.warehouseId,
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: this._appData.authInfo!.employeeId
                  });
                processPushItem.target!.id = newProcessPushItem.id;
                processPushItem.target!.productionLotName = lotInfo ? lotInfo.lotName : undefined;

                if (processPushItem.target!.productionType !== "폐기") {
                  await StockProc.modifyStock(db, this._appData.authInfo!.companyId, processPushItem.target!.productionGoodsId!, processPushItem.target!.productionWeight, lotInfo!.lotId!, processPushItem.target!.warehouseId, "+", processPushItem.target!.productionGoodRating!);
                  await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, processPushItem.target!.productionGoodsId!, processPushItem.target!.productionWeight, "+");
                }
              }
              else {
                await db.pushProcessItem
                  .where(item => [
                    sorm.equal(item.id, processPushItem.target!.id)
                  ])
                  .updateAsync(
                    () => ({
                      weight: processPushItem.target!.productionWeight
                    })
                  );

                if (processPushItem.target!.productionType !== "폐기") {
                  await StockProc.modifyStock(db, this._appData.authInfo!.companyId, processPushItem.target!.productionGoodsId!, processPushItem.source!.productionWeight, processPushItem.target!.productionLotId!, processPushItem.target!.warehouseId, "-", processPushItem.target!.productionGoodRating!);
                  await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, processPushItem.target!.productionGoodsId!, processPushItem.source!.productionWeight, "-");
                  await StockProc.modifyStock(db, this._appData.authInfo!.companyId, processPushItem.target!.productionGoodsId!, processPushItem.target!.productionWeight, processPushItem.target!.productionLotId!, processPushItem.target!.warehouseId, "+", processPushItem.target!.productionGoodRating!);
                  await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, processPushItem.target!.productionGoodsId!, processPushItem.target!.productionWeight, "+");

                }
              }
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

        this.items = await queryable
          .orderBy(item => item.id)
          .limit(this.pagination.page * 50, 50)
          .wrap(PushProcess)
          .include(item => item.employee)
          .include(item => item.inputGoods)
          .include(item => item.inputLot)
          .include(item => item.equipment)
          .include(item => item.pushProcessItems)
          .include(item => item.pushProcessItems![0].lot)
          .include(item => item.pushProcessItems![0].goods)
          .include(item => item.pushProcessItems![0].warehouse)
          .join(
            PushProcessItem,
            "pushProcessItemInfo",
            (qb, en) => qb
              .where(item => [
                sorm.equal(item.pushProcessId, en.id)
              ])
              .select(item => ({
                quantity: sorm.sum(sorm.ifNull(item.weight, 0))
              })),
            true
          )
          .select(item => ({
            id: item.id,
            dueDate: item.dueDate,
            type: item.type,
            inputGoodId: item.inputGoodsId,
            inputGoodName: item.inputGoods!.name,
            inputGoodSpecification: item.inputGoods!.specification,
            inputGoodRating: item.inputLot!.goodsRating,
            inputLotId: item.inputLotId,
            inputLotName: item.inputLot!.lot,
            inputWeight: item.inputWeight,
            inputWarehouseId: item.inputWarehouseId,
            startId: item.startId,
            finishId: item.finishId,
            productionTotalWeight: sorm.ifNull(item.pushProcessItemInfo!.quantity, 0),
            equipmentId: item.equipmentId,
            equipmentName: item.equipment!.name,
            createdByEmployeeId: item.createdByEmployeeId,
            createdByEmployeeName: item.employee!.name,
            createdAtDateTime: item.createdAtDateTime,

            processPushItems: item.pushProcessItems && item.pushProcessItems.map(item1 => ({
              id: item1.id,
              productionType: item1.productionType,
              productionGoodsId: item1.goodId,
              productionGoodsName: item1.goods!.name,
              specification: item1.goods!.specification,
              productionLotId: item1.lotId,
              productionLotName: item1.lot!.lot,
              productionGoodRating: item1.lot!.goodsRating,
              productionWeight: item1.weight,
              warehouseId: item1.warehouseId,
              warehouseName: item1.warehouse!.name
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

  private _getSearchQueryable(db: MainDbContext): Queryable<PushProcess> {
    let queryable = db.pushProcess
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);

    if (this.lastFilter!.type) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.type, this.lastFilter!.type)
        ]);
    }

    if (this.lastFilter!.productionType) {
      queryable = queryable
        .include(item => item.pushProcessItems)
        .where(item => [
          sorm.equal(item.pushProcessItems![0].productionType, this.lastFilter!.productionType)
        ]);
    }

    if (this.lastFilter!.inputLot) {
      queryable = queryable
        .include(item => item.inputLot)
        .where(item => [
          sorm.includes(item.inputLot!.lot, this.lastFilter!.inputLot)
        ]);
    }

    if (this.lastFilter!.productionLot) {
      queryable = queryable
        .include(item => item.pushProcessItems)
        .include(item => item.pushProcessItems![0].lot)
        .where(item => [
          sorm.includes(item.pushProcessItems![0].lot!.lot, this.lastFilter!.productionLot)
        ]);
    }

    if (this.lastFilter!.goodName) {
      queryable = queryable
        .include(item => item.inputGoods)
        .where(item => [
          sorm.includes(item.inputGoods!.name, this.lastFilter!.goodName)
        ]);
    }

    if (this.lastFilter!.specification) {
      queryable = queryable
        .include(item => item.inputGoods)
        .where(item => [
          sorm.includes(item.inputGoods!.specification, this.lastFilter!.specification)
        ]);
    }

    return queryable;
  }

  public async onBarcodePrintButtonClick(): Promise<void> {
    alert("개발 중 입니다.");
  }

}

interface IFilterVM {
  type?: "시작" | "종료";
  productionType?: "재생" | "판매" | "폐기";
  goodName?: string;
  specification?: string;
  inputLot?: string;
  productionLot?: string;
}

interface IProcessPushVM {
  id: number | undefined;
  dueDate: DateTime | undefined;
  type: "시작" | "종료";
  inputGoodId: number | undefined;
  inputGoodName: string | undefined;
  inputGoodSpecification: string | undefined;
  inputGoodRating: "A" | "B" | "C" | "공통" | undefined;
  inputLotId: number | undefined;
  inputLotName: string | undefined;
  inputWeight: number | undefined;
  inputWarehouseId: number | undefined;
  productionTotalWeight: number | undefined;
  startId: number | undefined;
  finishId: number | undefined;
  equipmentId: number | undefined;
  equipmentName: string | undefined;
  createdByEmployeeId: number | undefined;
  createdByEmployeeName: string | undefined;
  createdAtDateTime: DateTime | undefined;

  processPushItems: IProcessPushItemVM[] | undefined;
}

interface IProcessPushItemVM {
  id: number | undefined;
  productionType: "재생" | "판매" | "폐기";
  productionGoodsId: number | undefined;
  productionGoodsName: string | undefined;
  specification: string | undefined;
  productionGoodRating: "A" | "B" | "C" | "공통" | undefined;
  productionLotId: number | undefined;
  productionLotName: string | undefined;
  productionWeight: number | undefined;
  warehouseId: number | undefined;
  warehouseName: string | undefined;
}

//TODO: 필요 시 생산 항목 올라 올때 저장창고 지정하도록 변경