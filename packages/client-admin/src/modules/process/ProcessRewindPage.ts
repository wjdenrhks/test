import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnInit} from "@angular/core";
import {DateOnly, DateTime} from "@simplism/core";
import {
  SdDomValidatorProvider,
  SdModalProvider,
  SdOrmProvider,
  SdSocketProvider,
  SdToastProvider
} from "@simplism/angular";
import {AppDataProvider, WeightChangedEvent} from "@sample/client-common";
import {CodeProc, MainDbContext, RewindProcess, StockProc} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {GoodsSearchModal} from "../../modals/GoodsSearchModal";
import {Queryable} from "@simplism/orm-client";
import {StockSearchModal} from "../../modals/StockSearchModal";
import {EquipmentInfoShowModal} from "../../modals/EquipmentInfoShowModal";
import {ShowManualModal} from "../../modals/ShowManualModal";

@Component({
  selector: "app-process-rewind",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>리와인더 작업</h4>

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
              <sd-form-item [label]="'작업 계획일'">
                <sd-textfield [(value)]="filter.fromDate" [type]="'date'"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'~'">
                <sd-textfield [(value)]="filter.toDate" [type]="'date'"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'작업 시작일'">
                <sd-textfield [(value)]="filter.productionFromDate" [type]="'date'"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'~'">
                <sd-textfield [(value)]="filter.productionToDate" [type]="'date'"></sd-textfield>
              </sd-form-item>
              <br>
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
              <sd-form-item [label]="'품목명'">
                <app-good-name-select [(value)]="filter.goodName"></app-good-name-select>
              </sd-form-item>
              <sd-form-item [label]="'규격'">
                <app-goods-specification-select [(value)]="filter.specification" [goodName]="filter.goodName"></app-goods-specification-select>
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
                <sd-textfield [(value)]="filter.inputLot"></sd-textfield>
              </sd-form-item>
            </sd-form>
          </sd-dock>

          <sd-dock class="sd-padding-sm-default">
            <sd-pagination [page]="pagination.page" [length]="pagination.length"
                           (pageChange)="onPageClick($event)"></sd-pagination>
          </sd-dock>

          <sd-busy-container [busy]="mainBusyCount > 0">
            <sd-dock-container>
              <sd-sheet #sheet [id]="'process-rewind'"
                        [items]="items"
                        [selectable]="true"
                        [(selectedItem)]="selectedItem"
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
                <sd-sheet-column [header]="'설비'">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.equipmentId" (valueChange)="onChangeEquipmentCode($event, item)"
                               [required]="true" [disabled]="!!item.firstModifyDate">
                      <sd-select-item *ngFor="let equipment of equipmentList; trackBy: trackByMeFn"
                                      [value]="equipment.id"
                                      [hidden]="equipment.isDisabled">
                        {{ equipment.name }}
                      </sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="재감기.구분">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.type" [disabled]="!!item.id">
                      <sd-select-item [value]="'사내'">사내</sd-select-item>
                      <sd-select-item [value]="'외주'">외주</sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="작업 계획일.일자" [width]="120">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.planDate" [type]="'date'"
                                  [disabled]="!!item.firstModifyDate"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="작업 시작일.일자" [width]="120">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.startDate" [type]="'date'"
                                  [disabled]="!!item.firstModifyDate"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="투입수량.(M)" [width]="80">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.inputQuantity" [type]="'number'"
                                  [disabled]="!!item.firstModifyDate || !item.productLotId"></sd-textfield>
                    <!--[disabled]="!!item.firstModifyDate || !item.productLotId"></sd-textfield>-->
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="투입중량.(KG)" [width]="80">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.inputWeight" [type]="'number'"
                                  [disabled]="!!item.firstModifyDate || !item.productLotId"></sd-textfield>
                    <!--[disabled]="!!item.firstModifyDate || !item.productLotId"></sd-textfield>-->
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="로트 변경.생산(투입) LOT" [width]="160">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.productLotName }}
                      <a (click)="productionLotSearchModalOpenButtonClick(item)">
                        <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.firstModifyDate"></sd-icon>
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="로트 변경.리와인더 LOT" [width]="150">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.rewindLotName }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="제품 및 규격.계열">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.goodCategory }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="제품 및 규격.제품명">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.goodName }}
                      <a (click)="rewindGoodSearchModalOpenButtonClick(item)"
                         [attr.sd-invalid]="!item.goodId">
                        <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.firstModifyDate"></sd-icon>
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="제품 및 규격.폭(mm)" [width]="60">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.specification }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="제품 및 규격.두께(g)" [width]="60">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right;">
                      {{ item.thick | number }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="제품 및 규격.길이(m)" [width]="60">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: right">
                      {{ item.length | number }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="커팅 규격.폭(mm)" [width]="60">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.cuttingSpecification"
                                  [disabled]="!!item.firstModifyDate"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="타공품.제품명 / 규격">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.changeGoodName ? item.changeGoodName + ' / ' + item.changeGoodSpecification : undefined }}
                      <a (click)="changeGoodSearchModalOpenButtonClick(item)">
                        <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.firstModifyDate"></sd-icon>
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'작업구분'">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.productionType" [disabled]="!!item.firstModifyDate">
                      <sd-select-item [value]="undefined">미지정</sd-select-item>
                      <sd-select-item [value]="type" *ngFor="let type of productionType; trackBy: trackByMeFn">
                        {{ type }}
                      </sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'제품구분'">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.goodType" [disabled]="!!item.firstModifyDate">
                      <sd-select-item [value]="undefined">미지정</sd-select-item>
                      <sd-select-item [value]="type" *ngFor="let type of goodType; trackBy: trackByMeFn">
                        {{ type }}
                      </sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="작업수량.(m,kg,pcs)">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.productionQuantity" [type]="'number'"
                                  [disabled]="!!item.lastModifyDate || !item.productionLotId"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="제품중량.KG">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.productionWeight" [type]="'number'"
                                  [disabled]="!item.productLotId"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="중량계.KG" [width]="80">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.weightId"
                               [disabled]="!item.productionQuantity || item.productionQuantity === 0"
                               (valueChange)="onWeightIdChange($event, item)">
                      <sd-select-item [value]="undefined">미지정</sd-select-item>
                      <sd-select-item [value]="1">1</sd-select-item>
                      <sd-select-item [value]="2">2</sd-select-item>
                      <sd-select-item [value]="3">3</sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="품질.코로나(다인)">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.corona" [disabled]="!!item.firstModifyDate">
                      <sd-select-item [value]="undefined">미지정</sd-select-item>
                      <sd-select-item [value]="'38'">38</sd-select-item>
                      <sd-select-item [value]="'40'">40</sd-select-item>
                      <sd-select-item [value]="'42'">42</sd-select-item>
                      <sd-select-item [value]="'44'">44</sd-select-item>
                      <sd-select-item [value]="'46'">46</sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="품질.수축(값)" [width]="80">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.shrink"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="품질.외관검사">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.visualInspectionType">
                      <sd-select-item [value]="undefined">미지정</sd-select-item>
                      <sd-select-item [value]="type" *ngFor="let type of visualInspectionType; trackBy: trackByMeFn">
                        {{ type }}
                      </sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="품질.합/부 판정">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.rating" [disabled]="!item.productionQuantity">
                      <sd-select-item [value]="'공통'">미지정</sd-select-item>
                      <sd-select-item [value]="'A'">A</sd-select-item>
                      <sd-select-item [value]="'B'">B</sd-select-item>
                      <sd-select-item [value]="'C'">C</sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="스크랩.발생스크랩">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.scrapGoodName }}
                      <a (click)="scrapItemSearchModalOpenButtonClick(item)">
                        <sd-icon [fixedWidth]="true" [icon]="'search'"></sd-icon>
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="스크랩.스크랩 유형">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.scrapCategoryId" [disabled]="!item.scrapGoodId">
                      <sd-select-item *ngFor="let scrapType of scrapTypeList; trackBy: trackByMeFn"
                                      [value]="scrapType.id"
                                      [hidden]="scrapType.isDisabled">
                        {{ scrapType.name }}
                      </sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="스크랩.스크랩 구분(등급)">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.scrapType"
                               [disabled]="!item.scrapGoodId || (!!item.id && item.prevRating !== '보류') ">
                      <sd-select-item [value]="'재생 가능'">재생 가능</sd-select-item>
                      <sd-select-item [value]="'재생 불가'">재생 불가</sd-select-item>
                      <sd-select-item [value]="'보류'">보류</sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="스크랩.LOSS(M)">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.lossQuantity" [type]="'number'"
                                  [disabled]="!item.scrapGoodId"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="스크랩.LOSS(KG)">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.lossWeight" [type]="'number'"
                                  [disabled]="!item.scrapGoodId"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="공정관리.라인스피드">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      <a (click)="showEquipmentLineSpeedInfo(item)" *ngIf="!!item.id">
                        {{ item.lineSpeed | number }}
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column header="공정관리.텐션값">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      <a (click)="showEquipmentTensionInfo(item)" *ngIf="!!item.id">
                        {{ item.tension | number }}
                      </a>
                    </div>
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
                      <sd-checkbox [(value)]="item.isCanceled" [disabled]="!!item.firstModifyDate"></sd-checkbox>
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
export class ProcessRewindPage implements OnInit {
  public filter: IFilterVM = {
    fromDate: undefined,
    toDate: undefined,
    productionFromDate: undefined,
    productionToDate: undefined,
    equipmentId: undefined,
    goodName: undefined,
    specification: undefined,
    isCanceled: false
  };

