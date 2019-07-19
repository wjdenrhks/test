import {ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnInit} from "@angular/core";
import {DateOnly, DateTime, JsonConvert} from "@simplism/core";
import {SdModalProvider, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {AppDataProvider} from "@sample/client-common";
import {CodeProc, MainDbContext, ProductionInstruction, StockProc} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {Queryable} from "@simplism/orm-client";
import {ShippingPlanSearchModal} from "../../modals/ShippingPlanSearchModal";
import {BomListSearchModal} from "../../modals/BomListSearchModal";
import {ManagerRegisterModal} from "../../modals/ManagerRegisterModal";
import {ActivatedRoute} from "@angular/router";
import {EquipmentCapaInfoModal} from "../../modals/EquipmentCapaInfoModal";
import {PartnerSearchModal} from "../../modals/PartnerSearchModal";
import {ShowManualModal} from "../../modals/ShowManualModal";

@Component({
  selector: "app-production-instruction",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>생산지시 등록</h4>

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
          <sd-topbar-menu (click)="onShowEquipmentButtonClick()" style="float: right;">
            <sd-icon [icon]="'chart-bar'" [fixedWidth]="true"></sd-icon>
            설비 CAPA
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onAdminRegisterButtonClick()" style="float: right;">
            <sd-icon [icon]="'user-plus'" [fixedWidth]="true"></sd-icon>
            담당 관리자
          </sd-topbar-menu>
        </sd-topbar>
        <sd-dock-container>
          <sd-dock class="sd-padding-sm-default sd-background-grey-lightest">
            <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
              <sd-form-item [label]="'생산예정일'">
                <sd-textfield [(value)]="filter.fromDate" [type]="'date'"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'~'">
                <sd-textfield [(value)]="filter.toDate" [type]="'date'"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'생산지시 No'">
                <sd-textfield [(value)]="filter.productionInstructionCode"></sd-textfield>
              </sd-form-item>
              <br>
              <sd-form-item [label]="'제품명'">
                <app-good-name-select [(value)]="filter.goodName"></app-good-name-select>
              </sd-form-item>
              <sd-form-item [label]="'규격'">
                <app-goods-specification-select [(value)]="filter.specification"
                                                [goodName]="filter.goodName"></app-goods-specification-select>
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
              <sd-sheet #sheet [id]="'productioin-instruction'"
                        [items]="items"
                        [trackBy]="trackByIdFn">
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
                <!--  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.equipmentId" (valueChange)="onChangeEquipment(item)"
                               [disabled]="(!item.id && !item.goodId) || (!!item.id && (!!item.isCombination || !!item.isProduction))">
                      <sd-select-item *ngFor="let equipment of equipmentList; trackBy: trackByMeFn"
                                      [value]="equipment.id"
                                      [hidden]="equipment.isDisabled">
                        {{ equipment.name }}
                      </sd-select-item>
                    </sd-select>
                  </ng-template>-->
                <sd-sheet-column [header]="'생산지시(No)'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      <a *ngIf="!!item.productionInstructionCode"
                         (click)="onRegisterProduction(item.id)">
                        {{ item.productionInstructionCode }}
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'출하계획ID'" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.shippingPlanId }}
                      <a (click)="shippingPlanSearchModalOpenButtonClick(item)"
                         [attr.sd-invalid]="!item.shippingPlanId">
                        <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'거래처'">
                  <ng-template #item let-item="item">
                    <app-partner-select [(value)]="item.partnerId"
                                        (valueChange)="onChangePartner($event, item)"
                                        [items]="partnerList"
                                        [required]="true" *ngIf="!item.id && !item.shippingPlanId"></app-partner-select>
                    <div class="sd-padding-xs-sm" *ngIf="!!item.id || (!item.id && !!item.shippingPlanId)">
                      {{ item.partnerName }}
                    </div>

                    <!-- <div class="sd-padding-xs-sm">
                       {{ item.partnerName }}
                       <a (click)="partnerSearchModalOpenButtonClick(item)" *ngIf="!item.shippingPlanId"
                          [attr.sd-invalid]="!item.partnerId">
                         <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                       </a>
                     </div>-->
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'생산예정일'" [width]="130">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.orderDate" [type]="'date'"
                                  [disabled]="(!!item.id && (!!item.isCombination || !!item.isProduction))"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'설비'">
                  <ng-template #item let-item="item">
                    <app-production-equipment-select [(value)]="item.equipmentId" [required]="true"
                                                     [disabled]="(!item.id && !item.goodId) || (!!item.id && (!!item.isCombination || !!item.isProduction))"
                                                     (valueChange)="onChangeEquipment($event, item)"
                                                     [equipmentList]="equipmentList" [goodId]="item.goodId">
                    </app-production-equipment-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'BOM'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.bomName }}
                      <a (click)="productionBomSearchModalOpenButtonClick(item)"
                         [attr.sd-invalid]="!item.bomId">
                        <sd-icon [fixedWidth]="true" [icon]="'search'"
                                 *ngIf="(!item.id && !!item.goodId) || (item.id && (!item.isCombination && !item.isProduction))"></sd-icon>
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'제품명'">
                  <ng-template #item let-item="item">
                    <app-good-select [(value)]="item.goodId" (valueChange)="onChangeGood($event, item)"
                                     [items]="goodsList" [isId]="item.id" [isProduct]="true"
                                     [disabled]="(!item.id && item.shippingPlanId) || (!!item.id && (!!item.isCombination || !!item.isProduction))" [required]="true">
                    </app-good-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'규격'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.specification }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'오차'" [width]="150">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      <app-input-error [(gspec)]="item.errorSpecG" [(uspec)]="item.errorSpecM"
                                       [disabled]="(!!item.id && (!!item.isCombination || !!item.isProduction))"></app-input-error>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'폭(mm/thick)'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ (item.specification ? item.specification : '') + ' \/ ' + (item.thick ? item.thick : '') }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'코로나(양,단)'">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.corona"
                               [disabled]="(!!item.id && (!!item.isCombination || !!item.isProduction))">
                      <sd-select-item [value]="undefined">미지정</sd-select-item>
                      <sd-select-item [value]="'양면'">양면</sd-select-item>
                      <sd-select-item [value]="'단면'">단면</sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'코로나 다인'">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.coronaDain"
                                  [disabled]="(!!item.id && (!!item.isCombination || !!item.isProduction))"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'롤길이'" [width]="130">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right; margin-right: 5px;">
                      <app-input-unit [unit]="'M'" [(value)]="item.rollLength" (valueChange)="onLengthChange(item)"
                                      [disabled]="(!!item.id && (!!item.isCombination || !!item.isProduction))"></app-input-unit>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'생산량'" [width]="130">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right; margin-right: 5px;">
                      <app-input-unit [unit]="'Roll'" [(value)]="item.productQuantity"
                                      (valueChange)="onProductQuantityChange(item)"
                                      [disabled]="(!!item.id && (!!item.isCombination || !!item.isProduction))"></app-input-unit>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'제품중량'" [width]="130">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right; margin-right: 5px;">
                      <app-input-unit [unit]="'Kg'" [(value)]="item.productWeight"
                                      [disabled]="(!!item.id && (!!item.isCombination || !!item.isProduction))"></app-input-unit>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'롤중량'" [width]="130">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right; margin-right: 5px;">
                      <app-input-unit [unit]="'Kg'" [(value)]="item.rollWeight"
                                      [disabled]="(!!item.id && (!!item.isCombination || !!item.isProduction))"></app-input-unit>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'지관'" [width]="130">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right; margin-right: 5px;">
                      <app-input-unit [unit]="'Kg'" [(value)]="item.branchWeight"
                                      [disabled]="(!!item.id && (!!item.isCombination || !!item.isProduction))"></app-input-unit>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'포장재'" [width]="130">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right; margin-right: 5px;">
                      <app-input-unit [unit]="'Kg'" [(value)]="item.packingWeight"
                                      [disabled]="(!!item.id && (!!item.isCombination || !!item.isProduction))"></app-input-unit>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'PAD'" [width]="130">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right; margin-right: 5px;">
                      <app-input-unit [unit]="'Kg'" [(value)]="item.padWeight"
                                      [disabled]="(!!item.id && (!!item.isCombination || !!item.isProduction))"></app-input-unit>
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
                      <sd-checkbox [(value)]="item.isCanceled"
                                   [disabled]="!item.id || (!!item.id && (!!item.isCombination || !!item.isProduction))"></sd-checkbox>
                    </div>
                  </ng-template>
                </sd-sheet-column>
              </sd-sheet>
            </sd-dock-container>
          </sd-busy-container>
        </sd-dock-container>
      </sd-topbar-container>
    </sd-busy-container>`
})
export class ProductionInstructionPage implements OnInit {

  public filter: IFilterVM = {
    id: undefined,
    productionInstructionCode: undefined,
    fromDate: new DateOnly().setDay(1),
    toDate: new DateOnly().setDay(new Date(new DateOnly().year, new DateOnly().month, 0).getDate()),
    goodName: undefined,
    specification: undefined,
    equipmentId: undefined,
    isDisabled: false
  };

  public lastFilter?: IFilterVM;

  public pagination = {page: 0, length: 0};


  public items: IProductionInstructionVM[] = [];
  public orgItems: IProductionInstructionVM[] = [];

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public equipmentList: {
    id: number;
    name: string;
    code: string;
    erpSync: number;
    isDisabled: boolean;
  }[] = [];

  public partnerList: {
    id: number;
    name: string;
    erpSync: number;
    isDisabled: boolean;
  }[] = [];

  public goodsList: {
    id: number;
    name: string;
    specification: string | undefined;
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

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _appData: AppDataProvider,
                     private readonly _modal: SdModalProvider,
                     // private readonly _socket: SdSocketProvider,
                     private readonly _activatedRoute: ActivatedRoute,
                     private readonly _toast: SdToastProvider,
                     private readonly _cdr: ChangeDetectorRef) {
  }

  public async ngOnInit(): Promise<void> {
    this.mainBusyCount++;
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
          code: item.code!,
          erpSync: item.erpSyncCode,
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
          erpSync: item.erpSyncCode,
          isDisabled: item.isDisabled
        }))
        .resultAsync();
    });

    await this.onSearchFormSubmit();
    this._activatedRoute.params.subscribe(async params => {
      if (params && params.id) {

        this.lastFilter = Object.clone(this.filter);

        if (params.id) {
          this.lastFilter.id = JsonConvert.parse(params.id);
        }

        await this._search();

        this._cdr.markForCheck();

        location.href = location.href.slice(0, location.href.indexOf(";"));
      }
    });

    this.mainBusyCount--;
    this._cdr.markForCheck();
  }

  public onAddItemButtonClick(): void {
    this.items.insert(0, {
      id: undefined,
      seq: undefined,
      productionInstructionCode: undefined,
      shippingPlanId: undefined,
      shippingPlanYear: undefined,
      shippingPlanMonth: undefined,
      shippingPlanWeek: undefined,
      shippingPlanDay: undefined,
      orderDate: undefined,
      partnerId: undefined,
      partnerName: undefined,
      partnerErpSync: undefined,
      goodId: undefined,
      goodName: undefined,
      goodErpSync: undefined,
      specification: undefined,
      thick: undefined,
      equipmentId: undefined,
      equipmentCode: undefined,
      equipmentErpSync: undefined,
      bomId: undefined,
      bomName: undefined,
      errorSpecG: undefined,
      errorSpecM: undefined,
      corona: undefined,
      coronaDain: undefined,
      rollLength: undefined,
      productQuantity: undefined,
      productWeight: undefined,
      rollWeight: undefined,
      branchWeight: undefined,
      shippingPlanQuantity: undefined,
      packingWeight: undefined,
      padWeight: undefined,
      capa: 1,
      remark: undefined,
      createdByEmployeeId: undefined,
      createdByEmployeeName: undefined,
      createdAtDateTime: undefined,
      modifyByEmployeeId: undefined,
      modifyByEmployeeName: undefined,
      modifyAtDateTime: undefined,
      lastModifiedAtDateTime: undefined,
      isCombination: undefined,
      isProduction: undefined,
      isCanceled: false,
      instructionErpSync: undefined
    });
  }

  public onRemoveItemButtonClick(item: IProductionInstructionVM): void {
    this.items.remove(item);
  }

  public async onRegisterProduction(id: number): Promise<void> {
    window.open(location.pathname + "#" + `/home/process/process-production;id=${JSON.stringify(id)}`, "_blank", "left= 500, top= 200 width= 1000, height= 700");
  }

  public async onAdminRegisterButtonClick(): Promise<void> {
    const result = await this._modal.show(ManagerRegisterModal, "주/야간 담당 관리자", undefined);
    if (!result) return;

    this._cdr.markForCheck();
  }

  public async onShowEquipmentButtonClick(): Promise<void> {
    const result = await this._modal.show(EquipmentCapaInfoModal, "설비 CAPA", undefined);
    if (!result) return;

    this._cdr.markForCheck();
  }

  //출하계획으로 생산지시를 내리는 경우
  public async shippingPlanSearchModalOpenButtonClick(item: IProductionInstructionVM): Promise<void> {
    const result = await this._modal.show(ShippingPlanSearchModal, "출하계획 검색", {
      isMulti: false,
      isProductionInstruction: true
    });
    if (!result) return;

    if (!this.goodsList.some(item1 => item1.id === result.goodId)) {
      this.goodsList.push({
        id: result.goodId,
        name: result.goodName,
        specification: result.specification,
        isDisabled: true
      });
    }
    /* await this._productionPlanCalculation(result.year, result.month, 1);
     const orderDateInfo = this.planDateList.filter(item1 => item1.year === result.year && item1.month === result.month && item1.week === result.week) ?
       this.planDateList.filter(item1 => item1.year === result.year && item1.month === result.month && item1.week === result.week).single() : undefined;*/
    const planDate = new DateOnly(result.year, result.month, result.day);

    item.shippingPlanId = result.id;
    item.orderDate = planDate.addDays(-1);
    item.shippingPlanYear = result.year;
    item.shippingPlanMonth = result.month;
    item.shippingPlanWeek = result.week;
    item.shippingPlanDay = result.day;
    item.goodId = result.goodId;
    item.goodName = result.goodName;
    item.goodErpSync = result.goodErpSync;
    item.rollLength = result.length;
    item.rollWeight = result.weight;
    item.partnerId = result.partnerId;
    item.partnerName = result.partnerName;
    item.partnerErpSync = result.partnerErpSync;
    item.thick = result.thick;
    item.specification = result.specification;
    item.shippingPlanQuantity = result.productionQuantity;
    item.productQuantity = Math.floor(result.productionQuantity / (result.length || 1));

    const bomInfo = await this._getGoodsBuildInfo(result.goodId);

    if (bomInfo) {
      item.bomId = bomInfo.id;
      item.bomName = bomInfo.name;
    }
    else {
      item.bomId = undefined;
      item.bomName = undefined;
    }

    this._cdr.markForCheck();
  }

  public async onShowManualButtonClick(): Promise<void> {
    const result = await this._modal.show(ShowManualModal, "생산지시 메뉴얼", {type: "process-instruction"});
    if (!result) return;

    this._cdr.markForCheck();
  }

  public async partnerSearchModalOpenButtonClick(item: IProductionInstructionVM): Promise<void> {
    const result = await this._modal.show(PartnerSearchModal, "거래처 검색", {isMulti: false});
    if (!result) return;

    item.partnerId = result.id;
    item.partnerName = result.name;
    item.partnerErpSync = result.erpSync;

    this._cdr.markForCheck();
  }

  public async onChangePartner(partnerId: number, item: IProductionInstructionVM): Promise<void> {
    if (partnerId) {
      item.partnerName = this.partnerList!.filter(item1 => item1.id === partnerId).single()!.name;
      item.partnerErpSync = this.partnerList!.filter(item1 => item1.id === partnerId).single()!.erpSync;
    }
    else {
      item.partnerName = undefined;
      item.partnerErpSync = undefined;
    }
    this._cdr.markForCheck();
  }

  /*  // 품목선택으로 생산지시를 내리는 경우
    public async goodSearchModalOpenButtonClick(item: IProductionInstructionVM): Promise<void> {
      const result = await this._modal.show(GoodsSearchModal, "제품 검색", {isMulti: false});
      if (!result) return;

      item.orderDate = new DateOnly().addDays(-1);
      item.goodId = result.id;
      item.goodName = result.name;
      item.goodErpSync = result.erpSyncCode;
      item.specification = result.specification;
      item.rollLength = result.length;
      item.rollWeight = result.weight;
      item.thick = result.thick;

      const bomInfo = await this._getGoodsBuildInfo(result.id);

      if (bomInfo) {
        item.bomId = bomInfo.id;
        item.bomName = bomInfo.name;
      }
      else {
        item.bomId = undefined;
        item.bomName = undefined;
      }

      this._cdr.markForCheck();
    }*/

  public async onChangeGood(goodId: number, item: IProductionInstructionVM): Promise<void> {
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
            erpSyncCode: item1.erpSyncCode,
            rollLength: item1.length,
            rollWeight: item1.weight,
            thick: item1.thick
          }))
          .singleAsync();

        item.orderDate = new DateOnly().addDays(-1);
        item.goodName = result ? result.name : undefined;
        item.specification = result ? result.specification : undefined;
        item.goodErpSync = result ? result.erpSyncCode : undefined;
        item.rollLength = result ? result.rollLength : undefined;
        item.rollWeight = result ? result.rollWeight : undefined;
        item.thick = result ? result.thick : undefined;

        const bomInfo = await this._getGoodsBuildInfo(result!.id!);

        if (bomInfo) {
          item.bomId = bomInfo.id;
          item.bomName = bomInfo.name;
        }
        else {
          item.bomId = undefined;
          item.bomName = undefined;
        }
      });
    }
    else {
      item.orderDate = undefined;
      item.goodName = undefined;
      item.specification = undefined;
      item.goodErpSync = undefined;
      item.rollLength = undefined;
      item.rollWeight = undefined;
      item.thick = undefined;
    }
    this._cdr.markForCheck();
  }

  public async productionBomSearchModalOpenButtonClick(item: IProductionInstructionVM): Promise<void> {
    if (!item.goodId) {
      this._toast.danger("출고계획을 먼저 선택해 주세요.");
      return;
    }

    const result = await this._modal.show(BomListSearchModal, item.goodName + " BOM 리스트", {goodId: item.goodId, isGroup: false});
    if (!result) return;

    item.bomId = result.id;
    item.bomName = result.name;

    this._cdr.markForCheck();
  }

  public async onChangeEquipment(equipment: any, item: IProductionInstructionVM): Promise<void> {
    item.equipmentCode = this.equipmentList.some(item1 => item1.id === equipment) ? this.equipmentList.filter(item1 => item1.id === equipment).single()!.code : undefined;

    // 설비가 바뀌면 자동으로 계산 일자 변경 ㅇㅅㅇ?
    if (item.goodId) {
      const needDay = await this._getEquipmentGoodsInfo(item.goodId, item.equipmentId!, item.productQuantity!);
      if (!!needDay && needDay > 1) {
        /*        await this._productionPlanCalculation(year!, month!, 1);
                const day = this.planDateList.filter(item1 => item1.year === year && item1.month === month && item1.week === week) ?
                  this.planDateList.filter(item1 => item1.year === year && item1.month === month && item1.week === week).single()!.startDate : undefined;*/

        item.orderDate = new DateOnly(item.shippingPlanYear!, item.shippingPlanMonth!, item.shippingPlanDay!).addDays(-needDay);
      }
      if (!!item.equipmentId) {
        item.equipmentErpSync = this.equipmentList.filter(item1 => item1.id === item.equipmentId)[0].erpSync;

      }
    }
    this._cdr.markForCheck();
  }

  public async onLengthChange(item: IProductionInstructionVM): Promise<void> {
    if (!!item.shippingPlanId) {
      item.productQuantity = Math.floor((item.shippingPlanQuantity || 0) / (item.rollLength || 1));
      item.rollLength = Math.floor((item.shippingPlanQuantity || 0) / (item.productQuantity || 1));

      if (item.goodId) {
        const needDay = await this._getEquipmentGoodsInfo(item.goodId, item.equipmentId!, item.productQuantity!);
        if (!!needDay && needDay > 1) {
          /*        await this._productionPlanCalculation(year!, month!, 1);
                  const day = this.planDateList.filter(item1 => item1.year === year && item1.month === month && item1.week === week) ?
                    this.planDateList.filter(item1 => item1.year === year && item1.month === month && item1.week === week).single()!.startDate : undefined;*/

          item.orderDate = new DateOnly(item.shippingPlanYear!, item.shippingPlanMonth!, item.shippingPlanDay!).addDays(-needDay);
        }
      }

      this._cdr.markForCheck();
    }
  }

  public async onProductQuantityChange(item: IProductionInstructionVM): Promise<void> {
    if (!!item.shippingPlanId) {
      item.rollLength = Math.floor((item.shippingPlanQuantity || 0) / (item.productQuantity || 1));

      if (item.goodId) {
        const needDay = await this._getEquipmentGoodsInfo(item.goodId, item.equipmentId!, item.productQuantity!);
        if (!!needDay && needDay > 1) {
          /*        await this._productionPlanCalculation(year!, month!, 1);
                  const day = this.planDateList.filter(item1 => item1.year === year && item1.month === month && item1.week === week) ?
                    this.planDateList.filter(item1 => item1.year === year && item1.month === month && item1.week === week).single()!.startDate : undefined;*/

          item.orderDate = new DateOnly(item.shippingPlanYear!, item.shippingPlanMonth!, item.shippingPlanDay!).addDays(-needDay);
        }
      }
      this._cdr.markForCheck();
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

  private async _getEquipmentGoodsInfo(goodId: number, equipmentId: number, orderQuantity: number): Promise<Number | undefined> {
    let planDate: number | undefined;
    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        const result = await db.equipmentByGoods
          .where(item => [
            sorm.equal(item.equipmentId, equipmentId),
            sorm.equal(item.goodId, goodId)
          ])
          .select(item => ({
            quantity: item.quantity,
            leadTime: item.leadTime
          }))
          .singleAsync();

        if (result) {
          planDate = Math.ceil((orderQuantity * result.leadTime!) / 24);
        }
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }
    return planDate;
  }

  private async _getGoodsBuildInfo(goodId: number): Promise<any | undefined> {
    let result: any | undefined;
    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        result = await db.goodsBuildList
          .include(item => item.bomInfo)
          .where(item => [
            sorm.equal(item.goodId, goodId),
            sorm.equal(item.isDisabled, false),
            sorm.equal(item.bomInfo!.isDisabled, false),
            sorm.equal(item.isStander, true)
          ])
          .select(item => ({
            id: item.id,
            name: item.name
          }))
          .singleAsync();
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }
    return result;
  }

  /*// 주(week)기준 추천 생산일자 구하기
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
  }

  private async _getPlanDate(year: number, month: number, day: number, requiredTime: number, db: MainDbContext): Promise<DateOnly> {
    const planDate = (await db.executeAsync([
      `SELECT CONVERT(NVARCHAR(10),DATEADD(DAY,- ${requiredTime},'${year}-${month}-${day}'),121) AS 'planDate'`
    ])).single();

    return planDate!.single()!.planDate;
  }*/

  private async _save(): Promise<void> {
    const diffs = this.orgItems.diffs(this.items, {keyProps: ["id"]}).reverse();
    const diffTargets = this.orgItems.diffs(this.items, {keyProps: ["id"]}).map(item => item.target!);

    if (diffTargets.length < 1) {
      this._toast.info("변경사항이 없습니다.");
      if (process.env.NODE_ENV === "test") console.log("변경사항이 없습니다.");
      return;
    }

    if (diffTargets.some(item => !item.equipmentId)) {
      this._toast.danger("설비는 반드시 선택해야 합니다.");
      return;
    }

    if (diffTargets.some(item => !item.orderDate)) {
      this._toast.danger("생산 예정일은 반드시 선택야 합니다.");
      return;
    }

    if (diffTargets.some(item => !item.partnerId)) {
      this._toast.danger("거래처는 반드시 선택해야 합니다.");
      return;
    }

    if (diffTargets.some(item => !item.bomId)) {
      this._toast.danger("BOM은 반드시 선택야 합니다.");
      return;
    }

    if (diffTargets.some(item => !item.productQuantity)) {
      this._toast.danger("생산량(Roll)을 입력해야 합니다.");
      return;
    }

    if (diffTargets.some(item => !item.rollLength)) {
      this._toast.danger("롤 길이를 입력해야 합니다.");
      return;
    }

    this.viewBusyCount++;

    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        for (const diff of diffs) {
          // INSERT
          if (!diff.target!.id) {
            const documentCode = await CodeProc.getDocumentCode(db, this._appData.authInfo!.companyId, this._appData.authInfo!.employeeId, diff.target!.goodId!, diff.target!.orderDate, "생산", diff.target!.equipmentId, diff.target!.equipmentCode);

            const newProductionInstruction = await db.productionInstruction
              .insertAsync({
                companyId: this._appData.authInfo!.companyId,
                productionInstructionCode: documentCode,
                seq: Number(documentCode.substr(-2, 2)),
                shippingPlanId: diff.target!.shippingPlanId,
                partnerId: diff.target!.partnerId!,
                orderDate: diff.target!.orderDate!,
                goodId: diff.target!.goodId!,
                equipmentId: diff.target!.equipmentId!,
                bomId: diff.target!.bomId!,
                errorSpecG: diff.target!.errorSpecG,
                errorSpecM: diff.target!.errorSpecM,
                corona: diff.target!.corona,
                coronaDain: diff.target!.coronaDain,
                rollLength: Number(diff.target!.rollLength),
                productQuantity: Number(diff.target!.productQuantity),
                productWeight: diff.target!.productWeight,
                rollWeight: diff.target!.rollWeight,
                capa: diff.target!.capa!,
                branchWeight: diff.target!.branchWeight,
                packingWeight: diff.target!.packingWeight,
                padWeight: diff.target!.padWeight,
                remark: diff.target!.remark,
                createdByEmployeeId: this._appData.authInfo!.employeeId,
                createdAtDateTime: new DateTime(),
                isCanceled: diff.target!.isCanceled
              });
            diff.target!.id = newProductionInstruction.id;
            diff.target!.productionInstructionCode = newProductionInstruction.productionInstructionCode;
            diff.target!.createdByEmployeeName = this._appData.authInfo!.employeeName;
            diff.target!.createdAtDateTime = new DateTime();

            await db.goodsIssuePlan
              .where(item => [
                sorm.equal(item.id, diff.target!.shippingPlanId)
              ])
              .updateAsync(
                () => ({
                  isProductionInstruction: newProductionInstruction.id
                })
              );

            //TODO: 외주생산이 아닐경우만 (확정 X, 변경해야 할 경우 UPDATE부분도 처리 해줘야 함)
            if (diff.target!.equipmentCode !== "O") {
              // 지시 수량 만큼 가용재고 +
              const quantity = (diff.target!.productQuantity || 0) * (diff.target!.rollLength || 0);
              await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, quantity, "+");
              // 지시 수량 만큼 BOM 가용재고 -
              await this.modifyBomAvailableStock(db, diff.target!.bomId!, this._appData.authInfo!.companyId, quantity, "-");
            }

            // const erpSyncId = await this._saveErp(diff.target!, documentCode, Number(documentCode.substr(-2, 2)));

            // await db.productionInstruction
            //   .where(item => [
            //     sorm.equal(item.id, newProductionInstruction.id)
            //   ])
            //   .updateAsync(() => ({
            //     ssMakeOrderId: erpSyncId
            //   }));
          }
          // UPDATE
          else {
            if (diff.target!.isCanceled) {
              await db.productionInstruction
                .where(item => [
                  sorm.equal(item.id, diff.target!.id)
                ])
                .updateAsync(
                  () => ({
                    isCanceled: diff.target!.isCanceled,
                    modifyAtDateTime: new DateTime(),
                    modifyByEmployeeId: this._appData!.authInfo!.employeeId
                  })
                );
            }
            else {
              await db.productionInstruction
                .where(item => [
                  sorm.equal(item.id, diff.target!.id)
                ])
                .updateAsync(
                  () => ({
                    orderDate: diff.target!.orderDate,
                    equipmentId: diff.target!.equipmentId,
                    bomId: diff.target!.bomId,
                    errorSpecG: diff.target!.errorSpecG,
                    errorSpecM: diff.target!.errorSpecM,
                    corona: diff.target!.corona,
                    coronaDain: diff.target!.coronaDain,
                    rollLength: diff.target!.rollLength,
                    productQuantity: diff.target!.productQuantity,
                    productWeight: diff.target!.productWeight,
                    rollWeight: diff.target!.rollWeight,
                    capa: diff.target!.capa,
                    branchWeight: diff.target!.branchWeight,
                    packingWeight: diff.target!.packingWeight,
                    padWeight: diff.target!.padWeight,
                    remark: diff.target!.remark,
                    isCanceled: diff.target!.isCanceled,
                    modifyAtDateTime: new DateTime(),
                    modifyByEmployeeId: this._appData!.authInfo!.employeeId
                  })
                );
            }


            const targetDisable = diff.target!.isCanceled;
            const sourceDisable = diff.source!.isCanceled;

            const sourceQuantity = (diff.source!.productQuantity || 0) * (diff.source!.rollLength || 0);
            const targetQuantity = (diff.target!.productQuantity || 0) * (diff.target!.rollLength || 0);


            // 취소 o -> 취소 x
            if (sourceDisable && !targetDisable) {
              await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, sourceQuantity, "+");
              await this.modifyBomAvailableStock(db, diff.target!.bomId!, this._appData.authInfo!.companyId, sourceQuantity, "-");

              // const erpSyncId = await this._saveErp(diff.target!, diff.target!.productionInstructionCode!, Number(diff.target!.productionInstructionCode!.substr(-2, 2)));
              //
              // await db.productionInstruction
              //   .where(item => [
              //     sorm.equal(item.id, diff.target!.id)
              //   ])
              //   .updateAsync(() => ({
              //     ssMakeOrderId: erpSyncId
              //   }));
            }
            // 취소 x -> 취소 o
            else if (!sourceDisable && targetDisable) {
              await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, sourceQuantity, "-");
              await this.modifyBomAvailableStock(db, diff.target!.bomId!, this._appData.authInfo!.companyId, sourceQuantity, "+");

              // await this._updateErp(diff.target!, true);
              //
              // await db.productionInstruction
              //   .where(item => [
              //     sorm.equal(item.id, diff.target!.id)
              //   ])
              //   .updateAsync(() => ({
              //     ssMakeOrderId: undefined
              //   }));
            }
            // 취소 x -> 취소 x
            else if (!sourceDisable && !targetDisable) {
              await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, sourceQuantity, "-");
              await this.modifyBomAvailableStock(db, diff.source!.bomId!, this._appData.authInfo!.companyId, sourceQuantity, "+");
              await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, targetQuantity, "+");
              await this.modifyBomAvailableStock(db, diff.target!.bomId!, this._appData.authInfo!.companyId, targetQuantity, "-");

              // await this._updateErp(diff.target!, false);
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

  /*  // ERP INSERT
    private async _saveErp(item: IProductionInstructionVM, documentCode: string, seq: number): Promise<number> {
      const corona = item.corona === "양면" ? "2" : item.corona === "단면" ? "1" : "";
      const date = item.orderDate!.toFormatString("yyyy-MM-dd");
      const inserProductionInstruction = await this._socket.sendAsync("ErpMysqlQueryService.devExecuteQueryAsync", [`
            INSERT INTO newgratech.ss_make_order (sp_key, sbma_key, smo_date, smo_no, smo_order_no, smo_rkg, smo_length,
                                          sbma_error_g, sbma_error_u, smo_total, smo_side, smo_dyne, smo_paper, smo_pack,
                                          smo_pad, smo_text, reg_id, reg_date, mod_id, mod_date, bom_weight_1, bom_weight_2,
                                          bom_weight_3, smo_weight, smo_thick, smo_stand, smo_index, smo_info, smp_key,
                                          customer_idx, smo_p_kg, smo_r_kg)
    VALUES (${item.goodErpSync}, ${item.equipmentErpSync}, '${date}', ${seq}, '${documentCode}', '0', ${item.rollLength},
    ${item.errorSpecG || 0},  ${item.errorSpecM || 0},  ${item.productQuantity || 0},  '${corona}', '${item.coronaDain || ""}',  '${item.branchWeight || ""}',  '${item.packingWeight || ""}',
      '${item.padWeight || ""}', '*SPEC에 준하여 생산할 것*SPEC에 준하여 생산할 것
    *두께=전자저울.게이지 Check 작업일지에 정확히 기재
    *코로나.외관검수(주름.젤.접힘)없이 작업할것-이상있을시 즉시보고 조치받을것
    *Roll중량=지관+포장재+제품중량임', '${this._appData.authInfo!.employeeLoginId}', '${new DateTime().toFormatString("yyyy-MM-dd HH:mm:ss")}', '', NULL, 0, 0,
    0, 0, ${item.thick || 0}, ${item.specification || 0}, '', 1, 0,
    ${item.partnerErpSync}, '${item.productWeight || 0}', '${item.rollWeight}'); `.trim()]);

      return inserProductionInstruction.insertId;
    }

    // ERP UPDATE
    private async _updateErp(item: IProductionInstructionVM, isDelected: boolean): Promise<void> {
      const corona = item.corona === "양면" ? "2" : item.corona === "단면" ? "1" : "";
      const date = item.orderDate!.toFormatString("yyyy-MM-dd");

      //DELETE
      if (isDelected) {
        await this._socket.sendAsync("ErpMysqlQueryService.devExecuteQueryAsync", [`
            DELETE
            FROM ss_make_order
            WHERE smo_key = ${item.instructionErpSync}; `.trim()]);
      }
      //UPDATE
      else {
        await this._socket.sendAsync("ErpMysqlQueryService.devExecuteQueryAsync", [`
            UPDATE ss_make_order
  SET sp_key = ${item.goodErpSync},
      sbma_key = ${item.equipmentErpSync},
      smo_date = '${date}',
      smo_length = ${item.rollLength},
      sbma_error_g =  ${item.errorSpecG || 0},
      sbma_error_u = ${item.errorSpecM || 0},
      smo_total = ${item.productQuantity || 0},
      smo_side = '${corona}',
      smo_dyne = '${item.coronaDain || ""}',
      smo_paper = '${item.branchWeight || ""}',
      smo_pack = '${item.packingWeight || ""}',
      smo_pad =  '${item.padWeight || ""}',
      mod_id =  '${this._appData.authInfo!.employeeLoginId}',
      mod_date =  '${new DateTime().toFormatString("yyyy-MM-dd HH:mm:ss")}',
      smo_thick =  ${item.thick || 0},
      smo_stand = ${item.specification || 0},
      smo_p_kg = '${item.productWeight || 0}',
      smo_r_kg =  '${item.rollWeight}'
      WHERE smo_key = ${item.instructionErpSync}; `.trim()]);
      }
    }*/


  private async _search(): Promise<void> {
    if (!this.lastFilter) return;

    this.mainBusyCount++;
    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        const queryable = this._getSearchQueryable(db);

        this.items = await queryable
          .orderBy(item => item.id)
          .limit(this.pagination.page * 50, 50)
          .wrap(ProductionInstruction)
          .include(item => item.shippingPlan)
          .include(item => item.employee)
          .include(item => item.modifyEmployee)
          .include(item => item.bom)
          .include(item => item.goods)
          .include(item => item.equipment)
          .include(item => item.partners)
          .select(item => ({
            id: item.id,
            seq: item.seq,
            productionInstructionCode: item.productionInstructionCode,
            shippingPlanId: item.shippingPlanId,
            shippingPlanYear: item.shippingPlan!.planYear,
            shippingPlanMonth: item.shippingPlan!.planMonth,
            shippingPlanWeek: item.shippingPlan!.week,
            shippingPlanDay: item.shippingPlan!.planDay,
            shippingPlanQuantity: item.shippingPlan!.planQuantity,
            orderDate: item.orderDate,
            partnerId: item.partnerId,
            partnerName: item.partners!.name,
            partnerErpSync: item.partners!.erpSyncCode,
            goodId: item.goodId,
            goodName: item.goods!.name,
            goodErpSync: item.goods!.erpSyncCode,
            specification: item.goods!.specification,
            thick: item.goods!.thick,
            equipmentId: item.equipmentId,
            equipmentCode: item.equipment!.code,
            equipmentErpSync: item.equipment!.erpSyncCode,
            bomId: item.bomId,
            bomName: item.bom!.name,
            errorSpecG: item.errorSpecG,
            errorSpecM: item.errorSpecM,
            corona: item.corona,
            coronaDain: item.coronaDain,
            rollLength: item.rollLength,
            productQuantity: item.productQuantity,
            productWeight: item.productWeight,
            rollWeight: item.rollWeight,
            branchWeight: item.branchWeight,
            packingWeight: item.packingWeight,
            padWeight: item.padWeight,
            remark: item.remark,
            capa: item.capa,
            createdByEmployeeId: item.createdByEmployeeId,
            createdByEmployeeName: item.employee!.name,
            createdAtDateTime: item.createdAtDateTime,
            modifyByEmployeeId: item.modifyByEmployeeId,
            modifyByEmployeeName: item.modifyEmployee!.name,
            modifyAtDateTime: item.modifyAtDateTime,
            lastModifiedAtDateTime: item.lastModifiedAtDateTime,
            isCombination: item.isCombination,
            isProduction: item.isProduction,
            isCanceled: item.isCanceled,
            instructionErpSync: item.ssMakeOrderId
          }))
          .resultAsync();

        this.orgItems = Object.clone(this.items);

        const totalCount = await queryable.countAsync();
        this.pagination.length = Math.ceil(totalCount / 50);

        this.goodsList = this.items
          .groupBy(item => ({
            id: item.goodId,
            name: item.goodName,
            specification: item.specification
          }))
          .map(item => ({
            id: item.key.id!,
            name: item.key.name!,
            specification: item.key.specification,
            isDisabled: false
          }));
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.mainBusyCount--;
  }

  private _getSearchQueryable(db: MainDbContext): Queryable<ProductionInstruction> {
    let queryable = db.productionInstruction
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);

    if (this.lastFilter!.productionInstructionCode) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.productionInstructionCode, this.lastFilter!.productionInstructionCode)
        ]);
    }

    if (this.lastFilter!.fromDate || this.lastFilter!.toDate) {
      queryable = queryable
        .where(item => [
          sorm.between(item.orderDate, this.lastFilter!.fromDate, this.lastFilter!.toDate!)
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

    queryable = queryable.where(item => [
      sorm.equal(item.isCanceled, this.lastFilter!.isDisabled)
    ]);

    return queryable;
  }

  private async modifyBomAvailableStock(db: MainDbContext, bomId: number, companyId: number, productionQuantity?: number, formula?: string): Promise<void> {
    const bomInfo = await db.goodsBuildGoods
      .where(item => [
        sorm.equal(item.companyId, companyId),
        sorm.equal(item.bomListId, bomId)
      ])
      .select(item => ({
        goodId: item.goodsId,
        weight: sorm.formula(item.weight, "*", 0.001)
      }))
      .resultAsync();

    for (const bomItem of bomInfo || []) {
      await StockProc.modifyAvailableStock(db, companyId, bomItem.goodId, (bomItem.weight! * (productionQuantity || 0)), formula);
    }
  }
}

interface IFilterVM {
  id?: number;
  productionInstructionCode?: string;
  fromDate?: DateOnly;
  toDate?: DateOnly;
  goodName?: string;
  specification?: string;
  equipmentId?: number;
  isDisabled: boolean;
}

interface IProductionInstructionVM {
  id: number | undefined;
  productionInstructionCode: string | undefined;
  seq: number | undefined;
  shippingPlanId: number | undefined;
  shippingPlanYear: number | undefined;
  shippingPlanMonth: number | undefined;
  shippingPlanWeek: number | undefined;
  shippingPlanDay: number | undefined;
  shippingPlanQuantity: number | undefined;
  orderDate: DateOnly | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  goodErpSync: number | undefined;
  specification: string | undefined;
  thick: number | undefined;
  partnerId: number | undefined;
  partnerName: string | undefined;
  partnerErpSync: number | undefined;
  equipmentId: number | undefined;
  equipmentCode: string | undefined;
  equipmentErpSync: number | undefined;
  bomId: number | undefined;
  bomName: string | undefined;
  errorSpecG: number | undefined;
  errorSpecM: number | undefined;
  corona: "양면" | "단면" | undefined;
  capa: number | undefined;
  coronaDain: string | undefined;
  rollLength: number | undefined;
  productQuantity: number | undefined;
  productWeight: number | undefined;
  rollWeight: number | undefined;
  branchWeight: number | undefined;
  packingWeight: number | undefined;
  padWeight: number | undefined;
  remark: string | undefined;
  createdByEmployeeId: number | undefined;
  createdByEmployeeName: string | undefined;
  createdAtDateTime: DateTime | undefined;
  modifyByEmployeeId: number | undefined;
  modifyByEmployeeName: string | undefined;
  modifyAtDateTime: DateTime | undefined;
  lastModifiedAtDateTime: DateTime | undefined;
  isCombination: number | undefined;
  isProduction: number | undefined;
  isCanceled: boolean;
  instructionErpSync: number | undefined;
}