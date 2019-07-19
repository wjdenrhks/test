import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnInit
} from "@angular/core";
import {GoodsSearchModal} from "../../modals/GoodsSearchModal";
import {SdDomValidatorProvider, SdModalProvider, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {AppDataProvider} from "@sample/client-common";
import {GoodsBuild, MainDbContext} from "@sample/main-database";
import {DateTime} from "@simplism/core";
import {sorm} from "@simplism/orm-query";
import {Queryable} from "@simplism/orm-client";
import {BomListSearchModal} from "../../modals/BomListSearchModal";
import {RawMaterialCostsViewModal} from "../../modals/RawMaterialCostsViewModal";
import {ShowManualModal} from "../../modals/ShowManualModal";

@Component({
  selector: "app-goods-build-group",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>제품 그룹 정보 (BOM 관리)</h4>

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
              <sd-form-item [label]="'BOM 명칭'">
                <sd-textfield [(value)]="filter.bomName"></sd-textfield>
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
              <sd-sheet #sheet [id]="'goods-build-group'"
                        [items]="items"
                        [trackBy]="trackByIdFn"
                        [(selectedItem)]="selectedItem"
                        (selectedItemChange)="onSelectedChanged($event)"
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
                <sd-sheet-column [header]="'그룹명'">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.groupName"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'사용중지'" [width]="75">
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

              <sd-dock [position]="'bottom'" style="height: 40%"
                       *ngIf="selectedItem && selectedItemList"
                       [id]="'goods-build-group-goods'">
                <sd-busy-container [busy]="selectedItemBusyCount > 0">
                  <sd-dock-container class="sd-background-default">
                    <sd-dock class="sd-padding-xs-sm">
                      <h3 style="display: inline-block; padding-right: 1.4em;">BOM 구성</h3>
                      <sd-button [size]="'sm'" (click)="onCopyGoodBomButtonClick()" [inline]="true">
                        <sd-icon [icon]="'copy'" [fixedWidth]="true"></sd-icon>
                        BOM 복사
                      </sd-button>
                    </sd-dock>

                    <sd-pane>
                      <sd-dock-container class="sd-background-default">
                        <sd-dock class="sd-padding-xs-sm">
                          <h5 style="display: inline-block; padding-right: 1.4em;">외층</h5>

                          <sd-button [size]="'sm'" (click)="onAddGoodBuildGoodOutSideButtonClick()" [inline]="true">
                            <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
                            행 추가
                          </sd-button>
                          &nbsp;
                          <div style="text-align: right; display: inline-block; padding-left: 50%">
                            <h5 style="display: inline-block; padding-right: 1.4em;">총 중량 : </h5>
                            <sd-textfield [(value)]="selectedItemList.outSideTotalWeight"
                                          style="width: 60px; padding-left: 5px; display: inline-block;"
                                          [type]="'number'"
                                          (valueChange)="onChangeOutSideTotalWeight($event)"></sd-textfield>
                          </div>
                        </sd-dock>
                        <sd-pane>
                          <sd-sheet [id]="'goods-build-group-goods-outSide'"
                                    [items]="selectedItemList.outSideList"
                                    [trackBy]="trackByMeFn">
                            <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                              <ng-template #item let-item="item">
                                <div class="sd-padding-xs-sm" style="text-align: center;">
                                  <span *ngIf="item.id">{{ item.seq }}</span>
                                  <a *ngIf="!item.id" (click)="onRemoveItemGoodBuildGoodInSideButtonClick(item)">
                                    <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                                  </a>
                                </div>
                              </ng-template>
                            </sd-sheet-column>
                            <sd-sheet-column [header]="'자재명'">
                              <ng-template #item let-item="item">
                                <div class="sd-padding-xs-sm">
                                  {{ item.goodName }}
                                  <a (click)="outsideGoodsBuildSearchModalOpenButtonClick(item)">
                                    <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                                  </a>
                                </div>
                              </ng-template>
                            </sd-sheet-column>
                            <sd-sheet-column [header]="'배합비'" [width]="70">
                              <ng-template #item let-item="item">
                                <sd-textfield [(value)]="item.mixPercent" [type]="'number'"
                                              (valueChange)="onChangeOutSideMixPercent($event, item)"></sd-textfield>
                              </ng-template>
                            </sd-sheet-column>
                            <sd-sheet-column [header]="'중량'" [width]="60">
                              <ng-template #item let-item="item">
                                <sd-textfield [(value)]="item.weight" [type]="'number'"
                                              (valueChange)="onChangeOutSideWeight($event, item)"></sd-textfield>
                              </ng-template>
                            </sd-sheet-column>
                            <sd-sheet-column [header]="'삭제'" [width]="60">
                              <ng-template #item let-item="item">
                                <div class="sd-padding-xs-sm" style="text-align: center;">
                                  <a *ngIf="!!item.id" (click)="onRemoveOutSideItemProductionGoodButtonClick(item)">
                                    <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                                  </a>
                                </div>
                              </ng-template>
                            </sd-sheet-column>
                          </sd-sheet>
                        </sd-pane>
                      </sd-dock-container>
                    </sd-pane>

                    <sd-dock [position]="'right'" style="width: 33%;">
                      <sd-dock-container class="sd-background-default">
                        <sd-dock class="sd-padding-xs-sm">
                          <h5 style="display: inline-block; padding-right: 1.4em;">내층</h5>
                          <sd-button [size]="'sm'" (click)="onAddGoodBuildGoodInSideButtonClick()" [inline]="true">
                            <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
                            행 추가
                          </sd-button>
                          &nbsp;
                          <div style="text-align: right; display: inline-block; padding-left: 50%">
                            <h5 style="display: inline-block; padding-right: 1.4em;">총 중량 : </h5>
                            <sd-textfield [(value)]="selectedItemList.inSideTotalWeight"
                                          style="width: 60px; padding-left: 5px; display: inline-block;"
                                          [type]="'number'"
                                          (valueChange)="onChangeInsideTotalWeight($event)"></sd-textfield>
                          </div>
                        </sd-dock>
                        <sd-pane>
                          <sd-sheet [id]="'goods-build-group-goods-inside'"
                                    [items]="selectedItemList.inSideList"
                                    [trackBy]="trackByMeFn">
                            <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                              <ng-template #item let-item="item">
                                <div class="sd-padding-xs-sm" style="text-align: center;">
                                  <span *ngIf="item.id">{{ item.seq }}</span>
                                  <a *ngIf="!item.id" (click)="onRemoveItemGoodBuildGoodOutSideButtonClick(item)">
                                    <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                                  </a>
                                </div>
                              </ng-template>
                            </sd-sheet-column>
                            <sd-sheet-column [header]="'자재명'">
                              <ng-template #item let-item="item">
                                <div class="sd-padding-xs-sm">
                                  {{ item.goodName }}
                                  <a (click)="insideGoodsBuildSearchModalOpenButtonClick(item)">
                                    <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                                  </a>
                                </div>
                              </ng-template>
                            </sd-sheet-column>
                            <sd-sheet-column [header]="'배합비'" [width]="70">
                              <ng-template #item let-item="item">
                                <sd-textfield [(value)]="item.mixPercent" [type]="'number'"
                                              (valueChange)="onChangeInsideMixPercent($event, item)"></sd-textfield>
                              </ng-template>
                            </sd-sheet-column>
                            <sd-sheet-column [header]="'중량'" [width]="60">
                              <ng-template #item let-item="item">
                                <sd-textfield [(value)]="item.weight" [type]="'number'"
                                              (valueChange)="onChangeInsideWeight($event, item)"></sd-textfield>
                              </ng-template>
                            </sd-sheet-column>
                            <sd-sheet-column [header]="'삭제'" [width]="60">
                              <ng-template #item let-item="item">
                                <div style="text-align: center;">
                                  <sd-checkbox [(value)]="item.isDeleted"
                                               [disabled]="!item.id"></sd-checkbox>
                                </div>
                              </ng-template>
                            </sd-sheet-column>
                          </sd-sheet>
                        </sd-pane>
                      </sd-dock-container>
                    </sd-dock>

                    <sd-dock [position]="'right'" style="width: 35%">
                      <sd-dock-container class="sd-background-default">
                        <sd-dock class="sd-padding-xs-sm">
                          <h5 style="display: inline-block; padding-right: 1.4em;">중층</h5>

                          <sd-button [size]="'sm'" (click)="onAddGoodBuildGoodMiddleButtonClick()" [inline]="true">
                            <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
                            행 추가
                          </sd-button>
                          &nbsp;
                          <div style="text-align: right; display: inline-block; padding-left: 50%">
                            <h5 style="display: inline-block; padding-right: 1.4em;">총 중량 : </h5>
                            <sd-textfield [(value)]="selectedItemList.middleTotalWeight"
                                          style="width: 60px; padding-left: 5px; display: inline-block;"
                                          [type]="'number'"
                                          (valueChange)="onChangeMiddleTotalWeight($event)"></sd-textfield>
                          </div>

                        </sd-dock>
                        <sd-pane>
                          <sd-sheet [id]="'goods-build-group-goods-middle'"
                                    [items]="selectedItemList.middleList"
                                    [trackBy]="trackByMeFn">
                            <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                              <ng-template #item let-item="item">
                                <div class="sd-padding-xs-sm" style="text-align: center;">
                                  <span *ngIf="item.id">{{ item.seq }}</span>
                                  <a *ngIf="!item.id" (click)="onRemoveItemGoodBuildGoodMiddleButtonClick(item)">
                                    <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                                  </a>
                                </div>
                              </ng-template>
                            </sd-sheet-column>
                            <sd-sheet-column [header]="'자재명'">
                              <ng-template #item let-item="item">
                                <div class="sd-padding-xs-sm">
                                  {{ item.goodName }}
                                  <a (click)="middleGoodsBuildSearchModalOpenButtonClick(item)">
                                    <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                                  </a>
                                </div>
                              </ng-template>
                            </sd-sheet-column>
                            <sd-sheet-column [header]="'배합비'" [width]="70">
                              <ng-template #item let-item="item">
                                <sd-textfield [(value)]="item.mixPercent" [type]="'number'"
                                              (valueChange)="onChangeMiddleMixPercent($event, item)"></sd-textfield>
                              </ng-template>
                            </sd-sheet-column>
                            <sd-sheet-column [header]="'중량'" [width]="60">
                              <ng-template #item let-item="item">
                                <sd-textfield [(value)]="item.weight" [type]="'number'"
                                              (valueChange)="onChangeMiddleWeight($event, item)"></sd-textfield>
                              </ng-template>
                            </sd-sheet-column>
                            <sd-sheet-column [header]="'삭제'" [width]="60">
                              <ng-template #item let-item="item">
                                <div style="text-align: center;">
                                  <sd-checkbox [(value)]="item.isDeleted" [disabled]="!item.id"></sd-checkbox>
                                </div>
                              </ng-template>
                            </sd-sheet-column>
                          </sd-sheet>
                        </sd-pane>
                      </sd-dock-container>
                    </sd-dock>
                  </sd-dock-container>
                </sd-busy-container>
              </sd-dock>

              <sd-dock [position]="'right'" *ngIf="selectedItem"
                       [id]="'goods-build-group-list'"
                       style="width: 35%">
                <sd-dock-container class="sd-background-default">
                  <sd-pane>
                    <sd-dock-container>
                      <sd-dock class="sd-padding-xs-sm">
                        <h5 style="display: inline-block; padding-right: 1.4em;">BOM 리스트</h5>
                        <sd-button [size]="'sm'" (click)="onAddGoodBuildListButtonClick()" [inline]="true">
                          <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
                          행 추가
                        </sd-button>
                      </sd-dock>

                      <sd-pane>
                        <sd-sheet [id]="'goods-build-group-list'"
                                  [items]="selectedItem.goodsBuildList"
                                  [(selectedItem)]="selectedItemList"
                                  (selectedItemChange)="onSelectedItemChanged($event, selectedItemList)"
                                  [selectable]="true"
                                  [trackBy]="trackByMeFn">
                          <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                            <ng-template #item let-item="item">
                              <div class="sd-padding-xs-sm" style="text-align: center;">
                                <span *ngIf="item.id">{{ item.seq }}</span>
                                <a *ngIf="!item.id" (click)="onRemoveItemGoodBuildListButtonClick(item)">
                                  <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                                </a>
                              </div>
                            </ng-template>
                          </sd-sheet-column>
                          <sd-sheet-column [header]="'BOM명칭'">
                            <ng-template #item let-item="item">
                              <sd-textfield [(value)]="item.name" [required]="true"></sd-textfield>
                            </ng-template>
                          </sd-sheet-column>
                          <sd-sheet-column [header]="'기본설정'" [width]="75">
                            <ng-template #item let-item="item">
                              <div style="text-align: center;">
                                <sd-checkbox [(value)]="item.isStander"
                                             (valueChange)="onStandardCheckChange(item)"></sd-checkbox>
                              </div>
                            </ng-template>
                          </sd-sheet-column>
                          <sd-sheet-column [header]="'사용중지'" [width]="75">
                            <ng-template #item let-item="item">
                              <div style="text-align: center;">
                                <sd-checkbox [(value)]="item.isDisabled" [disabled]="!item.id"></sd-checkbox>
                              </div>
                            </ng-template>
                          </sd-sheet-column>
                          <sd-sheet-column [header]="'정보'" [width]="60">
                            <ng-template #item let-item="item" style="text-align: center;">
                              <sd-button [size]="'sm'" [disabled]="!item.id"
                                         style="padding-left: 20%"
                                         (click)="onBomInfoOpenButton(item)">
                                보기
                              </sd-button>
                            </ng-template>
                          </sd-sheet-column>
                        </sd-sheet>
                      </sd-pane>
                    </sd-dock-container>
                  </sd-pane>

                </sd-dock-container>
              </sd-dock>
              <sd-dock [position]="'right'" *ngIf="selectedItem" [id]="'goods-build-group-item'"
                       style="width: 25%">
                <sd-dock-container class="sd-background-default">
                  <sd-pane>
                    <sd-dock-container>
                      <sd-dock class="sd-padding-xs-sm">
                        <h5 style="display: inline-block; padding-right: 1.4em;">그룹별 품목</h5>
                        <sd-button [size]="'sm'" (click)="onAddGoodsBuildGroupItemButtonClick()" [inline]="true">
                          <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
                          행 추가
                        </sd-button>
                      </sd-dock>

                      <sd-pane>
                        <sd-sheet [id]="'goods-build-group-item-goods'"
                                  [items]="selectedItem.goodsBuildGroupItems"
                                  [trackBy]="trackByMeFn">
                          <sd-sheet-column [header]="'제품명'">
                            <ng-template #item let-item="item">
                              <div class="sd-padding-xs-sm">
                                {{ item.goodName }}
                                <a (click)="goodsBuildGroupItemSearchModalOpenButtonClick(item)">
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
                                <a (click)="onRemoveGoodsBuildGroupItemButtonClick(item)">
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
export class GoodsBuildGroupPage implements OnInit {

  public filter: IFilterVM = {
    groupName: undefined,
    productionGoodName: undefined,
    productionSpecification: undefined,
    bomName: undefined,
    isDisabled: false
  };

  public lastFilter?: IFilterVM;

  public pagination = {page: 0, length: 0};

  public items: IGoodsBuildGroupVM[] = [];
  public orgItems: IGoodsBuildGroupVM[] = [];

  public selectedItem?: IGoodsBuildGroupVM;
  public selectedItemList?: IGoodsBuildListVM;

  public types: string[] = [];

  public viewBusyCount = 0;
  public mainBusyCount = 0;
  public selectedItemBusyCount = 0;

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
    await this.onSearchFormSubmit();
    this.mainBusyCount--;

    this._cdr.markForCheck();
  }

  public async onShowManualButtonClick(): Promise<void> {
    const result = await this._modal.show(ShowManualModal, "제품 그룹(BOM) 메뉴얼", {type: "goods-build-group"});
    if (!result) return;

    this._cdr.markForCheck();
  }

  public onAddItemButtonClick(): void {
    this.items.insert(0, {
      id: undefined,
      groupName: undefined,
      isDisabled: false,

      goodsBuildGroupItems: undefined,
      goodsBuildList: undefined
    });
  }

  public onRemoveItemButtonClick(item: IGoodsBuildGroupVM): void {
    this.items.remove(item);

    if (this.selectedItem === item) {
      this.selectedItem = undefined;
      this.selectedItemList = undefined;
    }
  }

  public onAddGoodBuildListButtonClick(): void {
    this.selectedItem!.goodsBuildList = this.selectedItem!.goodsBuildList || [];

    this.selectedItem!.goodsBuildList!.insert(0, {
      id: undefined,
      name: undefined,
      prevName: undefined,
      groupName: this.selectedItem!.groupName,
      seq: undefined,
      totalWeight: undefined,
      isStander: false,
      isDisabled: false,

      outSideList: undefined,
      outSideTotalWeight: undefined,
      inSideList: undefined,
      inSideTotalWeight: undefined,
      middleList: undefined,
      middleTotalWeight: undefined
    });
  }

  public onRemoveItemGoodBuildListButtonClick(item: IGoodsBuildListVM): void {
    this.selectedItem!.goodsBuildList!.remove(item);

    if (this.selectedItemList === item) {
      this.selectedItemList = undefined;
    }
  }

  public async onChangeGroupName(item: IGoodsBuildGroupVM, db: MainDbContext): Promise<boolean | undefined> {
    const goodGroupInfo = await db.goodsBuild.where(item1 => [sorm.equal(item1.groupName, item.groupName)]).countAsync();

    if (this.items.some(item1 => item !== item1 && item1.groupName === item.groupName) || goodGroupInfo !== 0) {
      return true;
    }

    this._cdr.markForCheck();
  }

  public async onAddGoodsBuildGroupItemButtonClick(): Promise<void> {
    this.selectedItem!.goodsBuildGroupItems = this.selectedItem!.goodsBuildGroupItems || [];

    const result = await this._modal.show(GoodsSearchModal, "그룹별 품목 검색", {isMulti: true});
    if (!result) return;

    for (const resultItem of result || []) {
      if (this.selectedItem!.goodsBuildGroupItems!.filter(item => item.goodId === resultItem.id).length < 1) {
        this.selectedItem!.goodsBuildGroupItems!.insert(0, {
          id: undefined,
          goodId: resultItem!.id,
          goodName: resultItem.name,
          specification: resultItem.specification
        });
      }
    }

    this._cdr.markForCheck();
  }

  public async goodsBuildGroupItemSearchModalOpenButtonClick(item: IGoodsBuildGroupItemVM): Promise<void> {
    const result = await this._modal.show(GoodsSearchModal, "품목 검색", {isMulti: false});
    if (!result) return;

    this.selectedItem!.goodsBuildGroupItems = this.selectedItem!.goodsBuildGroupItems || [];

    if (!this.selectedItem!.goodsBuildGroupItems!.some(item1 => item1.goodId === result.id)) {
      item.goodId = result.id;
      item.goodName = result.name;
      item.specification = result.specification;
    }
    this._cdr.markForCheck();
  }

  public async onRemoveGoodsBuildGroupItemButtonClick(item: IGoodsBuildGroupItemVM): Promise<void> {
    if (!!item.id) {
      if (!confirm("삭제할 경우 다시 추가해야 합니다.\n삭제하시겠습니까?")) return;

      await this._orm.connectAsync(MainDbContext, async db => {
        await db.goodsBuildGroupItem.where(item1 => [sorm.equal(item1.id, item.id)]).deleteAsync();
      });
    }
    this.selectedItem!.goodsBuildGroupItems!.remove(item);

    this._cdr.markForCheck();
  }

  // 외층
  public async onAddGoodBuildGoodOutSideButtonClick(): Promise<void> {
    this.selectedItemList!.outSideList = this.selectedItemList!.outSideList || [];

    const result = await this._modal.show(GoodsSearchModal, "외층 자재 검색", {isMulti: true, isMaterial: true});
    if (!result) return;

    for (const resultItem of result || []) {
      if (this.selectedItemList!.outSideList!.filter(item => item.goodId === resultItem.id).length < 1) {
        this.selectedItemList!.outSideList!.insert(0, {
          id: undefined,
          type: "외층",
          seq: undefined,
          goodId: resultItem.id,
          goodName: resultItem.name,
          specification: resultItem.specification,
          mixPercent: undefined,
          totalWeight: undefined,
          weight: undefined,
          unit: undefined,
          isDeleted: false
        });
      }
    }
    this._cdr.markForCheck();
  }

  public onRemoveItemGoodBuildGoodInSideButtonClick(item: IGoodsBuildGoodsOutSideVM): void {
    this.selectedItemList!.outSideList!.remove(item);
  }

  // 내층
  public async onAddGoodBuildGoodInSideButtonClick(): Promise<void> {
    this.selectedItemList!.inSideList = this.selectedItemList!.inSideList || [];

    const result = await this._modal.show(GoodsSearchModal, "내층 자재 검색", {isMulti: true, isMaterial: true});
    if (!result) return;

    for (const resultItem of result || []) {
      if (this.selectedItemList!.inSideList!.filter(item => item.goodId === resultItem.id).length < 1) {
        this.selectedItemList!.inSideList!.insert(0, {
          id: undefined,
          type: "내층",
          seq: undefined,
          goodId: resultItem.id,
          goodName: resultItem.name,
          specification: resultItem.specification,
          mixPercent: undefined,
          totalWeight: undefined,
          weight: undefined,
          unit: undefined,
          isDeleted: false
        });
      }
    }
    this._cdr.markForCheck();
  }

  public onRemoveItemGoodBuildGoodOutSideButtonClick(item: IGoodsBuildGoodsInsideVM): void {
    this.selectedItemList!.inSideList!.remove(item);
  }

  // 중층
  public async onAddGoodBuildGoodMiddleButtonClick(): Promise<void> {
    this.selectedItemList!.middleList = this.selectedItemList!.middleList || [];

    const result = await this._modal.show(GoodsSearchModal, "중층 자재 검색", {isMulti: true, isMaterial: true});
    if (!result) return;

    for (const resultItem of result || []) {
      if (this.selectedItemList!.middleList!.filter(item => item.goodId === resultItem.id).length < 1) {
        this.selectedItemList!.middleList!.insert(0, {
          id: undefined,
          type: "중층",
          seq: undefined,
          goodId: resultItem.id,
          goodName: resultItem.name,
          specification: resultItem.specification,
          totalWeight: undefined,
          mixPercent: undefined,
          weight: undefined,
          unit: undefined,
          isDeleted: false
        });
      }
    }
    this._cdr.markForCheck();
  }

  public onRemoveItemGoodBuildGoodMiddleButtonClick(item: IGoodsBuildGoodsMiddleVM): void {
    this.selectedItemList!.middleList!.remove(item);
  }

  public async outsideGoodsBuildSearchModalOpenButtonClick(item: IGoodsBuildGoodsOutSideVM): Promise<void> {
    const result = await this._modal.show(GoodsSearchModal, "외층 자재 검색", {isMulti: false, isMaterial: true});
    if (!result) return;

    if (this.selectedItemList!.outSideList!.some(item1 => item1.goodId === result.id)) {
      this._toast.danger("이미 입력되어 있는 품목입니다.");
      return;
    }

    item.goodId = result.id;
    item.goodName = result.name;
    item.specification = result.specification;
    item.mixPercent = undefined;
    item.weight = undefined;

    this._cdr.markForCheck();
  }

  public async insideGoodsBuildSearchModalOpenButtonClick(item: IGoodsBuildGoodsInsideVM): Promise<void> {
    const result = await this._modal.show(GoodsSearchModal, "내층 자재 검색", {isMulti: false, isMaterial: true});
    if (!result) return;

    if (this.selectedItemList!.inSideList!.some(item1 => item1.goodId === result.id)) {
      this._toast.danger("이미 입력되어 있는 품목입니다.");
      return;
    }

    item.goodId = result.id;
    item.goodName = result.name;
    item.specification = result.specification;
    item.mixPercent = undefined;
    item.weight = undefined;

    this._cdr.markForCheck();
  }

  public async middleGoodsBuildSearchModalOpenButtonClick(item: IGoodsBuildGoodsMiddleVM): Promise<void> {
    const result = await this._modal.show(GoodsSearchModal, "중층 자재 검색", {isMulti: false, isMaterial: true});
    if (!result) return;

    if (this.selectedItemList!.middleList!.some(item1 => item1.goodId === result.id)) {
      this._toast.danger("이미 입력되어 있는 품목입니다.");
      return;
    }

    item.goodId = result.id;
    item.goodName = result.name;
    item.specification = result.specification;
    item.mixPercent = undefined;
    item.weight = undefined;

    this._cdr.markForCheck();
  }

  public async onBomInfoOpenButton(item: IGoodsBuildListVM): Promise<void> {
    const result = await this._modal.show(RawMaterialCostsViewModal, "BOM 정보", {
      goodId: undefined,
      bomListId: item.id!
    });
    if (!result) return;

    this._cdr.markForCheck();
  }

  public onChangeInsideTotalWeight(totalWeight: number): void {
    this.selectedItemList!.inSideList!.forEach(item1 => {
      item1.totalWeight = totalWeight;
      item1.weight = totalWeight * ((item1.mixPercent || 0) * 0.01);
    });

    this._cdr.markForCheck();
  }

  public onChangeMiddleTotalWeight(totalWeight: number): void {
    this.selectedItemList!.middleList!.forEach(item1 => {
      item1.totalWeight = totalWeight;
      item1.weight = totalWeight * ((item1.mixPercent || 0) * 0.01);
    });

    this._cdr.markForCheck();
  }

  public onChangeOutSideTotalWeight(totalWeight: number): void {
    this.selectedItemList!.outSideList!.forEach(item1 => {
      item1.totalWeight = totalWeight;
      item1.weight = totalWeight * ((item1.mixPercent || 0) * 0.01);
    });

    this._cdr.markForCheck();
  }

  public onChangeMiddleMixPercent(mixPercent: number, item: IGoodsBuildGoodsMiddleVM): void {
    item.totalWeight = this.selectedItemList!.middleTotalWeight;
    item.weight = (this.selectedItemList!.middleTotalWeight || 0) * ((mixPercent || 0) * 0.01);
    this._cdr.markForCheck();
  }

  public onChangeMiddleWeight(weight: number, item: IGoodsBuildGoodsMiddleVM): void {
    item.totalWeight = this.selectedItemList!.middleTotalWeight;
    item.mixPercent = isNaN(weight / (this.selectedItemList!.middleTotalWeight || 0)) ? 0 : (weight / (this.selectedItemList!.middleTotalWeight || 0)) * 100;
    this._cdr.markForCheck();
  }

  public onChangeInsideMixPercent(mixPercent: number, item: IGoodsBuildGoodsInsideVM): void {
    item.totalWeight = this.selectedItemList!.inSideTotalWeight;
    item.weight = (this.selectedItemList!.inSideTotalWeight || 0) * ((mixPercent || 0) * 0.01);
    this._cdr.markForCheck();
  }

  public onChangeInsideWeight(weight: number, item: IGoodsBuildGoodsInsideVM): void {
    item.totalWeight = this.selectedItemList!.inSideTotalWeight;
    item.mixPercent = isNaN(weight / (this.selectedItemList!.inSideTotalWeight || 0)) ? 0 : (weight / (this.selectedItemList!.inSideTotalWeight || 0)) * 100;
    this._cdr.markForCheck();
  }

  public onChangeOutSideMixPercent(mixPercent: number, item: IGoodsBuildGoodsOutSideVM): void {
    item.totalWeight = this.selectedItemList!.outSideTotalWeight;
    item.weight = (this.selectedItemList!.outSideTotalWeight || 0) * ((mixPercent || 0) * 0.01);
    this._cdr.markForCheck();
  }

  public onChangeOutSideWeight(weight: number, item: IGoodsBuildGoodsOutSideVM): void {
    item.totalWeight = this.selectedItemList!.outSideTotalWeight;
    item.mixPercent = isNaN(weight / (this.selectedItemList!.outSideTotalWeight || 0)) ? 0 : (weight / (this.selectedItemList!.outSideTotalWeight || 0)) * 100;
    this._cdr.markForCheck();
  }

  public async onCopyGoodBomButtonClick(): Promise<void> {
    const result = await this._modal.show(BomListSearchModal, "BOM 복사", {goodId: undefined, isGroup: true});
    if (!result) return;

    this.selectedItemList!.inSideList = this.selectedItemList!.inSideList || [];
    this.selectedItemList!.middleList = this.selectedItemList!.middleList || [];
    this.selectedItemList!.outSideList = this.selectedItemList!.outSideList || [];

    for (const insideItem of result.inSideList || []) {
      if (!this.selectedItemList!.inSideList!.some(item => item.goodId === insideItem.goodId)) {
        this.selectedItemList!.inSideList!.push({
          id: undefined,
          type: "내층",
          seq: insideItem.seq,
          goodId: insideItem.goodId,
          goodName: insideItem.goodName,
          specification: insideItem.specification,
          mixPercent: insideItem.mixPercent,
          totalWeight: insideItem.totalWeight,
          weight: insideItem.weight,
          unit: insideItem.unit,
          isDeleted: false
        });
      }
    }
    this.selectedItemList!.inSideTotalWeight = this.selectedItemList!.inSideList!.length > 0 ? this.selectedItemList!.inSideList![0].totalWeight : undefined;


    this.selectedItemList!.middleList = this.selectedItemList!.middleList || [];
    for (const middleItem of result.middleList || []) {
      if (!this.selectedItemList!.middleList!.some(item => item.goodId === middleItem.goodId)) {
        this.selectedItemList!.middleList!.push({
          id: undefined,
          type: "중층",
          seq: middleItem.seq,
          goodId: middleItem.goodId,
          goodName: middleItem.goodName,
          specification: middleItem.specification,
          mixPercent: middleItem.mixPercent,
          weight: middleItem.weight,
          totalWeight: middleItem.totalWeight,
          unit: middleItem.unit,
          isDeleted: false
        });
      }
    }
    this.selectedItemList!.middleTotalWeight = this.selectedItemList!.middleList!.length > 0 ? this.selectedItemList!.middleList![0].totalWeight : undefined;


    this.selectedItemList!.outSideList = this.selectedItemList!.outSideList || [];
    for (const outSideItem of result.outSideList || []) {
      if (!this.selectedItemList!.outSideList!.some(item => item.goodId === outSideItem.goodId)) {
        this.selectedItemList!.outSideList!.push({
          id: undefined,
          type: "외층",
          seq: outSideItem.seq,
          goodId: outSideItem.goodId,
          goodName: outSideItem.goodName,
          specification: outSideItem.specification,
          mixPercent: outSideItem.mixPercent,
          weight: outSideItem.weight,
          totalWeight: outSideItem.totalWeight,
          unit: outSideItem.unit,
          isDeleted: false
        });
      }
    }
    this.selectedItemList!.outSideTotalWeight = this.selectedItemList!.outSideList!.length > 0 ? this.selectedItemList!.outSideList![0].totalWeight : undefined;

    this._cdr.markForCheck();
  }

  public async onStandardCheckChange(item: IGoodsBuildListVM): Promise<void> {
    this.selectedItem!.goodsBuildList = this.selectedItem!.goodsBuildList || [];

    if (item.isStander !== false) {
      this.selectedItem!.goodsBuildList!.forEach(item1 => item1.isStander = false);
      item.isStander = true;
    }
  }

  public async onRemoveOutSideItemProductionGoodButtonClick(item: IGoodsBuildGoodsOutSideVM): Promise<void> {
    if (!!item.id) {
      if (!confirm("삭제할 경우 다시 추가해야 합니다.\n삭제하시겠습니까?")) return;

      await this._orm.connectAsync(MainDbContext, async db => {
        await db.goodsBuildGoods.where(item1 => [sorm.equal(item1.id, item.id)]).deleteAsync();
      });
    }
    this.selectedItemList!.outSideList!.remove(item);

    this._cdr.markForCheck();
  }

  public async _getBuildGoodInfo(goodId: number): Promise<any> {
    let result: number | undefined;
    await this._orm.connectAsync(MainDbContext, async db => {
      result = await db.goodsBuildList
        .where(item => [sorm.equal(item.goodId, goodId)])
        .countAsync();
    });

    return result;
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

  public async onSelectedChanged(item: IGoodsBuildGroupVM): Promise<void> {
    this.selectedItem = item;
    this.selectedItemList = undefined;

    this._cdr.markForCheck();
  }


  public async onSelectedItemChanged(isSelected: boolean, item: IGoodsBuildListVM): Promise<void> {
    if (isSelected) {
      await this._selectItem(item);
      this._cdr.markForCheck();
    }
    else {
      this.selectedItemList = undefined;
      this._cdr.markForCheck();
    }
  }

  private async _selectItem(buildListItem: IGoodsBuildListVM): Promise<void> {

    this.selectedItemList = buildListItem || [];

    if (buildListItem && !!buildListItem.id) {
      this.selectedItemBusyCount++;

      await this._orm.connectAsync(MainDbContext, async db => {
        // BOM 구성 가져오기
        const result = await db.goodsBuildGoods
          .include(item => item.goods)
          .where(item => [
            sorm.equal(item.companyId, this._appData.authInfo!.companyId),
            sorm.equal(item.bomListId, this.selectedItemList!.id)
          ])
          .select(item => ({
            id: item.id,
            type: item.type,
            seq: item.typeSeq,
            goodId: item.goodsId,
            goodName: item.goods!.name,
            specification: item.goods!.specification,
            mixPercent: item.mixPercent,
            weight: item.weight,
            totalWeight: item.totalWeight,
            unitName: item.goods!.unitName
          }))
          .resultAsync();

        buildListItem.outSideList = buildListItem.outSideList || [];
        for (const outSideItem of result.filter(item1 => item1.type === "외층") || []) {
          if (buildListItem.outSideList.filter(item1 => item1.goodId === outSideItem.goodId).length < 1) {
            buildListItem.outSideList!.push({
              id: outSideItem.id,
              type: "외층",
              seq: outSideItem.seq,
              goodId: outSideItem.goodId,
              goodName: outSideItem.goodName,
              specification: outSideItem.specification,
              mixPercent: outSideItem.mixPercent,
              weight: outSideItem.weight,
              totalWeight: outSideItem.totalWeight,
              unit: outSideItem.unitName,
              isDeleted: false
            });
          }
        }
        buildListItem.outSideTotalWeight = buildListItem.outSideList.length > 0 ? buildListItem.outSideList[0].totalWeight : 0;

        buildListItem.middleList = buildListItem.middleList || [];
        for (const middleItem of result.filter(item1 => item1.type === "중층") || []) {
          if (buildListItem.middleList.filter(item1 => item1.goodId === middleItem.goodId).length < 1) {
            buildListItem.middleList!.push({
              id: middleItem.id,
              type: "중층",
              seq: middleItem.seq,
              goodId: middleItem.goodId,
              goodName: middleItem.goodName,
              specification: middleItem.specification,
              mixPercent: middleItem.mixPercent,
              weight: middleItem.weight,
              totalWeight: middleItem.totalWeight,
              unit: middleItem.unitName,
              isDeleted: false
            });
          }
        }
        buildListItem.middleTotalWeight = buildListItem.middleList.length > 0 ? buildListItem.middleList[0].totalWeight : 0;


        buildListItem.inSideList = buildListItem.inSideList || [];
        for (const inSideItem of result.filter(item1 => item1.type === "내층") || []) {
          if (buildListItem.inSideList.filter(item1 => item1.goodId === inSideItem.goodId).length < 1) {
            buildListItem.inSideList!.push({
              id: inSideItem.id,
              type: "내층",
              seq: inSideItem.seq,
              goodId: inSideItem.goodId,
              goodName: inSideItem.goodName,
              specification: inSideItem.specification,
              mixPercent: inSideItem.mixPercent,
              weight: inSideItem.weight,
              totalWeight: inSideItem.totalWeight,
              unit: inSideItem.unitName,
              isDeleted: false
            });
          }
        }
        buildListItem.inSideTotalWeight = buildListItem.inSideList.length > 0 ? buildListItem.inSideList[0].totalWeight : 0;

      });

      this.selectedItemBusyCount--;
    }
  }

  @HostListener("document:keydown", ["$event"])
  public async onDocumentKeydown(event: KeyboardEvent): Promise<void> {
    if ((event.key === "s" || event.key === "S") && event.ctrlKey) {
      event.preventDefault();
      await this._save();
      this._cdr.markForCheck();
    }
  }

  public async onReflectionButtonClick(item: IGoodsBuildGroupVM): Promise<void> {
    //반드시 저장 후 진행해야 함
    if (!item.id) {
      this._toast.danger("저장 후 진행해 주세요");
      return;
    }
    await this._reflection(item);
    this._cdr.markForCheck();
  }

  private async _reflection(goodsBuildGroupInfo: IGoodsBuildGroupVM): Promise<void> {

    this.viewBusyCount++;

    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        for (const goodBuildGroupItem of goodsBuildGroupInfo.goodsBuildGroupItems || []) {
          if (await this._checkProduct(goodBuildGroupItem.goodId!, db)) {
            throw new Error("품목번호 : " + goodBuildGroupItem.goodId + " 이 현재 생산중입니다. \n생산중인 품목의 생산정보는 수정할 수 없습니다.");
          }
        }

        // 그룹 하위 품목들
        for (const goodBuildGroupItem of goodsBuildGroupInfo.goodsBuildGroupItems || []) {

          const newGoodsBuild = await db.goodsBuild
            .where(item => [
              sorm.equal(item.goodId, goodBuildGroupItem.goodId)
            ])
            .upsertAsync({
              companyId: this._appData.authInfo!.companyId,
              goodId: goodBuildGroupItem.goodId!,
              createdByEmployeeId: this._appData.authInfo!.employeeId,
              createdAtDateTime: new DateTime(),
              isDisabled: false
            });

          let bomListseq = await db.goodsBuildList.where(item => [sorm.equal(item.bomId, newGoodsBuild.id)]).countAsync() || 0;
          bomListseq = bomListseq + 1;

          for (const bomListItem of goodsBuildGroupInfo.goodsBuildList || []) {
            if (bomListItem.id) {
              const result = await db.goodsBuildGoods
                .include(item => item.goods)
                .where(item => [
                  sorm.equal(item.companyId, this._appData.authInfo!.companyId),
                  sorm.equal(item.bomListId, bomListItem!.id)
                ])
                .select(item => ({
                  id: item.id,
                  type: item.type,
                  seq: item.typeSeq,
                  goodId: item.goodsId,
                  goodName: item.goods!.name,
                  specification: item.goods!.specification,
                  mixPercent: item.mixPercent,
                  weight: item.weight,
                  totalWeight: item.totalWeight,
                  unitName: item.goods!.unitName
                }))
                .resultAsync();

              bomListItem.outSideList = bomListItem.outSideList || [];
              for (const outSideItem of result.filter(item1 => item1.type === "외층") || []) {
                if (bomListItem.outSideList.filter(item1 => item1.goodId === outSideItem.goodId).length < 1) {
                  bomListItem.outSideList!.push({
                    id: outSideItem.id,
                    type: "외층",
                    seq: outSideItem.seq,
                    goodId: outSideItem.goodId,
                    goodName: outSideItem.goodName,
                    specification: outSideItem.specification,
                    mixPercent: outSideItem.mixPercent,
                    weight: outSideItem.weight,
                    totalWeight: outSideItem.totalWeight,
                    unit: outSideItem.unitName,
                    isDeleted: false
                  });
                }
              }
              bomListItem.outSideTotalWeight = bomListItem.outSideList.length > 0 ? bomListItem.outSideList[0].totalWeight : 0;

              bomListItem.middleList = bomListItem.middleList || [];
              for (const middleItem of result.filter(item1 => item1.type === "중층") || []) {
                if (bomListItem.middleList.filter(item1 => item1.goodId === middleItem.goodId).length < 1) {
                  bomListItem.middleList!.push({
                    id: middleItem.id,
                    type: "중층",
                    seq: middleItem.seq,
                    goodId: middleItem.goodId,
                    goodName: middleItem.goodName,
                    specification: middleItem.specification,
                    mixPercent: middleItem.mixPercent,
                    weight: middleItem.weight,
                    totalWeight: middleItem.totalWeight,
                    unit: middleItem.unitName,
                    isDeleted: false
                  });
                }
              }
              bomListItem.middleTotalWeight = bomListItem.middleList.length > 0 ? bomListItem.middleList[0].totalWeight : 0;

              bomListItem.inSideList = bomListItem.inSideList || [];
              for (const inSideItem of result.filter(item1 => item1.type === "내층") || []) {
                if (bomListItem.inSideList.filter(item1 => item1.goodId === inSideItem.goodId).length < 1) {
                  bomListItem.inSideList!.push({
                    id: inSideItem.id,
                    type: "내층",
                    seq: inSideItem.seq,
                    goodId: inSideItem.goodId,
                    goodName: inSideItem.goodName,
                    specification: inSideItem.specification,
                    mixPercent: inSideItem.mixPercent,
                    weight: inSideItem.weight,
                    totalWeight: inSideItem.totalWeight,
                    unit: inSideItem.unitName,
                    isDeleted: false
                  });
                }
              }
              bomListItem.inSideTotalWeight = bomListItem.inSideList.length > 0 ? bomListItem.inSideList[0].totalWeight : 0;

              const totalWeight = (bomListItem!.inSideList ? bomListItem!.inSideList!.length > 0 ? bomListItem!.inSideList![0].totalWeight! : 0 : 0) +
                (bomListItem!.middleList ? bomListItem!.middleList!.length > 0 ? bomListItem!.middleList![0].totalWeight! : 0 : 0) +
                (bomListItem!.outSideList ? bomListItem!.outSideList!.length > 0 ? bomListItem!.outSideList![0].totalWeight! : 0 : 0);


              if (bomListItem.isStander) {
                await db.goodsBuildList.where(item => [sorm.equal(item.goodId, goodBuildGroupItem.goodId)]).updateAsync(() => ({isStander: false}));
              }

              const newBomListItem = await db.goodsBuildList
                .where(item => [
                  sorm.equal(item.goodId, goodBuildGroupItem.goodId),
                  sorm.equal(item.bomGroupListId, bomListItem.id)
                ])
                .upsertAsync({
                  companyId: this._appData.authInfo!.companyId,
                  bomId: newGoodsBuild.id!,
                  goodId: goodBuildGroupItem.goodId!,
                  seq: bomListseq,
                  name: bomListItem.name!,
                  bomGroupListId: bomListItem.id,
                  totalWeight,
                  createdByEmployeeId: this._appData.authInfo!.employeeId,
                  createdAtDateTime: new DateTime(),
                  isStander: bomListItem.isStander,
                  isDisabled: bomListItem.isDisabled
                });
              bomListseq++;

              await db.goodsBuildGoods.where(item => [sorm.equal(item.bomListId, newBomListItem.id)]).deleteAsync();

              let insideSeq = 1;
              for (const buildGoodItem of bomListItem.inSideList || []) {
                await db.goodsBuildGoods
                  .where(item => [
                    sorm.equal(item.bomListId, newBomListItem.id),
                    sorm.equal(item.goodsId, buildGoodItem.goodId),
                    sorm.equal(item.type, "내층")
                  ])
                  .upsertAsync({
                    companyId: this._appData.authInfo!.companyId,
                    bomListId: newBomListItem.id!,
                    type: buildGoodItem.type,
                    typeSeq: insideSeq,
                    goodsId: buildGoodItem.goodId!,
                    mixPercent: buildGoodItem.mixPercent,
                    totalWeight: buildGoodItem.totalWeight!,
                    weight: buildGoodItem.weight,
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: this._appData.authInfo!.employeeId
                  });
                insideSeq++;
              }

              let middleSeq = 1;
              for (const buildGoodItem of bomListItem.middleList || []) {
                await db.goodsBuildGoods
                  .where(item => [
                    sorm.equal(item.bomListId, newBomListItem.id),
                    sorm.equal(item.goodsId, buildGoodItem.goodId),
                    sorm.equal(item.type, "중층")
                  ])
                  .upsertAsync({
                    companyId: this._appData.authInfo!.companyId,
                    bomListId: newBomListItem.id!,
                    type: buildGoodItem.type,
                    typeSeq: middleSeq,
                    goodsId: buildGoodItem.goodId!,
                    mixPercent: buildGoodItem.mixPercent,
                    totalWeight: buildGoodItem.totalWeight!,
                    weight: buildGoodItem.weight,
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: this._appData.authInfo!.employeeId
                  });
                middleSeq++;
              }

              let outSideSeq = 1;
              for (const buildGoodItem of bomListItem.outSideList || []) {
                await db.goodsBuildGoods
                  .where(item => [
                    sorm.equal(item.bomListId, newBomListItem.id),
                    sorm.equal(item.goodsId, buildGoodItem.goodId),
                    sorm.equal(item.type, "외층")
                  ])
                  .upsertAsync({
                    companyId: this._appData.authInfo!.companyId,
                    bomListId: newBomListItem.id!,
                    type: buildGoodItem.type,
                    typeSeq: outSideSeq,
                    goodsId: buildGoodItem.goodId!,
                    mixPercent: buildGoodItem.mixPercent,
                    totalWeight: buildGoodItem.totalWeight!,
                    weight: buildGoodItem.weight,
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: this._appData.authInfo!.employeeId
                  });
                outSideSeq++;
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

    for (const diffItem of this.items || []) {
      /*     if (!diffItem.goodsBuildGroupItems || diffItem.goodsBuildGroupItems.length < 1) {
             this._toast.danger("그룹에 추가 된 품목이 존재하지 않습니다.\n확인 후 다시 진행해 주세요");
             return;
           }
     */
      for (const listItem of diffItem.goodsBuildList || []) {
        if (diffItem.goodsBuildList!.filter(item => item.name === listItem.name).length > 1) {
          this._toast.danger("동일한 명칭은 사용할 수 없습니다.");
          return;
        }

        if (listItem.inSideList && listItem.inSideList.length > 0 && !listItem.inSideTotalWeight) {
          this._toast.danger("내층의 총 중량을 입력해 주세요.");
          return;
        }

        if (listItem.outSideList && listItem.outSideList.length > 0 && !listItem.outSideTotalWeight) {
          this._toast.danger("외층의 총 중량을 입력해 주세요.");
          return;
        }

        if (listItem.middleList && listItem.middleList.length > 0 && !listItem.middleTotalWeight) {
          this._toast.danger("중층의 총 중량을 입력해 주세요.");
          return;
        }
      }


    }

    this.viewBusyCount++;

    try {
      this._domValidator.validate(this._elRef!.nativeElement);

      for (const diffTargetsItem of diffTargets) {
        Object.validatesArray(
          diffTargets,
          `BOM 관리`,
          {
            id: {displayName: "ID", type: Number},
            groupName: {displayName: "그룹명", type: String, notnull: true}
          }
        );

        if (diffTargetsItem && !!diffTargetsItem.goodsBuildList) {
          Object.validatesArray(
            diffTargetsItem.goodsBuildList!,
            `BOM 리스트`,
            {
              id: {displayName: "ID", type: Number},
              name: {displayName: "명칭", type: String, notnull: true}
            }
          );
        }

        for (const goodsBuildGoodsItem of diffTargetsItem.goodsBuildList || []) {
          if (goodsBuildGoodsItem && goodsBuildGoodsItem.outSideList) {
            Object.validatesArray(
              goodsBuildGoodsItem.outSideList!,
              `품목 BOM`,
              {
                id: {displayName: "ID", type: Number},
                goodName: {displayName: "자재명", type: String, notnull: true}
              }
            );
          }
        }
      }
      await this._orm.connectAsync(MainDbContext, async db => {
        for (const diffItem of diffTargets) {
          // INSERT
          if (!diffItem.id) {
            if (await this.onChangeGroupName(diffItem, db)) {
              throw new Error("동일한 그룹명이 존재합니다 : " + diffItem.groupName);
            }

            const newBomInfo = await db.goodsBuild
              .insertAsync({
                companyId: this._appData.authInfo!.companyId,
                groupName: diffItem.groupName!,
                createdByEmployeeId: this._appData.authInfo!.employeeId,
                createdAtDateTime: new DateTime(),
                isDisabled: false
              });
            diffItem.id = newBomInfo.id;

            // 그룹 하위 품목들
            for (const goodBuildGroupItem of diffItem.goodsBuildGroupItems || []) {
              await db.goodsBuildGroupItem
                .insertAsync({
                  companyId: this._appData.authInfo!.companyId,
                  goodsBuildGroupId: diffItem.id!,
                  goodId: goodBuildGroupItem.goodId!
                });
            }

            let lastSeq = await db.goodsBuildList.where(item => [sorm.equal(item.bomId, newBomInfo.id)]).countAsync() || 0;
            lastSeq = lastSeq + 1;

            for (const bomListItem of diffItem.goodsBuildList || []) {

              const totalWeight = (bomListItem!.inSideList ? bomListItem!.inSideList!.length > 0 ? bomListItem!.inSideList![0].totalWeight! : 0 : 0) +
                (bomListItem!.middleList ? bomListItem!.middleList!.length > 0 ? bomListItem!.middleList![0].totalWeight! : 0 : 0) +
                (bomListItem!.outSideList ? bomListItem!.outSideList!.length > 0 ? bomListItem!.outSideList![0].totalWeight! : 0 : 0);

              const newBomListItem = await db.goodsBuildList
                .insertAsync({
                  companyId: this._appData.authInfo!.companyId,
                  bomId: diffItem.id!,
                  groupName: diffItem.groupName!,
                  seq: lastSeq,
                  name: bomListItem.name!,
                  totalWeight,
                  createdByEmployeeId: this._appData.authInfo!.employeeId,
                  createdAtDateTime: new DateTime(),
                  isStander: bomListItem.isStander,
                  isDisabled: false
                });
              bomListItem.id = newBomListItem.id;
              bomListItem.seq = newBomListItem.seq;
              lastSeq++;

              let insideSeq = 1;
              for (const buildGoodItem of bomListItem.inSideList || []) {
                const newBomGoodItem = await db.goodsBuildGoods
                  .insertAsync({
                    companyId: this._appData.authInfo!.companyId,
                    bomListId: newBomListItem.id!,
                    type: buildGoodItem.type,
                    typeSeq: insideSeq,
                    goodsId: buildGoodItem.goodId!,
                    mixPercent: buildGoodItem.mixPercent,
                    totalWeight: buildGoodItem.totalWeight!,
                    weight: buildGoodItem.weight,
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: this._appData.authInfo!.employeeId
                  });
                buildGoodItem.id = newBomGoodItem.id;
                buildGoodItem.seq = newBomGoodItem.typeSeq;
                insideSeq++;
              }

              let middleSeq = 1;
              for (const buildGoodItem of bomListItem.middleList || []) {
                const newBomGoodItem = await db.goodsBuildGoods
                  .insertAsync({
                    companyId: this._appData.authInfo!.companyId,
                    bomListId: newBomListItem.id!,
                    type: buildGoodItem.type,
                    typeSeq: middleSeq,
                    goodsId: buildGoodItem.goodId!,
                    mixPercent: buildGoodItem.mixPercent,
                    totalWeight: buildGoodItem.totalWeight!,
                    weight: buildGoodItem.weight,
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: this._appData.authInfo!.employeeId
                  });
                buildGoodItem.id = newBomGoodItem.id;
                buildGoodItem.seq = newBomGoodItem.typeSeq;
                middleSeq++;
              }

              let outSideSeq = 1;
              for (const buildGoodItem of bomListItem.outSideList || []) {
                const newBomGoodItem = await db.goodsBuildGoods
                  .insertAsync({
                    companyId: this._appData.authInfo!.companyId,
                    bomListId: newBomListItem.id!,
                    type: buildGoodItem.type,
                    typeSeq: outSideSeq,
                    goodsId: buildGoodItem.goodId!,
                    mixPercent: buildGoodItem.mixPercent,
                    totalWeight: buildGoodItem.totalWeight!,
                    weight: buildGoodItem.weight,
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: this._appData.authInfo!.employeeId
                  });
                buildGoodItem.id = newBomGoodItem.id;
                buildGoodItem.seq = newBomGoodItem.typeSeq;
                outSideSeq++;
              }
            }
          }
          // UPDATE
          else {
            await db.goodsBuild
              .where(item => [
                sorm.equal(item.id, diffItem.id)
              ])
              .updateAsync(
                () => ({
                  isDisabled: diffItem.isDisabled,
                  groupName: diffItem.groupName,
                  modifyAtDateTime: new DateTime(),
                  modifyEmployeeId: this._appData.authInfo!.employeeId
                })
              );

            await db.goodsBuildGroupItem.where(item => [sorm.equal(item.goodsBuildGroupId, diffItem.id)]).deleteAsync();
            // 그룹 하위 품목들
            for (const goodBuildGroupItem of diffItem.goodsBuildGroupItems || []) {
              await db.goodsBuildGroupItem
                .insertAsync({
                  companyId: this._appData.authInfo!.companyId,
                  goodsBuildGroupId: diffItem.id!,
                  goodId: goodBuildGroupItem.goodId!
                });
            }

            for (const bomListItem of diffItem.goodsBuildList || []) {
              const totalWeight = (bomListItem!.inSideList ? bomListItem!.inSideList!.length > 0 ? bomListItem!.inSideList![0].totalWeight! : 0 : 0) +
                (bomListItem!.middleList ? bomListItem!.middleList!.length > 0 ? bomListItem!.middleList![0].totalWeight! : 0 : 0) +
                (bomListItem!.outSideList ? bomListItem!.outSideList!.length > 0 ? bomListItem!.outSideList![0].totalWeight! : 0 : 0);

              //BOM 리스트 INSERT
              if (!bomListItem.id) {
                const bomSeqInfo = await db.goodsBuildList
                  .where(item => [sorm.equal(item.bomId, diffItem.id)])
                  .orderBy(item => item.seq, true)
                  .top(1).select(item => ({
                    seq: item.seq
                  })).singleAsync();

                const bomSeq = bomSeqInfo ? (bomSeqInfo.seq + 1) : 1;

                const newBomListItem = await db.goodsBuildList
                  .insertAsync({
                    companyId: this._appData.authInfo!.companyId,
                    bomId: diffItem.id!,
                    groupName: diffItem.groupName!,
                    seq: bomSeq,
                    name: bomListItem.name!,
                    totalWeight,
                    createdByEmployeeId: this._appData.authInfo!.employeeId,
                    createdAtDateTime: new DateTime(),
                    isStander: bomListItem.isStander,
                    isDisabled: false
                  });
                bomListItem.id = newBomListItem.id;
                bomListItem.seq = newBomListItem.seq;
              }
              //BOM 리스트 UPDATE
              else {
                await db.goodsBuildList
                  .where(item => [sorm.equal(item.id, bomListItem.id)])
                  .updateAsync(
                    () => ({
                      name: bomListItem.name,
                      totalWeight,
                      isStander: bomListItem.isStander,
                      isDisabled: bomListItem.isDisabled
                    })
                  );
              }

              if (bomListItem.inSideList) {
                for (const insideItem of bomListItem.inSideList || []) {

                  if (!!insideItem.id) {
                    if (insideItem.isDeleted) {
                      await db.goodsBuildGoods
                        .where(item => [
                          sorm.equal(item.id, insideItem.id)
                        ]).deleteAsync();
                      bomListItem.inSideList.remove(insideItem);
                    }
                    else {
                      await db.goodsBuildGoods
                        .where(item => [sorm.equal(item.id, insideItem.id)])
                        .updateAsync(
                          () => ({
                            totalWeight: insideItem.totalWeight,
                            weight: insideItem.weight,
                            mixPercent: insideItem.mixPercent
                          })
                        );
                    }

                  }
                  else {
                    const bomGoodSeqInfo = await db.goodsBuildGoods
                      .where(item => [sorm.equal(item.bomListId, bomListItem.id), sorm.equal(item.type, "내층")])
                      .orderBy(item => item.typeSeq, true)
                      .top(1).select(item => ({
                        seq: item.typeSeq
                      })).singleAsync();

                    const bomGoodSeq = bomGoodSeqInfo ? (bomGoodSeqInfo.seq + 1) : 1;

                    const newBomGoodItem = await db.goodsBuildGoods
                      .insertAsync({
                        companyId: this._appData.authInfo!.companyId,
                        bomListId: bomListItem.id!,
                        type: insideItem.type,
                        typeSeq: bomGoodSeq,
                        goodsId: insideItem.goodId!,
                        totalWeight: insideItem.totalWeight!,
                        mixPercent: insideItem.mixPercent,
                        weight: insideItem.weight,
                        createdAtDateTime: new DateTime(),
                        createdByEmployeeId: this._appData.authInfo!.employeeId
                      });
                    insideItem.id = newBomGoodItem.id;
                    insideItem.seq = newBomGoodItem.typeSeq;
                  }
                }
              }

              if (bomListItem.middleList) {
                for (const middleItem of bomListItem.middleList || []) {

                  if (!middleItem.id) {
                    const bomGoodSeqInfo = await db.goodsBuildGoods
                      .where(item => [sorm.equal(item.bomListId, bomListItem.id), sorm.equal(item.type, "중층")])
                      .orderBy(item => item.typeSeq, true)
                      .top(1).select(item => ({
                        seq: item.typeSeq
                      })).singleAsync();

                    const bomGoodSeq = bomGoodSeqInfo ? (bomGoodSeqInfo.seq + 1) : 1;

                    const newBomGoodItem = await db.goodsBuildGoods
                      .insertAsync({
                        companyId: this._appData.authInfo!.companyId,
                        bomListId: bomListItem.id!,
                        type: middleItem.type,
                        typeSeq: bomGoodSeq,
                        goodsId: middleItem.goodId!,
                        totalWeight: middleItem.totalWeight!,
                        mixPercent: middleItem.mixPercent,
                        weight: middleItem.weight,
                        createdAtDateTime: new DateTime(),
                        createdByEmployeeId: this._appData.authInfo!.employeeId
                      });
                    middleItem.id = newBomGoodItem.id;
                    middleItem.seq = newBomGoodItem.typeSeq;
                  }
                  else {
                    if (middleItem.isDeleted) {
                      await db.goodsBuildGoods
                        .where(item => [
                          sorm.equal(item.id, middleItem.id)
                        ]).deleteAsync();
                      bomListItem.middleList.remove(middleItem);
                    }
                    else {
                      await db.goodsBuildGoods
                        .where(item => [sorm.equal(item.id, middleItem.id)])
                        .updateAsync(
                          () => ({
                            weight: middleItem.weight,
                            totalWeight: middleItem.totalWeight,
                            mixPercent: middleItem.mixPercent
                          })
                        );
                    }
                  }
                }
              }

              if (bomListItem.outSideList) {
                for (const outSideItem of bomListItem.outSideList || []) {

                  if (!outSideItem.id) {
                    const bomGoodSeqInfo = await db.goodsBuildGoods
                      .where(item => [sorm.equal(item.bomListId, bomListItem.id), sorm.equal(item.type, "외층")])
                      .orderBy(item => item.typeSeq, true)
                      .top(1).select(item => ({
                        seq: item.typeSeq
                      })).singleAsync();

                    const bomGoodSeq = bomGoodSeqInfo ? (bomGoodSeqInfo.seq + 1) : 1;

                    const newBomGoodItem = await db.goodsBuildGoods
                      .insertAsync({
                        companyId: this._appData.authInfo!.companyId,
                        bomListId: bomListItem.id!,
                        type: outSideItem.type,
                        typeSeq: bomGoodSeq,
                        goodsId: outSideItem.goodId!,
                        mixPercent: outSideItem.mixPercent,
                        totalWeight: outSideItem.totalWeight!,
                        weight: outSideItem.weight,
                        createdAtDateTime: new DateTime(),
                        createdByEmployeeId: this._appData.authInfo!.employeeId
                      });
                    outSideItem.id = newBomGoodItem.id;
                    outSideItem.seq = newBomGoodItem.typeSeq;
                  }
                  else {
                    if (outSideItem.isDeleted) {
                      await db.goodsBuildGoods
                        .where(item => [
                          sorm.equal(item.id, outSideItem.id)
                        ]).deleteAsync();
                      bomListItem.outSideList.remove(outSideItem);
                    }
                    else {
                      await db.goodsBuildGoods
                        .where(item => [sorm.equal(item.id, outSideItem.id)])
                        .updateAsync(
                          () => ({
                            totalWeight: outSideItem.totalWeight,
                            weight: outSideItem.weight,
                            mixPercent: outSideItem.mixPercent
                          })
                        );
                    }
                  }
                }
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

  private async _checkProduct(goodId: number, db: MainDbContext): Promise<boolean | undefined> {
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

        this.items = await queryable
          .orderBy(item => item.id)
          .limit(this.pagination.page * 50, 50)
          .wrap(GoodsBuild)
          .include(item => item.goods)
          .include(item => item.goodsBuildGroupItem)
          .include(item => item.goodsBuildGroupItem![0].goods)
          .include(item => item.goodsBuildList)
          .include(item => item.goodsBuildList![0].goods)
          .select(item => ({
            id: item.id,
            groupName: item.groupName,
            isDisabled: item.isDisabled,

            goodsBuildGroupItems: item.goodsBuildGroupItem && item.goodsBuildGroupItem!.map(item1 => ({
              id: item1.id,
              goodId: item1.goodId,
              goodName: item1.goods!.name,
              specification: item1.goods!.specification
            })) || undefined,

            goodsBuildList: item.goodsBuildList && item.goodsBuildList.map(item1 => ({
              id: item1.id,
              prevName: item1.name,
              name: item1.name,
              seq: item1.seq,
              groupName: item1.groupName,
              isStander: item1.isStander,
              isDisabled: item1.isDisabled,
              totalWeight: item1.totalWeight,
              outSideList: undefined,
              outSideTotalWeight: undefined,
              inSideList: undefined,
              inSideTotalWeight: undefined,
              middleList: undefined,
              middleTotalWeight: undefined
            })) || undefined
          }))
          .resultAsync();

        this.orgItems = Object.clone(this.items);

        this.selectedItem = undefined;
        this.selectedItemList = undefined;

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

  private _getSearchQueryable(db: MainDbContext): Queryable<GoodsBuild> {
    let queryable = db.goodsBuild
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId),
        sorm.null(item.goodId),
        sorm.notNull(item.groupName)
      ]);

    if (this.lastFilter!.groupName) {
      queryable = queryable
        .where(item => [
          sorm.includes(item.groupName, this.lastFilter!.groupName)
        ]);
    }

    if (this.lastFilter!.productionGoodName) {
      queryable = queryable
        .include(item => item.goodsBuildGroupItem)
        .include(item => item.goodsBuildGroupItem![0].goods)
        .where(item => [
          sorm.includes(item.goodsBuildGroupItem![0].goods!.name, this.lastFilter!.productionGoodName)
        ]);
    }

    if (this.lastFilter!.productionSpecification) {
      queryable = queryable
        .include(item => item.goodsBuildGroupItem)
        .include(item => item.goodsBuildGroupItem![0].goods)
        .where(item => [
          sorm.includes(item.goodsBuildGroupItem![0].goods!.specification, this.lastFilter!.productionSpecification)
        ]);
    }

    if (this.lastFilter!.bomName) {
      queryable = queryable
        .include(item => item.goodsBuildList)
        .where(item => [
          sorm.includes(item.goodsBuildList![0].name, this.lastFilter!.bomName)
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
  bomName?: string;
  isDisabled: boolean;
}

interface IGoodsBuildGroupVM {
  id: number | undefined;
  groupName: string | undefined;
  isDisabled: boolean | undefined;

  goodsBuildGroupItems: IGoodsBuildGroupItemVM[] | undefined;
  goodsBuildList: IGoodsBuildListVM[] | undefined;
}

interface IGoodsBuildGroupItemVM {
  id: number | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  specification: string | undefined;
}

interface IGoodsBuildListVM {
  id: number | undefined;
  groupName: string | undefined;
  totalWeight: number | undefined;
  prevName: string | undefined;
  name: string | undefined;
  seq: number | undefined;
  isStander: boolean;
  isDisabled: boolean;

  outSideList: IGoodsBuildGoodsOutSideVM[] | undefined;
  outSideTotalWeight: number | undefined;
  inSideList: IGoodsBuildGoodsInsideVM[] | undefined;
  inSideTotalWeight: number | undefined;
  middleList: IGoodsBuildGoodsMiddleVM[] | undefined;
  middleTotalWeight: number | undefined;
}

interface IGoodsBuildGoodsOutSideVM {
  id: number | undefined;
  seq: number | undefined;
  type: "외층";
  goodId: number | undefined;
  goodName: string | undefined;
  specification: string | undefined;
  mixPercent: number | undefined;
  totalWeight: number | undefined;
  weight: number | undefined;
  unit: string | undefined;
  isDeleted: boolean;
}

interface IGoodsBuildGoodsInsideVM {
  id: number | undefined;
  seq: number | undefined;
  type: "내층";
  goodId: number | undefined;
  goodName: string | undefined;
  specification: string | undefined;
  mixPercent: number | undefined;
  totalWeight: number | undefined;
  weight: number | undefined;
  unit: string | undefined;
  isDeleted: boolean;
}

interface IGoodsBuildGoodsMiddleVM {
  id: number | undefined;
  seq: number | undefined;
  type: "중층";
  goodId: number | undefined;
  goodName: string | undefined;
  specification: string | undefined;
  mixPercent: number | undefined;
  totalWeight: number | undefined;
  weight: number | undefined;
  unit: string | undefined;
  isDeleted: boolean;
}

