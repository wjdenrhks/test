import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnInit} from "@angular/core";
import {DateOnly, DateTime} from "@simplism/core";
import {
  GoodsIssue,
  GoodsIssuePlan,
  MainDbContext,
  ProductionInstruction, Stock,
  StockProc
} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {SdDomValidatorProvider, SdModalProvider, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {AppDataProvider} from "@sample/client-common";
import {GoodsSearchModal} from "../../modals/GoodsSearchModal";
import {StockSearchModal} from "../../modals/StockSearchModal";
import {Queryable} from "@simplism/orm-client";
import {PackingBarcodeSearchModal} from "../../modals/PackingBarcodeSearchModal";
import {ShowManualModal} from "../../modals/ShowManualModal";
import {ExcelWorkbook} from "@simplism/excel";

@Component({
  selector: "app-shipping-plan",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>출하계획</h4>
          <sd-topbar-menu (click)="onAddItemButtonClick()">
            <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
            행 추가
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onSaveButtonClick()">
            <sd-icon [icon]="'save'" [fixedWidth]="true"></sd-icon>
            저장
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onDownloadButtonClick()" *ngIf="items && items.length > 0">
            <sd-icon [icon]="'download'" [fixedWidth]="true"></sd-icon>
            다운로드
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
              <sd-form-item [label]="'년'">
                <sd-select [(value)]="filter.year">
                  <sd-select-item [value]="undefined">전체</sd-select-item>
                  <sd-select-item *ngFor="let year of yearList; trackBy: trackByMeFn"
                                  [value]="year">
                    {{ year }}
                  </sd-select-item>
                </sd-select>
              </sd-form-item>
              <sd-form-item [label]="'월'">
                <sd-select [(value)]="filter.month">
                  <sd-select-item [value]="undefined">전체</sd-select-item>
                  <sd-select-item *ngFor="let month of monthList; trackBy: trackByMeFn"
                                  [value]="month">
                    {{ month }}
                  </sd-select-item>
                </sd-select>
              </sd-form-item>
              <sd-form-item [label]="'주'">
                <sd-select [(value)]="filter.week">
                  <sd-select-item [value]="undefined">전체</sd-select-item>
                  <sd-select-item *ngFor="let week of weekList; trackBy: trackByMeFn"
                                  [value]="week">
                    {{ week }}
                  </sd-select-item>
                </sd-select>
              </sd-form-item>
              <sd-form-item [label]="'구분'">
                <sd-select [(value)]="filter.planType">
                  <sd-select-item [value]="undefined">전체</sd-select-item>
                  <sd-select-item [value]="'확정'">확정</sd-select-item>
                  <sd-select-item [value]="'예상'">예상</sd-select-item>
                  <sd-select-item [value]="'추가'">추가</sd-select-item>
                </sd-select>
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
              <sd-form-item [label]="'종결'">
                <sd-checkbox [(value)]="filter.isClosed"></sd-checkbox>
              </sd-form-item>
              <sd-form-item [label]="'취소'">
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
              <sd-sheet #sheet [id]="'shipping-plan'"
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
                <sd-sheet-column [header]="'계획구분'" [width]="100">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.planType" [disabled]="!!item.isProductionInstruction">
                      <sd-select-item [value]="'확정'">확정</sd-select-item>
                      <sd-select-item [value]="'예상'">예상</sd-select-item>
                      <sd-select-item [value]="'추가'">추가</sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'계획(년/월)'" [width]="110">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      <app-input-date [(year)]="item.year" [(month)]="item.month"
                                      (monthChange)="onDayListChange(item)" (yearChange)="onDayListChange(item)"
                                      [disabled]="!!item.isProductionInstruction"></app-input-date>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'주'" [width]="60">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.week" [disabled]="!!item.isProductionInstruction"
                               (valueChange)="onChangeWeek(item)">
                      <sd-select-item *ngFor="let week of weekList; trackBy: trackByMeFn"
                                      [value]="week">
                        {{ week }}
                      </sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'일'" [width]="60">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.day" [disabled]="!!item.isProductionInstruction"
                               (open)="onChangeWeek(item)" *ngIf="!item.weekDays">
                      <sd-select-item [value]="item.day">
                        {{ item.day }}
                      </sd-select-item>
                    </sd-select>
                    <sd-select [(value)]="item.day" [disabled]="!!item.isProductionInstruction" *ngIf="!!item.weekDays">
                      <sd-select-item *ngFor="let day of item.weekDays; trackBy: trackByMeFn"
                                      [value]="day.day">
                        {{ day.day }}
                      </sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'구분'" [width]="100">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.type" [disabled]="true">
                      <sd-select-item [value]="'내수용'">내수용</sd-select-item>
                      <sd-select-item [value]="'수출용'">수출용</sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'거래처'">
                  <ng-template #item let-item="item">
                    <app-partner-select [(value)]="item.partnerId" *ngIf="!item.id"
                                        (valueChange)="onChangePartner($event, item)"
                                        [required]="true"></app-partner-select>
                    <div class="sd-padding-xs-sm" *ngIf="!!item.id">
                      {{ item.partnerName }}
                    </div>

                    <!--<div class="sd-padding-xs-sm">
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
                    <app-good-select [(value)]="item.goodId" *ngIf="!item.id"
                                     (valueChange)="onChangeGood($event, item)" [required]="true">
                    </app-good-select>
                    <div class="sd-padding-xs-sm" *ngIf="!!item.id">
                      {{ item.goodName }}
                    </div>

                    <!-- <div class="sd-padding-xs-sm">
                       {{ item.goodName }}
                       <a (click)="shippingPlanGoodsSearchModalOpenButtonClick(item)"
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
                <sd-sheet-column [header]="'단위'" [width]="80">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.unitName }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'계획수량'">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.planQuantity" (valueChange)="onPredictionChange(item)"
                                  [required]="true" [type]="'number'"
                                  [disabled]="!!item.isProductionInstruction"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'예상 잔량'" [width]="80">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right">
                      {{ item.predictionQuantity | number }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'재고출하'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right;">
                      {{ item.stockQuantity | number }}
                    </div>
                    <!--   <sd-textfield [(value)]="item.stockQuantity" [type]="'number'"
                                     [disabled]="!!item.isProductionInstruction"></sd-textfield>-->
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'생산출하'">
                  <ng-template #item let-item="item">
                    <div style="text-align: center;">
                      <sd-textfield [(value)]="item.productionQuantity" [type]="'number'"
                                    [disabled]="!!item.isProductionInstruction"></sd-textfield>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'실 출하수량'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right;">
                      {{ item.realIssueQuantity | number }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'배차'">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.allocateTypeId" [disabled]="!!item.isProductionInstruction">
                      <sd-select-item [value]="undefined">미지정</sd-select-item>
                      <sd-select-item *ngFor="let locationType of allocateTypeList; trackBy: trackByMeFn"
                                      [value]="locationType.id"
                                      [hidden]="locationType.isDisabled">
                        {{ locationType.name }}
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
                <sd-sheet-column [header]="'종결'" [width]="80">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;" *ngIf="!!item.id">
                      {{ item.isClosed !== true ? "미종결" : "종결" }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'취소'" [width]="60">
                  <ng-template #item let-item="item">
                    <div style="text-align: center;">
                      <sd-checkbox [(value)]="item.isDisabled"
                                   [disabled]="!item.id || (!!item.id && !!item.isProductionInstruction)"></sd-checkbox>
                    </div>
                  </ng-template>
                </sd-sheet-column>
              </sd-sheet>

              <sd-dock [position]="'bottom'" style="height: 40%" *ngIf="selectedItem"
                       [id]="'shipping-plan-item'">
                <sd-dock-container class="sd-background-default">
                  <sd-dock class="sd-padding-xs-sm">
                    <h5 style="display: inline-block; padding-right: 1.4em;">출하계획 항목</h5>
                    <sd-button [size]="'sm'" (click)="onAddShippingPaletteGoodButtonClick()"
                               [inline]="true"
                               [disabled]="(selectedItem.id && !!selectedItem.goodId) ||  (selectedItem.id &&!!selectedItem.isProductionInstruction)">
                      <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
                      팔레트 바코드 추가
                    </sd-button>
                    &nbsp;
                    <sd-button [size]="'sm'" (click)="onAddShippingGoodButtonClick()"
                               [inline]="true" style="padding-left: 10px;"
                               [disabled]="(selectedItem.id && !!selectedItem.goodId) ||  (selectedItem.id &&!!selectedItem.isProductionInstruction)">
                      <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
                      행 추가
                    </sd-button>
                  </sd-dock>

                  <sd-pane>
                    <sd-sheet [id]="'shipping-plan-item'"
                              [items]="selectedItem.shippingPlanItems"
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
                            <a (click)="shippingPlanItemSearchModalOpenButtonClick(item)">
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
                      <sd-sheet-column [header]="'LOT'">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm">
                            {{ item.lotName }}
                            <a (click)="shippingPlanItemSearchModalOpenButtonClick(item)">
                              <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                            </a>
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'길이'" [width]="100">
                        <ng-template #item let-item="item">
                          <sd-textfield [(value)]="item.quantity" (valueChange)="onChangePlanGoodQuantity()"
                                        [type]="'number'"
                                        [disabled]="!!selectedItem.isProductionInstruction"></sd-textfield>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'단위'" [width]="80">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm" style="text-align: center;">
                            {{ item.unitName }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'중량'" [width]="100">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm">
                            {{ item.weight }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'폭'" [width]="100">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm">
                            {{ item.specification }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'두께'" [width]="100">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm">
                            {{ item.thick }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'비고'">
                        <ng-template #item let-item="item">
                          <sd-textfield [(value)]="item.remark"></sd-textfield>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'취소'" [width]="60">
                        <ng-template #item let-item="item">
                          <div style="text-align: center;">
                            <sd-checkbox [(value)]="item.isDisabled"
                                         [disabled]="!item.id || (item.id && !!selectedItem.isProductionInstruction)"></sd-checkbox>
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
export class ShippingPlanPage implements OnInit {

  public filter: IFilterVM = {
    year: undefined,
    month: undefined,
    week: undefined,
    type: undefined,
    planType: undefined,
    goodName: undefined,
    specification: undefined,
    lot: undefined,
    partnerId: undefined,
    partnerName: undefined,
    isClosed: false,
    isDisabled: false
  };

  public lastFilter?: IFilterVM;

  public pagination = {page: 0, length: 0};

  public items: IShippingPlanVM[] = [];
  public orgItems: IShippingPlanVM[] = [];

  public selectedItem?: IShippingPlanVM;

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public allocateTypeList: {
    id: number;
    name: string;
    isDisabled: boolean;
  }[] = [];

  public yearList = [] as number[];
  public monthList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  public weekList = [1, 2, 3, 4, 5, 6];
  public dayList: {
    day: number | undefined;
  }[] = [];

  public planDateList: {
    year: number;
    month: number;
    week: number;
    startDate: number;
    endDate: number;
  }[] = [];

  public partnerList: {
    id: number;
    name: string;
    isExport?: boolean;
    erpSync: number;
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
      this.allocateTypeList = await db.baseType
        .where(item => [
          sorm.equal(item.companyId, this._appData.authInfo!.companyId),
          sorm.equal(item.type, "배차정보"),
          sorm.equal(item.isDisabled, false)
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
          isExport: item.isExport,
          erpSync: item.erpSyncCode,
          isDisabled: item.isDisabled
        }))
        .resultAsync();
    });

    this.filter.year = new DateOnly().year;
    this.filter.month = new DateOnly().month;

    for (let i = 2018; i <= this.filter.year + 1; i++) {
      this.yearList.push(i);
    }
    const lastDay = new Date(this.filter.year, this.filter.month, 0).getDate();

    for (let i = 1; i <= lastDay; i++) {
      this.dayList.push({
        day: i
      });
    }

    await this.onSearchFormSubmit();
    this.mainBusyCount--;

    this._cdr.markForCheck();
  }

  public async onShowManualButtonClick(): Promise<void> {
    const result = await this._modal.show(ShowManualModal, "출하 계획 메뉴얼", {type: "shipping-plan"});
    if (!result) return;

    this._cdr.markForCheck();
  }

  public onDayListChange(item: IShippingPlanVM): void {
    const lastDay = new Date(item.year!, item.month!, 0).getDate();
    this.dayList = [];

    for (let i = 1; i <= lastDay; i++) {
      this.dayList.push({
        day: i
      });
    }
    item.day = 1;
    this._cdr.markForCheck();
  }

  public onAddItemButtonClick(): void {
    this.items.insert(0, {
      id: undefined,
      planType: "확정",
      type: "내수용",
      year: this.filter.year,
      month: this.filter.month,
      day: 1,
      week: 1,
      partnerId: undefined,
      partnerName: undefined,
      goodId: undefined,
      goodName: undefined,
      unitName: undefined,
      specification: undefined,
      predictionQuantity: undefined,
      planQuantity: undefined,
      stockQuantity: undefined,
      productionQuantity: 0,
      realIssueQuantity: undefined,
      allocateTypeId: undefined,
      allocateTypeName: undefined,
      createdAtDateTime: undefined,
      createdByEmployeeId: undefined,
      createdByEmployeeName: undefined,
      isClosed: false,
      isDisabled: false,
      isProductionInstruction: false,

      weekDays: undefined,
      shippingPlanItems: undefined
    });
  }

  public onRemoveItemButtonClick(item: IShippingPlanVM): void {
    this.items.remove(item);

    if (this.selectedItem === item) {
      this.selectedItem = undefined;
    }
  }

  public async onAddShippingGoodButtonClick(): Promise<void> {
    this.selectedItem!.shippingPlanItems = this.selectedItem!.shippingPlanItems || [];

    if (!this.selectedItem!.goodId) {
      this._toast.danger("출하 제품을 먼저 선택해 주세요.");
      return;
    }
    const result = await this._modal.show(StockSearchModal, "재고 제품(LOT) 검색", {
      isMulti: true,
      goodId: this.selectedItem!.goodId
    });
    if (!result) return;

    for (const productionGoods of result || []) {
      this.selectedItem!.shippingPlanItems!.insert(0, {
        id: undefined,
        goodId: productionGoods.goodId,
        goodName: productionGoods.goodName,
        specification: productionGoods.specification,
        think: productionGoods.thick,
        unitName: productionGoods.unitName,
        lotId: productionGoods.lotId,
        lotName: productionGoods.lotName,
        warehouseId: productionGoods.warehouseId,
        quantity: productionGoods.quantity,
        length: productionGoods.length,
        weight: productionGoods.weight,
        remark: undefined,
        createdAtDateTime: undefined,
        createdByEmployeeId: undefined,
        isDisabled: false
      });
    }

    await this.onChangePlanGoodQuantity();
    this._cdr.markForCheck();
  }

  public async onAddShippingPaletteGoodButtonClick(): Promise<void> {
    this.selectedItem!.shippingPlanItems = this.selectedItem!.shippingPlanItems || [];

    if (!this.selectedItem!.goodId) {
      this._toast.danger("출하 제품을 먼저 선택해 주세요.");
      return;
    }
    const result = await this._modal.show(PackingBarcodeSearchModal, "팔레트 바코드 검색", undefined);
    if (!result) return;


    for (const productionGoods of result.packingLotList || []) {
      if (!this.selectedItem!.shippingPlanItems!.some(item => !item.id && item.lotId === productionGoods.lotId)
        && (productionGoods.goodId === this.selectedItem!.goodId)) {
        this.selectedItem!.shippingPlanItems!.insert(0, {
          id: undefined,
          goodId: productionGoods.goodId,
          goodName: productionGoods.goodName,
          specification: productionGoods.specification,
          think: productionGoods.thick,
          length: productionGoods.length,
          unitName: productionGoods.unitName,
          lotId: productionGoods.lotId,
          lotName: productionGoods.lotName,
          warehouseId: productionGoods.warehouseId,
          quantity: productionGoods.quantity,
          weight: productionGoods.weight,
          remark: undefined,
          createdAtDateTime: undefined,
          createdByEmployeeId: undefined,
          isDisabled: false
        });
      }
    }

    await this.onChangePlanGoodQuantity();
    this._cdr.markForCheck();
  }

  public onRemoveItemShippingGoodButtonClick(item: IShippingPlanItemVM): void {
    this.selectedItem!.shippingPlanItems!.remove(item);

    this.selectedItem!.stockQuantity = this.selectedItem!.shippingPlanItems!.sum(item1 => item1.length || 0);
    this.selectedItem!.productionQuantity = (this.selectedItem!.predictionQuantity || 0) - (this.selectedItem!.stockQuantity || 0);
    this._cdr.markForCheck();
  }

  /*  public async partnerSearchModalOpenButtonClick(item: IShippingPlanVM): Promise<void> {
      const result = await this._modal.show(PartnerSearchModal, "거래처 검색", {isMulti: false});
      if (!result) return;

      item.partnerId = result.id;
      item.partnerName = result.name;
      item.type = result.isExport === true ? "수출용" : "내수용";

      this._cdr.markForCheck();
    }*/

  public async onChangePartner(partnerId: number, item: IShippingPlanVM): Promise<void> {
    if (partnerId) {
      item.partnerName = this.partnerList!.filter(item1 => item1.id === partnerId).single()!.name;
      item.type = this.partnerList!.filter(item1 => item1.id === partnerId).single()!.isExport === true ? "수출용" : "내수용";
    }
    else {
      item.partnerName = undefined;
    }
    this._cdr.markForCheck();
  }


  public async shippingPlanGoodsSearchModalOpenButtonClick(item: IShippingPlanVM): Promise<void> {
    const result = await this._modal.show(GoodsSearchModal, "품목 검색", {isMulti: false});
    if (!result) return;

    if (item.goodId && item.goodId === result.id) {

    }
    else {
      item.shippingPlanItems = [];

      item.goodId = result.id;
      item.goodName = result.name;
      item.specification = result.specification;
      item.unitName = result.unitName;
    }
    this._cdr.markForCheck();
  }

  public async onChangeGood(goodId: number, item: IShippingPlanVM): Promise<void> {
    if (goodId) {
      await this._orm.connectAsync(MainDbContext, async db => {
        const result = await db.goods
          .where(item1 => [
            sorm.equal(item1.id, goodId)
          ])
          .select(item1 => ({
            id: item1.id,
            name: item1.name,
            specification: item1.specification,
            unitName: item1.unitName
          }))
          .singleAsync();

        item.shippingPlanItems = [];

        item.goodId = result!.id;
        item.goodName = result!.name;
        item.specification = result!.specification;
        item.unitName = result!.unitName;
      });
    }
    else {
      item.shippingPlanItems = [];

      item.goodId = undefined;
      item.goodName = undefined;
      item.specification = undefined;
      item.unitName = undefined;
    }
    this._cdr.markForCheck();
  }

  public async shippingPlanItemSearchModalOpenButtonClick(item: IShippingPlanItemVM): Promise<void> {
    const result = await this._modal.show(StockSearchModal, "재고 제품(LOT) 검색", {
      isMulti: false,
      goodId: this.selectedItem!.goodId
    });
    if (!result) return;

    if (this.selectedItem!.shippingPlanItems && this.selectedItem!.shippingPlanItems!.filter(item1 =>
      item1.lotName === result.lotName && item1.warehouseId === result.warehouseId).length < 1) {
      item.goodId = result.id;
      item.goodName = result.goodName;
      item.specification = result.specification;
      item.unitName = result.unitName;
      item.lotId = result.lotId;
      item.lotName = result.lotName;
      item.warehouseId = result.warehouseId;
      item.quantity = result.quantity;
      item.remark = undefined;
    }
    this._cdr.markForCheck();
  }

  public async onPredictionChange(selectedItem: IShippingPlanVM): Promise<void> {
    if (selectedItem.goodId) {
      const stockQuantity = await this._getStockInfo(selectedItem.goodId);
      selectedItem.predictionQuantity = stockQuantity - (selectedItem.planQuantity || 0);
    }

    selectedItem.productionQuantity = (selectedItem.planQuantity || 0) - (selectedItem.stockQuantity || 0);
    this._cdr.markForCheck();
  }

  public async _getStockInfo(goodId: number): Promise<number> {
    let result: any;
    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        result = await db.stock
          .where(item => [
            sorm.equal(item.goodsId, goodId)
          ])
          .select(item => ({
            quantity: sorm.sum(sorm.ifNull(item.quantity, 0))
          }))
          .singleAsync();
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }
    return result ? result.quantity : 0;
  }

  public async onChangePlanGoodQuantity(): Promise<void> {
    this.selectedItem!.stockQuantity = this.selectedItem!.shippingPlanItems!.sum(item1 => item1.quantity || 0);
    this.selectedItem!.productionQuantity = (this.selectedItem!.planQuantity || 0) - (this.selectedItem!.stockQuantity || 0);
    this._cdr.markForCheck();
  }

  public async onChangeWeek(item: IShippingPlanVM): Promise<void> {
    await this._orm.connectAsync(MainDbContext, async db => {
      const firstWeek = (await db.executeAsync([
        `SELECT CONVERT(varchar(10), (DATEADD(dd, @@DATEFIRST - DATEPART(dw, '${item.year}-${item.month}-01'), '${item.year}-${item.month}-01')), 121) AS endDay`
      ])).single();
      this.planDateList = [];

      if (firstWeek) {
        const lastDayOfMonth = new Date(item.year!, item.month!, 0).getDate();
        const day = String(firstWeek![0].endDay).split("-");
        this.planDateList.push({
          year: item.year!,
          month: item.month!,
          week: 1,
          startDate: 1,
          endDate: Number(day[2])
        });

        let firstDay = Number(day[2]) + 1;
        let lastDay = (firstDay + 6) > lastDayOfMonth ? lastDayOfMonth : firstDay + 6;

        for (let i = 2; i <= 6; i++) {
          this.planDateList.push({
            year: item.year!,
            month: item.month!,
            week: i,
            startDate: firstDay,
            endDate: lastDay
          });

          firstDay += 7;
          lastDay += 7;
        }
      }
    });

    const monthLastDay = new Date(item.year!, item.month!, 0).getDate();

    const startDay = this.planDateList.some(item1 => item1.week === item.week) ? this.planDateList.filter(item1 => item1.week === item.week).single()!.startDate : undefined;
    const endDate = this.planDateList.some(item1 => item1.week === item.week) ?
      this.planDateList.filter(item1 => item1.week === item.week).single()!.endDate > monthLastDay
        ? monthLastDay : this.planDateList.filter(item1 => item1.week === item.week).single()!.endDate : undefined;

    item.weekDays = [];
    for (let i = startDay!; i <= endDate!; i++) {
      item.weekDays.push({
        day: i
      });
    }

    item.day = item.weekDays.some(item1 => item1.day === item.day) ? item.day : item.weekDays[0].day;

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
          .join(
            ProductionInstruction,
            "productionInstructionInfo",
            (qb, en) => qb
              .where(item => [
                sorm.equal(item.shippingPlanId, en.id)
              ])
              .select(item => ({
                id: item.id
              })),
            true
          )
          .join(
            Stock,
            "stockInfo",
            (qb, en) => qb
              .where(item => [
                sorm.equal(item.goodsId, en.goodId)
              ])
              .select(item => ({
                quantity: sorm.sum(sorm.ifNull(item.quantity, 0))
              })),
            true
          )
          .join(
            GoodsIssue,
            "shippingInfo",
            (qb, en) => qb
              .include(item => item.goodsIssueGoods)
              .where(item => [
                sorm.equal(item.issuePlanId, en.id),
                sorm.equal(item.isDisabled, false),
                sorm.equal(item.goodsIssueGoods![0].isDisabled, false)
              ])
              .select(item => ({
                quantity: sorm.sum(sorm.ifNull(item.goodsIssueGoods![0].quantity, 0))
              })),
            true
          )
          .include(item => item.partner)
          .include(item => item.allocateType)
          .include(item => item.employee)
          .include(item => item.lastEmployee)
          .include(item => item.goods)
          .select(item => ({
            planType: item.planType,
            type: item.type,
            year: item.planYear,
            month: item.planMonth,
            day: item.planDay,
            week: item.week,
            partnerId: item.partnerId,
            partnerName: item.partner!.name,
            goodId: item.goodId,
            goodName: item.goods!.name,
            specification: item.goods!.specification,
            unitName: item.goods!.unitName,
            predictionQuantity: sorm.formula(sorm.ifNull(item.stockInfo!.quantity, 0), "-", item.planQuantity),
            planQuantity: item.planQuantity,
            stockQuantity: item.stockQuantity,
            productionQuantity: item.productionQuantity,
            realIssueQuantity: sorm.ifNull(item.shippingInfo!.quantity, undefined),
            allocateTypeId: item.allocateTypeId,
            allocateTypeName: item.allocateType!.name,
            createdAtDateTime: item.createdAtDateTime,
            createdByEmployeeId: item.createdByEmployeeId,
            createdByEmployeeName: item.employee!.name,
            isClosed: item.isClosed,
            isDisabled: item.isDisabled,
            isProductionInstruction: sorm.notNull(item.productionInstructionInfo!.id)
          }))
          .orderBy(item => item.year)
          .orderBy(item => item.month)
          .orderBy(item => item.week)
          .orderBy(item => item.day)
          .resultAsync();

        if (items && items.length > 2000) {
          throw new Error("검색 결과가 너무 많습니다.\n2000개 이하의 검색 결과만 excel로 저장할 수 있습니다.");
        }

        // for (const resultItem of result || []) {
        //   items.push({//tslint:object-literal-key-quotes: false
        //     "계획구분": resultItem.planType,
        //     "계획(년/월)": resultItem.year,
        //     주: resultItem.week,
        //     일: resultItem.day,
        //     구분: resultItem.type,
        //     거래처: resultItem.partnerName,
        //     제품: resultItem.goodName,
        //     규격: resultItem.specification,
        //     단위: resultItem.unitName,
        //     계획수량: resultItem.planQuantity,
        //     예상잔량: resultItem.predictionQuantity,
        //     재고출하: resultItem.stockQuantity,
        //     생산출하: resultItem.productionQuantity,
        //     "실 출하수량": resultItem.realIssueQuantity,
        //     배차정보: resultItem.allocateTypeName,
        //     종결여부: resultItem.isClosed ? "종결" : "미종결",
        //     등록일: resultItem.createdAtDateTime,
        //     등록자: resultItem.createdByEmployeeName
        //   });
        // }
      });

      const headerStyle = {
        alignH: "center",
        background: "FF673AB7",
        foreground: "FFFFFFFF",
        bold: true
      };

      const wb = ExcelWorkbook.create();
      const ws = wb.createWorksheet(`출하계획`);
      ws.cell(0, 0).value = "계획구분";
      ws.cell(0, 1).value = "계획(년/월)";
      ws.cell(0, 2).value = "주";
      ws.cell(0, 3).value = "일";
      ws.cell(0, 4).value = "구분";
      ws.cell(0, 5).value = "거래처";
      ws.cell(0, 6).value = "제품명";
      ws.cell(0, 7).value = "규격";
      ws.cell(0, 8).value = "단위";
      ws.cell(0, 9).value = "계획수량";
      ws.cell(0, 10).value = "예상잔량";
      ws.cell(0, 11).value = "재고출하";
      ws.cell(0, 12).value = "생산출하";
      ws.cell(0, 13).value = "실 출하수량";
      ws.cell(0, 14).value = "배차정보";
      ws.cell(0, 15).value = "종결여부";
      ws.cell(0, 16).value = "등록일";
      ws.cell(0, 17).value = "등록자";

      for (let i = 0; i <= 17; i++) {
        Object.assign(ws.cell(0, i).style, headerStyle);
      }

      for (let i = 0; i < items.length; i++) {
        const shippingItem = items[i];
        ws.cell(i + 1, 0).value = shippingItem.planType;
        ws.cell(i + 1, 1).value = shippingItem.year + " / " + shippingItem.month;
        ws.cell(i + 1, 2).value = shippingItem.week;
        ws.cell(i + 1, 3).value = shippingItem.day;
        ws.cell(i + 1, 4).value = shippingItem.type;
        ws.cell(i + 1, 5).value = shippingItem.partnerName;
        ws.cell(i + 1, 6).value = shippingItem.goodName;
        ws.cell(i + 1, 7).value = shippingItem.specification;
        ws.cell(i + 1, 8).value = shippingItem.unitName;
        ws.cell(i + 1, 9).value = shippingItem.planQuantity;
        ws.cell(i + 1, 10).value = shippingItem.predictionQuantity;
        ws.cell(i + 1, 11).value = shippingItem.stockQuantity;
        ws.cell(i + 1, 12).value = shippingItem.productionQuantity;
        ws.cell(i + 1, 13).value = shippingItem.realIssueQuantity;
        ws.cell(i + 1, 14).value = shippingItem.allocateTypeName;
        ws.cell(i + 1, 15).value = shippingItem.isClosed ? "종결" : "미종결";
        ws.cell(i + 1, 16).value = shippingItem.createdAtDateTime;
        ws.cell(i + 1, 17).value = shippingItem.createdByEmployeeName;
      }

      // wb.json = {"출하계획 정보": items};
      const title = (this.lastFilter!.year || "") + " 년 " + (this.lastFilter!.month || "") + " 월" + " 출하계획.xlsx";

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

    if (diffTargets.some(item => !item.goodId)) {
      this._toast.danger("출고제품은 반드시 선택해야 합니다.");
      return;
    }

    for (const diffTargetItem of diffTargets) {
      if (!diffTargetItem.year || !diffTargetItem.month) {
        this._toast.danger("년/월 은 반드시 입력해야 합니다.");
        return;
      }

      if (!diffTargetItem.stockQuantity && !diffTargetItem.productionQuantity) {
        this._toast.danger("재고출하/생산출하 중 최소 한 항목은 입력해야 합니다.");
        return;
      }

      if ((diffTargetItem.planQuantity || 0)
        !== ((diffTargetItem.stockQuantity || 0) + (diffTargetItem.productionQuantity || 0))) {
        if (!confirm("재고/생산출하 수량의 합이 계획수량과 일치 하지 않습니다.\n 진행하시겟습니까?")) return;

      }
    }

    this.viewBusyCount++;

    try {
      this._domValidator.validate(this._elRef!.nativeElement);

      Object.validatesArray(
        diffTargets,
        `출하계획`,
        {
          id: {displayName: "ID", type: Number},
          goodId: {displayName: "제품", notnull: true},
          partnerId: {displayName: "거래처", notnull: true},
          planQuantity: {displayName: "계획수량", notnull: true},
          isDisabled: {displayName: "사용중지", type: Boolean, notnull: true}
        }
      );

      await this._orm.connectAsync(MainDbContext, async db => {
        for (const diff of diffs) {
          // INSERT
          if (!diff.target!.id) {
            const newShippingPlan = await db.goodsIssuePlan
              .insertAsync({
                companyId: this._appData.authInfo!.companyId,
                planYear: diff.target!.year,
                planMonth: diff.target!.month,
                planDay: diff.target!.day,
                week: diff.target!.week,
                planDate: new DateOnly(diff.target!.year!, diff.target!.month!, diff.target!.day!),
                type: diff.target!.type,
                planType: diff.target!.planType,
                partnerId: diff.target!.partnerId!,
                goodId: diff.target!.goodId!,
                planQuantity: diff.target!.planQuantity!,
                stockQuantity: diff.target!.stockQuantity,
                productionQuantity: diff.target!.productionQuantity,
                realIssueQuantity: diff.target!.realIssueQuantity,
                allocateTypeId: diff.target!.allocateTypeId,
                createdByEmployeeId: this._appData.authInfo!.employeeId,
                createdAtDateTime: new DateTime(),
                isDisabled: diff.target!.isDisabled,
                isClosed: diff.target!.isClosed
              });
            diff.target!.id = newShippingPlan.id;
            diff.target!.createdByEmployeeName = this._appData.authInfo!.employeeName;
            diff.target!.createdAtDateTime = new DateTime();

            // 계획 수량 만큼 가용 재고 마이너스
            await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, diff.target!.planQuantity, "-");
            for (const shippingItem of diff.target!.shippingPlanItems || []) {
              const newGoodsIssuePlanItem = await db.goodsIssuePlanItem
                .insertAsync({
                  companyId: this._appData.authInfo!.companyId,
                  goodsIssuePlanId: diff.target!.id!,
                  goodsId: diff.target!.goodId!,
                  lotId: shippingItem.lotId,
                  warehouseId: shippingItem.warehouseId,
                  quantity: shippingItem.quantity!,
                  remark: shippingItem.remark,
                  createdAtDateTime: new DateTime(),
                  createdByEmployeeId: this._appData.authInfo!.employeeId,
                  isDisabled: shippingItem.isDisabled
                });
              shippingItem.id = newGoodsIssuePlanItem.id;
              shippingItem.createdByEmployeeId = this._appData.authInfo!.employeeId;
              shippingItem.createdAtDateTime = new DateTime();
            }
          }
          // UPDATE
          else {
            await db.goodsIssuePlan
              .where(item => [
                sorm.equal(item.id, diff.target!.id)
              ])
              .updateAsync(
                () => ({
                  planYear: diff.target!.year,
                  planMonth: diff.target!.month,
                  planDay: diff.target!.day,
                  week: diff.target!.week,
                  planDate: new DateOnly(diff.target!.year!, diff.target!.month!, diff.target!.day!),
                  planType: diff.target!.planType,
                  type: diff.target!.type,
                  planQuantity: diff.target!.planQuantity,
                  stockQuantity: diff.target!.stockQuantity,
                  productionQuantity: diff.target!.productionQuantity,
                  allocateTypeId: diff.target!.allocateTypeId,
                  isDisabled: diff.target!.isDisabled,
                  lastModifiedAtDateTime: new DateTime(),
                  lastModifiedEmployeeId: this._appData!.authInfo!.employeeId
                })
              );

            const targetDisable = diff.target!.isDisabled;
            const sourceDisable = diff.source!.isDisabled;

            // 취소 o -> 취소 x
            if (sourceDisable && !targetDisable) {
              await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, diff.source!.planQuantity, "-");
            }
            // 취소 x -> 취소 o
            else if (!sourceDisable && targetDisable) {
              await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, diff.source!.planQuantity, "+");
            }
            // 취소 x -> 취소 x
            else if (!sourceDisable && !targetDisable) {
              await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, diff.source!.planQuantity, "+");
              await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, diff.target!.planQuantity, "-");
            }

            for (const goodsIssuePlanItem of diff.target!.shippingPlanItems || []) {
              if (!goodsIssuePlanItem.id) {
                const newGoodsIssuePlanItme = await db.goodsIssuePlanItem
                  .insertAsync({
                    companyId: this._appData.authInfo!.companyId,
                    goodsIssuePlanId: diff.target!.id!,
                    goodsId: diff.target!.goodId!,
                    lotId: goodsIssuePlanItem.lotId,
                    warehouseId: goodsIssuePlanItem.warehouseId,
                    quantity: goodsIssuePlanItem.quantity!,
                    remark: goodsIssuePlanItem.remark,
                    createdAtDateTime: new DateTime(),
                    createdByEmployeeId: this._appData.authInfo!.employeeId,
                    isDisabled: goodsIssuePlanItem.isDisabled
                  });
                goodsIssuePlanItem.id = newGoodsIssuePlanItme.id;
                goodsIssuePlanItem.createdByEmployeeId = this._appData.authInfo!.employeeId;
                goodsIssuePlanItem.createdAtDateTime = new DateTime();
              }
              else {
                await db.goodsIssuePlanItem
                  .where(item => [
                    sorm.equal(item.id, diff.target!.id)
                  ])
                  .updateAsync(
                    () => ({
                      quantity: goodsIssuePlanItem.quantity,
                      remark: goodsIssuePlanItem.remark,
                      isDisabled: goodsIssuePlanItem.isDisabled
                    })
                  );
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

  private async _search(): Promise<void> {
    if (!this.lastFilter) return;

    this.mainBusyCount++;
    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        const queryable = this._getSearchQueryable(db);

        this.items = await queryable
          .orderBy(item => item.id)
          .limit(this.pagination.page * 50, 50)
          .wrap(GoodsIssuePlan)
          .join(
            ProductionInstruction,
            "productionInstructionInfo",
            (qb, en) => qb
              .where(item => [
                sorm.equal(item.shippingPlanId, en.id)
              ])
              .select(item => ({
                id: item.id
              })),
            true
          )
          .join(
            Stock,
            "stockInfo",
            (qb, en) => qb
              .where(item => [
                sorm.equal(item.goodsId, en.goodId)
              ])
              .select(item => ({
                quantity: sorm.sum(sorm.ifNull(item.quantity, 0))
              })),
            true
          )
          .join(
            GoodsIssue,
            "shippingInfo",
            (qb, en) => qb
              .include(item => item.goodsIssueGoods)
              .where(item => [
                sorm.equal(item.issuePlanId, en.id),
                sorm.equal(item.isDisabled, false),
                sorm.equal(item.goodsIssueGoods![0].isDisabled, false)
              ])
              .select(item => ({
                quantity: sorm.sum(sorm.ifNull(item.goodsIssueGoods![0].quantity, 0))
              })),
            true
          )
          .include(item => item.partner)
          .include(item => item.allocateType)
          .include(item => item.employee)
          .include(item => item.lastEmployee)
          .include(item => item.goods)
          .include(item => item.goodsIssuePlanItems)
          .include(item => item.goodsIssuePlanItems![0].lot)
          .include(item => item.goodsIssuePlanItems![0].goods)
          .select(item => ({
            id: item.id,
            planType: item.planType,
            type: item.type,
            year: item.planYear,
            month: item.planMonth,
            day: item.planDay,
            week: item.week,
            partnerId: item.partnerId,
            partnerName: item.partner!.name,
            goodId: item.goodId,
            goodName: item.goods!.name,
            specification: item.goods!.specification,
            unitName: item.goods!.unitName,
            predictionQuantity: sorm.formula(sorm.ifNull(item.stockInfo!.quantity, 0), "-", item.planQuantity),
            planQuantity: item.planQuantity,
            stockQuantity: item.stockQuantity,
            productionQuantity: item.productionQuantity,
            realIssueQuantity: sorm.ifNull(item.shippingInfo!.quantity, undefined),
            allocateTypeId: item.allocateTypeId,
            allocateTypeName: item.allocateType!.name,
            createdAtDateTime: item.createdAtDateTime,
            createdByEmployeeId: item.createdByEmployeeId,
            createdByEmployeeName: item.employee!.name,
            isClosed: item.isClosed,
            isDisabled: item.isDisabled,
            isProductionInstruction: sorm.notNull(item.productionInstructionInfo!.id),
            weekDays: undefined,

            shippingPlanItems: item.goodsIssuePlanItems && item.goodsIssuePlanItems.map(item1 => ({
              id: item1.id,
              goodId: item1.goodsId,
              goodName: item1.goods!.name,
              specification: item1.goods!.specification,
              unitName: item1.goods!.unitName,
              think: item1.lot!.thick,
              weight: item1.lot!.weight,
              lotId: item1.lotId,
              lotName: item1.lot!.lot,
              warehouseId: item1.warehouseId,
              quantity: item1.quantity,
              length: item1.lot!.length,
              remark: item1.remark,
              createdByEmployeeId: item1.createdByEmployeeId,
              createdAtDateTime: item1.createdAtDateTime,
              isDisabled: item1.isDisabled
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

  private _getSearchQueryable(db: MainDbContext): Queryable<GoodsIssuePlan> {
    let queryable = db.goodsIssuePlan
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);

    if (this.lastFilter!.year) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.planYear, this.lastFilter!.year)
        ]);
    }

    if (this.lastFilter!.month) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.planMonth, this.lastFilter!.month)
        ]);
    }

    if (this.lastFilter!.week) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.week, this.lastFilter!.week)
        ]);
    }

    if (this.lastFilter!.type) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.type, this.lastFilter!.type)
        ]);
    }

    if (this.lastFilter!.planType) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.planType, this.lastFilter!.planType)
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
        .include(item => item.goodsIssuePlanItems)
        .include(item => item.goodsIssuePlanItems![0].lot)
        .where(item => [
          sorm.includes(item.goodsIssuePlanItems![0].lot!.lot, this.lastFilter!.lot)
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

    if (!!this.lastFilter!.isDisabled) {
      queryable = queryable.where(item => [
        sorm.equal(item.isDisabled, false)
      ]);
    }

    return queryable;
  }
}

