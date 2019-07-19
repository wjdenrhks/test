import {ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnInit} from "@angular/core";
import {DateOnly, DateTime} from "@simplism/core";
import {
  GoodsBuildGoods, InputGeneralReturn,
  InputHistory, InputLdpeReturn,
  MainDbContext,
  MixingProcess, StockProc
} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {SdModalProvider, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {AppDataProvider} from "@sample/client-common";
import {ProductionInstructionSearchModal} from "../../modals/ProductionInstructionSearchModal";
import {StockSearchModal} from "../../modals/StockSearchModal";
import {Queryable} from "@simplism/orm-client";
import {CombinationInputReturnModal} from "../../modals/CombinationInputReturnModal";
import {LdpeReturnModal} from "../../modals/LdpeReturnModal";
import {ShowManualModal} from "../../modals/ShowManualModal";

@Component({
  selector: "app-combination-process",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>배합 처리</h4>

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
              <sd-form-item [label]="'생산제품'">
                <app-good-name-select [(value)]="filter.goodName"></app-good-name-select>
              </sd-form-item>
              <sd-form-item [label]="'규격'">
                <app-goods-specification-select [(value)]="filter.specification" [goodName]="filter.goodName"></app-goods-specification-select>
              </sd-form-item>
              <sd-form-item [label]="'생산지시'">
                <sd-textfield [(value)]="filter.productionInstructionId" style="width: 100px;"></sd-textfield>
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
              <sd-sheet #sheet [id]="'combination-process'"
                        [items]="items"
                        [trackBy]="trackByIdFn"
                        [(selectedItem)]="selectedItem"
                        (selectedItemChange)="onSelectedItemChanged($event)"
                        [selectable]="'manual'">
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
                <sd-sheet-column [header]="'생산지시 ID'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.productionOrderId }}
                      <a (click)="productionInstructionSearchModalOpenButtonClick(item)"
                         [attr.sd-invalid]="!item.productionOrderId">
                        <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'생산제품'">
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
                <sd-sheet-column [header]="'예상투입수량(Kg)'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.planInputQuantity | number }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'실 투입수량'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.realInputQuantity | number }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'잔량반납'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" *ngIf="!!item.id">
                      <a (click)="inputReturnModalOpenButtonClick(item)">
                        {{ item.generalTotalQuantity }}
                      </a>
                      <a (click)="inputReturnModalOpenButtonClick(item)"
                         *ngIf="!item.generalTotalQuantity || item.generalTotalQuantity < 0" tabindex="0">
                        <sd-icon [fixedWidth]="true" [icon]="'search'"></sd-icon>
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'LDPE 반납'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" *ngIf="!!item.id">
                      <a (click)="inputReturnLdpeModalOpenButtonClick(item)">
                        {{ item.ldpeTotalQuantity }}
                      </a>
                      <a (click)="inputReturnLdpeModalOpenButtonClick(item)"
                         *ngIf="!item.ldpeTotalQuantity || item.ldpeTotalQuantity < 0" tabindex="0">
                        <sd-icon [fixedWidth]="true" [icon]="'search'"></sd-icon>
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
              </sd-sheet>

              <sd-dock [position]="'bottom'" *ngIf="selectedItem" [id]="'combination-process-input-list'"
                       style="height: 40%">
                <sd-busy-container [busy]="selectedItemBusyCount > 0">
                  <sd-dock-container class="sd-background-default">
                    <sd-dock class="sd-padding-xs-sm">
                      <h5 style="display: inline-block; padding-right: 1.4em;">투입 항목</h5>
                    </sd-dock>

                    <sd-pane>
                      <sd-dock-container class="sd-background-default">
                        <sd-dock class="sd-padding-xs-sm">
                          <h5 style="display: inline-block; padding-right: 1.4em;">중층</h5>
                          <sd-select [(value)]="selectedItem.middleBomSeq" style="display: inline-block; width: 75px;">
                            <sd-select-item [value]="1">1차</sd-select-item>
                            <sd-select-item [value]="2">2차</sd-select-item>
                            <sd-select-item [value]="3">3차</sd-select-item>
                          </sd-select>
                          <sd-button [size]="'sm'" (click)="onAddGoodsBuildGoodsButtonClick('중층')" [inline]="true"
                                     style="float: right; margin-right: 5%">
                            <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
                            행 추가
                          </sd-button>
                        </sd-dock>
                        <sd-pane>
                          <sd-sheet [id]="'combination-process-input-list'"
                                    [items]="selectedItem.middleBomList"
                                    [trackBy]="trackByMeFn">
                            <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                              <ng-template #item let-item="item">
                                <div class="sd-padding-xs-sm" style="text-align: center;">
                                  <span *ngIf="item.id">{{ item.id }}</span>
                                  <a *ngIf="!item.id" (click)="onMiddilesideBomRemoveButtonClick(item)">
                                    <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                                  </a>
                                </div>
                              </ng-template>
                            </sd-sheet-column>
                            <sd-sheet-column [header]="'자재명 / 규격'">
                              <ng-template #item let-item="item">
                                <div class="sd-padding-xs-sm">
                                  {{ item.goodName + ' / ' + item.specification }}
                                </div>
                              </ng-template>
                            </sd-sheet-column>
                            <sd-sheet-column [header]="'배합비'" [width]="60">
                              <ng-template #item let-item="item">
                                <div class="sd-padding-xs-sm">
                                  {{ item.mixPercent }}
                                </div>
                              </ng-template>
                            </sd-sheet-column>
                            <sd-sheet-column [header]="'소요량'" [width]="60">
                              <ng-template #item let-item="item">
                                <div class="sd-padding-xs-sm">
                                  {{ item.unitWeight }}
                                </div>
                              </ng-template>
                            </sd-sheet-column>
                            <sd-sheet-column [header]="'LOT'">
                              <ng-template #item let-item="item">
                                <div class="sd-padding-xs-sm">
                                  {{ item.lotName }}
                                  <a (click)="middleBomSearchModalOpenButtonClick(item)"
                                     [attr.sd-invalid]="!item.lotId">
                                    <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                                  </a>
                                </div>
                              </ng-template>
                            </sd-sheet-column>
                            <sd-sheet-column [header]="'포대'" [width]="40">
                              <ng-template #item let-item="item">
                                <sd-textfield [(value)]="item.unitQuantity"
                                              [type]="'number'" [min]="1"
                                              (valueChange)="onChangeMiddleTotal(item)"></sd-textfield>
                              </ng-template>
                            </sd-sheet-column>
                            <sd-sheet-column [header]="'중량'" [width]="60">
                              <ng-template #item let-item="item">
                                <sd-textfield [(value)]="item.inputWeight"
                                              [type]="'number'"
                                              (valueChange)="onChangeMiddleTotal(item)"></sd-textfield>
                              </ng-template>
                            </sd-sheet-column>
                            <sd-sheet-column [header]="'총 투입량'" [width]="60">
                              <ng-template #item let-item="item">
                                <sd-textfield [(value)]="item.totalQuantity" [disabled]="true"
                                              [type]="'number'" [min]="1"></sd-textfield>
                              </ng-template>
                            </sd-sheet-column>
                          </sd-sheet>
                        </sd-pane>
                        <sd-dock [position]="'bottom'" class="sd-padding-xs-sm">
                          <div>
                            <h3 style="display: inline-block; padding-left: 60%;">합계</h3>&nbsp;&nbsp;&nbsp;
                            <h3
                              style="display: inline-block;">{{ selectedItem.middleTotalQuantity ? selectedItem.middleTotalQuantity + " KG" : "" }} </h3>
                          </div>
                        </sd-dock>
                      </sd-dock-container>
                    </sd-pane>

                    <sd-dock [position]="'left'" style="width: 33%;">
                      <sd-dock-container class="sd-background-default">
                        <sd-dock class="sd-padding-xs-sm">
                          <h5 style="display: inline-block; padding-right: 1.4em;">내층</h5>
                          <sd-select [(value)]="selectedItem.inSideBomSeq" style="display: inline-block; width: 75px;">
                            <sd-select-item [value]="1">1차</sd-select-item>
                            <sd-select-item [value]="2">2차</sd-select-item>
                            <sd-select-item [value]="3">3차</sd-select-item>
                          </sd-select>
                          <sd-button [size]="'sm'" (click)="onAddGoodsBuildGoodsButtonClick('내층')" [inline]="true"
                                     style="float: right; margin-right: 5%">
                            <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
                            행 추가
                          </sd-button>

                        </sd-dock>
                        <sd-pane>
                          <sd-sheet [id]="'combination-process-input-list'"
                                    [items]="selectedItem.inSideBomList"
                                    [trackBy]="trackByMeFn">
                            <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                              <ng-template #item let-item="item">
                                <div class="sd-padding-xs-sm" style="text-align: center;">
                                  <span *ngIf="item.id">{{ item.id }}</span>
                                  <a *ngIf="!item.id" (click)="onInsideBomRemoveButtonClick(item)">
                                    <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                                  </a>
                                </div>
                              </ng-template>
                            </sd-sheet-column>
                            <sd-sheet-column [header]="'자재명 / 규격'">
                              <ng-template #item let-item="item">
                                <div class="sd-padding-xs-sm">
                                  {{ item.goodName + ' / ' + item.specification }}
                                </div>
                              </ng-template>
                            </sd-sheet-column>
                            <sd-sheet-column [header]="'배합비'" [width]="60">
                              <ng-template #item let-item="item">
                                <div class="sd-padding-xs-sm">
                                  {{ item.mixPercent }}
                                </div>
                              </ng-template>
                            </sd-sheet-column>
                            <sd-sheet-column [header]="'소요량'" [width]="60">
                              <ng-template #item let-item="item">
                                <div class="sd-padding-xs-sm">
                                  {{ item.unitWeight }}
                                </div>
                              </ng-template>
                            </sd-sheet-column>
                            <sd-sheet-column [header]="'LOT'">
                              <ng-template #item let-item="item">
                                <div class="sd-padding-xs-sm">
                                  {{ item.lotName }}
                                  <a (click)="inSideBomSearchModalOpenButtonClick(item)"
                                     [attr.sd-invalid]="!item.lotId">
                                    <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                                  </a>
                                </div>
                              </ng-template>
                            </sd-sheet-column>
                            <sd-sheet-column [header]="'포대'" [width]="40">
                              <ng-template #item let-item="item">
                                <sd-textfield [(value)]="item.unitQuantity"
                                              [type]="'number'" [min]="1"
                                              (valueChange)="onChangeInSideTotal(item)"></sd-textfield>
                              </ng-template>
                            </sd-sheet-column>
                            <sd-sheet-column [header]="'중량'" [width]="60">
                              <ng-template #item let-item="item">
                                <sd-textfield [(value)]="item.inputWeight"
                                              [type]="'number'"
                                              (valueChange)="onChangeInSideTotal(item)"></sd-textfield>
                              </ng-template>
                            </sd-sheet-column>
                            <sd-sheet-column [header]="'총 투입량'" [width]="60">
                              <ng-template #item let-item="item">
                                <sd-textfield [(value)]="item.totalQuantity" [disabled]="true"
                                              [type]="'number'" [min]="1"></sd-textfield>
                              </ng-template>
                            </sd-sheet-column>
                          </sd-sheet>
                        </sd-pane>
                        <sd-dock [position]="'bottom'" class="sd-padding-xs-sm">
                          <div>
                            <h3 style="display: inline-block; padding-left: 60%;">합계</h3>&nbsp;&nbsp;&nbsp;
                            <h3
                              style="display: inline-block;">{{ selectedItem.inSideTotalQuantity ? selectedItem.inSideTotalQuantity + " KG" : "" }} </h3>
                          </div>
                        </sd-dock>
                      </sd-dock-container>
                    </sd-dock>

                    <sd-dock [position]="'right'" style="width: 33%">
                      <sd-dock-container class="sd-background-default">
                        <sd-dock class="sd-padding-xs-sm">
                          <h5 style="display: inline-block; padding-right: 1.4em;">외층</h5>
                          <sd-select [(value)]="selectedItem.outSideBomSeq" style="display: inline-block; width: 75px;">
                            <sd-select-item [value]="1">1차</sd-select-item>
                            <sd-select-item [value]="2">2차</sd-select-item>
                            <sd-select-item [value]="3">3차</sd-select-item>
                          </sd-select>
                          <sd-button [size]="'sm'" (click)="onAddGoodsBuildGoodsButtonClick('외층')" [inline]="true"
                                     style="float: right; margin-right: 5%">
                            <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
                            행 추가
                          </sd-button>
                        </sd-dock>
                        <sd-sheet [id]="'combination-process-input-list'"
                                  [items]="selectedItem.outSideBomList"
                                  [trackBy]="trackByMeFn">
                          <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                            <ng-template #item let-item="item">
                              <div class="sd-padding-xs-sm" style="text-align: center;">
                                <span *ngIf="item.id">{{ item.id }}</span>
                                <a *ngIf="!item.id" (click)="onOutsideBomRemoveButtonClick(item)">
                                  <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                                </a>
                              </div>
                            </ng-template>
                          </sd-sheet-column>
                          <sd-sheet-column [header]="'자재명 / 규격'">
                            <ng-template #item let-item="item">
                              <div class="sd-padding-xs-sm">
                                {{ item.goodName + ' / ' + item.specification }}
                              </div>
                            </ng-template>
                          </sd-sheet-column>
                          <sd-sheet-column [header]="'배합비'" [width]="60">
                            <ng-template #item let-item="item">
                              <div class="sd-padding-xs-sm">
                                {{ item.mixPercent }}
                              </div>
                            </ng-template>
                          </sd-sheet-column>
                          <sd-sheet-column [header]="'소요량'" [width]="60">
                            <ng-template #item let-item="item">
                              <div class="sd-padding-xs-sm">
                                {{ item.unitWeight }}
                              </div>
                            </ng-template>
                          </sd-sheet-column>
                          <sd-sheet-column [header]="'LOT'">
                            <ng-template #item let-item="item">
                              <div class="sd-padding-xs-sm">
                                {{ item.lotName }}
                                <a (click)="outSideBomSearchModalOpenButtonClick(item)"
                                   [attr.sd-invalid]="!item.lotId">
                                  <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                                </a>
                              </div>
                            </ng-template>
                          </sd-sheet-column>
                          <sd-sheet-column [header]="'포대'" [width]="40">
                            <ng-template #item let-item="item">
                              <sd-textfield [(value)]="item.unitQuantity"
                                            [type]="'number'" [min]="1"
                                            (valueChange)="onChangeOutSideTotal(item)"></sd-textfield>
                            </ng-template>
                          </sd-sheet-column>
                          <sd-sheet-column [header]="'중량'" [width]="60">
                            <ng-template #item let-item="item">
                              <sd-textfield [(value)]="item.inputWeight"
                                            [type]="'number'"
                                            (valueChange)="onChangeOutSideTotal(item)"></sd-textfield>
                            </ng-template>
                          </sd-sheet-column>
                          <sd-sheet-column [header]="'총 투입량'" [width]="60">
                            <ng-template #item let-item="item">
                              <sd-textfield [(value)]="item.totalQuantity" [disabled]="true"
                                            [type]="'number'" [min]="1"></sd-textfield>
                            </ng-template>
                          </sd-sheet-column>
                        </sd-sheet>
                        <sd-dock [position]="'bottom'" class="sd-padding-xs-sm">
                          <div>
                            <h3 style="display: inline-block; padding-left: 60%;">합계</h3>&nbsp;&nbsp;&nbsp;
                            <h3
                              style="display: inline-block;">{{ selectedItem.outSideTotalQuantity ? selectedItem.outSideTotalQuantity + " KG" : "" }} </h3>
                          </div>
                        </sd-dock>

                      </sd-dock-container>
                    </sd-dock>

                  </sd-dock-container>
                </sd-busy-container>
              </sd-dock>

              <sd-dock [position]="'right'" style="width: 35%" *ngIf="selectedItem"
                       [id]="'combination-process-input-history'">
                <sd-dock-container class="sd-background-default">
                  <sd-dock class="sd-padding-xs-sm">
                    <h5 style="display: inline-block; padding-right: 1.4em;">자재 투입 이력</h5>
                  </sd-dock>

                  <sd-pane>
                    <sd-sheet [id]="'combination-process-input-history'"
                              [items]="selectedItem.inputHistory"
                              [trackBy]="trackByIdFn">
                      <!--<sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm" style="text-align: center;">
                            {{ item.seq }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>-->
                      <sd-sheet-column [header]="'차수'" [width]="50">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm" style="text-align: center;">
                            {{ item.order + "차" }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'자재명 / 규격'">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm">
                            {{ item.goodName + ' / ' + item.specification }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'LOT'">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm">
                            {{ item.lotName }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'투입층'" [width]="60">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm" style="text-align: center;">
                            {{ item.type }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'포대'" [width]="60">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm" style="text-align: center;">
                            {{ item.sack | number }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'중량'" [width]="70">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm" style="text-align: center;">
                            {{ item.weight | number }} 
                          </div>
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
export class CombinationProcessPage implements OnInit {
  public filter: IFilterVM = {
    goodName: undefined,
    specification: undefined,
    productionOrder: undefined,
    productionInstructionId: undefined
  };

  public lastFilter?: IFilterVM;

  public pagination = {page: 0, length: 0};

  public items: ICombinationVM[] = [];
  public orgItems: ICombinationVM[] = [];

  public selectedItem?: ICombinationVM;

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public selectedItemBusyCount = 0;

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public constructor(private readonly _modal: SdModalProvider,
                     private readonly _orm: SdOrmProvider,
                     private readonly _appData: AppDataProvider,
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
    const result = await this._modal.show(ShowManualModal, "배합 처리 메뉴얼", {type: "combination-process"});
    if (!result) return;

    this._cdr.markForCheck();
  }

  public async onAddItemButtonClick(): Promise<void> {
    const result = await this._modal.show(ProductionInstructionSearchModal, "생산지시 검색", {
      isMulti: false,
      isCombinationSearch: true
    });
    if (!result) return;

    if (result) {
      if (this.items.filter(item1 => item1.productionOrderId === result.id).length < 1) {
        this.items.insert(0, {
          id: undefined,
          productionOrderId: result.id,
          equipmentId: result.equipmentId,
          productionOrderQuantity: result.productQuantity,
          goodId: result.goodId,
          goodName: result.goodName,
          specification: result.specification,
          bomListId: result.bomListId,
          planInputQuantity: (await this._getGoodsBuildGoods(result.bomListId, result.goodId) || 0) * (result.productQuantity || 0),
          realInputQuantity: undefined,
          generalTotalQuantity: undefined,
          ldpeTotalQuantity: undefined,
          createdByEmployeeId: undefined,
          createdByEmployeeName: undefined,
          createdAtDateTime: undefined,

          outSideBomList: undefined,
          outSideBomSeq: 1,
          outSideTotalQuantity: undefined,
          inSideBomList: undefined,
          inSideBomSeq: 1,
          inSideTotalQuantity: undefined,
          middleBomList: undefined,
          middleBomSeq: 1,
          middleTotalQuantity: undefined,
          inputHistory: undefined
        });
      }
    }
    this._cdr.markForCheck();
  }

  public onRemoveItemButtonClick(item: ICombinationVM): void {
    this.items.remove(item);

    if (this.selectedItem === item) {
      this.selectedItem = undefined;
    }
  }

  public async onAddGoodsBuildGoodsButtonClick(type: "외층" | "중층" | "내층"): Promise<void> {
    if (type === "외층") {
      const result = await this._modal.show(StockSearchModal, "투입자재 검색(외층)", {
        isMulti: true
      });
      if (!result) return;

      this.selectedItem!.outSideBomList = this.selectedItem!.outSideBomList || [];
      for (const outSideInputItem of result || []) {
        if (this.selectedItem!.outSideBomList!.filter(item => item.lotId === outSideInputItem.lotId).length < 1) {
          if ((await this._getBomInfo(this.selectedItem!.bomListId!, "외층", outSideInputItem.goodId) || 0) < 1) {
            if (!confirm("\'" + outSideInputItem.goodName + "'\ 은 BOM에 없는 원재료 입니다.\n투입하시겠습니까?")) return;
          }

          this.selectedItem!.outSideBomList!.insert(0, {
            id: undefined,
            goodsBuildListId: this.selectedItem!.bomListId,
            goodsBuildGoodsId: undefined,
            type: "외층",
            goodId: outSideInputItem.goodId,
            goodName: outSideInputItem.goodName,
            specification: outSideInputItem.specification,
            rating: outSideInputItem.rating,
            mixPercent: undefined,
            lotId: outSideInputItem.lotId,
            lotName: outSideInputItem.lotName,
            warehouseId: outSideInputItem.warehouseId,
            unitWeight: undefined,
            unitQuantity: undefined,
            inputWeight: outSideInputItem.weight,
            totalQuantity: undefined,
            quantityPercent: undefined
          });
        }
        this._cdr.markForCheck();
      }
    }
    else if (type === "중층") {
      const result = await this._modal.show(StockSearchModal, "투입자재 검색(중층)", {
        isMulti: true
      });
      if (!result) return;

      this.selectedItem!.middleBomList = this.selectedItem!.middleBomList || [];
      for (const middleInputItem of result || []) {
        if (this.selectedItem!.middleBomList!.filter(item => item.lotId === middleInputItem.lotId).length < 1) {
          if ((await this._getBomInfo(this.selectedItem!.bomListId!, "중층", middleInputItem.goodId) || 0) < 1) {
            if (!confirm("\'" + middleInputItem.goodName + "'\ 은 BOM에 없는 원재료 입니다.\n투입하시겠습니까?")) return;
          }
          this.selectedItem!.middleBomList!.insert(0, {
            id: undefined,
            goodsBuildListId: this.selectedItem!.bomListId,
            goodsBuildGoodsId: undefined,
            type: "중층",
            goodId: middleInputItem.goodId,
            goodName: middleInputItem.goodName,
            specification: middleInputItem.specification,
            rating: middleInputItem.rating,
            mixPercent: undefined,
            lotId: middleInputItem.lotId,
            lotName: middleInputItem.lotName,
            warehouseId: middleInputItem.warehouseId,
            unitWeight: undefined,
            unitQuantity: undefined,
            inputWeight: middleInputItem.weight,
            totalQuantity: undefined,
            quantityPercent: undefined
          });
        }
        this._cdr.markForCheck();
      }
    }
    else {
      const result = await this._modal.show(StockSearchModal, "투입자재 검색(내층)", {
        isMulti: true
      });
      if (!result) return;


      this.selectedItem!.inSideBomList = this.selectedItem!.inSideBomList || [];
      for (const inSideItem of result || []) {
        if (this.selectedItem!.inSideBomList!.filter(item => item.lotId === inSideItem.lotId).length < 1) {
          if ((await this._getBomInfo(this.selectedItem!.bomListId!, "내층", inSideItem.goodId) || 0) < 1) {
            if (!confirm("\'" + inSideItem.goodName + "'\ 은 BOM에 없는 원재료 입니다.\n투입하시겠습니까?")) return;
          }
          this.selectedItem!.inSideBomList!.insert(0, {
            id: undefined,
            goodsBuildListId: this.selectedItem!.bomListId,
            goodsBuildGoodsId: undefined,
            type: "내층",
            goodId: inSideItem.goodId,
            goodName: inSideItem.goodName,
            specification: inSideItem.specification,
            rating: inSideItem.rating,
            unitWeight: undefined,
            mixPercent: undefined,
            lotId: inSideItem.lotId,
            lotName: inSideItem.lotName,
            warehouseId: inSideItem.warehouseId,
            unitQuantity: undefined,
            inputWeight: inSideItem.weight,
            totalQuantity: undefined,
            quantityPercent: undefined
          });
        }
        this._cdr.markForCheck();
      }
    }
    this._cdr.markForCheck();
  }

  public async onOutsideBomRemoveButtonClick(item: IOutSideBomListVM): Promise<void> {
    this.selectedItem!.outSideBomList!.remove(item);
  }

  public async onInsideBomRemoveButtonClick(item: IInSideBomListVM): Promise<void> {
    this.selectedItem!.inSideBomList!.remove(item);
  }

  public async onMiddilesideBomRemoveButtonClick(item: IMiddleBomListVM): Promise<void> {
    this.selectedItem!.middleBomList!.remove(item);
  }

  public async productionInstructionSearchModalOpenButtonClick(item: ICombinationVM): Promise<void> {
    const result = await this._modal.show(ProductionInstructionSearchModal, "생산지시 검색", {
      isMulti: false,
      isCombinationSearch: true
    });
    if (!result) return;

    if (this.items.filter(item1 => item1.productionOrderId === result.id).length < 1) {
      item.productionOrderId = result.id;
      item.equipmentId = result.equipmentId;
      item.goodName = result.goodName;
      item.goodId = result.goodId;
      item.specification = result.specification;
      item.bomListId = result.bomListId;
      item.productionOrderQuantity = result.productQuantity;
      item.planInputQuantity = (await this._getGoodsBuildGoods(result.bomListId, result.goodId) || 0) * (result.productQuantity || 0);

      this.selectedItem = undefined;

    }
    this._cdr.markForCheck();
  }

  public async outSideBomSearchModalOpenButtonClick(item: IOutSideBomListVM): Promise<void> {
    const result = await this._modal.show(StockSearchModal, "투입자재 검색(외층)", {
      isMulti: false,
      goodId: item.goodId
    });
    if (!result) return;

    item.lotId = result.lotId;
    item.lotName = result.lotName;
    item.goodName = result.goodName;
    item.specification = result.specification;
    item.goodId = result.goodId;
    item.rating = result.rating;
    item.inputWeight = result.weight;
    item.warehouseId = result.warehouseId;
    item.totalQuantity = (item.inputWeight || 0) * (item.unitQuantity || 0);

    this._cdr.markForCheck();
  }

  public async inSideBomSearchModalOpenButtonClick(item: IInSideBomListVM): Promise<void> {
    const result = await this._modal.show(StockSearchModal, "투입자재 검색(내층)", {
      isMulti: false,
      goodId: item.goodId
    });
    if (!result) return;

    item.lotId = result.lotId;
    item.lotName = result.lotName;
    item.goodName = result.goodName;
    item.specification = result.specification;
    item.goodId = result.goodId;
    item.rating = result.rating;
    item.inputWeight = result.weight;
    item.warehouseId = result.warehouseId;
    item.totalQuantity = (item.inputWeight || 0) * (item.unitQuantity || 0);


    this._cdr.markForCheck();
  }

  public async middleBomSearchModalOpenButtonClick(item: IMiddleBomListVM): Promise<void> {
    const result = await this._modal.show(StockSearchModal, "투입자재 검색(중층)", {
      isMulti: false,
      goodId: item.goodId
    });
    if (!result) return;

    item.lotId = result.lotId;
    item.lotName = result.lotName;
    item.goodName = result.goodName;
    item.specification = result.specification;
    item.goodId = result.goodId;
    item.rating = result.rating;
    item.inputWeight = result.weight;
    item.warehouseId = result.warehouseId;
    item.totalQuantity = (item.inputWeight || 0) * (item.unitQuantity || 0);

    this._cdr.markForCheck();
  }

  public async inputReturnModalOpenButtonClick(item: ICombinationVM): Promise<void> {
    const result = await this._modal.show(CombinationInputReturnModal, "일반자재 반납", {combinationId: item.id!});
    if (!result) return;

    item.generalTotalQuantity = await this._getInputTotalQuantity(item, false);
    this._cdr.markForCheck();
  }

  public async inputReturnLdpeModalOpenButtonClick(item: ICombinationVM): Promise<void> {
    const result = await this._modal.show(LdpeReturnModal, "LDPE 반납", {
      combinationId: item.id!,
      productionInstructionId: item.productionOrderId!
    });
    if (!result) return;

    item.ldpeTotalQuantity = await this._getInputTotalQuantity(item, true);
    this._cdr.markForCheck();
  }

  private async _getBomInfo(bomId: number, type: "외층" | "내층" | "중층", goodId: number): Promise<number | undefined> {
    return await this._orm.connectAsync(MainDbContext, async db => {
      const seq = await db.goodsBuildList
        .include(item => item.goodsBuildGoods)
        .include(item => item.goodsBuildGoods![0].goods)
        .where(item => [
          sorm.and([
            sorm.equal(item.companyId, this._appData.authInfo!.companyId),
            sorm.equal(item.id, bomId),
            sorm.equal(item.goodsBuildGoods![0].type, type),
            sorm.equal(item.goodsBuildGoods![0].goodsId, goodId)
          ])
        ])
        .countAsync();
      return seq;
    });
  }

  private async _getGoodsBuildGoods(bomId: number, goodId: number): Promise<number | undefined> {
    return await this._orm.connectAsync(MainDbContext, async db => {
      let result: any | undefined;
      if (bomId) {
        result = await db.goodsBuildGoods
          .where(item => [
            sorm.equal(item.bomListId, bomId)
          ])
          .select(item => ({
            quantity: sorm.formula(sorm.sum(sorm.ifNull(item.weight)), "*", 0.001)
          }))
          .singleAsync();
      }
      else {
        result = await db.goodsBuildGoods
          .include(item => item.bomList)
          .where(item => [
            sorm.equal(item.goodsId, goodId),
            sorm.equal(item.bomList!.isStander, true)
          ])
          .select(item => ({
            quantity: sorm.formula(sorm.sum(sorm.ifNull(item.weight)), "*", 0.001)
          }))
          .singleAsync();
      }

      return result ? result.quantity : 1;
    });
  }

  public onChangeOutSideTotal(item: any): void {
    const sum = this.selectedItem!.outSideBomList ?
      this.selectedItem!.outSideBomList!.sum(item1 => Number(item1.inputWeight || 0) * Number(item1.unitQuantity || 0)) : undefined;
    this.selectedItem!.outSideTotalQuantity = sum || 0;

    item.totalQuantity = (item.inputWeight || 0) * (item.unitQuantity || 0);

    /*    this.selectedItem!.realInputQuantity = (this.selectedItem!.inSideTotalQuantity || 0)
          + (this.selectedItem!.middleTotalQuantity || 0) + (this.selectedItem!.outSideTotalQuantity || 0);*/

    this._cdr.markForCheck();
  }

  public onChangeMiddleTotal(item: any): void {
    const sum = this.selectedItem!.middleBomList ?
      this.selectedItem!.middleBomList!.sum(item1 => Number(item1.inputWeight || 0) * Number(item1.unitQuantity || 0)) : undefined;
    this.selectedItem!.middleTotalQuantity = sum || 0;

    item.totalQuantity = (item.inputWeight || 0) * (item.unitQuantity || 0);

    /*    this.selectedItem!.realInputQuantity = (this.selectedItem!.inSideTotalQuantity || 0)
          + (this.selectedItem!.middleTotalQuantity || 0) + (this.selectedItem!.outSideTotalQuantity || 0);*/

    this._cdr.markForCheck();
  }

  public onChangeInSideTotal(item: any): void {
    const sum = this.selectedItem!.inSideBomList ?
      this.selectedItem!.inSideBomList!.sum(item1 => Number(item1.inputWeight || 0) * Number(item1.unitQuantity || 0)) : undefined;
    this.selectedItem!.inSideTotalQuantity = sum || 0;

    item.totalQuantity = (item.inputWeight || 0) * (item.unitQuantity || 0);
    /*    this.selectedItem!.realInputQuantity = (this.selectedItem!.inSideTotalQuantity || 0)
          + (this.selectedItem!.middleTotalQuantity || 0) + (this.selectedItem!.outSideTotalQuantity || 0);*/

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

  public async onSelectedItemChanged(item: ICombinationVM): Promise<void> {
    await this._selectItem(item);
    this._cdr.markForCheck();
  }

  private async _selectItem(selectedItem: ICombinationVM): Promise<void> {
    this.selectedItem = selectedItem;

    if (selectedItem && selectedItem.productionOrderId) {
      this.mainBusyCount++;

      // 다른 ITEM 클릭하기 전에 저장 할 수 있도록 ...?
      /*  if (selectedItem.outSideBomList || selectedItem.middleBomList || selectedItem.inSideBomList) {
          if (!confirm("저장하지 않은 투입 항목이 존재합니다.\n저장시겠습니까?")) return;
        }*/
      try {
        await this._orm.connectAsync(MainDbContext, async db => {
          let goodBomInfo: any | undefined;

          // 생산지시 때 등록 된 BOM기준으로 가져오기
          if (selectedItem.bomListId) {
            goodBomInfo = await db.goodsBuildList
              .include(item => item.goodsBuildGoods)
              .include(item => item.goodsBuildGoods![0].goods)
              .where(item => [
                sorm.and([
                  sorm.equal(item.companyId, this._appData.authInfo!.companyId),
                  sorm.equal(item.id, selectedItem.bomListId)
                ])
              ])
              .select(item => ({
                id: item.id,
                name: item.name,
                isStander: item.isStander,
                isDisabled: item.isDisabled,
                goodsBuildGoods: item.goodsBuildGoods && item.goodsBuildGoods.map(item1 => ({
                  id: item1.id,
                  type: item1.type,
                  goodId: item1.goodsId,
                  goodName: item1.goods!.name,
                  specification: item1.goods!.specification,
                  mixPercent: sorm.ifNull(item1.mixPercent, 0),
                  weight: sorm.formula(sorm.ifNull(item1.weight, 0), "*", 0.001),
                  totalQuantity: undefined
                }))
              }))
              .singleAsync();
          }
          else {
            goodBomInfo = await db.goodsBuildList
              .include(item => item.goodsBuildGoods)
              .include(item => item.goodsBuildGoods![0].goods)
              .where(item => [
                sorm.and([
                  sorm.equal(item.companyId, this._appData.authInfo!.companyId),
                  sorm.equal(item.goodId, selectedItem.goodId),
                  sorm.equal(item.isStander, true)
                ])
              ])
              .select(item => ({
                id: item.id,
                name: item.name,
                isStander: item.isStander,
                isDisabled: item.isDisabled,
                goodsBuildGoods: item.goodsBuildGoods && item.goodsBuildGoods.map(item1 => ({
                  id: item1.id,
                  type: item1.type,
                  goodId: item1.goodsId,
                  goodName: item1.goods!.name,
                  specification: item1.goods!.specification,
                  mixPercent: sorm.ifNull(item1.mixPercent, 0),
                  weight: sorm.formula(sorm.ifNull(item1.weight, 0), "*", 0.001)
                }))
              }))
              .singleAsync();
          }

          if (goodBomInfo && goodBomInfo.goodsBuildGoods) {

            selectedItem.outSideBomList = selectedItem.outSideBomList || [];
            selectedItem.middleBomList = selectedItem.middleBomList || [];
            selectedItem.inSideBomList = selectedItem.inSideBomList || [];

            for (const builGoodItem of goodBomInfo.goodsBuildGoods || []) {
              if (builGoodItem.type === "외층") {
                if (selectedItem.outSideBomList.filter(item1 => item1.goodId === builGoodItem.goodId).length < 1) {
                  selectedItem.outSideBomList!.push({
                    id: undefined,
                    goodsBuildListId: selectedItem.bomListId,
                    goodsBuildGoodsId: builGoodItem.id,
                    type: "외층",
                    goodId: builGoodItem.goodId,
                    goodName: builGoodItem.goodName,
                    unitWeight: Number(builGoodItem.weight),
                    specification: builGoodItem.specification,
                    mixPercent: Number(builGoodItem.mixPercent),
                    rating: undefined,
                    lotId: undefined,
                    lotName: undefined,
                    warehouseId: undefined,
                    unitQuantity: 1,
                    inputWeight: undefined,
                    quantityPercent: undefined,
                    totalQuantity: 1
                  });
                }
              }
              else if (builGoodItem.type === "중층") {
                if (selectedItem.middleBomList.filter(item1 => item1.goodId === builGoodItem.goodId).length < 1) {
                  selectedItem.middleBomList!.push({
                    id: undefined,
                    goodsBuildListId: selectedItem.bomListId,
                    goodsBuildGoodsId: builGoodItem.id,
                    type: "중층",
                    goodId: builGoodItem.goodId,
                    goodName: builGoodItem.goodName,
                    specification: builGoodItem.specification,
                    mixPercent: Number(builGoodItem.mixPercent),
                    rating: undefined,
                    lotId: undefined,
                    lotName: undefined,
                    warehouseId: undefined,
                    unitQuantity: 1,
                    unitWeight: Number(builGoodItem.weight),
                    inputWeight: undefined,
                    quantityPercent: undefined,
                    totalQuantity: 1
                  });
                }
              }
              else {
                if (selectedItem.inSideBomList.filter(item1 => item1.goodId === builGoodItem.goodId).length < 1) {
                  selectedItem.inSideBomList!.push({
                    id: undefined,
                    goodsBuildListId: selectedItem.bomListId,
                    goodsBuildGoodsId: builGoodItem.id,
                    type: "내층",
                    goodId: builGoodItem.goodId,
                    goodName: builGoodItem.goodName,
                    specification: builGoodItem.specification,
                    mixPercent: Number(builGoodItem.mixPercent),
                    rating: undefined,
                    lotId: undefined,
                    lotName: undefined,
                    warehouseId: undefined,
                    unitQuantity: 1,
                    unitWeight: Number(builGoodItem.weight),
                    inputWeight: undefined,
                    quantityPercent: undefined,
                    totalQuantity: 1
                  });
                }
              }
            }
            if (this.selectedItem) {
              this.selectedItem!.inSideTotalQuantity = selectedItem.inSideBomList ? selectedItem.inSideBomList!.sum(item => ((item.unitQuantity || 0) * (item.inputWeight || 0))) : 0;
              this.selectedItem!.middleTotalQuantity = selectedItem.middleBomList ? selectedItem.middleBomList!.sum(item => ((item.unitQuantity || 0) * (item.inputWeight || 0))) : 0;
              this.selectedItem!.outSideTotalQuantity = selectedItem.outSideBomList ? selectedItem.outSideBomList!.sum(item => ((item.unitQuantity || 0) * (item.inputWeight || 0))) : 0;
            }
          }
        });
      }
      catch (err) {
        this._toast.danger(err.message);
        if (process.env.NODE_ENV !== "production") console.error(err);
      }

      this.mainBusyCount--;
    }
  }

  private async _getInputTotalQuantity(item: ICombinationVM, isLdpeReturn: boolean): Promise<number | undefined> {
    return await this._orm.connectAsync(MainDbContext, async db => {
      let result: any | undefined;

      if (isLdpeReturn) {
        result = await db.inputLdpeReturn
          .where(item1 => [
            sorm.equal(item1.mixingProcessId, item.id)
          ])
          .select(item1 => ({
            quantity: sorm.sum(sorm.ifNull(item1.quantity))
          }))
          .singleAsync();
      }
      else {
        result = await db.inputGeneralReturn
          .where(item1 => [
            sorm.equal(item1.mixingProcessId, item.id)
          ])
          .select(item1 => ({
            quantity: sorm.sum(sorm.ifNull(item1.quantity))
          }))
          .singleAsync();
      }

      return result ? result.quantity : undefined;
    });
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

    for (const diffTargetItem of diffTargets) {
      for (const outSideBomItem of diffTargetItem.outSideBomList || []) {
        if (!outSideBomItem.inputWeight) {
          this._toast.danger("외층 : 중량 값을 정확히 입력해 주세요.");
          return;
        }
      }

      for (const middleBomItem of diffTargetItem.middleBomList || []) {
        if (!middleBomItem.inputWeight) {
          this._toast.danger("중층: 중량 값을 정확히 입력해 주세요.");
          return;
        }
      }

      for (const inSideBomItem of diffTargetItem.inSideBomList || []) {
        if (!inSideBomItem.inputWeight) {
          this._toast.danger("내층: 중량 값을 정확히 입력해 주세요.");
          return;
        }
      }

      if (diffTargetItem.outSideBomList && diffTargetItem.outSideBomList.some(item => !item.lotId)
        || diffTargetItem.middleBomList && diffTargetItem.middleBomList.some(item => !item.lotId)
        || diffTargetItem.inSideBomList && diffTargetItem.inSideBomList.some(item => !item.lotId)) {
        if (confirm("BOM이 입력되지 않은 항목이 존재합니다.\n진행하시겠습니까? (진행 시 BOM이 입력 된 항목만 저장 됩니다.)")) {
          this.items.forEach(item => {
            if (item.outSideBomList) {
              item.outSideBomList!.forEach(item1 => {
                if (!item1.lotId) item.outSideBomList!.remove(item1);
              });
            }
            if (item.middleBomList) {
              item.middleBomList!.forEach(item1 => {
                if (!item1.lotId) item.middleBomList!.remove(item1);
              });
            }
            if (item.inSideBomList) {
              item.inSideBomList!.forEach(item1 => {
                if (!item1.lotId) item.inSideBomList!.remove(item1);
              });
            }
          });

          const diffChangeTargets = this.orgItems.diffs(this.items, {keyProps: ["id"]}).map(item => item.target!);

          if (diffChangeTargets.length < 1) {
            this._toast.info("변경사항이 없습니다.");
            if (process.env.NODE_ENV === "test") console.log("변경사항이 없습니다.");
            return;
          }
        }
        else {
          return;
        }
      }

    }

    this.viewBusyCount++;

    try {

      await this._orm.connectAsync(MainDbContext, async db => {
        for (const diff of diffs) {
          // INSERT
          if (!diff.target!.id) {
            const newBomInfo = await db.mixingProcess
              .insertAsync({
                companyId: this._appData.authInfo!.companyId,
                productionOrderId: diff.target!.productionOrderId!,
                equipmentId: diff.target!.equipmentId!,
                goodsId: diff.target!.goodId!,
                createdByEmployeeId: this._appData.authInfo!.employeeId,
                createdAtDateTime: new DateTime()
              });
            diff.target!.id = newBomInfo.id;

            await db.productionInstruction
              .where(item => [
                sorm.equal(item.id, diff.target!.productionOrderId)]
              )
              .updateAsync(() => ({
                isCombination: newBomInfo.id
              }));


            let seq = 1;
            if (diff.target!.inSideBomList) {
              for (const bomListItem of diff.target!.inSideBomList!.filter(item => !!item.lotId) || []) {

                const quantity = (bomListItem.inputWeight || 1) * (bomListItem.unitQuantity || 0);
                const newInputHistory = await db.inputHistory
                  .insertAsync({
                    companyId: this._appData.authInfo!.companyId,
                    mixingProcessId: newBomInfo.id!,
                    mixingProcessSeq: seq,
                    inputDate: new DateOnly(),
                    seq: diff.target!.inSideBomSeq!,
                    type: "내층",
                    goodsId: bomListItem.goodId!,
                    lotId: bomListItem.lotId!,
                    sack: bomListItem.unitQuantity,
                    weight: bomListItem.inputWeight,
                    quantityPercent: bomListItem.quantityPercent,
                    quantity,
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: this._appData.authInfo!.employeeId
                  });

                bomListItem.id = newInputHistory.id;
                seq++;
                await StockProc.modifyStock(db, this._appData.authInfo!.companyId, bomListItem.goodId!, quantity, bomListItem.lotId, bomListItem.warehouseId, "-", bomListItem.rating);

              }
            }

            if (diff.target!.middleBomList) {
              for (const bomListItem of diff.target!.middleBomList!.filter(item => !!item.lotId) || []) {
                const quantity = (bomListItem.inputWeight || 1) * (bomListItem.unitQuantity || 0);

                const newInputHistory = await db.inputHistory
                  .insertAsync({
                    companyId: this._appData.authInfo!.companyId,
                    mixingProcessId: newBomInfo.id!,
                    mixingProcessSeq: seq,
                    inputDate: new DateOnly(),
                    seq: diff.target!.middleBomSeq!,
                    type: "중층",
                    goodsId: bomListItem.goodId!,
                    lotId: bomListItem.lotId!,
                    sack: bomListItem.unitQuantity,
                    weight: bomListItem.inputWeight,
                    quantityPercent: bomListItem.quantityPercent,
                    quantity,
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: this._appData.authInfo!.employeeId
                  });
                bomListItem.id = newInputHistory.id;
                seq++;
                await StockProc.modifyStock(db, this._appData.authInfo!.companyId, bomListItem.goodId!, quantity, bomListItem.lotId, bomListItem.warehouseId, "-", bomListItem.rating);
              }
            }

            if (diff.target!.outSideBomList) {
              for (const bomListItem of diff.target!.outSideBomList!.filter(item => !!item.lotId) || []) {
                const quantity = (bomListItem.inputWeight || 1) * (bomListItem.unitQuantity || 0);
                const newInputHistory = await db.inputHistory
                  .insertAsync({
                    companyId: this._appData.authInfo!.companyId,
                    mixingProcessId: newBomInfo.id!,
                    mixingProcessSeq: seq,
                    inputDate: new DateOnly(),
                    seq: diff.target!.outSideBomSeq!,
                    type: "외층",
                    goodsId: bomListItem.goodId!,
                    lotId: bomListItem.lotId!,
                    sack: bomListItem.unitQuantity,
                    weight: bomListItem.inputWeight,
                    quantityPercent: bomListItem.quantityPercent,
                    quantity,
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: this._appData.authInfo!.employeeId
                  });
                bomListItem.id = newInputHistory.id;
                seq++;
                await StockProc.modifyStock(db, this._appData.authInfo!.companyId, bomListItem.goodId!, quantity, bomListItem.lotId, bomListItem.warehouseId, "-", bomListItem.rating);
              }
            }


          }
          else {
            let seq = 1;
            for (const bomListItem of diff.target!.inSideBomList || []) {
              const quantity = (bomListItem.inputWeight || 1) * (bomListItem.unitQuantity || 0);
              const newInputHistory = await db.inputHistory
                .insertAsync({
                  companyId: this._appData.authInfo!.companyId,
                  mixingProcessId: diff.target!.id!,
                  mixingProcessSeq: seq,
                  inputDate: new DateOnly(),
                  seq: diff.target!.inSideBomSeq!,
                  type: "내층",
                  goodsId: bomListItem.goodId!,
                  lotId: bomListItem.lotId!,
                  sack: bomListItem.unitQuantity,
                  weight: bomListItem.inputWeight,
                  quantityPercent: bomListItem.quantityPercent,
                  quantity,
                  createdAtDateTime: new DateTime(),
                  createdByEmployeeId: this._appData.authInfo!.employeeId
                });
              bomListItem.id = newInputHistory.id;
              seq++;
              await StockProc.modifyStock(db, this._appData.authInfo!.companyId, bomListItem.goodId!, quantity, bomListItem.lotId, bomListItem.warehouseId, "-", bomListItem.rating);
            }

            for (const bomListItem of diff.target!.middleBomList || []) {
              const quantity = (bomListItem.inputWeight || 1) * (bomListItem.unitQuantity || 0);
              const newInputHistory = await db.inputHistory
                .insertAsync({
                  companyId: this._appData.authInfo!.companyId,
                  mixingProcessId: diff.target!.id!,
                  mixingProcessSeq: seq,
                  inputDate: new DateOnly(),
                  seq: diff.target!.middleBomSeq!,
                  type: "중층",
                  goodsId: bomListItem.goodId!,
                  lotId: bomListItem.lotId!,
                  sack: bomListItem.unitQuantity,
                  weight: bomListItem.inputWeight,
                  quantityPercent: bomListItem.quantityPercent,
                  quantity,
                  createdAtDateTime: new DateTime(),
                  createdByEmployeeId: this._appData.authInfo!.employeeId
                });
              bomListItem.id = newInputHistory.id;
              seq++;
              await StockProc.modifyStock(db, this._appData.authInfo!.companyId, bomListItem.goodId!, quantity, bomListItem.lotId, bomListItem.warehouseId, "-", bomListItem.rating);
            }

            for (const bomListItem of diff.target!.outSideBomList || []) {
              const quantity = (bomListItem.inputWeight || 1) * (bomListItem.unitQuantity || 0);
              const newInputHistory = await db.inputHistory
                .insertAsync({
                  companyId: this._appData.authInfo!.companyId,
                  mixingProcessId: diff.target!.id!,
                  mixingProcessSeq: seq,
                  inputDate: new DateOnly(),
                  seq: diff.target!.outSideBomSeq!,
                  type: "외층",
                  goodsId: bomListItem.goodId!,
                  lotId: bomListItem.lotId!,
                  sack: bomListItem.unitQuantity,
                  weight: bomListItem.inputWeight,
                  quantityPercent: bomListItem.quantityPercent,
                  quantity,
                  createdAtDateTime: new DateTime(),
                  createdByEmployeeId: this._appData.authInfo!.employeeId
                });
              bomListItem.id = newInputHistory.id;
              seq++;
              await StockProc.modifyStock(db, this._appData.authInfo!.companyId, bomListItem.goodId!, quantity, bomListItem.lotId, bomListItem.warehouseId, "-", bomListItem.rating);
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
          .wrap(MixingProcess)
          .include(item => item.productionInstruction)
          .include(item => item.goods)
          .include(item => item.inputGeneralReturn)
          .include(item => item.inputLdpeReturn)
          .include(item => item.employee)
          .include(item => item.inputHistory)
          .include(item => item.inputHistory![0].goods)
          .include(item => item.inputHistory![0].lot)
          .join(
            GoodsBuildGoods,
            "productionInstructionInfo",
            (qb, en) => qb
              .where(item => [
                sorm.equal(item.bomListId, en.productionInstruction!.bomId)
              ])
              .select(item => ({
                quantity: sorm.sum(sorm.ifNull(item.weight))
              })),
            true
          )
          .join(
            InputHistory,
            "inputHistoryInfo",
            (qb, en) => qb
              .where(item => [
                sorm.equal(item.mixingProcessId, en.id)
              ])
              .select(item => ({
                quantity: sorm.sum(sorm.ifNull(item.quantity))
              })),
            true
          )
          .join(
            InputGeneralReturn,
            "inputGeneralInfo",
            (qb, en) => qb
              .where(item => [
                sorm.equal(item.mixingProcessId, en.id)
              ])
              .select(item => ({
                quantity: sorm.sum(sorm.ifNull(item.quantity))
              })),
            true
          )
          .join(
            InputLdpeReturn,
            "inputLdpeInfo",
            (qb, en) => qb
              .where(item => [
                sorm.equal(item.mixingProcessId, en.id)
              ])
              .select(item => ({
                quantity: sorm.sum(sorm.ifNull(item.quantity))
              })),
            true
          )
          .select(item => ({
            id: item.id,
            productionOrderId: item.productionOrderId,
            equipmentId: item.productionInstruction!.equipmentId,
            productionOrderQuantity: item.productionQuantity,
            goodId: item.goodsId,
            goodName: item.goods!.name,
            specification: item.goods!.specification,
            bomListId: item.productionInstruction!.bomId,
            planInputQuantity: sorm.formula(sorm.formula(item.productionInstruction!.productQuantity, "*", sorm.ifNull(item.productionInstructionInfo!.quantity, 1)), "*", 0.001),
            realInputQuantity: sorm.ifNull(item.inputHistoryInfo!.quantity, 0),
            generalTotalQuantity: sorm.ifNull(item.inputGeneralInfo!.quantity, undefined),
            ldpeTotalQuantity: sorm.ifNull(item.inputLdpeInfo!.quantity, undefined),
            createdByEmployeeId: item.createdByEmployeeId,
            createdByEmployeeName: item.employee!.name,
            createdAtDateTime: item.createdAtDateTime,

            inputHistory: item.inputHistory && item.inputHistory.map(item1 => ({
              id: item1.id,
              seq: item1.mixingProcessSeq,
              order: item1.seq,
              goodId: item1.goodsId,
              goodName: item1.goods!.name,
              specification: item1.goods!.specification,
              lotId: item1.lotId,
              lotName: item1.lot!.lot,
              type: item1.type,
              sack: item1.sack,
              weight: item1.weight
            })) || undefined,

            outSideBomList: undefined,
            outSideBomSeq: 1,
            outSideTotalQuantity: undefined,
            inSideBomList: undefined,
            inSideBomSeq: 1,
            inSideTotalQuantity: undefined,
            middleBomList: undefined,
            middleBomSeq: 1,
            middleTotalQuantity: undefined


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

  private _getSearchQueryable(db: MainDbContext): Queryable<MixingProcess> {
    let queryable = db.mixingProcess
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);

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

    if (this.lastFilter!.productionInstructionId) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.productionOrderId, this.lastFilter!.productionInstructionId)
        ]);
    }

    /* if (this.lastFilter!.productionOrder) {
       queryable = queryable
         .include(item => item.productionInstruction)
         .where(item => [
           sorm.includes(item.productionInstruction!.productionInstructionCode, this.lastFilter!.productionOrder)
         ]);
     }*/

    return queryable;
  }
}

interface IFilterVM {
  goodName?: string;
  specification?: string;
  productionOrder?: string;
  productionInstructionId?: number;
}

interface ICombinationVM {
  id: number | undefined;
  productionOrderId: number | undefined;
  equipmentId: number | undefined;
  productionOrderQuantity: number | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  specification: string | undefined;
  bomListId: number | undefined;
  planInputQuantity: number | undefined;
  realInputQuantity: number | undefined;
  generalTotalQuantity: number | undefined;
  ldpeTotalQuantity: number | undefined;
  createdByEmployeeId: number | undefined;
  createdByEmployeeName: string | undefined;
  createdAtDateTime: DateTime | undefined;

  outSideBomList: IOutSideBomListVM[] | undefined;
  outSideBomSeq: number | undefined;
  outSideTotalQuantity: number | undefined;
  inSideBomList: IInSideBomListVM[] | undefined;
  inSideBomSeq: number | undefined;
  inSideTotalQuantity: number | undefined;
  middleBomList: IMiddleBomListVM[] | undefined;
  middleBomSeq: number | undefined;
  middleTotalQuantity: number | undefined;
  inputHistory: ICombinationInputHistoryVM[] | undefined;
}

interface ICombinationInputHistoryVM {
  id: number | undefined;
  seq: number | undefined;
  order: number | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  specification: string | undefined;
  lotId: number | undefined;
  lotName: string | undefined;
  type: "내층" | "외층" | "중층" | undefined;
  sack: number | undefined;
  weight: number | undefined;
}

interface IOutSideBomListVM {
  id: number | undefined;
  goodsBuildListId: number | undefined;
  goodsBuildGoodsId: number | undefined;
  type: "외층";
  goodId: number | undefined;
  goodName: string | undefined;
  specification: string | undefined;
  warehouseId: number | undefined;
  rating: "A" | "B" | "C" | "공통" | undefined;
  mixPercent: number | undefined;
  quantityPercent: number | undefined;
  lotId: number | undefined;
  lotName: string | undefined;
  unitWeight: number | undefined;
  unitQuantity: number | undefined;
  inputWeight: number | undefined;
  totalQuantity: number | undefined;
}

interface IInSideBomListVM {
  id: number | undefined;
  goodsBuildListId: number | undefined;
  goodsBuildGoodsId: number | undefined;
  type: "내층";
  goodId: number | undefined;
  goodName: string | undefined;
  specification: string | undefined;
  warehouseId: number | undefined;
  rating: "A" | "B" | "C" | "공통" | undefined;
  mixPercent: number | undefined;
  quantityPercent: number | undefined;
  lotId: number | undefined;
  lotName: string | undefined;
  unitWeight: number | undefined;
  unitQuantity: number | undefined;
  inputWeight: number | undefined;
  totalQuantity: number | undefined;
}

interface IMiddleBomListVM {
  id: number | undefined;
  goodsBuildListId: number | undefined;
  goodsBuildGoodsId: number | undefined;
  type: "중층";
  goodId: number | undefined;
  goodName: string | undefined;
  specification: string | undefined;
  warehouseId: number | undefined;
  rating: "A" | "B" | "C" | "공통" | undefined;
  mixPercent: number | undefined;
  quantityPercent: number | undefined;
  lotId: number | undefined;
  lotName: string | undefined;
  unitWeight: number | undefined;
  unitQuantity: number | undefined;
  inputWeight: number | undefined;
  totalQuantity: number | undefined;
}