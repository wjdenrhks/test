import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnInit} from "@angular/core";
import {DateOnly, DateTime} from "@simplism/core";
import {PartnerSearchModal} from "../../modals/PartnerSearchModal";
import {
  SdDomValidatorProvider,
  SdFileDialogProvider,
  SdModalProvider,
  SdOrmProvider,
  SdToastProvider
} from "@simplism/angular";
import {GoodsSearchModal} from "../../modals/GoodsSearchModal";
import {
  AvailableStock,
  MainDbContext,
  ProductionItem,
  ProductionPlan,
  Stock
} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {AppDataProvider} from "@sample/client-common";
import {Queryable} from "@simplism/orm-client";
import {ExcelWorkbook} from "@simplism/excel";
import {ShowManualModal} from "../../modals/ShowManualModal";

@Component({
  selector: "app-production-plan",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>생산 계획 정보</h4>

          <sd-topbar-menu (click)="onAddItemButtonClick()">
            <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
            행 추가
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onSaveButtonClick()">
            <sd-icon [icon]="'save'" [fixedWidth]="true"></sd-icon>
            저장
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onUploadButtonClick()">
            <sd-icon [icon]="'upload'" [fixedWidth]="true"></sd-icon>
            업로드
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onDownloadButtonClick()">
            <sd-icon [icon]="'download'" [fixedWidth]="true"></sd-icon>
            BOM 다운로드
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onShowManualButtonClick()" style="float: right; padding-right: 25px;">
            <sd-icon [icon]="'atlas'" [fixedWidth]="true"></sd-icon>
            메뉴얼 보기
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onUploadExcelDownloadButtonClick()" style="float: right; padding-right: 25px;">
            <sd-icon [icon]="'download'" [fixedWidth]="true"></sd-icon>
            업로드 양식
          </sd-topbar-menu>
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
              <sd-form-item [label]="'거래처'">
                <app-partner-select [(value)]="filter.partnerId"></app-partner-select>
              </sd-form-item>
              <sd-form-item [label]="'제품명'">
                <app-good-name-select [(value)]="filter.goodName"></app-good-name-select>
              </sd-form-item>
              <sd-form-item [label]="'규격'">
                <app-goods-specification-select [(value)]="filter.specification"
                                                [goodName]="filter.goodName"></app-goods-specification-select>
              </sd-form-item>
              <sd-form-item>
                <sd-checkbox [(value)]="filter.isCanceled">취소제외</sd-checkbox>
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
              <sd-sheet #sheet [id]="'production-plan'"
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
                <sd-sheet-column [header]="'계획(년/월)'" [width]="110">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      <app-input-date [(year)]="item.year" [(month)]="item.month"
                                      (monthChange)="productionInfo(item)"
                                      (yearChange)="productionInfo(item)"></app-input-date>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'주'" [width]="60">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.week" (valueChange)="productionInfo(item)">
                      <sd-select-item *ngFor="let week of weekList; trackBy: trackByMeFn"
                                      [value]="week">
                        {{ week }}
                      </sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'거래처'">
                  <ng-template #item let-item="item">
                    <app-partner-select [(value)]="item.partnerId" (valueChange)="onChangePartner($event, item)"
                                        [required]="true" *ngIf="!item.id"></app-partner-select>
                    <div class="sd-padding-xs-sm" *ngIf="!!item.id">
                      {{ item.partnerName }}
                      <!--<a (click)="partnerSearchModalOpenButtonClick(item)"
                         [attr.sd-invalid]="!item.partnerId">
                        <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                      </a>-->
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'제품명'">
                  <ng-template #item let-item="item">
                    <app-good-select [(value)]="item.goodId" (valueChange)="onChangeGood($event, item)"
                                     [isProduct]="true" [required]="true" *ngIf="!item.id">
                    </app-good-select>
                    <div class="sd-padding-xs-sm" *ngIf="!!item.id">
                      {{ item.goodName }}
                      <!--  <a (click)="productionPlanGoodsSearchModalOpenButtonClick(item)"
                           [attr.sd-invalid]="!item.goodId">
                          <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                        </a>-->
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
                <sd-sheet-column [header]="'계획수량'">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.planQuantity"
                                  [required]="true"
                                  [type]="'number'"
                                  (valueChange)="onChangeBomQuantity(item)"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'실 생산수량'" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right;">
                      {{ item.realProductionQuantity | number }}
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
                <sd-sheet-column [header]="'취소'" [width]="60">
                  <ng-template #item let-item="item">
                    <div style="text-align: center;">
                      <sd-checkbox [(value)]="item.isCanceled" [disabled]="!item.id"></sd-checkbox>
                    </div>
                  </ng-template>
                </sd-sheet-column>
              </sd-sheet>

              <sd-dock [position]="'bottom'" style="height: 40%" *ngIf="selectedItem"
                       [id]="'production-plan-list'">
                <sd-busy-container [busy]="selectedItemBusyCount > 0">
                  <sd-dock-container class="sd-background-default">
                    <sd-dock class="sd-padding-xs-sm">
                      <h5 style="display: inline-block; padding-right: 1.4em;">생산계획 품목 BOM</h5>
                      <a (click)="onSelectedItemChanged(selectedItem)">
                        <sd-icon [icon]="'sync-alt'" [fixedWidth]="true"></sd-icon>
                        새로고침
                      </a>
                    </sd-dock>

                    <sd-pane>
                      <sd-sheet [id]="'production-plan-list'"
                                [items]="selectedItem.productionBomList"
                                [trackBy]="trackByIdFn">
                        <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              <span *ngIf="item.id">{{ item.id }}</span>
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
                        <sd-sheet-column [header]="'재고량'">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: right;">
                              {{ item.stockQuantity | number }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'예상소요량'">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: right;">
                              {{ item.requirementQuantity | number }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'적정재고'">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: right;">
                              {{ item.adequateStock | number }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'과부족(현)'">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: right;">
                              {{ item.currentExcessiveQuantity | number }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'과부족(적정재고)'">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: right;">
                              {{ item.adequateExcessiveQuantity | number }}
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
    </sd-busy-container>`
})
export class ProductionPlanPage implements OnInit {

  public filter: IFilterVM = {
    year: undefined,
    month: undefined,
    week: undefined,
    goodId: undefined,
    partnerId: undefined,
    partnerName: undefined,
    goodName: undefined,
    specification: undefined,
    isCanceled: false
  };

  public lastFilter?: IFilterVM;

  public pagination = {page: 0, length: 0};


  public items: IProductionPlanVM[] = [];
  public orgItems: IProductionPlanVM[] = [];

  public selectedItem?: IProductionPlanVM;

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public selectedItemBusyCount = 0;

  public partnerList: {
    id: number;
    name: string;
    erpSync: number;
    isDisabled: boolean;
  }[] = [];

  public planDateList: {
    year: number;
    month: number;
    week: number;
    startDate: number;
    endDate: number;
    planDate: DateOnly;
  }[] = [];

  public yearList = [] as number[];
  public monthList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  public weekList = [1, 2, 3, 4, 5];

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public constructor(private readonly _cdr: ChangeDetectorRef,
                     private readonly _orm: SdOrmProvider,
                     private readonly _fileDialog: SdFileDialogProvider,
                     private readonly _appData: AppDataProvider,
                     private readonly _domValidator: SdDomValidatorProvider,
                     private readonly _elRef: ElementRef<HTMLElement>,
                     private readonly _toast: SdToastProvider,
                     private readonly _modal: SdModalProvider) {

  }

  public async ngOnInit(): Promise<void> {
    this.filter.year = new DateOnly().year;
    this.filter.month = new DateOnly().month;

    for (let i = 2018; i <= this.filter.year + 1; i++) {
      this.yearList.push(i);
    }

    this.mainBusyCount++;
    await this._orm.connectAsync(MainDbContext, async db => {
      this.partnerList = await db.partner
        .where(item => [
          sorm.equal(item.companyId, this._appData.authInfo!.companyId),
          sorm.equal(item.isDisabled, false)
        ])
        .select(item => ({
          id: item.id!,
          name: item.name,
          erpSync: item.erpSyncCode,
          isDisabled: item.isDisabled
        }))
        .resultAsync();
    });

    await this.onSearchFormSubmit();

    this.mainBusyCount--;
    this._cdr.markForCheck();
  }

  public async onShowManualButtonClick(): Promise<void> {
    const result = await this._modal.show(ShowManualModal, "생산 계획 메뉴얼", {type: "production-plan"});
    if (!result) return;

    this._cdr.markForCheck();
  }

  public onAddItemButtonClick(): void {
    this.items.insert(0, {
      id: undefined,
      year: new DateOnly().year,
      month: new DateOnly().month,
      week: 1,
      partnerId: undefined,
      partnerName: undefined,
      goodId: undefined,
      goodName: undefined,
      specification: undefined,
      planQuantity: undefined,
      remark: undefined,
      realProductionQuantity: undefined,
      createdByEmployeeId: undefined,
      createdByEmployeeName: undefined,
      createdAtDateTime: undefined,
      isCanceled: false,
      productionBomList: undefined
    });
  }

  public onRemoveItemButtonClick(item: IProductionPlanVM): void {
    this.items.remove(item);

    if (this.selectedItem === item) {
      this.selectedItem = undefined;
    }
  }


  public async partnerSearchModalOpenButtonClick(item: IProductionPlanVM): Promise<void> {
    const result = await this._modal.show(PartnerSearchModal, "거래처 검색", {isMulti: false});
    if (!result) return;

    item.partnerId = result.id;
    item.partnerName = result.name;

    this._cdr.markForCheck();
  }

  public async onChangePartner(partnerId: number, item: IProductionPlanVM): Promise<void> {
    if (partnerId) {
      item.partnerName = this.partnerList!.filter(item1 => item1.id === partnerId).single()!.name;
    }
    else {
      item.partnerId = undefined;
      item.partnerName = undefined;
    }
    this._cdr.markForCheck();
  }

  public async productionPlanGoodsSearchModalOpenButtonClick(item: IProductionPlanVM): Promise<void> {
    const result = await this._modal.show(GoodsSearchModal, "품목 검색", {isMulti: false});
    if (!result) return;

    item.goodId = result.id;
    item.goodName = result.name;
    item.specification = result.specification;

    await this.productionInfo(item);
    await this._selectItem(item);
    this._cdr.markForCheck();
  }

  public async onChangeGood(goodId: number, item: IProductionPlanVM): Promise<void> {
    if (goodId) {
      await this._orm.connectAsync(MainDbContext, async db => {
        const result = await db.goods
          .where(item1 => [
            sorm.equal(item1.id, goodId)
          ])
          .select(item1 => ({
            name: item1.name,
            specification: item1.specification
          }))
          .singleAsync();

        item.goodName = result ? result.name : undefined;
        item.specification = result ? result.specification : undefined;

        await this.productionInfo(item);
        await this._selectItem(item);
      });
    }
    else {
      item.goodId = undefined;
      item.goodName = undefined;
      item.specification = undefined;
    }
    this._cdr.markForCheck();
  }

  public async onSelectedItemChanged(item: IProductionPlanVM): Promise<void> {
    await this._selectItem(item);
    this._cdr.markForCheck();
  }

  // 게획수량 변경에 따른 bom 소요 값 변경
  public async onChangeBomQuantity(item: IProductionPlanVM): Promise<void> {
    for (const bomItem of item.productionBomList || []) {
      bomItem.requirementQuantity = (item.planQuantity || 0) * (bomItem.goodBuildQuantity || 0);
      bomItem.currentExcessiveQuantity = (bomItem.stockQuantity || 0) - (bomItem.requirementQuantity || 0);
      bomItem.adequateExcessiveQuantity = (bomItem.stockQuantity || 0) - (bomItem.adequateStock || 0) - (bomItem.requirementQuantity || 0);
    }
    this._cdr.markForCheck();
  }

  private async _selectItem(selectedItem: IProductionPlanVM): Promise<void> {

    if (selectedItem && !selectedItem.id && !!selectedItem.goodId) {
      this.selectedItem = selectedItem;

      this.selectedItem!.productionBomList = [];

      this.selectedItemBusyCount++;

      const result = await this._getBuildGoodInfo(this.selectedItem!.goodId!);

      if (result && result.length > 0) {
        for (const goodBuildGoodItem of result) {
          this.selectedItem!.productionBomList!.insert(0, {
            id: goodBuildGoodItem.id,
            seq: goodBuildGoodItem.seq,
            goodId: goodBuildGoodItem.goodId,
            goodName: goodBuildGoodItem.goodName,
            specification: goodBuildGoodItem.specification,
            goodBuildQuantity: goodBuildGoodItem.weight,
            stockQuantity: goodBuildGoodItem.stockQuantity,
            salesQuantity: undefined,
            requirementQuantity: undefined,
            adequateStock: goodBuildGoodItem.adequateStock,
            currentExcessiveQuantity: goodBuildGoodItem.currentExcessiveQuantity,
            adequateExcessiveQuantity: goodBuildGoodItem.adequateExcessiveQuantity
          });
        }
      }

      this.selectedItem!.productionBomList = this.selectedItem!.productionBomList!.orderBy(item => item.seq);

      await this.onChangeBomQuantity(selectedItem);
      this.selectedItemBusyCount--;

      this._cdr.markForCheck();
    }
  }

  public async productionInfo(selected: IProductionPlanVM): Promise<void> {
    await this._orm.connectAsync(MainDbContext, async db => {

      selected.realProductionQuantity = undefined;
      if (selected.year && selected.month && selected.week && selected.goodId) {
        const lastDay = new Date(selected.year, selected.month, 0).getDate();

        const formDate = new DateOnly(selected.year, selected.month, 1);
        const toDate = new DateOnly(selected.year, selected.month, lastDay);

        const result = await db.productionItem
          .where(item => [
            sorm.equal(item.goodId, selected.goodId),
            sorm.between(sorm.cast(item.createdAtDateTime, DateOnly), formDate, toDate),
            sorm.query(`(DATEDIFF(week, DATEADD(MONTH, DATEDIFF(MONTH, 0, convert(varchar(10), [TBL].[createdAtDateTime], 120)), 0), 
convert(varchar(10), [TBL].[createdAtDateTime], 120)) + 1)  = ${selected.week}`, Boolean)!
          ])
          .groupBy(() => [
            sorm.query("DATEDIFF(week, DATEADD(MONTH, DATEDIFF(MONTH, 0, convert(varchar(10), [TBL].[createdAtDateTime], 120)), 0),\n" +
              "                convert(varchar(10), [TBL].[createdAtDateTime], 120)) + 1", Number)
          ])
          .select(item => ({
            week: sorm.query("DATEDIFF(week, DATEADD(MONTH, DATEDIFF(MONTH, 0, convert(varchar(10), [TBL].[createdAtDateTime], 120)), 0),\n" +
              "                convert(varchar(10), [TBL].[createdAtDateTime], 120)) + 1", Number),
            quantity: sorm.count(item.id)
          }))
          .resultAsync();

        if (result && result.some((item: { week: number | undefined }) => item.week === selected.week)) {
          selected.realProductionQuantity = result.filter((item: { week: number | undefined }) => item.week === selected.week).single()!.quantity;
        }
      }

      this._cdr.markForCheck();
    });
  }

  public async _getBuildGoodInfo(goodId: number): Promise<any[]> {
    let result: any[] = [];
    await this._orm.connectAsync(MainDbContext, async db => {
      const seq = await db.goodsBuildList
        .where(item => [
          sorm.equal(item.isDisabled, false),
          sorm.equal(item.goodId, goodId)
        ])
        .orderBy(item => item.id)
        .limit(0, 1)
        .select(item => ({
          id: item.id
        }))
        .singleAsync();

      if (seq) {
        result = await db.goodsBuildGoods
          .include(item => item.goods)
          .include(item => item.bomList)
          .where(item => [
            sorm.equal(item.bomList!.goodId, goodId),
            sorm.equal(item.bomListId, seq.id)
          ])
          .join(
            Stock,
            "stockInfo",
            (qb, en) => qb
              .where(item => [
                sorm.equal(item.goodsId, en.goodsId)
              ])
              .select(item => ({
                quantity: sorm.sum(sorm.ifNull(item.quantity, 0))
              })),
            true
          )
          .join(
            AvailableStock,
            "availableStockInfo",
            (qb, en) => qb
              .where(item => [
                sorm.equal(item.goodId, en.goodsId)
              ])
              .select(item => ({
                quantity: sorm.sum(sorm.ifNull(item.quantity, 0))
              })),
            true
          )
          .groupBy(item => [
            item.goodsId,
            item.id,
            item.goods!.name,
            item.goods!.specification,
            item.goods!.adequateStock,
            item.stockInfo!.quantity,
            item.availableStockInfo!.quantity
          ])
          .select(item => ({
            id: item.id,
            seq: sorm.query("ROW_NUMBER() OVER (ORDER BY [TBL].goodsId ASC)", Number),
            goodId: item.goodsId,
            goodName: item.goods!.name,
            specification: item.goods!.specification,
            stockQuantity: sorm.ifNull(item.stockInfo!.quantity, 0),
            availableStockQuantity: sorm.ifNull(item.availableStockInfo!.quantity, 0),
            adequateStock: item.goods!.adequateStock,
            weight: sorm.formula(sorm.sum(sorm.ifNull(item.weight, 0)), "*", 0.001)
          }))
          .orderBy(item => item.seq)
          .resultAsync();
      }

    });

    for (const goodItem of result) {
      goodItem.currentExcessiveQuantity = (goodItem.stockQuantity || 0) - (goodItem.requirementQuantity || 0);
      goodItem.adequateExcessiveQuantity = (goodItem.stockQuantity || 0) - (goodItem.adequateStock || 0) - (goodItem.requirementQuantity || 0);
    }

    return result;
  }

  /*  // 주(week)기준 추천 생산일자 구하기
    private async _productionPlanCalculation(year: number, month: number, week: number): Promise<void> {
      try {
        await this._orm.connectAsync(MainDbContext, async db => {

          const firstWeek = (await db.executeAsync([
            `SELECT CONVERT(varchar(10), (DATEADD(dd, @@DATEFIRST - DATEPART(dw, '${year}-${month}-01'), '${year}-${month}-01')), 121) AS endDay`
          ])).single();
          this.planDateList = [];

          const day = String(firstWeek![0].endDay).split("-");
          this.planDateList.push({
            year,
            month,
            week,
            startDate: 1,
            endDate: Number(day[2]),
            planDate: await this._getPlanDate(year, month, 1, 1, db)
          });

          let firstDay = Number(day[2]) + 1;
          let lastDay = firstDay + 6;

          for (let i = 2; i <= 5; i++) {
            this.planDateList.push({
              year,
              month,
              week: i,
              startDate: firstDay,
              endDate: lastDay,
              planDate: await this._getPlanDate(year, month, firstDay, 1, db)
            });

            firstDay += 7;
            lastDay += 7;
          }
        });
      }
      catch (err) {
        this._toast.danger(err.message);
        if (process.env.NODE_ENV !== "production") console.error(err);
      }
    }*/

  public async onUploadExcelDownloadButtonClick(): Promise<void> {
    /*
    // 다운로드 방식으로 하려면 이렇게
    const test = require("../../assets/upload_productoinPlan.xlsx");

     const link = document.createElement("a");
     link.href = test;
     link.download = "생산계획 업로드 양식";
     link.click();
 */
    const sheetName = "판매계획";
    const defaultStyle = {
      borderWidth: "thin",
      borderColor: "FF000000"
    };

    const headerStyle = {
      ...defaultStyle,
      alignH: "center",
      background: "FF1976D2",
      foreground: "FFFFFFFF",
      bold: true
    };

    const wb = ExcelWorkbook.create();
    const ws = wb.createWorksheet(sheetName);

    ws.cell(0, 3).value = 2019;
    ws.cell(0, 4).value = "년";
    ws.cell(0, 5).value = 5;
    ws.cell(0, 6).value = "월";
    ws.cell(0, 8).value = "판매계획";

    ws.cell(1, 0).value = "주";
    ws.cell(1, 1).value = "매출처";
    ws.cell(1, 2).value = "제품명";
    ws.cell(1, 3).value = "규격";
    ws.cell(1, 4).value = "두께";
    ws.cell(1, 5).value = "길이";
    ws.cell(1, 6).value = "단가";
    ws.cell(1, 7).value = "단위";
    ws.cell(1, 8).value = "비고";

    for (let i = 0; i <= 8; i++) {
      Object.assign(ws.cell(1, i).style, headerStyle);
    }

    ws.cell(2, 0).value = 1;
    ws.cell(2, 1).value = "(주) 경풍수지";
    ws.cell(2, 2).value = "3030 VQ(반)";
    ws.cell(2, 3).value = 1560;
    ws.cell(2, 4).value = 35;
    ws.cell(2, 5).value = 3000;
    ws.cell(2, 6).value = 500;
    ws.cell(2, 7).value = "M";
    ws.cell(2, 8).value = "TEST";

    ws.column(0).width = 10;
    ws.column(1).width = 25;
    ws.column(2).width = 20;
    ws.column(3).width = 15;
    ws.column(4).width = 15;
    ws.column(5).width = 15;
    ws.column(6).width = 15;
    ws.column(7).width = 15;
    ws.column(8).width = 45;

    await wb.downloadAsync("생산계획 업로드 양식.xlsx");
  }

  public async onDownloadButtonClick(): Promise<void> {
    await this._download();
    this._cdr.markForCheck();
  }

  private async _download(): Promise<void> {
    //TODO: 다운로드 개발 마저 해야함*
    this.viewBusyCount++;
    try {
      const items: any[] = [];
      await this._orm.connectAsync(MainDbContext, async db => {

        const queryable = this._getSearchQueryable(db);

        //생산계획 항목의 자재명과 예상소요량을 가지고 와서 group by를 해줘?

        const result = await queryable
          .wrap(ProductionPlan)
          .include(item => item.partner)
          .include(item => item.employee)
          .include(item => item.goods)
          .include(item => item.items)
          .include(item => item.items![0].goodsBuildGoods)
          .include(item => item.items![0].goodsBuildGoods!.goods)
          .join(
            ProductionItem,
            "productionInfo",
            (qb, en) => qb
              .where(item => [
                sorm.equal(item.goodId, en.goodsId),
                sorm.query(`(DATEDIFF(week, DATEADD(MONTH, DATEDIFF(MONTH, 0, convert(varchar(10), [productionInfo].[createdAtDateTime], 120)), 0), 
            convert(varchar(10), [productionInfo].[createdAtDateTime], 120)) + 1)  = [TBL].[week]`, Boolean)!
              ])
              .groupBy(() => [
                sorm.query("DATEDIFF(week, DATEADD(MONTH, DATEDIFF(MONTH, 0, convert(varchar(10), [productionInfo].[createdAtDateTime], 120)), 0),\n" +
                  "                convert(varchar(10), [productionInfo].[createdAtDateTime], 120)) + 1", Number)
              ])
              .select(item => ({
                week: sorm.query("DATEDIFF(week, DATEADD(MONTH, DATEDIFF(MONTH, 0, convert(varchar(10), [productionInfo].[createdAtDateTime], 120)), 0),\n" +
                  "                convert(varchar(10), [productionInfo].[createdAtDateTime], 120)) + 1", Number),
                quantity: sorm.count(item.id)
              })),
            true
          )
          .select(item => ({
            id: item.id,
            year: item.year,
            month: item.month,
            week: item.week,
            partnerId: item.partnerId,
            partnerName: item.partner!.name,
            goodId: item.goodsId,
            goodName: item.goods!.name,
            remark: item.remark,
            specification: item.goods!.specification,
            planQuantity: item.quantity,
            realProductionQuantity: sorm.ifNull(item.productionInfo!.quantity, 0),
            createdByEmployeeId: item.createdByEmployeeId,
            createdByEmployeeName: item.employee!.name,
            createdAtDateTime: item.createdAtDateTime,
            isCanceled: item.isDisabled,

            productionBomList: item.items && item.items.map(item1 => ({
              id: item1.id,
              seq: item1.goodsBuildGoods!.typeSeq,
              goodId: item1.goodsBuildGoods!.goodsId,
              goodName: item1.goodsBuildGoods!.goods!.name,
              goodBuildQuantity: sorm.formula(item1.goodsBuildGoods!.weight, "*", 0.001),
              specification: item1.goodsBuildGoods!.goods!.specification,
              stockQuantity: item1.stockQuantity,
              salesQuantity: item1.salesQuantity,
              requirementQuantity: item1.requirementQuantity,
              adequateStock: item1.adequateStock,
              currentExcessiveQuantity: item1.currentExcessiveQuantity,
              adequateExcessiveQuantity: item1.adequateExcessiveQuantity
            })) || undefined
          }))
          .resultAsync();
        result.orderBy(item => item.id);

        for (const resultItem of result || []) {
          for (const productionBomItem of resultItem.productionBomList || []) {
            items.push({
              "계획(년)": resultItem.year,
              "월": resultItem.month,
              "주": resultItem.week,
              "계획제품": resultItem.goodName,
              "계획제품.규격": resultItem.specification,
              "자재명": productionBomItem.goodName,
              "자재규격": productionBomItem.specification,
              "재고량": productionBomItem.stockQuantity,
              "예상소요량": productionBomItem.requirementQuantity,
              "적정재고": productionBomItem.adequateStock,
              "과부족(현)": productionBomItem.currentExcessiveQuantity,
              "과부족(적정재고)": productionBomItem.adequateExcessiveQuantity
            });
          }
        }
      });

      const wb = ExcelWorkbook.create();
      wb.json = {"생산계획 BOM 정보": items};
      await wb.downloadAsync("생산계획 BOM 정보.xlsx");
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

  public async onUploadButtonClick(): Promise<void> {
    await this._upload();
    this._cdr.markForCheck();
  }

  private async _upload(): Promise<void> {
    const file = await this._fileDialog.showAsync();
    if (!file) return;

    this.viewBusyCount++;
    this._cdr.markForCheck();

    try {
      const wb = await ExcelWorkbook.loadAsync(file);

      const result: any[] = [];

      // 판매계획 양식을 사용할 경우
      const ws = wb.getWorksheet("판매계획");
      const planYear = ws.cell(0, 3).value;
      const planMonth = ws.cell(0, 5).value;

      for (let r = 2; r < ws.rowLength; r++) {
        for (let i = 0; i < 9; i++) {
          if (i === 0 || i === 1 || i === 2 || i === 3 || i === 5) {
            if (!ws.cell(r, i).value) {
              throw new Error("Excel " + (r + 1) + "행의 " + (i + 1) + "열 정보가 비어 있습니다. \n확인 후 다시 진행 해 주세요.");
            }
          }
        }

        const planWeek: number = ws.cell(r, 0).value; // 주
        const partnerName: string = ws.cell(r, 1).value; // 매출처
        const partnerId = await this._gerPartnerInfo(partnerName);
        if (!partnerId) {
          throw new Error(partnerName + ": 이름을 가진 거래처 정보가 존재하지 않습니다");
        }

        const goodName: string = ws.cell(r, 2).value;
        const specification: string = ws.cell(r, 3).value;
        const goodId = await this._getGoodInfo(goodName, specification);
        if (!goodId) {
          throw new Error("품목명: " + goodName + "/ 규격: " + specification + " 을/를 가진 품목 정보가 존재하지 않습니다");
        }

        const thick = ws.cell(r, 4).value;
        const length: number = ws.cell(r, 5).value;
        const unitPrice: number = ws.cell(r, 6).value;
        const unit = ws.cell(r, 7).value;
        const remark = ws.cell(r, 8).value;

        result.push({
          goodId,
          goodName,
          specification,
          planYear,
          planMonth,
          planWeek,
          partnerId,
          partnerName,
          length,
          unit,
          thick,
          unitPrice,
          remark
        });
      }

      for (const diffTarget of result) {
        this.items.insert(0, {
          id: undefined,
          year: diffTarget.planYear,
          month: diffTarget.planMonth,
          week: diffTarget.planWeek,
          partnerId: diffTarget.partnerId!,
          partnerName: diffTarget.partnerName,
          goodId: diffTarget.goodId,
          goodName: diffTarget.goodName,
          specification: diffTarget.specification,
          planQuantity: diffTarget.length!,
          remark: diffTarget.remark,
          realProductionQuantity: undefined,
          createdByEmployeeId: undefined,
          createdByEmployeeName: undefined,
          createdAtDateTime: undefined,
          isCanceled: false,

          productionBomList: undefined
        });
      }


      /*   await this._orm.connectAsync(MainDbContext, async db => {
           for (const diffTarget of result) {
             await db.productionPlan
               .insertAsync({
                 companyId: this._appData.authInfo!.companyId,
                 goodsId: diffTarget.goodId!,
                 thick: diffTarget.thick!,
                 year: diffTarget.planYear,
                 month: diffTarget.planMonth,
                 week: diffTarget.planWeek,
                 partnerId: diffTarget.partnerId!,
                 quantity: diffTarget.length!,
                 unitPrice: diffTarget.unitPrice,
                 remark: diffTarget.remark,
                 createdAtDateTime: new DateTime(),
                 createdByEmployeeId: this._appData.authInfo!.employeeId,
                 isDisabled: false
               });
           }
         });*/

      this._toast.success("업로드 되었습니다.");
      this._cdr.markForCheck();
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }
    this.viewBusyCount--;
    this._cdr.markForCheck();
  }

  public async _gerPartnerInfo(partnerName: string): Promise<number | undefined> {
    let partnerInfo: any | undefined;
    await this._orm.connectAsync(MainDbContext, async db => {
      partnerInfo = await db.partner
        .where(item => [
          sorm.equal(item.isDisabled, false),
          sorm.equal(item.name, partnerName)
        ])
        .orderBy(item => item.id)
        .limit(0, 1)
        .select(item => ({
          id: item.id
        }))
        .singleAsync();
    });

    return partnerInfo ? partnerInfo.id : undefined;
  }

  public async _getGoodInfo(goodName: string, specification: any): Promise<number | undefined> {
    let goodInfo: any | undefined;
    await this._orm.connectAsync(MainDbContext, async db => {
      goodInfo = await db.goods
        .where(item => [
          sorm.equal(item.isDisabled, false),
          sorm.equal(item.name, goodName),
          sorm.equal(item.specification, specification)
        ])
        .orderBy(item => item.id)
        .limit(0, 1)
        .select(item => ({
          id: item.id
        }))
        .singleAsync();
    });

    return goodInfo ? goodInfo.id : undefined;
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
        `생산 계획 정보`,
        {
          id: {displayName: "ID", type: Number},
          year: {displayName: "게획(년)", type: Number, notnull: true},
          month: {displayName: "게획(월)", type: Number, notnull: true},
          week: {displayName: "주", type: Number, notnull: true},
          partnerId: {displayName: "거래처", notnull: true},
          goodId: {displayName: "제품명", notnull: true},
          planQuantity: {displayName: "계획수량", notnull: true}
        }
      );

      await this._orm.connectAsync(MainDbContext, async db => {
        for (const diffItem of diffTargets) {
          //INSERT
          if (!diffItem.id) {
            const newProductionPlan = await db.productionPlan
              .insertAsync({
                companyId: this._appData.authInfo!.companyId,
                goodsId: diffItem.goodId!,
                year: diffItem.year,
                month: diffItem.month,
                week: diffItem.week,
                partnerId: diffItem.partnerId!,
                quantity: diffItem.planQuantity!,
                createdAtDateTime: new DateTime(),
                createdByEmployeeId: this._appData.authInfo!.employeeId,
                isDisabled: false
              });
            diffItem.id = newProductionPlan.id;
            diffItem.createdByEmployeeName = this._appData.authInfo!.employeeName;
            diffItem.createdAtDateTime = new DateTime();

            for (const productionPlanItem of diffItem.productionBomList || []) {
              await db.productionPlanItem
                .insertAsync({
                  companyId: this._appData.authInfo!.companyId,
                  productionPlanId: diffItem.id!,
                  goodsBuildGoodsId: Number(productionPlanItem.id!),
                  stockQuantity: productionPlanItem.stockQuantity,
                  salesQuantity: productionPlanItem.salesQuantity,
                  requirementQuantity: productionPlanItem.requirementQuantity,
                  adequateStock: productionPlanItem.adequateStock,
                  currentExcessiveQuantity: productionPlanItem.currentExcessiveQuantity,
                  adequateExcessiveQuantity: productionPlanItem.adequateExcessiveQuantity,
                  createdAtDateTime: new DateTime(),
                  createdByEmployeeId: this._appData.authInfo!.employeeId
                });
            }
          }
          //UPDATE
          {
            await db.productionPlan
              .where(item => [
                sorm.equal(item.id, diffItem.id)
              ])
              .updateAsync(
                () => ({
                  year: diffItem.year,
                  month: diffItem.month,
                  week: diffItem.week,
                  quantity: diffItem.planQuantity,
                  isDisabled: diffItem.isCanceled
                })
              );

            for (const productionPlanItem of diffItem.productionBomList || []) {
              await db.productionPlanItem
                .where(item => [
                  sorm.equal(item.id, productionPlanItem.id)
                ])
                .updateAsync(
                  () => ({
                    stockQuantity: productionPlanItem.stockQuantity,
                    salesQuantity: productionPlanItem.salesQuantity,
                    requirementQuantity: productionPlanItem.requirementQuantity,
                    adequateStock: productionPlanItem.adequateStock,
                    currentExcessiveQuantity: productionPlanItem.currentExcessiveQuantity,
                    adequateExcessiveQuantity: productionPlanItem.adequateExcessiveQuantity
                  })
                );
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
          .wrap(ProductionPlan)
          .include(item => item.partner)
          .include(item => item.employee)
          .include(item => item.goods)
          .include(item => item.items)
          .include(item => item.items![0].goodsBuildGoods)
          .include(item => item.items![0].goodsBuildGoods!.goods)
          .join(
            ProductionItem,
            "productionInfo",
            (qb, en) => qb
              .where(item => [
                sorm.equal(item.goodId, en.goodsId),
                sorm.query(`(DATEDIFF(week, DATEADD(MONTH, DATEDIFF(MONTH, 0, convert(varchar(10), [productionInfo].[createdAtDateTime], 120)), 0), 
            convert(varchar(10), [productionInfo].[createdAtDateTime], 120)) + 1)  = [TBL].[week]`, Boolean)!
              ])
              .groupBy(() => [
                sorm.query("DATEDIFF(week, DATEADD(MONTH, DATEDIFF(MONTH, 0, convert(varchar(10), [productionInfo].[createdAtDateTime], 120)), 0),\n" +
                  "                convert(varchar(10), [productionInfo].[createdAtDateTime], 120)) + 1", Number)
              ])
              .select(item => ({
                week: sorm.query("DATEDIFF(week, DATEADD(MONTH, DATEDIFF(MONTH, 0, convert(varchar(10), [productionInfo].[createdAtDateTime], 120)), 0),\n" +
                  "                convert(varchar(10), [productionInfo].[createdAtDateTime], 120)) + 1", Number),
                quantity: sorm.count(item.id)
              })),
            true
          )
          .select(item => ({
            id: item.id,
            year: item.year,
            month: item.month,
            week: item.week,
            partnerId: item.partnerId,
            partnerName: item.partner!.name,
            goodId: item.goodsId,
            goodName: item.goods!.name,
            remark: item.remark,
            specification: item.goods!.specification,
            planQuantity: item.quantity,
            realProductionQuantity: sorm.ifNull(item.productionInfo!.quantity, 0),
            createdByEmployeeId: item.createdByEmployeeId,
            createdByEmployeeName: item.employee!.name,
            createdAtDateTime: item.createdAtDateTime,
            isCanceled: item.isDisabled,

            productionBomList: item.items && item.items.map(item1 => ({
              id: item1.id,
              seq: item1.goodsBuildGoods!.typeSeq,
              goodId: item1.goodsBuildGoods!.goodsId,
              goodName: item1.goodsBuildGoods!.goods!.name,
              goodBuildQuantity: sorm.formula(item1.goodsBuildGoods!.weight, "*", 0.001),
              specification: item1.goodsBuildGoods!.goods!.specification,
              stockQuantity: item1.stockQuantity,
              salesQuantity: item1.salesQuantity,
              requirementQuantity: item1.requirementQuantity,
              adequateStock: item1.adequateStock,
              currentExcessiveQuantity: item1.currentExcessiveQuantity,
              adequateExcessiveQuantity: item1.adequateExcessiveQuantity
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

  private _getSearchQueryable(db: MainDbContext): Queryable<ProductionPlan> {
    let queryable = db.productionPlan
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);

    if (this.lastFilter!.year) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.year, this.lastFilter!.year)
        ]);
    }

    if (this.lastFilter!.month) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.month, this.lastFilter!.month)
        ]);
    }

    if (this.lastFilter!.week) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.week, this.lastFilter!.week)
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
          sorm.equal(item.partner!.name, this.lastFilter!.partnerName)
        ]);
    }

    if (this.lastFilter!.goodId) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.goodsId, this.lastFilter!.goodId)
        ]);
    }

    if (this.lastFilter!.goodName) {
      queryable = queryable
        .include(item => item.goods)
        .where(item => [
          sorm.equal(item.goods!.name, this.lastFilter!.goodName)
        ]);
    }

    if (this.lastFilter!.specification) {
      queryable = queryable
        .include(item => item.goods)
        .where(item => [
          sorm.equal(item.goods!.specification, this.lastFilter!.specification)
        ]);
    }

    if (this.lastFilter!.isCanceled !== false) {
      queryable = queryable.where(item => [
        sorm.equal(item.isDisabled, false)
      ]);

    }

    return queryable;
  }
}

interface IFilterVM {
  id?: number;
  year?: number;
  month?: number;
  week?: number;
  partnerId?: number;
  partnerName?: string;
  goodId?: number;
  goodName?: string;
  specification?: string;
  isCanceled: boolean;
}

interface IProductionPlanVM {
  id: number | undefined;
  year: number | undefined;
  month: number | undefined;
  week: number | undefined;
  partnerId: number | undefined;
  partnerName: string | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  remark: string | undefined;
  specification: string | undefined;
  planQuantity: number | undefined;
  realProductionQuantity: number | undefined;
  createdByEmployeeId: number | undefined;
  createdByEmployeeName: string | undefined;
  createdAtDateTime: DateTime | undefined;
  isCanceled: boolean;

  productionBomList: IProductionBomListVM[] | undefined;
}

interface IProductionBomListVM {
  id: number | undefined;
  seq: number | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  goodBuildQuantity: number | undefined;
  specification: string | undefined;
  stockQuantity: number | undefined;
  salesQuantity: number | undefined;
  requirementQuantity: number | undefined;
  adequateStock: number | undefined;
  currentExcessiveQuantity: number | undefined;
  adequateExcessiveQuantity: number | undefined;
}