interface IFilterVM {
  year?: number;
  month?: number;
  week?: number;
  type?: "내수용" | "수출용";
  planType?: "확정" | "예상" | "추가";
  partnerId?: number;
  goodName?: string;
  specification?: string;
  lot?: string;
  partnerName?: string;
  isClosed: boolean;
  isDisabled: boolean;
}

interface IShippingPlanVM {
  id: number | undefined;
  planType: "확정" | "예상" | "추가" | undefined;
  type: "내수용" | "수출용";
  year: number | undefined;
  month: number | undefined;
  day: number | undefined;
  week: number | undefined;
  partnerId: number | undefined;
  partnerName: string | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  specification: string | undefined;
  unitName: string | undefined;
  predictionQuantity: number | undefined;
  planQuantity: number | undefined;
  stockQuantity: number | undefined;
  productionQuantity: number | undefined;
  realIssueQuantity: number | undefined;
  allocateTypeId: number | undefined;
  allocateTypeName: string | undefined;
  createdAtDateTime: DateTime | undefined;
  createdByEmployeeId: number | undefined;
  createdByEmployeeName: string | undefined;
  isClosed: boolean;
  isDisabled: boolean;
  isProductionInstruction: boolean;

  weekDays: IWeekDaysVM[] | undefined;
  shippingPlanItems: IShippingPlanItemVM[] | undefined;
}

interface IWeekDaysVM {
  day: number | undefined;
}

interface IShippingPlanItemVM {
  id: number | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  specification: string | undefined;
  unitName: string | undefined;
  lotId: number | undefined;
  lotName: string | undefined;
  warehouseId: number | undefined;
  quantity: number | undefined;
  think: number | undefined;
  length: number | undefined;
  weight: number | undefined;
  remark: string | undefined;
  createdByEmployeeId: number | undefined;
  createdAtDateTime: DateTime | undefined;
  isDisabled: boolean;
}

//TODO: 시간있으면 일자 바뀔 때 자동으로 주도 바뀌는 로직 추가