  public lastFilter?: IFilterVM;

  public pagination = {page: 0, length: 0};

  public items: IProcessRewindVM[] = [];
  public orgItems: IProcessRewindVM[] = [];
  public selectedItem?: IProcessRewindVM;

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public selectedItemBusyCount = 0;

  public productionType: string[] = [];
  public goodType: string[] = [];
  public visualInspectionType: string[] = [];
  public scrapCategory: string[] = [];

  public equipmentList: {
    id: number;
    name: string;
    erpSync: number;
    code?: string;
    isDisabled: boolean;
  }[] = [];

  public scrapTypeList: {
    id: number;
    name: string;
    isDisabled: boolean;
  }[] = [];

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _appData: AppDataProvider,
                     private readonly _domValidator: SdDomValidatorProvider,
                     private readonly _elRef: ElementRef<HTMLElement>,
                     private readonly _modal: SdModalProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _cdr: ChangeDetectorRef,
                     private readonly _socket: SdSocketProvider) {
  }

  public async ngOnInit(): Promise<void> {
    await this._orm.connectAsync(MainDbContext, async db => {
      this.equipmentList = await db.equipment
        .where(item => [
          sorm.equal(item.companyId, this._appData.authInfo!.companyId),
          sorm.equal(item.isDisabled, false),
          sorm.includes(item.name, "리와인더"),
          sorm.or([
            sorm.includes(item.name, "3"),
            sorm.includes(item.name, "2")
          ])
        ])
        .select(item => ({
          id: item.id!,
          name: item.name,
          code: item.code,
          erpSync: item.erpSyncCode,
          isDisabled: item.isDisabled
        }))
        .resultAsync();

      this.scrapTypeList = await db.baseType
        .where(item => [
          sorm.equal(item.companyId, this._appData.authInfo!.companyId),
          sorm.equal(item.isDisabled, false),
          sorm.includes(item.type, "스크랩유형")
        ])
        .select(item => ({
          id: item.id!,
          name: item.name,
          isDisabled: item.isDisabled
        }))
        .resultAsync();
    });

    this.productionType = [
      "내면 코로나 처리",
      "외면 코로나 처리",
      "커팅",
      "중타(커팅)",
      "타공",
      "검수",
      "재감기",
      "내면박리",
      "외면박리"
    ].filterExists();

    this.goodType = [
      "완제품",
      "반제품",
      "보류품",
      "폐기품(재생)",
      "폐기품(폐기)",
      "폐기품(매각)"
    ].filterExists();

    this.visualInspectionType = [
      "OK", "NG", "주름", "라인줄", "알갱이", "접힘", "펑크"
    ].filterExists();

    this.scrapCategory = [
      "LD", "LLD", "NYLON(NATURAL)", "NYLON(잡색)", "TPU", "HMPA", "혼합", "DS-20000",
      "DS-40000", "DS-45000", "DS-50000", "3050", "3030", "HL-505C", "KS-010C", "EV-504C",
      "HL-600", "BC-4000", "흡음제(PE)", "흡음제(PU)", "NS-1E30"
    ].filterExists();


    await this._socket.addEventListenerAsync(WeightChangedEvent, undefined, async data => {
      for (const key of Object.keys(data)) {
        const weight = Number(data[key]);
        const weightId = Number(key.slice(1, 4));
        this.applyWeightInfo(weightId, weight);
      }

      this._cdr.markForCheck();
    });

    await this.onSearchFormSubmit();
    this._cdr.markForCheck();
  }

  public async onShowManualButtonClick(): Promise<void> {
    const result = await this._modal.show(ShowManualModal, "리와인더 메뉴얼", {type: "process-rewind"});
    if (!result) return;

    this._cdr.markForCheck();
  }

  public async onAddItemButtonClick(): Promise<void> {
    this.items.insert(0, {
      id: undefined,
      weightId: undefined,
      type: "사내",
      planDate: new DateOnly(),
      equipmentId: undefined,
      equipmentName: undefined,
      equipmentCode: undefined,
      startDate: undefined,
      productionStockId: undefined,
      inputQuantity: undefined,
      inputWeight: undefined,
      productionItemId: undefined,
      productionWarehouseId: undefined,
      productionRating: undefined,
      productLotId: undefined,
      productLotName: undefined,
      rewindLotId: undefined,
      rewindLotName: undefined,
      rewindGoodSeq: undefined,
      goodId: undefined,
      goodCategory: undefined,
      goodName: undefined,
      specification: undefined,
      thick: undefined,
      length: undefined,
      cuttingSpecification: undefined,
      changeGoodId: undefined,
      changeGoodName: undefined,
      changeGoodSpecification: undefined,
      productionType: undefined,
      goodType: undefined,
      productionQuantity: undefined,
      productionWeight: undefined,
      corona: undefined,
      shrink: undefined,
      visualInspectionType: undefined,
      rating: "공통",
      scrapId: undefined,
      scrapLotId: undefined,
      scrapGoodId: undefined,
      scrapGoodName: undefined,
      scrapCategoryId: undefined,
      scrapCategoryName: undefined,
      scrapType: undefined,
      prevScrapType: undefined,
      lossQuantity: undefined,
      lossWeight: undefined,
      lineSpeed: undefined,
      tension: undefined,
      firstModifyDate: undefined,
      lastModifyDate: undefined,
      cratedByEmployeeId: undefined,
      createdByEmployeeName: undefined,
      createdAtDateTime: undefined,
      isCanceled: false
    });

    this._cdr.markForCheck();
  }

  public onRemoveItemButtonClick(item: IProcessRewindVM): void {
    this.items.remove(item);
  }

  public async productionLotSearchModalOpenButtonClick(item: IProcessRewindVM): Promise<void> {
    const result = await this._modal.show(StockSearchModal, "생산 LOT 검색", {isMulti: false});
    if (!result) return;

    if (!result) return;

    item.productionItemId = result.productionItemId;
    item.productionStockId = result.id;
    item.productionWarehouseId = result.warehouseId;
    item.productionRating = result.rating;
    item.inputQuantity = result.quantity;
    item.inputWeight = result.weight;
    item.productLotId = result.lotId;
    item.productLotName = result.lotName;
    item.goodCategory = result.goodCategory;
    item.goodId = result.goodId;
    item.goodName = result.goodName;
    item.specification = result.specification;
    item.thick = result.goodThick;
    item.length = result.goodLength;
    /*
      else {
        this._toast.danger("이미 투입완료 된 품목입니다.");
        return;
      }*/
    this._cdr.markForCheck();
  }

  public async onSearchLotSubmit(): Promise<void> {
    if (!this.filter!.inputLot) {
      this._toast.danger("LOT를 입력해 주세요");
      return;
    }

    if (!this.selectedItem) {
      this._toast.danger("LOT를 투입할 리와인더 항목을 선택해 주세요요");
      return;
    }

    const lot = this.filter!.inputLot && this.filter!.inputLot!.trim();
    const result = await this._newInputLotInfo(lot!);

    if (result && result.length > 0) {
      this.selectedItem.productionItemId = result[0].productionItemId;
      this.selectedItem.productionStockId = result[0].id;
      this.selectedItem.productionWarehouseId = result[0].warehouseId;
      this.selectedItem.productionRating = result[0].rating;
      this.selectedItem.inputQuantity = result[0].quantity;
      this.selectedItem.inputWeight = result[0].weight;
      this.selectedItem.productLotId = result[0].lotId;
      this.selectedItem.productLotName = result[0].lotName;
      this.selectedItem.goodCategory = result[0].goodCategory;
      this.selectedItem.goodId = result[0].goodId;
      this.selectedItem.goodName = result[0].goodName;
      this.selectedItem.specification = result[0].specification;
      this.selectedItem.thick = result[0].goodThick;
      this.selectedItem.length = result[0].goodLength;

      this.filter.inputLot = undefined;
    }
    else {
      this._toast.danger(this.filter.inputLot + ": 해당 LOT를 재고에서 찾을 수 없습니다.");
      return;
    }
    this.filter!.inputLot = undefined;
    this._cdr.markForCheck();
  }

  private async _newInputLotInfo(lot: string): Promise<any | undefined> {
    let returnItem: any[] = [];
    await this._orm.connectAsync(MainDbContext, async db => {
      const result = await db.stock
        .include(item => item.productionItem)
        .include(item => item.paletteBarcode)
        .include(item => item.goods)
        .include(item => item.warehouse)
        .include(item => item.lot)
        .where(item => [
          sorm.equal(item.lot!.lot, lot),
          sorm.greaterThenOrEqual(item.quantity, 0)
        ])
        .select(item => ({
          id: item.id,
          packingLotId: item.paletteBarcodeId,
          packingLot: item.paletteBarcode!.paletteBarcode,
          productionItemId: item.productionItem!.id,
          lotId: item.lotId,
          lotName: item.lot!.lot,
          goodId: item.goodsId,
          goodName: item.goods!.name,
          goodCategory: item.goods!.category,
          goodThick: item.goods!.thick,
          goodLength: item.goods!.length,
          specification: item.goods!.specification,
          width: sorm.ifNull(item.lot!.width, item.goods!.specification),
          thick: sorm.ifNull(item.lot!.thick, item.goods!.thick),
          length: sorm.ifNull(item.lot!.length, 0),
          weight: sorm.ifNull(item.lot!.weight, 0),
          unitName: item.goods!.unitName,
          unitPrice: item.goods!.unitPrice,
          quantity: item.quantity,
          rating: item.rating,
          warehouseId: item.warehouseId,
          warehouseName: item.warehouse!.name,
          warehouseRating: item.warehouse!.rating
        }))
        .resultAsync();

      returnItem = result.map(item => ({
        id: item.id,
        packingLotId: item.packingLotId,
        packingLot: item.packingLot,
        productionItemId: item.productionItemId,
        lotId: item.lotId,
        lotName: item.lotName,
        goodId: item.goodId,
        goodName: item.goodName,
        goodCategory: item.goodCategory,
        goodThick: item.goodThick,
        goodLength: item.goodLength,
        width: item.width,
        thick: item.thick,
        length: item.length,
        specification: item.specification,
        unitName: item.unitName,
        unitPrice: item.unitPrice,
        weight: item.weight,
        quantity: item.quantity,
        rating: item.rating,
        warehouseId: item.warehouseId,
        warehouseName: item.warehouseName,
        warehouseRating: item.warehouseRating
      }));
    });
    return returnItem;
  }

  public async changeGoodSearchModalOpenButtonClick(item: IProcessRewindVM): Promise<void> {
    const result = await this._modal.show(GoodsSearchModal, "타공품 검색", {isMulti: false});
    if (!result) return;

    item.changeGoodId = result.id;
    item.changeGoodName = result.name;
    item.changeGoodSpecification = result.specification;

    this._cdr.markForCheck();
  }

  public async rewindGoodSearchModalOpenButtonClick(item: IProcessRewindVM): Promise<void> {
    const result = await this._modal.show(GoodsSearchModal, "품목 검색", {isMulti: false});
    if (!result) return;

    if (!item.goodId || (item.goodId !== result.goodId)) {
      item.goodCategory = result.category;
      item.goodId = result.id;
      item.goodName = result.name;
      item.specification = result.specification;
      item.thick = result.thick;
      item.length = result.length;

      item.productionItemId = undefined;
      item.productionStockId = undefined;
      item.productionWarehouseId = undefined;
      item.productionRating = undefined;
      item.inputQuantity = undefined;
      item.inputWeight = undefined;
      item.productLotId = undefined;
      item.productLotName = undefined;
    }

    this._cdr.markForCheck();
  }

