import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnInit} from "@angular/core";
import {GoodsSearchModal} from "../../modals/GoodsSearchModal";
import {SdDomValidatorProvider, SdModalProvider, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {GoodsGroup, GoodsInspection, MainDbContext} from "@sample/main-database";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
import {AppDataProvider} from "@sample/client-common";
import {ProductionInfoEquipmentModal} from "../../modals/ProductionInfoEquipmentModal";
import {DateTime} from "@simplism/core";
import {ShowManualModal} from "../../modals/ShowManualModal";

@Component({
  selector: "app-goods-group",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>제품 그룹 정보</h4>
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
              <sd-form-item [label]="'그룹명'">
                <sd-textfield [(value)]="filter.groupName"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'품목명'">
                <sd-textfield [(value)]="filter.productionGoodName"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'규격'">
                <sd-textfield [(value)]="filter.productionSpecification"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'사용중지 제외'">
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
              <sd-sheet #sheet [id]="'production-info'"
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
                <sd-sheet-column [header]="'생산(양/단면)'" [width]="100">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.bothSides">
                      <sd-select-item [value]="true">양면</sd-select-item>
                      <sd-select-item [value]="false">단면</sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'그룹명'">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.groupName"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'설비'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="overflow: hidden;">
                      <div style="display: inline-block;">
                        <a (click)="productionInfoEquipmentModalOpenButtonClick(item)">
                          {{ item.equipmentIds }}
                        </a>
                        <a (click)="productionInfoEquipmentModalOpenButtonClick(item)">
                          <sd-icon [fixedWidth]="true" [icon]="'search'"
                                   *ngIf="!!item.id && !item.equipmentIds"></sd-icon>
                        </a>
                      </div>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'사용중지'" [width]="60">
                  <ng-template #item let-item="item">
                    <div style="text-align: center;">
                      <sd-checkbox [(value)]="item.isDisabled"></sd-checkbox>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'반영'" [width]="60">
                  <ng-template #item let-item="item">
                    <div style="padding-left: 20%;">
                      <sd-button (click)="onReflectionButtonClick(item)" [disabled]="item.isDisabled"> 반영</sd-button>
                    </div>
                  </ng-template>
                </sd-sheet-column>
              </sd-sheet>

              <sd-dock [position]="'bottom'" style="height: 40%" *ngIf="selectedItem"
                       [id]="'goods-group-info'">
                <sd-busy-container [busy]="selectedItemBusyCount > 0">
                  <sd-dock-container class="sd-background-default">
                    <sd-dock class="sd-padding-xs-sm">
                      <h5 style="display: inline-block; padding-right: 1.4em;">QC 검사 항목</h5>
                      <!-- <sd-button [size]="'sm'" (click)="onCopyGoodInspectionButtonClick()" [inline]="true">
                         <sd-icon [icon]="'copy'" [fixedWidth]="true"></sd-icon>
                         QC검사 항목 복사
                       </sd-button>-->
                    </sd-dock>

                    <sd-pane>
                      <sd-sheet [id]="'goods-group-quality-check'"
                                [items]="selectedItem.qualityCheckList"
                                [trackBy]="trackByIdFn"
                                [(selectedItem)]="selectedChart"
                                [selectable]="true">
                        <sd-sheet-column [header]="'검수 항목'">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm">
                              {{ item.name }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'시험방법'">
                          <ng-template #item let-item="item">
                            <sd-textfield [(value)]="item.testType"></sd-textfield>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'단위'">
                          <ng-template #item let-item="item">
                            <sd-textfield [(value)]="item.unit"></sd-textfield>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'규격'">
                          <ng-template #item let-item="item">
                            <sd-textfield [(value)]="item.specification"></sd-textfield>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'사용여부'" [width]="60">
                          <ng-template #item let-item="item">
                            <div style="text-align: center;">
                              <sd-checkbox [(value)]="item.isCheck"
                                           (valueChange)="onQualityCheckChange(item)"></sd-checkbox>
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'Xbar R 차트 기준'" [width]="110">
                          <ng-template #item let-item="item">
                            <div style="text-align: center;">
                              <sd-checkbox [(value)]="item.isUsingChart" [disabled]="!item.isCheck"
                                           (valueChange)="onUsingChartChange(item)"></sd-checkbox>
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                      </sd-sheet>
                    </sd-pane>
                    <sd-dock [position]="'right'"
                             [id]="'goods-group-production'"
                             *ngIf="selectedChart && selectedChart.isCheck && selectedChart.chartInfo">
                      <div style="display: inline-block">
                        <sd-form style="margin-top: 10px; margin-bottom: 10px; margin-left: 10px;">
                          <sd-form-item [label]="'최소값'">
                            <sd-textfield [(value)]="selectedChart.chartInfo.min"></sd-textfield>
                          </sd-form-item>
                          <sd-form-item [label]="'평균값'">
                            <sd-textfield [(value)]="selectedChart.chartInfo.avg"></sd-textfield>
                          </sd-form-item>
                          <sd-form-item [label]="'최대값'">
                            <sd-textfield [(value)]="selectedChart.chartInfo.max"></sd-textfield>
                          </sd-form-item>
                        </sd-form>
                      </div>
                      <div style="display: inline-block">
                        <sd-form style="margin-top: 10px; margin-bottom: 10px; margin-left: 10px;">
                          <sd-form-item [label]="'표준편차 최소값'">
                            <sd-textfield [(value)]="selectedChart.chartInfo.standardDeviationMin"></sd-textfield>
                          </sd-form-item>
                          <sd-form-item [label]="'표준편차 평균값'">
                            <sd-textfield [(value)]="selectedChart.chartInfo.standardDeviationAvg"></sd-textfield>
                          </sd-form-item>
                          <sd-form-item [label]="'표준편차 최대값'">
                            <sd-textfield [(value)]="selectedChart.chartInfo.standardDeviationMax"></sd-textfield>
                          </sd-form-item>
                        </sd-form>
                      </div>
                    </sd-dock>
                  </sd-dock-container>
                </sd-busy-container>
              </sd-dock>

              <sd-dock [position]="'right'" *ngIf="selectedItem" [id]="'goods-group-info-item'"
                       style="width: 35%">
                <sd-dock-container class="sd-background-default">
                  <sd-pane>
                    <sd-dock-container>
                      <sd-dock class="sd-padding-xs-sm">
                        <h5 style="display: inline-block; padding-right: 1.4em;">산출 품목</h5>
                        <sd-button [size]="'sm'" (click)="onAddProductionGoodButtonClick()" [inline]="true">
                          <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
                          행 추가
                        </sd-button>
                        &nbsp;
                        <!--<sd-button [size]="'sm'" (click)="onCopyGoodProductionButtonClick()" [inline]="true">
                          <sd-icon [icon]="'copy'" [fixedWidth]="true"></sd-icon>
                          산출 품목 복사
                        </sd-button>-->
                      </sd-dock>

                      <sd-pane>
                        <sd-sheet [id]="'goods-group-production-goods'"
                                  [items]="selectedItem.productionGoods"
                                  [trackBy]="trackByMeFn">
                          <sd-sheet-column [header]="'구분'" [width]="80">
                            <ng-template #item let-item="item">
                              <sd-select [(value)]="item.type">
                                <sd-select-item [value]="'재생'">재생</sd-select-item>
                                <sd-select-item [value]="'판매'">판매</sd-select-item>
                              </sd-select>
                            </ng-template>
                          </sd-sheet-column>
                          <sd-sheet-column [header]="'제품구분'">
                            <ng-template #item let-item="item">
                              <div class="sd-padding-xs-sm">
                                {{ item.goodType }}
                              </div>
                            </ng-template>
                          </sd-sheet-column>
                          <sd-sheet-column [header]="'분류'">
                            <ng-template #item let-item="item">
                              <div class="sd-padding-xs-sm">
                                {{ item.goodCategory }}
                              </div>
                            </ng-template>
                          </sd-sheet-column>
                          <sd-sheet-column [header]="'제품명'">
                            <ng-template #item let-item="item">
                              <div class="sd-padding-xs-sm">
                                {{ item.goodName }}
                                <a (click)="productionGoodsSearchModalOpenButtonClick(item)">
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
                          <sd-sheet-column [header]="'삭제'" [width]="60">
                            <ng-template #item let-item="item">
                              <div class="sd-padding-xs-sm" style="text-align: center;">
                                <a *ngIf="!item.id" (click)="onRemoveItemProductionGoodButtonClick(item)">
                                  <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                                </a>
                                <a *ngIf="!!item.id" (click)="onCompletelyRemoveItemProductionGoodButtonClick(item)">
                                  <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                                </a>
                              </div>
                            </ng-template>
                          </sd-sheet-column>
                        </sd-sheet>
                      </sd-pane>
                    </sd-dock-container>
                  </sd-pane>
                </sd-dock-container>
              </sd-dock>
              <sd-dock [position]="'right'" *ngIf="selectedItem" [id]="'goods-group-item'"
                       style="width: 25%">
                <sd-dock-container class="sd-background-default">
                  <sd-pane>
                    <sd-dock-container>
                      <sd-dock class="sd-padding-xs-sm">
                        <h5 style="display: inline-block; padding-right: 1.4em;">그룹별 품목</h5>
                        <sd-button [size]="'sm'" (click)="goodsGroupGoodsSearchModalOpenButtonClick()" [inline]="true">
                          <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
                          행 추가
                        </sd-button>
                      </sd-dock>

                      <sd-pane>
                        <sd-sheet [id]="'goods-group-item-goods'"
                                  [items]="selectedItem.goodsGroupItems"
                                  [trackBy]="trackByMeFn">
                          <sd-sheet-column [header]="'제품명'">
                            <ng-template #item let-item="item">
                              <div class="sd-padding-xs-sm">
                                {{ item.goodName }}
                                <a (click)="productionGoodsSearchModalOpenButtonClick(item)">
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
                          <sd-sheet-column [header]="'삭제'" [width]="60">
                            <ng-template #item let-item="item">
                              <div class="sd-padding-xs-sm" style="text-align: center;">
                                <a (click)="onRemoveGoodsGroupItemButtonClick(item)">
                                  <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                                </a>
                              </div>
                            </ng-template>
                          </sd-sheet-column>
                        </sd-sheet>
                      </sd-pane>
                    </sd-dock-container>
                  </sd-pane>
                </sd-dock-container>
              </sd-dock>
            </sd-dock-container>
          </sd-busy-container>
        </sd-dock-container>
      </sd-topbar-container>
    </sd-busy-container>`

})
export class GoodsGroupPage implements OnInit {
  public filter: IFilterVM = {
    groupName: undefined,
    productionGoodName: undefined,
    productionSpecification: undefined,
    isDisabled: false
  };

  public lastFilter?: IFilterVM;

  public pagination = {page: 0, length: 0};

  public items: IGoodsGroupInfoVM[] = [];
  public orgItems: IGoodsGroupInfoVM[] = [];

  public selectedItem?: IGoodsGroupInfoVM;
  public selectedChart?: IQualityListVM;

  public viewBusyCount = 0;
  public mainBusyCount = 0;
  public selectedItemBusyCount = 0;

  public goodsList: {
    id: number;
    name: string;
    isDisabled: boolean;
  }[] = [];


  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public constructor(private readonly _modal: SdModalProvider,
                     private readonly _orm: SdOrmProvider,
                     private readonly _appData: AppDataProvider,
                     private readonly _elRef: ElementRef<HTMLElement>,
                     private readonly _domValidator: SdDomValidatorProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _cdr: ChangeDetectorRef) {
  }

  public async ngOnInit(): Promise<void> {
    this.mainBusyCount++;

    await this._orm.connectAsync(MainDbContext, async db => {
      this.goodsList = await db.goods
        .where(item => [
          sorm.equal(item.companyId, this._appData.authInfo!.companyId),
          sorm.includes(item.specification, "자재"),
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
    const result = await this._modal.show(ShowManualModal, "제품 그룹(생산) 메뉴얼", {type: "goods-group"});
    if (!result) return;

    this._cdr.markForCheck();
  }

  public onAddItemButtonClick(): void {
    this.items.insert(0, {
      id: undefined,
      bothSides: true,
      groupName: undefined,
      equipmentIds: undefined,
      isDisabled: false,

      goodsGroupItems: undefined,
      qualityCheckList: undefined,
      productionGoods: undefined
    });
  }

  public onRemoveItemButtonClick(item: IGoodsGroupInfoVM): void {
    this.items.remove(item);

    if (this.selectedItem === item) {
      this.selectedItem = undefined;
    }
  }

  public async goodsGroupGoodsSearchModalOpenButtonClick(): Promise<void> {
    this.selectedItem!.goodsGroupItems = this.selectedItem!.goodsGroupItems || [];

    const result = await this._modal.show(GoodsSearchModal, "그룹별 품목 검색", {isMulti: true});
    if (!result) return;

    for (const resultItem of result || []) {
      if (this.selectedItem!.goodsGroupItems!.filter(item => item.goodId === resultItem.id).length < 1) {
        this.selectedItem!.goodsGroupItems!.insert(0, {
          id: undefined,
          goodId: resultItem!.id,
          goodName: resultItem.name,
          specification: resultItem.specification
        });
      }
    }

    this._cdr.markForCheck();
  }

  public async onRemoveGoodsGroupItemButtonClick(item: IGoodsGroupItemVM): Promise<void> {
    if (!!item.id) {
      if (!confirm("삭제할 경우 다시 추가해야 합니다.\n삭제하시겠습니까?")) return;

      await this._orm.connectAsync(MainDbContext, async db => {
        await db.goodsGroupItem.where(item1 => [sorm.equal(item1.id, item.id)]).deleteAsync();
      });
    }
    this.selectedItem!.goodsGroupItems!.remove(item);

    this._cdr.markForCheck();
  }

  public async onAddProductionGoodButtonClick(item: IProductionGoodsVM): Promise<void> {
    this.selectedItem!.productionGoods = this.selectedItem!.productionGoods || [];

    const result = await this._modal.show(GoodsSearchModal, "품목 검색", {isMulti: true});
    if (!result) return;

    for (const productionGoods of result || []) {
      this.selectedItem!.productionGoods!.insert(0, {
        id: undefined,
        type: "재생",
        goodId: productionGoods.id,
        goodType: productionGoods.type,
        goodCategory: productionGoods.category,
        goodName: productionGoods.name,
        specification: productionGoods.specification
      });
      this._cdr.markForCheck();
    }
  }

  public async onRemoveItemProductionGoodButtonClick(item: IProductionGoodsVM): Promise<void> {
    this.selectedItem!.productionGoods!.remove(item);
    this._cdr.markForCheck();
  }

  public async onCompletelyRemoveItemProductionGoodButtonClick(item: IProductionGoodsVM): Promise<void> {
    if (!!item.id) {
      if (!confirm("삭제할 경우 다시 추가해야 합니다.\n삭제하시겠습니까?")) return;

      await this._orm.connectAsync(MainDbContext, async db => {
        await db.goodsGroupProductionGoods.where(item1 => [sorm.equal(item1.id, item.id)]).deleteAsync();
      });
    }
    this.selectedItem!.productionGoods!.remove(item);

    this._cdr.markForCheck();
  }

  public async _getProductionGoodInfo(goodId: number): Promise<Number | undefined> {
    let result: number | undefined;
    await this._orm.connectAsync(MainDbContext, async db => {
      result = await db.productionInfo
        .where(item => [sorm.equal(item.goodId, goodId)])
        .countAsync();
    });

    return result;
  }

  public async productionGoodsSearchModalOpenButtonClick(item: IProductionGoodsVM): Promise<void> {
    const result = await this._modal.show(GoodsSearchModal, "품목 검색", {isMulti: false});
    if (!result) return;

    item.goodId = result.id;
    item.goodType = result.type;
    item.goodCategory = result.category;
    item.goodName = result.name;
    item.specification = result.specification;

    this._cdr.markForCheck();
  }

  public async productionInfoEquipmentModalOpenButtonClick(item: IProductionGoodsVM): Promise<void> {
    const result = await this._modal.show(ProductionInfoEquipmentModal, "제품그룹별 설비", {
      goodGroupId: item.id
    });
    if (!result) return;

    await this._search();
    this._cdr.markForCheck();
  }

  public async onQualityCheckChange(item: IQualityListVM): Promise<void> {
    if (item.isCheck) {
      item.chartInfo = item.chartInfo || {
        id: undefined,
        inspectionTypeId: item.id,
        inspectionTypeName: item.name,
        isCheck: true,
        isUsingChart: true,
        min: undefined,
        avg: undefined,
        max: undefined,
        standardDeviationMin: undefined,
        standardDeviationAvg: undefined,
        standardDeviationMax: undefined
      };
    }
    else {
      item.isUsingChart = false;
    }
    this._cdr.markForCheck();
  }

  public async onUsingChartChange(item: IQualityListVM): Promise<void> {
    this.selectedItem!.qualityCheckList = this.selectedItem!.qualityCheckList || [];
    if (item.isUsingChart) {
      this.selectedItem!.qualityCheckList!.forEach(item1 => item1.isUsingChart = false);
      item.isUsingChart = true;

      item.chartInfo = item.chartInfo || {
        id: undefined,
        inspectionTypeId: item.id,
        inspectionTypeName: item.name,
        isCheck: true,
        isUsingChart: true,
        min: undefined,
        avg: undefined,
        max: undefined,
        standardDeviationMin: undefined,
        standardDeviationAvg: undefined,
        standardDeviationMax: undefined
      };
    }

    this._cdr.markForCheck();
  }

  public async onChangeGroupName(item: IGoodsGroupInfoVM): Promise<boolean | undefined> {
    const goodGroupInfo = await this._getGoodsGroupInfo(item.groupName!);

    if (this.items.some(item1 => item !== item1 && item1.groupName === item.groupName) || !!goodGroupInfo) {
      return true;
    }

    this._cdr.markForCheck();
  }

  private async _getGoodsGroupInfo(name: string): Promise<number | undefined> {
    let countResult: number | undefined;
    await this._orm.connectAsync(MainDbContext, async db => {
      countResult = await db.goodsGroup.where(item => [sorm.equal(item.groupName, name)]).countAsync();
    });

    return countResult;
  }

  public async onSelectedItemChanged(item: IGoodsGroupInfoVM): Promise<void> {
    await this._selectItem(item);
    this._cdr.markForCheck();
  }

  private async _selectItem(item: IGoodsGroupInfoVM | undefined): Promise<void> {
    this.selectedItem = item;
    if (item && !item.qualityCheckList) {
      this.selectedItemBusyCount++;

      await this._orm.connectAsync(MainDbContext, async db => {
        // 검사 항목 가져오기
        const result = await db.baseType
          .where(item1 => [
            sorm.equal(item1.companyId, this._appData.authInfo!.companyId),
            sorm.equal(item1.type, "품질 검사항목"),
            sorm.equal(item1.isDisabled, false)
          ])
          .join(
            GoodsInspection,
            "goodsInspectionInfo",
            (qb, en) => qb
              .include(item1 => item1.inspection)
              .where(item1 => [
                sorm.notNull(item1.goodsGroupId),
                sorm.equal(item1.goodsGroupId, this.selectedItem!.id),
                sorm.equal(item1.inspectionId, en.id)
              ])
              .select(item1 => ({
                id: item1.id,
                inspectionTypeId: item1.inspectionId,
                inspectionTypeName: item1.inspection!.name,
                testType: item1.testType,
                unit: item1.unit,
                specification: item1.specification,
                isCheck: true,
                isUsingChart: item1.isUsingChart,
                min: item1.min,
                avg: item1.avg,
                max: item1.max,
                standardDeviationMin: item1.standardDeviationMin,
                standardDeviationAvg: item1.standardDeviationAvg,
                standardDeviationMax: item1.standardDeviationMax
              })),
            true
          )
          .select(item1 => ({
            id: item1.id,
            name: item1.name,
            isCheck: sorm.cast(sorm.notNull(item1.goodsInspectionInfo!.id), Boolean),
            isUsingChart: sorm.cast(sorm.ifNull(item1.goodsInspectionInfo!.isUsingChart, false), Boolean),
            testType: item1.goodsInspectionInfo!.testType,
            unit: item1.goodsInspectionInfo!.unit,
            specification: item1.goodsInspectionInfo!.specification,
            chartInfo: item1.goodsInspectionInfo
          }))
          .resultAsync();

        item.qualityCheckList = [];
        this.selectedChart = undefined;

        for (const inspectionItem of result || []) {
          item.qualityCheckList!.push({
            id: inspectionItem.id,
            name: inspectionItem.name,
            testType: inspectionItem.testType,
            unit: inspectionItem.unit,
            specification: inspectionItem.specification,
            isCheck: inspectionItem.isCheck,
            isUsingChart: inspectionItem.isUsingChart,
            chartInfo: inspectionItem.chartInfo && inspectionItem.chartInfo
          });
        }

        if (!!item.id && this.orgItems.some(item1 => item1.id === item.id)) {
          const orgItem = this.orgItems.filter(item1 => item1.id === item.id).single()!;
          orgItem.qualityCheckList = [];

          for (const inspectionItem of result || []) {
            orgItem.qualityCheckList!.push({
              id: inspectionItem.id,
              name: inspectionItem.name,
              testType: inspectionItem.testType,
              unit: inspectionItem.unit,
              specification: inspectionItem.specification,
              isCheck: inspectionItem.isCheck,
              isUsingChart: inspectionItem.isUsingChart,
              chartInfo: inspectionItem.chartInfo
            });
          }
        }
      });


      this.selectedItemBusyCount--;
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

  public async onReflectionButtonClick(item: IGoodsGroupInfoVM): Promise<void> {
    //반드시 저장 후 진행해야 함
    if (!item.id) {
      this._toast.danger("저장 후 진행해 주세요");
      return;
    }
    await this._reflection(item);
    this._cdr.markForCheck();
  }

  private async _reflection(goodsGroupInfo: IGoodsGroupInfoVM): Promise<void> {
    this.viewBusyCount++;

    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        const result = await db.baseType
          .where(item1 => [
            sorm.equal(item1.companyId, this._appData.authInfo!.companyId),
            sorm.equal(item1.type, "품질 검사항목"),
            sorm.equal(item1.isDisabled, false)
          ])
          .join(
            GoodsInspection,
            "goodsInspectionInfo",
            (qb, en) => qb
              .include(item1 => item1.inspection)
              .where(item1 => [
                sorm.notNull(item1.goodsGroupId),
                sorm.equal(item1.goodsGroupId, this.selectedItem!.id),
                sorm.equal(item1.inspectionId, en.id)
              ])
              .select(item1 => ({
                id: item1.id,
                inspectionTypeId: item1.inspectionId,
                inspectionTypeName: item1.inspection!.name,
                testType: item1.testType,
                unit: item1.unit,
                specification: item1.specification,
                isCheck: true,
                isUsingChart: item1.isUsingChart,
                min: item1.min,
                avg: item1.avg,
                max: item1.max,
                standardDeviationMin: item1.standardDeviationMin,
                standardDeviationAvg: item1.standardDeviationAvg,
                standardDeviationMax: item1.standardDeviationMax
              })),
            true
          )
          .select(item1 => ({
            id: item1.id,
            name: item1.name,
            isCheck: sorm.cast(sorm.notNull(item1.goodsInspectionInfo!.id), Boolean),
            isUsingChart: sorm.cast(sorm.ifNull(item1.goodsInspectionInfo!.isUsingChart, false), Boolean),
            testType: item1.goodsInspectionInfo!.testType,
            unit: item1.goodsInspectionInfo!.unit,
            specification: item1.goodsInspectionInfo!.specification,
            chartInfo: item1.goodsInspectionInfo
          }))
          .resultAsync();

        goodsGroupInfo.qualityCheckList = [];
        this.selectedChart = undefined;

        for (const inspectionItem of result || []) {
          goodsGroupInfo.qualityCheckList!.push({
            id: inspectionItem.id,
            name: inspectionItem.name,
            testType: inspectionItem.testType,
            unit: inspectionItem.unit,
            specification: inspectionItem.specification,
            isCheck: inspectionItem.isCheck,
            isUsingChart: inspectionItem.isUsingChart,
            chartInfo: inspectionItem.chartInfo && inspectionItem.chartInfo
          });
        }

        for (const groupGoodItem of goodsGroupInfo.goodsGroupItems || []) {
          if (await this._checkProduct(db, groupGoodItem.goodId!)) {
            throw new Error("품목번호 : " + groupGoodItem.goodId + " 이 현재 생산중입니다. \n생산중인 품목의 생산정보는 수정할 수 없습니다.");
          }
        }

        // 그룹 하위 품목들
        for (const groupGoodItem of goodsGroupInfo.goodsGroupItems || []) {
          // 생산 정보 수정
          const newProductionInfo = await db.productionInfo
            .where(item => [
              sorm.equal(item.goodId, groupGoodItem.goodId)
            ])
            .upsertAsync({
              companyId: this._appData.authInfo!.companyId,
              goodId: groupGoodItem.goodId!,
              bothSides: goodsGroupInfo.bothSides,
              isDisabled: goodsGroupInfo.isDisabled,
              createdByEmployeeId: this._appData.authInfo!.employeeId,
              createdAtDateTime: new DateTime()
            });

          await db.equipmentByGoods.where(item => [sorm.equal(item.goodId, groupGoodItem.goodId)]).deleteAsync();
          const equipmentGroupInfo = await db.equipmentByGoods
            .where(item => [
              sorm.equal(item.goodsGroupId, goodsGroupInfo.id)
            ])
            .select(item => ({
              id: item.id,
              goodId: item.goodId,
              equipmentId: item.equipmentId,
              quantity: item.quantity,
              leadTime: item.leadTime
            }))
            .resultAsync();

          let equipmentSeq = 1;
          for (const equipmetnItem of equipmentGroupInfo || []) {
            await db.equipmentByGoods
              .insertAsync({
                companyId: this._appData.authInfo!.companyId,
                seq: equipmentSeq,
                goodId: groupGoodItem.goodId!,
                productionInfoId: newProductionInfo.id,
                equipmentId: equipmetnItem.equipmentId!,
                quantity: equipmetnItem.quantity,
                leadTime: equipmetnItem.leadTime
              });
            equipmentSeq++;
          }

          let itemLastSeq = await db.goodsProductionGoods.where(item => [sorm.equal(item.productionInfoId, newProductionInfo.id)]).countAsync() || 0;
          itemLastSeq = itemLastSeq + 1;
          for (const productionGoodItem of goodsGroupInfo.productionGoods || []) {
            await db.goodsProductionGoods
              .where(item => [
                sorm.equal(item.goodsGroupId, goodsGroupInfo.id),
                sorm.equal(item.productionInfoGoodId, newProductionInfo.goodId),
                sorm.equal(item.productionGoodId, productionGoodItem.goodId),
                sorm.equal(item.type, productionGoodItem.type)
              ])
              .upsertAsync({
                companyId: this._appData.authInfo!.companyId,
                productionInfoId: newProductionInfo.id,
                productionInfoGoodId: groupGoodItem.goodId,
                goodsGroupId: goodsGroupInfo.id!,
                seq: itemLastSeq,
                type: productionGoodItem.type,
                productionGoodId: productionGoodItem.goodId!
              });
            itemLastSeq++;
          }

          await db.goodsInspection
            .where(item => [
              sorm.equal(item.goodsId, groupGoodItem.goodId)
            ]).deleteAsync();

          if (goodsGroupInfo.qualityCheckList && goodsGroupInfo.qualityCheckList.some(item => item.isCheck)) {
            for (const inspectionItem of goodsGroupInfo.qualityCheckList || []) {
              if (inspectionItem.isCheck) {
                if (!inspectionItem.chartInfo) {
                  inspectionItem.chartInfo = {
                    id: undefined,
                    inspectionTypeId: inspectionItem.id,
                    inspectionTypeName: inspectionItem.name,
                    isCheck: true,
                    isUsingChart: true,
                    min: undefined,
                    avg: undefined,
                    max: undefined,
                    standardDeviationMin: undefined,
                    standardDeviationAvg: undefined,
                    standardDeviationMax: undefined
                  };
                }
                await db.goodsInspection
                  .insertAsync({
                    companyId: this._appData.authInfo!.companyId,
                    goodsId: groupGoodItem.goodId!,
                    productionInfoId: newProductionInfo.id!,
                    inspectionId: inspectionItem.id!,
                    isUsingChart: inspectionItem.isUsingChart,
                    testType: inspectionItem.testType,
                    unit: inspectionItem.unit,
                    specification: inspectionItem.specification,
                    min: inspectionItem.chartInfo!.min,
                    avg: inspectionItem.chartInfo!.avg,
                    max: inspectionItem.chartInfo!.max,
                    standardDeviationMin: inspectionItem.chartInfo!.standardDeviationMin,
                    standardDeviationAvg: inspectionItem.chartInfo!.standardDeviationAvg,
                    standardDeviationMax: inspectionItem.chartInfo!.standardDeviationMax,
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: this._appData.authInfo!.employeeId
                  });
              }
            }
          }
        }
      });
      this._toast.success("반영되었습니다.");
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.viewBusyCount--;

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

    for (const items of this.items || []) {
      for (const item of items.productionGoods || []) {
        if (items.productionGoods!.filter(item1 => (item1.type === item.type && item1.goodId === item.goodId)).length > 1) {
          this._toast.danger("품목 : " + (items.groupName || "") + "의 산출품목에 동일한 구분을 가진 제품이 있습니다.\n확인 후 다시 진행해 주세요.");
          return;
        }
      }
    }
    /*    for (const diffTargetItem of diffTargets) {
          if (!diffTargetItem.goodsGroupItems || diffTargetItem.goodsGroupItems.length < 1) {
            this._toast.danger("그룹에 추가 된 품목이 존재하지 않습니다.\n확인 후 다시 진행해 주세요");
            return;
          }
        }*/
    this.viewBusyCount++;

    try {
      this._domValidator.validate(this._elRef!.nativeElement);

      Object.validatesArray(
        diffTargets,
        `제품 그룹 정보`,
        {
          id: {displayName: "ID", type: Number},
          groupName: {displayName: "그룹명", notnull: true},
          isDisabled: {displayName: "사용중지", type: Boolean, notnull: true}
        }
      );

      await this._orm.connectAsync(MainDbContext, async db => {
        for (const diffItem of diffTargets) {
          // INSERT
          if (!diffItem.id) {
            if (await this.onChangeGroupName(diffItem)) {
              throw new Error("동일한 그룹명이 존재합니다 : " + diffItem.groupName);
            }

            const newGoodsGroupInfo = await db.goodsGroup
              .insertAsync({
                companyId: this._appData.authInfo!.companyId,
                groupName: diffItem.groupName!,
                bothSides: diffItem.bothSides,
                isDisabled: diffItem.isDisabled,
                createdByEmployeeId: this._appData.authInfo!.employeeId,
                createdAtDateTime: new DateTime()
              });
            diffItem.id = newGoodsGroupInfo.id;

            let lastSeq = await db.goodsGroupProductionGoods.where(item => [sorm.equal(item.goodsGroupId, diffItem.id)]).countAsync() || 0;
            lastSeq += lastSeq;
            for (const productionGoodItem of diffItem.productionGoods || []) {
              const newProductionGood = await db.goodsGroupProductionGoods
                .insertAsync({
                  companyId: this._appData.authInfo!.companyId,
                  goodsGroupId: diffItem.id!,
                  seq: lastSeq,
                  type: productionGoodItem.type,
                  productionGoodId: productionGoodItem.goodId!
                });
              productionGoodItem.id = newProductionGood.id;
              lastSeq++;
            }

            if (diffItem.qualityCheckList && diffItem.qualityCheckList.some(item => item.isCheck)) {
              for (const inspectionItem of diffItem.qualityCheckList || []) {
                if (inspectionItem.isCheck) {
                  if (!inspectionItem.chartInfo) {
                    inspectionItem.chartInfo = {
                      id: undefined,
                      inspectionTypeId: inspectionItem.id,
                      inspectionTypeName: inspectionItem.name,
                      isCheck: true,
                      isUsingChart: true,
                      min: undefined,
                      avg: undefined,
                      max: undefined,
                      standardDeviationMin: undefined,
                      standardDeviationAvg: undefined,
                      standardDeviationMax: undefined
                    };
                  }
                  await db.goodsInspection
                    .insertAsync({
                      companyId: this._appData.authInfo!.companyId,
                      goodsGroupId: diffItem.id!,
                      inspectionId: inspectionItem.id!,
                      isUsingChart: inspectionItem.isUsingChart,
                      testType: inspectionItem.testType,
                      unit: inspectionItem.unit,
                      specification: inspectionItem.specification,
                      min: inspectionItem.chartInfo!.min,
                      avg: inspectionItem.chartInfo!.avg,
                      max: inspectionItem.chartInfo!.max,
                      standardDeviationMin: inspectionItem.chartInfo!.standardDeviationMin,
                      standardDeviationAvg: inspectionItem.chartInfo!.standardDeviationAvg,
                      standardDeviationMax: inspectionItem.chartInfo!.standardDeviationMax,
                      createdAtDateTime: new DateTime(),
                      createdByEmployeeId: this._appData.authInfo!.employeeId
                    });
                }
              }
            }

            for (const groupGoodItem of diffItem.goodsGroupItems || []) {
              await db.goodsGroupItem
                .insertAsync({
                  companyId: this._appData.authInfo!.companyId,
                  goodGroupId: diffItem.id!,
                  goodId: groupGoodItem.goodId!
                });
            }
          }
          // UPDATE
          else {
            await db.goodsGroup
              .where(item => [
                sorm.equal(item.id, diffItem.id)
              ])
              .updateAsync(
                () => ({
                  isDisabled: diffItem.isDisabled,
                  bothSides: diffItem.bothSides,
                  groupName: diffItem.groupName,
                  modifyAtDateTime: new DateTime(),
                  modifyEmployeeId: this._appData.authInfo!.employeeId
                })
              );

            let lastSeq = await db.goodsGroupProductionGoods.where(item => [sorm.equal(item.goodsGroupId, diffItem.id)]).countAsync() || 0;
            lastSeq += lastSeq;
            for (const productionGoodItem of diffItem.productionGoods || []) {
              if (!productionGoodItem.id) {
                const newProductionGood = await db.goodsGroupProductionGoods
                  .insertAsync({
                    companyId: this._appData.authInfo!.companyId,
                    goodsGroupId: diffItem.id!,
                    seq: lastSeq,
                    type: productionGoodItem.type,
                    productionGoodId: productionGoodItem.goodId!
                  });
                productionGoodItem.id = newProductionGood.id;
                lastSeq++;
              }
            }

            await db.goodsInspection
              .where(item => [
                sorm.equal(item.goodsGroupId, diffItem.id)
              ]).deleteAsync();

            if (diffItem.qualityCheckList && diffItem.qualityCheckList.some(item => item.isCheck)) {
              for (const inspectionItem of diffItem.qualityCheckList || []) {
                if (inspectionItem.isCheck) {
                  await db.goodsInspection
                    .insertAsync({
                      companyId: this._appData.authInfo!.companyId,
                      goodsGroupId: diffItem.id!,
                      inspectionId: inspectionItem.id!,
                      isUsingChart: inspectionItem.isUsingChart,
                      testType: inspectionItem.testType,
                      unit: inspectionItem.unit,
                      specification: inspectionItem.specification,
                      min: inspectionItem.chartInfo!.min,
                      avg: inspectionItem.chartInfo!.avg,
                      max: inspectionItem.chartInfo!.max,
                      standardDeviationMin: inspectionItem.chartInfo!.standardDeviationMin,
                      standardDeviationAvg: inspectionItem.chartInfo!.standardDeviationAvg,
                      standardDeviationMax: inspectionItem.chartInfo!.standardDeviationMax,
                      createdAtDateTime: new DateTime(),
                      createdByEmployeeId: this._appData.authInfo!.employeeId
                    });
                }
              }
            }

            for (const groupGoodItem of diffItem.goodsGroupItems || []) {
              await db.goodsGroupItem
                .where(item => [
                  sorm.equal(item.goodGroupId, diffItem.id),
                  sorm.equal(item.goodId, groupGoodItem.goodId)
                ])
                .upsertAsync({
                  companyId: this._appData.authInfo!.companyId,
                  goodGroupId: diffItem.id!,
                  goodId: groupGoodItem.goodId!
                });
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

  private async _checkProduct(db: MainDbContext, goodId: number): Promise<boolean | undefined> {
    const result = await db.production
      .where(item => [
        sorm.and([
          sorm.notEqual(item.status, "생산대기"),
          sorm.notEqual(item.status, "생산완료")
        ])
      ])
      .select(item => ({
        id: item.id,
        goodId: item.goodId,
        equipmentId: item.equipmentId
      }))
      .resultAsync();

    return result ? result.some(item => item.goodId === goodId) : false;
  }

  private async _search(): Promise<void> {
    if (!this.lastFilter) return;

    this.mainBusyCount++;
    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        const queryable = this._getSearchQueryable(db);
        const result = await queryable
          .orderBy(item => item.id)
          .limit(this.pagination.page * 30, 30)
          .wrap(GoodsGroup)
          .include(item => item.goodsGroupItem)
          .include(item => item.goodsGroupItem![0].goods)
          .include(item => item.productionGoods)
          .include(item => item.productionGoods![0].productionGoods)
          .include(item => item.equipment)
          .include(item => item.equipment![0].equipments)
          .select(item => ({
            id: item.id,
            bothSides: item.bothSides,
            groupName: item.groupName,
            equipments: item.equipment && item.equipment!.map(item3 => ({
              equipmentId: item3.equipmentId,
              equipmentName: item3.equipments!.name
            })),
            isDisabled: item.isDisabled,

            goodsGroupGoods: item.goodsGroupItem && item.goodsGroupItem!.map(item1 => ({
              id: item1.id,
              goodId: item1.goodId,
              goodName: item1.goods!.name,
              specification: item1.goods!.specification
            })) || undefined,

            productionGoods: item.productionGoods && item.productionGoods.map(item1 => ({
              id: item1.id,
              type: item1.type,
              goodId: item1.productionGoodId,
              goodType: item1.productionGoods!.type,
              goodCategory: item1.productionGoods!.category,
              goodName: item1.productionGoods!.name,
              specification: item1.productionGoods!.specification
            })) || undefined,

            qualityCheckList: undefined
          }))
          .resultAsync();

        this.items = result.map(item => ({
          id: item.id,
          bothSides: item.bothSides,
          groupName: item.groupName,
          equipmentIds: item.equipments && item.equipments.map(item5 => item5.equipmentName).join(", "),
          isDisabled: item.isDisabled,

          goodsGroupItems: item.goodsGroupGoods && item.goodsGroupGoods!.map(item1 => ({
            id: item1.id,
            goodId: item1.goodId,
            goodName: item1.goodName,
            specification: item1.specification
          })) || undefined,

          productionGoods: item.productionGoods && item.productionGoods!.map(item1 => ({
            id: item1.id,
            type: item1.type,
            goodId: item1.goodId,
            goodType: item1.goodType,
            goodCategory: item1.goodCategory,
            goodName: item1.goodName,
            specification: item1.specification
          })) || undefined,

          qualityCheckList: undefined
        }));

        this.orgItems = Object.clone(this.items);

        if (this.selectedItem) {
          await this._selectItem(this.items.single(item => item.id === this.selectedItem!.id));
        }
        else {
          await this._selectItem(undefined);
        }

        const totalCount = await queryable.countAsync();
        this.pagination.length = Math.ceil(totalCount / 30);
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.mainBusyCount--;
  }

  private _getSearchQueryable(db: MainDbContext): Queryable<GoodsGroup> {
    let queryable = db.goodsGroup
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);

    if (this.lastFilter!.groupName) {
      queryable = queryable
        .where(item => [
          sorm.includes(item.groupName, this.lastFilter!.groupName)
        ]);
    }

    if (this.lastFilter!.productionGoodName) {
      queryable = queryable
        .include(item => item.goodsGroupItem)
        .include(item => item.goodsGroupItem![0].goods)
        .where(item => [
          sorm.includes(item.goodsGroupItem![0].goods!.name, this.lastFilter!.productionGoodName)
        ]);
    }

    if (this.lastFilter!.productionSpecification) {
      queryable = queryable
        .include(item => item.goodsGroupItem)
        .include(item => item.goodsGroupItem![0].goods)
        .where(item => [
          sorm.includes(item.goodsGroupItem![0].goods!.specification, this.lastFilter!.productionSpecification)
        ]);
    }

    if (this.lastFilter!.isDisabled !== false) {
      queryable = queryable.where(item => [
        sorm.notEqual(item.isDisabled, true)
      ]);
    }

    return queryable;
  }
}

interface IFilterVM {
  groupName?: string;
  productionGoodName?: string;
  productionSpecification?: string;
  isDisabled: boolean;
}

interface IGoodsGroupInfoVM {
  id: number | undefined;
  groupName: string | undefined;
  bothSides: boolean | undefined;
  equipmentIds: string | undefined;
  isDisabled: boolean;

  goodsGroupItems: IGoodsGroupItemVM[] | undefined;
  productionGoods: IProductionGoodsVM[] | undefined;
  qualityCheckList: IQualityListVM[] | undefined;
}

interface IGoodsGroupItemVM {
  id: number | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  specification: string | undefined;
}

interface IProductionGoodsVM {
  id: number | undefined;
  type: "재생" | "판매";
  goodId: number | undefined;
  goodType: string | undefined;
  goodCategory: string | undefined;
  goodName: string | undefined;
  specification: string | undefined;
}

interface IQualityListVM {
  id: number | undefined;
  name: string | undefined;
  testType: string | undefined;
  unit: string | undefined;
  specification: string | undefined;
  isCheck: boolean;
  isUsingChart: boolean;

  chartInfo: IQualityCheckVM | undefined;
}

interface IQualityCheckVM {
  id: number | undefined;
  inspectionTypeId: number | undefined;
  inspectionTypeName: string | undefined;
  isCheck: boolean;
  isUsingChart: boolean;
  min: number | undefined;
  avg: number | undefined;
  max: number | undefined;
  standardDeviationMin: number | undefined;
  standardDeviationAvg: number | undefined;
  standardDeviationMax: number | undefined;
}
