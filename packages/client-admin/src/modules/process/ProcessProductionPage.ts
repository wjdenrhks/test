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
  SdDomValidatorProvider,
  SdModalProvider,
  SdOrmProvider, SdPrintProvider,
  SdToastProvider
} from "@simplism/angular";
import {AppDataProvider} from "@sample/client-common";
import {
  CodeProc,
  MainDbContext,
  Production, StockProc
} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {ProductionInstructionSearchModal} from "../../modals/ProductionInstructionSearchModal";
import {Queryable} from "@simplism/orm-client";
import {GoodsSearchModal} from "../../modals/GoodsSearchModal";
import {ExcelWorkbook} from "@simplism/excel";
import {SmallBarcodePrintTemplate} from "../../print-templates/SmallBarcodePrintTemplate";
import {EquipmentInfoShowModal} from "../../modals/EquipmentInfoShowModal";
import {ShowManualModal} from "../../modals/ShowManualModal";
import {ProductionItemDetailRegisterModal} from "../../modals/ProductionItemDetailRegisterModal";
import {ActivatedRoute} from "@angular/router";
import {PackingBarcodePrintTemplate} from "../../print-templates/PackingBarcodePrintTemplate";

@Component({
  selector: "app-process-production",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>생산실적 등록</h4>
          <sd-topbar-menu (click)="onAddItemButtonClick()">
            <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
            행 추가
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onSaveButtonClick()">
            <sd-icon [icon]="'save'" [fixedWidth]="true"></sd-icon>
            저장
          </sd-topbar-menu>
          <sd-topbar-menu *ngIf="lastFilter && (items && orgItems.length > 0)" (click)="onDownloadButtonClick()">
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
              <sd-form-item [label]="'생산일'">
                <sd-textfield [(value)]="filter.fromDate" [type]="'date'"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'~'">
                <sd-textfield [(value)]="filter.toDate" [type]="'date'"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'설비'">
                <sd-select [(value)]="filter.equipmentId">
                  <sd-select-item [value]="undefined">전체</sd-select-item>
                  <sd-select-item *ngFor="let equipment of equipmentList; trackBy: trackByMeFn"
                                  [value]="equipment.id"
                                  [hidden]="equipment.isDisabled">
                    {{ equipment.name }}
                  </sd-select-item>
                </sd-select>
              </sd-form-item>
              <br>
              <sd-form-item [label]="'생산지시 No'">
                <sd-textfield [(value)]="filter.productionOrderCode"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'품목명'">
                <app-good-name-select [(value)]="filter.goodName"></app-good-name-select>
              </sd-form-item>
              <sd-form-item [label]="'규격'">
                <app-goods-specification-select [(value)]="filter.specification"
                                                [goodName]="filter.goodName"></app-goods-specification-select>
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
            <sd-form [inline]="true" (submit)="onSearchLotSubmit()" style="float: right;">
              <sd-form-item [label]="'LOT'" style="padding-top: 35px; padding-right: 15px;">
                <sd-textfield [(value)]="filter.lotName"></sd-textfield>
              </sd-form-item>
            </sd-form>
          </sd-dock>

          <sd-dock class="sd-padding-sm-default">
            <sd-pagination [page]="pagination.page" [length]="pagination.length"
                           (pageChange)="onPageClick($event)"></sd-pagination>
          </sd-dock>

          <sd-busy-container [busy]="mainBusyCount > 0">
            <sd-dock-container>
              <sd-sheet #sheet [id]="'process-production'"
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
                <sd-sheet-column [header]="'정지'" [width]="50">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      <ng-container *ngIf="item.status === '생산중'">
                        <a (click)="OnStopProduction(item)" style="color: red;"> 정지 </a>
                      </ng-container>
                      <ng-container *ngIf="item.status === '생산중지'">
                        <a (click)="OnRestartProduction(item)" style="color: #82d037;"> 재생산 </a>
                      </ng-container>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'상태'" [width]="80">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      <ng-container *ngIf="!!item.id">
                        {{ (item.status === '생산완료' || item.status === '생산중지') ? item.status : "" }}
                      </ng-container>
                      <ng-container *ngIf="!item.isCanceled && item.status === '생산대기'">
                        <a (click)="productionReadyButtonClick(item)" style="color: green"> 생산대기</a>
                      </ng-container>
                      <ng-container *ngIf="!item.isCanceled && item.status === '생산준비'">
                        <a (click)="productionStartButtonClick(item)" style="color: darkorange"> 생산준비 </a>
                      </ng-container>
                      <ng-container *ngIf="!item.isCanceled && item.status === '생산중'">
                        <a (click)="productionCompletionButtonClick(item)"> 생산중 </a>
                      </ng-container>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <!--  <sd-sheet-column [header]="'생산지시 ID'" [width]="90">
                    <ng-template #item let-item="item">
                      <div class="sd-padding-xs-sm" style="text-align: center;">
                        {{ item.productionOrderId }}
                        <a (click)="productionInstructionSearchModalOpenButtonClick(item)"
                           [attr.sd-invalid]="!item.productionOrderId">
                          <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                        </a>
                      </div>
                    </ng-template>
                  </sd-sheet-column>-->
                <sd-sheet-column [header]="'Order No'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.productionOrderCode }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'설비'" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.equipmentName }}
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
                <sd-sheet-column [header]="'단위'" [width]="60">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center">
                      {{ item.unitName }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'생산예정수량(Roll)'" [width]="130">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right;">
                      {{ item.orderQuantity | number }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'누적 길이'" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right;">
                      {{ item.totalLength | number }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'누적 중량'" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right;">
                      {{ item.totalWeight | number }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'QC 검사'" [width]="80">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      <a (click)="onQcInspectionButtonClick(item.inspectionId)">
                        {{ item.inspectionId ? "#" + item.inspectionId : "" }}
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'등록 사원'" [width]="80">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.createdByEmployeeName }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'등록일'" [width]="80">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.createdAtDateTime?.toFormatString('yyyy-MM-dd') }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'바코드출력'" [width]="80">
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
                      <sd-checkbox [(value)]="item.isCanceled"
                                   [disabled]="!item.id || (!!item.id && item.status !== '생산대기') || (!!item.id && item.productionOrderIsCanceled) ||
                                   (!!item.id && item.scrapList && item.scrapList.length > 0)"></sd-checkbox>
                    </div>
                  </ng-template>
                </sd-sheet-column>
              </sd-sheet>

              <sd-dock [position]="'bottom'" style="height: 40%" *ngIf="selectedItem"
                       [id]="'process-production-item'">
                <sd-busy-container [busy]="selectedItemBusyCount > 0">
                  <sd-dock-container class="sd-background-default">
                    <sd-dock class="sd-padding-xs-sm">
                      <h5 style="display: inline-block; padding-right: 1.4em;">제품 생산</h5>
                      <sd-button [size]="'sm'" (click)="onSelectedItemChanged(selectedItem)" [inline]="true"
                                 [disabled]="!selectedItem.id">
                        <sd-icon [icon]="'sync-alt'" [fixedWidth]="true"></sd-icon>
                        새로고침
                      </sd-button>
                      &nbsp;
                      <sd-button [size]="'sm'" (click)="onAddProductionItemButtonClick()" [inline]="true"
                                 *ngIf="selectedItem.status !== '생산완료'"
                                 [disabled]="(!!selectedItem.id && (selectedItem.status !== '생산준비' && selectedItem.status !== '생산중' &&  selectedItem.status !== '생산중지')) || !selectedItem.id">
                        <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
                        행 추가
                      </sd-button>
                      <!-- <sd-button [size]="'sm'" (click)="onAddProductionAddItemButtonClick()" [inline]="true"
                                  *ngIf="!!selectedItem.id && selectedItem.status === '생산완료'">
                         <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
                         추가 생산
                       </sd-button>-->
                      &nbsp;
                      <sd-button [size]="'sm'" (click)="onMinusProductionItemButtonClick()" [inline]="true"
                                 *ngIf="selectedItem.status !== '생산완료'"
                                 [disabled]="(!selectedItem.productionList || selectedItem.productionList.length < 1) || (!!selectedItem.id && selectedItem.status === '생산완료') || (!selectedItem.id)">
                        <sd-icon [icon]="'minus'" [fixedWidth]="true" style="padding-left: 5px;"></sd-icon>
                        행 삭제
                      </sd-button>
                      <!-- <sd-button [size]="'sm'" (click)="onMinusProductionAddItemButtonClick()" [inline]="true"
                                  *ngIf="(!selectedItem.productionList || selectedItem.productionList.length > selectedItem.orderQuantity) || (!!selectedItem.id && selectedItem.status === '생산완료') || (!selectedItem.id)">
                         <sd-icon [icon]="'minus'" [fixedWidth]="true" style="padding-left: 5px;"></sd-icon>
                         추가생산 삭제
                       </sd-button>-->
                      &nbsp;
                      <!--<sd-button [size]="'sm'" (click)="onAddProductionTestItemButtonClick()" [inline]="true"
                                 *ngIf="!!selectedItem.id && selectedItem.status === '생산대기'">
                        <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
                        테스트 생산
                      </sd-button>-->
                      <sd-button [size]="'sm'" (click)="onPackingItems()" [inline]="true">
                        <sd-icon [icon]="'archive'" [fixedWidth]="true"></sd-icon>
                        LOT 포장
                      </sd-button>
                      &nbsp;
                      <!-- <sd-button [size]="'sm'" (click)="onStockExcept()" [inline]="true">
                         <sd-icon [icon]="'archive'" [fixedWidth]="true"></sd-icon>
                         재고제외
                       </sd-button>-->
                      <div style="display: inline; float: right; padding-right: 15px;">
                        <sd-button (click)="moveButtonLeft()" [inline]="true">
                          ◀
                        </sd-button>
                        &nbsp;
                        <sd-button (click)="moveButtonRight()" [inline]="true">
                          ▶
                        </sd-button>
                        &nbsp;
                        <sd-button (click)="moveButtonUp()" [inline]="true">
                          ▲
                        </sd-button>
                        &nbsp;
                        <sd-button (click)="moveButtonDown()" [inline]="true">
                          ▼
                        </sd-button>
                      </div>
                      <div style="display: inline; float: right; padding-right: 15%;">
                        <div style="display: inline-block;">
                          <h2>전처리 생산량 : {{ selectedItem.totalTestProductionQuantity | number }}m / {{ selectedItem.totalTestProductionWeight | number }}kg </h2>
                        </div>
                        <div style="display: inline-block;">
                          <h2 style="margin-left: 15px;">불량 생산량
                            : {{ selectedItem.totalBadProductionQuantity | number }}m / {{ selectedItem.totalBadProductionWeight | number }}kg </h2>
                        </div>
                        <div style="display: inline-block;">
                          <h2 style="margin-left: 15px;">양품 생산량
                            : {{ selectedItem.totalGoodProductionQuantity | number }}m / {{ selectedItem.totalWeight | number }}kg </h2>
                        </div>
                      </div>
                    </sd-dock>

                    <sd-pane>
                      <sd-sheet [id]="'process-production-item'" *ngIf="selectedItem"
                                [items]="selectedItem.productionList"
                                [trackBy]="trackByMeFn"
                                [selectable]="'multi'"
                                [selectedItems]="packingItems"
                                (selectedItemsChange)="onSelectedItemsChange($event)"
                                #itemSheet>
                        <sd-sheet-column [header]="'재고제외'" [fixed]="true" [width]="60">
                          <ng-template #item let-item="item">
                            <div style="text-align: center;">
                              <sd-checkbox [(value)]="item.isNotStockItem"
                                           [disabled]="true"></sd-checkbox>
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'생산조'" [width]="70">
                          <ng-template #item let-item="item">
                            <sd-select [(value)]="item.productionGroup">
                              <sd-select-item [value]="'A'">A</sd-select-item>
                              <sd-select-item [value]="'B'">B</sd-select-item>
                            </sd-select>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'포장바코드'">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm">
                              <a (click)="onPackingBarcodePrint(item.packingBarcode)">
                                {{ item.packingBarcode }}
                              </a>
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'LOT'">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="color: red"
                                 *ngIf="item.isTestProductionItem === false && item.isNotStockItem !== false">
                              {{ item.lotName }}
                            </div>
                            <div class="sd-padding-xs-sm" style="color: darkorange"
                                 *ngIf="item.isTestProductionItem !== false && item.isNotStockItem !== false">
                              {{ item.lotName }}
                            </div>
                            <div class="sd-padding-xs-sm" *ngIf="item.isNotStockItem === false">
                              {{ item.lotName }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'중량'" [width]="80">
                          <ng-template #item let-item="item">
                            <sd-textfield [(value)]="item.weight" [disabled]="true" [type]="'number'"></sd-textfield>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'실측중량'" [width]="80">
                          <ng-template #item let-item="item">
                            <sd-textfield [(value)]="item.realWeight" [disabled]="true"
                                          [type]="'number'"></sd-textfield>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'길이'" [width]="80">
                          <ng-template #item let-item="item">
                            <sd-textfield [(value)]="item.length" [type]="'number'" [disabled]="true"></sd-textfield>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'폭'" [width]="80">
                          <ng-template #item let-item="item">
                            <sd-textfield [(value)]="item.specification" [type]="'number'"></sd-textfield>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'두께'" [width]="80">
                          <ng-template #item let-item="item">
                            <sd-textfield [(value)]="item.thickness" [type]="'number'"></sd-textfield>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'내면'" [width]="70">
                          <ng-template #item let-item="item">
                            <sd-textfield [(value)]="item.inside" [type]="'number'"></sd-textfield>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'외면'" [width]="70">
                          <ng-template #item let-item="item">
                            <sd-textfield [(value)]="item.outSide" [type]="'number'"></sd-textfield>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'최하'" [width]="70">
                          <ng-template #item let-item="item">
                            <sd-textfield [(value)]="item.theMinimum" [type]="'number'"></sd-textfield>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'최대'" [width]="70">
                          <ng-template #item let-item="item">
                            <sd-textfield [(value)]="item.theBest" [type]="'number'"></sd-textfield>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'평균'" [width]="70">
                          <ng-template #item let-item="item">
                            <sd-textfield [(value)]="item.average" [type]="'number'"></sd-textfield>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'MD'" [width]="70">
                          <ng-template #item let-item="item">
                            <sd-textfield [(value)]="item.md" [type]="'number'"></sd-textfield>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'TD'" [width]="70">
                          <ng-template #item let-item="item">
                            <sd-textfield [(value)]="item.td" [type]="'number'"></sd-textfield>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'등급'" [width]="70">
                          <ng-template #item let-item="item">
                            <sd-select [(value)]="item.rating" [required]="true" (valueChange)="onRatingChange(item)">
                              <sd-select-item [value]="'A'">A</sd-select-item>
                              <sd-select-item [value]="'B'">B</sd-select-item>
                              <sd-select-item [value]="'C'">C</sd-select-item>
                              <sd-select-item [value]="'공통'">공통</sd-select-item>
                            </sd-select>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'정품,불량'" [width]="80">
                          <ng-template #item let-item="item">
                            <sd-select [(value)]="item.defectType" (valueChange)="onRatingChange(item)"
                                       [disabled]="item.rating === 'A'">
                              <sd-select-item [value]="defect"
                                              *ngFor="let defect of defectTypeList; trackBy: trackByMeFn">
                                {{ defect }}
                              </sd-select-item>
                            </sd-select>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column header="토출량.외층" [width]="60">
                          <ng-template #item let-item="item">
                            <sd-textfield [(value)]="item.outerLayer" [type]="'number'"></sd-textfield>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column header="토출량.중층" [width]="60">
                          <ng-template #item let-item="item">
                            <sd-textfield [(value)]="item.middleLayer" [type]="'number'"></sd-textfield>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column header="토출량.내층" [width]="60">
                          <ng-template #item let-item="item">
                            <sd-textfield [(value)]="item.insiderLayer" [type]="'number'"></sd-textfield>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column header="압출기 RPM.내층" [width]="60">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              <a (click)="showEquipmentInsideRpmInfo(item)" *ngIf="!!item.id">
                                {{ item.insideRpm?.toFixed(1) | number }}
                              </a>
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column header="압출기 RPM.중층" [width]="60">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              <a (click)="showEquipmentMiddleRpmInfo(item)" *ngIf="!!item.id">
                                {{ item.middleRpm?.toFixed(1) | number }}
                              </a>
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column header="압출기 RPM.외층" [width]="60">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              <a (click)="showEquipmentOutSideRpmInfo(item)" *ngIf="!!item.id">
                                {{ item.outSideRpm?.toFixed(1) | number }}
                              </a>
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'라인스피드(m/s)'" [width]="100">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              <a (click)="showEquipmentLineSpeedInfo(item)" *ngIf="!!item.id">
                                {{ item.lineSpeed?.toFixed(1) | number }}
                              </a>
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'텐션 값'" [width]="90">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              <a (click)="showEquipmentTensionInfo(item)" *ngIf="!!item.id">
                                {{ item.tension | number }}
                              </a>
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column header="수지온도(℃).외층" [width]="60">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              <a (click)="showEquipmentOutsideTemperatureInfo(item)" *ngIf="!!item.id">
                                {{ item.outsideTemperature?.toFixed(1) | number }}
                              </a>
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column header="수지온도(℃).중층" [width]="60">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              <a (click)="showEquipmentMiddleTemperatureInfo(item)" *ngIf="!!item.id">
                                {{ item.middleTemperature?.toFixed(1) | number }}
                              </a>
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column header="수지온도(℃).내층" [width]="60">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              <a (click)="showEquipmentInsideTemperatureInfo(item)" *ngIf="!!item.id">
                                {{ item.insideTemperature?.toFixed(1) | number }}
                              </a>
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column header="수지압력(Pa).외층" [width]="60">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              <a (click)="showEquipmentOutSidePressureInfo(item)" *ngIf="!!item.id">
                                {{ item.outSidePressure?.toFixed(1) | number }}
                              </a>
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column header="수지압력(Pa).중층" [width]="60">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              <a (click)="showEquipmentMiddlePressureInfo(item)" *ngIf="!!item.id">
                                {{ item.middlePressure?.toFixed(1) | number }}
                              </a>
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column header="수지압력(Pa).내층" [width]="60">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              <a (click)="showEquipmentInsidePressureInfo(item)" *ngIf="!!item.id">
                                {{ item.insidePressure?.toFixed(1) | number }}
                              </a>
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'처리기 A'" [width]="80">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              {{ item.processorA?.toFixed(1) | number }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'처리기 B'" [width]="100">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              {{ item.processorB?.toFixed(1) | number }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column header="압출기 온도.C-1" [width]="80">
                          <ng-template #item let-item="item">
                            <sd-textfield [(value)]="item.remarkC1"></sd-textfield>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column header="압출기 온도.C-2" [width]="80">
                          <ng-template #item let-item="item">
                            <sd-textfield [(value)]="item.remarkC2"></sd-textfield>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'작업자'" [width]="80">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center">
                              {{ item.createdByEmployeeName }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'시작시간'" [width]="150">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm">
                              {{ item.createdAtDateTime?.toFormatString("yyyy-MM-dd HH:mm:ss") }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'종료시간'" [width]="150">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm">
                              {{ item.lastProductionItemDateTime?.toFormatString("yyyy-MM-dd HH:mm:ss") }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                      </sd-sheet>
                    </sd-pane>
                  </sd-dock-container>
                </sd-busy-container>
              </sd-dock>

              <sd-dock [position]="'right'" style="width: 550px" *ngIf="selectedItem"
                       [id]="'process-production-scrap'">
                <sd-dock-container class="sd-background-default">
                  <sd-dock class="sd-padding-xs-sm">
                    <h5 style="display: inline-block; padding-right: 1.4em;">스크랩 정보</h5>
                    <sd-button [size]="'sm'" (click)="onAddScrapItemButtonClick()" [inline]="true">
                      <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
                      행 추가
                    </sd-button>
                  </sd-dock>

                  <sd-pane>
                    <sd-sheet [id]="'process-production-scrap'"
                              [items]="selectedItem.scrapList"
                              [trackBy]="trackByMeFn" *ngIf="selectedItem">
                      <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm" style="text-align: center;">
                            <span *ngIf="item.id">{{ item.id }}</span>
                            <a *ngIf="!item.id" (click)="onScrapItemRemoveButtonClick(item)">
                              <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                            </a>
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'발생일자'" [width]="120">
                        <ng-template #item let-item="item">
                          <sd-textfield [(value)]="item.occurrenceDate" [type]="'date'"
                                        [required]="true"></sd-textfield>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'발생Roll No'" [width]="90">
                        <ng-template #item let-item="item">
                          <sd-textfield [(value)]="item.rollNumber"></sd-textfield>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'종류'" [width]="90">
                        <ng-template #item let-item="item">
                          <sd-select [(value)]="item.kind">
                            <sd-select-item [value]="'생산'">생산</sd-select-item>
                            <sd-select-item [value]="'밀어내기'">밀어내기</sd-select-item>
                          </sd-select>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'발생스크랩'">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm">
                            {{ item.scrapGoodName }}
                            <a (click)="scrapItemSearchModalOpenButtonClick(item)"
                               [attr.sd-invalid]="!item.scrapGoodId">
                              <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                            </a>
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'발생 중량'" [width]="80">
                        <ng-template #item let-item="item">
                          <sd-textfield [(value)]="item.weight" [type]="'number'" [required]="true"></sd-textfield>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'유형'">
                        <ng-template #item let-item="item">
                          <sd-select [(value)]="item.typeId" [required]="true">
                            <sd-select-item *ngFor="let type of scrapTypeList; trackBy: trackByMeFn"
                                            [value]="type.id">
                              {{ type.name }}
                            </sd-select-item>
                          </sd-select>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'등급'" [width]="90">
                        <ng-template #item let-item="item">
                          <sd-select [(value)]="item.rating"
                                     [disabled]="!!item.id && item.prevRating !== '보류'">
                            <sd-select-item [value]="undefined">미지정</sd-select-item>
                            <sd-select-item [value]="'재생 가능'">재생 가능</sd-select-item>
                            <sd-select-item [value]="'재생 불가'">재생 불가</sd-select-item>
                            <sd-select-item [value]="'보류'">보류</sd-select-item>
                          </sd-select>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'비고'">
                        <ng-template #item let-item="item">
                          <sd-textfield [(value)]="item.remark"></sd-textfield>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'작업자'" [width]="80">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm" style="text-align: center;">
                            {{ item.createdByEmployeeName }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'작업시간'" [width]="150">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm">
                            {{ item.createdAtDateTime?.toFormatString("yyyy-MM-dd HH:mm:ss") }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'취소'" [width]="70">
                        <ng-template #item let-item="item">
                          <div style="text-align: center;">
                            <sd-checkbox [(value)]="item.isDisabled" [disabled]="!item.id"></sd-checkbox>
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
export class ProcessProductionPage implements OnInit {
  @ViewChild("itemSheet", {read: ElementRef})
  public itemSheetElRef?: ElementRef<HTMLElement>;

  public filter: IFilterVM = {
    id: undefined,
    productionOrderCode: undefined,
    fromDate: new DateOnly().setDay(1),
    toDate: new DateOnly().setDay(new Date(new DateOnly().year, new DateOnly().month, 0).getDate()),
    lotName: undefined,
    equipmentId: undefined,
    goodName: undefined,
    specification: undefined,
    isCanceled: false
  };

  public lastFilter?: IFilterVM;

  public pagination = {page: 0, length: 0};

  public items: IProcessProductionVM[] = [];
  public orgItems: IProcessProductionVM[] = [];
  public packingItems: IProductionItemVM[] = [];

  public selectedItem?: IProcessProductionVM;

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public selectedItemBusyCount = 0;

  public equipmentList: {
    id: number;
    name: string;
    isDisabled: boolean;
  }[] = [];

  public scrapTypeList: {
    id: number;
    name: string;
  }[] = [];

  public defectTypeList: string[] = [];

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public constructor(private readonly _modal: SdModalProvider,
                     private readonly _orm: SdOrmProvider,
                     private readonly _elRef: ElementRef<HTMLElement>,
                     private readonly _print: SdPrintProvider,
                     private readonly _activatedRoute: ActivatedRoute,
                     private readonly _domValidator: SdDomValidatorProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _appData: AppDataProvider,
                     private readonly _cdr: ChangeDetectorRef) {
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

    await this._orm.connectAsync(MainDbContext, async db => {

      this.equipmentList = await db.equipment
        .where(item => [
          sorm.equal(item.companyId, this._appData.authInfo!.companyId),
          sorm.query("not name like '%리와인더%'", Boolean)!,
          sorm.equal(item.isDisabled, false)
        ])
        .select(item => ({
          id: item.id!,
          name: item.name,
          isDisabled: item.isDisabled
        }))
        .resultAsync();

      this.scrapTypeList = await db.baseType
        .where(item => [
          sorm.equal(item.companyId, this._appData.authInfo!.companyId),
          sorm.equal(item.isDisabled, false),
          sorm.equal(item.type, "스크랩유형")
        ])
        .select(item => ({
          id: item.id!,
          name: item.name,
          isDisabled: item.isDisabled
        }))
        .resultAsync();
    });

    this._activatedRoute.params.subscribe(async params => {
      if (params && params.id) {
        this.lastFilter = Object.clone(this.filter);

        if (params.id) {
          const productionId = await this._searchProductionOfInstruction(JsonConvert.parse(params.id));

          if (productionId) {
            this.filter.id = productionId;
            this.lastFilter.id = productionId;

            location.href = location.href.slice(0, location.href.indexOf(";"));
            await this.onSearchFormSubmit();
          }
          else {
            await this.onAddItemButtonClick(JsonConvert.parse(params.id));
          }
        }
      }
      else {
        await this.onSearchFormSubmit();
      }
    });
    this._cdr.markForCheck();
  }

  private async _searchProductionOfInstruction(id: number): Promise<number | undefined> {
    let productionId: number | undefined;

    await this._orm.connectAsync(MainDbContext, async db => {
      const result = await db.production
        .where(item => [
          sorm.equal(item.instructionId, id)
        ])
        .select(item => ({
          id: item.id
        }))
        .singleAsync();

      productionId = result ? result.id : undefined;
    });

    return productionId;
  }

  public async onAddItemButtonClick(id?: number): Promise<void> {
    const result = await this._modal.show(ProductionInstructionSearchModal, "생산지시 검색", {
      isMulti: false,
      isProductionSearch: true,
      id
    });
    if (!result) return;

    if (result && this.items.filter(item => item.productionOrderId === result.id).length < 1) {
      this.items.insert(0, {
        id: undefined,
        productionOrderId: result.id,
        productionOrderCode: result.orderCode,
        productionOrderIsCanceled: false,
        productionOrderDueDate: result.orderDate,
        capa: result.capa,
        rollWeight: result.rollWeight,
        rollLength: result.rollLength,
        goodId: result.goodId,
        goodName: result.goodName,
        goodThickness: result.thickness,
        specification: result.specification,
        totalLength: undefined,
        totalWeight: undefined,
        unitName: result.unitName,
        equipmentId: result.equipmentId,
        equipmentName: result.equipmentName,
        equipmentCode: result.equipmentCode,
        equipmentProductCode: result.equipmentCode,
        orderQuantity: result.productQuantity,
        status: undefined,
        inspectionId: undefined,
        createdByEmployeeId: undefined,
        createdByEmployeeName: undefined,
        createdAtDateTime: undefined,
        productionReadyModifiedAtDateTime: undefined,
        isStop: false,
        isCanceled: false,
        isCompletion: false,
        totalTestProductionQuantity: undefined,
        totalTestProductionWeight: undefined,
        totalGoodProductionQuantity: undefined,
        totalBadProductionWeight: undefined,
        totalBadProductionQuantity: undefined,

        scrapList: undefined,
        productionList: undefined
      });
    }
    this._cdr.markForCheck();
  }

  public onRemoveItemButtonClick(item: IProcessProductionVM): void {
    this.items.remove(item);

    if (this.selectedItem === item) {
      this.selectedItem = undefined;
    }
  }

  public async onAddProductionItemButtonClick(): Promise<void> {
    this.selectedItem!.productionList = this.selectedItem!.productionList || [];
    let lastSeq: number;
    let isAddLot: boolean;
    let lotName: string;

    if (this.selectedItem!.status === "생산준비" || this.selectedItem!.status === "생산중지") {
      //TEST BARCODE 발행
      lastSeq = this.selectedItem!.productionList!.filter(item => item.isNotStockItem === true).length > 0
        ? this.selectedItem!.productionList!.filter(item => item.isNotStockItem === true).length : 0;
      isAddLot = true;
      lotName = await this._getLotInfo(this.selectedItem!.id!, lastSeq + 1, true);
    }
    else {
      if (this.selectedItem!.productionList!.filter(item => item.isNotStockItem === false).length >= this.selectedItem!.orderQuantity!) {
        lastSeq = this.selectedItem!.productionList!.filter(item => item.isNotStockItem === false).length > 0 ?
          Number.parseInt(this.selectedItem!.productionList!.filter(item => item.isNotStockItem === false).max(item => item.lotName)!.substr(8, 3), 10) : 0;
        isAddLot = true;
      }
      else {
        lastSeq = this.selectedItem!.productionList!.filter(item => item.isNotStockItem === false).length > 0
          ? this.selectedItem!.productionList!.filter(item => item.isNotStockItem === false).length : 0;
        isAddLot = false;
      }
      lotName = await this._getLotInfo(this.selectedItem!.id!, lastSeq + 1, false);
    }

    this.selectedItem!.productionList!.insert(0, {
      id: undefined,
      seq: undefined,
      productionGroup: "A",
      packingId: undefined,
      packingBarcode: undefined,
      lotId: undefined,
      lotName,
      weight: this.selectedItem!.rollWeight,
      realWeight: undefined,
      length: this.selectedItem!.rollLength,
      thickness: this.selectedItem!.goodThickness,
      specification: this.selectedItem!.specification,
      outSide: undefined,
      inside: undefined,
      theMinimum: undefined,
      theBest: undefined,
      average: undefined,
      md: undefined,
      td: undefined,
      defectType: undefined,
      insidePressure: undefined,
      middlePressure: undefined,
      outSidePressure: undefined,
      insideTemperature: undefined,
      middleTemperature: undefined,
      outsideTemperature: undefined,
      insiderLayer: undefined,
      middleLayer: undefined,
      outerLayer: undefined,
      lineSpeed: undefined,
      pressure: undefined,
      insideRpm: undefined,
      middleRpm: undefined,
      outSideRpm: undefined,
      tension: undefined,
      processorA: undefined,
      processorB: undefined,
      min: undefined,
      remarkC1: undefined,
      remarkC2: undefined,
      rating: "공통",
      lastProductionItemDateTime: undefined,
      createdAtDateTime: undefined,
      createdByEmployeeId: undefined,
      createdByEmployeeName: undefined,
      isTestProductionItem: this.selectedItem!.status === "생산준비",
      isPrevNotStockItem: this.selectedItem!.status === "생산준비" || this.selectedItem!.status === "생산중지",
      isNotStockItem: this.selectedItem!.status === "생산준비" || this.selectedItem!.status === "생산중지",
      isAddProductionItem: isAddLot
    });


    this._cdr.markForCheck();
  }

  public async onAddProductionTestItemButtonClick(): Promise<void> {
    alert("해당 기능은 개발 중 입니다.");
    return;
  }

  public onMinusProductionItemButtonClick(): void {
    if (!this.selectedItem!.productionList![0].id) {
      this.selectedItem!.productionList!.shift();
    }
  }

  public onMinusProductionAddItemButtonClick(): void {
    if (this.selectedItem!.productionList && this.selectedItem!.productionList![0].isAddProductionItem) {
      this.selectedItem!.productionList!.shift();
    }
  }

  private async _getLotInfo(productId: number, lastSeq: number, isTesting: boolean): Promise<string> {
    return await this._orm.connectAsync(MainDbContext, async db => {
      const code = this.selectedItem!.equipmentCode!.length < 2 ? this.selectedItem!.equipmentCode!.padEnd(2, "0") : this.selectedItem!.equipmentCode;
      const lotInfo = await db.lotHistory
        .orderBy(item => item.id)
        .limit(0, 1)
        .where(item => [
          sorm.equal(item.companyId, this._appData.authInfo!.companyId),
          sorm.equal(item.productionId, productId)
        ])
        .select(item => ({
          id: item.id!,
          lot: item.lot
        }))
        .singleAsync();

      const date = lotInfo ? lotInfo.lot.substr(2, 6) : new DateOnly().toFormatString("yyMMdd");
      const goodNameStr = this.selectedItem!.goodName!.length < 6 ?
        this.selectedItem!.goodName!.padStart(6, "0") : this.selectedItem!.goodName!.length > 11
          ? this.selectedItem!.goodName!.slice(0, 11) : this.selectedItem!.goodName!;

      return (isTesting ? "TT" : code) + date + lastSeq.toString().padStart(3, "0") + goodNameStr;
    });
  }

  public async onAddScrapItemButtonClick(): Promise<void> {
    this.selectedItem!.scrapList = this.selectedItem!.scrapList || [];

    const lastSeq = this.selectedItem!.scrapList!.length > 0 ?
      Number.parseInt(this.selectedItem!.scrapList!.max(item => item.rollNumber)!.slice(-3), 10) : 0;

    this.selectedItem!.scrapList!.insert(0, {
      id: undefined,
      kind: "생산",
      occurrenceDate: new DateOnly(),
      scrapGoodId: undefined,
      scrapGoodName: undefined,
      lotId: undefined,
      rollNumber: "SC" + (lastSeq + 1).toString().padStart(3, "0"),
      prevWeight: undefined,
      weight: undefined,
      typeId: undefined,
      typeName: undefined,
      rating: "재생 가능",
      prevRating: "재생 가능",
      dueDate: undefined,
      remark: undefined,
      isDisabled: false,
      createdAtDateTime: undefined,
      createdByEmployeeId: undefined,
      createdByEmployeeName: undefined
    });

    this._cdr.markForCheck();
  }

  public onScrapItemRemoveButtonClick(item: IScrapListVM): void {
    this.selectedItem!.scrapList!.remove(item);
  }

  public onQcInspectionButtonClick(id: number): void {
    window.open(location.pathname + "#" + `/home/inspection/qc-inspection;id=${JSON.stringify(id)}`, "_blank", "left= 500, top= 200 width= 1000, height= 700");
  }

  public async scrapItemSearchModalOpenButtonClick(item: IScrapListVM): Promise<void> {
    const result = await this._modal.show(GoodsSearchModal, "스크랩 검색", {isMulti: false, type: "스크랩"});
    if (!result) return;

    item.scrapGoodId = result.id;
    item.scrapGoodName = result.name;

    this._cdr.markForCheck();
  }

  public async productionInstructionSearchModalOpenButtonClick(item: IProcessProductionVM): Promise<void> {
    const result = await this._modal.show(ProductionInstructionSearchModal, "생산지시 검색", {
      isMulti: false,
      isProductionSearch: true
    });
    if (!result) return;

    if (this.items.filter(item1 => item1.productionOrderId === result.id).length < 1) {
      item.productionOrderId = result.id;
      item.productionOrderCode = result.orderCode;
      item.productionOrderIsCanceled = false;
      item.productionOrderDueDate = result.orderDate;
      item.capa = result.capa;
      item.rollWeight = result.rollWeight;
      item.rollLength = result.rollLength;
      item.goodName = result.goodName;
      item.goodId = result.goodId;
      item.goodThickness = result.thickness;
      item.specification = result.specification;
      item.unitName = result.unitName;
      item.totalLength = undefined;
      item.totalWeight = undefined;
      item.equipmentId = result.equipmentId;
      item.equipmentName = result.equipmentName;
      item.equipmentCode = result.equipmentCode;
      item.equipmentProductCode = result.equipmentProductCode;
      item.orderQuantity = result.productQuantity;
      item.status = undefined;
      item.inspectionId = undefined;
      item.createdByEmployeeId = undefined;
      item.createdByEmployeeName = undefined;
      item.createdAtDateTime = undefined;
      item.productionReadyModifiedAtDateTime = undefined;
      item.isCanceled = false;
      item.isCompletion = false;

      item.scrapList = undefined;
      item.productionList = undefined;

      this.selectedItem = undefined;
    }

    this._cdr.markForCheck();
  }

  public async onShowManualButtonClick(): Promise<void> {
    const result = await this._modal.show(ShowManualModal, "생산실적 메뉴얼", {type: "process-production"});
    if (!result) return;

    this._cdr.markForCheck();
  }

  public async onRatingChange(item: any): Promise<void> {
    if (item.rating === "A") {
      item.defectType = undefined;
    }
  }

  public moveButtonRight(): void {
    this.itemSheetElRef!.nativeElement.scrollLeft += 100;
  }

  public moveButtonLeft(): void {
    this.itemSheetElRef!.nativeElement.scrollLeft -= 100;
  }

  public moveButtonUp(): void {
    this.itemSheetElRef!.nativeElement.scrollTop -= 25;
  }

  public moveButtonDown(): void {
    this.itemSheetElRef!.nativeElement.scrollTop += 25;
  }

  public async OnStopProduction(item: IProcessProductionVM): Promise<void> {
    if (confirm("해당 생산을 중지처리 하시겠습니까?\n(중지 처리 후 취소 할 수 없습니다.)")) {
      await this._orm.connectAsync(MainDbContext, async db => {
        await db.production
          .where(item1 => [
            sorm.equal(item1.id, item.id)]
          )
          .updateAsync(() => ({
            status: "생산중지"
          }));

        await this._setProductionItemInfo(item, db);
      });

      item.status = "생산중지";
      this._cdr.markForCheck();
    }
    else return;
  }

  public async OnRestartProduction(item: IProcessProductionVM): Promise<void> {
    if (confirm("재생산을 시작 하시겠습니까?")) {
      await this._orm.connectAsync(MainDbContext, async db => {
        await db.production
          .where(item1 => [
            sorm.equal(item1.id, item.id)]
          )
          .updateAsync(() => ({
            status: "생산중"
          }));

        await this._setProductionItemInfo(item, db);
      });

      item.status = "생산중";
      this._cdr.markForCheck();
    }
    else return;
  }

  public async productionReadyButtonClick(item: IProcessProductionVM): Promise<void> {
    const getProductionInfo = await this._getProductionInfo(item.equipmentId!);
    if (getProductionInfo && getProductionInfo.length > 0) {
      this._toast.danger("이미 생산중인 항목(생산ID : " + getProductionInfo[0].id + ")이 존재합니다.\n해당 생산을 완료처리 후 다음 생산을 진행할 수 있습니다.");
      return;
    }

    if (confirm("해당 생산을 준비처리 하시겠습니까?\n(준비처리 후 취소 할 수 없습니다.)")) {
      await this._orm.connectAsync(MainDbContext, async db => {
        await db.production
          .where(item1 => [
            sorm.equal(item1.id, item.id)]
          )
          .updateAsync(() => ({
            status: "생산준비",
            productionReadyModifiedAtDateTime: new DateTime()
          }));
      });

      item.status = "생산준비";
      this._cdr.markForCheck();
    }
    else return;
  }

  public async productionStartButtonClick(item: IProcessProductionVM): Promise<void> {
    if (confirm("테스트 생산을 종료하고 실제 생산을 시작 하시겠습니까?\n(생산 시작 후 취소 할 수 없습니다.)")) {
      await this._orm.connectAsync(MainDbContext, async db => {
        await db.production
          .where(item1 => [
            sorm.equal(item1.id, item.id)]
          )
          .updateAsync(() => ({
            status: "생산중",
            firstModifiedAtDateTime: new DateTime()
          }));

        await this._setProductionItemInfo(item, db);
      });

      item.status = "생산중";
      this._cdr.markForCheck();
    }
    else return;
  }

  private async _getProductionInfo(equipmentId: number): Promise<any[] | undefined> {
    return await this._orm.connectAsync(MainDbContext, async db => {
      return await db.production
        .where(item => [
            sorm.equal(item.equipmentId, equipmentId),
            sorm.or([
              sorm.equal(item.status, "생산준비"),
              sorm.equal(item.status, "생산중"),
              sorm.equal(item.status, "생산중지")
            ])
          ]
        )
        .select(item => ({
          id: item.id
        }))
        .resultAsync();
    });
  }

  public async productionCompletionButtonClick(item: IProcessProductionVM): Promise<void> {
    if (confirm("해당 생산을 완료처리 하시겠습니까?\n(완료처리 후 취소 할 수 없습니다.)")) {
      await this._orm.connectAsync(MainDbContext, async db => {
        await db.production
          .where(item1 => [
            sorm.equal(item1.id, item.id)]
          )
          .updateAsync(() => ({
            status: "생산완료",
            lastHandModifiedAtDateTime: new DateTime(),
            lastModifiedAtDateTime: new DateTime(),
            isCompletion: true
          }));

        await this._setProductionItemInfo(item, db);
      });

      item.status = "생산완료";
      this._cdr.markForCheck();
    }
    else return;
  }

  private async _setProductionItemInfo(item: IProcessProductionVM, db: MainDbContext): Promise<void> {
    const result = (await db.executeAsync([
      `SELECT bothSideLineSpeed = ROUND(G001LINESPEED1, 2),
           bothSideTension1 = L001TENSION,
           bothSideTension2 = L002TENSION,
           bothSideInsideRpm = ROUND(G001PRESSUREOUT3, 2),
           bothSideMiddleRpm = ROUND(G001PRESSUREOUT2, 2),
           bothSideOutSideRpm = ROUND(G001PRESSUREOUT1, 2),
           bothSideOutsideTemperature = ROUND(G001TEMP1, 2),
           bothSideMiddleTemperature = ROUND(G001TEMP2, 2),
           bothSideInsideTemperature = ROUND(G001TEMP3, 2),
           bothSideInsidePressure = ROUND(G001PRESSURE3, 2),
           bothSideMiddlePressure = ROUND(G001PRESSURE2, 2),
           bothSideOutSidePressure = ROUND(G001PRESSURE1, 2)
           FROM [SSGT_MES].[dbo].EQ_CURRENT
           WHERE EQ_CODE = '${item.equipmentProductCode}'
  `])).single();

    const productionItemList = await db.productionItem
      .where(item1 => [
        sorm.equal(item1.productionId, item.id),
        sorm.notNull(item1.firstProductionDateTime),
        sorm.null(item1.lastProductionDateTime)
      ])
      .select(item1 => ({
        id: item1.id,
        lotSeq: item1.lotSeq
      }))
      .resultAsync();

    for (const productionItem of productionItemList || []) {
      await db.productionItem
        .where(item1 => [
          sorm.equal(item1.id, productionItem.id)
        ])
        .updateAsync(() => ({
          insideRpm: result![0].bothSideInsideRpm,
          middleRpm: result![0].bothSideMiddleRpm,
          outSideRpm: result![0].bothSideOutSideRpm,
          lineSpeed: result![0].bothSideLineSpeed,
          tension: productionItem.lotSeq! % 2 === 0 ? result![0].bothSideTension2 : result![0].bothSideTension1,
          outsideTemperature: result![0].bothSideOutsideTemperature,
          middleTemperature: result![0].bothSideMiddleTemperature,
          insideTemperature: result![0].bothSideInsideTemperature,
          outSidePressure: result![0].bothSideOutSidePressure,
          middlePressure: result![0].bothSideMiddlePressure,
          insidePressure: result![0].bothSideInsidePressure,
          modifyDateTime: new DateTime(),
          lastHandModifiedAtDateTime: new DateTime(),
          lastProductionDateTime: new DateTime()
        }));
    }
  }

  public async onBarcodePrintButtonClick(item: IProcessProductionVM): Promise<void> {
    let printBarcodeList: any[] = [];
    await this._orm.connectAsync(MainDbContext, async db => {
      printBarcodeList = await db.lotHistory
        .include(item1 => item1.goods)
        .where(item1 => [
          sorm.equal(item1.productionId, item.id),
          sorm.equal(item1.isNotStock, false)
        ])
        .select(item1 => ({
          goodName: item.goodName,
          specification: sorm.ifNull(item1.width, item.specification),
          thick: sorm.ifNull(item1.thick, item1.goods!.thick),
          length: sorm.ifNull(item1.length, item.rollLength),
          lot: item1.lot
        }))
        .resultAsync();
    });

    await this._print.print(SmallBarcodePrintTemplate, {printList: printBarcodeList, printSeq: 2});
    this._cdr.markForCheck();
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
          .where(item => [
            sorm.equal(item.isCanceled, false)
          ])
          .wrap(Production)
          .include(item => item.instruction)
          .include(item => item.goods)
          .include(item => item.productionItem)
          .include(item => item.productionItem![0].lot)
          .include(item => item.productionItem![0].weightMeasurement)
          .include(item => item.productionItem![0].inspection)
          .select(item => ({
            id: item.id,
            productionOrderId: item.instructionId,
            productionOrderCode: item.instruction!.productionInstructionCode,
            rollWeight: item.instruction!.rollWeight,
            rollLength: item.instruction!.rollLength,
            goodId: item.goodId,
            goodName: item.goods!.name,
            goodType: item.goods!.type,
            unitName: item.goods!.unitName,
            goodThickness: item.goods!.thick,
            length: item.goods!.length,
            specification: item.goods!.specification,

            productionItem: item.productionItem && item.productionItem!.map(item1 => ({
              id: item1.id,
              productionGroup: item1.productionGroup,
              lotId: item1.lotId,
              lotName: item1.lot!.lot,
              weight: sorm.ifNull(item1.weightMeasurement!.realWeight, item1.weight),
              length: item1.length,
              thickness: item1.thickness,
              numericalPressure: item1.numericalPressure,
              numericalTemperature: item1.numericalTemperature,
              lineSpeed: item1.lineSpeed,
              pressure: item1.pressure,
              insiderLayer: item1.insiderLayer,
              middleLayer: item1.middleLayer,
              outerLayer: item1.outerLayer,
              insideRpm: item1.insideRpm,
              middleRpm: item1.middleRpm,
              outSideRpm: item1.outSideRpm,
              tension: item1.tension,
              min: item1.min,
              rating: sorm.ifNull(item1.inspection!.rating, item1.rating),
              outSide: item1.min,
              inside: item1.inside,
              theMinimum: item1.theMinimum,
              theBest: item1.theBest,
              average: item1.average,
              md: item1.md,
              td: item1.td,
              processorA: item1.processorA,
              processorB: item1.processorB,
              remarkC1: item1.remarkC1,
              remarkC2: item1.remarkC2,
              defectType: item1.defectType
            }))
          }))
          .resultAsync();
        result.orderBy(item => item.id);

        for (const resultItem of result || []) {
          for (const processInspection of resultItem.productionItem || []) {
            items.push({ //tslint:object-literal-key-quotes: false
              LOT: processInspection.lotName,
              NO: processInspection.id,
              계열: resultItem.goodType,
              제품명: resultItem.goodName,
              두께: resultItem.goodThickness,
              길이: resultItem.length,
              중량: processInspection.weight,
              내면: processInspection.inside,
              외면: processInspection.outSide,
              최하: processInspection.theMinimum,
              최대: processInspection.theBest,
              평균: processInspection.average,
              MD: processInspection.md,
              TD: processInspection.td,
              "정품,불량": processInspection.defectType,
              "A,B,C": processInspection.rating,
              가능: undefined,
              불가: undefined,
              외층: processInspection.insiderLayer,
              중층: processInspection.middleLayer,
              내층: processInspection.outerLayer,
              라인스피드: processInspection.lineSpeed,
              "압출기 RPM(내층)": processInspection.insideRpm,
              "압출기 RPM(중층)": processInspection.middleRpm,
              "압출기 RPM(외층)": processInspection.outSideRpm,
              처리기A: processInspection.processorA,
              처리기B: processInspection.processorB,
              텐션값: processInspection.pressure,
              "압출기 온도(C-1)": processInspection.remarkC1,
              "압출기 온도(C-2)": processInspection.remarkC2,
              수지온도: processInspection.numericalTemperature,
              "수지 압력": processInspection.numericalPressure
            });
          }
        }
      });

      const wb = ExcelWorkbook.create();
      wb.json = {"생산지시 제품 정보": items};
      await wb.downloadAsync("생산지시 제품 정보.xlsx");
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.viewBusyCount--;
  }

  public async onSelectedItemChanged(item: IProcessProductionVM): Promise<void> {
    await this._selectItem(item);
    this._cdr.markForCheck();
  }

  private async _selectItem(selectedItem: IProcessProductionVM | undefined): Promise<void> {
    this.selectedItem = selectedItem;
    if (this.selectedItem) {
      this.selectedItem.productionList = [];
    }

    if (selectedItem && selectedItem.id) {
      this.mainBusyCount++;

      await this._orm.connectAsync(MainDbContext, async db => {
        const productionInfo = await db.productionItem
          .include(item => item.lot)
          .include(item => item.packing)
          .include(item => item.packing!.packing)
          .include(item => item.inspection)
          .include(item => item.weightMeasurement)
          .include(item => item.createdByEmployee)
          .where(item => [
            sorm.and([
              sorm.equal(item.companyId, this._appData.authInfo!.companyId),
              sorm.equal(item.productionId, selectedItem.id)
            ])
          ])
          .select(item => ({
            id: item.id,
            productionGroup: item.productionGroup,
            lotId: item.lotId,
            lotName: item.lot!.lot,
            lotSeq: item.lotSeq,
            packingId: item.packing!.packingId,
            packingBarcode: item.packing!.packing!.paletteBarcode,
            weight: item.weight,
            realWeight: item.weightMeasurement!.realWeight,
            length: item.length,
            thickness: item.thickness,
            numericalPressure: item.numericalPressure,
            numericalTemperature: item.numericalTemperature,
            lineSpeed: item.lineSpeed,
            pressure: item.pressure,
            insiderLayer: item.insiderLayer,
            middleLayer: item.middleLayer,
            outerLayer: item.outerLayer,
            insideRpm: item.insideRpm,
            middleRpm: item.middleRpm,
            outSideRpm: item.outSideRpm,
            tension: item.tension,
            min: item.min,
            rating: sorm.ifNull(item.inspection!.rating, item.rating),
            specification: item.width,
            outSide: item.outSide,
            inside: item.inside,
            theMinimum: item.theMinimum,
            theBest: item.theBest,
            average: item.average,
            processorA: item.processorA,
            processorB: item.processorB,
            md: item.md,
            td: item.td,
            insideTemperature: item.insideTemperature,
            middleTemperature: item.middleTemperature,
            outsideTemperature: item.outsideTemperature,
            insidePressure: item.insidePressure,
            middlePressure: item.middlePressure,
            outSidePressure: item.outSidePressure,
            remarkC1: item.remarkC1,
            remarkC2: item.remarkC2,
            defectType: item.defectType,
            isTestProductionItem: item.lot!.isTesting,
            isPrevStockItem: item.lot!.isNotStock,
            isNotStockItem: item.lot!.isNotStock,
            firstModifyDate: item.firstProductionDateTime,
            lastProductionDateTime: item.lastProductionDateTime,
            lastModifyDate: item.modifyDateTime,
            createdAtDateTime: item.createdAtDateTime,
            createdByEmployeeId: item.createdByEmployeeId,
            createdByEmployeeName: item.createdByEmployee!.name
          }))
          .distinct()
          .orderBy(item => item.isTestProductionItem, true)
          .orderBy(item => item.lotId)
          .resultAsync();

        if (productionInfo) {
          let seq = 1;
          for (const productionItem of productionInfo || []) {
            if (selectedItem.productionList!.filter(item => item.lotId === productionItem.lotId).length < 1) {
              selectedItem.productionList!.push({
                id: productionItem.id,
                seq: seq++,
                productionGroup: productionItem.productionGroup,
                lotId: productionItem.lotId,
                lotName: productionItem.lotName,
                packingId: productionItem.packingId,
                packingBarcode: productionItem.packingBarcode,
                weight: productionItem.weight,
                specification: productionItem.specification,
                realWeight: productionItem.realWeight,
                thickness: productionItem.thickness,
                length: productionItem.length,
                insiderLayer: productionItem.insiderLayer,
                middleLayer: productionItem.middleLayer,
                outerLayer: productionItem.outerLayer,
                insideTemperature: productionItem.insideTemperature,
                middleTemperature: productionItem.middleTemperature,
                outsideTemperature: productionItem.outsideTemperature,
                lineSpeed: productionItem.lineSpeed,
                insideRpm: productionItem.insideRpm,
                middleRpm: productionItem.middleRpm,
                outSideRpm: productionItem.outSideRpm,
                insidePressure: productionItem.insidePressure,
                middlePressure: productionItem.middlePressure,
                outSidePressure: productionItem.outSidePressure,
                tension: productionItem.tension,
                min: productionItem.min,
                pressure: productionItem.pressure,
                rating: productionItem.rating,
                outSide: productionItem.outSide,
                inside: productionItem.inside,
                theMinimum: productionItem.theMinimum,
                theBest: productionItem.theBest,
                average: productionItem.average,
                processorA: productionItem.processorA,
                processorB: productionItem.processorB,
                md: productionItem.md,
                td: productionItem.td,
                remarkC1: productionItem.remarkC1,
                remarkC2: productionItem.remarkC2,
                defectType: productionItem.defectType,
                lastProductionItemDateTime: productionItem.lastProductionDateTime,
                createdAtDateTime: productionItem.createdAtDateTime,
                createdByEmployeeId: productionItem.createdByEmployeeId,
                createdByEmployeeName: productionItem.createdByEmployeeName,
                isTestProductionItem: productionItem.isTestProductionItem,
                isPrevNotStockItem: productionItem.isNotStockItem,
                isNotStockItem: productionItem.isNotStockItem,
                isAddProductionItem: undefined
              });
            }
          }

          if (selectedItem.productionList) {
            selectedItem.productionList = selectedItem.productionList.distinct();

            const tempProductionList = Object.clone(selectedItem.productionList);

            if (this.orgItems.some(item => item.productionOrderId === selectedItem.productionOrderId)) {
              this.orgItems.filter(item => item.productionOrderId === selectedItem.productionOrderId)!.single()!.productionList = tempProductionList;
            }
          }
        }
      });
      this.mainBusyCount--;
    }
  }

  public async onPackingBarcodePrint(paletteBarcode: string): Promise<void> {
    let packingInfo: any;
    const result = await this._getPackingBarcodeInfo(paletteBarcode);

    const goodName = result[0].goodName;
    const specification = result[0].width;
    const thick = result[0].thick;
    const length = result[0].length;
    const palletBarcode = paletteBarcode;
    const location = result[0].warehouseName;

    const lotList = result.map(item1 => ({
      lotId: item1.lotId,
      lotName: item1.lotName,
      weight: item1.weight,
      length: item1.length
    })).orderBy(item1 => item1.lotName);

    packingInfo = {
      goodName,
      specification,
      thick,
      length,
      palletBarcode,
      location,
      lotList
    };

    await this._print.print(PackingBarcodePrintTemplate, {printItems: packingInfo});


    this._cdr.markForCheck();
  }

  private async _getPackingBarcodeInfo(paletteBarcode: string): Promise<any[]> {
    return await this._orm.connectAsync(MainDbContext, async db => {
      return await db.packingItem
        .include(item => item.packing)
        .include(item => item.lot)
        .include(item => item.goods)
        .include(item => item.stock)
        .include(item => item.stock!.warehouse)
        .where(item => [
          sorm.equal(item.packing!.paletteBarcode, paletteBarcode)
        ])
        .select(item => ({
          lotId: item.lotId,
          lotName: item.lot!.lot,
          goodName: item.goods!.name,
          specification: item.goods!.specification,
          thick: sorm.ifNull(item.lot!.thick, item.goods!.thick),
          width: sorm.ifNull(item.lot!.width, item.goods!.specification),
          weight: sorm.ifNull(item.lot!.weight, item.goods!.weight),
          length: item.lot!.length,
          warehouseName: item.stock!.warehouse!.name
        }))
        .resultAsync();
    });
  }

  public async showEquipmentInsideRpmInfo(item: IProductionItemVM): Promise<void> {
    const result = await this._modal.show(EquipmentInfoShowModal, "설비 정보 (RPM 내층)", {
      equipmentId: this.selectedItem!.equipmentId!,
      productionItemId: item.id!,
      type: "insideRpm"
    });
    if (!result) return;

    this._cdr.markForCheck();
  }

  public async showEquipmentMiddleRpmInfo(item: IProductionItemVM): Promise<void> {
    const result = await this._modal.show(EquipmentInfoShowModal, "설비 정보 (RPM 중층)", {
      equipmentId: this.selectedItem!.equipmentId!,
      productionItemId: item.id!,
      type: "middleRpm"
    });
    if (!result) return;

    this._cdr.markForCheck();
  }

  public async showEquipmentOutSideRpmInfo(item: IProductionItemVM): Promise<void> {
    const result = await this._modal.show(EquipmentInfoShowModal, "설비 정보 (RPM 외층)", {
      equipmentId: this.selectedItem!.equipmentId!,
      productionItemId: item.id!,
      type: "outSideRpm"
    });
    if (!result) return;

    this._cdr.markForCheck();
  }

  public async showEquipmentLineSpeedInfo(item: IProductionItemVM): Promise<void> {
    const result = await this._modal.show(EquipmentInfoShowModal, "설비 정보 (라인스피드)", {
      equipmentId: this.selectedItem!.equipmentId!,
      productionItemId: item.id!,
      type: "line"
    });
    if (!result) return;

    this._cdr.markForCheck();
  }

  public async showEquipmentTensionInfo(item: IProductionItemVM): Promise<void> {
    const result = await this._modal.show(EquipmentInfoShowModal, "설비 정보 (텐션)", {
      equipmentId: this.selectedItem!.equipmentId!,
      productionItemId: item.id!,
      type: "tension"
    });
    if (!result) return;

    this._cdr.markForCheck();
  }

  public async showEquipmentOutsideTemperatureInfo(item: IProductionItemVM): Promise<void> {
    const result = await this._modal.show(EquipmentInfoShowModal, "설비 정보 (수지온도-외층)", {
      equipmentId: this.selectedItem!.equipmentId!,
      productionItemId: item.id!,
      type: "outTemperature"
    });
    if (!result) return;

    this._cdr.markForCheck();
  }

  public async showEquipmentMiddleTemperatureInfo(item: IProductionItemVM): Promise<void> {
    const result = await this._modal.show(EquipmentInfoShowModal, "설비 정보 (수지온도-중층)", {
      equipmentId: this.selectedItem!.equipmentId!,
      productionItemId: item.id!,
      type: "middleTemperature"
    });
    if (!result) return;

    this._cdr.markForCheck();
  }

  public async showEquipmentInsideTemperatureInfo(item: IProductionItemVM): Promise<void> {
    const result = await this._modal.show(EquipmentInfoShowModal, "설비 정보 (수지온도-내층)", {
      equipmentId: this.selectedItem!.equipmentId!,
      productionItemId: item.id!,
      type: "insideTemperature"
    });
    if (!result) return;

    this._cdr.markForCheck();
  }

  public async showEquipmentInsidePressureInfo(item: IProductionItemVM): Promise<void> {
    const result = await this._modal.show(EquipmentInfoShowModal, "설비 정보 (수지압력-내층)", {
      equipmentId: this.selectedItem!.equipmentId!,
      productionItemId: item.id!,
      type: "insidePressure"
    });
    if (!result) return;

    this._cdr.markForCheck();
  }

  public async showEquipmentMiddlePressureInfo(item: IProductionItemVM): Promise<void> {
    const result = await this._modal.show(EquipmentInfoShowModal, "설비 정보 (수지압력-중층)", {
      equipmentId: this.selectedItem!.equipmentId!,
      productionItemId: item.id!,
      type: "middlePressure"
    });
    if (!result) return;

    this._cdr.markForCheck();
  }

  public async showEquipmentOutSidePressureInfo(item: IProductionItemVM): Promise<void> {
    const result = await this._modal.show(EquipmentInfoShowModal, "설비 정보 (수지압력-외층)", {
      equipmentId: this.selectedItem!.equipmentId!,
      productionItemId: item.id!,
      type: "outSidePressure"
    });
    if (!result) return;

    this._cdr.markForCheck();
  }

  public async onSearchFormSubmit(): Promise<void> {
    this.pagination.page = 0;
    this.lastFilter = Object.clone(this.filter);
    await this._search();
    this._cdr.markForCheck();
  }

  public async onSearchLotSubmit(): Promise<void> {
    const lot = this.filter!.lotName && this.filter!.lotName!.trim();
    const productionItem = await this._searchProductionItemOfLotName(lot);

    if (productionItem) {
      const modalTitleName = this.filter!.lotName! + " 생산 항목 정보 (품목명 : " + productionItem.goodName + ")";
      this.filter!.lotName = undefined;

      const result = await this._modal.show(ProductionItemDetailRegisterModal, modalTitleName, {
        productionItemId: productionItem.id,
        goodId: productionItem.goodId
      });
      if (!result) return;

      await this.onSearchFormSubmit();
      this._cdr.markForCheck();
    }
    else {
      this._toast.danger("해당 LOT로 구성된 생산 항목이 존재하지 않습니다.");
    }
  }

  private async _searchProductionItemOfLotName(lot?: string): Promise<any | undefined> {
    let productionItem: any | undefined;
    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        productionItem = await db.productionItem
          .include(item => item.lot)
          .include(item => item.goods)
          .where(item => [
            sorm.equal(item.lot!.lot, lot)
          ])
          .select(item => ({
            id: item.id,
            goodId: item.goodId,
            goodName: item.goods!.name
          }))
          .singleAsync();
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }
    return productionItem;
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

  public onSelectedItemsChange(items: any[]): void {
    this.packingItems = [];
    this.packingItems = items.filter(item => !!item.id && !item.isTestProductionItem);
    items = [];
  }

  public async onPackingItems(): Promise<void> {
    await this._packingSave();
    this._cdr.markForCheck();
  }

  private async _packingSave(): Promise<void> {

    if (this.packingItems && this.packingItems.length < 1) {
      this._toast.danger("LOT리스트가 비어 있습니다.");
      return;
    }

    if (this.packingItems && this.packingItems.some(item => !!item.packingBarcode)) {
      this._toast.danger("이미 포장바코드로 등록 된 항목이 존재합니다.\n확인 후 다시 진행 해 주세요.");
      return;
    }

    this.viewBusyCount++;

    try {
      await this._orm.connectAsync(MainDbContext, async db => {

        // INSERT
        const documentCode = await CodeProc.getDocumentCode(db, this._appData.authInfo!.companyId, this._appData.authInfo!.employeeId, undefined, undefined, "포장", undefined, undefined);

        const newPacking = await db.packing
          .insertAsync({
            companyId: this._appData.authInfo!.companyId,
            paletteBarcode: documentCode,
            codeSeq: Number(documentCode.substr(-5, 5)),
            isPrinting: false,
            createdByEmployeeId: this._appData.authInfo!.employeeId,
            createdAtDateTime: new DateTime(),
            isDisabled: false
          });

        let seq = 1;
        for (const packingItem of this.packingItems || []) {
          const newPackingItem = await db.packingItem
            .insertAsync({
              companyId: this._appData.authInfo!.companyId,
              packingId: newPacking.id!,
              seq,
              lotId: packingItem.lotId!,
              goodId: this.selectedItem!.goodId!,
              isDisabled: false,
              createdAtDateTime: new DateTime(),
              createdByEmployeeId: this._appData.authInfo!.employeeId
            });
          packingItem.packingBarcode = newPacking.paletteBarcode;
          seq++;

          const stockInfo = await db.stock
            .include(item => item.lot)
            .where(item => [
              sorm.equal(item.lot!.isTesting, false),
              sorm.equal(item.lotId, packingItem.lotId)
            ])
            .updateAsync(
              () => ({
                paletteBarcodeId: newPacking.id
              })
            );

          await db.productionItem
            .where(item => [
              sorm.equal(item.id, packingItem.id)
            ])
            .updateAsync(
              () => ({
                packingId: newPackingItem.id
              })
            );

          if (stockInfo.id) {
            await db.packingItem
              .where(item => [
                sorm.equal(item.id, newPackingItem.id)
              ])
              .updateAsync(
                () => ({
                  stockId: stockInfo.id
                })
              );
          }

        }
      });

      this.orgItems = Object.clone(this.items);
      this._toast.success("저장되었습니다.");
      this._cdr.markForCheck();
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.viewBusyCount--;
  }

  public async onStockExcept(): Promise<void> {
    await this._stockExceptSave();
    this._cdr.markForCheck();
  }

  private async _stockExceptSave(): Promise<void> {

    if (this.packingItems && this.packingItems.length < 1) {
      this._toast.danger("LOT리스트가 비어 있습니다.");
      return;
    }

    if (this.packingItems && this.packingItems.some(item => !!item.isNotStockItem)) {
      this._toast.danger("이미 재고제외로 등록 된 항목이 존재합니다.\n확인 후 다시 진행 해 주세요.");
      return;
    }

    this.viewBusyCount++;

    try {
      await this._orm.connectAsync(MainDbContext, async db => {

        for (const productionItem of this.packingItems || []) {
          await db.lotHistory
            .where(item => [
              sorm.equal(item.id, productionItem!.lotId)]
            )
            .updateAsync(() => ({
              isNotStock: true
            }));
          productionItem.isNotStockItem = true;
        }
      });

      this.orgItems = Object.clone(this.items);
      this._toast.success("저장되었습니다.");
      this._cdr.markForCheck();
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

    for (const diffItem of diffTargets) {
      if (diffItem.scrapList && diffItem.scrapList.length > 0) {
        for (const scrapItem of diffItem.scrapList) {
          if (diffItem.scrapList.filter(item => item.rollNumber === scrapItem.rollNumber).length > 1) {
            this._toast.danger("동일한 스크랩 번호가 있습니다.");
            return;
          }
        }
      }
    }

    this.viewBusyCount++;

    try {
      this._domValidator.validate(this._elRef!.nativeElement);

      Object.validatesArray(
        diffTargets,
        `생산실적`,
        {
          id: {displayName: "ID", type: Number},
          productionOrderId: {displayName: "생산지시 ID", notnull: true},
          isCanceled: {displayName: "사용중지", type: Boolean, notnull: true}
        }
      );

      for (const diffItem of diffTargets) {
        if (diffItem.scrapList) {
          Object.validatesArray(
            diffItem.scrapList,
            `스크랩 정보`,
            {
              id: {displayName: "ID", type: Number},
              occurrenceDate: {displayName: "발생일자", notnull: true},
              scrapGoodId: {displayName: "발생스크랩", notnull: true},
              typeId: {displayName: "유형", notnull: true},
              weight: {displayName: "발생 중량", notnull: true}
            }
          );
        }
      }

      await this._orm.connectAsync(MainDbContext, async db => {
          for (const diffItem of diffTargets.reverse()) {
            // INSERT
            if (!diffItem.id) {
              const newProduction = await db.production
                .insertAsync({
                  companyId: this._appData.authInfo!.companyId,
                  instructionId: diffItem.productionOrderId!,
                  productionOrderCode: diffItem.productionOrderCode,
                  equipmentId: diffItem.equipmentId!,
                  goodId: diffItem.goodId!,
                  orderQuantity: diffItem.orderQuantity!,
                  status: "생산대기",
                  isCanceled: false,
                  isCompletion: false,
                  createdByEmployeeId: this._appData.authInfo!.employeeId,
                  createdAtDateTime: new DateTime()
                });
              diffItem.id = newProduction.id;

              await db.productionInstruction
                .where(item => [
                  sorm.equal(item.id, diffItem.productionOrderId)]
                )
                .updateAsync(() => ({
                  isProduction: newProduction.id
                }));

              for (let i = 1; i <= diffItem.orderQuantity!; i++) {
                // await CodeProc.getLotCode(db, this._appData.authInfo!.companyId, this._appData.authInfo!.employeeId, 1, diffItem.goodId!, diffItem.productionOrderCode!, diffItem.rollLength, diffItem.rollWeight, diffItem.specification, diffItem.goodThickness, diffItem.id);
                const code = diffItem.equipmentCode === "O" ? "E0" : diffItem.equipmentCode!.length < 2 ? diffItem.equipmentCode!.padEnd(2, "0") : diffItem.equipmentCode;
                await CodeProc.getLotCode2(db, this._appData.authInfo!.companyId, this._appData.authInfo!.employeeId, 1, diffItem.goodId!, diffItem.goodName!, code!, diffItem.productionOrderDueDate, diffItem.rollLength, diffItem.rollWeight, diffItem.specification, diffItem.goodThickness, diffItem.id);
              }

              for (const scrapItem of diffItem.scrapList || []) {
                const lotInfo = scrapItem.rating === "재생 가능" ? (await CodeProc.getLotCode2(db, this._appData.authInfo!.companyId, this._appData.authInfo!.employeeId, 1,
                  scrapItem.scrapGoodId!, scrapItem.scrapGoodName!, "L0", undefined, scrapItem.weight)).lotId : undefined;

                const newScrap = await db.scrap
                  .insertAsync({
                    companyId: this._appData.authInfo!.companyId,
                    occurrenceDate: scrapItem.occurrenceDate!,
                    productionId: diffItem.id!,
                    scrapGoodId: scrapItem.scrapGoodId!,
                    kind: scrapItem.kind,
                    rollNumber: scrapItem.rollNumber,
                    lotId: lotInfo,
                    weight: scrapItem.weight!,
                    typeId: scrapItem.typeId!,
                    rating: scrapItem.rating,
                    remark: scrapItem.remark,
                    isDisabled: false,
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: this._appData.authInfo!.employeeId
                  });
                scrapItem.id = newScrap.id;

                if (scrapItem.rating === "재생 가능") {
                  await StockProc.modifyStock(db, this._appData.authInfo!.companyId, scrapItem.scrapGoodId!, scrapItem.weight, lotInfo, 1, "+", "공통");
                }

              }

              /* if (diffItem.productionList) {
                 if (diffItem.status === "생산대기") {
                   await db.production
                     .where(item => [
                       sorm.equal(item.id, newProduction.id)]
                     )
                     .updateAsync(() => ({
                       status: "생산중",
                       firstModifiedAtDateTime: new DateTime()
                     }));
                 }

                 for (const productionItem of diffItem.productionList.reverse() || []) {
                   const getLotId = await db.lotHistory.where(item => [sorm.equal(item.lot, productionItem.lotName)]).singleAsync();

                   const newProductionItem = await db.productionItem
                     .insertAsync({
                       companyId: this._appData.authInfo!.companyId,
                       productionId: diffItem.id!,
                       productionGroup: productionItem.productionGroup,
                       goodId: diffItem.goodId!,
                       lotId: getLotId!.id,
                       lotSeq: getLotId!.seq,
                       weight: productionItem.weight,
                       width: productionItem.specification,
                       length: productionItem.length,
                       thickness: productionItem.thickness,
                       outSide: productionItem.outSide,
                       inside: productionItem.inside,
                       theMinimum: productionItem.theMinimum,
                       theBest: productionItem.theBest,
                       average: productionItem.average,
                       rating: productionItem.rating,
                       firstProductionDateTime: new DateTime(),
                       modifyDateTime: new DateTime(),
                       lastProductionDateTime: new DateTime(),
                       defectType: productionItem.defectType,
                       insiderLayer: productionItem.insiderLayer,
                       middleLayer: productionItem.middleLayer,
                       outerLayer: productionItem.outerLayer,
                       remarkC1: productionItem.remarkC1,
                       remarkC2: productionItem.remarkC2,
                       md: productionItem.md,
                       td: productionItem.td,
                       createdAtDateTime: new DateTime(),
                       createdByEmployeeId: this._appData.authInfo!.employeeId
                     });
                   productionItem.id = newProductionItem.id;

                   await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diffItem.goodId!, productionItem.length, getLotId!.id, 1, "+", "공통", productionItem.id);

                   await db.lotHistory
                     .where(item => [
                       sorm.equal(item.id, getLotId!.id)
                     ])
                     .updateAsync(
                       () => ({
                         length: productionItem.length,
                         thick: productionItem.thickness,
                         width: productionItem.specification
                       })
                     );
                 }
               }*/
            }
            else {
              await db.production
                .where(item => [
                  sorm.equal(item.id, diffItem.id)
                ])
                .updateAsync(
                  () => ({
                    isCanceled: diffItem.isCanceled,
                    modifyAtDateTime: new DateTime(),
                    modifyByEmployeeId: this._appData.authInfo!.employeeId
                  })
                );

              if (diffItem.isCanceled) {
                await db.productionInstruction
                  .where(item => [
                    sorm.equal(item.id, diffItem.productionOrderId)]
                  )
                  .updateAsync(() => ({
                    isProduction: undefined
                  }));
                await db.lotHistory
                  .where(item => [sorm.equal(item.productionId, diffItem.id)])
                  .updateAsync(
                    () => ({
                      productionId: undefined
                    })
                  );
                await db.production.where(item => [sorm.equal(item.id, diffItem.id)]).deleteAsync();
              }
              else {
                //스크랩
                if (diffItem.scrapList) {
                  for (const scrapItem of diffItem.scrapList || []) {
                    if (!scrapItem.id) {

                      const lotInfo = (scrapItem.rating === "재생 가능") ? (await CodeProc.getLotCode2(db, this._appData.authInfo!.companyId, this._appData.authInfo!.employeeId, 1,
                        scrapItem.scrapGoodId!, scrapItem.scrapGoodName!, "L0", undefined, scrapItem.weight)).lotId : undefined;
                      const newScrap = await db.scrap
                        .insertAsync({
                          companyId: this._appData.authInfo!.companyId,
                          occurrenceDate: scrapItem.occurrenceDate!,
                          productionId: diffItem.id!,
                          scrapGoodId: scrapItem.scrapGoodId!,
                          kind: scrapItem.kind,
                          rollNumber: scrapItem.rollNumber,
                          lotId: lotInfo,
                          weight: scrapItem.weight!,
                          typeId: scrapItem.typeId!,
                          rating: scrapItem.rating,
                          remark: scrapItem.remark,
                          isDisabled: false,
                          createdAtDateTime: new DateTime(),
                          createdByEmployeeId: this._appData.authInfo!.employeeId
                        });
                      scrapItem.id = newScrap.id;
                      if (scrapItem.rating === "재생 가능") {
                        await StockProc.modifyStock(db, this._appData.authInfo!.companyId, scrapItem.scrapGoodId!, scrapItem.weight, lotInfo!, 1, "+", "공통");
                      }
                    }
                    else {
                      if (scrapItem.isDisabled) {
                        await db.scrap.where(item => [sorm.equal(item.id, scrapItem.id)]).deleteAsync();

                        if (scrapItem.prevRating === "재생 가능" && scrapItem.rating === "재생 가능") {
                          await StockProc.modifyStock(db, this._appData.authInfo!.companyId, scrapItem.scrapGoodId!, scrapItem.prevWeight, scrapItem.lotId, 1, "-", "공통");
                        }
                      }
                      else {
                        const lotId = scrapItem.rating === "재생 가능" ? (await CodeProc.getLotCode2(db, this._appData.authInfo!.companyId, this._appData.authInfo!.employeeId, 1,
                          scrapItem.scrapGoodId!, scrapItem.scrapGoodName!, "L0", undefined, scrapItem.weight)).lotId : undefined;

                        await db.scrap
                          .where(item => [
                            sorm.equal(item.id, scrapItem.id)
                          ])
                          .updateAsync(
                            () => ({
                              kind: scrapItem.kind,
                              weight: scrapItem.weight!,
                              typeId: scrapItem.typeId,
                              lotId,
                              rating: scrapItem.rating,
                              remark: scrapItem.remark,
                              isDisabled: scrapItem.isDisabled
                            })
                          );

                        if (scrapItem.rating === "재생 가능") {
                          if (scrapItem.prevRating === "보류") {
                            await StockProc.modifyStock(db, this._appData.authInfo!.companyId, scrapItem.scrapGoodId!, scrapItem.weight, lotId, 1, "+", "공통");
                          }
                          else {
                            await StockProc.modifyStock(db, this._appData.authInfo!.companyId, scrapItem.scrapGoodId!, scrapItem.prevWeight, scrapItem.lotId, 1, "-", "공통");
                            await StockProc.modifyStock(db, this._appData.authInfo!.companyId, scrapItem.scrapGoodId!, scrapItem.weight, scrapItem.lotId, 1, "+", "공통");
                          }
                        }
                      }
                    }
                  }
                }

                // 생산
                if (diffItem.productionList && diffItem.productionList.length > 0) {
                  if (diffItem.status === "생산대기") {
                    await db.production
                      .where(item => [
                        sorm.equal(item.id, diffItem.id)]
                      )
                      .updateAsync(() => ({
                        status: "생산중",
                        firstModifiedAtDateTime: new DateTime()
                      }));
                  }

                  for (const productionItem of diffItem.productionList.reverse() || []) {
                    if (!productionItem.id) {
                      // 추가 생산 내용이 있을 경우 LOT 생성 (생산준비, 생산중지 포함)
                      if (productionItem.isAddProductionItem) {
                        if (diffItem.status === "생산준비" || diffItem.status === "생산중지") {
                          console.log(" ##" + Number.parseInt(productionItem.lotName!.substr(8, 3), 10));
                          console.log(productionItem.lotName);

                          await CodeProc.getTestLotCode(db, this._appData.authInfo!.companyId, this._appData.authInfo!.employeeId, 1, diffItem.goodId!, diffItem.goodName!,
                            Number.parseInt(productionItem.lotName!.substr(8, 3), 10), diffItem.id, undefined, diffItem.productionOrderDueDate);
                        }
                        else {
                          const code = diffItem.equipmentCode === "O" ? "E0" : diffItem.equipmentCode!.length < 2 ? diffItem.equipmentCode!.padEnd(2, "0") : diffItem.equipmentCode;
                          await CodeProc.getLotCode2(db, this._appData.authInfo!.companyId, this._appData.authInfo!.employeeId, 1, diffItem.goodId!, diffItem.goodName!, code!,
                            diffItem.productionOrderDueDate, diffItem.rollLength, diffItem.rollWeight, diffItem.specification, diffItem.goodThickness, diffItem.id);
                        }
                      }

                      const getLotId = await db.lotHistory.where(item => [sorm.equal(item.lot, productionItem.lotName)]).singleAsync();
                      /*// 이미 해당 LOT로 설비에서 생산이 진행 된 경우
       const isEquipmentProduct = await db.productionItem.where(item => [sorm.equal(item.lotId, getLotId!.id)]).singleAsync();
       if (isEquipmentProduct) {
         throw new Error("\'LOT : " + productionItem.lotName + "\'은 이미 설비에서 생산이 진행 중입니다.");
       }*/
                      const newProductionItem = await db.productionItem
                        .insertAsync({
                          companyId: this._appData.authInfo!.companyId,
                          productionId: diffItem.id!,
                          productionGroup: productionItem.productionGroup,
                          goodId: diffItem.goodId!,
                          lotId: getLotId!.id,
                          lotSeq: getLotId!.seq,
                          weight: productionItem.weight,
                          length: productionItem.length,
                          width: productionItem.specification,
                          thickness: productionItem.thickness,
                          outSide: productionItem.outSide,
                          inside: productionItem.inside,
                          theMinimum: productionItem.theMinimum,
                          theBest: productionItem.theBest,
                          average: productionItem.average,
                          rating: productionItem.rating,
                          defectType: productionItem.defectType,
                          firstProductionDateTime: new DateTime(),
                          modifyDateTime: new DateTime(),
                          lastProductionDateTime: new DateTime(),
                          md: productionItem.md,
                          td: productionItem.td,
                          insiderLayer: productionItem.insiderLayer,
                          middleLayer: productionItem.middleLayer,
                          outerLayer: productionItem.outerLayer,
                          remarkC1: productionItem.remarkC1,
                          remarkC2: productionItem.remarkC2,
                          createdAtDateTime: new DateTime(),
                          createdByEmployeeId: this._appData.authInfo!.employeeId
                        });
                      productionItem.id = newProductionItem.id;

                      await db.lotHistory
                        .where(item => [
                          sorm.equal(item.id, getLotId!.id)]
                        )
                        .updateAsync(() => ({
                          productionItemId: productionItem.id,
                          isTesting: productionItem.isTestProductionItem,
                          isNotStock: productionItem.isNotStockItem,
                          goodsRating: productionItem.rating,
                          thick: productionItem.thickness,
                          width: productionItem.specification
                        }));

                      if (!productionItem.isNotStockItem) {
                        await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diffItem.goodId!, productionItem.length, getLotId!.id, 1, "+", "공통", productionItem.id);
                      }
                    }
                    else {
                      await db.productionItem
                        .where(item => [
                          sorm.equal(item.id, productionItem.id)
                        ])
                        .updateAsync(
                          () => ({
                            productionGroup: productionItem.productionGroup,
                            weight: productionItem.weight,
                            thickness: productionItem.thickness,
                            width: productionItem.specification,
                            outSide: productionItem.outSide,
                            inside: productionItem.inside,
                            theMinimum: productionItem.theMinimum,
                            theBest: productionItem.theBest,
                            average: productionItem.average,
                            md: productionItem.md,
                            td: productionItem.td,
                            modifyDateTime: new DateTime(),
                            insiderLayer: productionItem.insiderLayer,
                            middleLayer: productionItem.middleLayer,
                            outerLayer: productionItem.outerLayer,
                            remarkC1: productionItem.remarkC1,
                            remarkC2: productionItem.remarkC2,
                            rating: productionItem.rating,
                            defectType: productionItem.defectType
                          })
                        );

                      await db.lotHistory
                        .where(item => [
                          sorm.equal(item.id, productionItem.lotId)]
                        )
                        .updateAsync(() => ({
                          isTesting: productionItem.isTestProductionItem,
                          isNotStock: productionItem.isNotStockItem,
                          goodsRating: productionItem.rating,
                          thick: productionItem.thickness,
                          width: productionItem.specification
                        }));

                      await db.stock
                        .include(item => item.lot)
                        .where(item => [
                          sorm.equal(item.lot!.isTesting, false),
                          sorm.equal(item.lotId, productionItem.lotId)]
                        )
                        .updateAsync(() => ({
                          rating: productionItem.rating
                        }));

                      /*    const rating = productionItem.rating || "공통";
                          await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diffItem.goodId!, getLotId!.length, getLotId!.id, 1, "-", rating);
                          await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diffItem.goodId!, productionItem.length, getLotId!.id, 1, "+", rating);*/

                    }
                  }

                }
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

        const result = queryable
          .include(item => item.instruction)
          .include(item => item.goods)
          .include(item => item.equipment)
          .include(item => item.createdByEmployee)
          .include(item => item.scrap)
          .include(item => item.scrap![0].goods)
          .include(item => item.scrap![0].type)
          .include(item => item.scrap![0].employee)
          .join(
            Production,
            "productionItemInfo",
            (qb, en) => qb
              .include(item => item.productionItem)
              .include(item => item.productionItem![0].lot)
              .include(item => item.productionItem![0].weightMeasurement)
              .where(item => [
                sorm.equal(item.id, en.id),
                sorm.equal(item.productionItem![0].lot!.isNotStock, false)
              ])
              .select(item => ({
                totalLength: sorm.sum(sorm.ifNull(item.productionItem![0].length, 0)),
                totalWeight: sorm.sum(sorm.ifNull(item.productionItem![0].weightMeasurement!.realWeight, 0))
              })),
            true
          )
          .join(
            Production,
            "testProductionItemInfo",
            (qb, en) => qb
              .include(item => item.productionItem)
              .include(item => item.productionItem![0].lot)
              .include(item => item.productionItem![0].weightMeasurement)
              .where(item => [
                sorm.equal(item.id, en.id),
                sorm.equal(item.productionItem![0].lot!.isTesting, true)
              ])
              .select(item => ({
                totalLength: sorm.sum(sorm.ifNull(item.productionItem![0].length, 0)),
                totalWeight: sorm.sum(sorm.ifNull(item.productionItem![0].weightMeasurement!.realWeight, 0))
              })),
            true
          )
          .join(
            Production,
            "badProductionItemInfo",
            (qb, en) => qb
              .include(item => item.productionItem)
              .include(item => item.productionItem![0].lot)
              .include(item => item.productionItem![0].weightMeasurement)
              .where(item => [
                sorm.equal(item.id, en.id),
                sorm.equal(item.productionItem![0].lot!.isTesting, false),
                sorm.equal(item.productionItem![0].lot!.isNotStock, true)
              ])
              .select(item => ({
                totalLength: sorm.sum(sorm.ifNull(item.productionItem![0].length, 0)),
                totalWeight: sorm.sum(sorm.ifNull(item.productionItem![0].weightMeasurement!.realWeight, 0))
              })),
            true
          )
          .select(item => ({
            id: item.id,
            productionOrderId: item.instructionId,
            productionOrderCode: item.instruction!.productionInstructionCode,
            productionOrderDueDate: item.instruction!.orderDate,
            productionOrderIsCanceled: item.instruction!.isCanceled,
            capa: item.instruction!.capa,
            rollWeight: item.instruction!.rollWeight,
            rollLength: item.instruction!.rollLength,
            goodId: item.goodId,
            goodName: item.goods!.name,
            unitName: item.goods!.unitName,
            goodThickness: item.goods!.thick,
            specification: item.goods!.specification,
            equipmentId: item.equipmentId,
            equipmentName: item.equipment!.name,
            equipmentCode: item.equipment!.code,
            equipmentProductCode: item.equipment!.equipmentCode,
            orderQuantity: item.orderQuantity,
            totalLength: sorm.ifNull(item.productionItemInfo!.totalLength, 0),
            totalWeight: sorm.ifNull(item.productionItemInfo!.totalWeight, 0),
            isStop: sorm.case<boolean>(
              sorm.equal(item.status, "생산중지"), true
            ).else(false),
            status: item.status,
            inspectionId: item.inspectionId,
            createdByEmployeeId: item.createdByEmployeeId,
            createdByEmployeeName: item.createdByEmployee!.name,
            createdAtDateTime: item.createdAtDateTime,
            productionReadyModifiedAtDateTime: item.productionReadyModifiedAtDateTime,
            totalTestProductionQuantity: sorm.ifNull(item.testProductionItemInfo!.totalLength, 0),
            totalTestProductionWeight: sorm.ifNull(item.testProductionItemInfo!.totalWeight, 0),
            totalGoodProductionQuantity: sorm.ifNull(item.productionItemInfo!.totalLength, 0),
            totalBadProductionQuantity: sorm.ifNull(item.badProductionItemInfo!.totalLength, 0),
            totalBadProductionWeight: sorm.ifNull(item.badProductionItemInfo!.totalWeight, 0),
            isCanceled: item.isCanceled,
            isCompletion: item.isCompletion,

            scrapList: item.scrap && item.scrap.map(item1 => ({
              id: item1.id,
              occurrenceDate: item1.occurrenceDate,
              kind: item1.kind,
              scrapGoodId: item1.scrapGoodId,
              scrapGoodName: item1.goods!.name,
              lotId: item1.lotId,
              rollNumber: item1.rollNumber,
              weight: item1.weight,
              prevWeight: item1.weight,
              typeId: item1.typeId,
              typeName: item1.type!.name,
              rating: item1.rating,
              prevRating: item1.rating,
              dueDate: item1.occurrenceDate,
              remark: item1.remark,
              isDisabled: item1.isDisabled,
              createdAtDateTime: item1.createdAtDateTime,
              createdByEmployeeId: item1.createdByEmployeeId,
              createdByEmployeeName: item1.employee!.name
            })) || undefined,
            productionList: undefined
          }));

        this.items = await result
          .orderBy(item => item.id)
          .limit(this.pagination.page * 50, 50)
          .resultAsync();

        this.orgItems = Object.clone(this.items);

        if (this.selectedItem) {
          this.selectedItem = this.items.single(item => item.id === this.selectedItem!.id);
          await this.onSelectedItemChanged(this.selectedItem!);
        }
        else {
          this.selectedItem = undefined;
        }

        const totalCount = await result.countAsync();
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

  private _getSearchQueryable(db: MainDbContext): Queryable<Production> {
    let queryable = db.production
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
          sorm.between(item.createdAtDateTime, this.lastFilter!.fromDate, this.lastFilter!.toDate!)
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

    if (this.lastFilter!.equipmentId) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.equipmentId, this.lastFilter!.equipmentId)
        ]);
    }

    if (this.lastFilter!.productionOrderCode) {
      queryable = queryable
        .include(item => item.instruction)
        .where(item => [
          sorm.includes(item.instruction!.productionInstructionCode, this.lastFilter!.productionOrderCode)
        ]);
    }

    if (this.lastFilter!.isCanceled) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.isCanceled, false)
        ]);
    }

    return queryable;
  }

}

interface IFilterVM {
  id?: number;
  productionOrderCode?: string;
  fromDate?: DateOnly;
  toDate?: DateOnly;
  equipmentId?: number;
  lotName?: string;
  goodName?: string;
  specification?: string;
  isCanceled: boolean;
}

interface IProcessProductionVM {
  id: number | undefined;
  productionOrderId: number | undefined;
  productionOrderCode: string | undefined;
  productionOrderIsCanceled: boolean | undefined;
  productionOrderDueDate: DateOnly | undefined;
  capa: number | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  goodThickness: number | undefined;
  unitName: string | undefined;
  specification: string | undefined;
  equipmentId: number | undefined;
  equipmentName: string | undefined;
  equipmentCode: string | undefined;
  equipmentProductCode: string | undefined;
  orderQuantity: number | undefined;
  rollWeight: number | undefined;
  rollLength: number | undefined;
  totalWeight: number | undefined;
  totalLength: number | undefined;
  status: string | undefined;
  inspectionId: number | undefined;
  createdAtDateTime: DateTime | undefined;
  createdByEmployeeId: number | undefined;
  createdByEmployeeName: string | undefined;
  productionReadyModifiedAtDateTime: DateTime | undefined;
  isStop: boolean;
  isCanceled: boolean;
  isCompletion: boolean;
  totalGoodProductionQuantity: number | undefined;
  totalTestProductionQuantity: number | undefined;
  totalBadProductionQuantity: number | undefined;
  totalTestProductionWeight: number | undefined;
  totalBadProductionWeight: number | undefined;

  scrapList: IScrapListVM[] | undefined;
  productionList: IProductionItemVM[] | undefined;
}

interface IProductionItemVM {
  id: number | undefined;
  seq: number | undefined;
  productionGroup: "A" | "B" | undefined;
  lotId: number | undefined;
  lotName: string | undefined;
  packingId: number | undefined;
  packingBarcode: string | undefined;
  specification: string | undefined; //폭
  weight: number | undefined; //중량
  realWeight: number | undefined; //실측중량
  length: number | undefined; //길이
  thickness: number | undefined; // 두께
  outSide: number | undefined; // 외면
  inside: number | undefined; // 내면
  theMinimum: number | undefined; // 최하
  theBest: number | undefined; //최상
  average: number | undefined; // 평균
  md: number | undefined;
  td: number | undefined;
  defectType: "주름" | "펑크" | "알갱이" | "접힘" | "젤" | "칼빠짐" | "미터부족" | "기포" | "두께편차" | "PE뜯김" | "라인줄" | "수축" | "접착" | "중량" | "코로나" | undefined;
  insidePressure: number | undefined;
  middlePressure: number | undefined;
  outSidePressure: number | undefined;
  insideTemperature: number | undefined; // 수지온도
  middleTemperature: number | undefined; // 수지온도
  outsideTemperature: number | undefined; // 수지온도
  lineSpeed: number | undefined; // 라인스피드
  pressure: number | undefined; // 압력
  insiderLayer: number | undefined; // 내층
  middleLayer: number | undefined; // 중층
  outerLayer: number | undefined; // 외층
  insideRpm: number | undefined; // rpm
  middleRpm: number | undefined; // rpm
  outSideRpm: number | undefined; // rpm
  processorA: number | undefined; // 처리기 A
  processorB: number | undefined; // 처리기 B
  tension: number | undefined; // 텐션
  min: number | undefined; // 알림
  remarkC1: string | undefined; // 알림
  remarkC2: string | undefined; // 알림
  rating: "A" | "B" | "C" | "공통" | undefined;
  lastProductionItemDateTime: DateTime | undefined;
  createdAtDateTime: DateTime | undefined;
  createdByEmployeeId: number | undefined;
  createdByEmployeeName: string | undefined;
  isTestProductionItem: boolean;
  isPrevNotStockItem: boolean;
  isNotStockItem: boolean;
  isAddProductionItem: boolean | undefined;
}

interface IScrapListVM {
  id: number | undefined;
  occurrenceDate: DateOnly | undefined;
  kind: "생산" | "밀어내기" | "재감기";
  scrapGoodId: number | undefined;
  scrapGoodName: string | undefined;
  lotId: number | undefined;
  rollNumber: string | undefined;
  prevWeight: number | undefined;
  weight: number | undefined;
  typeId: number | undefined;
  typeName: string | undefined;
  prevRating: "재생 가능" | "재생 불가" | "보류" | undefined;
  rating: "재생 가능" | "재생 불가" | "보류" | undefined;
  dueDate: DateOnly | undefined;
  remark: string | undefined;
  isDisabled: boolean;
  createdAtDateTime: DateTime | undefined;
  createdByEmployeeId: number | undefined;
  createdByEmployeeName: string | undefined;
}