/*  private async _searchRewindLot(lotId: number): Promise<boolean | undefined> {
    let isRewind: boolean | undefined;
    await this._orm.connectAsync(MainDbContext, async db => {
      const result = await db.rewindProcess
        .where(item => [
          sorm.equal(item.companyId, this._appData.authInfo!.companyId),
          sorm.equal(item.isCanceled, false),
          sorm.equal(item.productionLotId, lotId)
        ])
        .select(item => ({
          id: item.id!
        }))
        .singleAsync();

      isRewind = !!(result && result.id);
    });

    return isRewind;
  }*/

  public async scrapItemSearchModalOpenButtonClick(item: IProcessRewindVM): Promise<void> {
    const result = await this._modal.show(GoodsSearchModal, "스크랩 검색", {isMulti: false, type: "스크랩"});
    if (!result) return;

    item.scrapGoodId = result.id;
    item.scrapGoodName = result.name;

    this._cdr.markForCheck();
  }

  public async onChangeEquipmentCode(equipment: any, item: IProcessRewindVM): Promise<void> {
    item.equipmentName = this.equipmentList.some(item1 => item1.id === equipment) ? this.equipmentList.filter(item1 => item1.id === equipment).single()!.name : undefined;
    item.equipmentCode = this.equipmentList.some(item1 => item1.id === equipment) ? this.equipmentList.filter(item1 => item1.id === equipment).single()!.code : undefined;
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

  public onWeightIdChange(weightId: number, item: IProcessRewindVM): void {
    if (this.items.some(item1 => item !== item1 && item1.weightId === weightId)) {
      this._toast.danger("이미 해당 중량계로 선택 된 항목이 있습니다.");
      setTimeout(() => {
        item.weightId = undefined;
        this._cdr.markForCheck();
      });
      return;
    }
  }

  /*  // loas 자동 계산
    public onChangeLossWeightt(weight: number, item: IProcessRewindVM): void {
      item.lossWeight = (item.inputWeight || 0) - (item.productionWeight || 0);
      item.lossQuantity = (item.inputQuantity || 0) - (item.productionQuantity || 0);

      this._cdr.markForCheck();
    }*/

  public applyWeightInfo(id: number, weight: number): void {
    const currItem = this.items.single(item => item.weightId === id);
    if (currItem) {
      currItem.productionWeight = weight;
      this._cdr.markForCheck();
    }
  }

  public async showEquipmentLineSpeedInfo(item: IProcessRewindVM): Promise<void> {
    const result = await this._modal.show(EquipmentInfoShowModal, "설비 정보 (라인스피드)", {
      equipmentId: item.equipmentId!,
      rewindId: item.id,
      type: "line"
    });
    if (!result) return;

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

    for (const diff of diffTargets) {
      if (diff.scrapGoodId && (!diff.scrapType || !diff.scrapCategoryId)) {
        this._toast.danger("스크랩 유형/구분을 선택해 주세요.");
        return;
      }
    }

    this.viewBusyCount++;

    try {
      this._domValidator.validate(this._elRef!.nativeElement);

      Object.validatesArray(
        diffTargets,
        `리와인더 작업`,
        {
          id: {displayName: "ID", type: Number},
          planDate: {displayName: "작업 계획일.일자", notnull: true},
          isCanceled: {displayName: "취소", type: Boolean, notnull: true}
        }
      );

      await this._orm.connectAsync(MainDbContext, async db => {
        for (const diff of diffs) {
          // INSERT
          if (!diff.target!.id) {
            const goodId = diff.target!.changeGoodId || diff.target!.goodId;
            const goodName = diff.target!.changeGoodName || diff.target!.goodName;
            const documentCode = await CodeProc.getDocumentCode(db, this._appData.authInfo!.companyId, this._appData.authInfo!.employeeId, goodId, diff.target!.planDate!, "생산", diff.target!.equipmentId, diff.target!.equipmentCode);

            const code = diff.target!.type === "사내" ? diff.target!.equipmentName!.includes("2") ? "RB" : "RC" : "RE";
            const lotInfo = await CodeProc.getLotCode2(db, this._appData.authInfo!.companyId, this._appData.authInfo!.employeeId, 1, goodId!, goodName!, code, undefined, diff.target!.length, diff.target!.productionWeight, diff.target!.specification, diff.target!.thick);
            const codeSeq = Number.parseInt(documentCode!.slice(-2), 10)!;

            // const lotName = await CodeProc.getLotCode(db, this._appData.authInfo!.companyId, this._appData.authInfo!.employeeId, 1, diff.target!.goodId!, documentCode);
            const newRewindProduction = await db.rewindProcess
              .insertAsync({
                companyId: this._appData.authInfo!.companyId,
                code: documentCode,
                type: diff.target!.type,
                codeSeq,
                planDate: diff.target!.planDate!,
                startDate: diff.target!.startDate,
                equipmentId: diff.target!.equipmentId!,
                inputQuantity: diff.target!.inputQuantity,
                inputWeight: diff.target!.inputWeight,
                stockId: diff.target!.productionStockId,
                goodId: diff.target!.goodId!,
                changeGoodId: diff.target!.changeGoodId,
                productionId: diff.target!.productionItemId,
                productionLotId: diff.target!.productLotId,
                rewindLotId: lotInfo.lotId,
                lotSeq: lotInfo.seq,
                cuttingSpecification: diff.target!.cuttingSpecification,
                productionType: diff.target!.productionType,
                goodType: diff.target!.goodType,
                productionQuantity: diff.target!.productionQuantity,
                productionWeight: diff.target!.productionWeight,
                scrapGoodId: diff.target!.scrapGoodId!,
                corona: diff.target!.corona,
                shrink: diff.target!.shrink,
                visualInspectionType: diff.target!.visualInspectionType,
                rating: diff.target!.rating,
                scrapCategoryId: diff.target!.scrapCategoryId,
                scrapType: diff.target!.scrapType,
                lossQuantity: diff.target!.lossQuantity,
                lossWeight: diff.target!.lossWeight,
                lineSpeed: diff.target!.lineSpeed,
                tension: diff.target!.tension,
                firstModifyDate: diff.target!.firstModifyDate,
                lastModifyDate: diff.target!.lastModifyDate,
                createdByEmployeeId: this._appData.authInfo!.employeeId,
                createdAtDateTime: new DateTime(),
                isCanceled: diff.target!.isCanceled
              });
            diff.target!.id = newRewindProduction.id;
            diff.target!.createdByEmployeeName = this._appData.authInfo!.employeeName;
            diff.target!.createdAtDateTime = new DateTime();
            diff.target!.rewindLotId = newRewindProduction.rewindLotId;
            diff.target!.rewindLotName = lotInfo.lotName;

            await db.lotHistory
              .where(item => [
                sorm.equal(item.id, lotInfo!.lotId)
              ])
              .updateAsync(
                () => ({
                  rewindId: diff.target!.id,
                  width: diff.target!.cuttingSpecification ? diff.target!.cuttingSpecification : diff.target!.specification
                })
              );
            await this._getChangeStockInfo(db, diff.target!.rewindLotId!, diff.target!.rating!, 1);

            // 투입된 생산 LOT는 감소하고
            if (diff.target!.productLotId && diff.target!.inputQuantity! > 0) {
              await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, diff.target!.inputQuantity, diff.target!.productLotId, diff.target!.productionWarehouseId, "-", diff.target!.productionRating);
              await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, diff.target!.inputQuantity, "-");
            }

            // 만들어진 리와인더 LOT는 증가해야 한다.
            if (diff.target!.productionQuantity && diff.target!.productionQuantity! > 0) {
              await db.rewindProcess
                .where(item => [
                  sorm.equal(item.id, diff.target!.id)
                ])
                .updateAsync(
                  () => ({
                    firstModifyDate: new DateTime()
                  })
                );

              await db.lotHistory
                .where(item => [
                  sorm.equal(item.id, lotInfo!.lotId)
                ])
                .updateAsync(
                  () => ({
                    length: diff.target!.productionQuantity,
                    weight: diff.target!.productionWeight
                  })
                );
              await StockProc.modifyStock(db, this._appData.authInfo!.companyId, goodId!, diff.target!.productionQuantity, lotInfo.lotId, 1, "+", diff.target!.rating);
              await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, goodId!, diff.target!.productionQuantity, "+");
            }

            // 스크랩이 있는 경우
            if (diff.target!.scrapGoodId) {
              const scrapLotInfo = diff.target!.scrapType === "재생 가능" ? await CodeProc.getLotCode2(db, this._appData.authInfo!.companyId, this._appData.authInfo!.employeeId, 1,
                diff.target!.scrapGoodId!, diff.target!.scrapGoodName!, "L0", undefined, diff.target!.lossWeight) : undefined;

              const newScrap = await db.scrap
                .insertAsync({
                  companyId: this._appData.authInfo!.companyId,
                  occurrenceDate: new DateOnly(),
                  rewindId: diff.target!.id!,
                  scrapGoodId: diff.target!.scrapGoodId!,
                  kind: "재감기",
                  lotId: scrapLotInfo ? scrapLotInfo.lotId : undefined,
                  weight: diff.target!.lossWeight || 0,
                  typeId: diff.target!.scrapCategoryId!,
                  rating: diff.target!.scrapType,
                  isDisabled: false,
                  createdAtDateTime: new DateTime(),
                  createdByEmployeeId: this._appData.authInfo!.employeeId
                });

              if (diff.target!.scrapType === "재생 가능") {
                await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.target!.scrapGoodId!, diff.target!.lossWeight, scrapLotInfo!.lotId, 1, "+", "공통");
              }

              await db.rewindProcess
                .where(item => [
                  sorm.equal(item.id, diff.target!.id)
                ])
                .updateAsync(
                  () => ({
                    scrapId: newScrap.id!
                  })
                );
            }

          }
          // UPDATE
          else {
            if (diff.target!.isCanceled) {
              await db.rewindProcess
                .where(item => [
                  sorm.equal(item.id, diff.target!.id)
                ])
                .updateAsync(
                  () => ({
                    planDate: diff.source!.planDate!,
                    startDate: diff.source!.startDate,
                    equipmentId: diff.source!.equipmentId!,
                    inputWeight: diff.source!.inputWeight,
                    inputQuantity: diff.source!.inputQuantity,
                    stockId: diff.source!.productionStockId,
                    goodId: diff.source!.goodId!,
                    changeGoodId: diff.source!.changeGoodId,
                    productionId: diff.source!.productionItemId,
                    productionLotId: diff.source!.productLotId,
                    cuttingSpecification: diff.source!.cuttingSpecification,
                    productionType: diff.source!.productionType,
                    goodType: diff.source!.goodType,
                    productionQuantity: diff.source!.productionQuantity,
                    productionWeight: diff.source!.productionWeight,
                    corona: diff.source!.corona,
                    shrink: diff.source!.shrink,
                    visualInspectionType: diff.source!.visualInspectionType,
                    rating: diff.source!.rating,
                    scrapCategoryId: diff.source!.scrapCategoryId,
                    scrapType: diff.source!.scrapType,
                    lossQuantity: diff.source!.lossQuantity,
                    lossWeight: diff.source!.lossWeight,
                    lineSpeed: diff.source!.lineSpeed,
                    tension: diff.source!.tension,
                    firstModifyDate: diff.source!.firstModifyDate,
                    lastModifyDate: diff.source!.lastModifyDate,
                    isCanceled: diff.target!.isCanceled
                  })
                );
            }
            else {
              await db.rewindProcess
                .where(item => [
                  sorm.equal(item.id, diff.target!.id)
                ])
                .updateAsync(
                  () => ({
                    planDate: diff.target!.planDate!,
                    startDate: diff.target!.startDate,
                    equipmentId: diff.target!.equipmentId!,
                    stockId: diff.target!.productionStockId,
                    inputWeight: diff.target!.inputWeight,
                    inputQuantity: diff.target!.inputQuantity,
                    goodId: diff.target!.goodId!,
                    changeGoodId: diff.target!.changeGoodId,
                    productionId: diff.target!.productionItemId,
                    productionLotId: diff.target!.productLotId,
                    cuttingSpecification: diff.target!.cuttingSpecification,
                    productionType: diff.target!.productionType,
                    goodType: diff.target!.goodType,
                    productionQuantity: diff.target!.productionQuantity,
                    productionWeight: diff.target!.productionWeight,
                    corona: diff.target!.corona,
                    shrink: diff.target!.shrink,
                    visualInspectionType: diff.target!.visualInspectionType,
                    rating: diff.target!.rating,
                    scrapCategoryId: diff.target!.scrapCategoryId,
                    scrapType: diff.target!.scrapType,
                    lossQuantity: diff.target!.lossQuantity,
                    lossWeight: diff.target!.lossWeight,
                    lineSpeed: diff.target!.lineSpeed,
                    tension: diff.target!.tension,
                    firstModifyDate: diff.target!.firstModifyDate,
                    lastModifyDate: diff.target!.lastModifyDate,
                    isCanceled: diff.target!.isCanceled
                  })
                );

              await db.lotHistory
                .where(item => [
                  sorm.equal(item.id, diff.target!.rewindLotId)
                ])
                .updateAsync(
                  () => ({
                    width: diff.target!.cuttingSpecification ? diff.target!.cuttingSpecification : diff.target!.specification
                  })
                );

              if ((diff.target!.goodId !== diff.source!.goodId) || (diff.target!.changeGoodId !== diff.source!.changeGoodId)) {
                const chargeGoodId = diff.target!.changeGoodId ? diff.target!.changeGoodId : diff.target!.goodId;
                await db.lotHistory
                  .where(item => [
                    sorm.equal(item.id, diff.target!.rewindLotId)
                  ])
                  .updateAsync(
                    () => ({
                      goodId: chargeGoodId
                    })
                  );
              }
              await this._getChangeStockInfo(db, diff.target!.rewindLotId!, diff.target!.rating!, 1);

              // 스크랩이 있는 경우
              // TODO: 가용재고 처리 해줘야함
              if (diff.target!.scrapGoodId) {
                if (!diff.source!.scrapGoodId) {
                  const lotInfo = diff.target!.scrapType === "재생 가능" ? await CodeProc.getLotCode2(db, this._appData.authInfo!.companyId, this._appData.authInfo!.employeeId, 1,
                    diff.target!.scrapGoodId!, diff.target!.scrapGoodName!, "L0", undefined, diff.target!.lossWeight) : undefined;

                  await db.scrap
                    .insertAsync({
                      companyId: this._appData.authInfo!.companyId,
                      occurrenceDate: new DateOnly(),
                      rewindId: diff.target!.id!,
                      scrapGoodId: diff.target!.scrapGoodId!,
                      kind: "재감기",
                      lotId: lotInfo ? lotInfo.lotId : undefined,
                      weight: diff.target!.lossWeight ? diff.target!.lossWeight! : 0,
                      typeId: diff.target!.scrapCategoryId!,
                      rating: diff.target!.scrapType,
                      isDisabled: false,
                      createdAtDateTime: new DateTime(),
                      createdByEmployeeId: this._appData.authInfo!.employeeId
                    });

                  if (diff.target!.scrapType === "재생 가능") {
                    await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.target!.scrapGoodId!, diff.target!.lossWeight, lotInfo!.lotId, 1, "+", "공통");
                  }
                }
                else {
                  if (diff.target!.isCanceled) {
                    await db.scrap.where(item => [sorm.equal(item.id, diff.target!.scrapId)]).deleteAsync();

                    if (diff.source!.scrapType === "재생 가능" && diff.target!.scrapType === "재생 가능") {
                      await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.source!.scrapGoodId!, diff.source!.lossWeight, diff.source!.scrapLotId, 1, "-", "공통");
                    }
                  }
                  else {
                    const lotInfo = diff.source!.scrapType === "보류" && diff.target!.scrapType === "재생 가능" ? await CodeProc.getLotCode2(db, this._appData.authInfo!.companyId, this._appData.authInfo!.employeeId, 1,
                      diff.target!.scrapGoodId!, diff.target!.scrapGoodName!, "L0", undefined, diff.target!.lossWeight) : undefined;

                    await db.scrap
                      .where(item => [
                        sorm.equal(item.id, diff.target!.scrapId)
                      ])
                      .updateAsync(
                        () => ({
                          kind: "재감기",
                          weight: diff.target!.lossWeight ? diff.target!.lossWeight! : 0,
                          typeId: diff.target!.scrapCategoryId,
                          lotId: diff.target!.scrapLotId || lotInfo!.lotId,
                          rating: diff.target!.scrapType,
                          isDisabled: diff.target!.isCanceled
                        })
                      );

                    if (diff.target!.scrapType === "재생 가능") {
                      if (diff.source!.scrapType === "보류") {
                        await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.source!.scrapGoodId!, diff.source!.lossWeight, lotInfo!.lotId, 1, "+", "공통");
                      }
                      else {
                        await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.target!.scrapGoodId!, diff.source!.lossWeight, diff.source!.scrapLotId, 1, "-", "공통");
                        await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.target!.scrapGoodId!, diff.target!.lossWeight, diff.target!.scrapLotId, 1, "+", "공통");
                      }
                    }
                  }
                }

              }
            }

            // 취소에 대한 재고처리 해줘야함 
            const targetDisable = diff.target!.isCanceled;
            const sourceDisable = diff.source!.isCanceled;

            /*     const sourceRewindQuantity = diff.source!.productionQuantity;
                 const sourceProductionQuantity = diff.source!.inputQuantity;
                 const targetRewindQuantity = diff.target!.productionQuantity;
                 const targetProductionQuantity = diff.target!.inputQuantity;*/

            // 취소 o -> 취소 x
            // 투입은 다시하고 (input - / production +)
            if (sourceDisable && !targetDisable) {
              if (diff.source!.productLotId && diff.source!.inputQuantity! > 0) {
                await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.source!.goodId!, diff.source!.inputQuantity, diff.source!.productLotId, diff.source!.productionWarehouseId, "-", diff.source!.productionRating);
                await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.source!.goodId!, diff.source!.inputQuantity, "-");
              }

              // 생산 취소
              if (diff.source!.productionQuantity && diff.source!.productionQuantity! > 0) {
                const goodId = diff.source!.changeGoodId || diff.source!.goodId;
                await StockProc.modifyStock(db, this._appData.authInfo!.companyId, goodId!, diff.source!.productionQuantity, diff.source!.rewindLotId, 1, "+", diff.source!.rating);
                await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, goodId!, diff.source!.productionQuantity, "+");
              }
            }
            // 취소 x -> 취소 o
            // 투입을 취소하고(input + / production -)
            else if (!sourceDisable && targetDisable) {
              // 투입 취소
              if (diff.source!.productLotId && diff.source!.inputQuantity! > 0) {
                await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.source!.goodId!, diff.source!.inputQuantity, diff.source!.productLotId, diff.source!.productionWarehouseId, "+", diff.source!.productionRating);
                await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.source!.goodId!, diff.source!.inputQuantity, "+");
              }

              // 생산 취소
              if (diff.source!.productionQuantity && diff.source!.productionQuantity! > 0) {
                const goodId = diff.source!.changeGoodId || diff.source!.goodId;
                await StockProc.modifyStock(db, this._appData.authInfo!.companyId, goodId!, diff.source!.productionQuantity, diff.source!.rewindLotId, 1, "-", diff.source!.rating);
                await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, goodId!, diff.source!.productionQuantity, "-");
              }
            }
            // 취소 x -> 취소 x
            else if (!sourceDisable && !targetDisable) {
              // 투입된 생산 LOT는 감소하고
              if (diff.target!.productLotId && diff.target!.inputQuantity! > 0) {
                if (diff.source!.productLotId && diff.source!.inputQuantity! > 0) {
                  await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.source!.goodId!, diff.source!.inputQuantity, diff.source!.productLotId, diff.source!.productionWarehouseId, "+", diff.source!.productionRating);
                  await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.source!.goodId!, diff.source!.inputQuantity, "+");
                }
                await StockProc.modifyStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, diff.target!.inputQuantity, diff.target!.productLotId, diff.target!.productionWarehouseId, "-", diff.target!.productionRating);
                await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, diff.target!.goodId!, diff.target!.inputQuantity, "-");
              }

              // 만들어진 리와인더 LOT는 증가해야 한다.
              if (diff.target!.productionQuantity && diff.target!.productionQuantity! > 0) {
                await db.lotHistory
                  .where(item => [
                    sorm.equal(item.id, diff.target!.rewindLotId)
                  ])
                  .updateAsync(
                    () => ({
                      length: diff.target!.productionQuantity,
                      weight: diff.target!.productionWeight
                    })
                  );

                if (diff.source!.productionQuantity && diff.source!.productionQuantity! > 0) {
                  const sourceGoodId = diff.source!.changeGoodId || diff.source!.goodId;
                  await StockProc.modifyStock(db, this._appData.authInfo!.companyId, sourceGoodId!, diff.source!.productionQuantity, diff.source!.rewindLotId, 1, "-", diff.source!.rating);
                  await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, sourceGoodId!, diff.source!.productionQuantity, "+");
                }

                const goodId = diff.target!.changeGoodId || diff.target!.goodId;
                await StockProc.modifyStock(db, this._appData.authInfo!.companyId, goodId!, diff.target!.productionQuantity, diff.target!.rewindLotId, 1, "+", diff.target!.rating);
                await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, goodId!, diff.target!.productionQuantity, "+");
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
          .limit(this.pagination.page * 30, 30)
          .wrap(RewindProcess)
          .include(item => item.goods)
          .include(item => item.productionLot)
          .include(item => item.productStock)
          .include(item => item.rewindLot)
          .include(item => item.createdByEmployee)
          .include(item => item.changeGoods)
          .include(item => item.scrapCategory)
          .include(item => item.equipments)
          .include(item => item.scrapGood)
          .include(item => item.scrap)
          .select(item => ({
            id: item.id,
            weightId: undefined,
            type: item.type,
            planDate: item.planDate,
            equipmentId: item.equipmentId,
            equipmentName: item.equipments!.name,
            equipmentCode: item.equipments!.code,
            startDate: item.startDate,
            productionStockId: item.stockId,
            inputQuantity: item.inputQuantity,
            inputWeight: item.inputWeight,
            productionItemId: item.productionId,
            productionWarehouseId: item.productStock!.warehouseId,
            productionRating: item.productStock!.rating,
            productLotId: item.productionLotId,
            productLotName: item.productionLot!.lot,
            rewindLotId: item.rewindLotId,
            rewindLotName: item.rewindLot!.lot,
            rewindGoodSeq: item.lotSeq,
            goodId: item.goodId,
            goodCategory: item.goods!.category,
            goodName: item.goods!.name,
            specification: item.goods!.specification,
            thick: item.productionLot!.thick,
            length: item.productionLot!.length,
            cuttingSpecification: item.cuttingSpecification,
            changeGoodId: item.changeGoodId,
            changeGoodName: item.changeGoods!.name,
            changeGoodSpecification: item.changeGoods!.specification,
            productionType: item.productionType,
            goodType: item.goodType,
            productionQuantity: item.productionQuantity,
            productionWeight: item.productionWeight,
            corona: item.corona,
            shrink: item.shrink,
            visualInspectionType: item.visualInspectionType,
            rating: item.rating,
            scrapId: item.scrapId,
            scrapLotId: item.scrap!.lotId,
            scrapGoodId: item.scrapGoodId,
            scrapGoodName: item.scrapGood!.name,
            scrapCategoryId: item.scrapCategoryId,
            scrapCategoryName: item.scrapCategory!.name,
            prevScrapType: item.scrapType,
            scrapType: item.scrapType,
            lossQuantity: item.lossQuantity,
            lossWeight: item.lossWeight,
            lineSpeed: item.lineSpeed,
            tension: item.tension,
            firstModifyDate: item.firstModifyDate,
            lastModifyDate: item.lastModifyDate,
            cratedByEmployeeId: item.createdByEmployeeId,
            createdByEmployeeName: item.createdByEmployee!.name,
            createdAtDateTime: item.createdAtDateTime,
            isCanceled: item.isCanceled
          }))
          .resultAsync();

        this.orgItems = Object.clone(this.items);

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

  private _getSearchQueryable(db: MainDbContext): Queryable<RewindProcess> {
    let queryable = db.rewindProcess
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);

    if (this.lastFilter!.fromDate || this.lastFilter!.toDate) {
      queryable = queryable
        .where(item => [
          sorm.between(item.planDate, this.lastFilter!.fromDate, this.lastFilter!.toDate!)
        ]);
    }

    if (this.lastFilter!.productionFromDate || this.lastFilter!.productionToDate) {
      queryable = queryable
        .where(item => [
          sorm.notNull(item.startDate),
          sorm.between(item.startDate!, this.lastFilter!.productionFromDate, this.lastFilter!.productionToDate!)
        ]);
    }

    if (this.lastFilter!.equipmentId) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.equipmentId, this.lastFilter!.equipmentId)
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

    // 취소 제외
    if (!!this.lastFilter!.isCanceled) {
      queryable = queryable.where(item => [
        sorm.equal(item.isCanceled, false)
      ]);
    }

    return queryable;
  }
}

interface IFilterVM {
  fromDate?: DateOnly;
  toDate?: DateOnly;
  productionFromDate?: DateOnly;
  productionToDate?: DateOnly;
  equipmentId?: number;
  goodName?: string;
  inputLot?: string;
  specification?: string;
  isCanceled: boolean;
}

interface IProcessRewindVM {
  id: number | undefined;
  planDate: DateOnly | undefined;
  type: "외주" | "사내";
  equipmentId: number | undefined;
  equipmentName: string | undefined;
  equipmentCode: string | undefined;
  startDate: DateOnly | undefined;
  inputQuantity: number | undefined;
  inputWeight: number | undefined;
  productionStockId: number | undefined;
  productionWarehouseId: number | undefined;
  productionRating: "A" | "B" | "C" | "공통" | undefined;
  productionItemId: number | undefined;
  productLotId: number | undefined;
  productLotName: string | undefined;
  rewindLotId: number | undefined;
  rewindLotName: string | undefined;
  rewindGoodSeq: number | undefined;
  goodId: number | undefined;
  goodCategory: string | undefined;
  goodName: string | undefined;
  specification: string | undefined;
  thick: number | undefined;
  length: number | undefined;
  weightId: number | undefined;
  cuttingSpecification: string | undefined;
  changeGoodId: number | undefined;
  changeGoodName: string | undefined;
  changeGoodSpecification: string | undefined;
  productionType: "내면 코로나 처리" | "외면 코로나 처리" | "커팅" | "중타(커팅)" | "타공" | "검수" | "재감기" | "내면박리" | "외면박리" | undefined;
  goodType: "완제품" | "반제품" | "보류품" | "폐기품(재생)" | "폐기품(폐기)" | "폐기품(매각)" | undefined;
  productionQuantity: number | undefined;
  productionWeight: number | undefined;
  corona: "38" | "40" | "42" | "44" | "46" | undefined;
  shrink: number | undefined;
  visualInspectionType: "OK" | "NG" | "주름" | "라인줄" | "알갱이" | "접힘" | "펑크" | undefined;
  rating: "A" | "B" | "C" | "공통" | undefined;
  scrapId: number | undefined;
  scrapLotId: number | undefined;
  scrapGoodId: number | undefined;
  scrapGoodName: string | undefined;
  scrapCategoryId: number | undefined;
  scrapCategoryName: string | undefined;
  prevScrapType: "재생 가능" | "재생 불가" | "보류" | undefined;
  scrapType: "재생 가능" | "재생 불가" | "보류" | undefined;
  lossQuantity: number | undefined;
  lossWeight: number | undefined;
  lineSpeed: number | undefined;
  tension: number | undefined;
  firstModifyDate: DateTime | undefined;
  lastModifyDate: DateTime | undefined;
  cratedByEmployeeId: number | undefined;
  createdByEmployeeName: string | undefined;
  createdAtDateTime: DateTime | undefined;
  isCanceled: boolean;
}